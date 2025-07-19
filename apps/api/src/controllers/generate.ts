import { Response } from 'express';
import { supabase } from '@/config/supabase';
import { AuthenticatedRequest } from '@/middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { aiService } from '@/services/aiService';
import { generationQueue } from '@/services/generationQueue';

// Simple cache helpers that do nothing (Supabase handles data persistence)
const cacheHelpers = {
  async get<T>(key: string): Promise<T | null> {
    return null; // No caching, always fetch fresh
  },
  async set(key: string, value: any, ttl?: number): Promise<void> {
    // No-op, Supabase handles persistence
  },
  async del(key: string | string[]): Promise<void> {
    // No-op
  },
  async clearByPattern(pattern: string): Promise<void> {
    // No-op
  }
};

interface GenerationRequest {
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
    brand_name?: string; // For sound logos
    playlist_size?: number; // For playlists
    video_description?: string; // For social clips
  };
  source_samples: string[];
}

export const createGeneration = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, parameters, source_samples }: GenerationRequest = req.body;

    if (!type || !parameters || !source_samples || source_samples.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: type, parameters, source_samples'
      });
    }

    // Validate generation type
    const validTypes = ['sound_logo', 'playlist', 'social_clip', 'long_form'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid generation type'
      });
    }

    // Validate generation parameters
    const validation = aiService.validateGenerationParameters(type, parameters);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid parameters',
        details: validation.errors
      });
    }

    // Validate source samples exist and are accessible
    const { data: samples, error: samplesError } = await supabase
      .from('audio_samples')
      .select('id, title, file_url')
      .in('id', source_samples)
      .eq('approved', true);

    if (samplesError || !samples || samples.length !== source_samples.length) {
      return res.status(400).json({
        error: 'One or more source samples not found or not approved'
      });
    }

    // Create generation record
    const { data, error } = await supabase
      .from('generations')
      .insert({
        user_id: req.user!.id,
        type,
        status: 'pending',
        parameters,
        source_samples
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to create generation request',
        details: error.message
      });
    }

    // Submit to AI service via queue
    try {
      const { jobId, estimatedTime } = await aiService.submitGeneration({
        generationId: data.id,
        userId: req.user!.id,
        type,
        parameters,
        source_samples,
        source_urls: [] // Will be populated by aiService
      });

      // Invalidate user generations cache since we added a new generation
      await cacheHelpers.clearByPattern(`user:generations:${req.user!.id}:*`);

      res.status(201).json({
        ...data,
        job_id: jobId,
        estimated_completion_time: estimatedTime,
        message: 'Generation request created and queued for processing'
      });
    } catch (queueError) {
      // Update generation status to failed
      await supabase
        .from('generations')
        .update({ 
          status: 'failed',
          error_message: queueError instanceof Error ? queueError.message : 'Failed to queue generation',
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      return res.status(500).json({
        error: 'Failed to queue generation request',
        details: queueError instanceof Error ? queueError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error creating generation:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const getGeneration = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const CACHE_TTL = 60; // 1 minute (shorter for active generations)
    const cacheKey = `generation:${id}:${req.user!.id}`;

    // Try to get from cache first
    const cached = await cacheHelpers.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error) {
      return res.status(404).json({
        error: 'Generation not found'
      });
    }

    // Cache completed generations for longer, active ones for shorter time
    const cacheTTL = data.status === 'completed' ? 300 : 60; // 5 min vs 1 min
    await cacheHelpers.set(cacheKey, data, cacheTTL);

    res.json(data);
  } catch (error) {
    console.error('Error fetching generation:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const getUserGenerations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      status 
    } = req.query;

    // Create cache key based on user and query params
    const CACHE_TTL = 30; // 30 seconds (short for active generations)
    const cacheKeyParts = [
      'user:generations',
      req.user!.id,
      `page:${page}`,
      `limit:${limit}`,
      type ? `type:${type}` : '',
      status ? `status:${status}` : ''
    ].filter(Boolean);
    const cacheKey = cacheKeyParts.join(':');

    // Try to get from cache first
    const cached = await cacheHelpers.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('generations')
      .select('*')
      .eq('user_id', req.user!.id)
      .range(offset, offset + Number(limit) - 1)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch generations',
        details: error.message
      });
    }

    const response = {
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    };

    // Cache the result
    await cacheHelpers.set(cacheKey, response, CACHE_TTL);

    res.json(response);
  } catch (error) {
    console.error('Error fetching user generations:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const downloadGeneration = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .eq('status', 'completed')
      .single();

    if (error) {
      return res.status(404).json({
        error: 'Generation not found or not completed'
      });
    }

    if (!data.result_url) {
      return res.status(400).json({
        error: 'Generation result not available'
      });
    }

    res.json({
      download_url: data.result_url,
      filename: `generation_${data.type}_${data.id}.mp3`,
      type: data.type,
      parameters: data.parameters
    });
  } catch (error) {
    console.error('Error downloading generation:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const deleteGeneration = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if generation belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('generations')
      .select('user_id, result_url, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({
        error: 'Generation not found'
      });
    }

    if (existing.user_id !== req.user!.id) {
      return res.status(403).json({
        error: 'Permission denied'
      });
    }

    // Don't allow deletion of processing generations
    if (existing.status === 'processing') {
      return res.status(400).json({
        error: 'Cannot delete generation that is currently processing'
      });
    }

    // Delete from database
    const { error } = await supabase
      .from('generations')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        error: 'Failed to delete generation',
        details: error.message
      });
    }

    // TODO: Clean up generated file from storage if it exists
    if (existing.result_url) {
      // Extract filename and delete from Supabase storage
      // This would be implemented based on your storage structure
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting generation:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// Webhook endpoint for AI service to update generation status
export const getJobStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        error: 'Job ID is required'
      });
    }

    // Check if it's a mock job (starts with 'mock_')
    if (jobId.startsWith('mock_')) {
      const status = aiService.getMockJobStatus(jobId);
      if (!status) {
        return res.status(404).json({
          error: 'Job not found'
        });
      }
      return res.json(status);
    }

    // For real AI service jobs, get status from the AI service
    try {
      const status = await aiService.getGenerationStatus(jobId);
      res.json(status);
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to get job status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const updateGenerationStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, result_url, error_message, processing_time } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status'
      });
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (result_url) updateData.result_url = result_url;
    if (error_message) updateData.error_message = error_message;
    if (processing_time) updateData.processing_time = processing_time;

    const { data, error } = await supabase
      .from('generations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to update generation status',
        details: error.message
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating generation status:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};