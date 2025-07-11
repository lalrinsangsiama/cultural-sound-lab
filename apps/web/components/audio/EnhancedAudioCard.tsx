"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Heart, 
  Plus,
  Download,
  Share,
  Info,
  Music,
  Clock,
  HardDrive,
  Mic,
  Loader2,
  Star,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioSample } from "@/lib/types/audio";

interface EnhancedAudioCardProps {
  sample: AudioSample;
  isSelected?: boolean;
  isPlaying?: boolean;
  isFavorited?: boolean;
  isListView?: boolean;
  onSelect?: (sample: AudioSample) => void;
  onPlay?: (sample: AudioSample) => void;
  onFavorite?: (sample: AudioSample) => void;
  onAddToProject?: (sample: AudioSample) => void;
  onDownload?: (sample: AudioSample) => void;
  onShare?: (sample: AudioSample) => void;
  onInfo?: (sample: AudioSample) => void;
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Mock waveform data generator
const generateWaveformPath = (width: number = 100, height: number = 24) => {
  const points = 50;
  const step = width / points;
  let path = `M 0 ${height / 2}`;
  
  for (let i = 0; i < points; i++) {
    const x = i * step;
    const amplitude = Math.random() * 0.8 + 0.1;
    const y = height / 2 + (Math.sin(i * 0.3) * amplitude * height / 2);
    path += ` L ${x} ${y}`;
  }
  
  return path;
};

const MiniWaveform = ({ isPlaying, progress = 0.3 }: { isPlaying?: boolean; progress?: number }) => {
  const waveformPath = generateWaveformPath(80, 20);
  
  return (
    <div className="relative w-20 h-5 bg-gray-100 rounded overflow-hidden">
      <svg 
        width="80" 
        height="20" 
        className="absolute inset-0"
        viewBox="0 0 80 20"
      >
        {/* Background waveform */}
        <path
          d={waveformPath}
          stroke="#e5e7eb"
          strokeWidth="1"
          fill="none"
          className="opacity-60"
        />
        {/* Progress waveform */}
        <defs>
          <clipPath id="progress-clip">
            <rect x="0" y="0" width={80 * progress} height="20" />
          </clipPath>
        </defs>
        <path
          d={waveformPath}
          stroke="#3b82f6"
          strokeWidth="1"
          fill="none"
          clipPath="url(#progress-clip)"
          className={cn("transition-all duration-300", isPlaying && "animate-pulse")}
        />
      </svg>
      {isPlaying && (
        <div 
          className="absolute top-0 bg-blue-500 w-0.5 h-full transition-all duration-300"
          style={{ left: `${progress * 100}%` }}
        />
      )}
    </div>
  );
};

const getInstrumentIcon = (instrumentType: string) => {
  switch (instrumentType.toLowerCase()) {
    case 'percussion':
      return <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">🥁</div>;
    case 'wind':
      return <Mic className="w-4 h-4 text-blue-500" />;
    case 'string':
      return <Music className="w-4 h-4 text-green-500" />;
    case 'vocal':
      return <Mic className="w-4 h-4 text-purple-500" />;
    case 'ensemble':
      return <div className="w-4 h-4 rounded bg-orange-500 flex items-center justify-center text-white text-xs">🎼</div>;
    default:
      return <Music className="w-4 h-4 text-gray-500" />;
  }
};

const getCulturalFlag = (culturalOrigin: string) => {
  const flags: Record<string, string> = {
    'Mizo': '🏔️',
    'Naga': '🏔️',
    'Khasi': '🏔️',
    'Manipuri': '🏔️',
    'Assamese': '🏔️',
  };
  return flags[culturalOrigin] || '🎵';
};

const PlayButton = ({ isPlaying, isLoading, onClick }: { 
  isPlaying?: boolean; 
  isLoading?: boolean; 
  onClick: () => void;
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { id: Date.now(), x, y };
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
    
    onClick();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "relative overflow-hidden w-12 h-12 rounded-full p-0 border-2 transition-all duration-200",
        isPlaying 
          ? "border-blue-500 bg-blue-50 text-blue-600 shadow-md transform scale-105" 
          : "border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md hover:scale-105"
      )}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isPlaying ? (
        <Pause className="h-5 w-5" />
      ) : (
        <Play className="h-5 w-5 ml-0.5" />
      )}
      
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-blue-400 rounded-full opacity-30 animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </Button>
  );
};

