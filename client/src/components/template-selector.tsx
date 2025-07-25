import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Briefcase, 
  BookOpen, 
  Megaphone, 
  Presentation, 
  Users, 
  Lightbulb,
  Play,
  Crown
} from "lucide-react"

interface Template {
  id: string
  name: string
  description: string
  icon: any
  category: string
  premium: boolean
  duration: string
  scenes: number
}

const templates: Template[] = [
  {
    id: "interview",
    name: "Interview Style",
    description: "Professional interview format with Q&A structure",
    icon: Users,
    category: "Business",
    premium: false,
    duration: "10-15s",
    scenes: 3
  },
  {
    id: "story",
    name: "Story Narrative",
    description: "Engaging storytelling with dramatic progression",
    icon: BookOpen,
    category: "Content",
    premium: false,
    duration: "15-30s",
    scenes: 5
  },
  {
    id: "marketing",
    name: "Marketing Promo",
    description: "High-energy promotional content with call-to-action",
    icon: Megaphone,
    category: "Marketing",
    premium: true,
    duration: "8-12s",
    scenes: 4
  },
  {
    id: "presentation",
    name: "Business Presentation",
    description: "Professional presentation with key points",
    icon: Presentation,
    category: "Business",
    premium: true,
    duration: "20-45s",
    scenes: 6
  },
  {
    id: "educational",
    name: "Educational Content",
    description: "Step-by-step educational format",
    icon: Lightbulb,
    category: "Education",
    premium: false,
    duration: "15-25s",
    scenes: 4
  },
  {
    id: "corporate",
    name: "Corporate Overview",
    description: "Company introduction and overview",
    icon: Briefcase,
    category: "Business",
    premium: true,
    duration: "30-60s",
    scenes: 8
  }
]

interface TemplateSelectorProps {
  selectedTemplate: string | null
  onTemplateSelect: (templateId: string) => void
}

export function TemplateSelector({ selectedTemplate, onTemplateSelect }: TemplateSelectorProps) {
  const categories = Array.from(new Set(templates.map(t => t.category)))

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Choose Your Template</h3>
        <p className="text-muted-foreground">
          Start with a professional template to create stunning videos quickly
        </p>
      </div>

      {categories.map((category) => (
        <div key={category} className="space-y-3">
          <h4 className="text-lg font-semibold text-foreground/80">{category}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates
              .filter(template => template.category === category)
              .map((template, index) => {
                const Icon = template.icon
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 group ${
                        selectedTemplate === template.id 
                          ? 'ring-2 ring-primary border-primary/50 shadow-lg' 
                          : 'hover:border-accent/50'
                      }`}
                      onClick={() => onTemplateSelect(template.id)}
                    >
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                selectedTemplate === template.id 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-accent/10 text-accent group-hover:bg-accent/20'
                              } transition-colors`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <h5 className="font-semibold flex items-center gap-2">
                                  {template.name}
                                  {template.premium && (
                                    <Crown className="h-4 w-4 text-yellow-500" />
                                  )}
                                </h5>
                                <p className="text-sm text-muted-foreground">
                                  {template.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <span>Duration:</span>
                              <Badge variant="outline" className="text-xs">
                                {template.duration}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>Scenes:</span>
                              <Badge variant="outline" className="text-xs">
                                {template.scenes}
                              </Badge>
                            </div>
                          </div>

                          {/* Action */}
                          <div className="flex items-center justify-between pt-2 border-t">
                            <Badge 
                              variant={template.premium ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {template.premium ? "Premium" : "Free"}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant={selectedTemplate === template.id ? "default" : "outline"}
                              className="gap-1 transition-all"
                            >
                              {selectedTemplate === template.id ? (
                                <>Selected</>
                              ) : (
                                <>
                                  <Play className="h-3 w-3" />
                                  Use Template
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
          </div>
        </div>
      ))}

      <div className="text-center pt-6 border-t">
        <p className="text-sm text-muted-foreground mb-3">
          Want to start from scratch?
        </p>
        <Button 
          variant="outline" 
          onClick={() => onTemplateSelect("custom")}
          className={selectedTemplate === "custom" ? "ring-2 ring-primary" : ""}
        >
          Create Custom Template
        </Button>
      </div>
    </div>
  )
}