-- Inserir produtos para teste do PDV
INSERT INTO products (
  name, description, barcode, category_id, supplier_id, 
  cost_price, sale_price, stock_quantity, min_stock, max_stock, 
  unit, is_active, status, created_at, updated_at
) VALUES 
-- Bebidas
('Coca-Cola 350ml', 'Refrigerante Coca-Cola lata 350ml', '7894900011517', 1, 1, 2.50, 4.50, 50, 10, 100, 'UN', true, 'NORMAL', NOW(), NOW()),
('Pepsi 350ml', 'Refrigerante Pepsi lata 350ml', '7891234567890', 1, 1, 2.30, 4.20, 30, 10, 100, 'UN', true, 'NORMAL', NOW(), NOW()),
('Água Mineral 500ml', 'Água mineral natural 500ml', '7891000123456', 1, 2, 1.00, 2.00, 80, 20, 150, 'UN', true, 'NORMAL', NOW(), NOW()),

-- Padaria
('Pão Francês', 'Pão francês tradicional', '1234567890123', 2, 3, 0.30, 0.60, 100, 50, 200, 'UN', true, 'NORMAL', NOW(), NOW()),
('Pão de Açúcar 500g', 'Pão de açúcar tradicional 500g', '7891234567891', 2, 3, 2.00, 3.50, 25, 10, 50, 'UN', true, 'NORMAL', NOW(), NOW()),

-- Laticínios
('Leite Integral 1L', 'Leite integral UHT 1 litro', '7891234567892', 3, 4, 3.80, 5.80, 40, 15, 80, 'UN', true, 'NORMAL', NOW(), NOW()),
('Queijo Mussarela', 'Queijo mussarela fatiado 200g', '7891234567893', 3, 4, 8.50, 12.90, 20, 5, 40, 'UN', true, 'NORMAL', NOW(), NOW()),

-- Grãos
('Arroz Branco 5kg', 'Arroz branco tipo 1 pacote 5kg', '7891234567894', 4, 5, 12.50, 18.90, 30, 10, 50, 'UN', true, 'NORMAL', NOW(), NOW()),
('Feijão Preto 1kg', 'Feijão preto tipo 1 pacote 1kg', '7891234567895', 4, 5, 6.80, 9.50, 25, 8, 40, 'UN', true, 'NORMAL', NOW(), NOW()),
('Açúcar Cristal 1kg', 'Açúcar cristal refinado 1kg', '7891234567896', 4, 5, 3.20, 4.80, 35, 12, 60, 'UN', true, 'NORMAL', NOW(), NOW()),

-- Limpeza
('Detergente 500ml', 'Detergente líquido neutro 500ml', '7891234567897', 5, 6, 1.80, 2.90, 40, 15, 80, 'UN', true, 'NORMAL', NOW(), NOW()),
('Sabão em Pó 1kg', 'Sabão em pó concentrado 1kg', '7891234567898', 5, 6, 8.50, 12.90, 15, 10, 30, 'UN', true, 'NORMAL', NOW(), NOW()),

-- Produtos com estoque baixo para teste
('Chocolate Barra', 'Chocolate ao leite 90g', '7891234567899', 8, 7, 3.50, 5.90, 3, 10, 50, 'UN', true, 'LOW', NOW(), NOW()),

-- Produto sem estoque para teste
('Biscoito Recheado', 'Biscoito recheado chocolate 140g', '7891234567800', 8, 7, 2.80, 4.50, 0, 5, 30, 'UN', true, 'OUT_OF_STOCK', NOW(), NOW());

-- Inserir categorias se não existirem
INSERT INTO categories (id, name, description) VALUES 
(1, 'Bebidas', 'Refrigerantes, sucos e águas'),
(2, 'Padaria', 'Pães, bolos e produtos de padaria'),
(3, 'Laticínios', 'Leites, queijos e derivados'),
(4, 'Grãos', 'Arroz, feijão e cereais'),
(5, 'Limpeza', 'Produtos de limpeza e higiene'),
(6, 'Carnes', 'Carnes bovinas, suínas e aves'),
(7, 'Hortifruti', 'Frutas, verduras e legumes'),
(8, 'Doces', 'Chocolates, balas e sobremesas')
ON CONFLICT (id) DO NOTHING;

-- Inserir fornecedores se não existirem
INSERT INTO suppliers (id, name, email, phone, cnpj) VALUES 
(1, 'Coca-Cola Brasil', 'vendas@cocacola.com.br', '(11) 3000-1000', '45.997.418/0001-53'),
(2, 'Distribuidora Águas', 'contato@aguas.com.br', '(11) 3000-2000', '12.345.678/0001-90'),
(3, 'Padaria Central', 'contato@padariacentral.com.br', '(11) 3000-3000', '98.765.432/0001-10'),
(4, 'Laticínios Vale', 'vendas@laticiniosvale.com.br', '(11) 3000-4000', '11.222.333/0001-44'),
(5, 'Grãos do Sul', 'comercial@graosul.com.br', '(11) 3000-5000', '55.666.777/0001-88'),
(6, 'Distribuidora ABC', 'vendas@distabcd.com.br', '(11) 3000-6000', '77.888.999/0001-22'),
(7, 'Doces & Cia', 'vendas@docesecia.com.br', '(11) 3000-7000', '33.444.555/0001-66')
ON CONFLICT (id) DO NOTHING;
