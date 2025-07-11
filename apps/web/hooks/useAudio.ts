"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAudio(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isLoading: false,
    error: null,
  });

  // Initialize audio element
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const audio = new Audio(src);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setState(prev => ({
        ...prev,
        duration: audio.duration,
        isLoading: false,
      }));
    };

    const handleTimeUpdate = () => {
      setState(prev => ({
        ...prev,
        currentTime: audio.currentTime,
      }));
    };

    const handleEnded = () => {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
      }));
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
      }));
    };

    const handleError = () => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "Failed to load audio",
      }));
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.pause();
    };
  }, [src]);

  const play = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      await audioRef.current.play();
      setState(prev => ({ ...prev, isPlaying: true }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: "Failed to play audio",
        isPlaying: false 
      }));
    }
  }, []);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = time;
    setState(prev => ({ ...prev, currentTime: time }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return;
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    audioRef.current.volume = clampedVolume;
    setState(prev => ({ 
      ...prev, 
      volume: clampedVolume,
      isMuted: clampedVolume === 0
    }));
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    
    if (state.isMuted) {
      audioRef.current.volume = state.volume;
      setState(prev => ({ ...prev, isMuted: false }));
    } else {
      audioRef.current.volume = 0;
      setState(prev => ({ ...prev, isMuted: true }));
    }
  }, [state.isMuted, state.volume]);

  const skipTime = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    
    const newTime = Math.max(0, Math.min(state.duration, state.currentTime + seconds));
    seek(newTime);
  }, [state.currentTime, state.duration, seek]);

  return {
    ...state,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    skipTime,
  };
}