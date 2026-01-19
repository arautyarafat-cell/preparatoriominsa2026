-- Criar tabela para casos clínicos pré-gerados
-- Execute este SQL no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS game_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id TEXT NOT NULL,
    difficulty INTEGER DEFAULT 5,
    case_data JSONB NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_game_cases_category ON game_cases(category_id);
CREATE INDEX IF NOT EXISTS idx_game_cases_used ON game_cases(used);
CREATE INDEX IF NOT EXISTS idx_game_cases_created_at ON game_cases(created_at);

-- Index composto para queries frequentes
CREATE INDEX IF NOT EXISTS idx_game_cases_category_used ON game_cases(category_id, used);

-- Comentários
COMMENT ON TABLE game_cases IS 'Casos clínicos pré-gerados para o jogo Plantão de Emergência';
COMMENT ON COLUMN game_cases.category_id IS 'ID da categoria (MEDICO, TEC_ENFERMAGEM, etc.)';
COMMENT ON COLUMN game_cases.difficulty IS 'Nível de dificuldade do caso (1-10)';
COMMENT ON COLUMN game_cases.case_data IS 'Dados completos do caso clínico em JSON';
COMMENT ON COLUMN game_cases.used IS 'Se o caso já foi utilizado por algum usuário';
COMMENT ON COLUMN game_cases.used_at IS 'Data/hora em que o caso foi marcado como usado';

-- Habilitar RLS (Row Level Security) - opcional
-- ALTER TABLE game_cases ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública (ajuste conforme necessário)
-- CREATE POLICY "Allow public read" ON game_cases FOR SELECT USING (true);
-- CREATE POLICY "Allow service role insert" ON game_cases FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow service role update" ON game_cases FOR UPDATE USING (true);
