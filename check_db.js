/**
 * 🛠️ Script de Verificação de Banco de Dados
 * 
 * IMPORTANTE: Este script requer variáveis de ambiente configuradas!
 * Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de executar.
 * 
 * Uso: node check_db.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env (se existir)
config({ path: './backend/.env' });

// Validar que as variáveis de ambiente existem
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
    console.error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
    console.error('');
    console.error('Opções:');
    console.error('1. Crie um arquivo backend/.env com as variáveis');
    console.error('2. Exporte as variáveis no terminal antes de executar');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const setupDatabase = async () => {
    console.log('Verificando tabela user_sessions...');

    // SQL para criar a tabela (mostrado apenas para referência)
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS public.user_sessions (
            user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            device_id TEXT NOT NULL,
            last_seen_at TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Habilitar RLS
        ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

        -- Criar política para usuários gerenciarem suas próprias sessões
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

    // Verificar se a tabela existe
    const { error } = await supabase.from('user_sessions').select('*').limit(1);

    if (error) {
        console.error('Erro ao verificar tabela:', error);
        if (error.code === '42P01') { // undefined_table
            console.log('');
            console.log('⚠️ A tabela não existe. Execute o SQL abaixo no Supabase Dashboard:');
            console.log('');
            console.log(createTableQuery);
        }
    } else {
        console.log('✅ Tabela user_sessions existe e está acessível.');
    }
};

setupDatabase();
