-- Adicionar campos extras para clientes
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state VARCHAR(2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zipcode VARCHAR(10);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Inserir alguns clientes de exemplo se não existirem
INSERT INTO customers (name, email, cpf, phone, address, city, state, zipcode, notes) 
VALUES 
  ('João Silva', 'joao@email.com', '12345678901', '(11) 99999-1111', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567', 'Cliente VIP'),
  ('Maria Santos', 'maria@email.com', '98765432109', '(11) 88888-2222', 'Av. Paulista, 456', 'São Paulo', 'SP', '01310-100', 'Cliente frequente'),
  ('Pedro Costa', 'pedro@email.com', '11122233344', '(11) 77777-3333', 'Rua Augusta, 789', 'São Paulo', 'SP', '01305-000', 'Desconto especial')
ON CONFLICT (cpf) DO NOTHING;
