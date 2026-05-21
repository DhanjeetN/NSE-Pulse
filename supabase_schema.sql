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

-- 5. Create trigger to automatically set last_seen_at to database server time (UTC)
-- This eliminates client clock skew issues where a client's local clock is out of sync.
CREATE OR REPLACE FUNCTION public.set_last_seen_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_set_last_seen_at
BEFORE INSERT OR UPDATE ON public.active_users
FOR EACH ROW
EXECUTE FUNCTION public.set_last_seen_at();

-- 6. Create RPC function to get active users count and self-clean old data
-- This is executed on the server, avoiding network roundtrips for deletes and client clock issues.
CREATE OR REPLACE FUNCTION public.get_active_users_count()
RETURNS integer AS $$
DECLARE
    active_count integer;
BEGIN
    -- Self-cleaning: Delete rows older than 5 minutes
    DELETE FROM public.active_users 
    WHERE last_seen_at < (timezone('utc'::text, now()) - INTERVAL '5 minutes');

    -- Count active users (active in the last 60 seconds)
    SELECT count(*)::integer INTO active_count
    FROM public.active_users
    WHERE last_seen_at > (timezone('utc'::text, now()) - INTERVAL '60 seconds');

    RETURN COALESCE(active_count, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. Create contact_submissions table to save Contact Us form queries
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security) on submissions
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert messages (so public users can submit the contact form)
CREATE POLICY "Allow public insert contact submissions" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

-- Allow authenticated project owners to read submissions (optional, if you have auth configured)
-- By default, this is restricted from select/read to anonymous users for privacy.


