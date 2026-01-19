-- ============================================================
-- 🛡️ MIGRATION COMPLETA DE SEGURANÇA RLS
-- Angola Saúde 2026 - Preparatório MINSA
-- 
-- Esta migration foi APLICADA com sucesso em: 19/01/2026
-- Versões: enable_rls_security_policies, complete_rls_and_blocked_users,
--          remove_permissive_policies
-- ============================================================

-- ============================================================
-- 1. TABELAS DE UTILIZADOR (Acesso restrito aos próprios dados)
-- ============================================================

-- user_profiles (email: text)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_select_own"
ON public.user_profiles FOR SELECT TO authenticated
USING (email = (auth.jwt() ->> 'email')::text);

CREATE POLICY "user_profiles_update_own"
ON public.user_profiles FOR UPDATE TO authenticated
USING (email = (auth.jwt() ->> 'email')::text)
WITH CHECK (email = (auth.jwt() ->> 'email')::text);


-- user_progress (user_id: text)
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_progress_select_own"
ON public.user_progress FOR SELECT TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "user_progress_insert_own"
ON public.user_progress FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "user_progress_update_own"
ON public.user_progress FOR UPDATE TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);


-- user_lesson_stats (user_id: text)
ALTER TABLE public.user_lesson_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_lesson_stats_select_own"
ON public.user_lesson_stats FOR SELECT TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "user_lesson_stats_insert_own"
ON public.user_lesson_stats FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "user_lesson_stats_update_own"
ON public.user_lesson_stats FOR UPDATE TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);


-- lesson_progress (user_id: text)
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lesson_progress_select_own"
ON public.lesson_progress FOR SELECT TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "lesson_progress_insert_own"
ON public.lesson_progress FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "lesson_progress_update_own"
ON public.lesson_progress FOR UPDATE TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);


-- payment_proofs (user_email: text)
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_proofs_select_own"
ON public.payment_proofs FOR SELECT TO authenticated
USING (user_email = (auth.jwt() ->> 'email')::text);

CREATE POLICY "payment_proofs_insert_own"
ON public.payment_proofs FOR INSERT TO authenticated
WITH CHECK (user_email = (auth.jwt() ->> 'email')::text);


-- ============================================================
-- 2. TABELAS DE CONTEÚDO (Leitura pública)
-- ============================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select_all"
ON public.categories FOR SELECT TO anon, authenticated
USING (true);


ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_select_all"
ON public.questions FOR SELECT TO anon, authenticated
USING (true);


ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_select_all"
ON public.lessons FOR SELECT TO anon, authenticated
USING (true);


ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials_select_all"
ON public.materials FOR SELECT TO anon, authenticated
USING (true);


ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects_select_all"
ON public.subjects FOR SELECT TO anon, authenticated
USING (true);


ALTER TABLE public.study_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "study_topics_select_all"
ON public.study_topics FOR SELECT TO anon, authenticated
USING (true);


ALTER TABLE public.decipher_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "decipher_terms_select_active"
ON public.decipher_terms FOR SELECT TO anon, authenticated
USING (is_active = true);


ALTER TABLE public.game_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "game_cases_select_all"
ON public.game_cases FOR SELECT TO anon, authenticated
USING (true);


ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "generated_content_select_all"
ON public.generated_content FOR SELECT TO anon, authenticated
USING (true);


ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_methods_select_all"
ON public.payment_methods FOR SELECT TO anon, authenticated
USING (true);


-- ============================================================
-- 3. TABELAS DE ADMINISTRAÇÃO (Apenas service role)
-- ============================================================

-- blocked_users (sem políticas = apenas service role)
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    email text NOT NULL UNIQUE,
    reason text DEFAULT 'Bloqueado pelo administrador',
    blocked_by text,
    blocked_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;


-- blocked_categories (leitura pública, escrita service role)
CREATE TABLE IF NOT EXISTS public.blocked_categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
    reason text DEFAULT 'Categoria temporariamente indisponível',
    blocked_by text,
    blocked_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.blocked_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocked_categories_select_all"
ON public.blocked_categories FOR SELECT TO anon, authenticated
USING (true);


-- app_settings (leitura pública, escrita service role)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    key text UNIQUE NOT NULL,
    value jsonb,
    description text,
    updated_at timestamptz DEFAULT now(),
    updated_by text
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings_select_all"
ON public.app_settings FOR SELECT TO anon, authenticated
USING (true);


-- ============================================================
-- 4. COLUNAS DE AUDITORIA
-- ============================================================

-- payment_proofs
ALTER TABLE public.payment_proofs ADD COLUMN IF NOT EXISTS approved_by text;
ALTER TABLE public.payment_proofs ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.payment_proofs ADD COLUMN IF NOT EXISTS rejected_by text;
ALTER TABLE public.payment_proofs ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
ALTER TABLE public.payment_proofs ADD COLUMN IF NOT EXISTS rejection_reason text;

-- user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS updated_by text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS created_by text;


-- ============================================================
-- NOTAS:
-- 
-- ✅ RLS ativado em TODAS as tabelas
-- ✅ Utilizadores só acedem aos seus próprios dados
-- ✅ Conteúdo público é apenas leitura
-- ✅ Operações de escrita em tabelas admin = apenas service role
-- ✅ Backend usa service_role e bypassa RLS automaticamente
-- ============================================================
