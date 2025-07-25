import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Zap, 
  X, 
  Sparkles, 
  Shield,
  Gift
} from "lucide-react";

export function FreeNotice() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <Card className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-600/50 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Gift className="text-white" size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold text-green-100">100% Free - No API Keys Required!</h3>
                <Badge className="bg-green-500 text-white">
                  <Zap className="w-3 h-3 mr-1" />
                  Free Forever
                </Badge>
              </div>
              
              <p className="text-green-200 text-sm mb-3">
                This platform works completely free without any paid API subscriptions. 
                All features use open-source alternatives that achieve professional quality.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="flex items-center space-x-2 text-green-200">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Premium TTS voices (Coqui, Bark AI)</span>
                </div>
                <div className="flex items-center space-x-2 text-green-200">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">AI prompt enhancement (rule-based)</span>
                </div>
                <div className="flex items-center space-x-2 text-green-200">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Video analysis & quality benchmarking</span>
                </div>
                <div className="flex items-center space-x-2 text-green-200">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Professional video generation guide</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-green-200">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium">No data collection, no subscriptions, no hidden costs</span>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-green-300 hover:text-green-100 hover:bg-green-800/30"
          >
            <X size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}