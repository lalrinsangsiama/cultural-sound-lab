"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { WaveformDisplayProps } from "@/lib/types/audio";

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function WaveformDisplay({
  audioUrl,
  height = 128,
  waveColor = "#e5e7eb",
  progressColor = "#3b82f6",
  cursorColor = "#ef4444",
  responsive = true,
  normalize = true,
  onReady,
  onPlay,
  onPause,
  onFinish,
  onSeek,
  className,
}: WaveformDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let wavesurfer: any = null;

    const initWaveSurfer = async () => {
      try {
        // Dynamic import for client-side only
        const WaveSurfer = (await import("wavesurfer.js")).default;
        
        wavesurfer = WaveSurfer.create({
          container: containerRef.current!,
          waveColor,
          progressColor,
          cursorColor,
          height,
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          responsive,
          normalize,
          backend: "WebAudio",
          mediaControls: false,
          interact: true,
          dragToSeek: true,
          hideScrollbar: true,
          fillParent: true,
        });

        wavesurferRef.current = wavesurfer;

        // Event listeners
        wavesurfer.on("ready", () => {
          setIsLoading(false);
          setDuration(wavesurfer.getDuration());
          setPeaks(wavesurfer.getDecodedData()?.getChannelData(0) || []);
          onReady?.();
        });

        wavesurfer.on("play", () => {
          setIsPlaying(true);
          onPlay?.();
        });

        wavesurfer.on("pause", () => {
          setIsPlaying(false);
          onPause?.();
        });

        wavesurfer.on("finish", () => {
          setIsPlaying(false);
          onFinish?.();
        });

        wavesurfer.on("audioprocess", () => {
          setCurrentTime(wavesurfer.getCurrentTime());
        });

        wavesurfer.on("seek", (progress: number) => {
          const seekTime = progress * duration;
          setCurrentTime(seekTime);
          onSeek?.(seekTime);
        });

        wavesurfer.on("volume", (vol: number) => {
          setVolume(vol);
          setIsMuted(vol === 0);
        });

        wavesurfer.on("error", (err: Error) => {
          setError(err.message);
          setIsLoading(false);
        });

        // Load audio
        await wavesurfer.load(audioUrl);

      } catch (err) {
        console.error("Failed to initialize WaveSurfer:", err);
        setError("Failed to load audio waveform");
        setIsLoading(false);
      }
    };

    initWaveSurfer();

    return () => {
      if (wavesurfer) {
        wavesurfer.destroy();
      }
    };
  }, [audioUrl, height, waveColor, progressColor, cursorColor, responsive, normalize, onReady, onPlay, onPause, onFinish, onSeek, duration]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(newVolume);
    }
  };

  const toggleMute = () => {
    if (wavesurferRef.current) {
      const newMuteState = !isMuted;
      wavesurferRef.current.setMuted(newMuteState);
      setIsMuted(newMuteState);
    }
  };

  const handleSeek = (value: number[]) => {
    if (wavesurferRef.current) {
      const seekTo = value[0] / duration;
      wavesurferRef.current.seekTo(seekTo);
    }
  };

  const downloadAudio = () => {
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `audio-${Date.now()}.wav`;
    link.click();
  };

  if (error) {
    return (
      <Card className={cn("p-6 border-red-200 bg-red-50", className)}>
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <Play className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Failed to load waveform</p>
          </div>
          <p className="text-sm text-red-500">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            Waveform
          </Badge>
          {isLoading && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadAudio}
            disabled={isLoading}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Waveform Container */}
      <div className="relative">
        <div
          ref={containerRef}
          className={cn(
            "w-full rounded-md overflow-hidden",
            isLoading && "opacity-50"
          )}
          style={{ height }}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Time Display */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        <Button
          onClick={togglePlayPause}
          disabled={isLoading}
          className="h-10 w-10 rounded-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            disabled={isLoading}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <div className="w-20">
            <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.1}
              className="w-full"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Seek Bar */}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          onValueChange={handleSeek}
          max={duration}
          step={0.1}
          className="w-full"
          disabled={isLoading}
        />
      </div>

      {/* Audio Analysis (if peaks are available) */}
      {peaks.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <p>Peak amplitude: {Math.max(...peaks.map(Math.abs)).toFixed(3)}</p>
        </div>
      )}
    </Card>
  );
}