export default function EnhancedAudioCard({
  sample,
  isSelected = false,
  isPlaying = false,
  isFavorited = false,
  isListView = false,
  onSelect,
  onPlay,
  onFavorite,
  onAddToProject,
  onDownload,
  onShare,
  onInfo,
}: EnhancedAudioCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handlePlay = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onPlay?.(sample);
    } finally {
      setIsLoading(false);
    }
  }, [onPlay, sample, isLoading]);

  const handleAction = (action: () => void, event: React.MouseEvent) => {
    event.stopPropagation();
    action();
  };

  if (isListView) {
    return (
      <Card 
        className={cn(
          "group transition-all duration-300 cursor-pointer border-l-4",
          isSelected 
            ? "ring-2 ring-primary bg-primary/5 shadow-md border-l-primary" 
            : "hover:shadow-lg hover:bg-gray-50/50 border-l-transparent hover:border-l-blue-300",
          isHovered && "transform scale-[1.02]"
        )}
        onClick={() => onSelect?.(sample)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <PlayButton 
                isPlaying={isPlaying} 
                isLoading={isLoading} 
                onClick={handlePlay}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getInstrumentIcon(sample.instrumentType)}
                    <h3 className="font-semibold text-lg truncate">{sample.title}</h3>
                    <Badge className="flex items-center gap-1 bg-gray-100 text-gray-700">
                      <span>{getCulturalFlag(sample.culturalOrigin)}</span>
                      {sample.culturalOrigin}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                    {sample.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(sample.duration)}
                    </div>
                    <div className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatFileSize(sample.fileSize)}
                    </div>
                    <span>{sample.sampleRate} Hz</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <MiniWaveform isPlaying={isPlaying} />
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleAction(() => onFavorite?.(sample), e)}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 transition-opacity",
                        isFavorited && "opacity-100 text-red-500"
                      )}
                    >
                      <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleAction(() => onAddToProject?.(sample), e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleAction(() => onInfo?.(sample), e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "group transition-all duration-300 cursor-pointer relative overflow-hidden",
        isSelected 
          ? "ring-2 ring-primary bg-primary/5 shadow-lg border-primary/30" 
          : "hover:shadow-xl hover:shadow-blue-100/50",
        isHovered && "transform scale-105"
      )}
      onClick={() => onSelect?.(sample)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating shadow effect */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300",
        isHovered && "opacity-100"
      )} />
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10">
          <CheckCircle2 className="h-5 w-5 text-primary bg-white rounded-full" />
        </div>
      )}

      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {getInstrumentIcon(sample.instrumentType)}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base leading-tight truncate">
                {sample.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground truncate">
                  {sample.instrumentType}
                </p>
                <Badge className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700">
                  <span>{getCulturalFlag(sample.culturalOrigin)}</span>
                  {sample.culturalOrigin}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleAction(() => onFavorite?.(sample), e)}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110",
                isFavorited && "opacity-100 text-red-500"
              )}
            >
              <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleAction(() => onShare?.(sample), e)}
              className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {sample.description}
        </p>

        {/* Mini waveform */}
        <div className="flex items-center justify-center py-2">
          <MiniWaveform isPlaying={isPlaying} />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {sample.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs hover:bg-primary/20 transition-colors">
              {tag}
            </Badge>
          ))}
          {sample.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{sample.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(sample.duration)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <HardDrive className="h-3 w-3" />
              <span>{formatFileSize(sample.fileSize)}</span>
            </div>
          </div>
          <span>{sample.sampleRate} Hz</span>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-shrink-0">
              <PlayButton 
                isPlaying={isPlaying} 
                isLoading={isLoading} 
                onClick={handlePlay}
              />
            </div>
            
            <div className="flex-1 grid grid-cols-3 gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleAction(() => onInfo?.(sample), e)}
                className="transition-all duration-200 hover:bg-blue-50 hover:border-blue-300"
              >
                <Info className="h-3 w-3" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleAction(() => onDownload?.(sample), e)}
                className="transition-all duration-200 hover:bg-green-50 hover:border-green-300"
              >
                <Download className="h-3 w-3" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleAction(() => onAddToProject?.(sample), e)}
                className="transition-all duration-200 hover:bg-purple-50 hover:border-purple-300"
              >
                <Star className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Button
            onClick={(e) => handleAction(() => onAddToProject?.(sample), e)}
            className={cn(
              "w-full transition-all duration-200",
              isSelected 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-primary hover:bg-primary/90"
            )}
            disabled={isSelected}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isSelected ? "Added to Project" : "Add to Project"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}