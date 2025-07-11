"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { generation } from "@/lib/api-client";

export interface GenerationParams {
  type: 'sound_logo' | 'playlist' | 'social_clip' | 'long_form';
  parameters: {
    duration?: number;
    mood?: string;
    energy_level?: number;
    instruments?: string[];
    cultural_style?: string;
    tempo?: number;
    key?: string;
    description?: string;
    brand_name?: string;
    playlist_size?: number;
    video_description?: string;
  };
  source_samples: string[];
}

export interface GenerationResult {
  id: string;
  user_id: string;
  type: string;
  status: "pending" | "processing" | "completed" | "failed";
  parameters: any;
  source_samples: string[];
  result_url?: string;
  error_message?: string;
  processing_time?: number;
  progress?: number;
  job_id?: string;
  estimated_completion_time?: number;
  created_at: string;
  updated_at: string;
}

export function useGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState<GenerationResult | null>(null);
  const [generations, setGenerations] = useState<GenerationResult[]>([]);
  const [progress, setProgress] = useState(0);
  const pollingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const generateAudio = useCallback(async (params: GenerationParams): Promise<GenerationResult> => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      // Create generation request
      const response = await generation.create(params);
      
      const newGeneration: GenerationResult = {
        id: response.id,
        user_id: response.user_id,
        type: response.type,
        status: response.status,
        parameters: response.parameters,
        source_samples: response.source_samples,
        job_id: response.job_id,
        estimated_completion_time: response.estimated_completion_time,
        created_at: response.created_at,
        updated_at: response.updated_at,
      };

      setCurrentGeneration(newGeneration);
      setGenerations(prev => [newGeneration, ...prev]);

      // Start polling for status if we have a job ID
      if (response.job_id) {
        startPolling(response.job_id, newGeneration.id);
      }

      return newGeneration;
    } catch (error) {
      setIsGenerating(false);
      throw error;
    }
  }, []);

  const startPolling = useCallback((jobId: string, generationId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await generation.getJobStatus(jobId);
        
        if (status) {
          setProgress(status.progress || 0);
          
          // Update the generation in state
          const updatedGeneration: GenerationResult = {
            id: generationId,
            user_id: "", // Will be filled from current state
            type: status.generation_id,
            status: status.status as any,
            parameters: {},
            source_samples: [],
            result_url: status.result_url,
            error_message: status.error_message,
            processing_time: status.processing_time,
            progress: status.progress,
            created_at: "",
            updated_at: new Date().toISOString(),
          };

          setCurrentGeneration(prev => prev?.id === generationId ? {
            ...prev,
            ...updatedGeneration,
            user_id: prev.user_id,
            type: prev.type,
            parameters: prev.parameters,
            source_samples: prev.source_samples,
            created_at: prev.created_at,
          } : prev);
          
          setGenerations(prev => prev.map(g => 
            g.id === generationId ? {
              ...g,
              status: status.status as any,
              result_url: status.result_url,
              error_message: status.error_message,
              processing_time: status.processing_time,
              progress: status.progress,
              updated_at: new Date().toISOString(),
            } : g
          ));

          // Stop polling if completed or failed
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            pollingIntervals.current.delete(jobId);
            setIsGenerating(false);
            setProgress(100);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Continue polling on error, don't stop
      }
    }, 2000); // Poll every 2 seconds

    pollingIntervals.current.set(jobId, pollInterval);
  }, []);

  const getGenerationStatus = useCallback(async (id: string): Promise<GenerationResult | null> => {
    try {
      const result = await generation.get(id);
      return result;
    } catch (error) {
      console.error('Failed to get generation status:', error);
      return null;
    }
  }, []);

  const cancelGeneration = useCallback(async (id: string): Promise<void> => {
    try {
      // Stop polling if active
      const gen = generations.find(g => g.id === id);
      if (gen?.job_id) {
        const interval = pollingIntervals.current.get(gen.job_id);
        if (interval) {
          clearInterval(interval);
          pollingIntervals.current.delete(gen.job_id);
        }
      }
      
      // Update local state
      setGenerations(prev => prev.map(g => 
        g.id === id ? { ...g, status: "failed" as const, error_message: "Cancelled by user" } : g
      ));
      
      if (currentGeneration?.id === id) {
        setCurrentGeneration(null);
      }
      
      setIsGenerating(false);
    } catch (error) {
      console.error('Failed to cancel generation:', error);
    }
  }, [currentGeneration, generations]);

  const deleteGeneration = useCallback(async (id: string): Promise<void> => {
    try {
      await generation.delete(id);
      
      // Stop polling if active
      const gen = generations.find(g => g.id === id);
      if (gen?.job_id) {
        const interval = pollingIntervals.current.get(gen.job_id);
        if (interval) {
          clearInterval(interval);
          pollingIntervals.current.delete(gen.job_id);
        }
      }
      
      setGenerations(prev => prev.filter(g => g.id !== id));
      
      if (currentGeneration?.id === id) {
        setCurrentGeneration(null);
      }
    } catch (error) {
      console.error('Failed to delete generation:', error);
      throw error;
    }
  }, [currentGeneration, generations]);

  const retryGeneration = useCallback(async (id: string): Promise<GenerationResult | null> => {
    const gen = generations.find(g => g.id === id);
    if (!gen) return null;

    // Retry with the same parameters
    const params: GenerationParams = {
      type: gen.type as any,
      parameters: gen.parameters,
      source_samples: gen.source_samples,
    };

    return generateAudio(params);
  }, [generations, generateAudio]);

  const loadUserGenerations = useCallback(async (filters?: { status?: string; type?: string }) => {
    try {
      const response = await generation.getUserGenerations(filters);
      setGenerations(response.data || []);
      return response;
    } catch (error) {
      console.error('Failed to load user generations:', error);
      throw error;
    }
  }, []);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervals.current.forEach(interval => clearInterval(interval));
      pollingIntervals.current.clear();
    };
  }, []);

  return {
    isGenerating,
    currentGeneration,
    generations,
    progress,
    generateAudio,
    getGenerationStatus,
    cancelGeneration,
    deleteGeneration,
    retryGeneration,
    loadUserGenerations,
  };
}