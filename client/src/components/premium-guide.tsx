import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Star, 
  CheckCircle,
  Globe,
  Mic,
  Video,
  Palette,
  Zap,
  Crown,
  Languages
} from "lucide-react";

export function PremiumGuide() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full px-4 py-2 mb-4">
          <Crown className="text-purple-400" size={16} />
          <span className="text-sm font-medium text-purple-300">Premium Quality - 100% Free</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Professional AI Video Generation</h2>
        <p className="text-slate-400">Achieve Google Veo 3 level quality using completely free, open-source tools</p>
      </div>

      {/* Quality Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary border-slate-700 p-4 text-center">
          <Languages className="mx-auto text-blue-400 mb-2" size={24} />
          <div className="text-sm font-medium">Multilingual TTS</div>
          <div className="text-xs text-slate-400">English & Hindi</div>
        </Card>
        <Card className="bg-primary border-slate-700 p-4 text-center">
          <Video className="mx-auto text-green-400 mb-2" size={24} />
          <div className="text-sm font-medium">4K Generation</div>
          <div className="text-xs text-slate-400">Ultra HD Quality</div>
        </Card>
        <Card className="bg-primary border-slate-700 p-4 text-center">
          <Palette className="mx-auto text-purple-400 mb-2" size={24} />
          <div className="text-sm font-medium">Cinema Grading</div>
          <div className="text-xs text-slate-400">Professional Look</div>
        </Card>
        <Card className="bg-primary border-slate-700 p-4 text-center">
          <Zap className="mx-auto text-yellow-400 mb-2" size={24} />
          <div className="text-sm font-medium">No API Costs</div>
          <div className="text-xs text-slate-400">Completely Free</div>
        </Card>
      </div>

      {/* Installation Guide */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="voices">Premium TTS</TabsTrigger>
          <TabsTrigger value="video">Video Tools</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card className="bg-primary border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-4">What You Get</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-400" size={16} />
                <span className="text-sm">High-quality English and Hindi voice synthesis</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-400" size={16} />
                <span className="text-sm">Professional-grade video generation up to 4K</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-400" size={16} />
                <span className="text-sm">Cinema-quality color grading and effects</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-400" size={16} />
                <span className="text-sm">Advanced audio processing and mastering</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-400" size={16} />
                <span className="text-sm">No subscriptions, API keys, or hidden costs</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="voices" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-primary border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="text-blue-400" size={16} />
                <h4 className="font-semibold">English Voices</h4>
                <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">Premium</span>
              </div>
              <div className="space-y-2 text-sm">
                <div>• <strong>Sarah Professional</strong> - High-quality female voice with natural intonation</div>
                <div>• <strong>David Professional</strong> - Deep male voice with clear articulation</div>
                <div>• <strong>Emma Natural</strong> - Expressive female voice with emotional range</div>
                <div>• <strong>Marcus Narrator</strong> - Professional male narrator voice</div>
              </div>
            </Card>
            
            <Card className="bg-primary border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Languages className="text-orange-400" size={16} />
                <h4 className="font-semibold">Hindi Voices</h4>
                <span className="bg-orange-500/20 text-orange-300 text-xs px-2 py-1 rounded-full">Premium</span>
              </div>
              <div className="space-y-2 text-sm">
                <div>• <strong>Priya Hindi</strong> - Natural female Hindi voice with proper pronunciation</div>
                <div>• <strong>Arjun Hindi</strong> - Clear male Hindi voice with authentic accent</div>
                <div>• <strong>Kavya Professional</strong> - Professional female Hindi for business content</div>
                <div>• <strong>Vikram Narrator</strong> - Authoritative male Hindi for narration</div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="video" className="space-y-4 mt-4">
          <Card className="bg-primary border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Professional Video Generation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-purple-300 mb-2">Ultra Quality (4K)</h4>
                <div className="text-sm text-slate-400 space-y-1">
                  <div>• Resolution: 3840x2160</div>
                  <div>• Bitrate: 50 Mbps</div>
                  <div>• Frame Rate: 60fps</div>
                  <div>• Color: Rec.2020 HDR</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-300 mb-2">Professional (1080p)</h4>
                <div className="text-sm text-slate-400 space-y-1">
                  <div>• Resolution: 1920x1080</div>
                  <div>• Bitrate: 20 Mbps</div>
                  <div>• Frame Rate: 30fps</div>
                  <div>• Color: Rec.709</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-green-300 mb-2">Broadcast (Cinema)</h4>
                <div className="text-sm text-slate-400 space-y-1">
                  <div>• Resolution: 1920x1080</div>
                  <div>• Bitrate: 15 Mbps</div>
                  <div>• Frame Rate: 24fps</div>
                  <div>• Color: DCI-P3</div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-4 mt-4">
          <Card className="bg-primary border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Setup Guide</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-accent mb-2">1. Install High-Quality TTS Engines</h4>
                <div className="bg-slate-800 rounded p-3 text-sm font-mono">
                  <div># For premium English and Hindi voices</div>
                  <div>pip install TTS</div>
                  <div>pip install git+https://github.com/suno-ai/bark.git</div>
                  <div>pip install indic-tts</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-accent mb-2">2. Professional Video Tools</h4>
                <div className="bg-slate-800 rounded p-3 text-sm font-mono">
                  <div># FFmpeg with professional codecs</div>
                  <div>sudo apt update && sudo apt install ffmpeg</div>
                  <div>sudo apt install ubuntu-restricted-extras</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-accent mb-2">3. Advanced AI Models (Optional)</h4>
                <div className="bg-slate-800 rounded p-3 text-sm font-mono">
                  <div># For 4K upscaling and enhancement</div>
                  <div>pip install diffusers transformers accelerate</div>
                  <div>pip install basicsr realesrgan</div>
                </div>
              </div>
              
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-300 mb-2">
                  <Star size={16} />
                  <span className="font-medium">Total Cost: $0</span>
                </div>
                <p className="text-sm text-slate-300">
                  All tools are completely free and open-source. No subscriptions or API keys required!
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Download Guide Button */}
      <div className="text-center">
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          <Download className="mr-2" size={16} />
          Download Complete Setup Guide
        </Button>
      </div>
    </div>
  );
}