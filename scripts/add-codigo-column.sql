-- Adicionar coluna codigo na tabela products
ALTER TABLE products ADD COLUMN codigo VARCHAR(20);

-- Criar índice para busca rápida por código
CREATE INDEX IF NOT EXISTS idx_products_codigo ON products(codigo);

-- Gerar códigos automáticos para produtos existentes (sequencial)
UPDATE products 
SET codigo = LPAD(ROW_NUMBER() OVER (ORDER BY id)::text, 6, '0')
WHERE codigo IS NULL;

-- Verificar os códigos gerados
SELECT id, name, codigo, barcode FROM products ORDER BY codigo;
