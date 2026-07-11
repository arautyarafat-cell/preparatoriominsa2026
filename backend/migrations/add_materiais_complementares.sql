-- Adiciona coluna materiais_complementares à tabela lessons
-- Esta coluna armazena um array de IDs de materiais complementares

ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS materiais_complementares TEXT[] DEFAULT '{}';

-- Comentário para documentação
COMMENT ON COLUMN lessons.materiais_complementares IS 'Array de IDs de materiais complementares anexados a esta aula';
