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
import FileUpload from '@/components/ui/file-upload';
import { Event, Business } from '@/types';
import { db } from '@/lib/database';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewEventPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    city: 'Santa Cruz',
    image: '',
    price: '',
    maxCapacity: ''
  });

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'business') {
      router.push('/');
      return;
    }

    if (user.businessId) {
      const businessData = db.getBusinessById(user.businessId);
      setBusiness(businessData || null);
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newEvent: Event = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location || business?.name || '',
        city: formData.city,
        image: formData.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
        price: parseFloat(formData.price),
        businessId: user?.businessId!,
        businessName: business?.name || user?.name || '',
        maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : undefined,
        currentSales: 0,
        isActive: true,
        status: 'pending',
        createdAt: new Date().toISOString(),
        sectors: [],
        combos: [],
        reservationConditions: [],
        seatMapElements: [],
        businessContact: {
          phone: business?.phone || '',
        },
        paymentInfo: {}
      };

      db.addEvent(newEvent);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando formulario...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || user.role !== 'business') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Volver al Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Evento</h1>
            <p className="text-gray-600 mt-1">Completa la información de tu evento</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Información del Evento</CardTitle>
              <CardDescription>
                Proporciona todos los detalles de tu evento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="title">Título del Evento *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Ej: NOCHE REGGAETON"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descripción *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe tu evento..."
                    required
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Fecha *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleChange('date', e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Hora *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleChange('time', e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder={business?.name || 'Nombre del lugar'}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si no lo llenas, se usará el nombre de tu negocio
                  </p>
                </div>

                <div>
                  <Label htmlFor="city">Ciudad *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Imagen del Evento</Label>
                  <div className="mt-1">
                    <FileUpload
                      value={formData.image}
                      onChange={(value) => handleChange('image', value || '')}
                      placeholder="Subir imagen del evento"
                      accept="image/*"
                      maxSize={5}
                    />
                  </div>
                  <div className="mt-3">
                    <Label htmlFor="imageUrl">O usar URL:</Label>
                    <Input
                      id="imageUrl"
                      type="url"
                      value={formData.image.startsWith('data:') ? '' : formData.image}
                      onChange={(e) => handleChange('image', e.target.value)}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="mt-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Si no proporcionas una imagen, se usará una por defecto
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Precio (Bs.) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleChange('price', e.target.value)}
                      placeholder="50.00"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxCapacity">Capacidad Máxima</Label>
                    <Input
                      id="maxCapacity"
                      type="number"
                      min="1"
                      value={formData.maxCapacity}
                      onChange={(e) => handleChange('maxCapacity', e.target.value)}
                      placeholder="500"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Creando Evento...' : 'Crear Evento'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
