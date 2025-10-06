'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Business, Event } from '@/types';
import { db } from '@/lib/database';

export default function EditorTicketsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');

  const loadData = async () => {
    try {
      if (user?.businessId) {
        const businessData = await db.getBusinessById(user.businessId);
        if (businessData) {
          setBusiness(businessData);
          console.log('Business loaded:', businessData.name);

          const businessEvents = await db.getEventsByBusinessId(user.businessId);
          setEvents(businessEvents);
          console.log('Events loaded:', businessEvents.length);

          if (businessEvents.length > 0) {
            setSelectedEvent(businessEvents[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'business') {
      router.push('/');
      return;
    }
    loadData();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando editor...</p>
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
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Editor de Tickets</h1>

          <Card>
            <CardHeader>
              <CardTitle>Diseño de Entradas</CardTitle>
              <CardDescription>
                Personaliza el diseño de las entradas para tus eventos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Editor de tickets en desarrollo
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
