import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  BookOpen, 
  Megaphone, 
  GraduationCap, 
  Building2, 
  Zap,
  Crown,
  Sparkles
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  style: string;
  premium?: boolean;
}

interface TemplateSelectorProps {
  selectedTemplate: string | null;
  onTemplateSelect: (templateId: string) => void;
}

const templates: Template[] = [
  {
    id: "interview",
    name: "Interview Style",
    description: "Professional interview format with clean transitions",
    icon: <Briefcase className="h-6 w-6" />,
    style: "professional"
  },
  {
    id: "story",
    name: "Storytelling",
    description: "Narrative-focused with dramatic pacing and effects",
    icon: <BookOpen className="h-6 w-6" />,
    style: "cinematic"
  },
  {
    id: "marketing",
    name: "Marketing Video",
    description: "Engaging promotional content with call-to-action",
    icon: <Megaphone className="h-6 w-6" />,
    style: "dynamic"
  },
  {
    id: "educational",
    name: "Educational",
    description: "Clear, informative presentation style",
    icon: <GraduationCap className="h-6 w-6" />,
    style: "clean",
    premium: true
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Business-focused with elegant animations",
    icon: <Building2 className="h-6 w-6" />,
    style: "elegant",
    premium: true
  },
  {
    id: "custom",
    name: "Custom Script",
    description: "Write your own script for complete control",
    icon: <Zap className="h-6 w-6" />,
    style: "custom"
  }
];

export function TemplateSelector({ selectedTemplate, onTemplateSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card
          key={template.id}
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            selectedTemplate === template.id
              ? "ring-2 ring-primary border-primary bg-primary/5"
              : "hover:border-primary/50"
          }`}
          onClick={() => onTemplateSelect(template.id)}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {template.icon}
              </div>
              {template.premium && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            
            <h3 className="font-semibold mb-2">{template.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
            
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {template.style}
              </Badge>
              
              <Button
                variant={selectedTemplate === template.id ? "default" : "outline"}
                size="sm"
                className="gap-1"
              >
                {selectedTemplate === template.id ? (
                  <>
                    <Sparkles className="h-3 w-3" />
                    Selected
                  </>
                ) : (
                  "Select"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}