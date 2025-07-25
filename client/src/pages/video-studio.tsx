import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TemplateSelector } from "@/components/template-selector";
import { SceneEditor } from "@/components/scene-editor";
import { VideoPreview } from "@/components/video-preview";
import { ttsEngine } from "@/lib/tts-engine";
import { ffmpegProcessor } from "@/lib/ffmpeg-processor";
import { 
  Play, 
  Pause, 
  Download, 
  Share2, 
  WandSparkles,
  Settings,
  Plus,
  Sparkles,
  FileText,
  Mic,
  Music,
  Eye,
  Save,
  Upload,
  Clock,
  Target,
  Layers,
  Camera,
  Wand2,
  Volume2,
  Film,
  Palette,
  Zap
} from "lucide-react";

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

interface ProjectSettings {
  title: string;
  resolution: '720p' | '1080p' | '4k';
  frameRate: number;
  backgroundMusic?: string;
  backgroundMusicVolume: number;
  subtitlesEnabled: boolean;
  outputFormat: 'mp4' | 'webm';
}

export default function VideoStudio() {
  const { toast } = useToast();
  
  // Project state
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    title: "Untitled Project",
    resolution: '1080p',
    frameRate: 30,
    backgroundMusicVolume: 30,
    subtitlesEnabled: true,
    outputFormat: 'mp4'
  });

  // Template and scenes
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [fullScript, setFullScript] = useState("");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedThumbnailUrl, setGeneratedThumbnailUrl] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState("template");
  const [previewMode, setPreviewMode] = useState<'scenes' | 'timeline'>('scenes');

  // Queries
  const { data: voices = [] } = useQuery({
    queryKey: ["/api/voices"],
    queryFn: () => fetch("/api/voices").then(res => res.json()),
  });

  const { data: backgroundMusicTracks = [] } = useQuery({
    queryKey: ["/api/background-music"],
    queryFn: () => fetch("/api/background-music").then(res => res.json()),
  });

  // Parse script into scenes
  const parseScriptIntoScenes = (script: string) => {
    const lines = script.split('\n').filter(line => line.trim());
    const newScenes: Scene[] = [];
    
    lines.forEach((line, index) => {
      if (line.trim()) {
        const scene: Scene = {
          id: `scene-${Date.now()}-${index}`,
          title: `Scene ${index + 1}`,
          text: line.trim(),
          background: 'gradient',
          voiceId: voices[0]?.id || '',
          duration: Math.max(3, Math.min(10, line.length * 0.1)),
          textStyle: 'fade-in',
          audioEnabled: true
        };
        newScenes.push(scene);
      }
    });
    
    setScenes(newScenes);
    if (newScenes.length > 0) {
      setActiveTab("scenes");
    }
  };

  // Template selection handler
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    if (templateId === "custom") {
      setActiveTab("script");
    } else {
      // Apply template settings
      const templateScenes = getTemplateScenes(templateId);
      setScenes(templateScenes);
      setActiveTab("scenes");
    }
  };

  // Get template-specific scenes
  const getTemplateScenes = (templateId: string): Scene[] => {
    const templates = {
      "interview": [
        { text: "Welcome to our interview today", duration: 3 },
        { text: "Let me ask you about your experience", duration: 4 },
        { text: "That's a fascinating perspective", duration: 3 }
      ],
      "story": [
        { text: "Once upon a time, in a world not so different from ours", duration: 5 },
        { text: "Our hero faced an incredible challenge", duration: 4 },
        { text: "But with determination and courage", duration: 4 },
        { text: "They discovered the power within themselves", duration: 4 },
        { text: "And changed everything forever", duration: 3 }
      ],
      "marketing": [
        { text: "Introducing the future of innovation", duration: 4 },
        { text: "Experience unprecedented quality and performance", duration: 4 },
        { text: "Join thousands of satisfied customers today", duration: 4 },
        { text: "Don't wait - transform your life now!", duration: 3 }
      ]
    };

    const template = templates[templateId as keyof typeof templates] || [];
    return template.map((scene, index) => ({
      id: `scene-${Date.now()}-${index}`,
      title: `Scene ${index + 1}`,
      text: scene.text,
      background: 'gradient',
      voiceId: voices[0]?.id || '',
      duration: scene.duration,
      textStyle: 'fade-in',
      audioEnabled: true
    }));
  };

  // Generate video mutation
  const generateVideoMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      setGenerationProgress(0);
      setCurrentStep("Initializing video generation...");

      try {
        // Step 1: Generate audio for all scenes
        setCurrentStep("Generating voice audio...");
        const audioMap = await ttsEngine.generateSceneAudio(
          scenes.map(scene => ({
            text: scene.text,
            voiceId: scene.voiceId,
            duration: scene.duration
          }))
        );

        // Step 2: Prepare scenes with audio files
        const scenesWithAudio = scenes.map(scene => ({
          ...scene,
          audioFile: audioMap.get(scene.text) ? URL.createObjectURL(audioMap.get(scene.text)!) : undefined
        }));

        setGenerationProgress(30);
        setCurrentStep("Processing video scenes...");

        // Step 3: Generate video using FFmpeg
        const videoBlob = await ffmpegProcessor.generateVideo({
          scenes: scenesWithAudio,
          resolution: projectSettings.resolution,
          frameRate: projectSettings.frameRate,
          backgroundMusic: projectSettings.backgroundMusic,
          backgroundMusicVolume: projectSettings.backgroundMusicVolume,
          outputFormat: projectSettings.outputFormat
        }, (progress) => {
          setGenerationProgress(30 + (progress * 0.6));
        });

        setCurrentStep("Generating thumbnail...");
        setGenerationProgress(90);

        // Step 4: Generate thumbnail
        const thumbnailBlob = await ffmpegProcessor.generateThumbnail(videoBlob);

        setCurrentStep("Finalizing...");
        setGenerationProgress(100);

        // Create URLs for the generated content
        const videoUrl = URL.createObjectURL(videoBlob);
        const thumbnailUrl = URL.createObjectURL(thumbnailBlob);

        setGeneratedVideoUrl(videoUrl);
        setGeneratedThumbnailUrl(thumbnailUrl);
        setActiveTab("preview");

        return { videoUrl, thumbnailUrl };

      } catch (error) {
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Video Generated Successfully!",
        description: "Your video is ready for preview and download.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate video",
        variant: "destructive",
      });
    },
  });

  // Save project
  const saveProject = () => {
    const project = {
      id: Date.now().toString(),
      title: projectSettings.title,
      settings: projectSettings,
      scenes,
      template: selectedTemplate,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(`video-project-${project.id}`, JSON.stringify(project));
    
    toast({
      title: "Project Saved",
      description: "Your project has been saved locally.",
    });
  };

  // Download video
  const handleDownload = () => {
    if (generatedVideoUrl) {
      const a = document.createElement('a');
      a.href = generatedVideoUrl;
      a.download = `${projectSettings.title}.${projectSettings.outputFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Share video
  const handleShare = () => {
    if (generatedVideoUrl) {
      navigator.share?.({
        title: projectSettings.title,
        text: "Check out this AI-generated video!",
        url: generatedVideoUrl
      }).catch(() => {
        navigator.clipboard.writeText(generatedVideoUrl);
        toast({
          title: "Link Copied",
          description: "Video link copied to clipboard.",
        });
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Video Studio
          </h1>
          <p className="text-muted-foreground">Create professional videos with Google VEO3-level quality</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <Zap className="h-3 w-3" />
            100% Free
          </Badge>
          <Button onClick={saveProject} variant="outline" className="gap-2">
            <Save className="h-4 w-4" />
            Save Project
          </Button>
          <Button
            onClick={() => generateVideoMutation.mutate()}
            disabled={isGenerating || scenes.length === 0}
            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isGenerating ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Generate Video
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Creation Tools */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="template" className="gap-2">
                <Target className="h-4 w-4" />
                Template
              </TabsTrigger>
              <TabsTrigger value="script" className="gap-2">
                <FileText className="h-4 w-4" />
                Script
              </TabsTrigger>
              <TabsTrigger value="scenes" className="gap-2">
                <Layers className="h-4 w-4" />
                Scenes
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            {/* Template Selection */}
            <TabsContent value="template">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Choose Your Style
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TemplateSelector
                    selectedTemplate={selectedTemplate}
                    onTemplateSelect={handleTemplateSelect}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Script Input */}
            <TabsContent value="script">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Write Your Script
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Video Script</Label>
                    <Textarea
                      value={fullScript}
                      onChange={(e) => setFullScript(e.target.value)}
                      placeholder="Write your video script here. Each line will become a scene..."
                      rows={10}
                      className="min-h-[200px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => parseScriptIntoScenes(fullScript)}
                      disabled={!fullScript.trim()}
                      className="gap-2"
                    >
                      <Wand2 className="h-4 w-4" />
                      Parse into Scenes
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <WandSparkles className="h-4 w-4" />
                      AI Enhance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scene Editor */}
            <TabsContent value="scenes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Scene Editor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SceneEditor
                    scenes={scenes}
                    onScenesChange={setScenes}
                    voices={voices}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Film className="h-5 w-5" />
                      Video Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Project Title</Label>
                        <Input
                          value={projectSettings.title}
                          onChange={(e) => setProjectSettings(prev => ({
                            ...prev,
                            title: e.target.value
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Output Format</Label>
                        <Select
                          value={projectSettings.outputFormat}
                          onValueChange={(value: 'mp4' | 'webm') => 
                            setProjectSettings(prev => ({ ...prev, outputFormat: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mp4">MP4 (Recommended)</SelectItem>
                            <SelectItem value="webm">WebM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Resolution</Label>
                        <Select
                          value={projectSettings.resolution}
                          onValueChange={(value: '720p' | '1080p' | '4k') => 
                            setProjectSettings(prev => ({ ...prev, resolution: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="720p">720p HD</SelectItem>
                            <SelectItem value="1080p">1080p Full HD</SelectItem>
                            <SelectItem value="4k">4K Ultra HD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Frame Rate</Label>
                        <Select
                          value={projectSettings.frameRate.toString()}
                          onValueChange={(value) => 
                            setProjectSettings(prev => ({ ...prev, frameRate: parseInt(value) }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="24">24 fps (Cinema)</SelectItem>
                            <SelectItem value="30">30 fps (Standard)</SelectItem>
                            <SelectItem value="60">60 fps (Smooth)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      Audio Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Background Music</Label>
                      <Select
                        value={projectSettings.backgroundMusic || ""}
                        onValueChange={(value) => 
                          setProjectSettings(prev => ({ ...prev, backgroundMusic: value || undefined }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select background music" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Background Music</SelectItem>
                          {backgroundMusicTracks.map((track: any) => (
                            <SelectItem key={track.id} value={track.url}>
                              {track.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Background Music Volume</Label>
                      <Slider
                        value={[projectSettings.backgroundMusicVolume]}
                        onValueChange={(value) => 
                          setProjectSettings(prev => ({ ...prev, backgroundMusicVolume: value[0] }))
                        }
                        max={100}
                        step={5}
                        className="pt-2"
                      />
                      <div className="text-center text-sm text-muted-foreground">
                        {projectSettings.backgroundMusicVolume}%
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Enable Subtitles</Label>
                      <Switch
                        checked={projectSettings.subtitlesEnabled}
                        onCheckedChange={(checked) => 
                          setProjectSettings(prev => ({ ...prev, subtitlesEnabled: checked }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Preview */}
            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Video Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VideoPreview
                    videoUrl={generatedVideoUrl || undefined}
                    thumbnailUrl={generatedThumbnailUrl || undefined}
                    isGenerating={isGenerating}
                    progress={generationProgress}
                    currentStep={currentStep}
                    onDownload={handleDownload}
                    onShare={handleShare}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Quick Stats & Info */}
        <div className="space-y-6">
          {/* Project Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Scenes</span>
                <Badge variant="outline">{scenes.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Duration</span>
                <Badge variant="outline">
                  {scenes.reduce((acc, scene) => acc + scene.duration, 0)}s
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Resolution</span>
                <Badge variant="outline">{projectSettings.resolution}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Output</span>
                <Badge variant="outline">{projectSettings.outputFormat.toUpperCase()}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Upload className="h-4 w-4" />
                Import Project
              </Button>
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Camera className="h-4 w-4" />
                Add Media
              </Button>
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Palette className="h-4 w-4" />
                Style Presets
              </Button>
            </CardContent>
          </Card>

          {/* Generation Progress */}
          {isGenerating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 animate-spin" />
                  Generating...
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={generationProgress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  {currentStep}
                </p>
                <div className="text-center">
                  <Badge variant="outline">
                    {Math.round(generationProgress)}% Complete
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}