'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Event } from '@/types';
import { db } from '@/lib/database';
import { ArrowLeft, Check, X, Eye, Calendar, Clock, MapPin, Users, DollarSign, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import CroquisViewer from '@/components/CroquisViewer';

export default function AdminEventsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventSectors, setEventSectors] = useState<any[]>([]);
  const [eventCroquis, setEventCroquis] = useState<any>(null);

  const loadEvents = async () => {
    try {
      const allEvents = await db.getAllEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadEventDetails = async (eventId: string) => {
    try {
      const event = await db.getEventById(eventId);
      if (event) {
        setSelectedEvent(event);

        // Cargar sectores del evento
        try {
          const sectors = await db.getEventSectors(eventId);
          setEventSectors(sectors || []);
        } catch (error) {
          console.error('Error loading sectors:', error);
          setEventSectors([]);
        }

        // Cargar croquis del evento
        if (event.croquisId) {
          try {
            const croquis = await db.getCroquisById(event.croquisId);
            setEventCroquis(croquis);
          } catch (error) {
            console.error('Error loading croquis:', error);
            setEventCroquis(null);
          }
        } else {
          setEventCroquis(null);
        }
      }
    } catch (error) {
      console.error('Error loading event details:', error);
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
        setSelectedEvent(null); // Cerrar modal
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
          setSelectedEvent(null); // Cerrar modal
          alert('Evento rechazado');
        }
      } catch (error) {
        console.error('Error rejecting event:', error);
        alert('Error al rechazar el evento');
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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
            <p className="text-gray-600 mt-1">Revisar y aprobar eventos pendientes</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Eventos Pendientes ({pendingEvents.length})</CardTitle>
              <CardDescription>
                Eventos que necesitan revisión y aprobación para ser publicados
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
                    <div key={event.id} className="border rounded-lg p-6 bg-white">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                          <p className="text-gray-600">{event.businessName}</p>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>{event.time} hrs</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin size={14} />
                              <span>{event.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign size={14} />
                              <span>Bs. {event.price}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-yellow-600">
                          Pendiente
                        </Badge>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">{event.description}</p>

                      <div className="flex gap-3 flex-wrap">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() => loadEventDetails(event.id)}
                            >
                              <Eye size={16} className="mr-2" />
                              Revisar Detalles
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Revisión Detallada del Evento</DialogTitle>
                              <DialogDescription>
                                Revise todos los detalles antes de aprobar el evento
                              </DialogDescription>
                            </DialogHeader>

                            {selectedEvent && (
                              <div className="space-y-6">
                                {/* Información básica */}
                                <div className="grid md:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="font-semibold mb-3">Información del Evento</h4>
                                    <div className="space-y-2 text-sm">
                                      <div><strong>Título:</strong> {selectedEvent.title}</div>
                                      <div><strong>Negocio:</strong> {selectedEvent.businessName}</div>
                                      <div><strong>Fecha:</strong> {formatDate(selectedEvent.date)}</div>
                                      <div><strong>Hora:</strong> {selectedEvent.time} hrs</div>
                                      <div><strong>Ubicación:</strong> {selectedEvent.location}</div>
                                      <div><strong>Ciudad:</strong> {selectedEvent.city}</div>
                                      <div><strong>Precio:</strong> Bs. {selectedEvent.price}</div>
                                      <div><strong>Capacidad:</strong> {selectedEvent.maxCapacity || 'No especificada'}</div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold mb-3">Imagen del Evento</h4>
                                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                                      {selectedEvent.image ? (
                                        <Image
                                          src={selectedEvent.image}
                                          alt={selectedEvent.title}
                                          fill
                                          className="object-cover"
                                        />
                                      ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                          <ImageIcon size={48} />
                                          <span className="ml-2">Sin imagen</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Descripción */}
                                <div>
                                  <h4 className="font-semibold mb-3">Descripción</h4>
                                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                    {selectedEvent.description}
                                  </p>
                                </div>

                                {/* Sectores */}
                                {eventSectors.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-3">Sectores Configurados ({eventSectors.length})</h4>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {eventSectors.map((sector, index) => (
                                        <div key={index} className="border rounded-lg p-3 bg-gray-50">
                                          <div className="flex items-center gap-2 mb-2">
                                            <div
                                              className="w-4 h-4 rounded-full border-2"
                                              style={{ backgroundColor: sector.color }}
                                            ></div>
                                            <span className="font-medium">{sector.name}</span>
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            <div>Precio: Bs. {sector.price}</div>
                                            <div>Capacidad: {sector.capacity} personas</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Croquis */}
                                {eventCroquis && (
                                  <div>
                                    <h4 className="font-semibold mb-3">Croquis del Local</h4>
                                    <div className="border rounded-lg p-4 bg-gray-50">
                                      <div className="mb-4">
                                        <p className="text-sm text-gray-600">
                                          <strong>Plantilla:</strong> {eventCroquis.name}
                                        </p>
                                        {eventCroquis.description && (
                                          <p className="text-sm text-gray-600">
                                            <strong>Descripción:</strong> {eventCroquis.description}
                                          </p>
                                        )}
                                      </div>
                                      <div className="max-h-96 overflow-hidden">
                                        <CroquisViewer
                                          croquis={eventCroquis}
                                          sectors={eventSectors}
                                          showFilters={false}
                                          onSeatSelect={() => {}}
                                          selectedSeats={[]}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Botones de acción */}
                                <div className="flex gap-3 pt-4 border-t">
                                  <Button
                                    onClick={() => handleApproveEvent(selectedEvent.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Check size={16} className="mr-2" />
                                    Aprobar Evento
                                  </Button>
                                  <Button
                                    onClick={() => handleRejectEvent(selectedEvent.id)}
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                  >
                                    <X size={16} className="mr-2" />
                                    Rechazar Evento
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          onClick={() => handleApproveEvent(event.id)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Check size={16} className="mr-2" />
                          Aprobar Rápido
                        </Button>
                        <Button
                          onClick={() => handleRejectEvent(event.id)}
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          size="sm"
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
