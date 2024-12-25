import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  throw new Error(
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables'
  );
}

// Validate URL format
try {
  // Remove any trailing slashes and ensure proper URL format
  const cleanUrl = supabaseUrl.replace(/\/+$/, '');
  new URL(cleanUrl);
} catch (error) {
  console.error('Invalid Supabase URL format');
  throw new Error(
    'VITE_SUPABASE_URL must be a valid URL (e.g., https://your-project.supabase.co)'
  );
}

// Create Supabase client with cleaned URL
export const supabase = createClient(supabaseUrl.replace(/\/+$/, ''), supabaseKey);