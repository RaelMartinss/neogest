-- Inserir categorias de exemplo
INSERT INTO categories (id, name, "createdAt", "updatedAt") VALUES
(1, 'Bebidas', NOW(), NOW()),
(2, 'Padaria', NOW(), NOW()),
(3, 'Laticínios', NOW(), NOW()),
(4, 'Grãos', NOW(), NOW()),
(5, 'Limpeza', NOW(), NOW()),
(6, 'Higiene', NOW(), NOW()),
(7, 'Congelados', NOW(), NOW()),
(8, 'Enlatados', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Inserir fornecedores de exemplo
INSERT INTO suppliers (id, name, "createdAt", "updatedAt") VALUES
(1, 'Coca-Cola', NOW(), NOW()),
(2, 'Água Mineral', NOW(), NOW()),
(3, 'Padaria Central', NOW(), NOW()),
(4, 'Laticínios Unidos', NOW(), NOW()),
(5, 'Distribuidora de Grãos', NOW(), NOW()),
(6, 'Produtos de Limpeza Ltda', NOW(), NOW()),
(7, 'Fornecedor Geral', NOW(), NOW()),
(8, 'Importadora ABC', NOW(), NOW())
ON CONFLICT (id) DO NOTHING; 