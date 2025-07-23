-- Adicionar colunas faltantes na tabela sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Adicionar colunas faltantes na tabela sale_items
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS product_barcode VARCHAR(50);
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;

-- Adicionar colunas faltantes na tabela stock_movements
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS previous_stock INTEGER DEFAULT 0;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS new_stock INTEGER DEFAULT 0;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS reason VARCHAR(255);
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS reference_document VARCHAR(100);

-- Atualizar registros existentes com valores padrão
UPDATE sales SET 
  status = 'completed',
  subtotal = totalAmount,
  discount = 0,
  updated_at = created_at
WHERE status IS NULL;

UPDATE sale_items SET 
  discount = 0
WHERE discount IS NULL;
