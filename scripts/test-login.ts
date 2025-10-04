import { supabase } from '../src/lib/supabase';
import { db } from '../src/lib/database';
import bcrypt from 'bcryptjs';

async function testAuthentication() {
  console.log('🔐 TESTING COMPLETE AUTHENTICATION FLOW\n');

  const email = 'admin@eventosdisc.com';
  const password = 'admin123';

  try {
    // 1. Test direct database access
    console.log('1. 🔍 Testing direct database access...');

    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, name, role')
        .limit(5);

      if (error) {
        console.log('   ❌ Database access error:', error.message);
      } else {
        console.log('   ✅ Database accessible, users found:', users.length);
        if (users.length > 0) {
          console.log('   📋 Sample users:');
          users.forEach(u => console.log(`     - ${u.email} (${u.role})`));
        }
      }
    } catch (err) {
      console.log('   ❌ Database connection failed:', err);
    }

    // 2. Test finding admin user
    console.log('\n2. 👤 Testing admin user lookup...');

    try {
      const { data: adminUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.log('   ❌ Admin user lookup error:', error.message);
      } else if (adminUser) {
        console.log('   ✅ Admin user found:');
        console.log('     - ID:', adminUser.id);
        console.log('     - Email:', adminUser.email);
        console.log('     - Name:', adminUser.name);
        console.log('     - Role:', adminUser.role);

        // 3. Test password verification
        console.log('\n3. 🔑 Testing password verification...');

        const isValidPassword = await bcrypt.compare(password, adminUser.password_hash);
        console.log('   Password matches:', isValidPassword ? '✅ Yes' : '❌ No');

        if (isValidPassword) {
          console.log('   🎉 Manual authentication would succeed!');
        }
      } else {
        console.log('   ❌ Admin user not found');
      }
    } catch (err) {
      console.log('   ❌ Admin user lookup failed:', err);
    }

    // 4. Test using our database wrapper
    console.log('\n4. 🔄 Testing database wrapper authentication...');

    try {
      const authenticatedUser = await db.authenticateUser(email, password);

      if (authenticatedUser) {
        console.log('   ✅ Database wrapper authentication succeeded!');
        console.log('     - User:', authenticatedUser.name);
        console.log('     - Role:', authenticatedUser.role);
      } else {
        console.log('   ❌ Database wrapper authentication failed');
      }
    } catch (err) {
      console.log('   ❌ Database wrapper error:', err);
    }

    // 5. Test Supabase Auth
    console.log('\n5. 🔐 Testing Supabase Auth...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.log('   ❌ Supabase Auth error:', error.message);
      } else if (data.user) {
        console.log('   ✅ Supabase Auth succeeded!');
        console.log('     - User ID:', data.user.id);
        console.log('     - Email:', data.user.email);

        // Sign out immediately
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.log('   ❌ Supabase Auth failed:', err);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
console.log('Starting authentication test...\n');
testAuthentication()
  .then(() => {
    console.log('\n🏁 Authentication test completed!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Test crashed:', err);
    process.exit(1);
  });
