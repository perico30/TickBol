'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Event } from '@/types';
import { db } from '@/lib/database';
import { ArrowLeft, ShoppingCart, MapPin, Users, DollarSign, CreditCard, MessageCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import CroquisViewer from '@/components/CroquisViewer';

interface PurchaseData {
  name: string;
  email: string;
  phone: string;
  ci: string;
  notes: string;
}

export default function EventPurchasePage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [sectors, setSectors] = useState<any[]>([]);
  const [croquis, setCroquis] = useState<any>(null);
  const [selectedSector, setSelectedSector] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [purchaseData, setPurchaseData] = useState<PurchaseData>({
    name: '',
    email: '',
    phone: '',
    ci: '',
    notes: ''
  });

  const id = params.id as string;

  const loadEventData = async () => {
    try {
      console.log('🔍 Loading event purchase data for ID:', id);

      // Cargar evento
      const eventData = await db.getEventById(id);
      if (!eventData || eventData.status !== 'approved') {
        console.log('❌ Event not found or not approved');
        router.push('/');
        return;
      }

      setEvent(eventData);
      console.log('✅ Event loaded:', eventData.title);

      // Cargar sectores del evento
      try {
        const sectorsData = await db.getEventSectors(id);
        setSectors(sectorsData || []);
        console.log('✅ Sectors loaded:', sectorsData?.length || 0);
      } catch (error) {
        console.error('Error loading sectors:', error);
        setSectors([]);
      }

      // Cargar croquis si existe
      if (eventData.croquisId) {
        try {
          const croquisData = await db.getCroquisById(eventData.croquisId);
          setCroquis(croquisData);
          console.log('✅ Croquis loaded:', croquisData?.name);
        } catch (error) {
          console.error('Error loading croquis:', error);
          setCroquis(null);
        }
      }

    } catch (error) {
      console.error('❌ Error loading event data:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();
  }, [id, router]);

  const handleSectorSelect = (sector: any) => {
    setSelectedSector(sector);
    setSelectedSeats([]); // Limpiar selección previa
  };

  const handleSeatSelect = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const calculateTotal = () => {
    if (!selectedSector) return 0;
    return selectedSector.price * selectedSeats.length;
  };

  const handleProceedToPayment = () => {
    if (!selectedSector || selectedSeats.length === 0) {
      alert('Por favor selecciona al menos un lugar');
      return;
    }
    setShowPayment(true);
  };

  const handleCompletePurchase = async () => {
    if (!purchaseData.name || !purchaseData.email || !purchaseData.phone) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      // Crear la compra
      const purchase = {
        eventId: id,
        sectorId: selectedSector.id,
        seats: selectedSeats,
        customerData: purchaseData,
        total: calculateTotal(),
        status: 'pending_payment'
      };

      // Generar código de verificación
      const verificationCode = Math.random().toString(36).substring(2, 15).toUpperCase();

      // Mensaje de WhatsApp al negocio
      const businessMessage = `🎫 NUEVA RESERVA - EventosDiscos

📅 Evento: ${event?.title}
👤 Cliente: ${purchaseData.name}
📱 Teléfono: ${purchaseData.phone}
📧 Email: ${purchaseData.email}
🎯 Sector: ${selectedSector.name}
🪑 Lugares: ${selectedSeats.length}
💰 Total: Bs. ${calculateTotal()}
📝 Código: ${verificationCode}

${purchaseData.notes ? `📋 Notas: ${purchaseData.notes}` : ''}

⚠️ IMPORTANTE: El cliente debe transferir el monto y enviar comprobante para confirmar la reserva.`;

      const customerMessage = `🎫 RESERVA REALIZADA - EventosDiscos

¡Gracias por tu reserva!

📅 Evento: ${event?.title}
🎯 Sector: ${selectedSector.name}
🪑 Lugares reservados: ${selectedSeats.length}
💰 Total a pagar: Bs. ${calculateTotal()}
📝 Código de reserva: ${verificationCode}

📋 PASOS PARA CONFIRMAR:
1️⃣ Realiza la transferencia del monto total
2️⃣ Envía el comprobante por WhatsApp
3️⃣ Espera la confirmación del negocio
4️⃣ ¡Disfruta tu evento!

❌ IMPORTANTE: Sin comprobante de pago la reserva será cancelada en 24 horas.`;

      // URLs de WhatsApp
      const businessPhone = event?.businessContact?.whatsapp || event?.businessContact?.phone || '78005026';
      const businessWhatsApp = `https://wa.me/591${businessPhone.replace(/\D/g, '')}?text=${encodeURIComponent(businessMessage)}`;

      // Mostrar confirmación y abrir WhatsApp
      alert(`¡Reserva realizada exitosamente!

Código: ${verificationCode}

Ahora serás redirigido a WhatsApp para:
1. Notificar al negocio sobre tu reserva
2. Coordinar el pago y confirmación

¡Guarda tu código de reserva!`);

      // Abrir WhatsApp al negocio
      window.open(businessWhatsApp, '_blank');

      // Redirigir después de un momento
      setTimeout(() => {
        router.push(`/evento/${id}`);
      }, 3000);

    } catch (error) {
      console.error('Error completing purchase:', error);
      alert('Error al procesar la compra. Inténtalo nuevamente.');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando información de compra...</p>
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
            <Button asChild>
              <Link href="/">Volver al Inicio</Link>
            </Button>
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
        <div className="relative h-48 md:h-64">
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end">
            <div className="container mx-auto px-4 pb-6">
              <Link
                href={`/evento/${id}`}
                className="inline-flex items-center text-white hover:text-gray-300 mb-4"
              >
                <ArrowLeft size={16} className="mr-2" />
                Volver al evento
              </Link>
              <h1 className="text-2xl md:text-4xl font-bold text-white">
                Compra tu entrada - {event.title}
              </h1>
              <p className="text-white mt-2">
                {formatDate(event.date)} • {event.time} hrs • {event.location}
              </p>
            </div>
          </div>
        </div>

        {/* Purchasing Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Sectores disponibles */}
                <Card>
                  <CardHeader>
                    <CardTitle>Selecciona tu Sector</CardTitle>
                    <CardDescription>
                      Elige el tipo de entrada que prefieras
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sectors.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No hay sectores configurados para este evento</p>
                        <p className="text-sm text-gray-400 mt-2">Contacta al organizador para más información</p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {sectors.map((sector) => (
                          <div
                            key={sector.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedSector?.id === sector.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleSectorSelect(sector)}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full border-2"
                                  style={{ backgroundColor: sector.color }}
                                ></div>
                                <h3 className="font-semibold">{sector.name}</h3>
                              </div>
                              <Badge variant="outline">
                                Bs. {sector.price}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Users size={14} />
                                <span>Capacidad: {sector.capacity} personas</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign size={14} />
                                <span>Precio por persona: Bs. {sector.price}</span>
                              </div>
                            </div>
                            {sector.description && (
                              <p className="text-sm text-gray-600 mt-2">{sector.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Croquis y selección de lugares */}
                {selectedSector && croquis && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Selecciona tus Lugares</CardTitle>
                      <CardDescription>
                        Haz clic en las mesas/lugares disponibles del sector {selectedSector.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <CroquisViewer
                          croquis={croquis}
                          sectors={sectors}
                          showFilters={true}
                          selectedSector={selectedSector}
                          onSeatSelect={handleSeatSelect}
                          selectedSeats={selectedSeats}
                        />
                      </div>

                      {selectedSeats.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium text-blue-800 mb-2">Lugares Seleccionados:</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedSeats.map((seatId) => (
                              <Badge key={seatId} variant="outline" className="bg-white">
                                Mesa/Lugar {seatId}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Información sin croquis */}
                {selectedSector && !croquis && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Sector Seleccionado</CardTitle>
                      <CardDescription>
                        Este evento no tiene croquis configurado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-800 mb-2">
                          {selectedSector.name}
                        </h3>
                        <p className="text-blue-700">
                          Precio: Bs. {selectedSector.price} por persona
                        </p>
                        <p className="text-sm text-blue-600 mt-2">
                          Los lugares serán asignados por el organizador
                        </p>
                      </div>

                      <div className="mt-4">
                        <Label htmlFor="quantity">Cantidad de entradas</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          max={selectedSector.capacity}
                          value={selectedSeats.length || 1}
                          onChange={(e) => {
                            const quantity = parseInt(e.target.value) || 1;
                            setSelectedSeats(Array(quantity).fill('general'));
                          }}
                          className="mt-1 max-w-32"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar - Resumen de compra */}
              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Resumen de Compra</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedSector ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Sector:</span>
                            <span className="font-medium">{selectedSector.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cantidad:</span>
                            <span className="font-medium">{selectedSeats.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Precio unitario:</span>
                            <span className="font-medium">Bs. {selectedSector.price}</span>
                          </div>
                          <hr />
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span>Bs. {calculateTotal()}</span>
                          </div>
                        </div>

                        {selectedSeats.length > 0 ? (
                          <Dialog open={showPayment} onOpenChange={setShowPayment}>
                            <DialogTrigger asChild>
                              <Button
                                className="w-full"
                                size="lg"
                                onClick={handleProceedToPayment}
                              >
                                <ShoppingCart size={16} className="mr-2" />
                                Proceder al Pago
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Datos de Compra</DialogTitle>
                                <DialogDescription>
                                  Completa tus datos para finalizar la reserva
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="name">Nombre Completo *</Label>
                                  <Input
                                    id="name"
                                    value={purchaseData.name}
                                    onChange={(e) => setPurchaseData({...purchaseData, name: e.target.value})}
                                    placeholder="Tu nombre completo"
                                    className="mt-1"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="email">Email *</Label>
                                  <Input
                                    id="email"
                                    type="email"
                                    value={purchaseData.email}
                                    onChange={(e) => setPurchaseData({...purchaseData, email: e.target.value})}
                                    placeholder="tu@email.com"
                                    className="mt-1"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="phone">Teléfono/WhatsApp *</Label>
                                  <Input
                                    id="phone"
                                    value={purchaseData.phone}
                                    onChange={(e) => setPurchaseData({...purchaseData, phone: e.target.value})}
                                    placeholder="70123456"
                                    className="mt-1"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="ci">Carnet de Identidad</Label>
                                  <Input
                                    id="ci"
                                    value={purchaseData.ci}
                                    onChange={(e) => setPurchaseData({...purchaseData, ci: e.target.value})}
                                    placeholder="12345678"
                                    className="mt-1"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="notes">Notas adicionales</Label>
                                  <Textarea
                                    id="notes"
                                    value={purchaseData.notes}
                                    onChange={(e) => setPurchaseData({...purchaseData, notes: e.target.value})}
                                    placeholder="Alguna solicitud especial..."
                                    className="mt-1"
                                  />
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                  <p className="text-sm text-yellow-800">
                                    <strong>Importante:</strong> Después de confirmar serás redirigido a WhatsApp para coordinar el pago con el organizador.
                                  </p>
                                </div>

                                <Button
                                  onClick={handleCompletePurchase}
                                  className="w-full"
                                  size="lg"
                                >
                                  <MessageCircle size={16} className="mr-2" />
                                  Confirmar Reserva
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Button disabled className="w-full" size="lg">
                            Selecciona lugares
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500 mb-2">Selecciona un sector</p>
                        <p className="text-sm text-gray-400">para ver el resumen de compra</p>
                      </div>
                    )}
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
