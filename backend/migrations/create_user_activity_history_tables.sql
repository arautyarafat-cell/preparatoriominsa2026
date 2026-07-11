-- Migração: Criar tabelas de histórico de atividade do utilizador
-- Execute este script no SQL Editor da Supabase

-- Tabela para histórico de quizzes do utilizador
CREATE TABLE IF NOT EXISTS user_quiz_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    topic TEXT,
    total_questions INTEGER NOT NULL DEFAULT 0,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para histórico de flashcards do utilizador
CREATE TABLE IF NOT EXISTS user_flashcard_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    cards_reviewed INTEGER NOT NULL DEFAULT 0,
    mastered INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_quiz_history_user_id ON user_quiz_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flashcard_history_user_id ON user_flashcard_history(user_id);

-- RLS Policies
ALTER TABLE user_quiz_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flashcard_history ENABLE ROW LEVEL SECURITY;

-- Utilizadores podem ver apenas o seu próprio histórico
DROP POLICY IF EXISTS "Users can view own quiz history" ON user_quiz_history;
CREATE POLICY "Users can view own quiz history" ON user_quiz_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own quiz history" ON user_quiz_history;
CREATE POLICY "Users can insert own quiz history" ON user_quiz_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own flashcard history" ON user_flashcard_history;
CREATE POLICY "Users can view own flashcard history" ON user_flashcard_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own flashcard history" ON user_flashcard_history;
CREATE POLICY "Users can insert own flashcard history" ON user_flashcard_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role pode fazer tudo (para o backend)
DROP POLICY IF EXISTS "Service role full access quiz history" ON user_quiz_history;
CREATE POLICY "Service role full access quiz history" ON user_quiz_history
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access flashcard history" ON user_flashcard_history;
CREATE POLICY "Service role full access flashcard history" ON user_flashcard_history
    FOR ALL USING (true) WITH CHECK (true);
