export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'user' | 'admin' | 'cultural_contributor';
          avatar_url?: string;
          cultural_background?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'user' | 'admin' | 'cultural_contributor';
          avatar_url?: string;
          cultural_background?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'user' | 'admin' | 'cultural_contributor';
          avatar_url?: string;
          cultural_background?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      audio_samples: {
        Row: {
          id: string;
          title: string;
          description?: string;
          file_url: string;
          file_size: number;
          duration: number;
          format: string;
          sample_rate?: number;
          cultural_origin: string;
          instrument_type: string;
          mood_tags: string[];
          usage_rights: 'personal' | 'commercial' | 'enterprise';
          price_personal?: number;
          price_commercial?: number;
          price_enterprise?: number;
          contributor_id: string;
          cultural_context?: string;
          attribution_required: boolean;
          approved: boolean;
          download_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          file_url: string;
          file_size: number;
          duration: number;
          format: string;
          sample_rate?: number;
          cultural_origin: string;
          instrument_type: string;
          mood_tags: string[];
          usage_rights: 'personal' | 'commercial' | 'enterprise';
          price_personal?: number;
          price_commercial?: number;
          price_enterprise?: number;
          contributor_id: string;
          cultural_context?: string;
          attribution_required?: boolean;
          approved?: boolean;
          download_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          file_url?: string;
          file_size?: number;
          duration?: number;
          format?: string;
          sample_rate?: number;
          cultural_origin?: string;
          instrument_type?: string;
          mood_tags?: string[];
          usage_rights?: 'personal' | 'commercial' | 'enterprise';
          price_personal?: number;
          price_commercial?: number;
          price_enterprise?: number;
          contributor_id?: string;
          cultural_context?: string;
          attribution_required?: boolean;
          approved?: boolean;
          download_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      generations: {
        Row: {
          id: string;
          user_id: string;
          type: 'sound_logo' | 'playlist' | 'social_clip' | 'long_form';
          status: 'pending' | 'processing' | 'completed' | 'failed';
          parameters: any;
          result_url?: string;
          error_message?: string;
          processing_time?: number;
          source_samples: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'sound_logo' | 'playlist' | 'social_clip' | 'long_form';
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          parameters: any;
          result_url?: string;
          error_message?: string;
          processing_time?: number;
          source_samples: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'sound_logo' | 'playlist' | 'social_clip' | 'long_form';
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          parameters?: any;
          result_url?: string;
          error_message?: string;
          processing_time?: number;
          source_samples?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      licenses: {
        Row: {
          id: string;
          user_id: string;
          audio_sample_id?: string;
          generation_id?: string;
          license_type: 'personal' | 'commercial' | 'enterprise';
          price: number;
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
          payment_intent_id?: string;
          usage_terms: string;
          expiry_date?: string;
          download_limit?: number;
          downloads_used: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          audio_sample_id?: string;
          generation_id?: string;
          license_type: 'personal' | 'commercial' | 'enterprise';
          price: number;
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
          payment_intent_id?: string;
          usage_terms: string;
          expiry_date?: string;
          download_limit?: number;
          downloads_used?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          audio_sample_id?: string;
          generation_id?: string;
          license_type?: 'personal' | 'commercial' | 'enterprise';
          price?: number;
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
          payment_intent_id?: string;
          usage_terms?: string;
          expiry_date?: string;
          download_limit?: number;
          downloads_used?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      revenue_splits: {
        Row: {
          id: string;
          license_id: string;
          contributor_id: string;
          amount: number;
          percentage: number;
          status: 'pending' | 'paid' | 'failed';
          payment_date?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          license_id: string;
          contributor_id: string;
          amount: number;
          percentage: number;
          status?: 'pending' | 'paid' | 'failed';
          payment_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          license_id?: string;
          contributor_id?: string;
          amount?: number;
          percentage?: number;
          status?: 'pending' | 'paid' | 'failed';
          payment_date?: string;
          created_at?: string;
        };
      };
    };
  };
}