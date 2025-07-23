-- Adicionar coluna product_code na tabela sale_items se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sale_items' 
        AND column_name = 'product_code'
    ) THEN
        ALTER TABLE sale_items ADD COLUMN product_code VARCHAR(50);
        RAISE NOTICE 'Coluna product_code adicionada à tabela sale_items';
    ELSE
        RAISE NOTICE 'Coluna product_code já existe na tabela sale_items';
    END IF;
END $$;

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sale_items' 
ORDER BY ordinal_position;
