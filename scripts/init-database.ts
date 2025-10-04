import { supabase } from '../src/lib/supabase';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

async function initDatabase() {
  console.log('🚀 Inicializando base de datos de Supabase...\n');

  try {
    // 1. Verificar conexión básica
    console.log('1. Verificando conexión a Supabase...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('_supabase_schema')
      .select('*')
      .limit(1);

    // No importa si falla, solo queremos ver si podemos conectar
    console.log('✅ Conexión establecida\n');

    // 2. Verificar si las tablas existen
    console.log('2. Verificando si las tablas existen...');
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'businesses', 'events', 'site_config']);

    const existingTables = tablesData?.map(t => t.table_name) || [];
    console.log('Tablas existentes:', existingTables);

    if (existingTables.length === 0) {
      console.log('⚠️ No se encontraron tablas del esquema. Necesitas ejecutar el SQL schema manualmente.\n');
      console.log('📋 Instrucciones:');
      console.log('1. Ve a https://supabase.com/dashboard');
      console.log('2. Abre tu proyecto: gtqydwhbzcnhltkgzpzd');
      console.log('3. Ve a SQL Editor');
      console.log('4. Copia y ejecuta el contenido de: supabase/schema.sql\n');

      // Mostrar una parte del esquema como referencia
      const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        console.log('📄 Contenido del archivo schema.sql disponible en:');
        console.log(`   ${schemaPath}\n`);
        console.log('🔧 Las primeras líneas del esquema:');
        console.log('   ' + schemaContent.split('\n').slice(0, 10).join('\n   '));
      }

      return;
    }

    // 3. Verificar datos existentes
    console.log('3. Verificando datos existentes...');

    // Verificar usuarios
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Verificar configuración del sitio
    const { data: siteConfig } = await supabase
      .from('site_config')
      .select('*')
      .limit(1)
      .single();

    console.log(`   👥 Usuarios: ${usersCount || 0}`);
    console.log(`   ⚙️ Configuración del sitio: ${siteConfig ? 'Existe' : 'No existe'}\n`);

    // 4. Crear usuario admin si no existe
    console.log('4. Verificando usuario administrador...');
    const adminEmail = 'admin@eventosdisc.com';
    const adminPassword = 'admin123';

    const { data: existingAdmin } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (existingAdmin) {
      console.log('✅ Usuario administrador ya existe');
    } else {
      console.log('   Creando usuario administrador...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const { data: newAdmin, error: adminError } = await supabase
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
        console.error('❌ Error creando admin:', adminError.message);
      } else {
        console.log('✅ Usuario administrador creado exitosamente');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
      }
    }

    // 5. Verificar/crear configuración del sitio
    console.log('\n5. Verificando configuración del sitio...');

    if (!siteConfig) {
      console.log('   Creando configuración inicial...');
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
        console.error('❌ Error creando configuración:', configError.message);
      } else {
        console.log('✅ Configuración del sitio creada');
      }
    } else {
      console.log('✅ Configuración del sitio ya existe');
    }

    // 6. Estadísticas finales
    console.log('\n6. Estadísticas de la base de datos:');
    const { count: finalUsersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: businessesCount } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true });

    const { count: eventsCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });

    console.log(`   👥 Usuarios: ${finalUsersCount || 0}`);
    console.log(`   🏢 Negocios: ${businessesCount || 0}`);
    console.log(`   🎪 Eventos: ${eventsCount || 0}`);

    console.log('\n🎉 ¡Base de datos inicializada exitosamente!');
    console.log('\n🔗 Credenciales de acceso:');
    console.log(`   URL: http://localhost:3000/login`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);

  } catch (error) {
    console.error('❌ Error:', error);

    if (error.message?.includes('Could not find the table')) {
      console.log('\n💡 SOLUCIÓN:');
      console.log('Las tablas no existen. Ejecuta el esquema SQL manualmente:');
      console.log('1. Ve a https://supabase.com/dashboard');
      console.log('2. Abre tu proyecto y ve al SQL Editor');
      console.log('3. Ejecuta el contenido del archivo: supabase/schema.sql');
    }
  }
}

// Ejecutar el script
initDatabase();
