-- Adicionar novas colunas na tabela payments_card para melhor rastreabilidade
-- Execute este script no seu banco de dados PostgreSQL

-- Adicionar coluna para email do pagador
ALTER TABLE payments_card ADD COLUMN IF NOT EXISTS email_pagador VARCHAR(255);

-- Adicionar coluna para número de parcelas
ALTER TABLE payments_card ADD COLUMN IF NOT EXISTS parcelas INTEGER DEFAULT 1;

-- Adicionar coluna para status detalhado do MercadoPago
ALTER TABLE payments_card ADD COLUMN IF NOT EXISTS status_detail VARCHAR(255);

-- Adicionar coluna para status da rede (falha de comunicação, fraude, etc.)
ALTER TABLE payments_card ADD COLUMN IF NOT EXISTS network_status VARCHAR(100);

-- Adicionar coluna para data de criação (se não existir)
ALTER TABLE payments_card ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Adicionar coluna para data de atualização (se não existir)
ALTER TABLE payments_card ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Criar índice para melhor performance em consultas
CREATE INDEX IF NOT EXISTS idx_payments_card_status ON payments_card(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_payments_card_created_at ON payments_card(created_at);

-- Comentários para documentação
COMMENT ON COLUMN payments_card.email_pagador IS 'Email do pagador para rastreabilidade';
COMMENT ON COLUMN payments_card.parcelas IS 'Número de parcelas do pagamento';
COMMENT ON COLUMN payments_card.status_detail IS 'Detalhes do status do MercadoPago';
COMMENT ON COLUMN payments_card.network_status IS 'Status da rede (aprovado, rejeitado, etc.)';

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments_card' 
ORDER BY ordinal_position; 