-- Create categories table if not exists and insert default categories
-- Run this in your Supabase SQL Editor

-- 1. Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for read access
DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
CREATE POLICY "Anyone can read categories" ON public.categories
    FOR SELECT USING (true);

-- 4. Insert default categories (upsert to avoid duplicates)
INSERT INTO public.categories (name, description, icon, color) VALUES
    ('Médicos', 'Conteúdo para profissionais médicos', '🩺', 'bg-blue-500'),
    ('Enfermeiros', 'Conteúdo para enfermeiros', '💉', 'bg-green-500'),
    ('Técnicos de Enfermagem', 'Conteúdo para técnicos de enfermagem', '🏥', 'bg-teal-500'),
    ('Técnicos de Farmácia', 'Conteúdo para técnicos de farmácia', '💊', 'bg-purple-500'),
    ('Técnicos de Análises Clínicas', 'Conteúdo para técnicos de análises clínicas', '🔬', 'bg-orange-500')
ON CONFLICT (name) DO NOTHING;

-- 5. Verify inserted categories
SELECT id, name FROM public.categories;
