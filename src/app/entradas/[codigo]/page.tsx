'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { db } from '@/lib/database';
import { Purchase, Ticket, Event, Business } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MapPinIcon, PhoneIcon, DownloadIcon, QrCodeIcon, CheckCircleIcon, ClockIcon } from 'lucide-react';
import { DigitalTicket } from '@/components/DigitalTicket';

export default function TicketPortalPage() {
  const params = useParams();
  const codigo = params.codigo as string;

  const [data, setData] = useState<{
    purchase: Purchase;
    tickets: Ticket[];
    event: Event;
    business: Business;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (codigo) {
      const portalData = db.getTicketPortalData(codigo);
      if (portalData) {
        setData(portalData);
      } else {
        setError('Código de verificación no encontrado o inválido');
      }
      setLoading(false);
    }
  }, [codigo]);

  const getStatusBadge = (status: Purchase['status']) => {
    const statusConfig = {
      'pending_payment': { label: 'Pendiente de Pago', color: 'secondary' },
      'payment_submitted': { label: 'Pago Enviado', color: 'default' },
      'payment_verified': { label: 'Pago Verificado', color: 'default' },
      'completed': { label: 'Completado', color: 'default' },
      'cancelled': { label: 'Cancelado', color: 'destructive' }
    } as const;

    const config = statusConfig[status];
    return <Badge variant={config.color as any}>{config.label}</Badge>;
  };

  const downloadAllTickets = () => {
    if (!data) return;
    // Implementar descarga de todos los tickets en PDF
    console.log('Downloading all tickets...');
  };

  const sendTicketsWhatsApp = () => {
    if (!data) return;

    const message = `¡Mis entradas para ${data.event.title}!\n\nFecha: ${data.event.date}\nCódigo: ${codigo}\n\nVer entradas: ${window.location.href}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando entradas...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <QrCodeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Código no encontrado
            </h2>
            <p className="text-gray-600 mb-4">
              {error || 'El código de verificación no es válido o ha expirado.'}
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { purchase, tickets, event, business } = data;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mis Entradas Digitales
          </h1>
          <p className="text-gray-600">
            Código de verificación: <span className="font-mono font-semibold">{codigo}</span>
          </p>
        </div>

        {/* Event Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{event.title}</CardTitle>
              {getStatusBadge(purchase.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{event.date}</p>
                    <p className="text-sm text-gray-600">{event.time}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPinIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{event.location}</p>
                    <p className="text-sm text-gray-600">{event.city}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{business.name}</p>
                    <p className="text-sm text-gray-600">{business.phone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Resumen de Compra</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Cantidad de entradas:</span>
                      <span className="font-medium">{tickets.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total pagado:</span>
                      <span className="font-medium">Bs. {purchase.totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Comprador:</span>
                      <span className="font-medium">{purchase.customerName}</span>
                    </div>
                  </div>
                </div>

                {purchase.status === 'completed' && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Entradas listas para usar</span>
                  </div>
                )}

                {purchase.status === 'payment_submitted' && (
                  <div className="flex items-center space-x-2 text-yellow-600">
                    <ClockIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Verificando pago...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={downloadAllTickets} className="flex items-center space-x-2">
                <DownloadIcon className="h-4 w-4" />
                <span>Descargar PDF</span>
              </Button>

              <Button variant="outline" onClick={sendTicketsWhatsApp} className="flex items-center space-x-2">
                <PhoneIcon className="h-4 w-4" />
                <span>Enviar por WhatsApp</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Instructions */}
        {purchase.status !== 'completed' && (
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h4 className="font-medium text-blue-900 mb-2">Estado de tu compra:</h4>
              {purchase.status === 'pending_payment' && (
                <p className="text-blue-800 text-sm">
                  Realiza el pago y envía el comprobante para continuar con el proceso.
                </p>
              )}
              {purchase.status === 'payment_submitted' && (
                <p className="text-blue-800 text-sm">
                  Hemos recibido tu comprobante de pago. Estamos verificando el pago y te notificaremos por WhatsApp cuando esté listo.
                </p>
              )}
              {purchase.status === 'payment_verified' && (
                <p className="text-blue-800 text-sm">
                  ¡Pago verificado! Estamos generando tus entradas digitales. Te notificaremos cuando estén listas.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Digital Tickets */}
        {purchase.status === 'completed' && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Tus Entradas Digitales
            </h2>

            <div className="space-y-6">
              {tickets.map((ticket) => (
                <DigitalTicket
                  key={ticket.id}
                  ticket={ticket}
                  event={event}
                  business={business}
                />
              ))}
            </div>

            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Instrucciones importantes:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Presenta estas entradas digitales en la entrada del evento</li>
                <li>• Cada entrada tiene un código QR único que será escaneado</li>
                <li>• No compartas tus códigos, son de uso personal</li>
                <li>• Guarda esta página o descarga el PDF como respaldo</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
