'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CarouselImage } from '@/types';
import { db } from '@/lib/database';
import { Plus, Trash2, ArrowLeft, Image as ImageIcon, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { ImageUpload } from '@/components/ui/image-upload';

export default function AdminCarouselPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    imageUrl: '',
    title: '',
    subtitle: '',
    linkUrl: ''
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    if (user && user.role === 'admin') {
      loadCarouselImages();
    }
  }, [user, loading, router]);

  const loadCarouselImages = async () => {
    try {
      setIsLoading(true);
      const images = await db.getAllCarouselImages();
      setCarouselImages(images);
    } catch (error) {
      console.error('Error loading carousel images:', error);
      setMessage({
        type: 'error',
        text: 'Error al cargar las imágenes del carrusel'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imageUrl.trim()) {
      setMessage({
        type: 'error',
        text: 'Debes subir una imagen o ingresar una URL'
      });
      return;
    }

    try {
      const newImage = await db.addCarouselImage({
        imageUrl: formData.imageUrl.trim(),
        title: formData.title.trim() || undefined,
        subtitle: formData.subtitle.trim() || undefined,
        linkUrl: formData.linkUrl.trim() || undefined,
        isActive: true
      });

      if (newImage) {
        setMessage({
          type: 'success',
          text: 'Imagen agregada al carrusel exitosamente'
        });
        setFormData({
          imageUrl: '',
          title: '',
          subtitle: '',
          linkUrl: ''
        });
        setShowForm(false);
        loadCarouselImages();
      } else {
        setMessage({
          type: 'error',
          text: 'Error al agregar la imagen al carrusel'
        });
      }
    } catch (error) {
      console.error('Error adding carousel image:', error);
      setMessage({
        type: 'error',
        text: 'Error al agregar la imagen al carrusel'
      });
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen del carrusel?')) {
      return;
    }

    try {
      const success = await db.deleteCarouselImage(imageId);
      if (success) {
        setMessage({
          type: 'success',
          text: 'Imagen eliminada del carrusel exitosamente'
        });
        loadCarouselImages();
      } else {
        setMessage({
          type: 'error',
          text: 'Error al eliminar la imagen del carrusel'
        });
      }
    } catch (error) {
      console.error('Error deleting carousel image:', error);
      setMessage({
        type: 'error',
        text: 'Error al eliminar la imagen del carrusel'
      });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin">
              <ArrowLeft size={16} />
              Volver al Panel
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión del Carrusel</h1>
            <p className="text-gray-600">Administra las imágenes del carrusel principal</p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Add Image Button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Imágenes del Carrusel ({carouselImages.length})</h2>
            <p className="text-gray-600">Gestiona las imágenes que se muestran en la página principal</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus size={16} />
            Agregar Imagen
          </Button>
        </div>

        {/* Add Image Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Agregar Nueva Imagen</CardTitle>
              <CardDescription>
                Completa los datos para agregar una nueva imagen al carrusel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload Section */}
                <div>
                  <Label className="text-base font-semibold">Imagen del Carrusel *</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Sube una imagen desde tu PC o ingresa una URL externa
                  </p>
                  <ImageUpload
                    value={formData.imageUrl}
                    onChange={(url) => setFormData({...formData, imageUrl: url})}
                    onError={(error) => setMessage({ type: 'error', text: error })}
                    type="carousel"
                    placeholder="Sube una imagen para el carrusel"
                  />
                </div>

                {/* Other Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Título (opcional)</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Título de la imagen"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subtitle">Subtítulo (opcional)</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                      placeholder="Descripción o subtítulo"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="linkUrl">Enlace (opcional)</Label>
                    <Input
                      id="linkUrl"
                      type="url"
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({...formData, linkUrl: e.target.value})}
                      placeholder="https://enlace-destino.com"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    Agregar Imagen
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Images List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {carouselImages.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay imágenes en el carrusel
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Agrega la primera imagen para comenzar
                  </p>
                  <Button onClick={() => setShowForm(true)} className="gap-2">
                    <Plus size={16} />
                    Agregar Primera Imagen
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            carouselImages.map((image) => (
              <Card key={image.id}>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Image Preview */}
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={image.imageUrl}
                        alt={image.title || 'Imagen del carrusel'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+SW1hZ2VuIG5vIGRpc3BvbmlibGU8L3RleHQ+PC9zdmc+';
                        }}
                      />
                    </div>

                    {/* Image Info */}
                    <div className="space-y-2">
                      {image.title && (
                        <h3 className="font-semibold text-gray-900">{image.title}</h3>
                      )}
                      {image.subtitle && (
                        <p className="text-gray-600 text-sm">{image.subtitle}</p>
                      )}

                      <div className="flex items-center gap-2">
                        <Badge variant={image.isActive ? "default" : "secondary"}>
                          {image.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                        {image.linkUrl && (
                          <Badge variant="outline" className="gap-1">
                            <ExternalLink size={12} />
                            Con enlace
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {image.linkUrl && (
                          <Button asChild variant="outline" size="sm">
                            <a href={image.linkUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink size={14} />
                              Ver enlace
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(image.id)}
                          className="gap-1"
                        >
                          <Trash2 size={14} />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
