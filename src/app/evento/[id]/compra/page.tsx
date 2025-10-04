'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Event, EventSector, Purchase, Ticket } from '@/types';
import { db } from '@/lib/database';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ShoppingCartIcon,
  QrCodeIcon,
  CreditCardIcon,
  TicketIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';

interface PurchaseData {
  // Paso 1
  acceptedTerms: boolean;

  // Paso 2
  selectedSector: EventSector | null;
  quantity: number;
  subtotal: number;
  total: number;

  // Paso 3
  selectedSeat: string;

  // Paso 4
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  paymentMethod: 'qr' | 'external';
  paymentProof: string;

  // Paso 5
  verificationCode: string;
  tickets: Ticket[];
}

const steps = [
  { number: 1, title: 'Términos', description: 'Acepta condiciones' },
  { number: 2, title: 'Selección', description: 'Sector y cantidad' },
  { number: 3, title: 'Croquis', description: 'Elige tu lugar' },
  { number: 4, title: 'Pago', description: 'Confirma compra' },
  { number: 5, title: 'Ticket', description: 'Descarga entrada' }
];

export default function CompraPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [purchaseData, setPurchaseData] = useState<PurchaseData>({
    acceptedTerms: false,
    selectedSector: null,
    quantity: 1,
    subtotal: 0,
    total: 0,
    selectedSeat: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    paymentMethod: 'qr',
    paymentProof: '',
    verificationCode: '',
    tickets: []
  });

  useEffect(() => {
    if (params.id) {
      const eventData = db.getEventById(params.id as string);
      if (eventData && eventData.status === 'approved') {
        setEvent(eventData);
      }
      setLoading(false);
    }
  }, [params.id]);

  const updatePurchaseData = (field: keyof PurchaseData, value: any) => {
    setPurchaseData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotal = (sector: EventSector, quantity: number) => {
    const subtotal = sector.basePrice * quantity;
    const total = subtotal; // Aquí podrías agregar impuestos o descuentos

    updatePurchaseData('subtotal', subtotal);
    updatePurchaseData('total', total);
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedStep1 = () => {
    return purchaseData.acceptedTerms;
  };

  const canProceedStep2 = () => {
    return purchaseData.selectedSector && purchaseData.quantity > 0;
  };

  const canProceedStep3 = () => {
    return purchaseData.selectedSeat !== '';
  };

  const canProceedStep4 = () => {
    return purchaseData.customerName && purchaseData.customerPhone &&
           (purchaseData.paymentMethod === 'external' || purchaseData.paymentProof);
  };

  const processPurchase = async () => {
    if (!event || !purchaseData.selectedSector) return;

    setProcessing(true);

    try {
      // Crear la compra
      const purchase = db.createPurchase({
        eventId: event.id,
        customerName: purchaseData.customerName,
        customerPhone: purchaseData.customerPhone,
        customerEmail: purchaseData.customerEmail,
        tickets: [],
        totalAmount: purchaseData.total,
        paymentMethod: purchaseData.paymentMethod,
        paymentProof: purchaseData.paymentProof,
        status: 'payment_submitted'
      });

      // Crear los tickets
      const ticketsData = Array.from({ length: purchaseData.quantity }, () => ({
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location,
        businessName: event.businessName,
        businessLogo: event.image,
        sectorName: purchaseData.selectedSector!.name,
        sectorColor: purchaseData.selectedSector!.color,
        quantity: 1,
        unitPrice: purchaseData.selectedSector!.basePrice,
        totalPrice: purchaseData.selectedSector!.basePrice,
        ticketType: 'CLIENTE' as const
      }));

      const tickets = db.createTicketsForPurchase(purchase.id, ticketsData);

      // Actualizar datos de compra
      updatePurchaseData('verificationCode', purchase.verificationCode);
      updatePurchaseData('tickets', tickets);

      // Enviar notificación automática por WhatsApp
      const whatsappMessage = `¡Hola ${purchaseData.customerName}!

Hemos recibido tu comprobante de pago para el evento "${event.title}".

📋 Código de verificación: ${purchase.verificationCode}
🎫 Cantidad de entradas: ${purchaseData.quantity}
💰 Total: Bs. ${purchaseData.total}

Estamos verificando tu pago. Te notificaremos en 24-48 horas cuando tus entradas estén listas.

Para ver el estado de tu compra: ${window.location.origin}/entradas/${purchase.verificationCode}

¡Gracias por tu preferencia! 🎉`;

      const whatsappUrl = `https://wa.me/591${purchaseData.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank');

      // Ir al siguiente paso
      nextStep();

    } catch (error) {
      console.error('Error procesando compra:', error);
      alert('Error al procesar la compra. Por favor, intenta nuevamente.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando proceso de compra...</p>
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

      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link
                href={`/evento/${event.id}`}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon size={20} className="mr-2" />
                Volver al evento
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Comprar Entradas
            </h1>
            <h2 className="text-xl text-gray-600">{event.title}</h2>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2
                    ${currentStep >= step.number
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 text-gray-400'
                    }
                  `}>
                    {currentStep > step.number ? (
                      <CheckIcon size={20} />
                    ) : (
                      <span className="text-sm font-semibold">{step.number}</span>
                    )}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <div className={`text-sm font-medium ${
                      currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-1 mx-4 ${
                      currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <Card className="mb-8">
            <CardContent className="p-8">
              {/* Paso 1: Términos y Condiciones */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Términos y Condiciones
                    </h3>
                    <p className="text-gray-600">
                      Lee y acepta los términos para continuar
                    </p>
                  </div>

                  <div className="bg-gray-100 p-6 rounded-lg max-h-64 overflow-y-auto">
                    <h4 className="font-semibold mb-4">Términos y Condiciones de {event.businessName}</h4>
                    <div className="space-y-3 text-sm text-gray-700">
                      <p>1. Las entradas son válidas únicamente para el evento especificado en la fecha y hora indicadas.</p>
                      <p>2. No se permiten devoluciones una vez confirmada la compra.</p>
                      <p>3. Es obligatorio presentar la entrada digital y un documento de identidad en el acceso.</p>
                      <p>4. Queda prohibido el ingreso de bebidas alcohólicas, armas, objetos cortopunzantes y sustancias ilegales.</p>
                      <p>5. El organizador se reserva el derecho de admisión.</p>
                      <p>6. En caso de cancelación del evento por causas de fuerza mayor, se procederá al reembolso.</p>
                      <p>7. El cliente autoriza el tratamiento de sus datos personales conforme a la Ley de Protección de Datos.</p>
                      <p>8. Cualquier reclamo debe realizarse dentro de las 24 horas posteriores al evento.</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={purchaseData.acceptedTerms}
                      onChange={(e) => updatePurchaseData('acceptedTerms', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                      Acepto los términos y condiciones
                    </label>
                  </div>
                </div>
              )}

              {/* Paso 2: Selección de Sector y Cantidad */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Selecciona tu Sector
                    </h3>
                    <p className="text-gray-600">
                      Elige el sector y cantidad de entradas
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {event.sectors.map((sector) => (
                      <div
                        key={sector.id}
                        className={`
                          border rounded-lg p-4 cursor-pointer transition-all
                          ${purchaseData.selectedSector?.id === sector.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                        onClick={() => {
                          updatePurchaseData('selectedSector', sector);
                          calculateTotal(sector, purchaseData.quantity);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: sector.color }}
                            />
                            <div>
                              <h4 className="font-semibold">{sector.name}</h4>
                              <p className="text-sm text-gray-600">
                                Capacidad: {sector.capacity} personas
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              Bs. {sector.basePrice}
                            </div>
                            <div className="text-sm text-gray-600">por entrada</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {purchaseData.selectedSector && (
                    <div className="border-t pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="quantity">Cantidad de entradas</Label>
                          <Select
                            value={purchaseData.quantity.toString()}
                            onValueChange={(value) => {
                              const qty = parseInt(value);
                              updatePurchaseData('quantity', qty);
                              calculateTotal(purchaseData.selectedSector!, qty);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num} entrada{num > 1 ? 's' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>Bs. {purchaseData.subtotal}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span>Bs. {purchaseData.total}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Paso 3: Croquis Interactivo */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Selecciona tu Lugar
                    </h3>
                    <p className="text-gray-600">
                      Elige tu mesa o asiento en el croquis
                    </p>
                  </div>

                  <div className="bg-gray-100 p-6 rounded-lg">
                    <div className="text-center mb-4">
                      <h4 className="font-semibold">Croquis del Evento</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Sector seleccionado: {purchaseData.selectedSector?.name}
                      </p>
                    </div>

                    {/* Simulación de croquis */}
                    <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
                      {Array.from({ length: 16 }, (_, i) => {
                        const seatId = `seat-${i + 1}`;
                        const isSelected = purchaseData.selectedSeat === seatId;
                        const isAvailable = Math.random() > 0.3; // Simulación de disponibilidad

                        return (
                          <button
                            key={seatId}
                            disabled={!isAvailable}
                            onClick={() => updatePurchaseData('selectedSeat', seatId)}
                            className={`
                              h-12 w-12 rounded border-2 text-xs font-semibold
                              ${isSelected
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : isAvailable
                                ? 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 border-red-300 text-red-800 cursor-not-allowed'
                              }
                            `}
                          >
                            {i + 1}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-center space-x-6 mt-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                        <span>Libre</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-600 border border-blue-600 rounded"></div>
                        <span>Seleccionado</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                        <span>No disponible</span>
                      </div>
                    </div>
                  </div>

                  {purchaseData.selectedSeat && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900">Lugar seleccionado:</h4>
                      <p className="text-blue-800">
                        Mesa/Asiento: {purchaseData.selectedSeat.replace('seat-', 'Mesa ')}
                      </p>
                      <p className="text-blue-800">
                        Sector: {purchaseData.selectedSector?.name}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Paso 4: Pago */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Información de Pago
                    </h3>
                    <p className="text-gray-600">
                      Completa tus datos y realiza el pago
                    </p>
                  </div>

                  {/* Resumen de compra */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-semibold mb-4">Resumen de tu compra</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Evento:</span>
                        <span className="font-medium">{event.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fecha:</span>
                        <span>{event.date} - {event.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lugar:</span>
                        <span>{event.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sector:</span>
                        <span>{purchaseData.selectedSector?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mesa/Asiento:</span>
                        <span>{purchaseData.selectedSeat.replace('seat-', 'Mesa ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cantidad:</span>
                        <span>{purchaseData.quantity} entrada(s)</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>Bs. {purchaseData.total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Datos del cliente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Nombre Completo *</Label>
                      <Input
                        id="customerName"
                        value={purchaseData.customerName}
                        onChange={(e) => updatePurchaseData('customerName', e.target.value)}
                        placeholder="Tu nombre completo"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone">Teléfono *</Label>
                      <Input
                        id="customerPhone"
                        value={purchaseData.customerPhone}
                        onChange={(e) => updatePurchaseData('customerPhone', e.target.value)}
                        placeholder="Ej: 78123456"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={purchaseData.customerEmail}
                      onChange={(e) => updatePurchaseData('customerEmail', e.target.value)}
                      placeholder="tu@email.com"
                    />
                  </div>

                  {/* Métodos de pago */}
                  <div>
                    <h4 className="font-semibold mb-4">Método de Pago</h4>
                    <div className="space-y-4">
                      {event.paymentInfo?.qrUrl && (
                        <div
                          className={`border rounded-lg p-4 cursor-pointer ${
                            purchaseData.paymentMethod === 'qr' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                          onClick={() => updatePurchaseData('paymentMethod', 'qr')}
                        >
                          <div className="flex items-center space-x-3 mb-4">
                            <QrCodeIcon className="h-5 w-5" />
                            <span className="font-medium">Pago con QR</span>
                          </div>

                          {purchaseData.paymentMethod === 'qr' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="text-center">
                                <Image
                                  src={event.paymentInfo.qrUrl}
                                  alt="QR de Pago"
                                  width={200}
                                  height={200}
                                  className="mx-auto"
                                />
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-3">
                                  {event.paymentInfo.instructions}
                                </p>
                                <div className="bg-blue-100 p-3 rounded">
                                  <p className="text-blue-800 font-semibold">
                                    Total a pagar: Bs. {purchaseData.total}
                                  </p>
                                </div>

                                <div className="mt-4">
                                  <Label>Subir Comprobante *</Label>
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        // En implementación real, subirías a un servidor
                                        updatePurchaseData('paymentProof', URL.createObjectURL(file));
                                      }
                                    }}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div
                        className={`border rounded-lg p-4 cursor-pointer ${
                          purchaseData.paymentMethod === 'external' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => updatePurchaseData('paymentMethod', 'external')}
                      >
                        <div className="flex items-center space-x-3">
                          <CreditCardIcon className="h-5 w-5" />
                          <span className="font-medium">Pago en Línea</span>
                          <Badge variant="outline">Próximamente</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Paga con tarjeta de crédito o débito
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 5: Ticket Digital */}
              {currentStep === 5 && (
                <div className="space-y-6 text-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      ¡Compra Realizada!
                    </h3>
                    <p className="text-gray-600">
                      Tu solicitud de compra ha sido enviada
                    </p>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg text-left">
                    <h4 className="font-semibold text-blue-900 mb-3">Código de Verificación:</h4>
                    <p className="text-2xl font-mono font-bold text-blue-900 mb-4">
                      {purchaseData.verificationCode}
                    </p>
                    <p className="text-blue-800 text-sm mb-4">
                      Guarda este código. Te hemos enviado un mensaje por WhatsApp con toda la información.
                    </p>
                    <div className="space-y-2 text-sm">
                      <p><strong>Próximos pasos:</strong></p>
                      <p>1. El organizador verificará tu pago en 24-48 horas</p>
                      <p>2. Recibirás un WhatsApp cuando tus entradas estén listas</p>
                      <p>3. Podrás descargar tus tickets digitales</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild>
                      <Link href={`/entradas/${purchaseData.verificationCode}`}>
                        <TicketIcon className="h-4 w-4 mr-2" />
                        Ver Estado de Compra
                      </Link>
                    </Button>

                    <Button variant="outline" asChild>
                      <Link href="/">
                        Volver al Inicio
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          {currentStep < 5 && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center space-x-2"
              >
                <ArrowLeftIcon size={16} />
                <span>Anterior</span>
              </Button>

              {currentStep === 4 ? (
                <Button
                  onClick={processPurchase}
                  disabled={!canProceedStep4() || processing}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <ShoppingCartIcon size={16} />
                  <span>{processing ? 'Procesando...' : 'Confirmar Compra'}</span>
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !canProceedStep1()) ||
                    (currentStep === 2 && !canProceedStep2()) ||
                    (currentStep === 3 && !canProceedStep3())
                  }
                  className="flex items-center space-x-2"
                >
                  <span>Siguiente</span>
                  <ArrowRightIcon size={16} />
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
