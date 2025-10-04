'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CarouselImage } from '@/types';
import { db } from '@/lib/database';
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, Upload, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function CarouselManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newImage, setNewImage] = useState({
    url: '',
    title: '',
    subtitle: '',
    link: ''
  });
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/');
      return;
    }

    loadCarouselImages();
  }, [user, router, loading]);

  const loadCarouselImages = () => {
    try {
      const siteConfig = db.getSiteConfig();
      setCarouselImages(siteConfig.carouselImages || []);
    } catch (error) {
      console.error('Error loading carousel images:', error);
      setCarouselImages([]);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo debe ser menor a 5MB');
        return;
      }

      setSelectedFile(file);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
        setNewImage(prev => ({ ...prev, url: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImage = () => {
    if (uploadMethod === 'url' && (!newImage.url || !newImage.title)) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (uploadMethod === 'file' && (!selectedFile || !newImage.title)) {
      alert('Por favor selecciona un archivo y completa el título');
      return;
    }

    const image: CarouselImage = {
      id: Date.now().toString(),
      url: newImage.url,
      title: newImage.title,
      subtitle: newImage.subtitle || undefined,
      link: newImage.link || undefined,
      order: carouselImages.length + 1,
      isActive: true
    };

    try {
      db.addCarouselImage(image);
      loadCarouselImages();
      resetForm();
      alert('Imagen agregada exitosamente');
    } catch (error) {
      console.error('Error adding image:', error);
      alert('Error al agregar la imagen');
    }
  };

  const resetForm = () => {
    setNewImage({ url: '', title: '', subtitle: '', link: '' });
    setSelectedFile(null);
    setFilePreview('');
    setIsAdding(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleActive = (id: string) => {
    try {
      const image = carouselImages.find(img => img.id === id);
      if (image) {
        const success = db.updateCarouselImage(id, { isActive: !image.isActive });
        if (success) {
          loadCarouselImages();
        } else {
          alert('Error al actualizar la imagen');
        }
      }
    } catch (error) {
      console.error('Error toggling image active state:', error);
      alert('Error al actualizar la imagen');
    }
  };

  const handleDeleteImage = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta imagen? Esta acción no se puede deshacer.')) {
      try {
        const success = db.deleteCarouselImage(id);
        if (success) {
          loadCarouselImages();
          alert('Imagen eliminada exitosamente');
        } else {
          alert('Error al eliminar la imagen');
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        alert('Error al eliminar la imagen');
      }
    }
  };

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    try {
      const image = carouselImages.find(img => img.id === id);
      if (!image) return;

      const sortedImages = [...carouselImages].sort((a, b) => a.order - b.order);
      const currentIndex = sortedImages.findIndex(img => img.id === id);

      if (direction === 'up' && currentIndex > 0) {
        const targetImage = sortedImages[currentIndex - 1];
        db.updateCarouselImage(id, { order: targetImage.order });
        db.updateCarouselImage(targetImage.id, { order: image.order });
        loadCarouselImages();
      } else if (direction === 'down' && currentIndex < sortedImages.length - 1) {
        const targetImage = sortedImages[currentIndex + 1];
        db.updateCarouselImage(id, { order: targetImage.order });
        db.updateCarouselImage(targetImage.id, { order: image.order });
        loadCarouselImages();
      }
    } catch (error) {
      console.error('Error reordering images:', error);
      alert('Error al reordenar las imágenes');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando gestión de carrusel...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const activeImages = carouselImages.filter(img => img.isActive).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <Link
                  href="/admin"
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft size={20} className="mr-2" />
                  Volver al Panel de Administración
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión del Carrusel</h1>
              <p className="text-gray-600 mt-1">
                Administra las imágenes del carrusel principal
              </p>
            </div>
            <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
              <Plus size={16} className="mr-2" />
              Agregar Imagen
            </Button>
          </div>

          {/* Add New Image Form */}
          {isAdding && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Nueva Imagen del Carrusel</CardTitle>
                <CardDescription>
                  Agrega una nueva imagen al carrusel principal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Method Selection */}
                <Tabs value={uploadMethod} onValueChange={(value: string) => {
                  setUploadMethod(value as 'url' | 'file');
                  resetForm();
                }}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url">URL de Imagen</TabsTrigger>
                    <TabsTrigger value="file">Subir desde PC</TabsTrigger>
                  </TabsList>

                  <TabsContent value="url" className="space-y-4">
                    <div>
                      <Label htmlFor="imageUrl">URL de la Imagen *</Label>
                      <Input
                        id="imageUrl"
                        type="url"
                        value={newImage.url}
                        onChange={(e) => setNewImage(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://ejemplo.com/imagen.jpg"
                        className="mt-1"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="file" className="space-y-4">
                    <div>
                      <Label htmlFor="imageFile">Seleccionar Archivo *</Label>
                      <div className="mt-1">
                        <input
                          ref={fileInputRef}
                          id="imageFile"
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full"
                        >
                          <Upload size={16} className="mr-2" />
                          {selectedFile ? selectedFile.name : 'Seleccionar imagen desde PC'}
                        </Button>
                      </div>
                      {filePreview && (
                        <div className="mt-2">
                          <Image
                            src={filePreview}
                            alt="Preview"
                            width={200}
                            height={120}
                            className="rounded border object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <div>
                  <Label htmlFor="imageTitle">Título *</Label>
                  <Input
                    id="imageTitle"
                    value={newImage.title}
                    onChange={(e) => setNewImage(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="NOCHE REGGAETON"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="imageSubtitle">Subtítulo</Label>
                  <Input
                    id="imageSubtitle"
                    value={newImage.subtitle}
                    onChange={(e) => setNewImage(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="La mejor música reggaeton..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="imageLink">Enlace (opcional)</Label>
                  <Input
                    id="imageLink"
                    type="url"
                    value={newImage.link}
                    onChange={(e) => setNewImage(prev => ({ ...prev, link: e.target.value }))}
                    placeholder="https://ejemplo.com/evento"
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAddImage}
                    disabled={
                      (uploadMethod === 'url' && (!newImage.url || !newImage.title)) ||
                      (uploadMethod === 'file' && (!selectedFile || !newImage.title))
                    }
                  >
                    Agregar Imagen
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Images */}
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Imágenes del Carrusel ({carouselImages.length})</CardTitle>
                <CardDescription>
                  Las imágenes se rotan cada 2 segundos automáticamente. Solo las imágenes activas se muestran en el carrusel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {carouselImages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">📸</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay imágenes en el carrusel
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Agrega la primera imagen para comenzar
                    </p>
                    <Button onClick={() => setIsAdding(true)}>
                      <Plus size={16} className="mr-2" />
                      Agregar Primera Imagen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {carouselImages
                      .sort((a, b) => a.order - b.order)
                      .map((image, index) => (
                        <div
                          key={image.id}
                          className={`flex items-center gap-4 p-4 border rounded-lg ${
                            image.isActive ? 'bg-white border-blue-200' : 'bg-gray-50 opacity-70 border-gray-200'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            <Image
                              src={image.url}
                              alt={image.title}
                              width={120}
                              height={80}
                              className="w-30 h-20 object-cover rounded border"
                            />
                          </div>

                          <div className="flex-1">
                            <h3 className="font-medium">{image.title}</h3>
                            {image.subtitle && (
                              <p className="text-sm text-gray-600">{image.subtitle}</p>
                            )}
                            {image.link && (
                              <p className="text-xs text-blue-600 truncate">Enlace: {image.link}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-500">Orden: {image.order}</span>
                              {image.isActive ? (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Activa</span>
                              ) : (
                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Inactiva</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            {/* Reorder buttons */}
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReorder(image.id, 'up')}
                                disabled={index === 0}
                                title="Subir"
                              >
                                <ArrowUp size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReorder(image.id, 'down')}
                                disabled={index === carouselImages.length - 1}
                                title="Bajar"
                              >
                                <ArrowDown size={14} />
                              </Button>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleActive(image.id)}
                                title={image.isActive ? 'Ocultar' : 'Mostrar'}
                              >
                                {image.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteImage(image.id)}
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview Section */}
            {activeImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Vista Previa del Carrusel</CardTitle>
                  <CardDescription>
                    Así se ven las imágenes activas en el carrusel principal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeImages.map((image) => (
                      <div key={image.id} className="relative">
                        <Image
                          src={image.url}
                          alt={image.title}
                          width={300}
                          height={200}
                          className="w-full h-32 object-cover rounded"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 rounded flex flex-col justify-end p-3">
                          <h4 className="text-white font-bold text-sm">{image.title}</h4>
                          {image.subtitle && (
                            <p className="text-white text-xs opacity-90">{image.subtitle}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
