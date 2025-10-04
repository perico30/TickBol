'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Event } from '@/types';
import { db } from '@/lib/database';
import { ArrowLeft, Search, CheckCircle, XCircle, Calendar, Users } from 'lucide-react';
import Link from 'next/link';

export default function AdminEventsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/');
      return;
    }

    loadEvents();
  }, [user, router]);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, filter]);

  const loadEvents = () => {
    const allEvents = db.getAllEvents();
    setEvents(allEvents);
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(event => event.status === filter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredEvents(filtered);
  };

  const handleApproveEvent = (eventId: string) => {
    const event = db.getEventById(eventId);
    if (event) {
      db.approveEvent(eventId);

      // Generate WhatsApp notification message
      const business = db.getBusinessById(event.businessId);
      if (business) {
        const message = `¡Hola! Te informamos que tu evento "${event.title}" programado para el ${new Date(event.date).toLocaleDateString('es-ES')} ha sido APROBADO ✅ y ya está visible en la página principal de EventosDiscos. Los clientes pueden verlo y hacer reservas. ¡Felicidades! 🎉`;
        const whatsappUrl = `https://wa.me/591${business.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

        // Show success message with WhatsApp link
        if (confirm(`Evento aprobado exitosamente. ¿Deseas notificar al negocio por WhatsApp?`)) {
          window.open(whatsappUrl, '_blank');
        }
      }

      loadEvents();
    }
  };

  const handleRejectEvent = (eventId: string) => {
    const reason = prompt('Motivo del rechazo:');
    if (reason) {
      const event = db.getEventById(eventId);
      if (event) {
        db.rejectEvent(eventId, reason);

        // Generate WhatsApp notification message
        const business = db.getBusinessById(event.businessId);
        if (business) {
          const message = `Hola, te informamos que tu evento "${event.title}" programado para el ${new Date(event.date).toLocaleDateString('es-ES')} ha sido rechazado ❌. Motivo: ${reason}. Puedes modificarlo y volver a enviarlo para aprobación. Si tienes dudas, contáctanos.`;
          const whatsappUrl = `https://wa.me/591${business.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

          // Show rejection message with WhatsApp link
          if (confirm(`Evento rechazado. ¿Deseas notificar al negocio por WhatsApp?`)) {
            window.open(whatsappUrl, '_blank');
          }
        }

        loadEvents();
      }
    }
  };

  const getStatusBadge = (status: Event['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-green-600">Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando gestión de eventos...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const stats = {
    total: events.length,
    pending: events.filter(e => e.status === 'pending').length,
    approved: events.filter(e => e.status === 'approved').length,
    rejected: events.filter(e => e.status === 'rejected').length
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Volver al Panel Admin
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Eventos</h1>
            <p className="text-gray-600 mt-1">Revisa y administra todos los eventos de la plataforma</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pendientes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Aprobados</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rechazados</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                      placeholder="Buscar eventos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {['all', 'pending', 'approved', 'rejected'].map((status) => (
                    <Button
                      key={status}
                      variant={filter === status ? 'default' : 'outline'}
                      onClick={() => setFilter(status as typeof filter)}
                      size="sm"
                    >
                      {status === 'all' ? 'Todos' :
                       status === 'pending' ? 'Pendientes' :
                       status === 'approved' ? 'Aprobados' : 'Rechazados'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <Card>
            <CardHeader>
              <CardTitle>Eventos ({filteredEvents.length})</CardTitle>
              <CardDescription>
                Lista de todos los eventos registrados en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontraron eventos
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm || filter !== 'all'
                      ? 'Intenta ajustar los filtros de búsqueda'
                      : 'No hay eventos registrados aún'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div>
                          <h3 className="font-medium text-lg">{event.title}</h3>
                          <p className="text-sm text-gray-600">
                            por {event.businessName}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>📅 {new Date(event.date).toLocaleDateString('es-ES')}</span>
                            <span>📍 {event.city}</span>
                            <span>💰 Bs. {event.price}</span>
                            {event.maxCapacity && (
                              <span>👥 {event.currentSales || 0}/{event.maxCapacity}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(event.status)}
                            {event.status === 'rejected' && event.rejectionReason && (
                              <span className="text-xs text-red-600">
                                Motivo: {event.rejectionReason}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {event.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveEvent(event.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle size={16} className="mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectEvent(event.id)}
                          >
                            <XCircle size={16} className="mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      )}

                      {event.status === 'approved' && (
                        <div className="text-right text-sm text-gray-500">
                          <div>Aprobado</div>
                          {event.updatedAt && (
                            <div>{new Date(event.updatedAt).toLocaleDateString('es-ES')}</div>
                          )}
                        </div>
                      )}

                      {event.status === 'rejected' && (
                        <div className="text-right text-sm text-gray-500">
                          <div className="text-red-600">Rechazado</div>
                          {event.updatedAt && (
                            <div>{new Date(event.updatedAt).toLocaleDateString('es-ES')}</div>
                          )}
                        </div>
                      )}
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
