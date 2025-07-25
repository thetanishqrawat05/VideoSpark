import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  Play, 
  Pause, 
  Download, 
  Share2, 
  Image as ImageIcon, 
  Crown, 
  User, 
  Video, 
  Volume2,
  VolumeX,
  Expand,
  WandSparkles,
  Settings
} from "lucide-react";

interface VideoProject {
  id: string;
  title: string;
  prompt: string;
  negativePrompt?: string;
  style: string;
  duration: number;
  resolution: string;
  aspectRatio: string;
  status: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  settings?: any;
}

interface Voice {
  id: string;
  name: string;
  description: string;
  provider: string;
  gender: string;
  style: string;
  language: string;
}

interface Avatar {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  style: string;
  gender: string;
}

interface GenerationJob {
  id: string;
  projectId: string;
  status: string;
  progress: number;
  currentStep: string;
  estimatedTimeRemaining: number;
  error?: string;
  result?: {
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    audioUrl?: string;
  };
}

export default function Home() {
  const { toast } = useToast();
  
  // Form state
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [style, setStyle] = useState("cinematic");
  const [duration, setDuration] = useState("8");
  const [resolution, setResolution] = useState("720p");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  
  // Camera settings
  const [cameraSettings, setCameraSettings] = useState({
    pan: false,
    zoom: false,
    tracking: false,
  });
  
  // Physics settings
  const [physicsAccuracy, setPhysicsAccuracy] = useState([80]);
  const [motionBlur, setMotionBlur] = useState([60]);
  
  // Voice settings
  const [voiceProvider, setVoiceProvider] = useState("elevenlabs");
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [voiceScript, setVoiceScript] = useState("");
  const [voiceSpeed, setVoiceSpeed] = useState([1]);
  const [voicePitch, setVoicePitch] = useState([0]);
  
  // Avatar settings
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [lipSyncQuality, setLipSyncQuality] = useState("high");
  const [eyeContact, setEyeContact] = useState(true);
  
  // Audio settings
  const [selectedBGM, setSelectedBGM] = useState<string>("");
  const [bgmVolume, setBgmVolume] = useState([30]);
  const [autoMatchEffects, setAutoMatchEffects] = useState(true);
  
  // UI state
  const [activeTab, setActiveTab] = useState("voice");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentJob, setCurrentJob] = useState<string | null>(null);

  // Queries
  const { data: voices = [] } = useQuery({
    queryKey: ["/api/voices", voiceProvider],
    queryFn: async () => {
      const response = await fetch(`/api/voices?provider=${voiceProvider}`);
      if (!response.ok) {
        throw new Error("Failed to fetch voices");
      }
      return response.json();
    },
  });

  const { data: avatars } = useQuery({
    queryKey: ["/api/avatars"],
    queryFn: () => fetch("/api/avatars").then(res => res.json()),
  });

  const { data: backgroundMusic } = useQuery({
    queryKey: ["/api/background-music"],
    queryFn: () => fetch("/api/background-music").then(res => res.json()),
  });

  const { data: soundEffects } = useQuery({
    queryKey: ["/api/sound-effects"],
    queryFn: () => fetch("/api/sound-effects").then(res => res.json()),
  });

  // Generation job status
  const { data: jobStatus, refetch: refetchJobStatus } = useQuery({
    queryKey: ["/api/generation-status", currentJob],
    queryFn: () => currentJob ? fetch(`/api/generation-status/${currentJob}`).then(res => res.json()) : null,
    enabled: !!currentJob,
    refetchInterval: currentJob ? 2000 : false,
  });

  // Mutations
  const enhancePromptMutation = useMutation({
    mutationFn: async (promptText: string) => {
      const response = await apiRequest("POST", "/api/enhance-prompt", {
        prompt: promptText,
        style,
        duration: parseInt(duration),
        resolution,
        aspectRatio,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setPrompt(data.enhancedText);
      toast({
        title: "Prompt Enhanced",
        description: "Your prompt has been enhanced with AI suggestions.",
      });
    },
    onError: (error) => {
      toast({
        title: "Enhancement Failed",
        description: error instanceof Error ? error.message : "Failed to enhance prompt",
        variant: "destructive",
      });
    },
  });

  const generateVideoMutation = useMutation({
    mutationFn: async () => {
      // First create the project
      const projectResponse = await apiRequest("POST", "/api/projects", {
        userId: "demo-user", // In a real app, this would come from auth
        title: `Generated Video ${Date.now()}`,
        prompt,
        negativePrompt,
        style,
        duration: parseInt(duration),
        resolution,
        aspectRatio,
        settings: {
          camera: cameraSettings,
          physics: {
            accuracy: physicsAccuracy[0],
            motionBlur: motionBlur[0],
          },
          voice: {
            provider: voiceProvider,
            model: selectedVoice,
            script: voiceScript,
            speed: voiceSpeed[0],
            pitch: voicePitch[0],
          },
          avatar: {
            id: selectedAvatar,
            lipSyncQuality,
            eyeContact,
          },
          audio: {
            bgmTrack: selectedBGM,
            bgmVolume: bgmVolume[0],
            soundEffects: [],
            autoMatch: autoMatchEffects,
          },
        },
      });

      const project = await projectResponse.json();

      // Then start generation
      const generationResponse = await apiRequest("POST", "/api/generate-video", {
        projectId: project.id,
      });

      return generationResponse.json();
    },
    onSuccess: (data) => {
      setCurrentJob(data.jobId);
      toast({
        title: "Video Generation Started",
        description: "Your video is being generated. This may take a few minutes.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to start video generation",
        variant: "destructive",
      });
    },
  });

  const previewVoiceMutation = useMutation({
    mutationFn: async ({ voiceId, provider }: { voiceId: string; provider: string }) => {
      const response = await apiRequest("POST", "/api/preview-voice", {
        voiceId,
        provider,
        text: voiceScript || "Hello, this is a voice preview.",
      });
      return response;
    },
    onSuccess: async (response) => {
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    },
    onError: (error) => {
      toast({
        title: "Preview Failed",
        description: error instanceof Error ? error.message : "Failed to preview voice",
        variant: "destructive",
      });
    },
  });

  // Auto-select first voice when provider changes
  useEffect(() => {
    if (voices && voices.length > 0 && !selectedVoice) {
      setSelectedVoice(voices[0].id);
    }
  }, [voices, selectedVoice]);

  // Auto-select first avatar
  useEffect(() => {
    if (avatars && avatars.length > 0 && !selectedAvatar) {
      setSelectedAvatar(avatars[0].id);
    }
  }, [avatars, selectedAvatar]);

  // Stop polling when job is complete
  useEffect(() => {
    if (jobStatus && (jobStatus.status === "completed" || jobStatus.status === "failed")) {
      if (jobStatus.status === "completed") {
        toast({
          title: "Video Generated Successfully",
          description: "Your video is ready to view and download.",
        });
      } else if (jobStatus.status === "failed") {
        toast({
          title: "Generation Failed",
          description: jobStatus.error || "Video generation failed",
          variant: "destructive",
        });
      }
    }
  }, [jobStatus, toast]);

  const handleGenerateVideo = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a video prompt to generate your video.",
        variant: "destructive",
      });
      return;
    }

    generateVideoMutation.mutate();
  };

  const handleExport = (format: string) => {
    if (jobStatus?.result?.videoUrl) {
      const link = document.createElement("a");
      link.href = jobStatus.result.videoUrl;
      link.download = `generated_video.${format}`;
      link.click();
    } else {
      toast({
        title: "No Video Available",
        description: "Please generate a video first before exporting.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-screen flex flex-col bg-primary text-slate-50">
      {/* Header */}
      <header className="bg-secondary border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-purple-600 rounded-lg flex items-center justify-center">
              <Video className="text-white" size={16} />
            </div>
            <h1 className="text-xl font-bold">VeoGen Pro</h1>
          </div>
          <nav className="hidden md:flex space-x-6 ml-8">
            <span className="text-slate-300">Dashboard</span>
            <span className="text-white border-b-2 border-accent pb-1">Generator</span>
            <Link to="/analyzer" className="text-slate-300 hover:text-white transition-colors">
              Video Analyzer
            </Link>
            <span className="text-slate-300">Gallery</span>
            <span className="text-slate-300">Settings</span>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-400">
            <span className="text-success">●</span> Credits: 1,250
          </div>
          <Button variant="default" size="sm" className="bg-accent hover:bg-purple-700">
            <Crown size={16} className="mr-2" />
            Upgrade
          </Button>
          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
            <User size={16} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Generation Controls */}
        <div className="w-80 bg-secondary border-r border-slate-700 flex flex-col">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-lg font-semibold mb-4">Text to Video</h2>
            
            {/* Prompt Input */}
            <div className="mb-4">
              <Label className="text-sm font-medium text-slate-300 mb-2">Video Prompt</Label>
              <Textarea
                className="w-full h-24 bg-primary border-slate-600 focus:border-accent resize-none"
                placeholder="Describe your video: A golden retriever playing in a field of sunflowers at sunset, with gentle wind blowing through the flowers..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-accent hover:text-accent"
                onClick={() => enhancePromptMutation.mutate(prompt)}
                disabled={!prompt.trim() || enhancePromptMutation.isPending}
              >
                <WandSparkles size={14} className="mr-1" />
                {enhancePromptMutation.isPending ? "Enhancing..." : "Enhance with AI"}
              </Button>
            </div>

            {/* Style and Duration */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <Label className="text-sm font-medium text-slate-300 mb-1">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="bg-primary border-slate-600 focus:border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cinematic">Cinematic</SelectItem>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="animated">Animated</SelectItem>
                    <SelectItem value="documentary">Documentary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-300 mb-1">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="bg-primary border-slate-600 focus:border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 seconds</SelectItem>
                    <SelectItem value="8">8 seconds</SelectItem>
                    <SelectItem value="16">16 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resolution and Aspect Ratio */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <Label className="text-sm font-medium text-slate-300 mb-1">Resolution</Label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger className="bg-primary border-slate-600 focus:border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720p">720p HD</SelectItem>
                    <SelectItem value="1080p">1080p FHD</SelectItem>
                    <SelectItem value="4k">4K UHD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-300 mb-1">Aspect</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="bg-primary border-slate-600 focus:border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="9:16">9:16</SelectItem>
                    <SelectItem value="1:1">1:1</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generate Button */}
            <Button 
              className="w-full bg-gradient-to-r from-accent to-purple-600 hover:from-purple-600 hover:to-accent text-white font-semibold"
              onClick={handleGenerateVideo}
              disabled={generateVideoMutation.isPending || !!currentJob}
            >
              {generateVideoMutation.isPending ? (
                <>Initializing...</>
              ) : currentJob ? (
                <>Generating...</>
              ) : (
                <>
                  <WandSparkles className="mr-2" size={16} />
                  Generate Video
                </>
              )}
            </Button>
          </div>

          {/* Advanced Settings */}
          <div className="p-6 overflow-y-auto">
            <h3 className="text-md font-semibold mb-4 text-slate-200">Advanced Settings</h3>
            
            {/* Camera Controls */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Camera Movement</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pan Movement</span>
                  <Switch 
                    checked={cameraSettings.pan}
                    onCheckedChange={(checked) => setCameraSettings(prev => ({ ...prev, pan: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Zoom Effects</span>
                  <Switch 
                    checked={cameraSettings.zoom}
                    onCheckedChange={(checked) => setCameraSettings(prev => ({ ...prev, zoom: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Object Tracking</span>
                  <Switch 
                    checked={cameraSettings.tracking}
                    onCheckedChange={(checked) => setCameraSettings(prev => ({ ...prev, tracking: checked }))}
                  />
                </div>
              </div>
            </div>

            {/* Physics & Realism */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Physics & Realism</h4>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-400 mb-1">Physics Accuracy</Label>
                  <Slider
                    value={physicsAccuracy}
                    onValueChange={setPhysicsAccuracy}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400 mb-1">Motion Blur</Label>
                  <Slider
                    value={motionBlur}
                    onValueChange={setMotionBlur}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Negative Prompt */}
            <div>
              <Label className="text-sm font-medium text-slate-300 mb-2">Negative Prompt</Label>
              <Textarea
                className="w-full h-16 bg-primary border-slate-600 focus:border-accent resize-none"
                placeholder="What to avoid: blurry, low quality, distorted faces..."
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col bg-primary">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Video Preview</h2>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-slate-400">
                  Status: <span className="text-slate-300">
                    {currentJob ? (jobStatus?.status || "Loading...") : "Ready"}
                  </span>
                </div>
                <Button variant="ghost" size="sm">
                  <Expand size={16} />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="w-full max-w-4xl">
              {/* Video Player Container */}
              <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video border border-slate-600">
                {jobStatus?.result?.videoUrl ? (
                  <video
                    className="w-full h-full"
                    controls
                    poster={jobStatus.result.thumbnailUrl}
                  >
                    <source src={jobStatus.result.videoUrl} type="video/mp4" />
                  </video>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Play className="text-slate-400" size={24} />
                      </div>
                      <h3 className="text-lg font-medium text-slate-300 mb-2">
                        {currentJob ? "Generating Video..." : "Ready to Generate"}
                      </h3>
                      <p className="text-slate-500 text-sm">
                        {currentJob 
                          ? jobStatus?.currentStep || "Processing your request..." 
                          : "Enter your prompt and click Generate Video to create your AI-powered video"
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Generation Progress */}
              {currentJob && jobStatus && (
                <div className="mt-6">
                  <Card className="bg-secondary border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {jobStatus.currentStep || "Processing..."}
                        </span>
                        <span className="text-sm text-slate-400">
                          {jobStatus.estimatedTimeRemaining ? 
                            `${formatTime(jobStatus.estimatedTimeRemaining)} remaining` : 
                            "Calculating time..."
                          }
                        </span>
                      </div>
                      <Progress 
                        value={jobStatus.progress || 0} 
                        className="h-2 mb-2" 
                      />
                      <div className="text-xs text-slate-400">
                        {jobStatus.currentStep || "Processing your video generation request..."}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Export Options */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="bg-secondary border-slate-600 hover:bg-slate-600 text-left p-3 h-auto"
                  onClick={() => handleExport("mp4")}
                  disabled={!jobStatus?.result?.videoUrl}
                >
                  <div className="flex flex-col items-start">
                    <Download className="text-accent mb-2" size={16} />
                    <div className="text-sm font-medium">Export MP4</div>
                    <div className="text-xs text-slate-400">Standard video format</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-secondary border-slate-600 hover:bg-slate-600 text-left p-3 h-auto"
                  onClick={() => handleExport("gif")}
                  disabled={!jobStatus?.result?.videoUrl}
                >
                  <div className="flex flex-col items-start">
                    <ImageIcon className="text-accent mb-2" size={16} />
                    <div className="text-sm font-medium">Export GIF</div>
                    <div className="text-xs text-slate-400">Animated image</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-secondary border-slate-600 hover:bg-slate-600 text-left p-3 h-auto"
                  disabled={!jobStatus?.result?.videoUrl}
                >
                  <div className="flex flex-col items-start">
                    <Share2 className="text-accent mb-2" size={16} />
                    <div className="text-sm font-medium">Share Link</div>
                    <div className="text-xs text-slate-400">Public viewing link</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - AI Voice & Audio */}
        <div className="w-80 bg-secondary border-l border-slate-700 flex flex-col">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-lg font-semibold mb-4">AI Voice & Audio</h2>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="voice">AI Voice</TabsTrigger>
                <TabsTrigger value="audio">Audio</TabsTrigger>
              </TabsList>
              
              <TabsContent value="voice" className="space-y-4 mt-4">
                {/* Voice Provider */}
                <div>
                  <Label className="text-sm font-medium text-slate-300 mb-2">Voice Provider</Label>
                  <Select value={voiceProvider} onValueChange={setVoiceProvider}>
                    <SelectTrigger className="bg-primary border-slate-600 focus:border-accent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elevenlabs">ElevenLabs (Premium)</SelectItem>
                      <SelectItem value="openai">OpenAI TTS</SelectItem>
                      <SelectItem value="google">Google Cloud TTS</SelectItem>
                      <SelectItem value="azure">Azure Cognitive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Voice Selection */}
                <div>
                  <Label className="text-sm font-medium text-slate-300 mb-2">Voice Model</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {voices?.map((voice: Voice) => (
                      <div
                        key={voice.id}
                        className={`bg-primary border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedVoice === voice.id ? "border-accent" : "border-slate-600 hover:border-accent"
                        }`}
                        onClick={() => setSelectedVoice(voice.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{voice.name}</div>
                            <div className="text-xs text-slate-400">
                              {voice.gender} • {voice.style} • {voice.language}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              previewVoiceMutation.mutate({ voiceId: voice.id, provider: voice.provider });
                            }}
                            disabled={previewVoiceMutation.isPending}
                          >
                            <Play size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voice Script */}
                <div>
                  <Label className="text-sm font-medium text-slate-300 mb-2">Voice Script</Label>
                  <Textarea
                    className="w-full h-20 bg-primary border-slate-600 focus:border-accent resize-none"
                    placeholder="Enter the text for AI voice narration..."
                    value={voiceScript}
                    onChange={(e) => setVoiceScript(e.target.value)}
                  />
                </div>

                {/* Voice Settings */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-400 mb-1">Speed</Label>
                    <Slider
                      value={voiceSpeed}
                      onValueChange={setVoiceSpeed}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400 mb-1">Pitch</Label>
                    <Slider
                      value={voicePitch}
                      onValueChange={setVoicePitch}
                      min={-20}
                      max={20}
                      className="w-full"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="audio" className="space-y-4 mt-4">
                {/* Background Music */}
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Background Music</h4>
                  <div className="space-y-2">
                    {backgroundMusic?.map((track: any) => (
                      <div
                        key={track.id}
                        className={`bg-primary border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedBGM === track.id ? "border-accent" : "border-slate-600 hover:border-accent"
                        }`}
                        onClick={() => setSelectedBGM(track.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{track.name}</div>
                            <div className="text-xs text-slate-400">
                              {track.description} • {formatTime(track.duration)}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Play size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3">
                    <Label className="text-xs text-slate-400 mb-1">BGM Volume</Label>
                    <Slider
                      value={bgmVolume}
                      onValueChange={setBgmVolume}
                      max={100}
                      className="w-full"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* AI Avatar Section */}
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-md font-semibold mb-4">AI Avatar</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {avatars?.map((avatar: Avatar) => (
                <div
                  key={avatar.id}
                  className={`bg-primary border rounded-lg p-2 cursor-pointer transition-colors ${
                    selectedAvatar === avatar.id ? "border-accent" : "border-slate-600 hover:border-accent"
                  }`}
                  onClick={() => setSelectedAvatar(avatar.id)}
                >
                  <img 
                    src={avatar.imageUrl} 
                    alt={avatar.name}
                    className="w-full h-16 object-cover rounded-md mb-2"
                  />
                  <div className="text-xs font-medium">{avatar.name}</div>
                  <div className="text-xs text-slate-400">{avatar.style}</div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Lip Sync Quality</span>
                <Select value={lipSyncQuality} onValueChange={setLipSyncQuality}>
                  <SelectTrigger className="w-20 bg-primary border-slate-600 focus:border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="fast">Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Eye Contact</span>
                <Switch checked={eyeContact} onCheckedChange={setEyeContact} />
              </div>
            </div>
          </div>

          {/* Sound Effects */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-md font-semibold mb-4">Sound & Music</h3>
            
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">Sound Effects</h4>
              <div className="grid grid-cols-2 gap-2">
                {soundEffects?.map((effect: any) => (
                  <Button
                    key={effect.id}
                    variant="outline"
                    className="bg-primary border-slate-600 hover:border-accent text-left p-2 h-auto"
                  >
                    <div>
                      <div className="text-xs font-medium">{effect.name}</div>
                      <div className="text-xs text-slate-400">{formatTime(effect.duration)}</div>
                    </div>
                  </Button>
                ))}
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-300">Auto-match Effects</span>
                <Switch checked={autoMatchEffects} onCheckedChange={setAutoMatchEffects} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
