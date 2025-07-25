import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
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

import { Link } from "wouter";
import { TemplateSelector } from "@/components/template-selector";
import { SceneEditor } from "@/components/scene-editor";
import { VideoPreview } from "@/components/video-preview";
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
  Settings,
  CheckCircle,
  Palette,
  Zap,
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
  Wand2
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
  const [voiceProvider, setVoiceProvider] = useState("english");
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
      setPrompt(data.enhancedPrompt || data.enhancedText);
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

      // Use direct video generation
      const generationResponse = await apiRequest("POST", "/api/generate-video-direct", {
        prompt,
        style,
        duration: parseInt(duration),
        resolution,
        aspectRatio
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
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Free Notice */}


        {/* Main Layout */}
        <div className="grid grid-cols-12 gap-6 mt-6">
          {/* Left Sidebar - Text to Video */}
          <div className="col-span-3">
            <Card className="bg-slate-900 border-slate-700">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6 text-slate-100">Text to Video</h2>
                
                {/* Prompt Input */}
                <div className="mb-6">
                  <Label className="text-sm font-medium text-slate-300 mb-2 block">Video Prompt</Label>
                  <Textarea
                    className="w-full h-32 bg-slate-800 border-slate-600 focus:border-purple-500 resize-none text-slate-100 placeholder-slate-500"
                    placeholder="Describe your video: A golden retriever playing in a field of sunflowers at sunset, with gentle wind blowing through the flowers..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                    onClick={() => enhancePromptMutation.mutate(prompt)}
                    disabled={!prompt.trim() || enhancePromptMutation.isPending}
                  >
                    <WandSparkles size={14} className="mr-1" />
                    {enhancePromptMutation.isPending ? "Enhancing..." : "Enhance with AI"}
                  </Button>
                </div>

                {/* Style and Duration */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div>
                    <Label className="text-sm font-medium text-slate-300 mb-2 block">Style</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 focus:border-purple-500 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="cinematic" className="text-slate-100 focus:bg-slate-700">Cinematic</SelectItem>
                        <SelectItem value="realistic" className="text-slate-100 focus:bg-slate-700">Realistic</SelectItem>
                        <SelectItem value="animated" className="text-slate-100 focus:bg-slate-700">Animated</SelectItem>
                        <SelectItem value="documentary" className="text-slate-100 focus:bg-slate-700">Documentary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-300 mb-2 block">Duration</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 focus:border-purple-500 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="4" className="text-slate-100 focus:bg-slate-700">4 seconds</SelectItem>
                        <SelectItem value="8" className="text-slate-100 focus:bg-slate-700">8 seconds</SelectItem>
                        <SelectItem value="16" className="text-slate-100 focus:bg-slate-700">16 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Resolution and Aspect Ratio */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div>
                    <Label className="text-sm font-medium text-slate-300 mb-2 block">Resolution</Label>
                    <Select value={resolution} onValueChange={setResolution}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 focus:border-purple-500 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="720p" className="text-slate-100 focus:bg-slate-700">720p HD</SelectItem>
                        <SelectItem value="1080p" className="text-slate-100 focus:bg-slate-700">1080p FHD</SelectItem>
                        <SelectItem value="4k" className="text-slate-100 focus:bg-slate-700">4K UHD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-300 mb-2 block">Aspect</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 focus:border-purple-500 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="16:9" className="text-slate-100 focus:bg-slate-700">16:9</SelectItem>
                        <SelectItem value="9:16" className="text-slate-100 focus:bg-slate-700">9:16</SelectItem>
                        <SelectItem value="1:1" className="text-slate-100 focus:bg-slate-700">1:1</SelectItem>
                        <SelectItem value="4:3" className="text-slate-100 focus:bg-slate-700">4:3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Generate Button */}
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
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
            </Card>
          </div>

          {/* Center - Video Preview */}
          <div className="col-span-6">
            {/* Premium Quality Banner */}
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 rounded-full px-4 py-2 mb-4">
                <Crown className="text-purple-400" size={16} />
                <span className="text-sm font-medium text-purple-300">Premium Quality - 100% Free</span>
              </div>
              <h2 className="text-3xl font-bold mb-2">Professional AI Video Generation</h2>
              <p className="text-gray-400">Achieve Google Veo 3 level quality using completely free, open-source tools</p>
            </div>

            {/* Video Preview Container */}
            <Card className="bg-slate-900 border-slate-700 mb-6">
              <div className="p-6">
                <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video border border-slate-600">
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
                        <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                          <Play className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-xl font-medium text-slate-300 mb-2">
                          {currentJob ? "Generating Video..." : "Ready to Generate"}
                        </h3>
                        <p className="text-slate-500 text-sm max-w-md">
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
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-200">
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
                  </div>
                )}
              </div>
            </Card>

            {/* Action Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card className="bg-slate-900 border-slate-700 p-4 text-center hover:bg-slate-800 transition-colors cursor-pointer">
                <WandSparkles className="mx-auto text-blue-400 mb-2" size={24} />
                <div className="text-sm font-medium text-slate-200">Enhance with AI</div>
                <div className="text-xs text-slate-400">English & Hindi</div>
              </Card>
              <Card className="bg-slate-900 border-slate-700 p-4 text-center hover:bg-slate-800 transition-colors cursor-pointer">
                <Video className="mx-auto text-green-400 mb-2" size={24} />
                <div className="text-sm font-medium text-slate-200">Ultra HD Quality</div>
                <div className="text-xs text-slate-400">Up to 4K</div>
              </Card>
              <Card className="bg-slate-900 border-slate-700 p-4 text-center hover:bg-slate-800 transition-colors cursor-pointer">
                <Palette className="mx-auto text-purple-400 mb-2" size={24} />
                <div className="text-sm font-medium text-slate-200">Professional Look</div>
                <div className="text-xs text-slate-400">Cinema Grade</div>
              </Card>
              <Card className="bg-slate-900 border-slate-700 p-4 text-center hover:bg-slate-800 transition-colors cursor-pointer">
                <Zap className="mx-auto text-yellow-400 mb-2" size={24} />
                <div className="text-sm font-medium text-slate-200">Completely Free</div>
                <div className="text-xs text-slate-400">No API Keys</div>
              </Card>
            </div>

            {/* Bottom Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
                <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-slate-100">Overview</TabsTrigger>
                <TabsTrigger value="voices" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-slate-100">Premium TTS</TabsTrigger>
                <TabsTrigger value="video" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-slate-100">Video Tools</TabsTrigger>
                <TabsTrigger value="setup" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-slate-100">Setup Guide</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4">
                <Card className="bg-slate-900 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-slate-100">What You Get</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-400" size={16} />
                      <span className="text-sm text-slate-300">High-quality English and Hindi voice synthesis</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-400" size={16} />
                      <span className="text-sm text-slate-300">Professional-grade video generation up to 4K</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-400" size={16} />
                      <span className="text-sm text-slate-300">Cinema-quality color grading and effects</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-400" size={16} />
                      <span className="text-sm text-slate-300">No subscriptions, API keys, or hidden costs</span>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - AI Voice & Audio */}
          <div className="col-span-3">
            <Card className="bg-slate-900 border-slate-700">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6 text-slate-100">AI Voice & Audio</h2>
                
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
                    <TabsTrigger value="voice" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-slate-100">AI Voice</TabsTrigger>
                    <TabsTrigger value="audio" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-slate-100">Audio</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="voice" className="space-y-4 mt-4">
                    {/* Language Selection */}
                    <div>
                      <Label className="text-sm font-medium text-gray-300 mb-2 block">Language</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={voiceProvider === "english" ? "default" : "outline"}
                          className={voiceProvider === "english" ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-900 border-gray-600 hover:border-purple-500"}
                          onClick={() => setVoiceProvider("english")}
                        >
                          🇺🇸 English
                        </Button>
                        <Button
                          variant={voiceProvider === "hindi" ? "default" : "outline"}
                          className={voiceProvider === "hindi" ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-900 border-gray-600 hover:border-purple-500"}
                          onClick={() => setVoiceProvider("hindi")}
                        >
                          🇮🇳 Hindi
                        </Button>
                      </div>
                    </div>

                    {/* Voice Selection */}
                    <div>
                      <Label className="text-sm font-medium text-gray-300 mb-2 block">
                        Premium {voiceProvider === "english" ? "English" : "Hindi"} Voices
                        <span className="text-xs text-green-400 ml-2">100% FREE</span>
                      </Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {voices
                          ?.filter((voice: any) => voice.language === (voiceProvider === "english" ? "en" : "hi"))
                          ?.sort((a: any, b: any) => {
                            if (a.quality === "premium" && b.quality !== "premium") return -1;
                            if (b.quality === "premium" && a.quality !== "premium") return 1;
                            return 0;
                          })
                          ?.map((voice: any) => (
                          <div
                            key={voice.id}
                            className={`bg-gray-900 border rounded-lg p-3 cursor-pointer transition-colors ${
                              selectedVoice === voice.id ? "border-purple-500 bg-purple-500/10" : "border-gray-600 hover:border-purple-500"
                            }`}
                            onClick={() => setSelectedVoice(voice.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium">{voice.name}</div>
                                  {voice.quality === "premium" && (
                                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                                      PREMIUM
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {voice.gender === "female" ? "👩" : "👨"} {voice.description}
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
                                className="hover:bg-purple-500/20"
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
                      <Label className="text-sm font-medium text-gray-300 mb-2 block">Voice Script</Label>
                      <Textarea
                        className="w-full h-20 bg-gray-900 border-gray-600 focus:border-purple-500 resize-none"
                        placeholder="Enter the text for AI voice narration..."
                        value={voiceScript}
                        onChange={(e) => setVoiceScript(e.target.value)}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="audio" className="space-y-4 mt-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Background Music</h4>
                      <div className="space-y-2">
                        {backgroundMusic?.map((track: any) => (
                          <div
                            key={track.id}
                            className={`bg-gray-900 border rounded-lg p-3 cursor-pointer transition-colors ${
                              selectedBGM === track.id ? "border-purple-500" : "border-gray-600 hover:border-purple-500"
                            }`}
                            onClick={() => setSelectedBGM(track.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">{track.name}</div>
                                <div className="text-xs text-gray-400">
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
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
