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
import { Plus, Calendar, Users, DollarSign, Edit, Trash2, Ticket as TicketIcon, Bookmark } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'business') {
      router.push('/');
      return;
    }

    // Load business events
    if (user.businessId) {
      const businessEvents = db.getEventsByBusinessId(user.businessId);
      setEvents(businessEvents);
    }
  }, [user, router]);

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      db.deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando panel...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || user.role !== 'business') {
    return null;
  }

  const totalEvents = events.length;
  const totalSales = events.reduce((sum, event) => sum + (event.currentSales || 0), 0);
  const totalRevenue = events.reduce((sum, event) => sum + (event.currentSales || 0) * event.price, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
              <p className="text-gray-600 mt-1">Gestiona tus eventos y ventas</p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0 flex-wrap">
              <Button asChild>
                <Link href="/dashboard/wizard-evento">
                  <Plus size={16} className="mr-2" />
                  Wizard de Eventos
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/nuevo-evento">
                  Evento Rápido
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-purple-50 hover:bg-purple-100 border-purple-200">
                <Link href="/dashboard/editor-tickets">
                  <TicketIcon size={16} className="mr-2 text-purple-600" />
                  <span className="text-purple-600">Editor de Tickets</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-green-50 hover:bg-green-100 border-green-200">
                <Link href="/dashboard/ventas">
                  <DollarSign size={16} className="mr-2 text-green-600" />
                  <span className="text-green-600">Gestionar Ventas</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-blue-50 hover:bg-blue-100 border-blue-200">
                <Link href="/dashboard/plantillas-croquis">
                  <Bookmark size={16} className="mr-2 text-blue-600" />
                  <span className="text-blue-600">Plantillas de Croquis</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-orange-50 hover:bg-orange-100 border-orange-200">
                <Link href="/dashboard/personal-porteria">
                  <Users size={16} className="mr-2 text-orange-600" />
                  <span className="text-orange-600">Personal de Portería</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEvents}</div>
                <p className="text-xs text-muted-foreground">
                  Eventos activos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entradas Vendidas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSales}</div>
                <p className="text-xs text-muted-foreground">
                  Total de entradas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Bs. {totalRevenue}</div>
                <p className="text-xs text-muted-foreground">
                  Ingresos totales
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Events Table */}
          <Card>
            <CardHeader>
              <CardTitle>Mis Eventos</CardTitle>
              <CardDescription>
                Administra todos tus eventos desde aquí
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tienes eventos
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Comienza creando tu primer evento
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/nuevo-evento">
                      <Plus size={16} className="mr-2" />
                      Crear Primer Evento
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Evento</th>
                        <th className="text-left py-3 px-4">Fecha</th>
                        <th className="text-left py-3 px-4">Precio</th>
                        <th className="text-left py-3 px-4">Vendidas</th>
                        <th className="text-left py-3 px-4">Estado</th>
                        <th className="text-right py-3 px-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr key={event.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={event.image}
                                alt={event.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div>
                                <div className="font-medium">{event.title}</div>
                                <div className="text-sm text-gray-500">{event.location}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              {new Date(event.date).toLocaleDateString('es-ES')}
                            </div>
                            <div className="text-xs text-gray-500">{event.time}</div>
                          </td>
                          <td className="py-3 px-4">
                            Bs. {event.price}
                          </td>
                          <td className="py-3 px-4">
                            {event.currentSales || 0}
                            {event.maxCapacity && (
                              <span className="text-gray-500"> / {event.maxCapacity}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={event.isActive ? "default" : "secondary"}>
                              {event.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/editar-evento/${event.id}`}>
                                  <Edit size={14} className="mr-1" />
                                  Editar
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteEvent(event.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 size={14} className="mr-1" />
                                Eliminar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
