'use client';

import { useState, useEffect, useRef } from 'react';
import { Ticket, Event, Business } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DownloadIcon, CalendarIcon, MapPinIcon, ClockIcon, UserIcon, HashIcon } from 'lucide-react';
import QRCode from 'qrcode';
import Image from 'next/image';

interface DigitalTicketProps {
  ticket: Ticket;
  event: Event;
  business: Business;
}

export function DigitalTicket({ ticket, event, business }: DigitalTicketProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generar QR code con mayor resolución
    QRCode.toDataURL(ticket.qrCode, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error('Error generating QR code:', err);
    });
  }, [ticket.qrCode]);

  const getTicketTypeColor = (type: string) => {
    switch (type) {
      case 'VIP': return 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500';
      case 'STAFF': return 'bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700';
      default: return 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700';
    }
  };

  const getTicketTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'VIP': return 'bg-yellow-500 text-white';
      case 'STAFF': return 'bg-purple-600 text-white';
      default: return 'bg-blue-600 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadTicket = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && ticketRef.current) {
      const ticketHTML = ticketRef.current.outerHTML;
      printWindow.document.write(`
        <html>
          <head>
            <title>Entrada Digital - ${event.title}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: 'Arial', sans-serif;
                background: #f5f5f5;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              .ticket-container {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                max-width: 400px;
                width: 100%;
              }
              @media print {
                body {
                  margin: 0;
                  background: white;
                }
                .ticket-container {
                  box-shadow: none;
                  break-inside: avoid;
                }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="ticket-container">
              ${ticketHTML}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <Card
        ref={ticketRef}
        className="overflow-hidden bg-white shadow-xl border-0 ticket-card"
      >
        {/* Header con imagen del evento */}
        <div className={`${getTicketTypeColor(ticket.ticketType)} relative overflow-hidden`}>
          {/* Imagen de fondo del evento */}
          <div className="absolute inset-0 opacity-20">
            <Image
              src={event.image}
              alt={event.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-transparent" />

          {/* Contenido del header */}
          <div className="relative z-10 p-6 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold leading-tight mb-2">
                  {event.title}
                </h1>
                <p className="text-white/90 text-sm font-medium">
                  {event.description}
                </p>
              </div>

              {/* Logo del evento/negocio en header */}
              <div className="ml-4 flex-shrink-0">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white font-bold text-sm">
                    {business.name.charAt(0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Información básica del evento */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-white/90">
                <CalendarIcon size={16} />
                <span>{formatDate(event.date)} - {event.time}</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <MapPinIcon size={16} />
                <span>{event.location}, {event.city}</span>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {/* Información del ticket */}
          <div className="p-6 bg-white">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {business.name}
              </h3>
              <p className="text-gray-600 text-sm">
                Te invita a este increíble evento
              </p>
            </div>

            {/* Detalles del ticket */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">Sector</div>
                  <div className="font-semibold flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ticket.sectorColor }}
                    />
                    {ticket.sectorName}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Cantidad</div>
                  <div className="font-semibold">{ticket.quantity} entrada(s)</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Precio Total</div>
                  <div className="font-semibold">Bs. {ticket.totalPrice}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Código</div>
                  <div className="font-semibold font-mono text-xs">
                    {ticket.verificationCode}
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code prominente */}
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="w-32 h-32 mx-auto"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Generando QR...</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Presenta este código QR en el evento
              </p>
            </div>

            {/* Tipo de ticket como badge */}
            <div className="text-center mb-6">
              <Badge
                className={`${getTicketTypeBadgeColor(ticket.ticketType)} px-4 py-2 text-sm font-bold`}
              >
                {ticket.ticketType}
              </Badge>
            </div>
          </div>

          {/* Footer con logo del negocio */}
          <div className="bg-gray-900 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {business.name.split(' ').map(word => word.charAt(0)).join('').slice(0, 2)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-sm">{business.name}</div>
                  <div className="text-white/70 text-xs">{business.phone}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/70 text-xs">Entrada Digital</div>
                <div className="text-white/70 text-xs">Válida por única vez</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón de descarga */}
      <div className="mt-4 text-center no-print">
        <Button
          onClick={downloadTicket}
          className="w-full"
          size="lg"
        >
          <DownloadIcon size={16} className="mr-2" />
          Descargar / Imprimir Ticket
        </Button>
      </div>
    </div>
  );
}
