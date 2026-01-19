-- Migration: Fix study_topics table and permissions
-- Run this in Supabase SQL Editor

-- 1. Create study_topics table if not exists
CREATE TABLE IF NOT EXISTS public.study_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.study_topics ENABLE ROW LEVEL SECURITY;

-- 3. Policy for reading (anyone can read)
DROP POLICY IF EXISTS "Anyone can read study_topics" ON public.study_topics;
CREATE POLICY "Anyone can read study_topics" ON public.study_topics
    FOR SELECT USING (true);

-- 4. Policy for inserting (authenticated or anon for now if simpler)
DROP POLICY IF EXISTS "Anyone can insert study_topics" ON public.study_topics;
CREATE POLICY "Anyone can insert study_topics" ON public.study_topics
    FOR INSERT WITH CHECK (true);

-- 5. Helper verification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'study_topics';
