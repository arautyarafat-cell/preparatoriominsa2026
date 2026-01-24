-- Adicionar coluna plan à tabela profiles
-- Esta coluna define o plano de subscrição do utilizador: 'free', 'pro', 'premium', 'premier'
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

-- Adicionar coluna plan_activated_at para rastrear quando o plano foi ativado
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_activated_at TIMESTAMPTZ;

-- Índice para busca por plano
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);

-- Comentário na coluna
COMMENT ON COLUMN public.profiles.plan IS 'Plano de subscrição: free, pro, premium, premier';
