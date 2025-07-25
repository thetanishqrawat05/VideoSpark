import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface VideoGenerationPrompt {
  text: string;
  style: string;
  duration: number;
  resolution: string;
  aspectRatio: string;
  negativePrompt?: string;
}

export interface EnhancedPrompt {
  enhancedText: string;
  visualElements: string[];
  cameraMovements: string[];
  lighting: string;
  mood: string;
}

export class OpenAIService {
  async enhanceVideoPrompt(prompt: VideoGenerationPrompt): Promise<EnhancedPrompt> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert video generation prompt engineer. Enhance the user's video prompt to create cinematic, high-quality AI-generated videos. Consider visual elements, camera movements, lighting, and mood. Respond with JSON in this format: {
              "enhancedText": "detailed enhanced prompt",
              "visualElements": ["element1", "element2"],
              "cameraMovements": ["movement1", "movement2"],
              "lighting": "lighting description",
              "mood": "mood description"
            }`
          },
          {
            role: "user",
            content: `Enhance this video prompt for ${prompt.style} style, ${prompt.duration}s duration, ${prompt.resolution} resolution: "${prompt.text}"`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return result as EnhancedPrompt;
    } catch (error) {
      throw new Error(`Failed to enhance video prompt: ${error}`);
    }
  }

  async generateTextToSpeech(text: string, voice: string = "alloy", instructions?: string): Promise<Buffer> {
    try {
      const response = await openai.audio.speech.create({
        model: "tts-1-hd",
        voice: voice as any,
        input: text,
        response_format: "mp3",
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    } catch (error) {
      throw new Error(`Failed to generate speech: ${error}`);
    }
  }

  async generateVoiceWithInstructions(text: string, voice: string, instructions: string): Promise<Buffer> {
    try {
      // Using newer gpt-4o-mini-tts model if available, otherwise fallback to tts-1-hd
      const response = await openai.audio.speech.create({
        model: "tts-1-hd", // Will be upgraded to gpt-4o-mini-tts when available
        voice: voice as any,
        input: `${instructions}: ${text}`,
        response_format: "mp3",
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    } catch (error) {
      throw new Error(`Failed to generate speech with instructions: ${error}`);
    }
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<{ text: string; duration: number }> {
    try {
      // Create a temporary file from buffer for transcription
      const tempFile = Buffer.from(audioBuffer);
      
      const transcription = await openai.audio.transcriptions.create({
        file: tempFile as any,
        model: "whisper-1",
      });

      return {
        text: transcription.text,
        duration: 0, // Whisper doesn't return duration, would need to calculate
      };
    } catch (error) {
      throw new Error(`Failed to transcribe audio: ${error}`);
    }
  }

  async generateImage(prompt: string): Promise<{ url: string }> {
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      return { url: response.data?.[0]?.url || "" };
    } catch (error) {
      throw new Error(`Failed to generate image: ${error}`);
    }
  }

  async analyzeVideoContent(prompt: string): Promise<{
    soundEffects: string[];
    backgroundMusicStyle: string;
    mood: string;
    visualElements: string[];
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Analyze this video prompt and suggest appropriate sound effects, background music style, mood, and key visual elements. Respond with JSON: {
              "soundEffects": ["effect1", "effect2"],
              "backgroundMusicStyle": "style description",
              "mood": "mood description",
              "visualElements": ["element1", "element2"]
            }`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return result;
    } catch (error) {
      throw new Error(`Failed to analyze video content: ${error}`);
    }
  }
}

export const openaiService = new OpenAIService();
