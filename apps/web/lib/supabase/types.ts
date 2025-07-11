export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: string
          cultural_affiliation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role?: string
          cultural_affiliation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: string
          cultural_affiliation?: string | null
          created_at?: string
        }
      }
      audio_samples: {
        Row: {
          id: string
          title: string
          description: string | null
          cultural_origin: string
          instrument_type: string | null
          file_url: string
          duration_seconds: number | null
          sample_rate: number | null
          metadata: Json | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          cultural_origin: string
          instrument_type?: string | null
          file_url: string
          duration_seconds?: number | null
          sample_rate?: number | null
          metadata?: Json | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          cultural_origin?: string
          instrument_type?: string | null
          file_url?: string
          duration_seconds?: number | null
          sample_rate?: number | null
          metadata?: Json | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      generations: {
        Row: {
          id: string
          user_id: string | null
          source_samples: string[]
          generation_type: string | null
          parameters: Json | null
          output_url: string | null
          duration_seconds: number | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          source_samples: string[]
          generation_type?: string | null
          parameters?: Json | null
          output_url?: string | null
          duration_seconds?: number | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          source_samples?: string[]
          generation_type?: string | null
          parameters?: Json | null
          output_url?: string | null
          duration_seconds?: number | null
          status?: string
          created_at?: string
        }
      }
      licenses: {
        Row: {
          id: string
          generation_id: string | null
          user_id: string | null
          license_type: string | null
          usage_description: string | null
          attribution_text: string | null
          price_paid: number | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          id?: string
          generation_id?: string | null
          user_id?: string | null
          license_type?: string | null
          usage_description?: string | null
          attribution_text?: string | null
          price_paid?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          id?: string
          generation_id?: string | null
          user_id?: string | null
          license_type?: string | null
          usage_description?: string | null
          attribution_text?: string | null
          price_paid?: number | null
          valid_from?: string
          valid_until?: string | null
        }
      }
      revenue_splits: {
        Row: {
          id: string
          license_id: string | null
          recipient_id: string | null
          amount: number | null
          percentage: number | null
          status: string
          paid_at: string | null
        }
        Insert: {
          id?: string
          license_id?: string | null
          recipient_id?: string | null
          amount?: number | null
          percentage?: number | null
          status?: string
          paid_at?: string | null
        }
        Update: {
          id?: string
          license_id?: string | null
          recipient_id?: string | null
          amount?: number | null
          percentage?: number | null
          status?: string
          paid_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type User = Database['public']['Tables']['users']['Row']
export type AudioSample = Database['public']['Tables']['audio_samples']['Row']
export type Generation = Database['public']['Tables']['generations']['Row']
export type License = Database['public']['Tables']['licenses']['Row']
export type RevenueSplit = Database['public']['Tables']['revenue_splits']['Row']

export type InsertUser = Database['public']['Tables']['users']['Insert']
export type InsertAudioSample = Database['public']['Tables']['audio_samples']['Insert']
export type InsertGeneration = Database['public']['Tables']['generations']['Insert']
export type InsertLicense = Database['public']['Tables']['licenses']['Insert']
export type InsertRevenueSplit = Database['public']['Tables']['revenue_splits']['Insert']

export type UpdateUser = Database['public']['Tables']['users']['Update']
export type UpdateAudioSample = Database['public']['Tables']['audio_samples']['Update']
export type UpdateGeneration = Database['public']['Tables']['generations']['Update']
export type UpdateLicense = Database['public']['Tables']['licenses']['Update']
export type UpdateRevenueSplit = Database['public']['Tables']['revenue_splits']['Update']

// Enum types for better type safety
export type UserRole = 'user' | 'admin' | 'moderator'
export type GenerationType = 'sound_logo' | 'playlist' | 'social_clip' | 'long_form'
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type LicenseType = 'personal' | 'commercial' | 'enterprise'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

// Extended types with relations
export interface AudioSampleWithUser extends AudioSample {
  uploader?: User
}

export interface GenerationWithSamples extends Generation {
  audio_samples?: AudioSample[]
  user?: User
}

export interface LicenseWithGeneration extends License {
  generation?: GenerationWithSamples
  user?: User
}

export interface GenerationParameters {
  mood: string
  length: number
  businessType: string
  style?: string
  tempo?: number
  customDescription?: string
}

// API response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  totalPages: number
}