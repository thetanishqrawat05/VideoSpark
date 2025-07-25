import { spawn } from 'child_process';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';

interface VideoGenerationJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  error?: string;
  result?: {
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    audioUrl?: string;
  };
}

interface Scene {
  text: string;
  duration: number;
  background: string;
  textStyle: string;
  voiceSettings?: {
    voiceId: string;
    speed: number;
    pitch: number;
  };
}

interface VideoOptions {
  scenes: Scene[];
  resolution: '720p' | '1080p' | '4k';
  frameRate: number;
  backgroundMusic?: string;
  backgroundMusicVolume: number;
  outputFormat: 'mp4' | 'webm';
}

class VideoGenerationService {
  private jobs = new Map<string, VideoGenerationJob>();
  private uploadsDir = 'uploads';

  async generateVideo(options: VideoOptions): Promise<string> {
    const jobId = nanoid();
    
    const job: VideoGenerationJob = {
      id: jobId,
      status: 'queued',
      progress: 0,
      currentStep: 'Initializing video generation...'
    };
    
    this.jobs.set(jobId, job);
    
    // Start generation in background
    this.processVideoGeneration(jobId, options).catch(error => {
      console.error(`Video generation failed for job ${jobId}:`, error);
      this.updateJob(jobId, {
        status: 'failed',
        error: error.message
      });
    });
    
    return jobId;
  }

  async getJobStatus(jobId: string): Promise<VideoGenerationJob | null> {
    return this.jobs.get(jobId) || null;
  }

  private updateJob(jobId: string, updates: Partial<VideoGenerationJob>) {
    const job = this.jobs.get(jobId);
    if (job) {
      Object.assign(job, updates);
    }
  }

  private async processVideoGeneration(jobId: string, options: VideoOptions) {
    this.updateJob(jobId, {
      status: 'processing',
      currentStep: 'Preparing scene files...'
    });

    try {
      const resolutionMap = {
        '720p': { width: 1280, height: 720 },
        '1080p': { width: 1920, height: 1080 },
        '4k': { width: 3840, height: 2160 }
      };
      
      const { width, height } = resolutionMap[options.resolution];
      const outputFile = join(this.uploadsDir, `video_${jobId}.${options.outputFormat}`);
      const thumbnailFile = join(this.uploadsDir, `video_${jobId}_thumb.jpg`);
      
      // Generate individual scene videos
      const sceneFiles: string[] = [];
      const totalScenes = options.scenes.length;
      
      for (let i = 0; i < totalScenes; i++) {
        const scene = options.scenes[i];
        const sceneFile = join(this.uploadsDir, `temp_scene_${jobId}_${i}.mp4`);
        
        this.updateJob(jobId, {
          currentStep: `Generating scene ${i + 1} of ${totalScenes}...`,
          progress: (i / totalScenes) * 70
        });
        
        await this.generateSceneVideo(scene, sceneFile, width, height, options.frameRate);
        sceneFiles.push(sceneFile);
      }

      this.updateJob(jobId, {
        currentStep: 'Combining scenes...',
        progress: 75
      });

      // Create concatenation list
      const concatListFile = join(this.uploadsDir, `concat_${jobId}.txt`);
      const concatList = sceneFiles.map(file => `file '${file}'`).join('\n');
      await writeFile(concatListFile, concatList);

      // Concatenate all scenes
      await this.runFFmpeg([
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListFile,
        '-c', 'copy',
        outputFile
      ]);

      this.updateJob(jobId, {
        currentStep: 'Generating thumbnail...',
        progress: 85
      });

      // Generate thumbnail
      await this.runFFmpeg([
        '-i', outputFile,
        '-ss', '1',
        '-vframes', '1',
        '-f', 'image2',
        thumbnailFile
      ]);

      this.updateJob(jobId, {
        currentStep: 'Finalizing...',
        progress: 95
      });

      // Get video duration
      const duration = await this.getVideoDuration(outputFile);

      // Clean up temporary files
      await Promise.all([
        ...sceneFiles.map(file => unlink(file).catch(() => {})),
        unlink(concatListFile).catch(() => {})
      ]);

      this.updateJob(jobId, {
        status: 'completed',
        progress: 100,
        currentStep: 'Video generation completed!',
        result: {
          videoUrl: `/uploads/video_${jobId}.${options.outputFormat}`,
          thumbnailUrl: `/uploads/video_${jobId}_thumb.jpg`,
          duration
        }
      });

    } catch (error) {
      throw error;
    }
  }

