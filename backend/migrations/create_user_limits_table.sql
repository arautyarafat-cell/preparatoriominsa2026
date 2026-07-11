CREATE TABLE IF NOT EXISTS public.user_limits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    quiz_count INTEGER DEFAULT 0,
    blocked_until TIMESTAMPTZ,
    is_blocked BOOLEAN DEFAULT FALSE,
    block_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_limits_user_id ON public.user_limits(user_id);
