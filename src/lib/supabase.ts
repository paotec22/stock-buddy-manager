import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://itycbazttpidqlgmmrot.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eWNiYXp0dHBpZHFsZ21tcm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDU5MjcxMjAsImV4cCI6MjAyMTUwMzEyMH0.0sTsAx7Iw_RJ8TU7ZXVWj2B_EnQF8oXwR3Ykm_UXKUs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});