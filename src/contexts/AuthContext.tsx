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
    // Verificar sesión inicial
    const initializeAuth = async () => {
      try {
        // Obtener sesión actual de Supabase
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Si hay sesión de Supabase, cargar datos del usuario desde nuestra base de datos
          await loadUserFromDatabase(session.user);
        } else {
          // Fallback: verificar localStorage para compatibilidad
          await checkStoredUser();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        await checkStoredUser(); // Fallback a método anterior
      } finally {
        setLoading(false);
      }
    };

    // Escuchar cambios de autenticación de Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserFromDatabase(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('eventosdisc-user');
        }
      }
    );

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Cargar datos del usuario desde nuestra base de datos usando el email de Supabase
  const loadUserFromDatabase = async (supabaseUser: SupabaseUser) => {
    try {
      const userData = await db.getUserByEmail(supabaseUser.email!);

      if (userData) {
        setUser(userData);
        // Sincronizar con localStorage para compatibilidad
        localStorage.setItem('eventosdisc-user', JSON.stringify({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          businessId: userData.businessId
        }));
      } else {
        console.warn('Usuario no encontrado en base de datos:', supabaseUser.email);
        // Opcionalmente crear usuario automáticamente
        await handleMissingUser(supabaseUser);
      }
    } catch (error) {
      console.error('Error loading user from database:', error);
    }
  };

  // Manejar usuarios que existen en Supabase pero no en nuestra BD
  const handleMissingUser = async (supabaseUser: SupabaseUser) => {
    try {
      // Crear usuario automáticamente con rol customer
      const newUser = await db.addUser({
        email: supabaseUser.email!,
        password: 'supabase-managed', // Placeholder ya que Supabase maneja la contraseña
        name: supabaseUser.user_metadata?.name || supabaseUser.email!.split('@')[0],
        role: 'customer'
      });

      if (newUser) {
        setUser(newUser);
        localStorage.setItem('eventosdisc-user', JSON.stringify({
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          businessId: newUser.businessId
        }));
      }
    } catch (error) {
      console.error('Error creating missing user:', error);
    }
  };

  // Verificar usuario almacenado (fallback para compatibilidad)
  const checkStoredUser = async () => {
    try {
      const storedUser = localStorage.getItem('eventosdisc-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        // Verificar que el usuario aún existe en la base de datos
        const currentUser = await db.getUserById(userData.id);
        if (currentUser) {
          setUser(currentUser);
        } else {
          // Usuario no existe, limpiar localStorage
          localStorage.removeItem('eventosdisc-user');
        }
      }
    } catch (error) {
      console.error('Error checking stored user:', error);
      localStorage.removeItem('eventosdisc-user');
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Intentar login con Supabase Auth primero
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('Supabase auth failed, falling back to custom auth:', error.message);

        // Fallback: usar autenticación custom
        return await customLogin(email, password);
      }

      if (data.user) {
        // El usuario se cargará automáticamente por el listener onAuthStateChange
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in login:', error);
      // Fallback: usar autenticación custom
      return await customLogin(email, password);
    }
  };

  // Método de login custom para compatibilidad
  const customLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const authenticatedUser = await db.authenticateUser(email, password);

      if (authenticatedUser) {
        setUser(authenticatedUser);
        localStorage.setItem('eventosdisc-user', JSON.stringify({
          id: authenticatedUser.id,
          email: authenticatedUser.email,
          name: authenticatedUser.name,
          role: authenticatedUser.role,
          businessId: authenticatedUser.businessId
        }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in custom login:', error);
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
    try {
      // Cerrar sesión en Supabase Auth
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out from Supabase:', error);
    }

    // Limpiar estado local
    setUser(null);
    localStorage.removeItem('eventosdisc-user');
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
