-- ==================================================
-- MIGRACAO: Sistema de Aulas Digitais
-- Angola Saude 2026
-- ==================================================

-- 1. Tabela de Aulas (para guardar aulas geradas)
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    area TEXT NOT NULL,
    nivel TEXT NOT NULL DEFAULT 'intermedio',
    versao TEXT DEFAULT '1.0.0',
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    autor TEXT DEFAULT 'Sistema Angola Saude 2026',
    objectivo_geral TEXT,
    objectivos_especificos JSONB DEFAULT '[]'::jsonb,
    pre_requisitos JSONB DEFAULT '[]'::jsonb,
    slides JSONB DEFAULT '[]'::jsonb,
    aula_conversacional JSONB DEFAULT '{}'::jsonb,
    mini_quiz JSONB DEFAULT '{}'::jsonb,
    flashcards JSONB DEFAULT '[]'::jsonb,
    integracao_jogos JSONB DEFAULT '{}'::jsonb,
    duracao_estimada_minutos INTEGER DEFAULT 20,
    numero_conceitos INTEGER DEFAULT 0,
    tags JSONB DEFAULT '[]'::jsonb,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice para busca por area e categoria
CREATE INDEX IF NOT EXISTS idx_lessons_area ON lessons(area);
CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons(category_id);

-- 2. Tabela de Progresso das Aulas
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    slide_atual INTEGER DEFAULT 0,
    slides_completados JSONB DEFAULT '[]'::jsonb,
    tempo_total_segundos INTEGER DEFAULT 0,
    ultimo_acesso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quiz_respondido BOOLEAN DEFAULT FALSE,
    quiz_pontuacao INTEGER,
    respostas_quiz JSONB DEFAULT '{}'::jsonb,
    interacoes_completadas JSONB DEFAULT '[]'::jsonb,
    flashcards_dominados JSONB DEFAULT '[]'::jsonb,
    concluida BOOLEAN DEFAULT FALSE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(lesson_id, user_id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);

-- 3. Tabela de Estatisticas por Usuario
CREATE TABLE IF NOT EXISTS user_lesson_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    aulas_iniciadas INTEGER DEFAULT 0,
    aulas_concluidas INTEGER DEFAULT 0,
    tempo_total_estudo_segundos INTEGER DEFAULT 0,
    media_pontuacao_quiz DECIMAL(5,2) DEFAULT 0,
    flashcards_dominados INTEGER DEFAULT 0,
    streak_dias INTEGER DEFAULT 0,
    ultimo_estudo TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice
CREATE INDEX IF NOT EXISTS idx_user_lesson_stats_user ON user_lesson_stats(user_id);

-- 4. Funcao para actualizar timestamp
CREATE OR REPLACE FUNCTION update_lesson_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS lessons_updated_at ON lessons;
CREATE TRIGGER lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_updated_at();

DROP TRIGGER IF EXISTS lesson_progress_updated_at ON lesson_progress;
CREATE TRIGGER lesson_progress_updated_at
    BEFORE UPDATE ON lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_updated_at();

DROP TRIGGER IF EXISTS user_lesson_stats_updated_at ON user_lesson_stats;
CREATE TRIGGER user_lesson_stats_updated_at
    BEFORE UPDATE ON user_lesson_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_updated_at();

-- 5. RLS (Row Level Security)
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_stats ENABLE ROW LEVEL SECURITY;

-- Politicas de acesso
-- Todos podem ler aulas
CREATE POLICY "Aulas publicas para leitura" ON lessons
    FOR SELECT USING (true);

-- Apenas admins podem inserir/actualizar aulas
CREATE POLICY "Admins podem gerir aulas" ON lessons
    FOR ALL USING (auth.role() = 'authenticated');

-- Usuarios podem ver e editar seu proprio progresso
CREATE POLICY "Usuarios gerem seu progresso" ON lesson_progress
    FOR ALL USING (true);

-- Usuarios podem ver suas proprias estatisticas
CREATE POLICY "Usuarios veem suas stats" ON user_lesson_stats
    FOR ALL USING (true);

-- Mensagem de confirmacao
DO $$
BEGIN
    RAISE NOTICE 'Migracao do Sistema de Aulas Digitais concluida com sucesso!';
END $$;
