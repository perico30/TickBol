'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Business, Purchase, Event } from '@/types';
import { db } from '@/lib/database';

export default function VentasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [ticketStats, setTicketStats] = useState<{[key: string]: any}>({});

  const loadData = async () => {
    try {
      if (user?.businessId) {
        const businessData = await db.getBusinessById(user.businessId);
        setBusiness(businessData || null);

        const businessPurchases = await db.getPurchasesByBusinessId(user.businessId);
        setPurchases(businessPurchases);

        const businessEvents = await db.getEventsByBusinessId(user.businessId);
        setEvents(businessEvents);
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

  const loadTicketsForPurchase = async (purchaseId: string) => {
    try {
      const tickets = await db.getTicketsByPurchaseId(purchaseId);
      const ticketStats = { validated: 0, pending: 0, used: 0, cancelled: 0 };

      tickets.forEach((ticket: any) => {
        if (ticket.status === 'validated') ticketStats.validated++;
        else if (ticket.status === 'pending') ticketStats.pending++;
        else if (ticket.status === 'used') ticketStats.used++;
        else if (ticket.status === 'cancelled') ticketStats.cancelled++;
      });

      setTicketStats(prev => ({
        ...prev,
        [purchaseId]: ticketStats
      }));
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando ventas...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Reporte de Ventas</h1>

          <Card>
            <CardHeader>
              <CardTitle>Ventas Recientes</CardTitle>
              <CardDescription>
                Historial de compras realizadas en tus eventos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Sistema de ventas en desarrollo
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
