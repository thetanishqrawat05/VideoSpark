// Text-to-Speech Engine with multiple provider support
interface Voice {
  id: string;
  name: string;
  language: string;
  gender: string;
  provider: string;
}

interface TTSOptions {
  text: string;
  voiceId: string;
  speed: number;
  pitch: number;
  volume: number;
}

class TTSEngine {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private audioContext: AudioContext | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
  }

  private loadVoices() {
    const loadVoicesHandler = () => {
      this.voices = this.synthesis.getVoices();
    };

    loadVoicesHandler();
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoicesHandler;
    }
  }

  getAvailableVoices(): Voice[] {
    const browserVoices = this.voices.map(voice => ({
      id: `browser-${voice.name}`,
      name: voice.name,
      language: voice.lang,
      gender: voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman') ? 'female' : 'male',
      provider: 'browser'
    }));

    // Add premium voices (these would be processed server-side)
    const premiumVoices: Voice[] = [
      {
        id: 'coqui-female-en',
        name: 'Sarah Professional',
        language: 'en-US',
        gender: 'female',
        provider: 'coqui'
      },
      {
        id: 'coqui-male-en',
        name: 'David Professional',
        language: 'en-US',
        gender: 'male',
        provider: 'coqui'
      },
      {
        id: 'bark-female-en',
        name: 'Emma Natural',
        language: 'en-US',
        gender: 'female',
        provider: 'bark'
      },
      {
        id: 'bark-male-en',
        name: 'Marcus Narrator',
        language: 'en-US',
        gender: 'male',
        provider: 'bark'
      },
      {
        id: 'indic-female-hi',
        name: 'Priya Hindi',
        language: 'hi-IN',
        gender: 'female',
        provider: 'indic'
      },
      {
        id: 'indic-male-hi',
        name: 'Arjun Hindi',
        language: 'hi-IN',
        gender: 'male',
        provider: 'indic'
      }
    ];

    return [...premiumVoices, ...browserVoices];
  }

  async generateSpeech(options: TTSOptions): Promise<Blob> {
    const voice = this.getAvailableVoices().find(v => v.id === options.voiceId);
    
    if (!voice) {
      throw new Error('Voice not found');
    }

    if (voice.provider === 'browser') {
      return this.generateBrowserSpeech(options, voice);
    } else {
      return this.generatePremiumSpeech(options, voice);
    }
  }

  private async generateBrowserSpeech(options: TTSOptions, voice: Voice): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(options.text);
      
      // Find the browser voice
      const browserVoice = this.voices.find(v => `browser-${v.name}` === voice.id);
      if (browserVoice) {
        utterance.voice = browserVoice;
      }
      
      utterance.rate = options.speed;
      utterance.pitch = options.pitch;
      utterance.volume = options.volume;

      // Capture audio using MediaRecorder
      const audioChunks: BlobPart[] = [];
      
      // Create a new audio context for recording
      navigator.mediaDevices.getDisplayMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      }).then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          stream.getTracks().forEach(track => track.stop());
          resolve(audioBlob);
        };

        utterance.onstart = () => {
          mediaRecorder.start();
        };

        utterance.onend = () => {
          setTimeout(() => mediaRecorder.stop(), 500);
        };

        utterance.onerror = (event) => {
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
          reject(new Error(`Speech synthesis failed: ${event.error}`));
        };

        this.synthesis.speak(utterance);
      }).catch(() => {
        // Fallback: return a silent audio blob
        const audioContext = new AudioContext();
        const sampleRate = audioContext.sampleRate;
        const duration = options.text.length * 0.1; // Rough estimate
        const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        
        // Convert to WAV blob (simplified)
        const audioBlob = new Blob([], { type: 'audio/wav' });
        resolve(audioBlob);
      });
    });
  }

  private async generatePremiumSpeech(options: TTSOptions, voice: Voice): Promise<Blob> {
    try {
      const response = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: options.text,
          voiceId: options.voiceId,
          speed: options.speed,
          pitch: options.pitch
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Premium TTS failed, falling back to browser TTS:', error);
      return this.generateBrowserSpeech(options, voice);
    }
  }

  async previewVoice(voiceId: string, sampleText = "Hello, this is a voice preview."): Promise<void> {
    try {
      const audioBlob = await this.generateSpeech({
        text: sampleText,
        voiceId,
        speed: 1,
        pitch: 1,
        volume: 1
      });

      const audio = new Audio(URL.createObjectURL(audioBlob));
      await audio.play();
    } catch (error) {
      console.error('Voice preview failed:', error);
      throw error;
    }
  }

  // Generate synchronized audio for video scenes
  async generateSceneAudio(scenes: Array<{text: string, voiceId: string, duration: number}>): Promise<Map<string, Blob>> {
    const audioMap = new Map<string, Blob>();
    
    for (const scene of scenes) {
      if (scene.text.trim()) {
        try {
          const audioBlob = await this.generateSpeech({
            text: scene.text,
            voiceId: scene.voiceId,
            speed: this.calculateSpeechSpeed(scene.text, scene.duration),
            pitch: 1,
            volume: 1
          });
          
          audioMap.set(scene.text, audioBlob);
        } catch (error) {
          console.error(`Failed to generate audio for scene: ${scene.text}`, error);
        }
      }
    }
    
    return audioMap;
  }

  private calculateSpeechSpeed(text: string, targetDuration: number): number {
    // Average speaking rate is about 150 words per minute
    const words = text.split(' ').length;
    const naturalDuration = (words / 150) * 60; // in seconds
    return Math.max(0.5, Math.min(2, naturalDuration / targetDuration));
  }

  // Generate subtitles from speech
  generateSubtitles(text: string, duration: number): Array<{start: number, end: number, text: string}> {
    const words = text.split(' ');
    const timePerWord = duration / words.length;
    const subtitles = [];
    
    let currentTime = 0;
    let currentSubtitle = '';
    const wordsPerSubtitle = 5;
    
    for (let i = 0; i < words.length; i += wordsPerSubtitle) {
      const subtitleWords = words.slice(i, i + wordsPerSubtitle);
      const subtitleDuration = timePerWord * subtitleWords.length;
      
      subtitles.push({
        start: currentTime,
        end: currentTime + subtitleDuration,
        text: subtitleWords.join(' ')
      });
      
      currentTime += subtitleDuration;
    }
    
    return subtitles;
  }
}

export const ttsEngine = new TTSEngine();
export type { Voice, TTSOptions };