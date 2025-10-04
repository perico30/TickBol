'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { SiteConfig } from '@/types';
import { db } from '@/lib/database';

export default function Header() {
  const { user, logout } = useAuth();
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [loading, setSiteConfigLoading] = useState(true);

  useEffect(() => {
    const loadSiteConfig = async () => {
      try {
        const config = await db.getSiteConfig();
        setSiteConfig(config);
      } catch (error) {
        console.error('Error loading site config:', error);
      } finally {
        setSiteConfigLoading(false);
      }
    };

    loadSiteConfig();
  }, []);

  const handleLogout = () => {
    logout();
  };

  // Si está cargando la configuración, mostrar header básico
  if (loading) {
    return (
      <header className="bg-blue-600 text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium">📞 78005026</div>
            <div className="text-xs">Siguenos en facebook 👆</div>
          </div>
        </div>
        <div className="bg-white text-gray-900 py-4">
          <div className="container mx-auto px-4">
            <nav className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                EventosDiscos
              </Link>
              <div className="flex items-center space-x-6">
                <Link href="/" className="hover:text-blue-600">Inicio</Link>
                <Link href="/eventos" className="hover:text-blue-600">Eventos</Link>
                <Link href="/contacto" className="hover:text-blue-600">Contacto</Link>
                <div className="animate-pulse bg-gray-300 h-8 w-20 rounded"></div>
              </div>
            </nav>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-blue-600 text-white py-2">
      {/* Top Bar */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium">
            📞 {siteConfig?.footerContent?.contactInfo?.phone || '78005026'}
          </div>
          <div className="text-xs">Siguenos en facebook 👆</div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white text-gray-900 py-4">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              {siteConfig?.logoUrl && (
                <img
                  src={siteConfig.logoUrl}
                  alt={siteConfig.siteName || 'EventosDiscos'}
                  className="h-8 w-auto"
                  onError={(e) => {
                    // Si el logo falla, ocultar
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-blue-600">
                  {siteConfig?.siteName || 'EventosDiscos'}
                </h1>
                {siteConfig?.tagline && (
                  <p className="text-xs text-blue-400">
                    {siteConfig.tagline}
                  </p>
                )}
              </div>
            </Link>

            <div className="flex items-center space-x-6">
              <Link href="/" className="hover:text-blue-600">
                Inicio
              </Link>
              <Link href="/eventos" className="hover:text-blue-600">
                Eventos
              </Link>
              <Link href="/contacto" className="hover:text-blue-600">
                Contacto
              </Link>

              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Hola, {user.name}
                  </span>

                  {/* Dashboard Links basados en rol */}
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
                    >
                      Panel Admin
                    </Link>
                  )}

                  {user.role === 'business' && (
                    <Link
                      href="/dashboard"
                      className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
                    >
                      Mi Dashboard
                    </Link>
                  )}

                  {user.role === 'porteria' && (
                    <Link
                      href="/porteria"
                      className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-700"
                    >
                      Portería
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/login"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
