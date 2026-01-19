import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

if (!config.supabase.url || !config.supabase.key) {
    throw new Error('Supabase credentials missing in .env');
}

export const supabase = createClient(config.supabase.url, config.supabase.key);
