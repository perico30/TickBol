'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SiteConfig } from '@/types';
import { db } from '@/lib/database';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function SiteConfigPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/');
      return;
    }

    const config = db.getSiteConfig();
    setSiteConfig(config);
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteConfig) return;

    setLoading(true);

    try {
      db.updateSiteConfig(siteConfig);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Recargar para aplicar cambios
      window.location.reload();
    } catch (error) {
      console.error('Error updating site config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    if (!siteConfig) return;

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSiteConfig(prev => {
        if (!prev) return prev;

        if (parent === 'contactInfo') {
          return {
            ...prev,
            footerContent: {
              ...prev.footerContent,
              contactInfo: {
                ...prev.footerContent.contactInfo,
                [child]: value
              }
            }
          };
        }

        if (parent === 'socialLinks') {
          return {
            ...prev,
            footerContent: {
              ...prev.footerContent,
              socialLinks: {
                ...prev.footerContent.socialLinks,
                [child]: value
              }
            }
          };
        }

        return prev;
      });
    } else {
      if (field === 'companyDescription') {
        setSiteConfig(prev => prev ? ({
          ...prev,
          footerContent: {
            ...prev.footerContent,
            companyDescription: value
          }
        }) : prev);
      } else {
        setSiteConfig(prev => prev ? ({ ...prev, [field]: value }) : prev);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando configuración...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || user.role !== 'admin' || !siteConfig) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Volver al Panel Admin
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Configuración del Sitio</h1>
            <p className="text-gray-600 mt-1">Personaliza la apariencia y contenido del sitio web</p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              ✅ Configuración guardada exitosamente
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Site Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>
                  Configura el nombre del sitio y el logo principal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="siteName">Nombre del Sitio</Label>
                  <Input
                    id="siteName"
                    value={siteConfig.siteName}
                    onChange={(e) => handleChange('siteName', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="tagline">Eslogan</Label>
                  <Input
                    id="tagline"
                    value={siteConfig.tagline}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                    placeholder="# ACOMPAÑANDO LOS MEJORES EVENTOS"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="logoUrl">URL del Logo</Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    value={siteConfig.logoUrl}
                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                    placeholder="https://ejemplo.com/logo.png"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Sube tu logo a un servicio como Imgur o usa una URL directa
                  </p>

                  {siteConfig.logoUrl && siteConfig.logoUrl !== '/logo.png' && (
                    <div className="mt-3 p-4 bg-gray-100 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Vista previa:</p>
                      <Image
                        src={siteConfig.logoUrl}
                        alt="Logo preview"
                        width={200}
                        height={60}
                        className="h-12 w-auto"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Footer Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Pie de Página</CardTitle>
                <CardDescription>
                  Edita la información que aparece en el footer del sitio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyDescription">Descripción de la Empresa</Label>
                  <Textarea
                    id="companyDescription"
                    value={siteConfig.footerContent.companyDescription}
                    onChange={(e) => handleChange('companyDescription', e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={siteConfig.footerContent.contactInfo.address}
                      onChange={(e) => handleChange('contactInfo.address', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={siteConfig.footerContent.contactInfo.email}
                      onChange={(e) => handleChange('contactInfo.email', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={siteConfig.footerContent.contactInfo.phone}
                    onChange={(e) => handleChange('contactInfo.phone', e.target.value)}
                    placeholder="78005026"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle>Redes Sociales</CardTitle>
                <CardDescription>
                  Enlaces a las redes sociales de la empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    type="url"
                    value={siteConfig.footerContent.socialLinks.facebook || ''}
                    onChange={(e) => handleChange('socialLinks.facebook', e.target.value)}
                    placeholder="https://facebook.com/tu-pagina"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    type="url"
                    value={siteConfig.footerContent.socialLinks.instagram || ''}
                    onChange={(e) => handleChange('socialLinks.instagram', e.target.value)}
                    placeholder="https://instagram.com/tu-cuenta"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    type="url"
                    value={siteConfig.footerContent.socialLinks.twitter || ''}
                    onChange={(e) => handleChange('socialLinks.twitter', e.target.value)}
                    placeholder="https://twitter.com/tu-cuenta"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={loading} size="lg">
                <Save size={16} className="mr-2" />
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
