// FFmpeg-based video processing utilities for browser-based video generation
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface Scene {
  id: string;
  title: string;
  text: string;
  background: string;
  voiceId: string;
  duration: number;
  textStyle: string;
  audioEnabled: boolean;
  backgroundImage?: string;
  audioFile?: string;
}

interface VideoGenerationOptions {
  scenes: Scene[];
  resolution: '720p' | '1080p' | '4k';
  frameRate: number;
  backgroundMusic?: string;
  backgroundMusicVolume: number;
  outputFormat: 'mp4' | 'webm';
}

class FFmpegProcessor {
  private ffmpeg: FFmpeg;
  private loaded = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async initialize() {
    if (this.loaded) return;

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    this.ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    this.loaded = true;
  }

  async generateVideo(options: VideoGenerationOptions, onProgress?: (progress: number) => void): Promise<Blob> {
    await this.initialize();

    const { scenes, resolution, frameRate, backgroundMusic, backgroundMusicVolume, outputFormat } = options;
    
    // Resolution settings
    const resolutionMap = {
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '4k': { width: 3840, height: 2160 }
    };
    
    const { width, height } = resolutionMap[resolution];
    let totalProgress = 0;
    const progressStep = 100 / (scenes.length + 2); // scenes + audio processing + final merge

    try {
      // Generate individual scene videos
      const sceneFiles: string[] = [];
      
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        const sceneFile = `scene_${i}.mp4`;
        
        await this.generateSceneVideo(scene, sceneFile, width, height, frameRate);
        sceneFiles.push(sceneFile);
        
        totalProgress += progressStep;
        onProgress?.(totalProgress);
      }

      // Create input list for concatenation
      const inputList = sceneFiles.map(file => `file '${file}'`).join('\n');
      await this.ffmpeg.writeFile('input.txt', inputList);

      // Concatenate all scenes
      await this.ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'input.txt',
        '-c', 'copy',
        'temp_video.mp4'
      ]);

      totalProgress += progressStep;
      onProgress?.(totalProgress);

      // Add background music if provided
      let finalOutput = 'temp_video.mp4';
      if (backgroundMusic) {
        await this.ffmpeg.writeFile('bgm.mp3', await fetchFile(backgroundMusic));
        
        await this.ffmpeg.exec([
          '-i', 'temp_video.mp4',
          '-i', 'bgm.mp3',
          '-filter_complex', `[1:a]volume=${backgroundMusicVolume / 100}[bg];[0:a][bg]amix=inputs=2:duration=first[a]`,
          '-map', '0:v',
          '-map', '[a]',
          '-c:v', 'copy',
          '-c:a', 'aac',
          'final_video.mp4'
        ]);
        
        finalOutput = 'final_video.mp4';
      }

      // Convert to desired output format if needed
      if (outputFormat === 'webm') {
        await this.ffmpeg.exec([
          '-i', finalOutput,
          '-c:v', 'libvpx-vp9',
          '-c:a', 'libopus',
          '-b:v', '1M',
          'output.webm'
        ]);
        finalOutput = 'output.webm';
      }

      totalProgress = 100;
      onProgress?.(totalProgress);

      // Get the final video file
      const data = await this.ffmpeg.readFile(finalOutput);
      return new Blob([data], { type: `video/${outputFormat}` });

    } catch (error) {
      console.error('Video generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to generate video: ${errorMessage}`);
    }
  }

  private async generateSceneVideo(
    scene: Scene, 
    outputFile: string, 
    width: number, 
    height: number, 
    frameRate: number
  ) {
    // Generate background
    let backgroundFilter = '';
    
    if (scene.backgroundImage) {
      await this.ffmpeg.writeFile(`bg_${scene.id}.jpg`, await fetchFile(scene.backgroundImage));
      backgroundFilter = `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}[bg];`;
    } else {
      // Generate gradient background
      backgroundFilter = this.generateBackgroundFilter(scene.background, width, height);
    }

    // Generate text overlay
    const textFilter = this.generateTextFilter(scene.text, scene.textStyle, width, height, scene.duration);

    // Combine filters
    const complexFilter = backgroundFilter + textFilter;

    const ffmpegArgs = [
      '-f', 'lavfi',
      '-i', 'color=black:size=' + width + 'x' + height + ':duration=' + scene.duration + ':rate=' + frameRate,
      ...(scene.backgroundImage ? ['-i', `bg_${scene.id}.jpg`] : []),
      ...(scene.audioEnabled && scene.audioFile ? ['-i', scene.audioFile] : []),
      '-filter_complex', complexFilter,
      '-t', scene.duration.toString(),
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      ...(scene.audioEnabled && scene.audioFile ? ['-c:a', 'aac'] : ['-an']),
      outputFile
    ];

    await this.ffmpeg.exec(ffmpegArgs);
  }

  private generateBackgroundFilter(backgroundType: string, width: number, height: number): string {
    switch (backgroundType) {
      case 'gradient':
        return `[0:v]geq=r='255*0.5*(1+sin(2*PI*T/10))':g='255*0.3*(1+cos(2*PI*T/8))':b='255*0.8*(1+sin(2*PI*T/12))'[bg];`;
      case 'solid':
        return `[0:v]geq=r=64:g=128:b=255[bg];`;
      case 'particles':
        return `[0:v]geq=r='255*random(0)':g='255*random(1)':b='255*random(2)':alpha='255*0.1'[bg];`;
      case 'waves':
        return `[0:v]geq=r='255*0.5*(1+sin(X/30+2*PI*T/5))':g='255*0.3*(1+cos(Y/20+2*PI*T/7))':b='255*0.8'[bg];`;
      default:
        return `[0:v]geq=r=32:g=32:b=48[bg];`;
    }
  }

  private generateTextFilter(text: string, style: string, width: number, height: number, duration: number): string {
    const fontSize = Math.floor(width / 20);
    const x = '(w-text_w)/2';
    const y = '(h-text_h)/2';
    
    const baseText = `drawtext=text='${text.replace(/'/g, "\\'")}':fontsize=${fontSize}:fontcolor=white:x=${x}:y=${y}:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`;
    
    switch (style) {
      case 'fade-in':
        return `[bg]${baseText}:alpha='if(lt(t,1),t,1)'[v];`;
      case 'typewriter':
        return `[bg]${baseText}:text='${text.replace(/'/g, "\\'")}':enable='between(t,0,${duration})'[v];`;
      case 'slide-up':
        return `[bg]${baseText}:y='${y}+50*(1-min(t,1))'[v];`;
      case 'zoom':
        return `[bg]${baseText}:fontsize='${fontSize}*min(t*2,1)'[v];`;
      default:
        return `[bg]${baseText}[v];`;
    }
  }

  async generateThumbnail(videoBlob: Blob): Promise<Blob> {
    await this.initialize();
    
    // Write video to FFmpeg filesystem
    await this.ffmpeg.writeFile('input.mp4', await fetchFile(videoBlob));
    
    // Extract thumbnail at 1 second
    await this.ffmpeg.exec([
      '-i', 'input.mp4',
      '-ss', '1',
      '-vframes', '1',
      '-f', 'image2',
      'thumbnail.jpg'
    ]);
    
    const data = await this.ffmpeg.readFile('thumbnail.jpg');
    return new Blob([data], { type: 'image/jpeg' });
  }
}

export const ffmpegProcessor = new FFmpegProcessor();
export type { Scene, VideoGenerationOptions };