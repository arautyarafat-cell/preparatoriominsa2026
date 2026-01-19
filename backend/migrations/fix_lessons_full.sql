-- Fix Lessons Table
CREATE TABLE IF NOT EXISTS public.lessons (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT 'TEC_ENFERMAGEM',
    nivel TEXT NOT NULL DEFAULT 'intermedio',
    categoria TEXT, -- Matches backend
    slides JSONB NOT NULL DEFAULT '[]'::jsonb,
    aula_conversacional JSONB DEFAULT '{}'::jsonb,
    mini_quiz JSONB DEFAULT '{}'::jsonb,
    flashcards JSONB DEFAULT '[]'::jsonb,
    integracao_jogos JSONB DEFAULT '{}'::jsonb,
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

-- Indices for Lessons
CREATE INDEX IF NOT EXISTS idx_lessons_area ON public.lessons(area);
CREATE INDEX IF NOT EXISTS idx_lessons_nivel ON public.lessons(nivel);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON public.lessons(created_at DESC);

-- Lesson Progress Table
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Internal ID
    lesson_id TEXT NOT NULL, -- References lessons.id (TEXT)
    user_id TEXT NOT NULL,
    progress_data JSONB DEFAULT '{}'::jsonb, -- Generic bucket for progress
    slide_atual INTEGER DEFAULT 0,
    slides_completados JSONB DEFAULT '[]'::jsonb,
    tempo_total_segundos INTEGER DEFAULT 0,
    ultimo_acesso TIMESTAMPTZ DEFAULT NOW(),
    quiz_respondido BOOLEAN DEFAULT FALSE,
    quiz_pontuacao INTEGER,
    respostas_quiz JSONB DEFAULT '{}'::jsonb,
    interacoes_completadas JSONB DEFAULT '[]'::jsonb,
    flashcards_dominados JSONB DEFAULT '[]'::jsonb,
    concluida BOOLEAN DEFAULT FALSE,
    data_conclusao TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lesson_id, user_id)
);

-- User Lesson Stats Table
CREATE TABLE IF NOT EXISTS public.user_lesson_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    aulas_iniciadas INTEGER DEFAULT 0,
    aulas_concluidas INTEGER DEFAULT 0,
    tempo_total_estudo_segundos INTEGER DEFAULT 0,
    media_pontuacao_quiz DECIMAL(5,2) DEFAULT 0,
    flashcards_dominados INTEGER DEFAULT 0,
    streak_dias INTEGER DEFAULT 0,
    ultimo_estudo TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_stats ENABLE ROW LEVEL SECURITY;

-- Policies (Permissive for now to ensure it works)
DROP POLICY IF EXISTS "lessons_all" ON public.lessons;
CREATE POLICY "lessons_all" ON public.lessons FOR ALL USING (true);

DROP POLICY IF EXISTS "lesson_progress_all" ON public.lesson_progress;
CREATE POLICY "lesson_progress_all" ON public.lesson_progress FOR ALL USING (true);

DROP POLICY IF EXISTS "user_lesson_stats_all" ON public.user_lesson_stats;
CREATE POLICY "user_lesson_stats_all" ON public.user_lesson_stats FOR ALL USING (true);
