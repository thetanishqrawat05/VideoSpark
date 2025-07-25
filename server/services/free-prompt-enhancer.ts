export interface PromptEnhancement {
  enhancedPrompt: string;
  improvements: string[];
  videoSpecs: {
    suggestedDuration: number;
    suggestedResolution: string;
    suggestedStyle: string;
  };
  technicalSettings: {
    frameRate: number;
    motionIntensity: string;
    colorProfile: string;
  };
}

export class FreePromptEnhancerService {
  private videoStyles = [
    "cinematic", "documentary", "commercial", "artistic", "realistic", 
    "animated", "vintage", "modern", "dramatic", "peaceful"
  ];

  private videoElements = [
    "camera movement", "lighting", "color grading", "composition", 
    "depth of field", "motion blur", "perspective", "atmosphere"
  ];

  private qualityKeywords = [
    "high quality", "professional", "4K", "cinematic", "detailed",
    "sharp focus", "perfect lighting", "vibrant colors", "smooth motion"
  ];

  async enhancePrompt(
    prompt: string,
    style: string,
    duration: number,
    resolution: string,
    aspectRatio: string
  ): Promise<PromptEnhancement> {
    try {
      // Analyze the input prompt
      const analysis = this.analyzePrompt(prompt);
      
      // Generate enhanced prompt using rule-based enhancement
      const enhancedPrompt = this.generateEnhancedPrompt(prompt, style, analysis);
      
      // Generate improvements list
      const improvements = this.generateImprovements(analysis, style);
      
      // Generate video specifications
      const videoSpecs = this.generateVideoSpecs(prompt, style, duration, resolution);
      
      // Generate technical settings
      const technicalSettings = this.generateTechnicalSettings(style, prompt);

      return {
        enhancedPrompt,
        improvements,
        videoSpecs,
        technicalSettings,
      };
    } catch (error) {
      // Fallback enhancement if any processing fails
      return this.fallbackEnhancement(prompt, style, duration, resolution);
    }
  }

  private analyzePrompt(prompt: string): {
    hasSubject: boolean;
    hasAction: boolean;
    hasEnvironment: boolean;
    hasLighting: boolean;
    hasCameraAngle: boolean;
    hasMotion: boolean;
    wordCount: number;
    complexity: "simple" | "medium" | "complex";
  } {
    const lowerPrompt = prompt.toLowerCase();
    
    // Check for various elements in the prompt
    const subjectWords = ["person", "man", "woman", "child", "animal", "dog", "cat", "bird", "character"];
    const actionWords = ["running", "walking", "dancing", "flying", "jumping", "moving", "playing"];
    const environmentWords = ["park", "beach", "forest", "city", "room", "house", "mountain", "sky"];
    const lightingWords = ["sunset", "sunrise", "bright", "dark", "shadow", "light", "golden", "soft"];
    const cameraWords = ["close-up", "wide", "aerial", "drone", "pov", "overhead", "side view"];
    const motionWords = ["slow motion", "fast", "smooth", "dynamic", "static", "zoom", "pan"];

    return {
      hasSubject: subjectWords.some(word => lowerPrompt.includes(word)),
      hasAction: actionWords.some(word => lowerPrompt.includes(word)),
      hasEnvironment: environmentWords.some(word => lowerPrompt.includes(word)),
      hasLighting: lightingWords.some(word => lowerPrompt.includes(word)),
      hasCameraAngle: cameraWords.some(word => lowerPrompt.includes(word)),
      hasMotion: motionWords.some(word => lowerPrompt.includes(word)),
      wordCount: prompt.split(/\s+/).length,
      complexity: prompt.split(/\s+/).length > 20 ? "complex" : prompt.split(/\s+/).length > 10 ? "medium" : "simple"
    };
  }

  private generateEnhancedPrompt(prompt: string, style: string, analysis: any): string {
    let enhanced = prompt;

    // Add quality descriptors if missing
    if (!this.qualityKeywords.some(keyword => prompt.toLowerCase().includes(keyword.toLowerCase()))) {
      enhanced = `Professional, high-quality ${enhanced}`;
    }

    // Add style-specific enhancements
    switch (style.toLowerCase()) {
      case "cinematic":
        if (!analysis.hasLighting) {
          enhanced += ", cinematic lighting, dramatic shadows";
        }
        if (!analysis.hasCameraAngle) {
          enhanced += ", dynamic camera angle";
        }
        enhanced += ", film grain, shallow depth of field";
        break;
      
      case "documentary":
        enhanced += ", natural lighting, realistic colors, authentic atmosphere";
        break;
      
      case "commercial":
        enhanced += ", vibrant colors, perfect lighting, professional composition";
        break;
      
      case "artistic":
        enhanced += ", creative composition, artistic lighting, unique perspective";
        break;
      
      case "realistic":
        enhanced += ", photorealistic, natural colors, authentic details";
        break;
    }

    // Add technical quality terms
    if (!enhanced.toLowerCase().includes("4k") && !enhanced.toLowerCase().includes("hd")) {
      enhanced += ", 4K resolution";
    }

    if (!enhanced.toLowerCase().includes("smooth")) {
      enhanced += ", smooth motion";
    }

    // Add motion descriptions if missing
    if (!analysis.hasMotion) {
      enhanced += ", fluid camera movement";
    }

    return enhanced;
  }

