-- Migration: Add summary column to study_topics
-- This column stores a structured summary of the content

ALTER TABLE public.study_topics 
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_study_topics_category_created
ON public.study_topics (category_id, created_at DESC);
