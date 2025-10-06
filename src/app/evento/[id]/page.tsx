'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/types';
import { db } from '@/lib/database';
import { Calendar, MapPin, Clock, Users, DollarSign, ArrowLeft, Phone, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const id = params.id as string;

  const loadEvent = async () => {
    try {
      console.log('🔍 Loading event with ID:', id);
      const eventData = await db.getEventById(id);

      if (eventData && eventData.status === 'approved') {
        console.log('✅ Event loaded successfully:', eventData.title);
        setEvent(eventData);
      } else {
        console.log('❌ Event not found or not approved, redirecting...');
        router.push('/');
      }
    } catch (error) {
      console.error('❌ Error loading event:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [id, router]);

  const generateWhatsAppMessage = () => {
    if (!event) return '';

    const message = `Hola! Me interesa el evento "${event.title}" del ${new Date(event.date).toLocaleDateString('es-ES')}. Quisiera hacer una consulta sobre la reserva.`;
    return encodeURIComponent(message);
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('591') ? cleaned : `591${cleaned}`;
  };

  if (loading) {
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

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Evento no encontrado</h1>
            <p className="text-gray-600 mb-6">El evento que buscas no existe o no está disponible.</p>
            <Button asChild>
              <Link href="/">Volver al Inicio</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const soldPercentage = event.maxCapacity
    ? Math.round((event.currentSales || 0) / event.maxCapacity * 100)
    : 0;

  const whatsappNumber = event.businessContact?.whatsapp || event.businessContact?.phone || '78005026';
  const whatsappLink = `https://wa.me/${formatPhoneForWhatsApp(whatsappNumber)}?text=${generateWhatsAppMessage()}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative h-96 md:h-[500px]">
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end">
            <div className="container mx-auto px-4 pb-8">
              <Link
                href="/"
                className="inline-flex items-center text-white hover:text-gray-300 mb-6"
              >
                <ArrowLeft size={16} className="mr-2" />
                Volver a eventos
              </Link>

              <div className="max-w-4xl">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-blue-600">
                    Bs. {event.price}
                  </Badge>
                  {soldPercentage > 80 && (
                    <Badge variant="destructive">
                      ¡Últimas entradas!
                    </Badge>
                  )}
                </div>

                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                  {event.title}
                </h1>

                <div className="flex flex-wrap gap-6 text-white text-lg">
                  <div className="flex items-center gap-2">
                    <Calendar size={20} />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={20} />
                    <span>{event.time} hrs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={20} />
                    <span>{event.location}, {event.city}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold mb-6">Sobre el Evento</h2>
                    <p className="text-gray-700 text-lg leading-relaxed mb-6">
                      {event.description}
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3">Detalles del Evento</h3>
                        <div className="space-y-2 text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>{event.time} hrs</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>🏙️</span>
                            <span>{event.city}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-3">Información de Ventas</h3>
                        <div className="space-y-2 text-gray-600">
                          <div className="flex items-center gap-2">
                            <DollarSign size={16} />
                            <span>Precio: Bs. {event.price}</span>
                          </div>
                          {event.maxCapacity && (
                            <>
                              <div className="flex items-center gap-2">
                                <Users size={16} />
                                <span>Capacidad: {event.maxCapacity} personas</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span>🎫</span>
                                <span>Vendidas: {event.currentSales || 0}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span>📊</span>
                                <span>Disponibles: {event.maxCapacity - (event.currentSales || 0)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Section */}
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-semibold mb-3 text-blue-800">Contacto del Organizador</h3>
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={`tel:${event.businessContact?.phone}`}
                          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                          <Phone size={16} />
                          {event.businessContact?.phone}
                        </a>
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                        >
                          <MessageCircle size={16} />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div>
                <Card className="sticky top-4">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        Bs. {event.price}
                      </div>
                      <p className="text-gray-600">por entrada</p>
                    </div>

                    {event.maxCapacity && (
                      <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Entradas vendidas</span>
                          <span>{soldPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${soldPercentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                          <span>{event.currentSales || 0} vendidas</span>
                          <span>{event.maxCapacity - (event.currentSales || 0)} disponibles</span>
                        </div>
                      </div>
                    )}

                    <Button asChild className="w-full mb-4" size="lg">
                      <Link href={`/evento/${event.id}/compra`}>
                        Comprar Entrada
                      </Link>
                    </Button>

                    <div className="text-center text-sm text-gray-600">
                      <p className="mb-2">Organizado por:</p>
                      <p className="font-semibold">{event.businessName}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