  private async generateSceneVideo(
    scene: Scene,
    outputFile: string,
    width: number,
    height: number,
    frameRate: number
  ): Promise<void> {
    // Generate background based on type
    let backgroundFilter = '';
    
    switch (scene.background) {
      case 'gradient':
        backgroundFilter = `color=c=0x1a1a2e:size=${width}x${height}:duration=${scene.duration}:rate=${frameRate}[bg];[bg]geq=r='128+127*sin(2*PI*t/10)':g='64+63*sin(2*PI*t/8+PI/3)':b='192+63*sin(2*PI*t/12+2*PI/3)'[colored]`;
        break;
      case 'solid':
        backgroundFilter = `color=c=0x2d1b69:size=${width}x${height}:duration=${scene.duration}:rate=${frameRate}[colored]`;
        break;
      case 'particles':
        backgroundFilter = `color=c=0x0f0f23:size=${width}x${height}:duration=${scene.duration}:rate=${frameRate}[bg];[bg]geq=r='255*random(0)*0.3':g='255*random(1)*0.6':b='255*random(2)'[colored]`;
        break;
      case 'waves':
        backgroundFilter = `color=c=0x1e1e3f:size=${width}x${height}:duration=${scene.duration}:rate=${frameRate}[bg];[bg]geq=r='128+127*sin(X/50+2*PI*t/5)':g='64+63*sin(Y/30+2*PI*t/7)':b='255'[colored]`;
        break;
      default:
        backgroundFilter = `color=c=0x000000:size=${width}x${height}:duration=${scene.duration}:rate=${frameRate}[colored]`;
    }

    // Generate text overlay with animation
    const fontSize = Math.floor(width / 25);
    const textColor = 'white';
    const textX = '(w-text_w)/2';
    const textY = '(h-text_h)/2';
    
    let textFilter = '';
    switch (scene.textStyle) {
      case 'fade-in':
        textFilter = `[colored]drawtext=text='${scene.text.replace(/'/g, "\\'")}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=${fontSize}:fontcolor=${textColor}:x=${textX}:y=${textY}:alpha='min(t,1)'[final]`;
        break;
      case 'typewriter':
        textFilter = `[colored]drawtext=text='${scene.text.replace(/'/g, "\\'")}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=${fontSize}:fontcolor=${textColor}:x=${textX}:y=${textY}:enable='between(t,0,${scene.duration})'[final]`;
        break;
      case 'slide-up':
        textFilter = `[colored]drawtext=text='${scene.text.replace(/'/g, "\\'")}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=${fontSize}:fontcolor=${textColor}:x=${textX}:y='${textY}+100*(1-min(t,1))'[final]`;
        break;
      case 'zoom':
        textFilter = `[colored]drawtext=text='${scene.text.replace(/'/g, "\\'")}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize='${fontSize}*min(t*2,1)':fontcolor=${textColor}:x=${textX}:y=${textY}[final]`;
        break;
      default:
        textFilter = `[colored]drawtext=text='${scene.text.replace(/'/g, "\\'")}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=${fontSize}:fontcolor=${textColor}:x=${textX}:y=${textY}[final]`;
    }

    const fullFilter = backgroundFilter + ';' + textFilter;

    await this.runFFmpeg([
      '-f', 'lavfi',
      '-i', `color=black:size=${width}x${height}:duration=${scene.duration}:rate=${frameRate}`,
      '-filter_complex', fullFilter,
      '-map', '[final]',
      '-t', scene.duration.toString(),
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-an',
      '-y',
      outputFile
    ]);
  }

  private async runFFmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);
      
      let stdout = '';
      let stderr = '';
      
      ffmpeg.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
        }
      });
    });
  }

  private async getVideoDuration(videoFile: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=duration',
        '-of', 'csv=p=0',
        videoFile
      ]);
      
      let output = '';
      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      ffprobe.on('close', (code) => {
        if (code === 0) {
          const duration = parseFloat(output.trim());
          resolve(isNaN(duration) ? 0 : duration);
        } else {
          resolve(0);
        }
      });
    });
  }
}

export const videoGenerationService = new VideoGenerationService();