  private generateImprovements(analysis: any, style: string): string[] {
    const improvements: string[] = [];

    if (!analysis.hasSubject) {
      improvements.push("Added clear subject identification");
    }

    if (!analysis.hasAction) {
      improvements.push("Enhanced with dynamic action elements");
    }

    if (!analysis.hasEnvironment) {
      improvements.push("Included environmental context");
    }

    if (!analysis.hasLighting) {
      improvements.push("Added professional lighting description");
    }

    if (!analysis.hasCameraAngle) {
      improvements.push("Specified optimal camera angles");
    }

    improvements.push("Applied cinematic quality enhancements");
    improvements.push("Optimized for professional video generation");
    improvements.push(`Tailored for ${style} style presentation`);

    return improvements;
  }

  private generateVideoSpecs(prompt: string, style: string, duration: number, resolution: string): {
    suggestedDuration: number;
    suggestedResolution: string;
    suggestedStyle: string;
  } {
    // Analyze content complexity to suggest duration
    const wordCount = prompt.split(/\s+/).length;
    let suggestedDuration = duration;

    if (wordCount > 30) {
      suggestedDuration = Math.max(duration, 10); // Complex scenes need more time
    } else if (wordCount < 10) {
      suggestedDuration = Math.min(duration, 5); // Simple scenes can be shorter
    }

    // Suggest resolution based on style
    let suggestedResolution = resolution;
    if (style === "cinematic" && resolution === "720p") {
      suggestedResolution = "1080p"; // Cinematic should be higher quality
    }

    return {
      suggestedDuration,
      suggestedResolution,
      suggestedStyle: style,
    };
  }

  private generateTechnicalSettings(style: string, prompt: string): {
    frameRate: number;
    motionIntensity: string;
    colorProfile: string;
  } {
    const hasAction = prompt.toLowerCase().includes("fast") || 
                     prompt.toLowerCase().includes("running") || 
                     prompt.toLowerCase().includes("action");

    let frameRate = 30;
    let motionIntensity = "medium";
    let colorProfile = "standard";

    switch (style.toLowerCase()) {
      case "cinematic":
        frameRate = 24; // Film standard
        motionIntensity = "smooth";
        colorProfile = "cinematic";
        break;
      
      case "documentary":
        frameRate = 30;
        motionIntensity = "natural";
        colorProfile = "realistic";
        break;
      
      case "action":
        frameRate = hasAction ? 60 : 30;
        motionIntensity = "high";
        colorProfile = "vibrant";
        break;
      
      case "artistic":
        frameRate = 24;
        motionIntensity = "creative";
        colorProfile = "stylized";
        break;
    }

    return {
      frameRate,
      motionIntensity,
      colorProfile,
    };
  }

  private fallbackEnhancement(
    prompt: string, 
    style: string, 
    duration: number, 
    resolution: string
  ): PromptEnhancement {
    return {
      enhancedPrompt: `Professional, high-quality ${prompt}, cinematic lighting, 4K resolution, smooth motion`,
      improvements: [
        "Added professional quality descriptors",
        "Enhanced with cinematic elements",
        "Optimized for video generation"
      ],
      videoSpecs: {
        suggestedDuration: duration,
        suggestedResolution: resolution,
        suggestedStyle: style,
      },
      technicalSettings: {
        frameRate: 30,
        motionIntensity: "medium",
        colorProfile: "standard",
      },
    };
  }

  async analyzeVideoContent(prompt: string): Promise<{
    suggestions: string[];
    recommendedSettings: any;
    qualityTips: string[];
  }> {
    const analysis = this.analyzePrompt(prompt);
    
    const suggestions: string[] = [];
    if (!analysis.hasSubject) suggestions.push("Consider adding a clear main subject");
    if (!analysis.hasAction) suggestions.push("Add dynamic action or movement");
    if (!analysis.hasEnvironment) suggestions.push("Specify the environment or setting");
    if (!analysis.hasLighting) suggestions.push("Include lighting preferences");

    const recommendedSettings = {
      style: analysis.complexity === "complex" ? "cinematic" : "realistic",
      duration: analysis.wordCount > 20 ? 8 : 5,
      resolution: "1080p",
      frameRate: 30,
    };

    const qualityTips = [
      "Use specific, descriptive language for better results",
      "Include camera angle preferences (close-up, wide shot, etc.)",
      "Specify lighting conditions for better visual quality",
      "Add motion descriptions for dynamic scenes",
      "Consider color palette preferences"
    ];

    return {
      suggestions,
      recommendedSettings,
      qualityTips,
    };
  }
}

export const freePromptEnhancerService = new FreePromptEnhancerService();