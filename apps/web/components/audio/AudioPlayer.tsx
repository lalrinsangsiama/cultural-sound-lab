"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  MoreHorizontal
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
import { AudioPlayerProps, AudioPlayerState } from "@/lib/types/audio";

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export default function AudioPlayer({ 
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
  className
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: duration,
    volume: 1,
    isMuted: false,
    isLoading: false,
    error: null,
    isBuffering: false,
    playbackRate: 1,
  });

  const [isLiked, setIsLiked] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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

    const handleVolumeChange = () => {
      setState(prev => ({
        ...prev,
        volume: audio.volume,
        isMuted: audio.muted,
      }));
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("error", handleError);
    audio.addEventListener("volumechange", handleVolumeChange);

    // Set initial properties
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
      audio.removeEventListener("volumechange", handleVolumeChange);
      audio.pause();
    };
  }, [src, autoPlay, loop, onTimeUpdate, onEnded, onError]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (state.isPlaying) {
      audio.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
      onPause?.();
    } else {
      try {
        // Handle browser autoplay restrictions
        if (audio.muted) {
          audio.muted = false;
        }
        
        // Ensure volume is audible
        if (audio.volume === 0) {
          audio.volume = 0.7;
        }

        // For Safari/iOS: ensure audio context is resumed
        if (typeof window !== 'undefined' && 'webkitAudioContext' in window) {
          // This helps with iOS audio playback
          audio.load();
        }

        await audio.play();
        setState(prev => ({ 
          ...prev, 
          isPlaying: true,
          volume: audio.volume,
          isMuted: audio.muted 
        }));
        onPlay?.();
      } catch (error) {
        console.error('Audio play error:', error);
        setState(prev => ({ 
          ...prev, 
          error: "Failed to play audio. Please try clicking play again.",
          isPlaying: false 
        }));
      }
    }
  }, [state.isPlaying, onPlay, onPause]);

  const handleSeek = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0] ?? 0;
    audio.currentTime = newTime;
    setState(prev => ({ ...prev, currentTime: newTime }));
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0] ?? 0;
    audio.volume = newVolume;
    setState(prev => ({ 
      ...prev, 
      volume: newVolume,
      isMuted: newVolume === 0
    }));
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !audio.muted;
    setState(prev => ({ ...prev, isMuted: audio.muted }));
  }, []);

  const skipTime = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(state.duration, state.currentTime + seconds));
    audio.currentTime = newTime;
    setState(prev => ({ ...prev, currentTime: newTime }));
  }, [state.currentTime, state.duration]);

  const changePlaybackRate = useCallback((rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = rate;
    setState(prev => ({ ...prev, playbackRate: rate }));
  }, []);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setState(prev => ({ ...prev, currentTime: 0 }));
  }, []);

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
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(src);
    }
  }, [src, title, artist]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case ' ':
      case 'k':
        event.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        skipTime(-10);
        break;
      case 'ArrowRight':
        event.preventDefault();
        skipTime(10);
        break;
      case 'm':
        event.preventDefault();
        toggleMute();
        break;
      case 'r':
        event.preventDefault();
        restart();
        break;
      case 'ArrowUp':
        event.preventDefault();
        handleVolumeChange([Math.min(1, state.volume + 0.1)]);
        break;
      case 'ArrowDown':
        event.preventDefault();
        handleVolumeChange([Math.max(0, state.volume - 0.1)]);
        break;
    }
  }, [togglePlay, skipTime, toggleMute, restart, handleVolumeChange, state.volume]);

  if (state.error) {
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
    <Card 
      className={cn("p-4 space-y-4", className)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={`Audio player for ${title} by ${artist}`}
    >
      <audio 
        ref={audioRef} 
        src={src} 
        preload="metadata" 
        aria-label={`Audio player for ${title} by ${artist}`}
      />
      
      {/* Screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {state.isPlaying && `Playing ${title}`}
        {!state.isPlaying && state.currentTime > 0 && `Paused ${title}`}
        {state.isBuffering && "Loading audio..."}
        {state.error && `Error: ${state.error}`}
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{title}</h3>
          <p className="text-sm text-muted-foreground truncate">{artist}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLiked(!isLiked)}
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={isLiked}
            className={cn(
              "transition-colors",
              isLiked ? "text-red-500" : "text-muted-foreground"
            )}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="More options">
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
              <DropdownMenuItem onClick={() => changePlaybackRate(0.5)}>
                0.5x Speed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changePlaybackRate(1)}>
                1x Speed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changePlaybackRate(1.5)}>
                1.5x Speed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changePlaybackRate(2)}>
                2x Speed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={[state.currentTime]}
          onValueChange={handleSeek}
          max={state.duration}
          step={0.1}
          className="w-full"
          disabled={state.isLoading}
          aria-label="Seek audio position"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(state.currentTime)}</span>
          <div className="flex items-center space-x-2">
            {state.isBuffering && (
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
            {state.playbackRate !== 1 && (
              <Badge variant="secondary" className="text-xs">
                {state.playbackRate}x
              </Badge>
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
          onClick={restart}
          disabled={state.isLoading}
          aria-label="Restart track"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => skipTime(-10)}
          disabled={state.isLoading}
          aria-label="Skip back 10 seconds"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={togglePlay}
          disabled={state.isLoading}
          className="h-12 w-12 rounded-full"
          aria-label={state.isPlaying ? "Pause" : "Play"}
        >
          {state.isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          ) : state.isPlaying ? (
            <Pause className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Play className="h-5 w-5" aria-hidden="true" />
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => skipTime(10)}
          disabled={state.isLoading}
          aria-label="Skip forward 10 seconds"
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
            aria-label={state.isMuted ? "Unmute" : "Mute"}
            aria-pressed={state.isMuted}
          >
            {state.isMuted ? (
              <VolumeX className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Volume2 className="h-4 w-4" aria-hidden="true" />
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
                aria-label="Volume control"
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}