import { useState } from "react"
import { motion, Reorder } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { 
  Trash2, 
  Plus, 
  GripVertical, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Eye,
  Settings
} from "lucide-react"

interface Scene {
  id: string
  title: string
  text: string
  background: string
  voiceId: string
  duration: number
  textStyle: string
  audioEnabled: boolean
}

interface SceneEditorProps {
  scenes: Scene[]
  onScenesChange: (scenes: Scene[]) => void
  voices: any[]
}

export function SceneEditor({ scenes, onScenesChange, voices }: SceneEditorProps) {
  const [selectedScene, setSelectedScene] = useState<string | null>(null)

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
    }
    onScenesChange([...scenes, newScene])
  }

  const removeScene = (sceneId: string) => {
    onScenesChange(scenes.filter(scene => scene.id !== sceneId))
    if (selectedScene === sceneId) {
      setSelectedScene(null)
    }
  }

  const updateScene = (sceneId: string, updates: Partial<Scene>) => {
    onScenesChange(scenes.map(scene => 
      scene.id === sceneId ? { ...scene, ...updates } : scene
    ))
  }

  const selectedSceneData = scenes.find(scene => scene.id === selectedScene)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Scene List */}
      <div className="lg:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Scenes</h3>
          <Button onClick={addScene} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Scene
          </Button>
        </div>
        
        <Reorder.Group 
          axis="y" 
          values={scenes} 
          onReorder={onScenesChange}
          className="space-y-2"
        >
          {scenes.map((scene, index) => (
            <Reorder.Item key={scene.id} value={scene}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedScene === scene.id 
                      ? 'ring-2 ring-primary border-primary/50' 
                      : 'hover:border-accent/50'
                  }`}
                  onClick={() => setSelectedScene(scene.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{scene.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {scene.duration}s
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {scene.text || "No text content"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeScene(scene.id)
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {/* Scene Editor */}
      <div className="lg:col-span-2">
        {selectedSceneData ? (
          <motion.div
            key={selectedScene}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Edit Scene: {selectedSceneData.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Scene Title</Label>
                    <Input
                      value={selectedSceneData.title}
                      onChange={(e) => updateScene(selectedScene!, { title: e.target.value })}
                      placeholder="Enter scene title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (seconds)</Label>
                    <Slider
                      value={[selectedSceneData.duration]}
                      onValueChange={(value) => updateScene(selectedScene!, { duration: value[0] })}
                      min={1}
                      max={30}
                      step={1}
                      className="pt-2"
                    />
                    <div className="text-center text-sm text-muted-foreground">
                      {selectedSceneData.duration}s
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                  <Label>Text Content</Label>
                  <Textarea
                    value={selectedSceneData.text}
                    onChange={(e) => updateScene(selectedScene!, { text: e.target.value })}
                    placeholder="Enter the text content for this scene..."
                    rows={4}
                  />
                </div>

                {/* Style Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Background Style</Label>
                    <Select
                      value={selectedSceneData.background}
                      onValueChange={(value) => updateScene(selectedScene!, { background: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gradient">Gradient</SelectItem>
                        <SelectItem value="solid">Solid Color</SelectItem>
                        <SelectItem value="particles">Particles</SelectItem>
                        <SelectItem value="waves">Waves</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Text Animation</Label>
                    <Select
                      value={selectedSceneData.textStyle}
                      onValueChange={(value) => updateScene(selectedScene!, { textStyle: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fade-in">Fade In</SelectItem>
                        <SelectItem value="typewriter">Typewriter</SelectItem>
                        <SelectItem value="slide-up">Slide Up</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Voice Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Voice & Audio</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={selectedSceneData.audioEnabled}
                        onCheckedChange={(checked) => updateScene(selectedScene!, { audioEnabled: checked })}
                      />
                      <Label className="text-sm">Enable Audio</Label>
                    </div>
                  </div>
                  
                  {selectedSceneData.audioEnabled && (
                    <Select
                      value={selectedSceneData.voiceId}
                      onValueChange={(value) => updateScene(selectedScene!, { voiceId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {voices.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            <div className="flex items-center gap-2">
                              <span>{voice.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {voice.language}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Preview Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="h-4 w-4" />
                    <Label>Preview</Label>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 min-h-[100px] flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Scene Preview</p>
                      <p className="text-lg font-medium">
                        {selectedSceneData.text || "No text content"}
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <Button size="sm" variant="outline" className="gap-1">
                          <Play className="h-3 w-3" />
                          Preview
                        </Button>
                        {selectedSceneData.audioEnabled && (
                          <Button size="sm" variant="outline" className="gap-1">
                            <Volume2 className="h-3 w-3" />
                            Voice Test
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <div className="text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Scene Selected</p>
                <p className="text-sm">Select a scene from the list to start editing</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}