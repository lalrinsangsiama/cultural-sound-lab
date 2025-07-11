"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Play,
  Pause,
  Volume2,
  VolumeX,
  GripVertical,
  X,
  Plus,
  Headphones,
  Music,
  AlertCircle,
  Sparkles,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioSample } from "@/lib/types/audio";

interface SelectedSample extends AudioSample {
  volume: number;
  isMuted: boolean;
  isSolo: boolean;
  position: number;
}

interface EnhancedSampleSelectionProps {
  availableSamples?: AudioSample[];
  selectedSamples?: SelectedSample[];
  onSamplesChange?: (samples: SelectedSample[]) => void;
  maxSamples?: number;
  onAddSample?: () => void;
  className?: string;
}

const MAX_SAMPLES = 5;

// Mock waveform visualization
const MiniWaveform = ({ 
  isPlaying, 
  volume = 1, 
  isMuted = false,
  color = "#3b82f6" 
}: { 
  isPlaying?: boolean; 
  volume?: number; 
  isMuted?: boolean;
  color?: string;
}) => {
  const bars = 20;
  
  return (
    <div className="flex items-end justify-center gap-px h-8 w-16">
      {Array.from({ length: bars }).map((_, i) => {
        const height = Math.sin(i * 0.5) * 0.7 + 0.3;
        const animatedHeight = isPlaying && !isMuted ? height * volume : height * 0.3;
        
        return (
          <div
            key={i}
            className={cn(
              "transition-all duration-200 rounded-sm min-h-1",
              isPlaying && !isMuted && "animate-pulse"
            )}
            style={{
              backgroundColor: isMuted ? "#9ca3af" : color,
              height: `${animatedHeight * 100}%`,
              opacity: isMuted ? 0.5 : 1,
              animationDelay: `${i * 50}ms`
            }}
          />
        );
      })}
    </div>
  );
};

