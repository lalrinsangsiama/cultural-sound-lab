import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Helper to get base URL for API calls
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use relative URLs
    return '';
  }
  // Server-side: use absolute URL
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
};

// Create a mock Supabase client if environment variables are missing
const createMockSupabaseClient = () => ({
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const response = await fetch(`${getApiUrl()}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          return { 
            data: { user: null, session: null }, 
            error: { message: errorData.error || 'Login failed' }
          };
        }
        
        const responseData = await response.json();
        return { 
          data: { 
            user: responseData.user, 
            session: responseData.session 
          }, 
          error: null 
        };
      } catch (error) {
        return { 
          data: { user: null, session: null }, 
          error: { message: 'Network error' }
        };
      }
    },
    signUp: async ({ email, password, options }: { email: string; password: string; options?: any }) => {
      try {
        const response = await fetch(`${getApiUrl()}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name: options?.data?.name }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          return { 
            data: { user: null, session: null }, 
            error: { message: errorData.error || 'Registration failed' }
          };
        }
        
        const responseData = await response.json();
        return { 
          data: { 
            user: responseData.user, 
            session: responseData.session 
          }, 
          error: null 
        };
      } catch (error) {
        return { 
          data: { user: null, session: null }, 
          error: { message: 'Network error' }
        };
      }
    },
    signOut: async () => {
      await fetch(`${getApiUrl()}/api/auth/logout`, { method: 'POST' });
      return { error: null };
    },
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Mock implementation
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
      }),
    }),
  }),
});

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createMockSupabaseClient() as any;

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
};

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
  
  return data;
};