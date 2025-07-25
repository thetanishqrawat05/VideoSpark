import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Home, 
  BarChart3, 
  Settings, 
  User,
  Sparkles
} from "lucide-react";
import { Link, useLocation } from "wouter";

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/video-studio", label: "Video Studio", icon: Video },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 mr-8">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Video className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Video Studio
            </h1>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex items-center space-x-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 border-green-200">
            <Sparkles className="h-3 w-3" />
            100% Free
          </Badge>
          
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            Account
          </Button>
        </div>
      </div>
    </header>
  );
}