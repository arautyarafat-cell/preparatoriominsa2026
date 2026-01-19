import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rgnzrcuredtbwcnnimta.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnbnpyY3VyZWR0Yndjbm5pbXRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU5NTA5MSwiZXhwIjoyMDgzMTcxMDkxfQ.zvjGXHMfEyPQcyrkbVGh3OFgZXsJLtPt8XkRaLCcDzE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const setupDatabase = async () => {
    console.log('Setting up user_sessions table...');

    // SQL to create the table
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS public.user_sessions (
            user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            device_id TEXT NOT NULL,
            last_seen_at TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS (Optional, but good practice, though Service Role ignores it)
        ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

        -- Create policy to allow users to read/upsert their OWN session (if we were using client-side)
        -- But since we use backend with service role, this is just for safety.
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT FROM pg_policies WHERE tablename = 'user_sessions' AND policyname = 'Users can manage their own session'
            ) THEN
                CREATE POLICY "Users can manage their own session" ON public.user_sessions
                USING (auth.uid() = user_id)
                WITH CHECK (auth.uid() = user_id);
            END IF;
        END $$;
    `;

    // Sadly, supabase-js client doesn't support raw SQL execution directly on the 'public' schema easily 
    // without the 'rpc' workaround or using the specific MCP tool. 
    // However, since we are in a backend environment causing issues, 
    // I will try to use the 'rpc' if a function exists, BUT 
    // usually we don't have a generic 'exec_sql' function exposed.

    // WAIT! The user is reporting a 500 error on INSERT.
    // If I can't run SQL, I might be stuck. 
    // BUT! I can use the 'postgres' library if I had the connection string, typically I only have the HTTP URL.

    // Alternative: The ERROR might be RLS related if the 'service role key' is NOT working as expected or if I initialized the client incorrectly.
    // In 'backend/src/lib/supabase.js' we use `process.env.SUPABASE_SERVICE_ROLE_KEY`.

    // Let's verify if the table simply doesn't exist by trying to select from it.
    const { error } = await supabase.from('user_sessions').select('*').limit(1);

    if (error) {
        console.error('Check Table Error:', error);
        if (error.code === '42P01') { // undefined_table
            console.log('Table does not exist. Please run the SQL migration manually in Supabase Dashboard.');
            console.log(createTableQuery);
        }
    } else {
        console.log('Table user_sessions exists.');
    }
};

setupDatabase();
