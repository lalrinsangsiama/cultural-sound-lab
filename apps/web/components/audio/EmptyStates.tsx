"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Music, 
  Search, 
  Upload, 
  Filter,
  Sparkles,
  Heart,
  FolderOpen,
  Mic,
  Play,
  Download,
  Plus,
  ArrowRight,
  RefreshCw,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  type: "no-results" | "no-samples" | "upload-prompt" | "filtered-empty" | "favorites-empty" | "collection-empty";
  searchTerm?: string;
  onClearFilters?: () => void;
  onUpload?: () => void;
  onImportSamples?: () => void;
  onExploreLibrary?: () => void;
  className?: string;
}

const FloatingMusicNotes = () => {
  const notes = ["♪", "♫", "♬", "♩", "♯"];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {notes.map((note, index) => (
        <div
          key={index}
          className={cn(
            "absolute text-gray-300 text-2xl animate-bounce",
            `animation-delay-${index * 200}`
          )}
          style={{
            left: `${20 + index * 15}%`,
            top: `${10 + Math.sin(index) * 20}%`,
            animationDuration: `${3 + index * 0.5}s`,
            animationDelay: `${index * 0.3}s`,
          }}
        >
          {note}
        </div>
      ))}
    </div>
  );
};

const WaveformIllustration = () => (
  <div className="relative w-32 h-16 mx-auto mb-4">
    <svg width="128" height="64" viewBox="0 0 128 64" className="text-gray-300">
      <path
        d="M0 32 L8 20 L16 40 L24 16 L32 48 L40 8 L48 56 L56 24 L64 32 L72 40 L80 16 L88 48 L96 8 L104 56 L112 24 L120 40 L128 32"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className="animate-pulse"
      />
    </svg>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200 to-transparent opacity-50 animate-pulse" />
  </div>
);

