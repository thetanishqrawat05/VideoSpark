import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export interface VideoGenerationOptions {
  prompt: string;
  style: string;
  duration: number;
  resolution: string;
  aspectRatio: string;
  outputPath?: string;
}

export class FreeVideoGeneratorService {
  private tempDir = path.join(process.cwd(), "temp");
  private outputDir = path.join(process.cwd(), "uploads");

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.tempDir, { recursive: true });
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  async generateVideo(options: VideoGenerationOptions): Promise<string> {
    const videoId = randomUUID();
    const outputPath = options.outputPath || path.join(this.outputDir, `video_${videoId}.mp4`);
    
    // Analyze prompt to determine video content and style
    const scene = this.analyzePrompt(options.prompt);
    
    // Generate video based on scene analysis
    if (scene.type === 'nature') {
      await this.generateNatureVideo(options, outputPath, scene);
    } else if (scene.type === 'abstract') {
      await this.generateAbstractVideo(options, outputPath, scene);
    } else if (scene.type === 'text') {
      await this.generateTextVideo(options, outputPath, scene);
    } else {
      await this.generateGenericVideo(options, outputPath, scene);
    }

    return outputPath;
  }

  private analyzePrompt(prompt: string): any {
    const lowerPrompt = prompt.toLowerCase();
    
    // Analyze prompt content
    const isNature = /nature|tree|forest|ocean|mountain|sky|cloud|flower|bird|animal/.test(lowerPrompt);
    const isAbstract = /abstract|geometric|pattern|shape|color|gradient|particle/.test(lowerPrompt);
    const isText = /text|word|title|logo|sign/.test(lowerPrompt);
    
    // Extract colors
    const colors = this.extractColors(lowerPrompt);
    
    // Extract motion keywords
    const motion = this.extractMotion(lowerPrompt);
    
    return {
      type: isNature ? 'nature' : isAbstract ? 'abstract' : isText ? 'text' : 'generic',
      colors,
      motion,
      keywords: prompt.split(' ').filter(word => word.length > 3),
      originalPrompt: prompt
    };
  }

  private extractColors(prompt: string): string[] {
    const colorMap = {
      'red': '#FF0000', 'blue': '#0000FF', 'green': '#00FF00', 'yellow': '#FFFF00',
      'purple': '#800080', 'orange': '#FFA500', 'pink': '#FFC0CB', 'black': '#000000',
      'white': '#FFFFFF', 'gray': '#808080', 'brown': '#8B4513', 'gold': '#FFD700',
      'silver': '#C0C0C0', 'cyan': '#00FFFF', 'magenta': '#FF00FF', 'lime': '#00FF00'
    };
    
    const colors: string[] = [];
    for (const [colorName, colorValue] of Object.entries(colorMap)) {
      if (prompt.includes(colorName)) {
        colors.push(colorValue);
      }
    }
    
    return colors.length > 0 ? colors : ['#4F46E5', '#7C3AED']; // Default purple gradient
  }

  private extractMotion(prompt: string): string {
    if (/fast|speed|quick|rapid/.test(prompt)) return 'fast';
    if (/slow|calm|gentle|peaceful/.test(prompt)) return 'slow';
    if (/spin|rotate|circle/.test(prompt)) return 'rotate';
    if (/wave|flow|fluid/.test(prompt)) return 'wave';
    if (/zoom|scale|grow/.test(prompt)) return 'zoom';
    return 'gentle';
  }

  private async generateNatureVideo(options: VideoGenerationOptions, outputPath: string, scene: any): Promise<void> {
    // Create nature-inspired video with moving elements
    const tempVideoPath = path.join(this.tempDir, `nature_${randomUUID()}.mp4`);
    
    await this.runFFmpegCommand([
      '-f', 'lavfi',
      '-i', this.createNatureFilter(options, scene),
      '-t', options.duration.toString(),
      '-r', '30',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-y',
      tempVideoPath
    ]);

    // Add text overlay if prompt contains text elements
    if (scene.keywords.some((k: string) => k.length > 4)) {
      await this.addTextOverlay(tempVideoPath, outputPath, scene.originalPrompt, options);
    } else {
      await fs.copyFile(tempVideoPath, outputPath);
    }

    await fs.unlink(tempVideoPath).catch(() => {});
  }

  private async generateAbstractVideo(options: VideoGenerationOptions, outputPath: string, scene: any): Promise<void> {
    const tempVideoPath = path.join(this.tempDir, `abstract_${randomUUID()}.mp4`);
    
    await this.runFFmpegCommand([
      '-f', 'lavfi',
      '-i', this.createAbstractFilter(options, scene),
      '-t', options.duration.toString(),
      '-r', '30',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-y',
      tempVideoPath
    ]);

    await this.addTextOverlay(tempVideoPath, outputPath, scene.originalPrompt, options);
    await fs.unlink(tempVideoPath).catch(() => {});
  }

  private async generateTextVideo(options: VideoGenerationOptions, outputPath: string, scene: any): Promise<void> {
    // Create text-focused video with animated typography
    const { width, height } = this.getResolutionDimensions(options.resolution);
    
    await this.runFFmpegCommand([
      '-f', 'lavfi',
      '-i', `color=c=${scene.colors[0]}:s=${width}x${height}:d=${options.duration}`,
      '-vf', this.createTextAnimationFilter(scene.originalPrompt, scene.colors, width, height),
      '-r', '30',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-y',
      outputPath
    ]);
  }

  private async generateGenericVideo(options: VideoGenerationOptions, outputPath: string, scene: any): Promise<void> {
    // Create a dynamic generic video with particle effects
    const tempVideoPath = path.join(this.tempDir, `generic_${randomUUID()}.mp4`);
    
    await this.runFFmpegCommand([
      '-f', 'lavfi',
      '-i', this.createGenericFilter(options, scene),
      '-t', options.duration.toString(),
      '-r', '30',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-y',
      tempVideoPath
    ]);

    await this.addTextOverlay(tempVideoPath, outputPath, scene.originalPrompt, options);
    await fs.unlink(tempVideoPath).catch(() => {});
  }

  private createNatureFilter(options: VideoGenerationOptions, scene: any): string {
    const { width, height } = this.getResolutionDimensions(options.resolution);
    const speed = scene.motion === 'fast' ? 0.1 : scene.motion === 'slow' ? 0.02 : 0.05;
    
    // Create moving gradient that resembles natural phenomena
    return `color=c=${scene.colors[0]}:s=${width}x${height}[base];` +
           `[base]geq=` +
           `r='sin(X/20+T*${speed})*127+128':` +
           `g='sin(Y/30+T*${speed*0.8})*127+128':` +
           `b='sin((X+Y)/40+T*${speed*1.2})*127+128'[nature];` +
           `[nature]noise=alls=10:allf=t+u`;
  }

  private createAbstractFilter(options: VideoGenerationOptions, scene: any): string {
    const { width, height } = this.getResolutionDimensions(options.resolution);
    const speed = scene.motion === 'fast' ? 0.2 : scene.motion === 'slow' ? 0.03 : 0.08;
    
    // Create abstract geometric patterns
    return `color=c=black:s=${width}x${height}[base];` +
           `[base]geq=` +
           `r='if(lt(mod(X+Y+T*${speed*100},60),30),255,0)':` +
           `g='if(lt(mod(X-Y+T*${speed*80},80),40),255,0)':` +
           `b='if(lt(mod(X*Y/100+T*${speed*120},100),50),255,0)'[pattern];` +
           `[pattern]boxblur=2:1`;
  }

  private createGenericFilter(options: VideoGenerationOptions, scene: any): string {
    const { width, height } = this.getResolutionDimensions(options.resolution);
    const speed = scene.motion === 'fast' ? 0.15 : scene.motion === 'slow' ? 0.04 : 0.07;
    
    // Create dynamic particle-like effect
    return `color=c=${scene.colors[0]}:s=${width}x${height}[bg];` +
           `[bg]geq=` +
           `r='sin(sqrt((X-${width/2})*(X-${width/2})+(Y-${height/2})*(Y-${height/2}))/10+T*${speed})*127+128':` +
           `g='cos(sqrt((X-${width/3})*(X-${width/3})+(Y-${height/3})*(Y-${height/3}))/15+T*${speed*0.7})*127+128':` +
           `b='sin(sqrt((X-${width*2/3})*(X-${width*2/3})+(Y-${height*2/3})*(Y-${height*2/3}))/12+T*${speed*1.3})*127+128'`;
  }

  private createTextAnimationFilter(text: string, colors: string[], width: number, height: number): string {
    // Create animated text with fade in/out effects
    const fontSize = Math.max(24, Math.min(width / 20, 72));
    return `drawtext=text='${text.replace(/'/g, "\\'")}':` +
           `fontsize=${fontSize}:fontcolor=white:` +
           `x=(w-tw)/2:y=(h-th)/2:` +
           `enable='between(t,0.5,${8})':` +
           `alpha='if(lt(t,1),t,if(gt(t,7),8-t,1))'`;
  }

  private async addTextOverlay(inputPath: string, outputPath: string, text: string, options: VideoGenerationOptions): Promise<void> {
    const { width } = this.getResolutionDimensions(options.resolution);
    const fontSize = Math.max(16, Math.min(width / 30, 48));
    
    // Truncate text if too long
    const displayText = text.length > 50 ? text.substring(0, 47) + '...' : text;
    
    await this.runFFmpegCommand([
      '-i', inputPath,
      '-vf', `drawtext=text='${displayText.replace(/'/g, "\\'")}':` +
             `fontsize=${fontSize}:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2:` +
             `x=(w-tw)/2:y=h-th-20:alpha=0.9`,
      '-c:a', 'copy',
      '-y',
      outputPath
    ]);
  }

  private getResolutionDimensions(resolution: string): { width: number; height: number } {
    switch (resolution) {
      case '720p': return { width: 1280, height: 720 };
      case '1080p': return { width: 1920, height: 1080 };
      case '4k': return { width: 3840, height: 2160 };
      default: return { width: 1280, height: 720 };
    }
  }

  private async runFFmpegCommand(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);
      
      ffmpeg.stderr.on('data', (data) => {
        // Log FFmpeg output for debugging
        console.log(`FFmpeg: ${data}`);
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg failed with code ${code}`));
        }
      });
      
      ffmpeg.on('error', (error) => {
        reject(error);
      });
    });
  }

  async generateThumbnail(videoPath: string): Promise<string> {
    const thumbnailPath = videoPath.replace('.mp4', '_thumb.jpg');
    
    await this.runFFmpegCommand([
      '-i', videoPath,
      '-ss', '1',
      '-vframes', '1',
      '-y',
      thumbnailPath
    ]);
    
    return thumbnailPath;
  }
}