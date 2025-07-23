-- Verificar dados nas tabelas de categorias e fornecedores
SELECT 'categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'suppliers' as table_name, COUNT(*) as count FROM suppliers;

-- Verificar dados específicos
SELECT 'categories' as table_name, id, name FROM categories ORDER BY name;
SELECT 'suppliers' as table_name, id, name FROM suppliers ORDER BY name;

-- Verificar produtos e suas relações
SELECT 
  p.id,
  p.name,
  p."categoryId",
  c.name as category_name,
  p."supplierId",
  s.name as supplier_name
FROM products p
LEFT JOIN categories c ON p."categoryId" = c.id
LEFT JOIN suppliers s ON p."supplierId" = s.id
LIMIT 10; 