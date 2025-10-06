'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EventCard from '@/components/EventCard';
import Carousel from '@/components/Carousel';
import { Event, CarouselImage } from '@/types';
import { db } from '@/lib/database';
import { RefreshCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const loadEvents = useCallback(async () => {
    try {
      // Cargar solo eventos aprobados y activos
      const approvedEvents = await db.getAllEvents(); // Cambiado para usar la función correcta
      const images = await db.getCarouselImages();

      console.log('🎠 CAROUSEL DEBUG:');
      console.log('- Imágenes obtenidas:', images.length);
      console.log('- Primera imagen:', images[0]);
      console.log('- Todas las imágenes:', images);

      console.log('📅 EVENTS DEBUG:');
      console.log('Loading approved events:', approvedEvents.length);
      console.log('Events loaded:', approvedEvents.map((e: Event) => ({ id: e.id, title: e.title, status: e.status })));

      setEvents(approvedEvents);
      setCarouselImages(images);
      setLastUpdate(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (error) {
      console.error('Error loading events:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Función para refrescar manualmente
  const handleRefresh = () => {
    setLoading(true);
    loadEvents();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando eventos...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Carousel */}
        <Carousel images={carouselImages} />

        {/* Events Grid */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold text-gray-900">
                Próximos Eventos Aprobados
              </h2>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  {events.length > 0 && (
                    <span>
                      {events.length} evento{events.length !== 1 ? 's' : ''} disponible{events.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {lastUpdate && (
                    <span className="ml-2">
                      • Actualizado: {lastUpdate}
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="flex items-center space-x-2"
                >
                  <RefreshCwIcon size={16} />
                  <span>Actualizar</span>
                </Button>
              </div>
            </div>

            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-6">🎪</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    No hay eventos aprobados disponibles
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Los eventos aparecerán aquí una vez que sean aprobados por nuestro equipo de administración.
                  </p>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>• Los negocios pueden crear eventos desde su panel</p>
                    <p>• Los eventos requieren aprobación administrativa</p>
                    <p>• Solo eventos aprobados se muestran públicamente</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    className="mt-6 flex items-center space-x-2 mx-auto"
                  >
                    <RefreshCwIcon size={16} />
                    <span>Verificar Nuevos Eventos</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Debug Info (solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && (
              <DebugInfo lastUpdate={lastUpdate} eventsCount={events.length} />
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              ¿Tienes una discoteca?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Únete a nuestra plataforma y promociona tus eventos
            </p>
            <div className="space-y-4">
              <a
                href="https://wa.me/59178005026?text=Hola%21%20Me%20interesa%20registrar%20mi%20discoteca%20en%20EventosDiscos.%20Me%20gustar%C3%ADa%20obtener%20información%20sobre%20cómo%20funciona%20la%20plataforma%20y%20los%20precios.%20Mi%20discoteca%20se%20llama%3A%20%5BNombre%20de%20mi%20discoteca%5D"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
              >
                Registra tu Negocio
              </a>
              <div className="text-blue-100 text-sm">
                <p>✅ Crea eventos personalizados</p>
                <p>✅ Gestiona ventas y tickets digitales</p>
                <p>✅ Alcanza más clientes</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Componente de debug simplificado (sin consultas extras)
function DebugInfo({ lastUpdate, eventsCount }: { lastUpdate: string; eventsCount: number }) {
  return (
    <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h4 className="font-semibold text-yellow-800 mb-2">🔧 Info de Desarrollo</h4>
      <div className="text-sm text-yellow-700 space-y-1">
        <p>• Eventos aprobados mostrados: {eventsCount}</p>
        <p>• Última actualización: {lastUpdate}</p>
        <p>• <em>Consultas de debug reducidas para mejor performance</em></p>
      </div>
    </div>
  );
}
