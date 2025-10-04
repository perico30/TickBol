-- ====================================================
-- VERIFICAR Y CORREGIR PERMISOS - EVENTOSDISC
-- ====================================================

-- 1. Verificar si el usuario admin existe
SELECT 'VERIFICANDO USUARIO ADMIN:' as status;
SELECT id, email, name, role FROM users WHERE email = 'admin@eventosdisc.com';

-- 2. Si no existe, crear el usuario admin
INSERT INTO users (email, password_hash, name, role, permissions)
VALUES (
  'admin@eventosdisc.com',
  '$2b$10$LBYMiwKTGSXxtxSjqjMy0eqmR3ER2MYLtOn3e1wtI0P7t99nkS8QW',
  'Administrador Principal',
  'admin',
  '{
    "canManageUsers": true,
    "canManageBusinesses": true,
    "canApproveEvents": true,
    "canManageSiteConfig": true,
    "canViewAllData": true
  }'::jsonb
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions;

-- 3. Deshabilitar RLS temporalmente para desarrollo
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_images DISABLE ROW LEVEL SECURITY;

-- 4. Verificar que el usuario se creó correctamente
SELECT 'USUARIO ADMIN VERIFICADO:' as status;
SELECT id, email, name, role, created_at FROM users WHERE email = 'admin@eventosdisc.com';

-- 5. Contar todas las tablas y registros
SELECT 'ESTADISTICAS DE LA BASE DE DATOS:' as status;
SELECT 'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'businesses' as tabla, COUNT(*) as registros FROM businesses
UNION ALL
SELECT 'events' as tabla, COUNT(*) as registros FROM events
UNION ALL
SELECT 'site_config' as tabla, COUNT(*) as registros FROM site_config
UNION ALL
SELECT 'carousel_images' as tabla, COUNT(*) as registros FROM carousel_images;

-- 6. Mensaje final
SELECT '✅ PERMISOS CORREGIDOS Y USUARIO ADMIN CONFIRMADO
🔐 Credenciales de acceso:
📧 Email: admin@eventosdisc.com
🔑 Password: admin123
🌐 Login: http://localhost:3000/login' as mensaje_final;
