"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock,
  Star,
  Play,
  DollarSign,
  Zap,
  Music,
  Radio,
  FileAudio,
  Film,
  Store,
  Sparkles,
  TrendingUp,
  Info,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface GenerationType {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  illustration: string;
  features: string[];
  estimatedTime: {
    min: number;
    max: number;
  };
  pricing: {
    personal: number;
    commercial: number;
    enterprise: number;
  };
  popularity: "low" | "medium" | "high" | "trending";
  previewDescription: string;
  outputSpecs: {
    duration: string;
    format: string[];
    quality: string;
  };
  useCase: string[];
  complexity: "simple" | "moderate" | "advanced";
}

interface GenerationTypeCardsProps {
  types?: GenerationType[];
  selectedType?: string;
  onTypeSelect?: (typeId: string) => void;
  showPricing?: boolean;
  className?: string;
}

const defaultGenerationTypes: GenerationType[] = [
  {
    id: "sound-logo",
    title: "Sound Logo",
    description: "Create memorable 3-15 second audio signatures for brands",
    icon: Zap,
    illustration: "🎵",
    features: ["Brand recognition", "Multiple variations", "Loop compatibility", "Commercial ready"],
    estimatedTime: { min: 3, max: 8 },
    pricing: { personal: 15, commercial: 45, enterprise: 120 },
    popularity: "high",
    previewDescription: "Perfect for brand introductions, app sounds, and marketing materials",
    outputSpecs: {
      duration: "3-15 seconds",
      format: ["WAV", "MP3", "AIFF"],
      quality: "24-bit/48kHz"
    },
    useCase: ["Brand identity", "App notifications", "Marketing videos", "Podcast intros"],
    complexity: "simple"
  },
  {
    id: "background-music",
    title: "Background Music",
    description: "Generate atmospheric music for videos, podcasts, and content",
    icon: Music,
    illustration: "🎼",
    features: ["Loop-ready", "Mood matching", "Volume ducking", "Stem separation"],
    estimatedTime: { min: 8, max: 15 },
    pricing: { personal: 25, commercial: 75, enterprise: 200 },
    popularity: "trending",
    previewDescription: "Ideal for YouTube videos, podcasts, presentations, and ambient spaces",
    outputSpecs: {
      duration: "30 seconds - 10 minutes",
      format: ["WAV", "MP3", "FLAC"],
      quality: "24-bit/48kHz"
    },
    useCase: ["Video content", "Podcasts", "Presentations", "Retail spaces"],
    complexity: "moderate"
  },
  {
    id: "social-media-clip",
    title: "Social Media Clip", 
    description: "Quick 15-60 second clips optimized for social platforms",
    icon: Radio,
    illustration: "📱",
    features: ["Platform optimization", "Trending sounds", "Hook creation", "Viral potential"],
    estimatedTime: { min: 2, max: 5 },
    pricing: { personal: 8, commercial: 25, enterprise: 65 },
    popularity: "high",
    previewDescription: "Optimized for Instagram Reels, TikTok, YouTube Shorts, and Twitter videos",
    outputSpecs: {
      duration: "15-60 seconds",
      format: ["MP3", "M4A"],
      quality: "16-bit/44.1kHz"
    },
    useCase: ["Instagram Reels", "TikTok videos", "YouTube Shorts", "Social campaigns"],
    complexity: "simple"
  },
  {
    id: "podcast-intro",
    title: "Podcast Intro/Outro",
    description: "Professional podcast openings and closings with your style",
    icon: FileAudio,
    illustration: "🎙️",
    features: ["Voice integration", "Brand consistency", "Multiple lengths", "Fade options"],
    estimatedTime: { min: 5, max: 12 },
    pricing: { personal: 20, commercial: 60, enterprise: 150 },
    popularity: "medium",
    previewDescription: "Create professional podcast identities that build audience recognition",
    outputSpecs: {
      duration: "10-45 seconds",
      format: ["WAV", "MP3"],
      quality: "24-bit/48kHz"
    },
    useCase: ["Podcast branding", "Audio shows", "Voice content", "Radio shows"],
    complexity: "moderate"
  },
  {
    id: "full-track",
    title: "Full Track Composition",
    description: "Complete musical pieces with cultural authenticity",
    icon: Film,
    illustration: "🎭",
    features: ["Multi-section structure", "Cultural storytelling", "Professional arrangement", "Stem exports"],
    estimatedTime: { min: 15, max: 45 },
    pricing: { personal: 50, commercial: 150, enterprise: 400 },
    popularity: "medium",
    previewDescription: "Full-length compositions for documentaries, films, and artistic projects",
    outputSpecs: {
      duration: "2-8 minutes",
      format: ["WAV", "FLAC", "Stems"],
      quality: "24-bit/96kHz"
    },
    useCase: ["Film scoring", "Documentaries", "Art installations", "Cultural events"],
    complexity: "advanced"
  },
  {
    id: "retail-playlist",
    title: "Retail Playlist",
    description: "Curated background music collections for commercial spaces",
    icon: Store,
    illustration: "🏪",
    features: ["Mood progression", "Cultural theming", "Seamless transitions", "Extended runtime"],
    estimatedTime: { min: 20, max: 60 },
    pricing: { personal: 35, commercial: 95, enterprise: 250 },
    popularity: "low",
    previewDescription: "Create engaging shopping experiences with culturally-inspired ambient music",
    outputSpecs: {
      duration: "30-120 minutes",
      format: ["MP3", "WAV"],
      quality: "16-bit/44.1kHz"
    },
    useCase: ["Retail stores", "Restaurants", "Hotels", "Wellness centers"],
    complexity: "advanced"
  }
];