const SampleCard = ({
  sample,
  onRemove,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onPlay,
  isPlaying,
  isDragging,
  dragHandleRef,
}: {
  sample: SelectedSample;
  onRemove: () => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  onPlay: () => void;
  isPlaying: boolean;
  isDragging: boolean;
  dragHandleRef: React.RefObject<HTMLDivElement>;
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn(
      "transition-all duration-200 border-2",
      isDragging && "shadow-xl scale-105 rotate-2 z-50",
      sample.isSolo && "ring-2 ring-yellow-400 bg-yellow-50",
      sample.isMuted && "opacity-60"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Drag Handle */}
            <div
              ref={dragHandleRef}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors"
              title="Drag to reorder"
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
            
            {/* Sample Info */}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm truncate">{sample.title}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {sample.culturalOrigin} • {formatDuration(sample.duration)}
              </p>
            </div>
          </div>
          
          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Waveform Visualization */}
        <div className="flex items-center justify-center py-2 bg-gray-50 rounded">
          <MiniWaveform 
            isPlaying={isPlaying}
            volume={sample.volume}
            isMuted={sample.isMuted}
            color={sample.isSolo ? "#fbbf24" : "#3b82f6"}
          />
        </div>
        
        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <Button
            variant="outline"
            size="sm"
            onClick={onPlay}
            className="flex-1"
          >
            {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          
          {/* Solo Button */}
          <Button
            variant={sample.isSolo ? "default" : "outline"}
            size="sm"
            onClick={onSoloToggle}
            className={cn(
              "px-3",
              sample.isSolo && "bg-yellow-500 hover:bg-yellow-600 text-white"
            )}
            title="Solo this track"
          >
            <Headphones className="h-4 w-4" />
          </Button>
          
          {/* Mute Button */}
          <Button
            variant={sample.isMuted ? "default" : "outline"}
            size="sm"
            onClick={onMuteToggle}
            className={cn(
              "px-3",
              sample.isMuted && "bg-red-500 hover:bg-red-600 text-white"
            )}
            title="Mute this track"
          >
            {sample.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Volume Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Volume</span>
            <span className="font-medium">{Math.round(sample.volume * 100)}%</span>
          </div>
          <Slider
            value={[sample.volume * 100]}
            onValueChange={([value]) => onVolumeChange(value / 100)}
            max={100}
            min={0}
            step={5}
            disabled={sample.isMuted}
            className="w-full"
          />
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {sample.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {sample.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{sample.tags.length - 2}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function EnhancedSampleSelection({
  availableSamples = [],
  selectedSamples = [],
  onSamplesChange,
  maxSamples = MAX_SAMPLES,
  onAddSample,
  className
}: EnhancedSampleSelectionProps) {
  const [playingSample, setPlayingSample] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);
  const dragRefs = useRef<(HTMLDivElement | null)[]>([]);

  const samplesCount = selectedSamples.length;
  const isAtMaxCapacity = samplesCount >= maxSamples;
  const hasSolo = selectedSamples.some(sample => sample.isSolo);

  // Mock audio context for visualization
  useEffect(() => {
    if (playingSample) {
      const timer = setTimeout(() => {
        setPlayingSample(null);
      }, 3000); // Mock 3-second preview
      
      return () => clearTimeout(timer);
    }
  }, [playingSample]);

  const handleSampleUpdate = useCallback((index: number, updates: Partial<SelectedSample>) => {
    const updatedSamples = [...selectedSamples];
    updatedSamples[index] = { ...updatedSamples[index], ...updates };
    onSamplesChange?.(updatedSamples);
  }, [selectedSamples, onSamplesChange]);

  const handleRemoveSample = useCallback((index: number) => {
    const updatedSamples = selectedSamples.filter((_, i) => i !== index);
    onSamplesChange?.(updatedSamples);
  }, [selectedSamples, onSamplesChange]);

  const handlePlay = useCallback((sample: SelectedSample) => {
    if (playingSample === sample.id) {
      setPlayingSample(null);
    } else {
      setPlayingSample(sample.id);
    }
  }, [playingSample]);

  const handleSoloToggle = useCallback((index: number) => {
    const updatedSamples = selectedSamples.map((sample, i) => ({
      ...sample,
      isSolo: i === index ? !sample.isSolo : false
    }));
    onSamplesChange?.(updatedSamples);
  }, [selectedSamples, onSamplesChange]);

  const handleMuteToggle = useCallback((index: number) => {
    handleSampleUpdate(index, { 
      isMuted: !selectedSamples[index].isMuted,
      isSolo: false // Clear solo when muting
    });
  }, [selectedSamples, handleSampleUpdate]);

  const resetAllControls = useCallback(() => {
    const resetSamples = selectedSamples.map(sample => ({
      ...sample,
      volume: 1,
      isMuted: false,
      isSolo: false
    }));
    onSamplesChange?.(resetSamples);
  }, [selectedSamples, onSamplesChange]);

  // Drag and Drop handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedItem(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
      const reorderedSamples = [...selectedSamples];
      const draggedSample = reorderedSamples[draggedItem];
      
      reorderedSamples.splice(draggedItem, 1);
      reorderedSamples.splice(dragOverItem, 0, draggedSample);
      
      // Update positions
      const updatedSamples = reorderedSamples.map((sample, index) => ({
        ...sample,
        position: index
      }));
      
      onSamplesChange?.(updatedSamples);
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
  }, [draggedItem, dragOverItem, selectedSamples, onSamplesChange]);

  const handleDragOver = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverItem(index);
  }, []);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Music className="h-5 w-5" />
            Selected Samples
          </h3>
          <p className="text-sm text-muted-foreground">
            Drag to reorder • Adjust volumes • Solo/mute tracks
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Sample Count */}
          <div className="flex items-center gap-2">
            <Badge 
              variant={isAtMaxCapacity ? "destructive" : "secondary"}
              className="text-sm"
            >
              {samplesCount}/{maxSamples}
            </Badge>
            {isAtMaxCapacity && (
              <div className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">Maximum reached</span>
              </div>
            )}
          </div>
          
          {/* Reset Controls */}
          {samplesCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetAllControls}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Sample Cards */}
      {samplesCount > 0 ? (
        <div className="space-y-4">
          {selectedSamples.map((sample, index) => (
            <div
              key={sample.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(index, e)}
              className={cn(
                "transition-all duration-200",
                draggedItem === index && "opacity-50",
                dragOverItem === index && draggedItem !== index && "border-t-4 border-primary"
              )}
            >
              <SampleCard
                sample={sample}
                onRemove={() => handleRemoveSample(index)}
                onVolumeChange={(volume) => handleSampleUpdate(index, { volume })}
                onMuteToggle={() => handleMuteToggle(index)}
                onSoloToggle={() => handleSoloToggle(index)}
                onPlay={() => handlePlay(sample)}
                isPlaying={playingSample === sample.id}
                isDragging={draggedItem === index}
                dragHandleRef={el => dragRefs.current[index] = el}
              />
            </div>
          ))}
          
          {/* Mixing Preview */}
          <Card className="border-dashed border-2 border-gray-300 bg-gray-50/50">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Mixed Preview</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Your samples will be intelligently mixed based on their cultural origins and musical characteristics
              </p>
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>Primary: {selectedSamples.find(s => !s.isMuted && !hasSolo) || selectedSamples.find(s => s.isSolo)?.title || "None"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Layers: {selectedSamples.filter(s => !s.isMuted && !s.isSolo).length - 1}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Empty State
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Music className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold mb-2">No Samples Selected</h4>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Choose up to {maxSamples} cultural audio samples to create your unique composition. 
              Mix traditional instruments and vocals for authentic sound.
            </p>
            <Button onClick={onAddSample} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Sample
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add More Samples */}
      {samplesCount > 0 && !isAtMaxCapacity && (
        <Button
          variant="outline"
          onClick={onAddSample}
          className="w-full border-dashed border-2 h-12 flex items-center gap-2 hover:bg-primary/5 hover:border-primary"
        >
          <Plus className="h-4 w-4" />
          Add Another Sample ({maxSamples - samplesCount} remaining)
        </Button>
      )}

      {/* Pro Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Pro Tips
        </h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use <strong>Solo</strong> to isolate and focus on individual tracks</li>
          <li>• <strong>Drag</strong> samples to reorder them in the mix</li>
          <li>• Keep volumes balanced - dominant sample around 80-100%</li>
          <li>• Mix different instrument types for richer compositions</li>
        </ul>
      </div>
    </div>
  );
}