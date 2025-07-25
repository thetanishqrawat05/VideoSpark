import { spawn } from 'child_process';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';

interface TTSRequest {
  text: string;
  voiceId: string;
  speed: number;
  pitch: number;
}

interface Voice {
  id: string;
  name: string;
  description: string;
  provider: string;
  gender: string;
  style: string;
  language: string;
  premium: boolean;
}

class TTSService {
  private uploadsDir = 'uploads';

  // Premium voices that use local TTS engines
  private voices: Voice[] = [
    // English Premium Voices (Coqui TTS)
    {
      id: 'coqui-female-en',
      name: 'Sarah Professional',
      description: 'High-quality female voice with natural intonation and professional tone',
      provider: 'coqui',
      gender: 'female',
      style: 'professional',
      language: 'en-US',
      premium: true
    },
    {
      id: 'coqui-male-en',
      name: 'David Professional',
      description: 'Deep male voice with clear articulation and authoritative presence',
      provider: 'coqui',
      gender: 'male',
      style: 'professional',
      language: 'en-US',
      premium: true
    },
    {
      id: 'bark-female-en',
      name: 'Emma Natural',
      description: 'Expressive female voice with emotional range and natural flow',
      provider: 'bark',
      gender: 'female',
      style: 'natural',
      language: 'en-US',
      premium: true
    },
    {
      id: 'bark-male-en',
      name: 'Marcus Narrator',
      description: 'Professional male narrator voice perfect for storytelling',
      provider: 'bark',
      gender: 'male',
      style: 'narrator',
      language: 'en-US',
      premium: true
    },
    
    // Hindi Premium Voices (Indic TTS)
    {
      id: 'indic-female-hi',
      name: 'Priya Hindi',
      description: 'Natural female Hindi voice with proper pronunciation and clear diction',
      provider: 'indic',
      gender: 'female',
      style: 'natural',
      language: 'hi-IN',
      premium: true
    },
    {
      id: 'indic-male-hi',
      name: 'Arjun Hindi',
      description: 'Clear male Hindi voice with authentic accent and professional tone',
      provider: 'indic',
      gender: 'male',
      style: 'professional',
      language: 'hi-IN',
      premium: true
    },
    {
      id: 'indic-female-pro-hi',
      name: 'Kavya Professional',
      description: 'Professional female Hindi voice for business and educational content',
      provider: 'indic',
      gender: 'female',
      style: 'professional',
      language: 'hi-IN',
      premium: true
    },
    {
      id: 'indic-male-narrator-hi',
      name: 'Vikram Narrator',
      description: 'Authoritative male Hindi voice for narration and storytelling',
      provider: 'indic',
      gender: 'male',
      style: 'narrator',
      language: 'hi-IN',
      premium: true
    },

    // Free Fallback Voices (eSpeak/Festival)
    {
      id: 'espeak-en-us',
      name: 'English (US) - Basic',
      description: 'Basic English voice using eSpeak engine',
      provider: 'espeak',
      gender: 'neutral',
      style: 'basic',
      language: 'en-US',
      premium: false
    },
    {
      id: 'espeak-en-gb',
      name: 'English (UK) - Basic',
      description: 'Basic British English voice using eSpeak engine',
      provider: 'espeak',
      gender: 'neutral',
      style: 'basic',
      language: 'en-GB',
      premium: false
    },
    {
      id: 'espeak-hi',
      name: 'Hindi - Basic',
      description: 'Basic Hindi voice using eSpeak engine',
      provider: 'espeak',
      gender: 'neutral',
      style: 'basic',
      language: 'hi-IN',
      premium: false
    }
  ];

  getVoices(provider?: string): Voice[] {
    if (provider) {
      return this.voices.filter(voice => voice.provider === provider);
    }
    return this.voices;
  }

  async generateSpeech(request: TTSRequest): Promise<string> {
    const voice = this.voices.find(v => v.id === request.voiceId);
    if (!voice) {
      throw new Error(`Voice ${request.voiceId} not found`);
    }

    const outputFile = join(this.uploadsDir, `speech_${nanoid()}.wav`);

    try {
      switch (voice.provider) {
        case 'coqui':
          await this.generateCoquiSpeech(request, voice, outputFile);
          break;
        case 'bark':
          await this.generateBarkSpeech(request, voice, outputFile);
          break;
        case 'indic':
          await this.generateIndicSpeech(request, voice, outputFile);
          break;
        case 'espeak':
        default:
          await this.generateEspeakSpeech(request, voice, outputFile);
          break;
      }

      // Apply audio processing for better quality
      await this.processAudio(outputFile, request.speed, request.pitch);
      
      return outputFile;
    } catch (error) {
      console.error(`TTS generation failed for ${voice.provider}:`, error);
      // Fallback to eSpeak if premium TTS fails
      if (voice.provider !== 'espeak') {
        const fallbackVoice = this.voices.find(v => v.provider === 'espeak' && v.language.startsWith(voice.language.split('-')[0]));
        if (fallbackVoice) {
          await this.generateEspeakSpeech({ ...request, voiceId: fallbackVoice.id }, fallbackVoice, outputFile);
          await this.processAudio(outputFile, request.speed, request.pitch);
          return outputFile;
        }
      }
      throw error;
    }
  }

