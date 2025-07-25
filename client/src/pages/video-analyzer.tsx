import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Video, 
  AudioLines, 
  Settings, 
  Download, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Sparkles,
  Target
} from "lucide-react";

interface VideoAnalysis {
  analysis: {
    duration: number;
    resolution: { width: number; height: number };
    frameRate: number;
    bitrate: number;
    codecInfo: { video: string; audio: string };
    audioChannels: number;
    audioSampleRate: number;
    quality: {
      estimatedCRF: number;
      colorSpace: string;
      dynamicRange: string;
    };
    visualElements: {
      hasMotionBlur: boolean;
      hasCameraMovement: boolean;
      lightingQuality: "low" | "medium" | "high";
      colorGrading: string;
      visualEffects: string[];
    };
    audioFeatures: {
      hasVoiceover: boolean;
      hasBackgroundMusic: boolean;
      hasSoundEffects: boolean;
      audioQuality: "low" | "medium" | "high";
    };
  };
  qualityReport: string;
  recommendedSettings: any;
}

interface ReferenceAnalysis {
  commonSpecs: any;
  qualityBenchmark: any;
  recommendedPipeline: any;
  freeAlternatives: string[];
}

export default function VideoAnalyzer() {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysis | null>(null);
  const [referenceAnalysis, setReferenceAnalysis] = useState<ReferenceAnalysis | null>(null);
  const [implementationGuide, setImplementationGuide] = useState<string>("");

  // Single video analysis mutation
  const analyzeSingleVideoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("video", file);

      const response = await fetch("/api/analyze-video", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze video");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: "Video Analyzed Successfully",
        description: "Your video has been analyzed for quality and technical specifications.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze video",
        variant: "destructive",
      });
    },
  });

  // Reference videos analysis mutation
  const analyzeReferenceVideosMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append("videos", file));

      const response = await fetch("/api/analyze-reference-videos", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze reference videos");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setReferenceAnalysis(data);
      toast({
        title: "Reference Videos Analyzed",
        description: "Analysis complete. You can now see the quality benchmarks and free alternatives.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze reference videos",
        variant: "destructive",
      });
    },
  });

  // Get implementation guide mutation
  const getImplementationGuideMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/free-video-guide");
      return response.json();
    },
    onSuccess: (data) => {
      setImplementationGuide(data.guide);
      toast({
        title: "Implementation Guide Ready",
        description: "Complete guide for free professional video generation is now available.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Load Guide",
        description: error instanceof Error ? error.message : "Could not load implementation guide",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (files: FileList | null, multiple: boolean = false) => {
    if (!files || files.length === 0) return;

    if (multiple) {
      setSelectedFiles(Array.from(files));
    } else {
      setSingleFile(files[0]);
    }
  };

  const getQualityBadge = (quality: string) => {
    const colors = {
      high: "bg-green-500",
      medium: "bg-yellow-500",
      low: "bg-red-500",
    };
    return colors[quality as keyof typeof colors] || "bg-gray-500";
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-primary text-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent to-purple-600 rounded-lg flex items-center justify-center">
              <Video className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Professional Video Analyzer</h1>
              <p className="text-slate-400">Analyze your reference videos and get free implementation guides</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="single" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="single" className="data-[state=active]:bg-accent">
              <Video className="w-4 h-4 mr-2" />
              Single Video Analysis
            </TabsTrigger>
            <TabsTrigger value="reference" className="data-[state=active]:bg-accent">
              <Target className="w-4 h-4 mr-2" />
              Reference Videos
            </TabsTrigger>
            <TabsTrigger value="guide" className="data-[state=active]:bg-accent">
              <Sparkles className="w-4 h-4 mr-2" />
              Free Implementation Guide
            </TabsTrigger>
          </TabsList>

          {/* Single Video Analysis */}
          <TabsContent value="single" className="space-y-6">
            <Card className="bg-secondary border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-accent" />
                  <span>Upload Video for Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Video File</Label>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="bg-primary border-slate-600 focus:border-accent"
                  />
                  {singleFile && (
                    <div className="mt-2 p-3 bg-primary rounded border border-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{singleFile.name}</span>
                        <Badge variant="outline">{formatFileSize(singleFile.size)}</Badge>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => singleFile && analyzeSingleVideoMutation.mutate(singleFile)}
                  disabled={!singleFile || analyzeSingleVideoMutation.isPending}
                  className="w-full bg-accent hover:bg-purple-700"
                >
                  {analyzeSingleVideoMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2" />
                      Analyzing Video...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Analyze Video Quality
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysisResult && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-secondary border-slate-700">
                  <CardHeader>
                    <CardTitle>Technical Specifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-400">Resolution</Label>
                        <p className="font-mono">{analysisResult.analysis.resolution.width}x{analysisResult.analysis.resolution.height}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400">Frame Rate</Label>
                        <p className="font-mono">{analysisResult.analysis.frameRate} fps</p>
                      </div>
                      <div>
                        <Label className="text-slate-400">Duration</Label>
                        <p className="font-mono">{analysisResult.analysis.duration.toFixed(2)}s</p>
                      </div>
                      <div>
                        <Label className="text-slate-400">Bitrate</Label>
                        <p className="font-mono">{(analysisResult.analysis.bitrate / 1000000).toFixed(1)} Mbps</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-400">Quality Assessment</Label>
                      <div className="flex items-center space-x-2">
                        <Badge className={getQualityBadge(analysisResult.analysis.audioFeatures.audioQuality)}>
                          Audio: {analysisResult.analysis.audioFeatures.audioQuality.toUpperCase()}
                        </Badge>
                        <Badge className={getQualityBadge(analysisResult.analysis.visualElements.lightingQuality)}>
                          Visual: {analysisResult.analysis.visualElements.lightingQuality.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-secondary border-slate-700">
                  <CardHeader>
                    <CardTitle>Features Detected</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        {analysisResult.analysis.audioFeatures.hasVoiceover ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm">Voiceover</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {analysisResult.analysis.audioFeatures.hasBackgroundMusic ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm">Background Music</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {analysisResult.analysis.visualElements.hasMotionBlur ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm">Motion Blur</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {analysisResult.analysis.visualElements.hasCameraMovement ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm">Camera Movement</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-slate-400">Visual Effects</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {analysisResult.analysis.visualElements.visualEffects.map((effect, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {effect.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-secondary border-slate-700 lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Quality Report & Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-primary p-4 rounded border border-slate-600 overflow-auto whitespace-pre-wrap">
                      {analysisResult.qualityReport}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Reference Videos Analysis */}
          <TabsContent value="reference" className="space-y-6">
            <Card className="bg-secondary border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-accent" />
                  <span>Upload Reference Videos</span>
                </CardTitle>
                <p className="text-sm text-slate-400">
                  Upload multiple videos to analyze quality patterns and get customized free alternatives
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Video Files (Max 5)</Label>
                  <Input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files, true)}
                    className="bg-primary border-slate-600 focus:border-accent"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="p-3 bg-primary rounded border border-slate-600">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{file.name}</span>
                            <Badge variant="outline">{formatFileSize(file.size)}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => selectedFiles.length > 0 && analyzeReferenceVideosMutation.mutate(selectedFiles)}
                  disabled={selectedFiles.length === 0 || analyzeReferenceVideosMutation.isPending}
                  className="w-full bg-accent hover:bg-purple-700"
                >
                  {analyzeReferenceVideosMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2" />
                      Analyzing Reference Videos...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Analyze Reference Videos ({selectedFiles.length})
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Reference Analysis Results */}
            {referenceAnalysis && (
              <div className="space-y-6">
                <Card className="bg-secondary border-slate-700">
                  <CardHeader>
                    <CardTitle>Quality Benchmark</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-slate-400">Target Resolution</Label>
                        <p className="font-mono">
                          {referenceAnalysis.commonSpecs.resolution?.width || 1920}x
                          {referenceAnalysis.commonSpecs.resolution?.height || 1080}
                        </p>
                      </div>
                      <div>
                        <Label className="text-slate-400">Target Bitrate</Label>
                        <p className="font-mono">
                          {((referenceAnalysis.commonSpecs.bitrate || 8000000) / 1000000).toFixed(1)} Mbps
                        </p>
                      </div>
                      <div>
                        <Label className="text-slate-400">Frame Rate</Label>
                        <p className="font-mono">{referenceAnalysis.commonSpecs.frameRate || 30} fps</p>
                      </div>
                      <div>
                        <Label className="text-slate-400">Audio Quality</Label>
                        <Badge className={getQualityBadge(referenceAnalysis.commonSpecs.audioQuality || "high")}>
                          {(referenceAnalysis.commonSpecs.audioQuality || "high").toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-secondary border-slate-700">
                  <CardHeader>
                    <CardTitle>Recommended Free Pipeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-400">Text-to-Video</Label>
                        <p className="font-mono text-accent">{referenceAnalysis.recommendedPipeline.textToVideo}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400">Voice Synthesis</Label>
                        <p className="font-mono text-accent">{referenceAnalysis.recommendedPipeline.voiceSynthesis}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400">Avatar Generation</Label>
                        <p className="font-mono text-accent">{referenceAnalysis.recommendedPipeline.avatarGeneration}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400">Video Enhancement</Label>
                        <p className="font-mono text-accent">{referenceAnalysis.recommendedPipeline.videoEnhancement}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-secondary border-slate-700">
                  <CardHeader>
                    <CardTitle>Free Alternatives (100% Cost-Free)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {referenceAnalysis.freeAlternatives.map((alternative, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-primary rounded border border-slate-600">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{alternative}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Implementation Guide */}
          <TabsContent value="guide" className="space-y-6">
            <Card className="bg-secondary border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <span>Free Professional Video Generation Guide</span>
                </CardTitle>
                <p className="text-sm text-slate-400">
                  Complete implementation guide for achieving professional quality video generation at zero cost
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => getImplementationGuideMutation.mutate()}
                  disabled={getImplementationGuideMutation.isPending}
                  className="w-full bg-accent hover:bg-purple-700"
                >
                  {getImplementationGuideMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2" />
                      Loading Implementation Guide...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Get Free Implementation Guide
                    </>
                  )}
                </Button>

                {implementationGuide && (
                  <div className="mt-6">
                    <Card className="bg-primary border-slate-700">
                      <CardContent className="p-6">
                        <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-96">
                          {implementationGuide}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}