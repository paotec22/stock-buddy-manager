// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://itycbazttpidqlgmmrot.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eWNiYXp0dHBpZHFsZ21tcm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNTU3MDEsImV4cCI6MjA1MDYzMTcwMX0.S5Pa5PcYBQiOdJbDvTR_cAHKIfM8uGq-OVONyhpws9o";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);