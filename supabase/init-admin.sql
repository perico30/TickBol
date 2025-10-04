-- ====================================================
-- INICIALIZACIÓN DE EVENTOSDISC - CREAR ADMIN INICIAL
-- ====================================================

-- Crear usuario administrador inicial
INSERT INTO users (email, password_hash, name, role, permissions)
VALUES (
  'admin@eventosdisc.com',
  -- Hash de 'admin123' con bcrypt (generado)
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
) ON CONFLICT (email) DO NOTHING;

-- Verificar configuración del sitio
INSERT INTO site_config (logo_url, site_name, tagline, footer_content)
VALUES (
  '/logo.png',
  'EventosDiscos',
  '# ACOMPAÑANDO LOS MEJORES EVENTOS',
  '{
    "companyDescription": "La plataforma líder para eventos de discotecas y entretenimiento nocturno en Bolivia.",
    "contactInfo": {
      "address": "Av. Las Américas #123, Santa Cruz",
      "email": "soporte@eventosdisc.com",
      "phone": "78005026"
    },
    "socialLinks": {
      "facebook": "https://facebook.com/eventosdisc",
      "instagram": "https://instagram.com/eventosdisc"
    }
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Crear algunas imágenes del carrusel por defecto
INSERT INTO carousel_images (url, title, subtitle, link, order_position, is_active) VALUES
(
  'https://images.unsplash.com/photo-1574391884720-bbc747dd27c1?w=1200&h=600&fit=crop',
  'Vive la mejor experiencia nocturna',
  'Descubre los eventos más exclusivos de Santa Cruz',
  '/eventos',
  1,
  true
),
(
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=600&fit=crop',
  'Música, diversión y entretenimiento',
  'Las mejores discotecas en un solo lugar',
  '/eventos',
  2,
  true
),
(
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=600&fit=crop',
  'Tickets digitales seguros',
  'Compra tus entradas de forma rápida y segura',
  '/eventos',
  3,
  true
) ON CONFLICT DO NOTHING;

-- Verificar inserción
SELECT 'Usuario admin creado:' as status, email, name, role FROM users WHERE email = 'admin@eventosdisc.com';
SELECT 'Configuración del sitio:' as status, site_name, tagline FROM site_config LIMIT 1;
SELECT 'Imágenes del carrusel:' as status, COUNT(*) as total FROM carousel_images WHERE is_active = true;

-- Mensaje final
SELECT '✅ ¡INICIALIZACIÓN COMPLETADA!
🔐 Credenciales de acceso:
📧 Email: admin@eventosdisc.com
🔑 Password: admin123
🌐 URL: http://localhost:3000/login' as mensaje_final;
