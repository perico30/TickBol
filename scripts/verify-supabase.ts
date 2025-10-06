#!/usr/bin/env bun

import { supabase } from '../src/lib/supabase';
import { db } from '../src/lib/database';

console.log('🔍 Verificando estado de Supabase...\n');

async function verifyAndSetup() {
  try {
    // 1. Verificar conexión
    console.log('1. Verificando conexión a Supabase...');
    const { data: connection, error: connectionError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('❌ Error de conexión:', connectionError.message);
      if (connectionError.message.includes('relation "users" does not exist')) {
        console.log('\n🚨 LAS TABLAS NO EXISTEN EN SUPABASE');
        console.log('📋 Necesitas ejecutar el esquema SQL:');
        console.log('   1. Ve a https://supabase.com/dashboard');
        console.log('   2. Abre tu proyecto: gtqydwhbzcnhltkgzpzd');
        console.log('   3. Ve a SQL Editor');
        console.log('   4. Copia y ejecuta TODO el contenido de: supabase/schema.sql');
        return;
      }
      return;
    }

    console.log('✅ Conexión establecida');

    // 2. Verificar si existe usuario admin
    console.log('\n2. Verificando usuario administrador...');
    const adminUser = await db.authenticateUser('admin@eventosdisc.com', 'admin123');

    if (adminUser) {
      console.log('✅ Usuario admin encontrado:', adminUser.email);
      console.log('🎉 SISTEMA LISTO PARA USAR!');
      console.log('\n📋 Credenciales de acceso:');
      console.log('   Email: admin@eventosdisc.com');
      console.log('   Password: admin123');
      console.log('   URL: http://localhost:3000/login');
    } else {
      console.log('⚠️ Usuario admin no encontrado, creándolo...');

      // 3. Crear usuario admin
      const newAdmin = await db.addUser({
        email: 'admin@eventosdisc.com',
        password: 'admin123',
        name: 'Administrador Principal',
        role: 'admin'
      });

      if (newAdmin) {
        console.log('✅ Usuario admin creado exitosamente!');
        console.log('🎉 SISTEMA COMPLETAMENTE CONFIGURADO!');
        console.log('\n📋 Credenciales de acceso:');
        console.log('   Email: admin@eventosdisc.com');
        console.log('   Password: admin123');
        console.log('   URL: http://localhost:3000/login');
      } else {
        console.error('❌ Error creando usuario admin');
      }
    }

    // 4. Verificar otras tablas importantes
    console.log('\n3. Verificando estructura de base de datos...');

    const { count: businessesCount } = await supabase.from('businesses').select('*', { count: 'exact', head: true });
    const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
    const { count: siteConfigCount } = await supabase.from('site_config').select('*', { count: 'exact', head: true });

    console.log(`✅ Tabla businesses: ${businessesCount || 0} registros`);
    console.log(`✅ Tabla events: ${eventsCount || 0} registros`);
    console.log(`✅ Tabla site_config: ${siteConfigCount || 0} registros`);

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

verifyAndSetup();
