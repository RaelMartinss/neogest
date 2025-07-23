-- Criar tabelas para vendas
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY DEFAULT ('sale_' || lower(hex(randomblob(16)))),
  customer_id TEXT,
  customer_name TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'pix')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'pending')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY DEFAULT ('item_' || lower(hex(randomblob(16)))),
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_barcode TEXT,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY DEFAULT ('mov_' || lower(hex(randomblob(16)))),
  product_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
  quantity DECIMAL(10,3) NOT NULL,
  previous_stock DECIMAL(10,3) NOT NULL,
  new_stock DECIMAL(10,3) NOT NULL,
  reason TEXT,
  reference_document TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY DEFAULT ('cust_' || lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir alguns clientes de exemplo
INSERT OR IGNORE INTO customers (id, name, email, phone, document) VALUES
('cust_001', 'Cliente Padrão', 'cliente@exemplo.com', '(11) 99999-9999', '000.000.000-00'),
('cust_002', 'João Silva', 'joao@exemplo.com', '(11) 98888-8888', '111.111.111-11'),
('cust_003', 'Maria Santos', 'maria@exemplo.com', '(11) 97777-7777', '222.222.222-22'),
('cust_004', 'Pedro Oliveira', 'pedro@exemplo.com', '(11) 96666-6666', '333.333.333-33');

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
