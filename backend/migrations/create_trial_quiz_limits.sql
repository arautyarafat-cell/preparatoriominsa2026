-- Tabela para rastrear limites de questionários de teste por IP
-- Usada para limitar utilizadores gratuitos a 5 questionários
CREATE TABLE IF NOT EXISTS public.trial_quiz_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL UNIQUE,
    quiz_count INTEGER DEFAULT 0,
    first_quiz_at TIMESTAMPTZ DEFAULT NOW(),
    last_quiz_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida por IP
CREATE INDEX IF NOT EXISTS idx_trial_quiz_limits_ip ON public.trial_quiz_limits(ip_address);

-- Comentário na tabela
COMMENT ON TABLE public.trial_quiz_limits IS 'Rastreia o número de questionários realizados por IP para limitar utilizadores gratuitos';
