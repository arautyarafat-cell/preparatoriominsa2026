-- Add last_user_id column to trial_quiz_limits table
ALTER TABLE public.trial_quiz_limits 
ADD COLUMN IF NOT EXISTS last_user_id UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_trial_quiz_limits_last_user_id 
ON public.trial_quiz_limits(last_user_id);
