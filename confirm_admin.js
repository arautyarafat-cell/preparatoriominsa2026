/**
 * 🛠️ Script de Configuração de Admin
 * 
 * IMPORTANTE: Este script requer variáveis de ambiente configuradas!
 * Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de executar.
 * 
 * Uso: node confirm_admin.js
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

const fixUser = async () => {
    // ⚠️ IMPORTANTE: Configure o email e senha desejados aqui
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
        console.error('❌ ERRO: Configure ADMIN_PASSWORD nas variáveis de ambiente');
        process.exit(1);
    }

    console.log(`Configurando usuário ${email}...`);

    // 1. Verificar se o usuário existe
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Erro ao listar usuários:', listError);
        return;
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        console.log(`Usuário encontrado (ID: ${existingUser.id}). Status: ${existingUser.email_confirmed_at ? 'Confirmado' : 'Não confirmado'}`);

        // Atualizar usuário para confirmado
        const { data, error } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            {
                email_confirm: true,
                user_metadata: { email_confirmed: true },
                password: password
            }
        );

        if (error) {
            console.error('Erro ao atualizar:', error);
        } else {
            console.log('✅ Usuário confirmado com sucesso via Admin API.');
        }

    } else {
        console.log('Usuário não encontrado. Criando novo usuário confirmado...');

        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (error) {
            console.error('Erro ao criar:', error);
        } else {
            console.log('✅ Usuário criado e confirmado com sucesso.');
        }
    }
};

fixUser();
