
import { supabase } from './src/lib/supabase.js';

async function runMigrations() {
    console.log('Iniciando migracoes...');

    const createLessonsTable = `
    CREATE TABLE IF NOT EXISTS public.lessons (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        area TEXT NOT NULL DEFAULT 'TEC_ENFERMAGEM',
        nivel TEXT NOT NULL DEFAULT 'intermedio',
        categoria TEXT,
        slides JSONB NOT NULL DEFAULT '[]'::jsonb,
        aula_conversacional JSONB,
        mini_quiz JSONB,
        flashcards JSONB,
        duracao_estimada_minutos INTEGER DEFAULT 30,
        versao TEXT DEFAULT '1.0.0',
        autor TEXT DEFAULT 'Sistema Angola Saude 2026',
        objectivo_geral TEXT,
        objectivos_especificos JSONB DEFAULT '[]'::jsonb,
        pre_requisitos JSONB DEFAULT '[]'::jsonb,
        tags JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    `;

    const createIndices = `
    CREATE INDEX IF NOT EXISTS idx_lessons_area ON public.lessons(area);
    CREATE INDEX IF NOT EXISTS idx_lessons_nivel ON public.lessons(nivel);
    CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON public.lessons(created_at DESC);
    `;

    try {
        // Tentar criar tabela usando RPC se possivel, ou logar instrucao
        // Como o supabase-js client nao executa DDL arbitrario sem RPC,
        // vamos tentar usar o endpoints do Supabase se tivermos a chave de servico

        console.log('NOTA: O cliente JS do Supabase não executa DDL diretamente no banco.');
        console.log('Por favor, execute o arquivo migrations/create_lessons_table.sql no painel SQL do Supabase.');
        console.log('Entretanto, o sistema foi adaptado para funcionar mesmo se a tabela não existir (retornando arrays vazios).');

    } catch (error) {
        console.error('Erro na migracao:', error);
    }
}

runMigrations();
