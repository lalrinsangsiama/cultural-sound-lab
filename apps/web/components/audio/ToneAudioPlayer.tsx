"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as Tone from "tone";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward, 
  RotateCcw,
  Download,
  Share2,
  Heart,
  MoreHorizontal,
  Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ToneAudioPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  duration?: number;
  autoPlay?: boolean;
  loop?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onError?: (error: string) => void;
  className?: string;
  enableEffects?: boolean;
}

interface TonePlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  isBuffering: boolean;
  playbackRate: number;
  // Tone.js specific effects
  reverbWet: number;
  delayWet: number;
  filterFrequency: number;
  distortionAmount: number;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export default function ToneAudioPlayer({ 
  src, 
  title = "Unknown Track",
  artist = "Unknown Artist",
  duration = 0, 
  autoPlay = false,
  loop = false,
  onPlay, 
  onPause, 
  onEnded,
  onTimeUpdate,
  onError,
  className,
  enableEffects = true
}: ToneAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const tonePlayerRef = useRef<Tone.Player | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const delayRef = useRef<Tone.Delay | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const distortionRef = useRef<Tone.Distortion | null>(null);
  
  const [state, setState] = useState<TonePlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: duration,
    volume: 1,
    isMuted: false,
    isLoading: false,
    error: null,
    isBuffering: false,
    playbackRate: 1,
    reverbWet: 0,
    delayWet: 0,
    filterFrequency: 1000,
    distortionAmount: 0,
  });

  const [isLiked, setIsLiked] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showEffects, setShowEffects] = useState(false);

  // Initialize Tone.js components
  useEffect(() => {
    if (!enableEffects || typeof window === "undefined") return;

    const initTone = async () => {
      try {
        const Tone = await import("tone");
        
        // Create audio effects chain
        reverbRef.current = new Tone.Reverb(2).toDestination();
        delayRef.current = new Tone.Delay("8n").toDestination();
        filterRef.current = new Tone.Filter(1000, "lowpass").connect(reverbRef.current);
        distortionRef.current = new Tone.Distortion(0).connect(filterRef.current);
        
        // Create Tone.js player
        tonePlayerRef.current = new Tone.Player({
          url: src,
          loop: loop,
          autostart: autoPlay,
          onload: () => {
            setState(prev => ({
              ...prev,
              duration: tonePlayerRef.current?.buffer?.duration || 0,
              isLoading: false,
            }));
          },
          onerror: (error: Error) => {
            setState(prev => ({
              ...prev,
              error: "Failed to load audio with Tone.js",
              isLoading: false,
            }));
            onError?.(error.message);
          }
        }).connect(distortionRef.current);

        // Set initial effect values
        if (reverbRef.current) reverbRef.current.wet.value = state.reverbWet;
        if (delayRef.current) (delayRef.current as any).wet.value = state.delayWet;
        filterRef.current.frequency.value = state.filterFrequency;
        distortionRef.current.distortion = state.distortionAmount;

      } catch (error) {
        console.error("Failed to initialize Tone.js:", error);
        setState(prev => ({
          ...prev,
          error: "Tone.js not available, using fallback player",
          isLoading: false,
        }));
      }
    };

    initTone();

    return () => {
      if (tonePlayerRef.current) {
        tonePlayerRef.current.dispose();
      }
      if (reverbRef.current) {
        reverbRef.current.dispose();
      }
      if (delayRef.current) {
        delayRef.current.dispose();
      }
      if (filterRef.current) {
        filterRef.current.dispose();
      }
      if (distortionRef.current) {
        distortionRef.current.dispose();
      }
    };
  }, [src, autoPlay, loop, enableEffects]);

  // Fallback to regular HTML audio if Tone.js fails
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || (enableEffects && tonePlayerRef.current)) return;

    const handleLoadedMetadata = () => {
      setState(prev => ({
        ...prev,
        duration: audio.duration,
        isLoading: false,
      }));
    };

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      setState(prev => ({
        ...prev,
        currentTime,
        isBuffering: false,
      }));
      onTimeUpdate?.(currentTime);
    };

    const handleEnded = () => {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
      }));
      onEnded?.();
    };

    const handleLoadStart = () => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));
    };

    const handleCanPlay = () => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isBuffering: false,
      }));
    };

    const handleWaiting = () => {
      setState(prev => ({
        ...prev,
        isBuffering: true,
      }));
    };

    const handleError = () => {
      const error = "Failed to load audio";
      setState(prev => ({
        ...prev,
        isLoading: false,
        isBuffering: false,
        error,
      }));
      onError?.(error);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("error", handleError);

    audio.loop = loop;
    if (autoPlay) {
      audio.play().catch(() => {
        // Autoplay failed, which is expected in most browsers
      });
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("error", handleError);
      audio.pause();
    };
  }, [src, autoPlay, loop, onTimeUpdate, onEnded, onError, enableEffects]);

  const togglePlay = useCallback(async () => {
    if (enableEffects && tonePlayerRef.current) {
      // Use Tone.js player
      if (state.isPlaying) {
        tonePlayerRef.current.stop();
        setState(prev => ({ ...prev, isPlaying: false }));
        onPause?.();
      } else {
        try {
          const Tone = await import("tone");
          await Tone.start(); // Start audio context
          tonePlayerRef.current.start();
          setState(prev => ({ ...prev, isPlaying: true }));
          onPlay?.();
        } catch (error) {
          setState(prev => ({ 
            ...prev, 
            error: "Failed to play audio with Tone.js",
            isPlaying: false 
          }));
        }
      }
    } else {
      // Use regular HTML audio
      const audio = audioRef.current;
      if (!audio) return;

      if (state.isPlaying) {
        audio.pause();
        setState(prev => ({ ...prev, isPlaying: false }));
        onPause?.();
      } else {
        try {
          await audio.play();
          setState(prev => ({ ...prev, isPlaying: true }));
          onPlay?.();
        } catch (error) {
          setState(prev => ({ 
            ...prev, 
            error: "Failed to play audio",
            isPlaying: false 
          }));
        }
      }
    }
  }, [state.isPlaying, onPlay, onPause, enableEffects]);

  const handleSeek = useCallback((value: number[]) => {
    const newTime = value[0];
    
    if (enableEffects && tonePlayerRef.current) {
      // Tone.js seeking is more complex, skip for now
      console.log("Seeking with Tone.js not implemented");
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = newTime || 0;
      setState(prev => ({ ...prev, currentTime: newTime || 0 }));
    }
  }, [enableEffects]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    
    if (enableEffects && tonePlayerRef.current) {
      tonePlayerRef.current.volume.value = (newVolume - 1) * 60; // Convert to dB
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      audio.volume = newVolume;
    }
    
    setState(prev => ({ 
      ...prev, 
      volume: newVolume,
      isMuted: newVolume === 0
    }));
  }, [enableEffects]);

  const handleEffectChange = useCallback((effect: string, value: number) => {
    if (!enableEffects) return;

    setState(prev => ({ ...prev, [effect]: value }));

    switch (effect) {
      case 'reverbWet':
        if (reverbRef.current) {
          reverbRef.current.wet.value = value;
        }
        break;
      case 'delayWet':
        if (delayRef.current) {
          delayRef.current.wet.value = value;
        }
        break;
      case 'filterFrequency':
        if (filterRef.current) {
          filterRef.current.frequency.value = value;
        }
        break;
      case 'distortionAmount':
        if (distortionRef.current) {
          distortionRef.current.distortion = value;
        }
        break;
    }
  }, [enableEffects]);

  const toggleMute = useCallback(() => {
    if (enableEffects && tonePlayerRef.current) {
      const newMuted = !state.isMuted;
      tonePlayerRef.current.mute = newMuted;
      setState(prev => ({ ...prev, isMuted: newMuted }));
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      audio.muted = !audio.muted;
      setState(prev => ({ ...prev, isMuted: audio.muted }));
    }
  }, [state.isMuted, enableEffects]);

  const skipTime = useCallback((seconds: number) => {
    const newTime = Math.max(0, Math.min(state.duration, state.currentTime + seconds));
    handleSeek([newTime]);
  }, [state.currentTime, state.duration, handleSeek]);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `${title}.mp3`;
    link.click();
  }, [src, title]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `Listen to ${title} by ${artist}`,
        url: src,
      });
    } else {
      navigator.clipboard.writeText(src);
    }
  }, [src, title, artist]);

  if (state.error && !enableEffects) {
    return (
      <Card className={cn("p-4 border-red-200 bg-red-50", className)}>
        <div className="text-center text-red-600">
          <p className="font-medium">Audio Error</p>
          <p className="text-sm">{state.error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{title}</h3>
          <p className="text-sm text-muted-foreground truncate">{artist}</p>
          {enableEffects && (
            <Badge variant="outline" className="text-xs mt-1">
              Tone.js Enhanced
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {enableEffects && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEffects(!showEffects)}
            >
              <Sliders className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLiked(!isLiked)}
            className={cn(
              "transition-colors",
              isLiked ? "text-red-500" : "text-muted-foreground"
            )}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Effects Panel */}
      {enableEffects && showEffects && (
        <Card className="p-3 bg-muted/50">
          <h4 className="text-sm font-medium mb-3">Audio Effects</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium">Reverb</label>
              <Slider
                value={[state.reverbWet]}
                onValueChange={(value) => handleEffectChange('reverbWet', value[0])}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Delay</label>
              <Slider
                value={[state.delayWet]}
                onValueChange={(value) => handleEffectChange('delayWet', value[0])}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Filter Freq</label>
              <Slider
                value={[state.filterFrequency]}
                onValueChange={(value) => handleEffectChange('filterFrequency', value[0])}
                min={100}
                max={5000}
                step={100}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Distortion</label>
              <Slider
                value={[state.distortionAmount]}
                onValueChange={(value) => handleEffectChange('distortionAmount', value[0])}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={[state.currentTime]}
          onValueChange={handleSeek}
          max={state.duration}
          step={0.1}
          className="w-full"
          disabled={state.isLoading}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(state.currentTime)}</span>
          <div className="flex items-center space-x-2">
            {state.isBuffering && (
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <span>{formatTime(state.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => skipTime(-10)}
          disabled={state.isLoading}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={togglePlay}
          disabled={state.isLoading}
          className="h-12 w-12 rounded-full"
        >
          {state.isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : state.isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => skipTime(10)}
          disabled={state.isLoading}
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            {state.isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          
          {showVolumeSlider && (
            <div 
              className="w-20"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <Slider
                value={[state.isMuted ? 0 : state.volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}