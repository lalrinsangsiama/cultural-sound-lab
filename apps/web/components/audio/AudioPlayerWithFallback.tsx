"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAudioLoader } from '@/hooks/useAudioLoader';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  WifiOff, 
  Download,
  Volume2,
  VolumeX 
} from 'lucide-react';

interface AudioPlayerWithFallbackProps {
  src: string;
  fallbackUrls?: string[];
  title?: string;
  className?: string;
  autoPlay?: boolean;
  showDownload?: boolean;
  onError?: (error: Error) => void;
}

export function AudioPlayerWithFallback({
  src,
  fallbackUrls = [],
  title,
  className,
  autoPlay = false,
  showDownload = false,
  onError,
}: AudioPlayerWithFallbackProps) {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const {
    isLoading,
    isLoaded,
    error,
    progress,
    duration,
    retryCount,
    loadAudio,
    retry,
    audio,
  } = useAudioLoader({
    fallbackUrls,
    maxRetries: 3,
    onError,
  });

  useEffect(() => {
    if (src && isOnline) {
      loadAudio(src);
    }
  }, [src, loadAudio, isOnline]);

  useEffect(() => {
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    if (autoPlay && isLoaded) {
      audio.play().catch(console.error);
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audio, isLoaded, autoPlay]);

  const togglePlayPause = async () => {
    if (!audio || !isLoaded) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (error) {
      console.error('Playback error:', error);
      onError?.(error as Error);
    }
  };

  const handleSeek = (percentage: number) => {
    if (!audio || !duration) return;
    
    const newTime = (percentage / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    if (!audio) return;
    
    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!audio) return;
    
    setVolume(newVolume);
    if (!isMuted) {
      audio.volume = newVolume;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = title || 'audio-file';
    link.click();
  };

  if (!isOnline) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Audio playback requires an internet connection.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (error && retryCount >= 3) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  Failed to load audio after multiple attempts.
                  {isSlowConnection && ' This might be due to a slow connection.'}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={retry}>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Try Again
                  </Button>
                  {showDownload && (
                    <Button size="sm" variant="outline" onClick={handleDownload}>
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {title && (
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{title}</h3>
              {showDownload && isLoaded && (
                <Button size="sm" variant="ghost" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Loading audio...</span>
                {retryCount > 0 && <span>Attempt {retryCount + 1}</span>}
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {isSlowConnection && isLoading && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Slow connection detected. Audio may take longer to load.
              </AlertDescription>
            </Alert>
          )}

          {isLoaded && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  onClick={togglePlayPause}
                  disabled={!isLoaded}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>

                <div className="flex-1 space-y-2">
                  <div 
                    className="relative h-2 bg-muted rounded-full cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percentage = ((e.clientX - rect.left) / rect.width) * 100;
                      handleSeek(percentage);
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 h-full bg-primary rounded-full"
                      style={{
                        width: duration ? `${(currentTime / duration) * 100}%` : '0%',
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{duration ? formatTime(duration) : '--:--'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleMute}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16"
                  />
                </div>
              </div>
            </div>
          )}

          {error && retryCount < 3 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Audio failed to load. Retrying...
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}