  private async generateCoquiSpeech(request: TTSRequest, voice: Voice, outputFile: string): Promise<void> {
    // Create a temporary text file
    const textFile = join(this.uploadsDir, `temp_text_${nanoid()}.txt`);
    await writeFile(textFile, request.text);

    try {
      // Use Coqui TTS with VITS model for high quality
      const modelName = voice.gender === 'female' ? 'tts_models/en/ljspeech/vits' : 'tts_models/en/ljspeech/vits';
      
      await this.runCommand('tts', [
        '--text', request.text,
        '--model_name', modelName,
        '--out_path', outputFile
      ]);
    } finally {
      // Clean up temp file
      try {
        await readFile(textFile);
      } catch {
        // File might not exist, ignore
      }
    }
  }

  private async generateBarkSpeech(request: TTSRequest, voice: Voice, outputFile: string): Promise<void> {
    // Bark AI generates more natural speech
    const speakerPreset = voice.gender === 'female' ? 'v2/en_speaker_6' : 'v2/en_speaker_3';
    
    await this.runCommand('python3', [
      '-c',
      `
import torch
from bark import SAMPLE_RATE, generate_audio, preload_models
from scipy.io.wavfile import write
import sys

preload_models()
text_prompt = "${request.text.replace(/"/g, '\\"')}"
audio_array = generate_audio(text_prompt, history_prompt="${speakerPreset}")
write("${outputFile}", SAMPLE_RATE, audio_array)
`
    ]);
  }

  private async generateIndicSpeech(request: TTSRequest, voice: Voice, outputFile: string): Promise<void> {
    // Use Indic TTS for Hindi voices
    const gender = voice.gender === 'female' ? 'female' : 'male';
    
    await this.runCommand('python3', [
      '-c',
      `
from indic_tts import IndicTTS
import scipy.io.wavfile as wavfile

tts = IndicTTS(voice="${gender}")
audio, sr = tts.tts("${request.text.replace(/"/g, '\\"')}", lang="hi")
wavfile.write("${outputFile}", sr, audio)
`
    ]);
  }

  private async generateEspeakSpeech(request: TTSRequest, voice: Voice, outputFile: string): Promise<void> {
    const lang = voice.language.split('-')[0]; // Extract language code
    const speed = Math.round(request.speed * 175); // Convert to eSpeak speed (words per minute)
    const pitch = Math.round(request.pitch * 50 + 50); // Convert to eSpeak pitch (0-100)

    await this.runCommand('espeak', [
      '-v', lang,
      '-s', speed.toString(),
      '-p', pitch.toString(),
      '-w', outputFile,
      request.text
    ]);
  }

  private async processAudio(audioFile: string, speed: number, pitch: number): Promise<void> {
    const tempOutput = audioFile.replace('.wav', '_processed.wav');
    
    try {
      // Use FFmpeg to enhance audio quality and apply effects
      const filterComplex = [
        // Apply speed change if needed
        speed !== 1 ? `atempo=${Math.max(0.5, Math.min(2.0, speed))}` : null,
        // Apply pitch shift if needed  
        pitch !== 0 ? `asetrate=44100*${Math.pow(2, pitch/12)},aresample=44100` : null,
        // Audio enhancement filters
        'highpass=f=80', // Remove low-frequency noise
        'lowpass=f=8000', // Remove high-frequency artifacts
        'compand=0.01,0.05:-60/-60|-30/-15|-20/-10|-5/-5|20/0', // Dynamic range compression
        'volume=0.8' // Normalize volume
      ].filter(Boolean).join(',');

      await this.runCommand('ffmpeg', [
        '-i', audioFile,
        '-af', filterComplex,
        '-ar', '44100',
        '-ac', '1',
        '-y',
        tempOutput
      ]);

      // Replace original with processed version
      await this.runCommand('mv', [tempOutput, audioFile]);
    } catch (error) {
      console.error('Audio processing failed:', error);
      // If processing fails, keep the original
    }
  }

  private async runCommand(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);
      let stderr = '';

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command ${command} failed with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to start ${command}: ${error.message}`));
      });
    });
  }
}

export const ttsService = new TTSService();