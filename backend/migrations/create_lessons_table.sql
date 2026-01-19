-- ==================================================
-- MIGRACAO: CRIAR TABELA DE AULAS DIGITAIS
-- Sistema Angola Saude 2026
-- ==================================================
-- Execute este SQL no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rgnzrcuredtbwcnnimta/sql

-- Criar tabela de aulas digitais
CREATE TABLE IF NOT EXISTS public.lessons (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT 'TEC_ENFERMAGEM',
    nivel TEXT NOT NULL DEFAULT 'intermedio',
    categoria TEXT,
    slides JSONB NOT NULL DEFAULT '[]'::jsonb,
    aula_conversacional JSONB,
    mini_quiz JSONB,
    flashcards JSONB,
    duracao_estimada_minutos INTEGER DEFAULT 30,
    versao TEXT DEFAULT '1.0.0',
    autor TEXT DEFAULT 'Sistema Angola Saude 2026',
    objectivo_geral TEXT,
    objectivos_especificos JSONB DEFAULT '[]'::jsonb,
    pre_requisitos JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar indices para performance
CREATE INDEX IF NOT EXISTS idx_lessons_area ON public.lessons(area);
CREATE INDEX IF NOT EXISTS idx_lessons_nivel ON public.lessons(nivel);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON public.lessons(created_at DESC);

-- Habilitar Row Level Security
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Politicas de acesso (permitir tudo para simplificar)
DROP POLICY IF EXISTS "lessons_select_policy" ON public.lessons;
DROP POLICY IF EXISTS "lessons_insert_policy" ON public.lessons;
DROP POLICY IF EXISTS "lessons_update_policy" ON public.lessons;
DROP POLICY IF EXISTS "lessons_delete_policy" ON public.lessons;

CREATE POLICY "lessons_select_policy" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "lessons_insert_policy" ON public.lessons FOR INSERT WITH CHECK (true);
CREATE POLICY "lessons_update_policy" ON public.lessons FOR UPDATE USING (true);
CREATE POLICY "lessons_delete_policy" ON public.lessons FOR DELETE USING (true);

-- Comentarios
COMMENT ON TABLE public.lessons IS 'Aulas digitais interactivas com slides, audio e quiz';
