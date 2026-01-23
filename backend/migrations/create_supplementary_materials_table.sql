-- =====================================================
-- MIGRAÇÃO: Criar tabela supplementary_materials
-- Data: 2026-01-23
-- =====================================================
-- 
-- Esta migração cria uma nova tabela 'supplementary_materials' 
-- para armazenar materiais complementares (PDFs) das aulas digitais.
-- 
-- NOTA: A tabela 'materials' existente é usada para embeddings de IA
-- e não deve ser usada para PDFs de apoio.
-- 
-- =====================================================

-- Tabela para materiais complementares (PDFs de apoio às aulas)
CREATE TABLE IF NOT EXISTS supplementary_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_type TEXT DEFAULT 'PDF',
    file_size TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE supplementary_materials ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Public read supplementary_materials" 
    ON supplementary_materials FOR SELECT USING (true);
CREATE POLICY "Admin insert supplementary_materials" 
    ON supplementary_materials FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update supplementary_materials" 
    ON supplementary_materials FOR UPDATE USING (true);
CREATE POLICY "Admin delete supplementary_materials" 
    ON supplementary_materials FOR DELETE USING (true);

-- Índice para busca por categoria
CREATE INDEX IF NOT EXISTS idx_supplementary_materials_category 
    ON supplementary_materials(category_id);

-- Comentário
COMMENT ON TABLE supplementary_materials IS 'Materiais complementares (PDFs, documentos) para aulas digitais';
