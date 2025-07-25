import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Download, 
  Share2, 
  Volume2, 
  VolumeX,
  Expand,
  Sparkles,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface VideoPreviewProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  isGenerating: boolean;
  progress: number;
  currentStep: string;
  onDownload?: () => void;
  onShare?: () => void;
}

export function VideoPreview({
  videoUrl,
  thumbnailUrl,
  isGenerating,
  progress,
  currentStep,
  onDownload,
  onShare
}: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  // Generation in progress
  if (isGenerating) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-primary animate-spin" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Generating Your Video</h3>
              <p className="text-muted-foreground">{currentStep}</p>
            </div>
            
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <Badge variant="outline">{Math.round(progress)}%</Badge>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              This may take a few minutes depending on video length and quality settings.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No video generated yet
  if (!videoUrl) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Play className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No Video Generated</h3>
              <p className="text-muted-foreground">
                Add some scenes and click "Generate Video" to create your video.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Video generated successfully
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Success Banner */}
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-green-700 dark:text-green-300 font-medium">
            Video generated successfully!
          </span>
        </div>

        {/* Video Player */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            poster={thumbnailUrl}
            onEnded={handleVideoEnd}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full aspect-video"
            controls={false}
          />
          
          {/* Custom Controls Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePlayPause}
                    className="bg-black/50 hover:bg-black/70"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleMuteToggle}
                    className="bg-black/50 hover:bg-black/70"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleFullscreen}
                  className="bg-black/50 hover:bg-black/70"
                >
                  <Expand className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={onDownload}
            className="flex-1 gap-2"
          >
            <Download className="h-4 w-4" />
            Download Video
          </Button>
          
          <Button
            onClick={onShare}
            variant="outline"
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Video Info */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-sm font-medium">Format</div>
            <div className="text-xs text-muted-foreground">MP4</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium">Quality</div>
            <div className="text-xs text-muted-foreground">1080p</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium">Status</div>
            <Badge variant="secondary" className="text-xs gap-1">
              <CheckCircle className="h-3 w-3" />
              Ready
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}