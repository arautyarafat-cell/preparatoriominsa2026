import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rgnzrcuredtbwcnnimta.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnbnpyY3VyZWR0Yndjbm5pbXRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU5NTA5MSwiZXhwIjoyMDgzMTcxMDkxfQ.zvjGXHMfEyPQcyrkbVGh3OFgZXsJLtPt8XkRaLCcDzE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const check = async () => {
    console.log('Checking user_sessions table...');
    const { error } = await supabase.from('user_sessions').select('*').limit(1);
    if (error) {
        console.error('CRITICAL DATABASE ERROR:', error);
        // If error code is 42P01 (undefined_table), we found the issue.
    } else {
        console.log('Table exists and is accessible.');
    }
};

check();
