import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVideoProjectSchema, insertUserSchema } from "@shared/schema";
import { openaiService } from "./services/openai";
import { elevenLabsService } from "./services/elevenlabs";
import { videoGeneratorService } from "./services/video-generator";
import { avatarService } from "./services/avatar";
import { videoAnalyzerService } from "./services/video-analyzer";
import { freeVideoGeneratorService } from "./services/free-video-generator";
import { freeTTSService } from "./services/free-tts";
import { freePromptEnhancerService } from "./services/free-prompt-enhancer";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/temp/",
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Get user info
  app.get("/api/user/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Create user
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Get video projects for user
  app.get("/api/projects/:userId", async (req, res) => {
    try {
      const projects = await storage.getVideoProjectsByUser(req.params.userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Create video project
  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertVideoProjectSchema.parse(req.body);
      const project = await storage.createVideoProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Generate video
  app.post("/api/generate-video", async (req, res) => {
    try {
      const projectId = req.body.projectId;
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      const project = await storage.getVideoProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const jobId = await videoGeneratorService.generateVideo(project);
      res.json({ jobId, status: "started" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Get generation status
  app.get("/api/generation-status/:jobId", async (req, res) => {
    try {
      const job = videoGeneratorService.getJobStatus(req.params.jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const result = job.status === "completed" ? videoGeneratorService.getJobResult(req.params.jobId) : undefined;
      
      res.json({
        ...job,
        result,
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Cancel generation
  app.post("/api/cancel-generation/:jobId", async (req, res) => {
    try {
      const cancelled = await videoGeneratorService.cancelJob(req.params.jobId);
      res.json({ cancelled });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Get available voices (free TTS)
  app.get("/api/voices", async (req, res) => {
    try {
      const voices = await freeTTSService.getVoices();
      res.json(voices);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Preview voice (free TTS)
  app.post("/api/preview-voice", async (req, res) => {
    try {
      const { voiceId, text = "Hello, this is a voice preview." } = req.body;
      const audioBuffer = await freeTTSService.previewVoice(voiceId, text);

      res.set({
        "Content-Type": "audio/wav",
        "Content-Length": audioBuffer.length.toString(),
      });
      res.send(audioBuffer);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Get available avatars
  app.get("/api/avatars", async (req, res) => {
    try {
      const avatars = await avatarService.getAvailableAvatars();
      res.json(avatars);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Preview avatar
  app.post("/api/preview-avatar", async (req, res) => {
    try {
      const { avatarId, text = "Hello, I'm your AI avatar!" } = req.body;
      const videoBuffer = await avatarService.previewAvatar(avatarId, text);

      res.set({
        "Content-Type": "video/mp4",
        "Content-Length": videoBuffer.length.toString(),
      });
      res.send(videoBuffer);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Get background music
  app.get("/api/background-music", async (req, res) => {
    try {
      const tracks = await storage.getBackgroundMusic();
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Get sound effects
  app.get("/api/sound-effects", async (req, res) => {
    try {
      const effects = await storage.getSoundEffects();
      res.json(effects);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Enhance prompt using free AI (no API keys needed)
  app.post("/api/enhance-prompt", async (req, res) => {
    try {
      const { prompt, style = "cinematic", duration = 8, resolution = "720p", aspectRatio = "16:9" } = req.body;
      
      const enhanced = await freePromptEnhancerService.enhancePrompt(
        prompt,
        style,
        duration,
        resolution,
        aspectRatio
      );

      res.json(enhanced);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Analyze content for recommendations (free)
  app.post("/api/analyze-content", async (req, res) => {
    try {
      const { prompt } = req.body;
      const analysis = await freePromptEnhancerService.analyzeVideoContent(prompt);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Analyze reference videos
  app.post("/api/analyze-reference-videos", upload.array("videos", 5), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No video files provided" });
      }

      const videoPaths = files.map(file => file.path);
      const analysis = await freeVideoGeneratorService.analyzeReferenceVideos(videoPaths);

      // Clean up uploaded files
      for (const file of files) {
        try {
          await fs.unlink(file.path);
        } catch (error) {
          console.warn("Could not delete temp file:", file.path);
        }
      }

      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Generate video using free methods
  app.post("/api/generate-free-video", async (req, res) => {
    try {
      const { projectId, options } = req.body;
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      const project = await storage.getVideoProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const result = await freeVideoGeneratorService.generateFreeVideo(project, options);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Get free video generation guide
  app.get("/api/free-video-guide", async (req, res) => {
    try {
      const guide = await freeVideoGeneratorService.generateImplementationGuide();
      res.json({ guide });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Analyze single video file
  app.post("/api/analyze-video", upload.single("video"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No video file provided" });
      }

      const analysis = await videoAnalyzerService.analyzeVideo(file.path);
      const qualityReport = await videoAnalyzerService.generateQualityReport(analysis);
      const recommendedSettings = await videoAnalyzerService.getRecommendedSettings(analysis);

      // Clean up uploaded file
      try {
        await fs.unlink(file.path);
      } catch (error) {
        console.warn("Could not delete temp file:", file.path);
      }

      res.json({
        analysis,
        qualityReport,
        recommendedSettings,
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
