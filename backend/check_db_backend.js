/**
 * 🛠️ Script de Verificação de Banco de Dados (Backend)
 * 
 * IMPORTANTE: Este script requer variáveis de ambiente configuradas!
 * Execute a partir da pasta backend/ com: node check_db_backend.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

// Validar que as variáveis de ambiente existem
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
    console.error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const check = async () => {
    console.log('Verificando tabela user_sessions...');
    const { error } = await supabase.from('user_sessions').select('*').limit(1);
    if (error) {
        console.error('❌ ERRO CRÍTICO DO BANCO DE DADOS:', error);
        if (error.code === '42P01') {
            console.log('A tabela user_sessions não existe. Execute as migrações.');
        }
    } else {
        console.log('✅ Tabela existe e está acessível.');
    }
};

check();
