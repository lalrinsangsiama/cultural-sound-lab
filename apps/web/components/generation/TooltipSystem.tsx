"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle,
  Info,
  AlertCircle,
  CheckCircle2,
  X,
  Lightbulb,
  BookOpen,
  Play,
  Volume2,
  Music,
  Settings,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  title?: string;
  type?: "info" | "help" | "warning" | "success" | "tip";
  position?: "top" | "bottom" | "left" | "right";
  trigger?: "hover" | "click";
  showDelay?: number;
  hideDelay?: number;
  children: React.ReactNode;
  className?: string;
}

interface HelpPanelProps {
  title: string;
  sections: HelpSection[];
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface HelpSection {
  id: string;
  title: string;
  content: string;
  type?: "text" | "video" | "demo" | "tips";
  icon?: React.ElementType;
}

const tooltipStyles = {
  info: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-800",
    icon: Info,
    iconColor: "text-blue-500"
  },
  help: {
    bg: "bg-purple-50 border-purple-200", 
    text: "text-purple-800",
    icon: HelpCircle,
    iconColor: "text-purple-500"
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800", 
    icon: AlertCircle,
    iconColor: "text-amber-500"
  },
  success: {
    bg: "bg-green-50 border-green-200",
    text: "text-green-800",
    icon: CheckCircle2,
    iconColor: "text-green-500"
  },
  tip: {
    bg: "bg-yellow-50 border-yellow-200",
    text: "text-yellow-800",
    icon: Lightbulb,
    iconColor: "text-yellow-500"
  }
};