const SampleImportWizard = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(1);
  
  const steps = [
    {
      title: "Choose Your Source",
      description: "Select where you'd like to import samples from",
      options: [
        { icon: Upload, label: "Upload Files", desc: "From your computer" },
        { icon: Download, label: "Online Library", desc: "Browse our collection" },
        { icon: Mic, label: "Record Audio", desc: "Create new samples" },
      ]
    },
    {
      title: "Set Metadata",
      description: "Add cultural context to your samples",
      options: [
        { icon: Music, label: "Instrument Type", desc: "Percussion, Wind, String..." },
        { icon: Heart, label: "Cultural Origin", desc: "Mizo, Naga, Khasi..." },
        { icon: Sparkles, label: "Mood & Tags", desc: "Traditional, Peaceful..." },
      ]
    },
    {
      title: "Organize & Share",
      description: "Make your samples discoverable",
      options: [
        { icon: FolderOpen, label: "Create Collections", desc: "Group related samples" },
        { icon: Plus, label: "Add to Projects", desc: "Use in compositions" },
        { icon: ArrowRight, label: "Publish", desc: "Share with community" },
      ]
    }
  ];

  return (
    <Card className="border-2 border-dashed border-blue-300 bg-blue-50/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-900">Sample Import Wizard</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            {steps.map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded-full border-2",
                  index + 1 <= step 
                    ? "bg-blue-500 border-blue-500" 
                    : "border-gray-300"
                )} />
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-8 h-0.5",
                    index + 1 < step ? "bg-blue-500" : "bg-gray-300"
                  )} />
                )}
              </div>
            ))}
          </div>
          <div className="text-sm text-blue-700">
            Step {step} of {steps.length}: {steps[step - 1].title}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            {steps[step - 1].description}
          </p>
          
          <div className="grid gap-3">
            {steps[step - 1].options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 justify-start hover:bg-blue-50"
                onClick={() => {
                  if (step < steps.length) {
                    setStep(step + 1);
                  } else {
                    onClose();
                  }
                }}
              >
                <option.icon className="h-5 w-5 mr-3 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-gray-400" />
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2 pt-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Previous
              </Button>
            )}
            <Button 
              onClick={() => step < steps.length ? setStep(step + 1) : onClose()}
              className="flex-1"
            >
              {step < steps.length ? "Next" : "Get Started"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function EmptyStates({
  type,
  searchTerm,
  onClearFilters,
  onUpload,
  onImportSamples,
  onExploreLibrary,
  className
}: EmptyStateProps) {
  const [showWizard, setShowWizard] = useState(false);

  if (showWizard) {
    return <SampleImportWizard onClose={() => setShowWizard(false)} />;
  }

  const configs = {
    "no-results": {
      icon: Search,
      title: "No samples found",
      description: searchTerm 
        ? `No samples match "${searchTerm}". Try different keywords or browse our collections.`
        : "No samples match your search criteria.",
      illustration: <WaveformIllustration />,
      actions: [
        { 
          label: "Clear Search", 
          variant: "outline" as const, 
          onClick: onClearFilters,
          icon: X 
        },
        { 
          label: "Browse All Samples", 
          variant: "default" as const, 
          onClick: onExploreLibrary,
          icon: Music 
        }
      ]
    },
    "no-samples": {
      icon: Music,
      title: "No audio samples yet",
      description: "Start building your cultural sound library by uploading your first samples or exploring our curated collections.",
      illustration: (
        <div className="relative">
          <FloatingMusicNotes />
          <div className="relative z-10">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <Music className="h-12 w-12 text-blue-500" />
            </div>
          </div>
        </div>
      ),
      actions: [
        { 
          label: "Upload Samples", 
          variant: "default" as const, 
          onClick: onUpload,
          icon: Upload 
        },
        { 
          label: "Import Wizard", 
          variant: "outline" as const, 
          onClick: () => setShowWizard(true),
          icon: Sparkles 
        }
      ]
    },
    "filtered-empty": {
      icon: Filter,
      title: "No samples match your filters",
      description: "Try adjusting your filter criteria or clear all filters to see more results.",
      illustration: <WaveformIllustration />,
      actions: [
        { 
          label: "Clear All Filters", 
          variant: "outline" as const, 
          onClick: onClearFilters,
          icon: RefreshCw 
        },
        { 
          label: "Browse All", 
          variant: "default" as const, 
          onClick: onExploreLibrary,
          icon: Music 
        }
      ]
    },
    "upload-prompt": {
      icon: Upload,
      title: "Ready to share your cultural sounds?",
      description: "Upload your traditional music samples and help preserve cultural heritage for future generations.",
      illustration: (
        <div className="relative">
          <div className="w-32 h-24 mx-auto mb-4 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center bg-blue-50">
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-xs text-blue-600">Drag & Drop</div>
            </div>
          </div>
        </div>
      ),
      actions: [
        { 
          label: "Choose Files", 
          variant: "default" as const, 
          onClick: onUpload,
          icon: Upload 
        },
        { 
          label: "Learn More", 
          variant: "outline" as const, 
          onClick: () => setShowWizard(true),
          icon: ArrowRight 
        }
      ]
    },
    "favorites-empty": {
      icon: Heart,
      title: "No favorites yet",
      description: "Heart the samples you love to build your personal collection of favorite cultural sounds.",
      illustration: (
        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center">
          <Heart className="h-12 w-12 text-pink-500" />
        </div>
      ),
      actions: [
        { 
          label: "Explore Library", 
          variant: "default" as const, 
          onClick: onExploreLibrary,
          icon: Music 
        }
      ]
    },
    "collection-empty": {
      icon: FolderOpen,
      title: "This collection is empty",
      description: "Add samples to this collection to organize your cultural sound library.",
      illustration: (
        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center">
          <FolderOpen className="h-12 w-12 text-orange-500" />
        </div>
      ),
      actions: [
        { 
          label: "Add Samples", 
          variant: "default" as const, 
          onClick: onExploreLibrary,
          icon: Plus 
        }
      ]
    }
  };

  const config = configs[type];
  const IconComponent = config.icon;

  return (
    <Card className={cn("border-dashed border-2 border-gray-200", className)}>
      <CardContent className="p-12 text-center">
        <div className="max-w-md mx-auto space-y-6">
          {config.illustration}
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center justify-center gap-2">
              <IconComponent className="h-6 w-6 text-gray-400" />
              {config.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {config.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {config.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                onClick={action.onClick}
                className="flex items-center gap-2"
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>

          {type === "no-samples" && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                <strong>💡 Pro Tip:</strong> Start with our sample library to get familiar with the platform, 
                then upload your own cultural recordings to share with the community.
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}