const PopularityBadge = ({ popularity }: { popularity: GenerationType['popularity'] }) => {
  const config = {
    trending: { label: "🔥 Trending", className: "bg-orange-100 text-orange-800 border-orange-200" },
    high: { label: "⭐ Popular", className: "bg-blue-100 text-blue-800 border-blue-200" },
    medium: { label: "👍 Good Choice", className: "bg-green-100 text-green-800 border-green-200" },
    low: { label: "💎 Specialized", className: "bg-purple-100 text-purple-800 border-purple-200" }
  };
  
  const { label, className } = config[popularity];
  
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", className)}>
      {label}
    </Badge>
  );
};

const ComplexityIndicator = ({ complexity }: { complexity: GenerationType['complexity'] }) => {
  const dots = complexity === "simple" ? 1 : complexity === "moderate" ? 2 : 3;
  
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">Complexity:</span>
      <div className="flex gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              i < dots ? "bg-primary" : "bg-gray-200"
            )}
          />
        ))}
      </div>
    </div>
  );
};

const GenerationTypeCard = ({
  type,
  isSelected,
  onSelect,
  showPricing,
  onPreview
}: {
  type: GenerationType;
  isSelected: boolean;
  onSelect: () => void;
  showPricing: boolean;
  onPreview: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = type.icon;
  
  const formatTime = (min: number, max: number) => {
    if (min === max) return `${min} min`;
    return `${min}-${max} min`;
  };

  return (
    <Card 
      className={cn(
        "relative cursor-pointer transition-all duration-300 overflow-hidden group",
        isSelected 
          ? "ring-2 ring-primary shadow-lg border-primary/20 bg-primary/5" 
          : "hover:shadow-xl hover:shadow-blue-100/50 hover:-translate-y-2",
        isHovered && "scale-[1.02]"
      )}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Illustration */}
      <div className="absolute top-4 right-4 text-6xl opacity-10 group-hover:opacity-20 transition-opacity">
        {type.illustration}
      </div>
      
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <CheckCircle2 className="h-6 w-6 text-primary bg-white rounded-full" />
        </div>
      )}
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-600 group-hover:bg-primary group-hover:text-white"
            )}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{type.title}</CardTitle>
              <PopularityBadge popularity={type.popularity} />
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          {type.description}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4 relative z-10">
        {/* Preview Description */}
        {isHovered && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 animate-fade-in">
            <p className="text-sm text-blue-800">{type.previewDescription}</p>
          </div>
        )}
        
        {/* Key Features */}
        <div>
          <h5 className="text-sm font-medium mb-2">Key Features:</h5>
          <div className="grid grid-cols-2 gap-1">
            {type.features.slice(0, 4).map((feature, index) => (
              <div key={index} className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span className="truncate">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Output Specs */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
              <span>Generation Time</span>
            </div>
            <span className="font-medium">{formatTime(type.estimatedTime.min, type.estimatedTime.max)}</span>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <FileAudio className="h-3 w-3" />
              <span>Duration</span>
            </div>
            <span className="font-medium">{type.outputSpecs.duration}</span>
          </div>
        </div>
        
        {/* Complexity */}
        <ComplexityIndicator complexity={type.complexity} />
        
        {/* Pricing */}
        {showPricing && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Pricing</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
                className="text-xs h-6 px-2"
              >
                <Play className="h-3 w-3 mr-1" />
                Preview
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium">${type.pricing.personal}</div>
                <div className="text-muted-foreground">Personal</div>
              </div>
              <div className="text-center">
                <div className="font-medium">${type.pricing.commercial}</div>
                <div className="text-muted-foreground">Commercial</div>
              </div>
              <div className="text-center">
                <div className="font-medium">${type.pricing.enterprise}</div>
                <div className="text-muted-foreground">Enterprise</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Use Cases */}
        {isHovered && (
          <div className="animate-fade-in">
            <h6 className="text-xs font-medium text-muted-foreground mb-2">Perfect for:</h6>
            <div className="flex flex-wrap gap-1">
              {type.useCase.slice(0, 3).map((useCase, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {useCase}
                </Badge>
              ))}
              {type.useCase.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{type.useCase.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Action Button */}
        <Button
          className={cn(
            "w-full mt-4 transition-all duration-200",
            isSelected 
              ? "bg-primary hover:bg-primary/90" 
              : "bg-gray-900 hover:bg-primary hover:shadow-lg"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {isSelected ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Selected
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Choose This Type
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default function GenerationTypeCards({
  types = defaultGenerationTypes,
  selectedType,
  onTypeSelect,
  showPricing = true,
  className
}: GenerationTypeCardsProps) {
  const [previewingType, setPreviewingType] = useState<string | null>(null);

  const handlePreview = useCallback((typeId: string) => {
    setPreviewingType(typeId);
    // Mock preview - in real app, would play audio sample
    setTimeout(() => setPreviewingType(null), 3000);
  }, []);

  const sortedTypes = [...types].sort((a, b) => {
    const popularityOrder = { trending: 0, high: 1, medium: 2, low: 3 };
    return popularityOrder[a.popularity] - popularityOrder[b.popularity];
  });

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Generation Type</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select the type of audio content you want to create. Each option is optimized for specific use cases 
          and includes professional features tailored to your needs.
        </p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {types.filter(t => t.popularity === 'trending' || t.popularity === 'high').length}
          </div>
          <div className="text-sm text-blue-800">Popular Options</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {Math.min(...types.map(t => t.estimatedTime.min))}min
          </div>
          <div className="text-sm text-green-800">Fastest Generation</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            ${Math.min(...types.map(t => t.pricing.personal))}
          </div>
          <div className="text-sm text-purple-800">Starting Price</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {types.reduce((acc, t) => acc + t.useCase.length, 0)}+
          </div>
          <div className="text-sm text-orange-800">Use Cases</div>
        </div>
      </div>
      
      {/* Generation Type Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedTypes.map((type) => (
          <GenerationTypeCard
            key={type.id}
            type={type}
            isSelected={selectedType === type.id}
            onSelect={() => onTypeSelect?.(type.id)}
            showPricing={showPricing}
            onPreview={() => handlePreview(type.id)}
          />
        ))}
      </div>
      
      {/* Help Section */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900 mb-1">Need Help Choosing?</h4>
            <p className="text-sm text-amber-800">
              Not sure which type fits your project? Start with <strong>Sound Logo</strong> for branding, 
              <strong>Background Music</strong> for content, or <strong>Social Media Clip</strong> for quick social posts. 
              You can always generate multiple types from the same samples.
            </p>
          </div>
        </div>
      </div>
      
      {/* Preview Indicator */}
      {previewingType && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <Play className="h-4 w-4 animate-pulse" />
          <span className="text-sm">
            Playing preview for {types.find(t => t.id === previewingType)?.title}...
          </span>
        </div>
      )}
    </div>
  );
}