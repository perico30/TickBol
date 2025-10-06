-- init-admin-fixed.sql
-- Compatible con schema_min.sql (branding JSON y columnas image_url/link_url)

-- 1) Admin (si no existe, crear; si existe, actualizar a role=admin)
insert into public.users (email, name, role, password_hash, status)
values ('admin@miapp.com', 'Administrador', 'admin', '$2b$10$EDsTZWyhDit/90jmL9Y41uaBke4QfGG.gNBko6HSOJrYdHsnxImYa', 'active')
on conflict (email) do update
set role='admin',
    name=excluded.name,
    password_hash=excluded.password_hash,
    status='active',
    updated_at=now();

-- 2) Site config básica (branding JSON)
delete from public.site_config;
insert into public.site_config (site_name, contact_whatsapp, contact_email, branding)
values (
  'EventosDiscos',
  '+591 70000000',
  'soporte@eventosdisc.com',
  jsonb_build_object(
    'logo_url', '/logo.png',
    'tagline', 'La mejor noche, siempre',
    'footer_content', '© 2025 EventosDiscos. Todos los derechos reservados.'
  )
);

-- 3) Carrusel (image_url / link_url)
delete from public.carousel_images;
insert into public.carousel_images (image_url, title, subtitle, link_url, order_position, is_active) values
('https://images.unsplash.com/photo-1574391884720-bbc747dd27c1?w=1200&h=600&fit=crop',
 'Vive la mejor experiencia nocturna',
 'Descubre los eventos más exclusivos de Santa Cruz',
 '/eventos', 1, true),
('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=600&fit=crop',
 'Música, diversión y entretenimiento',
 'Las mejores discotecas en un solo lugar',
 '/eventos', 2, true),
('https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=600&fit=crop',
 'Tickets digitales seguros',
 'Compra tus entradas de forma rápida y segura',
 '/eventos', 3, true);
