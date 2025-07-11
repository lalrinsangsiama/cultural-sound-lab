import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '@/config/supabase';
import { AuthenticatedRequest } from '@/middleware/auth';
import { generateUniqueFilename, getAudioMetadata } from '@/middleware/upload';
import { audioService } from '@/services/audioService';

export const getAudioSamples = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      cultural_origin, 
      instrument_type, 
      mood_tags,
      search 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('audio_samples')
      .select('*')
      .eq('approved', true)
      .range(offset, offset + Number(limit) - 1)
      .order('created_at', { ascending: false });

    // Apply filters
    if (cultural_origin) {
      query = query.eq('cultural_origin', cultural_origin);
    }
    
    if (instrument_type) {
      query = query.eq('instrument_type', instrument_type);
    }
    
    if (mood_tags) {
      const tags = Array.isArray(mood_tags) ? mood_tags : [mood_tags];
      query = query.overlaps('mood_tags', tags);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%, description.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch audio samples',
        details: error.message
      });
    }

    res.json({
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching audio samples:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const getAudioSample = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('audio_samples')
      .select('*')
      .eq('id', id)
      .eq('approved', true)
      .single();

    if (error) {
      return res.status(404).json({
        error: 'Audio sample not found'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching audio sample:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const uploadAudioSample = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file provided'
      });
    }

    const {
      title,
      description,
      cultural_origin,
      instrument_type,
      mood_tags,
      usage_rights = 'personal',
      price_personal,
      price_commercial,
      price_enterprise,
      cultural_context,
      attribution_required = true
    } = req.body;

    if (!title || !cultural_origin || !instrument_type) {
      return res.status(400).json({
        error: 'Missing required fields: title, cultural_origin, instrument_type'
      });
    }

    // Use audioService to handle upload and processing
    const uploadResult = await audioService.uploadAudio(
      req.file.buffer,
      req.file.originalname,
      {
        file_size: req.file.size,
        format: req.file.mimetype
      }
    );

    // Save metadata to database
    const { data, error } = await supabase
      .from('audio_samples')
      .insert({
        title,
        description,
        file_url: uploadResult.file_url,
        file_size: uploadResult.metadata.file_size,
        duration: uploadResult.metadata.duration,
        format: uploadResult.metadata.format,
        sample_rate: uploadResult.metadata.sample_rate,
        cultural_origin,
        instrument_type,
        mood_tags: Array.isArray(mood_tags) ? mood_tags : [mood_tags].filter(Boolean),
        usage_rights,
        price_personal: price_personal ? parseFloat(price_personal) : null,
        price_commercial: price_commercial ? parseFloat(price_commercial) : null,
        price_enterprise: price_enterprise ? parseFloat(price_enterprise) : null,
        contributor_id: req.user!.id,
        cultural_context,
        attribution_required: attribution_required === 'true',
        approved: req.user!.role === 'admin' // Auto-approve for admins
      })
      .select()
      .single();

    if (error) {
      // Clean up uploaded file if database insert fails
      await audioService.deleteAudio(uploadResult.file_path);
      if (uploadResult.waveform_url) {
        const waveformPath = uploadResult.waveform_url.split('/').pop();
        if (waveformPath) {
          await audioService.deleteWaveform(`waveforms/${waveformPath}`);
        }
      }

      return res.status(500).json({
        error: 'Failed to save audio sample metadata',
        details: error.message
      });
    }

    // Include waveform URL in response
    const response = {
      ...data,
      waveform_url: uploadResult.waveform_url,
      metadata: uploadResult.metadata
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error uploading audio sample:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateAudioSample = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if user owns the sample or is admin
    const { data: existing, error: fetchError } = await supabase
      .from('audio_samples')
      .select('contributor_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({
        error: 'Audio sample not found'
      });
    }

    if (existing.contributor_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({
        error: 'Permission denied'
      });
    }

    const { data, error } = await supabase
      .from('audio_samples')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to update audio sample',
        details: error.message
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating audio sample:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const deleteAudioSample = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user owns the sample or is admin
    const { data: existing, error: fetchError } = await supabase
      .from('audio_samples')
      .select('contributor_id, file_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({
        error: 'Audio sample not found'
      });
    }

    if (existing.contributor_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({
        error: 'Permission denied'
      });
    }

    // Delete from database
    const { error } = await supabase
      .from('audio_samples')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        error: 'Failed to delete audio sample',
        details: error.message
      });
    }

    // Use audioService to delete files from storage
    try {
      const url = new URL(existing.file_url);
      const filePath = url.pathname.replace('/storage/v1/object/public/audio-samples/', '');
      await audioService.deleteAudio(filePath);
      
      // Also try to delete associated waveform
      const waveformPath = `waveforms/${id}_waveform.png`;
      await audioService.deleteWaveform(waveformPath);
    } catch (deleteError) {
      console.warn('Failed to delete files from storage:', deleteError);
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting audio sample:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const previewAudio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('audio_samples')
      .select('file_url, title')
      .eq('id', id)
      .eq('approved', true)
      .single();

    if (error) {
      return res.status(404).json({
        error: 'Audio sample not found'
      });
    }

    // Generate signed URL for secure access
    try {
      const url = new URL(data.file_url);
      const filePath = url.pathname.replace('/storage/v1/object/public/audio-samples/', '');
      const signedUrl = await audioService.generateSignedUrl(filePath, 3600); // 1 hour

      // Increment download count
      await supabase
        .from('audio_samples')
        .update({ 
          download_count: supabase.rpc('increment_download_count', { audio_id: id })
        })
        .eq('id', id);

      res.json({
        preview_url: signedUrl,
        title: data.title,
        expires_in: 3600
      });
    } catch (urlError) {
      // Fallback to public URL if signed URL generation fails
      console.warn('Failed to generate signed URL, using public URL:', urlError);
      
      res.json({
        preview_url: data.file_url,
        title: data.title
      });
    }
  } catch (error) {
    console.error('Error getting audio preview:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};