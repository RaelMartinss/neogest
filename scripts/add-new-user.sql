-- Adicionar novo usuário: raelmartins@gmail.com
INSERT INTO users (
  name, 
  email, 
  password, 
  role, 
  is_active, 
  created_at, 
  updated_at
) VALUES (
  'Rael Martins',
  'raelmartins@gmail.com',
  '$2a$12$1InE3Tg5JdQo3YOvUYlHOOt6HWWlPpsAboXLZMnZLYEA5TqjPKnK6', -- Hash para 'trote@123'
  'admin',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Verificar se o usuário foi criado
SELECT id, name, email, role, is_active, created_at 
FROM users 
WHERE email = 'raelmartins@gmail.com';
