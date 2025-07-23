-- Debug: Verificar produtos de bebidas
SELECT 
  'Produtos de Bebidas' as info,
  COUNT(*) as total
FROM products p
LEFT JOIN categories c ON p."categoryId" = c.id
WHERE c.name = 'Bebidas';

-- Debug: Verificar todos os produtos com suas categorias
SELECT 
  p.id,
  p.name,
  p.codigo,
  c.id as category_id,
  c.name as category_name,
  p."categoryId" as product_category_id
FROM products p
LEFT JOIN categories c ON p."categoryId" = c.id
ORDER BY c.name, p.name;

-- Debug: Verificar categorias disponíveis
SELECT id, name FROM categories ORDER BY name;

-- Debug: Verificar se há produtos sem categoria
SELECT 
  p.id,
  p.name,
  p."categoryId"
FROM products p
WHERE p."categoryId" IS NULL;

-- Inserir produtos de bebidas se não existirem
INSERT INTO products (
  id,
  name,
  description,
  barcode,
  "categoryId",
  "supplierId",
  "stockQuantity",
  "minStock",
  "maxStock",
  "costPrice",
  "salePrice",
  "isActive",
  status,
  codigo,
  "createdAt",
  "updatedAt"
) VALUES 
('bebida_001', 'Coca-Cola 350ml', 'Refrigerante Coca-Cola lata 350ml', '7894900011517', 'cmbe6d8z70000csy4ul6a4pfy', 'cmbe6dbwz0004csy4rsv3x78c', 50, 10, 100, 2.50, 4.50, true, 'NORMAL', 'BEB001', NOW(), NOW()),
('bebida_002', 'Pepsi 350ml', 'Refrigerante Pepsi lata 350ml', '7891234567890', 'cmbe6d8z70000csy4ul6a4pfy', 'cmbe6dbwz0004csy4rsv3x78c', 30, 10, 100, 2.30, 4.20, true, 'NORMAL', 'BEB002', NOW(), NOW()),
('bebida_003', 'Água Mineral 500ml', 'Água mineral natural 500ml', '7891000123456', 'cmbe6d8z70000csy4ul6a4pfy', 'cmbe6dcxj0005csy4vnfdpw6j', 80, 20, 150, 1.00, 2.00, true, 'NORMAL', 'BEB003', NOW(), NOW()),
('bebida_004', 'Suco de Laranja 1L', 'Suco de laranja natural 1 litro', '7891234567891', 'cmbe6d8z70000csy4ul6a4pfy', 'cmbe6ddkb0006csy4rsnssic5', 25, 5, 50, 3.50, 5.90, true, 'NORMAL', 'BEB004', NOW(), NOW()),
('bebida_005', 'Guaraná 350ml', 'Refrigerante Guaraná lata 350ml', '7891234567892', 'cmbe6d8z70000csy4ul6a4pfy', 'cmbe6dbwz0004csy4rsv3x78c', 40, 10, 80, 2.20, 4.00, true, 'NORMAL', 'BEB005', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Verificar novamente após inserção
SELECT 
  'Produtos de Bebidas após inserção' as info,
  COUNT(*) as total
FROM products p
LEFT JOIN categories c ON p."categoryId" = c.id
WHERE c.name = 'Bebidas'; 