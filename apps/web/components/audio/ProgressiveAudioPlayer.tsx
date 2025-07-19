"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Play, Pause, Download, Signal } from 'lucide-react';

interface ProgressiveAudioPlayerProps {
  src: string;
  lowQualitySrc?: string;
  title?: string;
  className?: string;
  lazy?: boolean;
  showQualityBadge?: boolean;
}

export function ProgressiveAudioPlayer({
  src,
  lowQualitySrc,
  title,
  className,
  lazy = true,
  showQualityBadge = true,
}: ProgressiveAudioPlayerProps) {
  const { isSlowConnection } = useNetworkStatus();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingHQ, setIsLoadingHQ] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [hasHQVersion, setHasHQVersion] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isIntersecting = useIntersectionObserver(containerRef, {
    threshold: 0.1,
    rootMargin: '50px',
  });

  const shouldLoad = !lazy || isIntersecting;

  useEffect(() => {
    if (!shouldLoad) return;

    const initialSrc = isSlowConnection && lowQualitySrc ? lowQualitySrc : src;
    setCurrentSrc(initialSrc);
    setHasHQVersion(!!lowQualitySrc && initialSrc === lowQualitySrc);
  }, [shouldLoad, isSlowConnection, src, lowQualitySrc]);

  const loadHighQuality = async () => {
    if (!lowQualitySrc || currentSrc === src || isLoadingHQ) return;

    setIsLoadingHQ(true);
    
    try {
      // Preload the high-quality version
      const hqAudio = new Audio(src);
      await new Promise((resolve, reject) => {
        hqAudio.addEventListener('canplaythrough', resolve, { once: true });
        hqAudio.addEventListener('error', reject, { once: true });
        hqAudio.load();
      });

      // Switch to high quality
      const currentTime = audioRef.current?.currentTime || 0;
      const wasPlaying = isPlaying;
      
      if (audioRef.current) {
        audioRef.current.pause();
      }

      setCurrentSrc(src);
      setHasHQVersion(false);

      // Wait for new audio to be ready
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = currentTime;
          if (wasPlaying) {
            audioRef.current.play();
          }
        }
      }, 100);
    } catch (error) {
      console.error('Failed to load high-quality audio:', error);
    } finally {
      setIsLoadingHQ(false);
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
        
        // Auto-upgrade to high quality when user starts playing
        if (hasHQVersion && !isLoadingHQ) {
          loadHighQuality();
        }
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src; // Always download the full quality version
    link.download = title || 'audio-file';
    link.click();
  };

  if (!shouldLoad) {
    return (
      <Card ref={containerRef} className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-2 flex-1" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={containerRef} className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {title && (
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{title}</h3>
              <div className="flex items-center gap-2">
                {showQualityBadge && hasHQVersion && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                    <Signal className="h-3 w-3" />
                    Low Quality
                  </div>
                )}
                {showQualityBadge && isLoadingHQ && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Upgrading...
                  </div>
                )}
                <Button size="sm" variant="ghost" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

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

            <div className="flex-1">
              <div className="text-sm text-muted-foreground">
                {!isLoaded ? 'Loading...' : 'Ready to play'}
                {hasHQVersion && ' (Low quality - will upgrade when playing)'}
              </div>
            </div>

            {hasHQVersion && isLoaded && !isLoadingHQ && (
              <Button
                size="sm"
                variant="outline"
                onClick={loadHighQuality}
              >
                <Signal className="h-3 w-3 mr-1" />
                HD
              </Button>
            )}
          </div>

          <audio
            ref={audioRef}
            src={currentSrc}
            onLoadedData={() => setIsLoaded(true)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            preload={lazy ? 'none' : 'metadata'}
          />
        </div>
      </CardContent>
    </Card>
  );
}