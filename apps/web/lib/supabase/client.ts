import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a mock Supabase client if environment variables are missing
const createMockSupabaseClient = () => ({
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { data: { user: null, session: null }, error };
      }
      
      const data = await response.json();
      return { data, error: null };
    },
    signUp: async ({ email, password, options }: { email: string; password: string; options?: any }) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: options?.data?.name }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { data: { user: null, session: null }, error };
      }
      
      const data = await response.json();
      return { data, error: null };
    },
    signOut: async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
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