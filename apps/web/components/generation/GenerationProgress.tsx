"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  X,
  Download,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Brain,
  Music,
  Wand2,
  FileAudio,
  Volume2,
  Share,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface GenerationStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "active" | "completed" | "error";
  progress: number;
  estimatedTime: number;
  icon: React.ElementType;
}

interface GenerationProgressProps {
  isGenerating: boolean;
  progress: number;
  currentStep?: GenerationStep;
  steps?: GenerationStep[];
  estimatedTimeRemaining?: number;
  generatedPreview?: string;
  onCancel: () => void;
  onDownload?: () => void;
  onRegenerate?: () => void;
  onShare?: () => void;
  className?: string;
}

const defaultSteps: GenerationStep[] = [
  {
    id: "analyze",
    title: "Analyzing Samples",
    description: "Understanding cultural elements and musical characteristics",
    status: "pending",
    progress: 0,
    estimatedTime: 15,
    icon: Brain
  },
  {
    id: "compose",
    title: "AI Composition",
    description: "Creating musical structure and harmony patterns",
    status: "pending", 
    progress: 0,
    estimatedTime: 45,
    icon: Music
  },
  {
    id: "synthesize",
    title: "Audio Synthesis",
    description: "Generating high-quality audio with cultural authenticity",
    status: "pending",
    progress: 0,
    estimatedTime: 30,
    icon: Wand2
  },
  {
    id: "enhance",
    title: "Enhancement & Mastering",
    description: "Applying final touches and audio mastering",
    status: "pending",
    progress: 0,
    estimatedTime: 20,
    icon: Sparkles
  },
  {
    id: "finalize",
    title: "Finalizing Output",
    description: "Preparing your generated audio for download",
    status: "pending",
    progress: 0,
    estimatedTime: 10,
    icon: FileAudio
  }
];

// Particle animation component
const ParticleField = ({ isActive, color = "#3b82f6" }: { isActive: boolean; color?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    life: number;
  }>>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      life: 1
    });

    const animate = () => {
      if (!isActive) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Add new particles occasionally
      if (Math.random() < 0.1 && particlesRef.current.length < 50) {
        particlesRef.current.push(createParticle());
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.01;
        particle.opacity = particle.life * 0.8;

        if (particle.life <= 0) return false;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();

        return true;
      });

      // Connect nearby particles
      particlesRef.current.forEach((particle, i) => {
        particlesRef.current.slice(i + 1).forEach(other => {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 80) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `${color}${Math.floor((1 - distance / 80) * particle.opacity * other.opacity * 100).toString(16).padStart(2, '0')}`;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    if (isActive) {
      animate();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, color]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  );
};

const StepIndicator = ({ step, isActive }: { step: GenerationStep; isActive: boolean }) => {
  const IconComponent = step.icon;
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
      isActive && "bg-blue-50 border border-blue-200",
      step.status === "completed" && "bg-green-50 border border-green-200",
      step.status === "error" && "bg-red-50 border border-red-200"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
        step.status === "completed" && "bg-green-500 text-white",
        step.status === "error" && "bg-red-500 text-white",
        step.status === "active" && "bg-blue-500 text-white animate-pulse",
        step.status === "pending" && "bg-gray-200 text-gray-500"
      )}>
        {step.status === "completed" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : step.status === "error" ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <IconComponent className="h-4 w-4" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={cn(
            "font-medium text-sm",
            step.status === "active" && "text-blue-700",
            step.status === "completed" && "text-green-700",
            step.status === "error" && "text-red-700"
          )}>
            {step.title}
          </h4>
          {step.status === "active" && (
            <div className="text-xs text-blue-600 font-medium">
              {step.progress}%
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {step.description}
        </p>
        {step.status === "active" && (
          <div className="mt-2">
            <Progress value={step.progress} className="h-1" />
          </div>
        )}
      </div>
    </div>
  );
};

const AudioPreview = ({ 
  audioUrl, 
  onDownload, 
  onShare 
}: { 
  audioUrl: string; 
  onDownload: () => void;
  onShare: () => void;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-green-800 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Generation Complete!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-4 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlay}
              className="w-12 h-12 rounded-full p-0"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>Your Generated Audio</span>
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>
              <Progress value={(currentTime / duration) * 100} className="h-2" />
            </div>
          </div>
          
          <audio
            ref={audioRef}
            src={audioUrl}
            onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
            onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
            onEnded={() => setIsPlaying(false)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button onClick={onDownload} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" onClick={onShare}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function GenerationProgress({
  isGenerating,
  progress,
  currentStep,
  steps = defaultSteps,
  estimatedTimeRemaining,
  generatedPreview,
  onCancel,
  onDownload,
  onRegenerate,
  onShare,
  className
}: GenerationProgressProps) {
  const [showDetails, setShowDetails] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Timer for elapsed time
  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  // Reset timer when generation starts
  useEffect(() => {
    if (isGenerating) {
      setTimeElapsed(0);
    }
  }, [isGenerating]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (generatedPreview) return "green";
    if (currentStep?.status === "error") return "red";
    return "blue";
  };

  if (!isGenerating && !generatedPreview) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Progress Card */}
      <Card className="relative overflow-hidden">
        {/* Particle Animation Background */}
        {isGenerating && (
          <div className="absolute inset-0 opacity-10">
            <ParticleField isActive={isGenerating} color={getStatusColor() === "blue" ? "#3b82f6" : getStatusColor() === "green" ? "#10b981" : "#ef4444"} />
          </div>
        )}
        
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {generatedPreview ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Generation Complete
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Generating Your Audio
                  </>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {generatedPreview 
                  ? "Your cultural audio has been successfully generated"
                  : currentStep?.description || "Processing your audio generation request"
                }
              </p>
            </div>
            
            {isGenerating && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10 space-y-4">
          {/* Overall Progress */}
          {isGenerating && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 mb-3" />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Elapsed: {formatTime(timeElapsed)}</span>
                {estimatedTimeRemaining && (
                  <span>Remaining: ~{formatTime(estimatedTimeRemaining)}</span>
                )}
              </div>
            </div>
          )}

          {/* Generated Preview */}
          {generatedPreview && (
            <AudioPreview
              audioUrl={generatedPreview}
              onDownload={onDownload || (() => {})}
              onShare={onShare || (() => {})}
            />
          )}

          {/* Action Buttons for Completed Generation */}
          {generatedPreview && (
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onRegenerate}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Generate Another
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2"
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Steps */}
      {showDetails && isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generation Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step, index) => (
              <StepIndicator
                key={step.id}
                step={step}
                isActive={currentStep?.id === step.id}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Real-time Status Updates */}
      {isGenerating && currentStep && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              <div>
                <div className="font-medium text-blue-900 text-sm">
                  {currentStep.title} ({currentStep.progress}%)
                </div>
                <div className="text-xs text-blue-700">
                  {currentStep.description}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Tips */}
      {isGenerating && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <h5 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Did You Know?
            </h5>
            <p className="text-sm text-amber-800">
              Our AI analyzes over 50 cultural musical characteristics to ensure authentic sound generation. 
              The process takes time to preserve the integrity of traditional music elements.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}