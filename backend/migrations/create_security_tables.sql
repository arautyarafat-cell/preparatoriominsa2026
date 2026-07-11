-- ============================================================
-- MIGRATION: Segurança - Histórico de Dispositivos e Bloqueio de Usuários
-- Angola Saúde 2026
-- ============================================================

-- 1. Tabela para registrar histórico de login por dispositivo
-- Usada para detectar usuários que acessam de múltiplos dispositivos
CREATE TABLE IF NOT EXISTS public.device_login_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    logged_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_device_login_history_user_id ON public.device_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_device_login_history_logged_in_at ON public.device_login_history(logged_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_login_history_device_id ON public.device_login_history(device_id);

-- 2. Adicionar campos de bloqueio na tabela profiles (se não existirem)
DO $$
BEGIN
    -- Adicionar campo is_blocked
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'is_blocked') THEN
        ALTER TABLE public.profiles ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Adicionar campo blocked_reason
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'blocked_reason') THEN
        ALTER TABLE public.profiles ADD COLUMN blocked_reason TEXT;
    END IF;
    
    -- Adicionar campo blocked_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'blocked_at') THEN
        ALTER TABLE public.profiles ADD COLUMN blocked_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. RLS Policies para device_login_history
ALTER TABLE public.device_login_history ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seu próprio histórico
CREATE POLICY "Users can view own device history" ON public.device_login_history
    FOR SELECT
    USING (auth.uid() = user_id);

-- Apenas o sistema (via service role) pode inserir no histórico
-- Não criar policy de INSERT para usuários comuns, apenas service role

-- 4. Índice para busca de usuários bloqueados
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON public.profiles(is_blocked) WHERE is_blocked = TRUE;

-- ============================================================
-- GRANT Permissions (para service role acessar)
-- ============================================================
GRANT SELECT, INSERT ON public.device_login_history TO service_role;
GRANT SELECT ON public.device_login_history TO authenticated;

-- ============================================================
-- COMENTÁRIOS
-- ============================================================
COMMENT ON TABLE public.device_login_history IS 'Histórico de logins por dispositivo para detecção de uso compartilhado de conta';
COMMENT ON COLUMN public.device_login_history.device_id IS 'ID único do dispositivo gerado no navegador';
COMMENT ON COLUMN public.device_login_history.ip_address IS 'Endereço IP do login';
COMMENT ON COLUMN public.device_login_history.user_agent IS 'User agent do navegador';
COMMENT ON COLUMN public.profiles.is_blocked IS 'Se o usuário está bloqueado';
COMMENT ON COLUMN public.profiles.blocked_reason IS 'Motivo do bloqueio';
COMMENT ON COLUMN public.profiles.blocked_at IS 'Data/hora do bloqueio';
