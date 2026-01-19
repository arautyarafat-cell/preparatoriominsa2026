// Script para criar a tabela game_cases usando a API SQL do Supabase
import https from 'https';

const SUPABASE_URL = 'https://rgnzrcuredtbwcnnimta.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnbnpyY3VyZWR0Yndjbm5pbXRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU5NTA5MSwiZXhwIjoyMDgzMTcxMDkxfQ.zvjGXHMfEyPQcyrkbVGh3OFgZXsJLtPt8XkRaLCcDzE';

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS game_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id TEXT NOT NULL,
    difficulty INTEGER DEFAULT 5,
    case_data JSONB NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_cases_category_used ON game_cases(category_id, used);
`;

// Usar a API de SQL do Supabase (via rpc)
async function executeSql() {
    console.log('🔧 Tentando criar tabela game_cases...\n');

    const url = new URL('/rest/v1/rpc/execute_sql', SUPABASE_URL);

    const options = {
        method: 'POST',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json'
        }
    };

    const body = JSON.stringify({ query: CREATE_TABLE_SQL });

    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Response: ${data}`);
                resolve({ status: res.statusCode, data });
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

executeSql().then(result => {
    if (result.status === 404) {
        console.log('\n⚠️ A função execute_sql não existe no Supabase.');
        console.log('📋 Você precisa criar a tabela MANUALMENTE no Supabase SQL Editor.\n');
        console.log('1. Acesse: https://supabase.com/dashboard/project/rgnzrcuredtbwcnnimta/sql');
        console.log('2. Cole e execute este SQL:\n');
        console.log(CREATE_TABLE_SQL);
    }
}).catch(console.error);
