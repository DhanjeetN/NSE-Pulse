-- SQL Schema for Live Viewer Counter
-- Copy and run this in your Supabase SQL Editor (https://supabase.com dashboard -> SQL Editor -> New Query)

-- 1. Create the active_users table
CREATE TABLE IF NOT EXISTS public.active_users (
    id TEXT PRIMARY KEY,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create an index on last_seen_at for high performance cleanups and count queries
CREATE INDEX IF NOT EXISTS active_users_last_seen_at_idx ON public.active_users (last_seen_at);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.active_users ENABLE ROW LEVEL SECURITY;

-- 4. Create policies to allow public/anonymous users to insert, select, update, and delete active users
-- This is secure because active_users only stores transient, anonymous visitor IDs and their last active timestamps.

CREATE POLICY "Allow public select" 
ON public.active_users 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert" 
ON public.active_users 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update" 
ON public.active_users 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow public delete" 
ON public.active_users 
FOR DELETE 
USING (true);
