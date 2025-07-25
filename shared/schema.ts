import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  credits: integer("credits").default(1250),
  plan: text("plan").default("free"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videoProjects = pgTable("video_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  negativePrompt: text("negative_prompt"),
  style: text("style").default("cinematic"),
  duration: integer("duration").default(8), // seconds
  resolution: text("resolution").default("720p"),
  aspectRatio: text("aspect_ratio").default("16:9"),
  status: text("status").default("pending"), // pending, processing, completed, failed
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  settings: json("settings").$type<{
    camera: {
      pan: boolean;
      zoom: boolean;
      tracking: boolean;
    };
    physics: {
      accuracy: number;
      motionBlur: number;
    };
    voice: {
      provider: string;
      model: string;
      script: string;
      speed: number;
      pitch: number;
    };
    avatar: {
      id: string;
      lipSyncQuality: string;
      eyeContact: boolean;
    };
    audio: {
      bgmTrack: string;
      bgmVolume: number;
      soundEffects: string[];
      autoMatch: boolean;
    };
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const voiceModels = pgTable("voice_models", {
  id: varchar("id").primaryKey(),
  provider: text("provider").notNull(), // elevenlabs, openai, google, azure
  name: text("name").notNull(),
  description: text("description"),
  gender: text("gender"), // male, female, neutral
  style: text("style"), // professional, casual, friendly, etc.
  language: text("language").default("en"),
  previewUrl: text("preview_url"),
  isActive: boolean("is_active").default(true),
});

export const avatarModels = pgTable("avatar_models", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  style: text("style"), // business, casual, expert, modern
  gender: text("gender"),
  isActive: boolean("is_active").default(true),
});

export const backgroundMusic = pgTable("background_music", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  genre: text("genre"),
  duration: integer("duration"), // seconds
  audioUrl: text("audio_url").notNull(),
  isActive: boolean("is_active").default(true),
});

export const soundEffects = pgTable("sound_effects", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"), // applause, nature, whoosh, beep, etc.
  duration: integer("duration"), // seconds
  audioUrl: text("audio_url").notNull(),
  isActive: boolean("is_active").default(true),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertVideoProjectSchema = createInsertSchema(videoProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVoiceModelSchema = createInsertSchema(voiceModels);
export const insertAvatarModelSchema = createInsertSchema(avatarModels);
export const insertBackgroundMusicSchema = createInsertSchema(backgroundMusic);
export const insertSoundEffectSchema = createInsertSchema(soundEffects);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type VideoProject = typeof videoProjects.$inferSelect;
export type InsertVideoProject = z.infer<typeof insertVideoProjectSchema>;
export type VoiceModel = typeof voiceModels.$inferSelect;
export type InsertVoiceModel = z.infer<typeof insertVoiceModelSchema>;
export type AvatarModel = typeof avatarModels.$inferSelect;
export type InsertAvatarModel = z.infer<typeof insertAvatarModelSchema>;
export type BackgroundMusic = typeof backgroundMusic.$inferSelect;
export type InsertBackgroundMusic = z.infer<typeof insertBackgroundMusicSchema>;
export type SoundEffect = typeof soundEffects.$inferSelect;
export type InsertSoundEffect = z.infer<typeof insertSoundEffectSchema>;
