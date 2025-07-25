export interface AvatarGenerationSettings {
  lipSyncQuality: "fast" | "medium" | "high";
  eyeContact: boolean;
  backgroundStyle?: string;
  cameraAngle?: string;
}

export interface AvatarGenerationResult {
  videoBuffer: Buffer;
  duration: number;
  thumbnailBuffer?: Buffer;
}

export class AvatarService {
  private dIdApiKey: string;
  private syntHesiaApiKey: string;

  constructor() {
    this.dIdApiKey = process.env.DID_API_KEY || process.env.DID_API_KEY_ENV_VAR || "default_key";
    this.syntHesiaApiKey = process.env.SYNTHESIA_API_KEY || process.env.SYNTHESIA_API_KEY_ENV_VAR || "default_key";
  }

  async generateAvatarVideo(
    avatarId: string,
    audioBuffer: Buffer,
    settings: AvatarGenerationSettings
  ): Promise<Buffer> {
    try {
      // Try D-ID first, fallback to other providers
      return await this.generateWithDID(avatarId, audioBuffer, settings);
    } catch (error) {
      console.error("D-ID generation failed, trying alternative:", error);
      // Could fallback to Synthesia or other providers here
      throw new Error(`Avatar generation failed: ${error}`);
    }
  }

  private async generateWithDID(
    avatarId: string,
    audioBuffer: Buffer,
    settings: AvatarGenerationSettings
  ): Promise<Buffer> {
    const baseUrl = "https://api.d-id.com";

    try {
      // Step 1: Upload audio
      const audioUploadResponse = await fetch(`${baseUrl}/audios`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${this.dIdApiKey}`,
          "Content-Type": "audio/mpeg",
        },
        body: audioBuffer,
      });

      if (!audioUploadResponse.ok) {
        throw new Error(`Audio upload failed: ${audioUploadResponse.statusText}`);
      }

      const audioData = await audioUploadResponse.json();
      const audioUrl = audioData.url;

      // Step 2: Create talking video
      const talkResponse = await fetch(`${baseUrl}/talks`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${this.dIdApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_url: this.getAvatarImageUrl(avatarId),
          script: {
            type: "audio",
            audio_url: audioUrl,
          },
          config: {
            fluent: settings.lipSyncQuality === "high",
            pad_audio: 0.0,
            stitch: true,
            result_format: "mp4",
          },
        }),
      });

      if (!talkResponse.ok) {
        throw new Error(`Talk creation failed: ${talkResponse.statusText}`);
      }

      const talkData = await talkResponse.json();
      const talkId = talkData.id;

      // Step 3: Poll for completion
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes timeout

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

        const statusResponse = await fetch(`${baseUrl}/talks/${talkId}`, {
          headers: {
            "Authorization": `Basic ${this.dIdApiKey}`,
          },
        });

        if (!statusResponse.ok) {
          throw new Error(`Status check failed: ${statusResponse.statusText}`);
        }

        const statusData = await statusResponse.json();

        if (statusData.status === "done") {
          // Download the result
          const videoResponse = await fetch(statusData.result_url);
          const videoBuffer = await videoResponse.arrayBuffer();
          return Buffer.from(videoBuffer);
        } else if (statusData.status === "error") {
          throw new Error(`Video generation failed: ${statusData.error}`);
        }

        attempts++;
      }

      throw new Error("Video generation timed out");

    } catch (error) {
      throw new Error(`D-ID avatar generation failed: ${error}`);
    }
  }

  private async generateWithSynthesia(
    avatarId: string,
    script: string,
    settings: AvatarGenerationSettings
  ): Promise<Buffer> {
    // Synthesia integration would go here
    // Note: Synthesia API is in beta and requires special access
    throw new Error("Synthesia integration not yet available");
  }

  private getAvatarImageUrl(avatarId: string): string {
    // Map avatar IDs to actual image URLs
    // In a real implementation, this would come from your avatar database
    const avatarMap: Record<string, string> = {
      "sarah-pro": "https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=512&h=512&fit=crop&crop=face",
      "alex-casual": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=512&fit=crop&crop=face",
      "dr-lisa": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=512&h=512&fit=crop&crop=face",
      "mike-creative": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=512&h=512&fit=crop&crop=face",
    };

    return avatarMap[avatarId] || avatarMap["sarah-pro"];
  }

  async getAvailableAvatars(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    style: string;
    gender: string;
  }>> {
    // Return predefined avatars
    return [
      {
        id: "sarah-pro",
        name: "Sarah Pro",
        description: "Professional businesswoman avatar",
        imageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=512&h=512&fit=crop&crop=face",
        style: "Business",
        gender: "female",
      },
      {
        id: "alex-casual",
        name: "Alex Casual",
        description: "Young professional male avatar",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=512&fit=crop&crop=face",
        style: "Friendly",
        gender: "male",
      },
      {
        id: "dr-lisa",
        name: "Dr. Lisa",
        description: "Mature professional woman with glasses",
        imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=512&h=512&fit=crop&crop=face",
        style: "Expert",
        gender: "female",
      },
      {
        id: "mike-creative",
        name: "Mike Creative",
        description: "Creative young man with stylish look",
        imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=512&h=512&fit=crop&crop=face",
        style: "Modern",
        gender: "male",
      },
    ];
  }

  async previewAvatar(avatarId: string, sampleText: string = "Hello, I'm your AI avatar!"): Promise<Buffer> {
    // Generate a quick preview with sample text
    const sampleAudio = Buffer.from("sample_audio_data"); // Would use TTS service
    return await this.generateAvatarVideo(avatarId, sampleAudio, {
      lipSyncQuality: "fast",
      eyeContact: true,
    });
  }
}

export const avatarService = new AvatarService();
