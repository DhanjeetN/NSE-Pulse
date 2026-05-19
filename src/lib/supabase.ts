import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  "";

// Graceful check to see if credentials are configured
export const isSupabaseConfigured: boolean = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== "your_supabase_project_url" && 
  supabaseAnonKey !== "your_supabase_anon_key" &&
  supabaseAnonKey !== "your_supabase_publishable_key" &&
  supabaseUrl !== "undefined" &&
  supabaseAnonKey !== "undefined" &&
  supabaseUrl !== "null" &&
  supabaseAnonKey !== "null"
);

// Initialize client (always instantiate, but we will check `isSupabaseConfigured` before calling methods to prevent runtime crashes)
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://placeholder-url.supabase.co",
  isSupabaseConfigured ? supabaseAnonKey : "placeholder-key"
);
