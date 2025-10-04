'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
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
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditEventPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    city: '',
    image: '',
    price: '',
    maxCapacity: ''
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'business') {
      router.push('/');
      return;
    }

    // Load business data
    if (user.businessId) {
      const businessData = db.getBusinessById(user.businessId);
      setBusiness(businessData || null);
    }

    // Load event data
    if (params.id) {
      const event = db.getEventById(params.id as string);
      if (event && event.businessId === user.businessId) {
        setEventData(event);
        setFormData({
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          city: event.city,
          image: event.image,
          price: event.price.toString(),
          maxCapacity: event.maxCapacity?.toString() || ''
        });
      } else {
        // Event not found or doesn't belong to this business
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventData || !user || !business) return;

    setLoading(true);

    try {
      const updatedEvent: Partial<Event> = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location || business.name,
        city: formData.city,
        image: formData.image || eventData.image,
        price: parseFloat(formData.price),
        maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : undefined,
        updatedAt: new Date().toISOString()
      };

      db.updateEvent(eventData.id, updatedEvent);
      router.push('/dashboard?updated=true');
    } catch (error) {
      console.error('Error updating event:', error);
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
            <p className="mt-4 text-gray-600">Cargando evento...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || user.role !== 'business' || !eventData) {
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
            <h1 className="text-3xl font-bold text-gray-900">Editar Evento</h1>
            <p className="text-gray-600 mt-1">Actualiza la información de tu evento</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Información del Evento</CardTitle>
              <CardDescription>
                Modifica los detalles de tu evento
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
                      placeholder="Subir nueva imagen"
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

                {/* Event Status Info */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Estado del Evento</h4>
                  <div className="text-sm text-blue-700">
                    <p>Estado actual: <span className="font-medium">
                      {eventData.status === 'pending' && 'Pendiente de aprobación'}
                      {eventData.status === 'approved' && 'Aprobado'}
                      {eventData.status === 'rejected' && 'Rechazado'}
                    </span></p>
                    {eventData.status === 'rejected' && eventData.rejectionReason && (
                      <p className="mt-1 text-red-700">
                        Motivo del rechazo: {eventData.rejectionReason}
                      </p>
                    )}
                    {eventData.status === 'pending' && (
                      <p className="mt-1">El evento será visible al público una vez aprobado por el administrador.</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    <Save size={16} className="mr-2" />
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
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
