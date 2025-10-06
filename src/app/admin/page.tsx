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
import { Settings, Users, Calendar, Image as ImageIcon, CheckCircle, XCircle, CreditCardIcon } from 'lucide-react';
import Link from 'next/link';
import { Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalBusinesses: 0,
    pendingApprovals: 0,
    pendingPayments: 0
  });

  const loadData = async () => {
    try {
      // Load data with proper await
      const pending = await db.getPendingEvents();
      const allEvents = await db.getAllEvents();
      const businesses = await db.getBusinesses();
      const allPurchases = await db.getAllPurchases();
      const pendingPayments = allPurchases.filter(p => p.status === 'payment_submitted');

      setPendingEvents(pending);
      setStats({
        totalEvents: allEvents.length,
        totalBusinesses: businesses.length,
        pendingApprovals: pending.length,
        pendingPayments: pendingPayments.length
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
      // Set empty data on error
      setPendingEvents([]);
      setStats({
        totalEvents: 0,
        totalBusinesses: 0,
        pendingApprovals: 0,
        pendingPayments: 0
      });
    }
  };

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

    loadData();
  }, [user, router]);

  const handleApproveEvent = async (eventId: string) => {
    try {
      const event = await db.getEventById(eventId);
      if (event) {
        await db.approveEvent(eventId);

        // Generate WhatsApp notification message
        const business = await db.getBusinessById(event.businessId);
        if (business) {
          const message = `¡Hola! Te informamos que tu evento "${event.title}" programado para el ${new Date(event.date).toLocaleDateString('es-ES')} ha sido APROBADO ✅ y ya está visible en la página principal de EventosDiscos. Los clientes pueden verlo y hacer reservas. ¡Felicidades! 🎉`;
          const whatsappUrl = `https://wa.me/591${business.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

          // Update state and show WhatsApp option
          await loadData();

          if (confirm(`Evento aprobado exitosamente. ¿Deseas notificar al negocio por WhatsApp?`)) {
            window.open(whatsappUrl, '_blank');
          }
        }
      }
    } catch (error) {
      console.error('Error approving event:', error);
      alert('Error al aprobar el evento. Inténtalo de nuevo.');
    }
  };

  const handleRejectEvent = async (eventId: string) => {
    const reason = prompt('Motivo del rechazo:');
    if (reason) {
      try {
        const event = await db.getEventById(eventId);
        if (event) {
          await db.rejectEvent(eventId, reason);

          // Generate WhatsApp notification message
          const business = await db.getBusinessById(event.businessId);
          if (business) {
            const message = `Hola, te informamos que tu evento "${event.title}" programado para el ${new Date(event.date).toLocaleDateString('es-ES')} ha sido rechazado ❌. Motivo: ${reason}. Puedes modificarlo y volver a enviarlo para aprobación. Si tienes dudas, contáctanos.`;
            const whatsappUrl = `https://wa.me/591${business.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

            // Update state and show WhatsApp option
            await loadData();

            if (confirm(`Evento rechazado. ¿Deseas notificar al negocio por WhatsApp?`)) {
              window.open(whatsappUrl, '_blank');
            }
          }
        }
      } catch (error) {
        console.error('Error rejecting event:', error);
        alert('Error al rechazar el evento. Inténtalo de nuevo.');
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
            <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
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
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-gray-600 mt-1">Gestiona el sitio web y los eventos</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" /> Carrusel
                </CardTitle>
                <CardDescription>Gestiona las imágenes del Home.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/carousel">
                  <Button variant="secondary">Abrir gestor de carrusel</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Negocios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
                <p className="text-xs text-muted-foreground">
                  Negocios registrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
                <p className="text-xs text-muted-foreground">
                  Eventos por aprobar
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compras Pendientes</CardTitle>
                <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingPayments}</div>
                <p className="text-xs text-muted-foreground">
                  Pagos por verificar
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Button asChild className="h-24 flex-col gap-2">
              <Link href="/admin/site-config">
                <Settings size={24} />
                <span>Configuración del Sitio</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-24 flex-col gap-2">
              <Link href="/admin/carousel">
                <ImageIcon size={24} />
                <span>Gestionar Carrusel</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-24 flex-col gap-2">
              <Link href="/admin/events">
                <Calendar size={24} />
                <span>Gestionar Eventos</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-24 flex-col gap-2">
              <Link href="/admin/businesses">
                <Users size={24} />
                <span>Gestionar Negocios</span>
              </Link>
            </Button>


          </div>

          {/* Pending Events */}
          {pendingEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Eventos Pendientes de Aprobación</CardTitle>
                <CardDescription>
                  Revisa y aprueba los eventos creados por los negocios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <h3 className="font-medium">{event.title}</h3>
                          <p className="text-sm text-gray-500">
                            {event.businessName} • {new Date(event.date).toLocaleDateString('es-ES')}
                          </p>
                          <Badge variant="secondary">Pendiente</Badge>
                        </div>
                      </div>
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {pendingEvents.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay eventos pendientes
                </h3>
                <p className="text-gray-500">
                  Todos los eventos han sido revisados
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
