import { supabase } from '../src/lib/supabase';

async function verifySupabase() {
  console.log('🔍 VERIFICANDO CONEXIÓN CON SUPABASE...\n');

  try {
    // 1. Test basic connection
    console.log('1. Probando conexión básica...');
    const { data, error } = await supabase
      .from('users')
      .select('email, name, role')
      .limit(5);

    if (error) {
      console.log('❌ Error de conexión:', error.message);
      return;
    }

    console.log('✅ Conexión exitosa');
    console.log(`📊 Usuarios encontrados: ${data.length}`);

    // 2. Check for admin user
    console.log('\n2. Verificando usuario admin...');
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@eventosdisc.com')
      .single();

    if (adminError) {
      console.log('❌ Usuario admin no encontrado:', adminError.message);

      // Try to create admin user
      console.log('\n3. Creando usuario admin...');
      const { data: newAdmin, error: createError } = await supabase
        .from('users')
        .insert({
          email: 'admin@eventosdisc.com',
          password_hash: '$2b$10$LBYMiwKTGSXxtxSjqjMy0eqmR3ER2MYLtOn3e1wtI0P7t99nkS8QW',
          name: 'Administrador Principal',
          role: 'admin',
          permissions: {
            canManageUsers: true,
            canManageBusinesses: true,
            canApproveEvents: true,
            canManageSiteConfig: true,
            canViewAllData: true
          }
        })
        .select()
        .single();

      if (createError) {
        console.log('❌ Error creando admin:', createError.message);
      } else {
        console.log('✅ Usuario admin creado exitosamente');
      }
    } else {
      console.log('✅ Usuario admin encontrado:', adminUser.email);
    }

    // 3. Check site config
    console.log('\n4. Verificando configuración del sitio...');
    const { data: siteConfig, error: configError } = await supabase
      .from('site_config')
      .select('*')
      .limit(1)
      .single();

    if (configError) {
      console.log('❌ Configuración del sitio no encontrada:', configError.message);
    } else {
      console.log('✅ Configuración del sitio encontrada');
    }

    // 4. Check carousel images
    console.log('\n5. Verificando imágenes del carrusel...');
    const { data: carouselImages, error: carouselError } = await supabase
      .from('carousel_images')
      .select('*')
      .eq('is_active', true);

    if (carouselError) {
      console.log('❌ Error con carrusel:', carouselError.message);
    } else {
      console.log(`✅ Imágenes del carrusel: ${carouselImages.length}`);
    }

    console.log('\n🎉 VERIFICACIÓN COMPLETADA');
    console.log('\n🔐 Credenciales para login:');
    console.log('Email: admin@eventosdisc.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('💥 Error fatal:', error);
  }
}

verifySupabase();
