import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Play, 
  Volume2, 
  VolumeX,
  Eye,
  Palette,
  Clock
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

interface Voice {
  id: string;
  name: string;
  language: string;
  gender: string;
  provider: string;
}

interface SceneEditorProps {
  scenes: Scene[];
  onScenesChange: (scenes: Scene[]) => void;
  voices: Voice[];
}

export function SceneEditor({ scenes, onScenesChange, voices }: SceneEditorProps) {
  const [expandedScene, setExpandedScene] = useState<string | null>(null);

  const addScene = () => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: `Scene ${scenes.length + 1}`,
      text: "",
      background: "gradient",
      voiceId: voices[0]?.id || "",
      duration: 5,
      textStyle: "fade-in",
      audioEnabled: true
    };
    onScenesChange([...scenes, newScene]);
    setExpandedScene(newScene.id);
  };

  const removeScene = (sceneId: string) => {
    onScenesChange(scenes.filter(scene => scene.id !== sceneId));
    if (expandedScene === sceneId) {
      setExpandedScene(null);
    }
  };

  const updateScene = (sceneId: string, updates: Partial<Scene>) => {
    onScenesChange(scenes.map(scene => 
      scene.id === sceneId ? { ...scene, ...updates } : scene
    ));
  };

  const moveScene = (sceneId: string, direction: 'up' | 'down') => {
    const currentIndex = scenes.findIndex(scene => scene.id === sceneId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= scenes.length) return;

    const newScenes = [...scenes];
    [newScenes[currentIndex], newScenes[newIndex]] = [newScenes[newIndex], newScenes[currentIndex]];
    onScenesChange(newScenes);
  };

  const backgroundOptions = [
    { value: "gradient", label: "Animated Gradient" },
    { value: "solid", label: "Solid Color" },
    { value: "particles", label: "Particle Effect" },
    { value: "waves", label: "Wave Animation" }
  ];

  const textStyleOptions = [
    { value: "fade-in", label: "Fade In" },
    { value: "typewriter", label: "Typewriter" },
    { value: "slide-up", label: "Slide Up" },
    { value: "zoom", label: "Zoom In" }
  ];

  if (scenes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Scenes Yet</h3>
        <p className="text-muted-foreground mb-4">
          Add your first scene to start creating your video
        </p>
        <Button onClick={addScene} className="gap-2">
          <Plus className="h-4 w-4" />
          Add First Scene
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Scenes ({scenes.length})</h3>
          <p className="text-sm text-muted-foreground">
            Total duration: {scenes.reduce((acc, scene) => acc + scene.duration, 0)}s
          </p>
        </div>
        <Button onClick={addScene} variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Scene
        </Button>
      </div>

      <div className="space-y-3">
        {scenes.map((scene, index) => (
          <Card key={scene.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <CardTitle className="text-base">{scene.title}</CardTitle>
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {scene.duration}s
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveScene(scene.id, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveScene(scene.id, 'down')}
                    disabled={index === scenes.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedScene(expandedScene === scene.id ? null : scene.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeScene(scene.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Scene Text - Always Visible */}
                <div className="space-y-2">
                  <Label>Scene Text</Label>
                  <Textarea
                    value={scene.text}
                    onChange={(e) => updateScene(scene.id, { text: e.target.value })}
                    placeholder="Enter the text for this scene..."
                    rows={3}
                  />
                </div>

                {/* Expanded Settings */}
                {expandedScene === scene.id && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Scene Title</Label>
                        <Input
                          value={scene.title}
                          onChange={(e) => updateScene(scene.id, { title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (seconds)</Label>
                        <Slider
                          value={[scene.duration]}
                          onValueChange={(value) => updateScene(scene.id, { duration: value[0] })}
                          min={1}
                          max={15}
                          step={0.5}
                          className="pt-2"
                        />
                        <div className="text-center text-sm text-muted-foreground">
                          {scene.duration}s
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Background Style</Label>
                        <Select
                          value={scene.background}
                          onValueChange={(value) => updateScene(scene.id, { background: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {backgroundOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Text Animation</Label>
                        <Select
                          value={scene.textStyle}
                          onValueChange={(value) => updateScene(scene.id, { textStyle: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {textStyleOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Voice</Label>
                      <Select
                        value={scene.voiceId}
                        onValueChange={(value) => updateScene(scene.id, { voiceId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {voices.map((voice) => (
                            <SelectItem key={voice.id} value={voice.id}>
                              {voice.name} ({voice.language})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Enable Audio</Label>
                      <Switch
                        checked={scene.audioEnabled}
                        onCheckedChange={(checked) => updateScene(scene.id, { audioEnabled: checked })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}