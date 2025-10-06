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
import { SiteConfig, CarouselImage } from '@/types';
import { db } from '@/lib/database';
import { ArrowLeft, Save, Plus, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';

export default function AdminSiteConfigPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [newImage, setNewImage] = useState({
    url: '',
    title: '',
    subtitle: '',
    link: ''
  });

  const loadData = async () => {
    try {
      const config = await db.getSiteConfig();
      const images = await db.getCarouselImages();
      setSiteConfig(config);
      setCarouselImages(images);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') {
      router.push('/');
      return;
    }
    loadData();
  }, [user, router]);

  const handleSaveSiteConfig = async () => {
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

  const handleAddCarouselImage = async () => {
    if (!newImage.url || !newImage.title) {
      alert('URL e título son obligatorios');
      return;
    }

    try {
      const imageData = {
        ...newImage,
        order: carouselImages.length + 1,
        isActive: true
      };

      const success = await db.addCarouselImage(imageData);
      if (success) {
        setNewImage({ url: '', title: '', subtitle: '', link: '' });
        loadData(); // Recargar datos
        alert('Imagen agregada exitosamente');
      } else {
        alert('Error al agregar la imagen');
      }
    } catch (error) {
      console.error('Error adding image:', error);
      alert('Error al agregar la imagen');
    }
  };

  const handleDeleteCarouselImage = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen?')) return;

    try {
      const success = await db.deleteCarouselImage(id);
      if (success) {
        loadData(); // Recargar datos
        alert('Imagen eliminada exitosamente');
      } else {
        alert('Error al eliminar la imagen');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error al eliminar la imagen');
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
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <Link
              href="/admin"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Volver al Panel Admin
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Configuración del Sitio</h1>
            <p className="text-gray-600 mt-1">Administra la configuración general y el carrusel de imágenes</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Configuración General */}
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
                    onClick={handleSaveSiteConfig}
                    disabled={saving}
                    className="w-full"
                  >
                    <Save size={16} className="mr-2" />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Carrusel de Imágenes */}
            <Card>
              <CardHeader>
                <CardTitle>Carrusel de Imágenes</CardTitle>
                <CardDescription>
                  Gestiona las imágenes que se muestran en la página principal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Agregar nueva imagen */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold mb-3">Agregar Nueva Imagen</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="imageUrl">URL de la Imagen *</Label>
                      <Input
                        id="imageUrl"
                        value={newImage.url}
                        onChange={(e) => setNewImage({...newImage, url: e.target.value})}
                        placeholder="https://ejemplo.com/imagen.jpg"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="imageTitle">Título *</Label>
                      <Input
                        id="imageTitle"
                        value={newImage.title}
                        onChange={(e) => setNewImage({...newImage, title: e.target.value})}
                        placeholder="Título del slide"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="imageSubtitle">Subtítulo</Label>
                      <Input
                        id="imageSubtitle"
                        value={newImage.subtitle}
                        onChange={(e) => setNewImage({...newImage, subtitle: e.target.value})}
                        placeholder="Subtítulo opcional"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="imageLink">Enlace</Label>
                      <Input
                        id="imageLink"
                        value={newImage.link}
                        onChange={(e) => setNewImage({...newImage, link: e.target.value})}
                        placeholder="https://enlace-opcional.com"
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={handleAddCarouselImage} className="w-full">
                      <Plus size={16} className="mr-2" />
                      Agregar Imagen
                    </Button>
                  </div>
                </div>

                {/* Lista de imágenes actuales */}
                <div>
                  <h4 className="font-semibold mb-3">Imágenes Actuales ({carouselImages.length})</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {carouselImages.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No hay imágenes en el carrusel</p>
                    ) : (
                      carouselImages.map((image) => (
                        <div key={image.id} className="border rounded-lg p-3 bg-white">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium truncate">{image.title}</h5>
                              {image.subtitle && (
                                <p className="text-sm text-gray-600 truncate">{image.subtitle}</p>
                              )}
                              <p className="text-xs text-gray-500 truncate">Orden: {image.order}</p>
                            </div>
                            <Button
                              onClick={() => handleDeleteCarouselImage(image.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
