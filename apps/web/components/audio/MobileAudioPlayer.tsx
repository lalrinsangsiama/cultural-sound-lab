"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Heart,
  Download,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { AudioPlayerProps, AudioPlayerState } from "@/lib/types/audio";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useOrientation } from "@/hooks/useOrientation";

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

interface MobileAudioPlayerProps extends AudioPlayerProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  position?: "fixed" | "relative";
}

export default function MobileAudioPlayer({ 
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
  isMinimized = false,
  onToggleMinimize,
  position = "fixed"
}: MobileAudioPlayerProps) {
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
  const [isDragging, setIsDragging] = useState(false);
  
  const { triggerHaptic, triggerSelection, triggerSuccess } = useHapticFeedback();
  const { isLandscape } = useOrientation();

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
      if (!isDragging) {
        const currentTime = audio.currentTime;
        setState(prev => ({
          ...prev,
          currentTime,
          isBuffering: false,
        }));
        onTimeUpdate?.(currentTime);
      }
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
        // Autoplay failed
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
    };
  }, [src, autoPlay, loop, onTimeUpdate, onEnded, onError, isDragging]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    triggerSelection();

    if (state.isPlaying) {
      audio.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
      onPause?.();
    } else {
      try {
        await audio.play();
        setState(prev => ({ ...prev, isPlaying: true }));
        triggerSuccess();
        onPlay?.();
      } catch (error) {
        triggerHaptic('heavy');
        setState(prev => ({ 
          ...prev, 
          error: "Failed to play audio",
          isPlaying: false 
        }));
      }
    }
  }, [state.isPlaying, onPlay, onPause, triggerSelection, triggerSuccess, triggerHaptic]);

  const handleSeek = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0] || 0;
    audio.currentTime = newTime;
    setState(prev => ({ ...prev, currentTime: newTime }));
  }, []);

  const handleSeekStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleSeekEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0] || 0;
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

  if (state.error) {
    return null; // Hide player on error in mobile view
  }

  const containerClasses = cn(
    "bg-white border-t shadow-lg transition-all duration-300 ease-in-out",
    position === "fixed" && "fixed bottom-16 left-0 right-0 z-40 md:hidden",
    position === "relative" && "relative",
    isMinimized ? "h-16" : "h-auto",
    isLandscape && !isMinimized && "landscape:max-h-screen landscape:overflow-y-auto",
    className
  );

  return (
    <div className={containerClasses}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {isMinimized ? (
        /* Minimized Player */
        <div className="flex items-center px-4 py-3 h-16">
          <Button
            onClick={togglePlay}
            size="icon"
            className="h-10 w-10 rounded-full flex-shrink-0"
            disabled={state.isLoading}
          >
            {state.isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : state.isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex-1 min-w-0 mx-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{title}</p>
                <p className="text-xs text-gray-500 truncate">{artist}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleMinimize}
                className="h-8 w-8 flex-shrink-0"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Expanded Player */
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{title}</h3>
              <p className="text-sm text-gray-600 truncate">{artist}</p>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLiked(!isLiked)}
                className={cn(
                  "h-8 w-8",
                  isLiked ? "text-red-500" : "text-gray-500"
                )}
              >
                <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
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
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleMinimize}
                className="h-8 w-8"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[state.currentTime]}
              onValueChange={handleSeek}
              onPointerDown={handleSeekStart}
              onPointerUp={handleSeekEnd}
              max={state.duration}
              step={0.1}
              className="w-full"
              disabled={state.isLoading}
            />
            <div className="flex justify-between text-xs text-gray-500">
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
          <div className="flex items-center justify-center space-x-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skipTime(-10)}
              disabled={state.isLoading}
              className="h-10 w-10"
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            
            <Button
              onClick={togglePlay}
              disabled={state.isLoading}
              className="h-14 w-14 rounded-full"
            >
              {state.isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : state.isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skipTime(10)}
              disabled={state.isLoading}
              className="h-10 w-10"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-8 w-8"
            >
              {state.isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <div className="flex-1 max-w-32">
              <Slider
                value={[state.isMuted ? 0 : state.volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}