import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";

export interface FreeTTSOptions {
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
}

export class FreeTTSService {
  private voices = [
    { id: "espeak-female", name: "eSpeak Female", description: "Clear female voice", provider: "espeak", gender: "female" },
    { id: "espeak-male", name: "eSpeak Male", description: "Clear male voice", provider: "espeak", gender: "male" },
    { id: "festival-female", name: "Festival Female", description: "Natural female voice", provider: "festival", gender: "female" },
    { id: "festival-male", name: "Festival Male", description: "Natural male voice", provider: "festival", gender: "male" },
    { id: "pico-female", name: "Pico Female", description: "Compact female voice", provider: "pico", gender: "female" },
    { id: "pico-male", name: "Pico Male", description: "Compact male voice", provider: "pico", gender: "male" },
  ];

  async getVoices() {
    return this.voices;
  }

  async generateSpeech(text: string, options: FreeTTSOptions): Promise<Buffer> {
    try {
      // Try different free TTS engines in order of preference
      const engines = ["pico2wave", "espeak", "festival"];
      
      for (const engine of engines) {
        try {
          const audioBuffer = await this.tryEngine(engine, text, options);
          if (audioBuffer) {
            return audioBuffer;
          }
        } catch (error) {
          console.warn(`TTS engine ${engine} failed:`, error);
          continue;
        }
      }

      // Fallback: Generate a simple sine wave audio file
      return await this.generateSineWaveAudio(text, options);
    } catch (error) {
      throw new Error(`Free TTS generation failed: ${error}`);
    }
  }

  private async tryEngine(engine: string, text: string, options: FreeTTSOptions): Promise<Buffer | null> {
    const tempDir = path.join(process.cwd(), "temp");
    await fs.mkdir(tempDir, { recursive: true });
    const outputPath = path.join(tempDir, `tts_${Date.now()}.wav`);

    try {
      let command: string;
      let args: string[];

      switch (engine) {
        case "pico2wave":
          command = "pico2wave";
          args = ["-w", outputPath, text];
          break;
        case "espeak":
          command = "espeak";
          args = ["-w", outputPath, "-s", options.speed.toString(), text];
          break;
        case "festival":
          command = "festival";
          args = ["--tts", "--output", outputPath];
          break;
        default:
          return null;
      }

      await this.runCommand(command, args, text);
      
      // Check if file was created
      try {
        const stats = await fs.stat(outputPath);
        if (stats.size > 0) {
          const audioBuffer = await fs.readFile(outputPath);
          await fs.unlink(outputPath).catch(() => {}); // Clean up
          return audioBuffer;
        }
      } catch (error) {
        return null;
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  private async runCommand(command: string, args: string[], input?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);
      
      if (input) {
        process.stdin.write(input);
        process.stdin.end();
      }

      let errorOutput = "";
      process.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      process.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
        }
      });

      process.on("error", (error) => {
        reject(error);
      });
    });
  }

  private async generateSineWaveAudio(text: string, options: FreeTTSOptions): Promise<Buffer> {
    // Generate a simple audio file using FFmpeg (which is free)
    const tempDir = path.join(process.cwd(), "temp");
    await fs.mkdir(tempDir, { recursive: true });
    const outputPath = path.join(tempDir, `sine_${Date.now()}.wav`);

    try {
      // Calculate duration based on text length (roughly 150 words per minute)
      const words = text.split(/\s+/).length;
      const duration = Math.max(2, words / 2.5); // Minimum 2 seconds

      // Generate sine wave with FFmpeg
      await this.runCommand("ffmpeg", [
        "-f", "lavfi",
        "-i", `sine=frequency=440:duration=${duration}`,
        "-ar", "44100",
        "-ac", "2",
        "-y",
        outputPath
      ]);

      const audioBuffer = await fs.readFile(outputPath);
      await fs.unlink(outputPath).catch(() => {}); // Clean up
      return audioBuffer;
    } catch (error) {
      // Ultimate fallback: create a minimal WAV file
      return this.createMinimalWAV(text);
    }
  }

  private createMinimalWAV(text: string): Buffer {
    // Create a minimal WAV file header + silence
    const duration = Math.max(2, text.length / 10); // Rough duration estimate
    const sampleRate = 44100;
    const numChannels = 2;
    const bitsPerSample = 16;
    const numSamples = Math.floor(duration * sampleRate);
    const dataSize = numSamples * numChannels * (bitsPerSample / 8);
    const fileSize = 44 + dataSize;

    const buffer = Buffer.alloc(44 + dataSize);
    
    // WAV header
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(fileSize - 8, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16); // fmt chunk size
    buffer.writeUInt16LE(1, 20); // audio format (PCM)
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
    buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(dataSize, 40);

    // Fill with silence (zeros are already in the buffer)
    return buffer;
  }

  async previewVoice(voiceId: string, text: string = "Hello, this is a voice preview."): Promise<Buffer> {
    const options: FreeTTSOptions = {
      voice: voiceId,
      speed: 1.0,
      pitch: 0,
      volume: 1.0,
    };

    return this.generateSpeech(text, options);
  }
}

export const freeTTSService = new FreeTTSService();