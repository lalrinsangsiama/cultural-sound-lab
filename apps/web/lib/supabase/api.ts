import { supabase } from './client';
import type {
  User,
  AudioSample,
  Generation,
  License,
  InsertGeneration,
  InsertLicense,
  GenerationWithSamples,
  AudioSampleWithUser,
  LicenseWithGeneration,
  ApiResponse,
  PaginatedResponse,
  GenerationType,
  GenerationStatus,
  LicenseType
} from './types';

// Audio Samples API
export const audioSamplesApi = {
  // Get all audio samples with optional filters
  async getAll(filters?: {
    cultural_origin?: string;
    instrument_type?: string;
    search?: string;
  }): Promise<ApiResponse<AudioSample[]>> {
    try {
      let query = supabase
        .from('audio_samples')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.cultural_origin) {
        query = query.eq('cultural_origin', filters.cultural_origin);
      }

      if (filters?.instrument_type) {
        query = query.eq('instrument_type', filters.instrument_type);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  },

  // Get single audio sample by ID
  async getById(id: string): Promise<ApiResponse<AudioSampleWithUser>> {
    try {
      const { data, error } = await supabase
        .from('audio_samples')
        .select(`
          *,
          uploader:users(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  },

  // Get samples by IDs (for generation source samples)
  async getByIds(ids: string[]): Promise<ApiResponse<AudioSample[]>> {
    try {
      const { data, error } = await supabase
        .from('audio_samples')
        .select('*')
        .in('id', ids);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  }
};

// Generations API
export const generationsApi = {
  // Create a new generation
  async create(generation: InsertGeneration): Promise<ApiResponse<Generation>> {
    try {
      const { data, error } = await supabase
        .from('generations')
        .insert(generation)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  },

  // Get user's generations
  async getUserGenerations(
    userId: string, 
    options?: {
      status?: GenerationStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResponse<GenerationWithSamples[]>> {
    try {
      let query = supabase
        .from('generations')
        .select(`
          *,
          user:users(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      // Get source samples for each generation
      const generationsWithSamples = await Promise.all(
        (data || []).map(async (generation) => {
          const samplesResponse = await audioSamplesApi.getByIds(generation.source_samples);
          return {
            ...generation,
            audio_samples: samplesResponse.data || []
          };
        })
      );

      return { data: generationsWithSamples, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  },

  // Get generation by ID
  async getById(id: string): Promise<ApiResponse<GenerationWithSamples>> {
    try {
      const { data, error } = await supabase
        .from('generations')
        .select(`
          *,
          user:users(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      // Get source samples
      const samplesResponse = await audioSamplesApi.getByIds(data.source_samples);
      const generationWithSamples = {
        ...data,
        audio_samples: samplesResponse.data || []
      };

      return { data: generationWithSamples, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  },

  // Update generation status
  async updateStatus(id: string, status: GenerationStatus, output_url?: string): Promise<ApiResponse<Generation>> {
    try {
      const updateData: { status: GenerationStatus; output_url?: string } = { status };
      if (output_url) {
        updateData.output_url = output_url;
      }

      const { data, error } = await supabase
        .from('generations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  },

  // Delete generation
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('generations')
        .delete()
        .eq('id', id);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  }
};

// Licenses API
export const licensesApi = {
  // Create a new license
  async create(license: InsertLicense): Promise<ApiResponse<License>> {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .insert(license)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  },

  // Get user's licenses
  async getUserLicenses(userId: string): Promise<ApiResponse<LicenseWithGeneration[]>> {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select(`
          *,
          generation:generations(*),
          user:users(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  },

  // Get license by ID
  async getById(id: string): Promise<ApiResponse<LicenseWithGeneration>> {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select(`
          *,
          generation:generations(*),
          user:users(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  }
};

// Analytics API
export const analyticsApi = {
  // Get user earnings summary
  async getUserEarnings(userId: string): Promise<ApiResponse<{
    totalEarnings: number;
    monthlyEarnings: number;
    totalLicenses: number;
    monthlyLicenses: number;
  }>> {
    try {
      // Get all licenses for the user (where they are the creator of the generation)
      const { data: licenses, error: licensesError } = await supabase
        .from('licenses')
        .select(`
          price_paid,
          valid_from,
          generation:generations!inner(user_id)
        `)
        .eq('generation.user_id', userId);

      if (licensesError) {
        return { data: null, error: licensesError.message, success: false };
      }

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalEarnings = licenses?.reduce((sum, license) => sum + (license.price_paid || 0), 0) || 0;
      const monthlyLicenses = licenses?.filter(license => 
        new Date(license.valid_from) >= thisMonth
      ) || [];
      const monthlyEarnings = monthlyLicenses.reduce((sum, license) => sum + (license.price_paid || 0), 0);

      return {
        data: {
          totalEarnings,
          monthlyEarnings,
          totalLicenses: licenses?.length || 0,
          monthlyLicenses: monthlyLicenses.length
        },
        error: null,
        success: true
      };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  },

  // Get generation statistics
  async getGenerationStats(userId: string): Promise<ApiResponse<{
    totalGenerations: number;
    completedGenerations: number;
    pendingGenerations: number;
    failedGenerations: number;
  }>> {
    try {
      const { data: generations, error } = await supabase
        .from('generations')
        .select('status')
        .eq('user_id', userId);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      const stats = {
        totalGenerations: generations?.length || 0,
        completedGenerations: generations?.filter(g => g.status === 'completed').length || 0,
        pendingGenerations: generations?.filter(g => g.status === 'pending' || g.status === 'processing').length || 0,
        failedGenerations: generations?.filter(g => g.status === 'failed').length || 0
      };

      return { data: stats, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  }
};

// Users API
export const usersApi = {
  // Get user profile
  async getProfile(userId: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  }
};