'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/types';
import { db } from '@/lib/database';
import { ArrowLeft, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function AdminEventsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);

  const loadEvents = async () => {
    try {
      const allEvents = await db.getAllEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') {
      router.push('/');
      return;
    }
    loadEvents();
  }, [user, router]);

  const handleApproveEvent = async (eventId: string) => {
    try {
      const event = await db.getEventById(eventId);
      if (event) {
        await db.approveEvent(eventId);

        // Send WhatsApp notification
        const business = await db.getBusinessById(event.businessId);
        if (business) {
          const message = `¡Hola! Te informamos que tu evento "${event.title}" programado para el ${new Date(event.date).toLocaleDateString('es-ES')} ha sido APROBADO ✅ y ya está visible en la página principal de EventosDiscos. Los clientes pueden verlo y hacer reservas. ¡Felicidades! 🎉`;
          const whatsappUrl = `https://wa.me/591${business.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
        }

        loadEvents(); // Reload data
        alert('Evento aprobado exitosamente');
      }
    } catch (error) {
      console.error('Error approving event:', error);
      alert('Error al aprobar el evento');
    }
  };

  const handleRejectEvent = async (eventId: string) => {
    const reason = prompt('Motivo del rechazo:');
    if (reason) {
      try {
        const event = await db.getEventById(eventId);
        if (event) {
          await db.rejectEvent(eventId, reason);

          // Send WhatsApp notification
          const business = await db.getBusinessById(event.businessId);
          if (business) {
            const message = `Hola, te informamos que tu evento "${event.title}" programado para el ${new Date(event.date).toLocaleDateString('es-ES')} ha sido rechazado ❌. Motivo: ${reason}. Puedes modificarlo y volver a enviarlo para aprobación. Si tienes dudas, contáctanos.`;
            const whatsappUrl = `https://wa.me/591${business.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
          }

          loadEvents(); // Reload data
          alert('Evento rechazado');
        }
      } catch (error) {
        console.error('Error rejecting event:', error);
        alert('Error al rechazar el evento');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando eventos...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const pendingEvents = events.filter(e => e.status === 'pending');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Link
              href="/admin"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Volver al Panel Admin
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Eventos</h1>
            <p className="text-gray-600 mt-1">Aprobar o rechazar eventos pendientes</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Eventos Pendientes ({pendingEvents.length})</CardTitle>
              <CardDescription>
                Eventos que necesitan aprobación para ser publicados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Check size={48} className="mx-auto text-green-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay eventos pendientes
                  </h3>
                  <p className="text-gray-500">
                    Todos los eventos han sido revisados
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                          <p className="text-gray-600">{event.businessName}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(event.date).toLocaleDateString('es-ES')} - {event.time}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-yellow-600">
                          Pendiente
                        </Badge>
                      </div>

                      <p className="text-gray-700 mb-4">{event.description}</p>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApproveEvent(event.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check size={16} className="mr-2" />
                          Aprobar
                        </Button>
                        <Button
                          onClick={() => handleRejectEvent(event.id)}
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <X size={16} className="mr-2" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
