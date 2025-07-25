interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  description?: string;
  category: string;
  labels: Record<string, string>;
  preview_url?: string;
}

interface ElevenLabsSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = "https://api.elevenlabs.io/v1";

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY_ENV_VAR || "default_key";
  }

  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          "xi-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      throw new Error(`Failed to fetch voices: ${error}`);
    }
  }

  async generateSpeech(
    text: string,
    voiceId: string,
    settings: ElevenLabsSettings = { stability: 0.5, similarity_boost: 0.5 }
  ): Promise<Buffer> {
    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: settings,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      return Buffer.from(audioBuffer);
    } catch (error) {
      throw new Error(`Failed to generate speech: ${error}`);
    }
  }

  async cloneVoice(name: string, audioFiles: Buffer[], description?: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (description) {
        formData.append("description", description);
      }

      audioFiles.forEach((buffer, index) => {
        const blob = new Blob([buffer], { type: "audio/mpeg" });
        formData.append("files", blob, `sample_${index}.mp3`);
      });

      const response = await fetch(`${this.baseUrl}/voices/add`, {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data.voice_id;
    } catch (error) {
      throw new Error(`Failed to clone voice: ${error}`);
    }
  }

  async getVoicePreview(voiceId: string): Promise<Buffer> {
    try {
      const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
        headers: {
          "xi-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const voiceData = await response.json();
      
      if (voiceData.preview_url) {
        const previewResponse = await fetch(voiceData.preview_url);
        const audioBuffer = await previewResponse.arrayBuffer();
        return Buffer.from(audioBuffer);
      }

      // If no preview URL, generate a quick sample
      return await this.generateSpeech("Hello, this is a voice preview.", voiceId);
    } catch (error) {
      throw new Error(`Failed to get voice preview: ${error}`);
    }
  }

  async getUserInfo(): Promise<{ character_count: number; character_limit: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          "xi-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        character_count: data.subscription?.character_count || 0,
        character_limit: data.subscription?.character_limit || 0,
      };
    } catch (error) {
      throw new Error(`Failed to get user info: ${error}`);
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
