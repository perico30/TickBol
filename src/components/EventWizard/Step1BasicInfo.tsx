'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FileUpload from '@/components/ui/file-upload';
import { Upload, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface Step1Props {
  data: {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    city: string;
    image: string;
  };
  onUpdate: (field: string, value: string) => void;
  onNext: () => void;
}

export default function Step1BasicInfo({ data, onUpdate, onNext }: Step1Props) {
  const [imagePreview, setImagePreview] = useState(data.image);

  const handleImageUrlChange = (url: string) => {
    setImagePreview(url);
    onUpdate('image', url);
  };

  const isValid = data.title && data.description && data.date && data.time && data.location && data.city;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Información Básica del Evento</h2>
        <p className="text-gray-600 mt-2">
          Completa los datos principales de tu evento que aparecerán en la página principal
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column - Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Evento</CardTitle>
              <CardDescription>
                Información que verán los usuarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Nombre del Evento *</Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => onUpdate('title', e.target.value)}
                  placeholder="Ej: NOCHE REGGAETON 2025"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => onUpdate('description', e.target.value)}
                  placeholder="Describe tu evento, artistas, estilo de música..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="date">Fecha *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={data.date}
                    onChange={(e) => onUpdate('date', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="time">Hora *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={data.time}
                    onChange={(e) => onUpdate('time', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Lugar *</Label>
                <Input
                  id="location"
                  value={data.location}
                  onChange={(e) => onUpdate('location', e.target.value)}
                  placeholder="Nombre del local o discoteca"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  value={data.city}
                  onChange={(e) => onUpdate('city', e.target.value)}
                  placeholder="Santa Cruz, La Paz, Cochabamba..."
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Image Upload */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Imagen del Evento</CardTitle>
              <CardDescription>
                Esta imagen se mostrará en la página principal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload Option */}
              <div>
                <Label>Subir desde tu PC</Label>
                <div className="mt-1">
                  <FileUpload
                    value={data.image}
                    onChange={(value) => handleImageUrlChange(value || '')}
                    placeholder="Subir imagen desde tu computadora"
                    accept="image/*"
                    maxSize={5}
                  />
                </div>
              </div>

              {/* URL Option */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">O usar URL</span>
                </div>
              </div>

              <div>
                <Label htmlFor="imageUrl">URL de la Imagen</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="imageUrl"
                    type="url"
                    value={data.image.startsWith('data:') ? '' : data.image}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const url = prompt('Ingresa la URL de la imagen:');
                      if (url) handleImageUrlChange(url);
                    }}
                  >
                    <Upload size={16} />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recomendado: 800x600px o similar, formato JPG/PNG
                </p>
              </div>

              {/* Sample Images */}
              <div>
                <Label>Imágenes de ejemplo (click para usar):</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1574391884720-bbc3d77e5ee4?w=800&h=600&fit=crop'
                  ].map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleImageUrlChange(url)}
                      className="aspect-video relative rounded border-2 border-transparent hover:border-blue-500 transition-colors overflow-hidden"
                    >
                      <Image
                        src={url}
                        alt={`Ejemplo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t">
        <Button
          onClick={onNext}
          disabled={!isValid}
          size="lg"
        >
          Siguiente: Configurar Sectores →
        </Button>
      </div>
    </div>
  );
}
