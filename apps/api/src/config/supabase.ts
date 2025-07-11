import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && supabaseServiceKey;

if (!isSupabaseConfigured) {
  console.warn('⚠️  Supabase not configured - running in mock mode. Database operations will be simulated.');
}

// Create mock clients if Supabase is not configured
const createMockClient = () => ({
  from: () => ({
    select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Mock mode - no database') }) }),
    insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: `mock_${Date.now()}` }, error: null }) }) }),
    update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    eq: function() { return this; },
    in: function() { return this; },
    limit: function() { return this; },
    range: function() { return this; },
    order: function() { return this; },
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Mock mode - no auth') }),
  }
});

// Client for user operations (with RLS)
export const supabase = isSupabaseConfigured 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : createMockClient() as any;

// Admin client for server operations (bypasses RLS)
export const supabaseAdmin = isSupabaseConfigured 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : createMockClient() as any;

// Helper function to get user from JWT token
export const getUserFromToken = async (token: string) => {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }
  return user;
};

// Helper function to verify user exists in our users table
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    throw new Error(`User profile not found: ${error.message}`);
  }
  
  return data;
};