export const Tooltip = ({
  content,
  title,
  type = "info",
  position = "top",
  trigger = "hover",
  showDelay = 500,
  hideDelay = 200,
  children,
  className
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const style = tooltipStyles[type];
  const IconComponent = style.icon;

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(true), trigger === "hover" ? showDelay : 0);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(false), trigger === "hover" ? hideDelay : 0);
  };

  const toggleTooltip = () => {
    setIsVisible(!isVisible);
  };

  // Calculate position to keep tooltip in viewport
  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !triggerRef.current) return;

    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;
    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let newPosition = position;

    // Check if tooltip would go off screen and adjust
    if (position === "top" && rect.top - tooltipRect.height < 10) {
      newPosition = "bottom";
    } else if (position === "bottom" && rect.bottom + tooltipRect.height > viewport.height - 10) {
      newPosition = "top";
    } else if (position === "left" && rect.left - tooltipRect.width < 10) {
      newPosition = "right";
    } else if (position === "right" && rect.right + tooltipRect.width > viewport.width - 10) {
      newPosition = "left";
    }

    setActualPosition(newPosition);
  }, [isVisible, position]);

  const getPositionClasses = () => {
    const base = "absolute z-50 px-3 py-2 text-sm rounded-lg shadow-lg border";
    
    switch (actualPosition) {
      case "top":
        return `${base} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case "bottom":
        return `${base} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case "left":
        return `${base} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      case "right":
        return `${base} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      default:
        return `${base} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }
  };

  const getArrowClasses = () => {
    const base = "absolute w-2 h-2 transform rotate-45 border";
    
    switch (actualPosition) {
      case "top":
        return `${base} top-full left-1/2 -translate-x-1/2 -mt-1 border-l-0 border-t-0`;
      case "bottom":
        return `${base} bottom-full left-1/2 -translate-x-1/2 -mb-1 border-r-0 border-b-0`;
      case "left":
        return `${base} left-full top-1/2 -translate-y-1/2 -ml-1 border-l-0 border-b-0`;
      case "right":
        return `${base} right-full top-1/2 -translate-y-1/2 -mr-1 border-r-0 border-t-0`;
      default:
        return `${base} top-full left-1/2 -translate-x-1/2 -mt-1 border-l-0 border-t-0`;
    }
  };

  return (
    <div 
      ref={triggerRef}
      className={cn("relative inline-block", className)}
      onMouseEnter={trigger === "hover" ? showTooltip : undefined}
      onMouseLeave={trigger === "hover" ? hideTooltip : undefined}
      onClick={trigger === "click" ? toggleTooltip : undefined}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            getPositionClasses(),
            style.bg,
            style.text,
            "animate-fade-in-scale"
          )}
          onMouseEnter={trigger === "hover" ? showTooltip : undefined}
          onMouseLeave={trigger === "hover" ? hideTooltip : undefined}
        >
          {/* Arrow */}
          <div className={cn(getArrowClasses(), style.bg)} />
          
          {/* Content */}
          <div className="flex items-start gap-2 max-w-xs">
            <IconComponent className={cn("h-4 w-4 flex-shrink-0 mt-0.5", style.iconColor)} />
            <div>
              {title && (
                <div className="font-medium mb-1">{title}</div>
              )}
              <div className="text-sm leading-relaxed">{content}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const HelpIcon = ({ 
  tooltip, 
  type = "help",
  size = "sm" 
}: { 
  tooltip: string; 
  type?: "info" | "help" | "warning" | "success" | "tip";
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5", 
    lg: "h-6 w-6"
  };
  
  const style = tooltipStyles[type];
  const IconComponent = style.icon;
  
  return (
    <Tooltip content={tooltip} type={type} trigger="hover">
      <IconComponent className={cn(sizeClasses[size], style.iconColor, "cursor-help")} />
    </Tooltip>
  );
};

export const HelpPanel = ({ 
  title, 
  sections, 
  isOpen, 
  onClose,
  className 
}: HelpPanelProps) => {
  const [activeSection, setActiveSection] = useState(sections[0]?.id);
  
  if (!isOpen) return null;

  const activeContent = sections.find(s => s.id === activeSection);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className={cn("w-full max-w-4xl max-h-[80vh] overflow-hidden", className)}>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50 flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {title}
                </h3>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {sections.map((section) => {
                const IconComponent = section.icon || Info;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full text-left p-3 hover:bg-gray-100 transition-colors flex items-center gap-3",
                      activeSection === section.id && "bg-blue-50 border-r-2 border-blue-500"
                    )}
                  >
                    <IconComponent className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{section.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b">
              <h4 className="text-lg font-semibold">{activeContent?.title}</h4>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {activeContent?.type === "video" ? (
                <div className="space-y-4">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Play className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">Video tutorial coming soon</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{activeContent.content}</p>
                </div>
              ) : activeContent?.type === "demo" ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Play className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Interactive Demo</span>
                    </div>
                    <p className="text-sm text-blue-700">{activeContent.content}</p>
                  </div>
                </div>
              ) : activeContent?.type === "tips" ? (
                <div className="space-y-3">
                  {activeContent.content.split('\n').filter(Boolean).map((tip, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">{tip}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {activeContent?.content}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Predefined help sections for generation interface
export const generationHelpSections: HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    content: `Welcome to the Cultural Sound Lab generation interface! This guide will help you create authentic cultural audio content using AI.

The generation process consists of 5 main steps:
1. Select your cultural audio samples
2. Choose the type of content you want to create
3. Configure generation parameters
4. Wait for AI processing
5. Download your generated audio

Each step has been designed to preserve cultural authenticity while giving you creative control over the final output.`,
    type: "text",
    icon: BookOpen
  },
  {
    id: "sample-selection",
    title: "Sample Selection",
    content: `Choose up to 5 cultural audio samples that will form the foundation of your generation.

Tips for better results:
• Mix different instrument types for richer compositions
• Use samples from the same cultural tradition for authenticity
• Balance volumes - keep the dominant sample around 80-100%
• Use Solo to isolate and focus on individual tracks
• Drag samples to reorder them in the mix

The AI will analyze the cultural characteristics, musical patterns, and tonal qualities of your selected samples to create new content that respects the original traditions.`,
    type: "tips",
    icon: Volume2
  },
  {
    id: "generation-types",
    title: "Generation Types",
    content: `Each generation type is optimized for specific use cases:

Sound Logo (3-15s): Perfect for brand identity, app notifications, and marketing materials. Quick generation with high impact.

Background Music (30s-10min): Ideal for video content, podcasts, and ambient spaces. Includes loop-ready options and mood matching.

Social Media Clip (15-60s): Optimized for Instagram Reels, TikTok, and YouTube Shorts. Designed for viral potential and platform specs.

Podcast Intro/Outro (10-45s): Professional podcast branding with voice integration support and consistent brand identity.

Full Track Composition (2-8min): Complete musical pieces for documentaries, films, and artistic projects with multi-section structure.

Retail Playlist (30-120min): Extended background music collections for commercial spaces with seamless transitions.`,
    type: "text",
    icon: Music
  },
  {
    id: "parameters",
    title: "Advanced Parameters",
    content: `Fine-tune your generation with these advanced controls:

Mood & Atmosphere: Choose from 8 different moods that will influence the emotional character of your generated audio.

Energy Level: Controls the overall excitement and intensity (0-100%).

Cultural Authenticity: How closely the output adheres to traditional elements (0-100%). Higher values preserve more original characteristics.

Tempo (BPM): Set the pace of your generation. Use auto-detect to match existing samples or manually set from 60-200 BPM.

Key Signature: Choose from major and minor keys to complement your samples or match project requirements.

Style Intensity: How strongly the AI applies stylistic transformations to your source material.

Reference Track: Upload a track with similar style for the AI to analyze and incorporate characteristics from.`,
    type: "text",
    icon: Settings
  },
  {
    id: "generation-process",
    title: "Generation Process",
    content: `Understanding what happens during generation:

1. Analysis (15s): AI examines your samples for cultural elements, musical characteristics, and tonal qualities.

2. Composition (45s): Creates musical structure, harmony patterns, and rhythmic elements based on cultural traditions.

3. Synthesis (30s): Generates high-quality audio while maintaining cultural authenticity and your specified parameters.

4. Enhancement (20s): Applies final touches, audio mastering, and ensures professional quality output.

5. Finalization (10s): Prepares your generated audio files for download in multiple formats.

The entire process typically takes 2-15 minutes depending on the complexity and length of your chosen generation type. You can cancel at any time if needed.`,
    type: "text",
    icon: Brain
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    content: `Common issues and solutions:

Generation failed or produced unexpected results:
• Ensure your samples are high quality (at least 16-bit/44.1kHz)
• Try reducing the number of samples or using samples from the same culture
• Adjust the Cultural Authenticity parameter
• Check that your parameters are realistic for the generation type

Audio quality issues:
• Use higher quality source samples
• Avoid heavily compressed or low-bitrate files
• Ensure samples are not clipped or distorted

Generation takes too long:
• Complex generations naturally take more time
• Cancel and try with simpler parameters
• Check your internet connection
• Contact support if generation exceeds expected time significantly

Can't hear the preview:
• Check your browser audio permissions
• Ensure your device volume is up
• Try a different browser if issues persist`,
    type: "text",
    icon: AlertCircle
  }
];

export default { Tooltip, HelpIcon, HelpPanel, generationHelpSections };