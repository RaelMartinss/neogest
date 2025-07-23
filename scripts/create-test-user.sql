-- Verificar se existem usuários
SELECT 'users' as table_name, COUNT(*) as count FROM users;

-- Verificar usuários existentes
SELECT id, name, email, role, "isActive" FROM users ORDER BY name;

-- Criar usuário de teste se não existir
INSERT INTO users (
  id,
  name,
  email,
  password,
  role,
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'admin-test',
  'Administrador',
  'admin@example.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Verificar novamente após inserção
SELECT id, name, email, role, "isActive" FROM users ORDER BY name; 