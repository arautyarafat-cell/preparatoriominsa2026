
console.log(`
================================================================
ATENÇÃO: CONFIGURAÇÃO DE BANCO DE DADOS NECESSÁRIA (PAGAMENTOS)
================================================================

Para que as alterações de métodos de pagamento sejam salvas, você precisa criar a tabela 'payment_methods' no seu banco de dados Supabase.

1. Acesse o Painel do Supabase (SQL Editor).
2. Execute o seguinte código SQL:

----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Segurança)
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública (para que usuários vejam na tela de pagamento)
CREATE POLICY "Public read payment methods" ON public.payment_methods
    FOR SELECT USING (true);

-- Permitir gerenciamento total (por enquanto aberto, mas deve ser restrito a admin em produção)
CREATE POLICY "Admins manage payment methods" ON public.payment_methods
    FOR ALL USING (true);

-- INSERIR DADOS PADRÃO (Opcional, se a tabela estiver vazia)
INSERT INTO public.payment_methods (id, type, name, enabled, details)
VALUES 
    ('1', 'reference', 'Pagamento por Referência', true, '{"entity": "00000", "reference": "123 456 789", "beneficiary": "Angola Saúde Prep"}'),
    ('2', 'qrcode', 'Multicaixa Express (QR Code)', true, '{}'),
    ('4', 'transfer', 'Transferência Bancária', true, '{"bank": "Banco BAI", "iban": "AO06 0000 0000 0000 0000 0000 0", "beneficiary": "Angola Saúde Prep"}'),
    ('5', 'unitel', 'Unitel Money', true, '{"phoneNumber": "920 000 000", "entityName": "Angola Saúde"}')
ON CONFLICT (id) DO NOTHING;
----------------------------------------------------------------

Sem isso, o botão "Salvar" no painel Admin mostrará um erro ou não persistirá os dados.
================================================================
`);
