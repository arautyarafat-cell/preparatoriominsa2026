// Script para adicionar coluna materiais_complementares à tabela lessons
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMateriaisColumn() {
    console.log('Adicionando coluna materiais_complementares à tabela lessons...\n');

    try {
        // Executar SQL diretamente via RPC ou função PostgreSQL
        // Como o Supabase não permite ALTER TABLE diretamente via API,
        // vamos tentar uma abordagem alternativa: verificar se podemos adicionar dados

        // Primeiro, vamos verificar a estrutura atual
        const { data: lessons, error: fetchError } = await supabase
            .from('lessons')
            .select('id')
            .limit(1);

        if (fetchError) {
            console.error('Erro ao verificar tabela:', fetchError);
            return;
        }

        console.log('Tabela lessons existe.');
        console.log('\n⚠️  AÇÃO NECESSÁRIA:');
        console.log('A coluna materiais_complementares precisa ser adicionada manualmente.');
        console.log('');
        console.log('Execute o seguinte SQL no Supabase Dashboard (SQL Editor):');
        console.log('');
        console.log('---------------------------------------------------');
        console.log(`ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS materiais_complementares TEXT[] DEFAULT '{}';`);
        console.log('---------------------------------------------------');
        console.log('');
        console.log('Ou acesse: https://supabase.com/dashboard e vá para:');
        console.log('1. Seu projeto');
        console.log('2. SQL Editor');
        console.log('3. Cole e execute o SQL acima');

    } catch (error) {
        console.error('Erro:', error.message);
    }
}

addMateriaisColumn();
