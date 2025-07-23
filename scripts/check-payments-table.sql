-- Verificar estrutura da tabela payments
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- Verificar se a tabela existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'payments'; 