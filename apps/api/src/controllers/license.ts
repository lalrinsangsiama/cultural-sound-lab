import { Response } from 'express';
import { supabase } from '@/config/supabase';
import { AuthenticatedRequest } from '@/middleware/auth';

interface LicenseRequest {
  audio_sample_id?: string;
  generation_id?: string;
  license_type: 'personal' | 'commercial' | 'enterprise';
  payment_intent_id?: string;
}

export const createLicense = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      audio_sample_id, 
      generation_id, 
      license_type,
      payment_intent_id 
    }: LicenseRequest = req.body;

    if (!license_type) {
      return res.status(400).json({
        error: 'License type is required'
      });
    }

    if (!audio_sample_id && !generation_id) {
      return res.status(400).json({
        error: 'Either audio_sample_id or generation_id is required'
      });
    }

    if (audio_sample_id && generation_id) {
      return res.status(400).json({
        error: 'Cannot license both audio sample and generation in the same request'
      });
    }

    let price = 0;
    let usage_terms = '';
    let download_limit: number | null = null;

    // Get pricing and terms based on what's being licensed
    if (audio_sample_id) {
      const { data: sample, error: sampleError } = await supabase
        .from('audio_samples')
        .select('price_personal, price_commercial, price_enterprise, title, cultural_origin')
        .eq('id', audio_sample_id)
        .eq('approved', true)
        .single();

      if (sampleError) {
        return res.status(404).json({
          error: 'Audio sample not found or not approved'
        });
      }

      switch (license_type) {
        case 'personal':
          price = sample.price_personal || 0;
          usage_terms = 'Personal use only. No commercial applications allowed.';
          download_limit = 5;
          break;
        case 'commercial':
          price = sample.price_commercial || 10;
          usage_terms = 'Commercial use allowed for single project. Attribution required.';
          download_limit = 10;
          break;
        case 'enterprise':
          price = sample.price_enterprise || 50;
          usage_terms = 'Unlimited commercial use. Multiple projects allowed. Attribution required.';
          download_limit = null; // Unlimited
          break;
      }
    } else if (generation_id) {
      // Verify user owns the generation
      const { data: generation, error: genError } = await supabase
        .from('generations')
        .select('user_id, type, status')
        .eq('id', generation_id)
        .single();

      if (genError) {
        return res.status(404).json({
          error: 'Generation not found'
        });
      }

      if (generation.user_id !== req.user!.id) {
        return res.status(403).json({
          error: 'Permission denied - you can only license your own generations'
        });
      }

      if (generation.status !== 'completed') {
        return res.status(400).json({
          error: 'Cannot license incomplete generation'
        });
      }

      // Set pricing for generated content
      switch (license_type) {
        case 'personal':
          price = 0; // Free for personal use of own generations
          usage_terms = 'Personal use only. No commercial applications allowed.';
          download_limit = 3;
          break;
        case 'commercial':
          price = 15;
          usage_terms = 'Commercial use allowed for single project. Attribution to Cultural Sound Lab required.';
          download_limit = 5;
          break;
        case 'enterprise':
          price = 75;
          usage_terms = 'Unlimited commercial use. Multiple projects allowed. Attribution to Cultural Sound Lab required.';
          download_limit = null;
          break;
      }
    }

    // Set expiry date (1 year from now)
    const expiry_date = new Date();
    expiry_date.setFullYear(expiry_date.getFullYear() + 1);

    // Create license record
    const { data, error } = await supabase
      .from('licenses')
      .insert({
        user_id: req.user!.id,
        audio_sample_id,
        generation_id,
        license_type,
        price,
        payment_status: price > 0 ? 'pending' : 'completed',
        payment_intent_id,
        usage_terms,
        expiry_date: expiry_date.toISOString(),
        download_limit,
        downloads_used: 0,
        active: price === 0 // Auto-activate free licenses
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to create license',
        details: error.message
      });
    }

    res.status(201).json({
      ...data,
      message: price > 0 ? 'License created. Payment required to activate.' : 'License created and activated.'
    });
  } catch (error) {
    console.error('Error creating license:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const getUserLicenses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      license_type, 
      active_only = 'false' 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('licenses')
      .select(`
        *,
        audio_samples (id, title, cultural_origin),
        generations (id, type, parameters)
      `)
      .eq('user_id', req.user!.id)
      .range(offset, offset + Number(limit) - 1)
      .order('created_at', { ascending: false });

    if (license_type) {
      query = query.eq('license_type', license_type);
    }

    if (active_only === 'true') {
      query = query.eq('active', true);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch licenses',
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
    console.error('Error fetching user licenses:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const getLicense = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('licenses')
      .select(`
        *,
        audio_samples (id, title, cultural_origin, file_url),
        generations (id, type, parameters, result_url)
      `)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error) {
      return res.status(404).json({
        error: 'License not found'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching license:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const verifyLicense = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .single();

    if (error) {
      return res.status(404).json({
        valid: false,
        error: 'License not found or inactive'
      });
    }

    // Check if license has expired
    const now = new Date();
    const expiry = new Date(data.expiry_date);
    
    if (expiry < now) {
      return res.json({
        valid: false,
        error: 'License has expired'
      });
    }

    // Check download limits
    if (data.download_limit && data.downloads_used >= data.download_limit) {
      return res.json({
        valid: false,
        error: 'Download limit exceeded'
      });
    }

    res.json({
      valid: true,
      license: data,
      downloads_remaining: data.download_limit ? data.download_limit - data.downloads_used : 'unlimited'
    });
  } catch (error) {
    console.error('Error verifying license:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const updatePaymentStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { payment_status, payment_intent_id } = req.body;

    if (!payment_status) {
      return res.status(400).json({
        error: 'Payment status is required'
      });
    }

    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({
        error: 'Invalid payment status'
      });
    }

    // Check if user owns the license
    const { data: existing, error: fetchError } = await supabase
      .from('licenses')
      .select('user_id, price')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({
        error: 'License not found'
      });
    }

    if (existing.user_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({
        error: 'Permission denied'
      });
    }

    const updateData: any = {
      payment_status,
      updated_at: new Date().toISOString()
    };

    if (payment_intent_id) updateData.payment_intent_id = payment_intent_id;

    // Activate license if payment completed
    if (payment_status === 'completed') {
      updateData.active = true;
    } else if (payment_status === 'failed' || payment_status === 'refunded') {
      updateData.active = false;
    }

    const { data, error } = await supabase
      .from('licenses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to update payment status',
        details: error.message
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const recordDownload = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify license exists and is valid
    const { data: license, error: fetchError } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .eq('active', true)
      .single();

    if (fetchError) {
      return res.status(404).json({
        error: 'License not found or inactive'
      });
    }

    // Check download limits
    if (license.download_limit && license.downloads_used >= license.download_limit) {
      return res.status(400).json({
        error: 'Download limit exceeded'
      });
    }

    // Increment download count
    const { data, error } = await supabase
      .from('licenses')
      .update({
        downloads_used: license.downloads_used + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to record download',
        details: error.message
      });
    }

    res.json({
      downloads_used: data.downloads_used,
      downloads_remaining: data.download_limit ? data.download_limit - data.downloads_used : 'unlimited'
    });
  } catch (error) {
    console.error('Error recording download:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};