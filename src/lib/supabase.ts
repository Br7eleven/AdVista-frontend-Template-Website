import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_KEY;

// Log Supabase configuration (without exposing full key)
const maskKey = (key: string) => {
  if (!key) return 'undefined-or-empty';
  if (key.length < 10) return 'too-short';
  return `${key.substring(0, 5)}...${key.substring(key.length - 5)}`;
};

console.log('Supabase Configuration:', {
  url: supabaseUrl,
  anonKey: maskKey(supabaseAnonKey),
  isDefined: !!supabaseUrl && !!supabaseAnonKey
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing!');
}

// Create the Supabase client with debug options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});