-- Add blocking columns to trial_quiz_limits table
ALTER TABLE public.trial_quiz_limits
ADD COLUMN IF NOT EXISTS blocked_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_permanently_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- Add comment explaining the new columns
COMMENT ON COLUMN public.trial_quiz_limits.blocked_until IS 'Timestamp until which the IP is blocked (temporary block)';
COMMENT ON COLUMN public.trial_quiz_limits.is_permanently_blocked IS 'Indicates if the IP is permanently blocked';
COMMENT ON COLUMN public.trial_quiz_limits.block_reason IS 'Reason for blocking the IP';
