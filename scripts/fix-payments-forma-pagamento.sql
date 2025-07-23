-- Corrigir tamanho do campo forma_pagamento na tabela payments
-- O campo atual tem limite de 10 caracteres, mas precisamos de pelo menos 20 para "CREDIT_CARD" e "DEBIT_CARD"

ALTER TABLE payments 
  ALTER COLUMN forma_pagamento TYPE VARCHAR(20);

-- Verificar se a alteração foi aplicada
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
  AND column_name = 'forma_pagamento'; 