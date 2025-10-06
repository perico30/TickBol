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

export default function AdminSiteConfigPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [saving, setSaving] = useState(false);

  const loadSiteConfig = async () => {
    try {
      const config = await db.getSiteConfig();
      setSiteConfig(config);
    } catch (error) {
      console.error('Error loading site config:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') {
      router.push('/');
      return;
    }
    loadSiteConfig();
  }, [user, router]);

  const handleSave = async () => {
    if (!siteConfig) return;

    setSaving(true);
    try {
      await db.updateSiteConfig(siteConfig);
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !siteConfig) {
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

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <Link
              href="/admin"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Volver al Panel Admin
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Configuración del Sitio</h1>
            <p className="text-gray-600 mt-1">Administra la configuración general de la plataforma</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Modifica los datos básicos que se muestran en toda la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="siteName">Nombre del Sitio</Label>
                <Input
                  id="siteName"
                  value={siteConfig.siteName}
                  onChange={(e) => setSiteConfig({...siteConfig, siteName: e.target.value})}
                  placeholder="EventosDiscos"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="tagline">Eslogan</Label>
                <Input
                  id="tagline"
                  value={siteConfig.tagline}
                  onChange={(e) => setSiteConfig({...siteConfig, tagline: e.target.value})}
                  placeholder="# ACOMPAÑANDO LOS MEJORES EVENTOS"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="logoUrl">URL del Logo</Label>
                <Input
                  id="logoUrl"
                  value={siteConfig.logoUrl}
                  onChange={(e) => setSiteConfig({...siteConfig, logoUrl: e.target.value})}
                  placeholder="/logo.png"
                  className="mt-1"
                />
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full md:w-auto"
                >
                  <Save size={16} className="mr-2" />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
