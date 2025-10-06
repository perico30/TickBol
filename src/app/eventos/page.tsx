'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Event } from '@/types';
import { db } from '@/lib/database';
import { Calendar, MapPin, Search, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function EventosPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, selectedCity]);

  const loadEvents = async () => {
    try {
      const eventsData = await db.getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.businessName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por ciudad
    if (selectedCity) {
      filtered = filtered.filter(event => event.city === selectedCity);
    }

    setFilteredEvents(filtered);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCities = () => {
    const cities = [...new Set(events.map(event => event.city))];
    return cities.sort();
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Todos los Eventos
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Descubre los mejores eventos de entretenimiento nocturno
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Buscar eventos por nombre, descripción o discoteca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Filters */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por ciudad:
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas las ciudades</option>
                  {getCities().map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''} encontrado{filteredEvents.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Events Grid */}
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(event => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <Image
                        src={event.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'}
                        alt={event.title}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="absolute top-4 left-4">
                      <div className="bg-white/90 text-gray-800 px-3 py-1 rounded text-sm font-medium">
                        Bs. {event.price}
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                      {event.title}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{formatDate(event.date)} - {event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{event.location || event.city}</span>
                      </div>
                      {event.maxCapacity && (
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>Capacidad: {event.maxCapacity} personas</span>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                      {event.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        por {event.businessName}
                      </div>
                      <Button asChild>
                        <Link href={`/evento/${event.id}`}>
                          Ver Más
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No se encontraron eventos
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedCity
                    ? 'Intenta ajustar tus filtros de búsqueda'
                    : 'No hay eventos disponibles en este momento'
                  }
                </p>
                {(searchTerm || selectedCity) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCity('');
                    }}
                  >
                    Limpiar Filtros
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-16 bg-blue-50 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ¿Tienes una discoteca?
              </h2>
              <p className="text-gray-600 mb-6">
                Únete a nuestra plataforma y promociona tus eventos
              </p>
              <Button asChild size="lg">
                <Link href="/registro">
                  Registra tu Negocio
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
