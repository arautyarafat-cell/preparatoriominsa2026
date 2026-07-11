-- Migration: Add support for all-MiniLM-L6-v2 embeddings (384 dimensions)
-- Run this in your Supabase SQL Editor

-- 1. Add category_id column if it doesn't exist
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 2. Add embedding column for 384-dim vectors (all-MiniLM-L6-v2)
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS embedding_384 vector(384);

-- 3. Create index for the new embedding column
CREATE INDEX IF NOT EXISTS idx_materials_embedding_384 ON public.materials 
USING ivfflat (embedding_384 vector_cosine_ops)
WITH (lists = 100);

-- 4. Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_materials_category_id ON public.materials(category_id);

-- 5. Create the matching function for 384-dim embeddings
CREATE OR REPLACE FUNCTION match_materials_384(
    query_embedding vector(384),
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 5,
    filter_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    category_id UUID,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.content,
        m.metadata,
        m.category_id,
        1 - (m.embedding_384 <=> query_embedding) AS similarity
    FROM public.materials m
    WHERE 
        m.embedding_384 IS NOT NULL
        AND 1 - (m.embedding_384 <=> query_embedding) > match_threshold
        AND (filter_category_id IS NULL OR m.category_id = filter_category_id)
    ORDER BY m.embedding_384 <=> query_embedding
    LIMIT match_count;
END;
$$;
