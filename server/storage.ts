import { 
  type User, 
  type InsertUser, 
  type VideoProject, 
  type InsertVideoProject,
  type VoiceModel,
  type InsertVoiceModel,
  type AvatarModel,
  type InsertAvatarModel,
  type BackgroundMusic,
  type InsertBackgroundMusic,
  type SoundEffect,
  type InsertSoundEffect
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredits(id: string, credits: number): Promise<User | undefined>;

  // Video project operations
  getVideoProject(id: string): Promise<VideoProject | undefined>;
  getVideoProjectsByUser(userId: string): Promise<VideoProject[]>;
  createVideoProject(project: InsertVideoProject): Promise<VideoProject>;
  updateVideoProject(id: string, updates: Partial<VideoProject>): Promise<VideoProject | undefined>;
  deleteVideoProject(id: string): Promise<boolean>;

  // Voice model operations
  getVoiceModels(): Promise<VoiceModel[]>;
  getVoiceModelsByProvider(provider: string): Promise<VoiceModel[]>;
  createVoiceModel(voice: InsertVoiceModel): Promise<VoiceModel>;

  // Avatar model operations
  getAvatarModels(): Promise<AvatarModel[]>;
  getAvatarModel(id: string): Promise<AvatarModel | undefined>;
  createAvatarModel(avatar: InsertAvatarModel): Promise<AvatarModel>;

  // Background music operations
  getBackgroundMusic(): Promise<BackgroundMusic[]>;
  getBackgroundMusicByGenre(genre: string): Promise<BackgroundMusic[]>;
  createBackgroundMusic(music: InsertBackgroundMusic): Promise<BackgroundMusic>;

  // Sound effects operations
  getSoundEffects(): Promise<SoundEffect[]>;
  getSoundEffectsByCategory(category: string): Promise<SoundEffect[]>;
  createSoundEffect(effect: InsertSoundEffect): Promise<SoundEffect>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private videoProjects: Map<string, VideoProject>;
  private voiceModels: Map<string, VoiceModel>;
  private avatarModels: Map<string, AvatarModel>;
  private backgroundMusic: Map<string, BackgroundMusic>;
  private soundEffects: Map<string, SoundEffect>;

  constructor() {
    this.users = new Map();
    this.videoProjects = new Map();
    this.voiceModels = new Map();
    this.avatarModels = new Map();
    this.backgroundMusic = new Map();
    this.soundEffects = new Map();

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample voice models
    const sampleVoices: VoiceModel[] = [
      {
        id: "sarah-professional",
        provider: "elevenlabs",
        name: "Sarah - Professional",
        description: "Female conversational voice",
        gender: "female",
        style: "professional",
        language: "en",
        previewUrl: null,
        isActive: true,
      },
      {
        id: "marcus-narrator",
        provider: "elevenlabs",
        name: "Marcus - Narrator",
        description: "Male documentary voice",
        gender: "male",
        style: "documentary",
        language: "en",
        previewUrl: null,
        isActive: true,
      },
      {
        id: "emma-casual",
        provider: "elevenlabs",
        name: "Emma - Casual",
        description: "Female friendly voice",
        gender: "female",
        style: "friendly",
        language: "en",
        previewUrl: null,
        isActive: true,
      },
    ];

    sampleVoices.forEach(voice => this.voiceModels.set(voice.id, voice));

    // Sample avatar models
    const sampleAvatars: AvatarModel[] = [
      {
        id: "sarah-pro",
        name: "Sarah Pro",
        description: "Professional businesswoman avatar",
        imageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=512&h=512&fit=crop&crop=face",
        style: "Business",
        gender: "female",
        isActive: true,
      },
      {
        id: "alex-casual",
        name: "Alex Casual",
        description: "Young professional male avatar",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=512&fit=crop&crop=face",
        style: "Friendly",
        gender: "male",
        isActive: true,
      },
      {
        id: "dr-lisa",
        name: "Dr. Lisa",
        description: "Mature professional woman with glasses",
        imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=512&h=512&fit=crop&crop=face",
        style: "Expert",
        gender: "female",
        isActive: true,
      },
      {
        id: "mike-creative",
        name: "Mike Creative",
        description: "Creative young man with stylish look",
        imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=512&h=512&fit=crop&crop=face",
        style: "Modern",
        gender: "male",
        isActive: true,
      },
    ];

    sampleAvatars.forEach(avatar => this.avatarModels.set(avatar.id, avatar));

    // Sample background music
    const sampleMusic: BackgroundMusic[] = [
      {
        id: "uplifting-corporate",
        name: "Uplifting Corporate",
        description: "Inspirational background music",
        genre: "corporate",
        duration: 154,
        audioUrl: "/assets/audio/uplifting-corporate.mp3",
        isActive: true,
      },
      {
        id: "calm-ambient",
        name: "Calm Ambient",
        description: "Peaceful background music",
        genre: "ambient",
        duration: 192,
        audioUrl: "/assets/audio/calm-ambient.mp3",
        isActive: true,
      },
    ];

    sampleMusic.forEach(music => this.backgroundMusic.set(music.id, music));

    // Sample sound effects
    const sampleEffects: SoundEffect[] = [
      {
        id: "applause",
        name: "Applause",
        description: "Audience applause",
        category: "audience",
        duration: 2,
        audioUrl: "/assets/audio/applause.mp3",
        isActive: true,
      },
      {
        id: "whoosh",
        name: "Whoosh",
        description: "Transition whoosh sound",
        category: "transition",
        duration: 1,
        audioUrl: "/assets/audio/whoosh.mp3",
        isActive: true,
      },
      {
        id: "nature-birds",
        name: "Nature",
        description: "Birds chirping in nature",
        category: "nature",
        duration: 5,
        audioUrl: "/assets/audio/nature-birds.mp3",
        isActive: true,
      },
      {
        id: "notification-beep",
        name: "Beep",
        description: "Notification beep sound",
        category: "notification",
        duration: 1,
        audioUrl: "/assets/audio/beep.mp3",
        isActive: true,
      },
    ];

    sampleEffects.forEach(effect => this.soundEffects.set(effect.id, effect));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      credits: 1250, 
      plan: "free",
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserCredits(id: string, credits: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      user.credits = credits;
      this.users.set(id, user);
      return user;
    }
    return undefined;
  }

  // Video project operations
  async getVideoProject(id: string): Promise<VideoProject | undefined> {
    return this.videoProjects.get(id);
  }

  async getVideoProjectsByUser(userId: string): Promise<VideoProject[]> {
    return Array.from(this.videoProjects.values()).filter(
      project => project.userId === userId
    );
  }

  async createVideoProject(insertProject: InsertVideoProject): Promise<VideoProject> {
    const id = randomUUID();
    const now = new Date();
    const project: VideoProject = {
      ...insertProject,
      id,
      style: insertProject.style || "cinematic",
      duration: insertProject.duration || 8,
      resolution: insertProject.resolution || "720p",
      aspectRatio: insertProject.aspectRatio || "16:9",
      status: insertProject.status || "pending",
      negativePrompt: insertProject.negativePrompt || null,
      videoUrl: insertProject.videoUrl || null,
      thumbnailUrl: insertProject.thumbnailUrl || null,
      createdAt: now,
      updatedAt: now,
    };
    this.videoProjects.set(id, project);
    return project;
  }

  async updateVideoProject(id: string, updates: Partial<VideoProject>): Promise<VideoProject | undefined> {
    const project = this.videoProjects.get(id);
    if (project) {
      const updatedProject = {
        ...project,
        ...updates,
        updatedAt: new Date(),
      };
      this.videoProjects.set(id, updatedProject);
      return updatedProject;
    }
    return undefined;
  }

  async deleteVideoProject(id: string): Promise<boolean> {
    return this.videoProjects.delete(id);
  }

  // Voice model operations
  async getVoiceModels(): Promise<VoiceModel[]> {
    return Array.from(this.voiceModels.values()).filter(voice => voice.isActive);
  }

  async getVoiceModelsByProvider(provider: string): Promise<VoiceModel[]> {
    return Array.from(this.voiceModels.values()).filter(
      voice => voice.provider === provider && voice.isActive
    );
  }

  async createVoiceModel(insertVoice: InsertVoiceModel): Promise<VoiceModel> {
    const voice: VoiceModel = { 
      ...insertVoice,
      style: insertVoice.style || null,
      description: insertVoice.description || null,
      gender: insertVoice.gender || null,
      language: insertVoice.language || "en",
      previewUrl: insertVoice.previewUrl || null,
      isActive: insertVoice.isActive ?? true,
    };
    this.voiceModels.set(voice.id, voice);
    return voice;
  }

  // Avatar model operations
  async getAvatarModels(): Promise<AvatarModel[]> {
    return Array.from(this.avatarModels.values()).filter(avatar => avatar.isActive);
  }

  async getAvatarModel(id: string): Promise<AvatarModel | undefined> {
    return this.avatarModels.get(id);
  }

  async createAvatarModel(insertAvatar: InsertAvatarModel): Promise<AvatarModel> {
    const avatar: AvatarModel = { 
      ...insertAvatar,
      style: insertAvatar.style || null,
      description: insertAvatar.description || null,
      gender: insertAvatar.gender || null,
      isActive: insertAvatar.isActive ?? true,
    };
    this.avatarModels.set(avatar.id, avatar);
    return avatar;
  }

  // Background music operations
  async getBackgroundMusic(): Promise<BackgroundMusic[]> {
    return Array.from(this.backgroundMusic.values()).filter(music => music.isActive);
  }

  async getBackgroundMusicByGenre(genre: string): Promise<BackgroundMusic[]> {
    return Array.from(this.backgroundMusic.values()).filter(
      music => music.genre === genre && music.isActive
    );
  }

  async createBackgroundMusic(insertMusic: InsertBackgroundMusic): Promise<BackgroundMusic> {
    const music: BackgroundMusic = { 
      ...insertMusic,
      duration: insertMusic.duration || null,
      description: insertMusic.description || null,
      genre: insertMusic.genre || null,
      isActive: insertMusic.isActive ?? true,
    };
    this.backgroundMusic.set(music.id, music);
    return music;
  }

  // Sound effects operations
  async getSoundEffects(): Promise<SoundEffect[]> {
    return Array.from(this.soundEffects.values()).filter(effect => effect.isActive);
  }

  async getSoundEffectsByCategory(category: string): Promise<SoundEffect[]> {
    return Array.from(this.soundEffects.values()).filter(
      effect => effect.category === category && effect.isActive
    );
  }

  async createSoundEffect(insertEffect: InsertSoundEffect): Promise<SoundEffect> {
    const effect: SoundEffect = { 
      ...insertEffect,
      duration: insertEffect.duration || null,
      description: insertEffect.description || null,
      category: insertEffect.category || null,
      isActive: insertEffect.isActive ?? true,
    };
    this.soundEffects.set(effect.id, effect);
    return effect;
  }
}

export const storage = new MemStorage();
