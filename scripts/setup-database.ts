import { supabase } from '../src/lib/supabase';
import bcrypt from 'bcryptjs';

async function setupDatabase() {
  console.log('🚀 Configurando base de datos en Supabase...\n');

  try {
    // 1. Verificar conexión
    console.log('1. Verificando conexión a Supabase...');
    const { data: test, error: testError } = await supabase.from('site_config').select('*').limit(1);
    if (testError) {
      throw new Error(`Error de conexión: ${testError.message}`);
    }
    console.log('✅ Conexión exitosa\n');

    // 2. Crear usuario administrador inicial
    console.log('2. Creando usuario administrador...');
    const adminEmail = 'admin@eventosdisc.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Verificar si el admin ya existe
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (existingAdmin) {
      console.log('⚠️ Usuario administrador ya existe');
    } else {
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .insert({
          email: adminEmail,
          password_hash: hashedPassword,
          name: 'Administrador Principal',
          role: 'admin'
        })
        .select()
        .single();

      if (adminError) {
        throw new Error(`Error creando admin: ${adminError.message}`);
      }

      console.log('✅ Usuario administrador creado exitosamente');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}\n`);
    }

    // 3. Verificar configuración del sitio
    console.log('3. Verificando configuración del sitio...');
    const { data: siteConfig } = await supabase
      .from('site_config')
      .select('*')
      .limit(1)
      .single();

    if (!siteConfig) {
      console.log('   Creando configuración inicial del sitio...');
      const { error: configError } = await supabase
        .from('site_config')
        .insert({
          logo_url: '/logo.png',
          site_name: 'EventosDiscos',
          tagline: '# ACOMPAÑANDO LOS MEJORES EVENTOS',
          footer_content: {
            companyDescription: 'La plataforma líder para eventos de discotecas y entretenimiento nocturno en Bolivia.',
            contactInfo: {
              address: 'Av. Las Américas #123, Santa Cruz',
              email: 'soporte@eventosdisc.com',
              phone: '78005026'
            },
            socialLinks: {
              facebook: 'https://facebook.com/eventosdisc',
              instagram: 'https://instagram.com/eventosdisc'
            }
          }
        });

      if (configError) {
        throw new Error(`Error creando configuración: ${configError.message}`);
      }
    }
    console.log('✅ Configuración del sitio verificada\n');

    // 4. Mostrar estadísticas
    console.log('4. Estadísticas de la base de datos:');

    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: businessesCount } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true });

    const { count: eventsCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });

    console.log(`   👥 Usuarios: ${usersCount || 0}`);
    console.log(`   🏢 Negocios: ${businessesCount || 0}`);
    console.log(`   🎪 Eventos: ${eventsCount || 0}\n`);

    console.log('🎉 ¡Base de datos configurada exitosamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Accede con las credenciales de admin');
    console.log('   2. Configura el sitio desde /admin/site-config');
    console.log('   3. Agrega imágenes al carrusel desde /admin/carousel');
    console.log('   4. Registra negocios desde /admin/businesses');
    console.log('\n🔗 Acceso:');
    console.log(`   URL: http://localhost:3000/login`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);

  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar el script
setupDatabase();
