"use client";

import { useState, useCallback } from "react";
import { 
  Play, 
  Pause, 
  Plus, 
  Heart, 
  Download, 
  Info, 
  Music,
  Clock,
  HardDrive,
  Mic,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { AudioGridProps, AudioSample } from "@/lib/types/audio";

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

interface AudioSampleCardProps {
  sample: AudioSample;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: (sample: AudioSample) => void;
  onPlay: (sample: AudioSample) => void;
  onUseInGeneration: (sample: AudioSample) => void;
}

function AudioSampleCard({
  sample,
  isSelected,
  isPlaying,
  onSelect,
  onPlay,
  onUseInGeneration,
}: AudioSampleCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handlePlay = useCallback(async () => {
    setIsLoadingPreview(true);
    try {
      await onPlay(sample);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [onPlay, sample]);

  const getInstrumentIcon = (instrumentType: string) => {
    switch (instrumentType.toLowerCase()) {
      case 'percussion':
        return <div className="w-4 h-4 rounded-full bg-red-500" />;
      case 'wind':
        return <Mic className="w-4 h-4 text-blue-500" />;
      case 'string':
        return <Music className="w-4 h-4 text-green-500" />;
      case 'vocal':
        return <Mic className="w-4 h-4 text-purple-500" />;
      default:
        return <Music className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card 
      className={cn(
        "group hover:shadow-md transition-all duration-200 cursor-pointer",
        isSelected && "ring-2 ring-primary bg-primary/5"
      )}
      onClick={() => onSelect(sample)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getInstrumentIcon(sample.instrumentType)}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base leading-tight truncate">
                {sample.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground truncate">
                {sample.culturalOrigin} • {sample.instrumentType}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity",
              isLiked && "opacity-100 text-red-500"
            )}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {sample.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {sample.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handlePlay();
            }}
            disabled={isLoadingPreview}
            className="flex-1 h-10 md:h-8" // Taller on mobile
          >
            {isLoadingPreview ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1 md:h-3 md:w-3" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4 mr-1 md:h-3 md:w-3" />
            ) : (
              <Play className="h-4 w-4 mr-1 md:h-3 md:w-3" />
            )}
            <span className="text-sm md:text-xs">
              {isLoadingPreview ? "Loading..." : isPlaying ? "Pause" : "Preview"}
            </span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // Handle info/details
            }}
            className="h-10 w-10 md:h-8 md:w-8" // Larger tap target on mobile
          >
            <Info className="h-4 w-4 md:h-3 md:w-3" />
          </Button>
        </div>

        {/* Use in Generation Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onUseInGeneration(sample);
          }}
          className="w-full h-12 md:h-10" // Taller on mobile for easier tapping
          disabled={isSelected}
        >
          <Plus className="h-5 w-5 mr-2 md:h-4 md:w-4" />
          <span className="text-sm font-medium">
            {isSelected ? "Added to Generation" : "Use in Generation"}
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AudioGrid({
  samples,
  columns = 3,
  onSampleSelect,
  onSamplePlay,
  onUseInGeneration,
  selectedSamples = [],
  loading = false,
  error,
  className,
}: AudioGridProps) {
  const [playingSample, setPlayingSample] = useState<string | null>(null);

  const handleSamplePlay = useCallback((sample: AudioSample) => {
    if (playingSample === sample.id) {
      setPlayingSample(null);
    } else {
      setPlayingSample(sample.id);
      onSamplePlay?.(sample);
    }
  }, [playingSample, onSamplePlay]);

  const handleSampleSelect = useCallback((sample: AudioSample) => {
    onSampleSelect?.(sample);
  }, [onSampleSelect]);

  const handleUseInGeneration = useCallback((sample: AudioSample) => {
    onUseInGeneration?.(sample);
  }, [onUseInGeneration]);

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded flex-1" />
                    <div className="h-6 bg-gray-200 rounded w-10" />
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>
          <div className="flex items-center space-x-2">
            <Music className="h-4 w-4" />
            <span>Error loading audio samples: {error}</span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (samples.length === 0) {
    return (
      <Card className={cn("p-12", className)}>
        <div className="text-center">
          <Music className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Audio Samples Found</h3>
          <p className="text-muted-foreground">
            Upload some audio files to get started with music generation.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Music className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Audio Samples</h2>
          <Badge variant="secondary">{samples.length}</Badge>
        </div>
        {selectedSamples.length > 0 && (
          <Badge variant="default">
            {selectedSamples.length} selected for generation
          </Badge>
        )}
      </div>

      {/* Grid */}
      <div 
        className={cn(
          "grid gap-4",
          // Mobile-first: always single column on mobile
          "grid-cols-1",
          // Desktop breakpoints
          columns === 2 && "md:grid-cols-2",
          columns === 3 && "md:grid-cols-2 lg:grid-cols-3",
          columns === 4 && "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        )}
      >
        {samples.map((sample) => (
          <AudioSampleCard
            key={sample.id}
            sample={sample}
            isSelected={selectedSamples.includes(sample.id)}
            isPlaying={playingSample === sample.id}
            onSelect={handleSampleSelect}
            onPlay={handleSamplePlay}
            onUseInGeneration={handleUseInGeneration}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {samples.length} audio samples from Cultural Sound Lab
      </div>
    </div>
  );
}