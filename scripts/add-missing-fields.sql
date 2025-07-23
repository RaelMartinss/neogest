-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(createdAt);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
