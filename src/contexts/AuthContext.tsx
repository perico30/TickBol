'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '@/types';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/database';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inicialización simplificada - solo verificar localStorage
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        await checkStoredUser();
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);



  // Verificar usuario almacenado para persistencia de sesión
  const checkStoredUser = async () => {
    try {
      console.log('🔍 Checking stored user session...');

      const storedUser = localStorage.getItem('eventosdisc-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        console.log('📦 Found stored user:', userData.email);

        // Verificar que el usuario aún existe en la base de datos
        const currentUser = await db.getUserById(userData.id);
        if (currentUser) {
          console.log('✅ User session restored for:', currentUser.email);
          setUser(currentUser);
        } else {
          console.log('⚠️ Stored user no longer exists in database, clearing session');
          localStorage.removeItem('eventosdisc-user');
        }
      } else {
        console.log('📭 No stored user session found');
      }
    } catch (error) {
      console.error('❌ Error checking stored user:', error);
      localStorage.removeItem('eventosdisc-user');
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Attempting login for:', email);

      // Usar directamente nuestra autenticación custom que es más confiable
      const authenticatedUser = await db.authenticateUser(email, password);

      if (authenticatedUser) {
        console.log('✅ Login successful for user:', authenticatedUser.email);

        // Establecer usuario inmediatamente
        setUser(authenticatedUser);

        // Guardar en localStorage para persistencia
        localStorage.setItem('eventosdisc-user', JSON.stringify({
          id: authenticatedUser.id,
          email: authenticatedUser.email,
          name: authenticatedUser.name,
          role: authenticatedUser.role,
          businessId: authenticatedUser.businessId
        }));

        return true;
      } else {
        console.log('❌ Invalid credentials for:', email);
        return false;
      }
    } catch (error) {
      console.error('❌ Exception during login:', error);
      return false;
    }
  };



  const signup = async (email: string, password: string, name: string, role: User['role'] = 'customer'): Promise<boolean> => {
    try {
      // Primero crear en nuestra base de datos
      const newUser = await db.addUser({
        email,
        password,
        name,
        role
      });

      if (!newUser) {
        return false;
      }

      // Luego crear en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            role: role
          }
        }
      });

      if (error) {
        console.log('Supabase signup failed, but user created in DB:', error.message);
        // Aún así consideramos exitoso si se creó en nuestra BD
      }

      // Establecer usuario inmediatamente
      setUser(newUser);
      localStorage.setItem('eventosdisc-user', JSON.stringify({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        businessId: newUser.businessId
      }));

      return true;
    } catch (error) {
      console.error('Error in signup:', error);
      return false;
    }
  };

  const logout = async () => {
    console.log('🔓 Logging out user...');

    // Limpiar estado inmediatamente
    setUser(null);
    localStorage.removeItem('eventosdisc-user');

    console.log('✅ Logout completed');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    signup
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
