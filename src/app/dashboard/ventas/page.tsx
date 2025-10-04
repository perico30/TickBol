'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Purchase, Event, Business } from '@/types';
import { db } from '@/lib/database';
import {
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  MessageCircleIcon,
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  DollarSignIcon,
  ClockIcon,
  ArrowLeftIcon
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function BusinessVentasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'business') {
      router.push('/');
      return;
    }

    loadData();
  }, [user, loading, router]);

  const loadData = () => {
    if (!user?.businessId) return;

    // Cargar datos del negocio
    const businessData = db.getBusinessById(user.businessId);
    setBusiness(businessData || null);

    // Cargar compras del negocio
    const businessPurchases = db.getPurchasesByBusinessId(user.businessId);
    setPurchases(businessPurchases);

    // Cargar eventos del negocio
    const businessEvents = db.getEventsByBusinessId(user.businessId);
    setEvents(businessEvents);

    setLoadingData(false);
  };

  const getStatusBadge = (status: Purchase['status']) => {
    const statusConfig = {
      'pending_payment': { label: 'Pendiente Pago', color: 'secondary', icon: ClockIcon },
      'payment_submitted': { label: 'Pago Enviado', color: 'default', icon: CreditCardIcon },
      'payment_verified': { label: 'Pago Verificado', color: 'default', icon: CheckCircleIcon },
      'completed': { label: 'Completado', color: 'default', icon: CheckCircleIcon },
      'cancelled': { label: 'Cancelado', color: 'destructive', icon: XCircleIcon }
    } as const;

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.color as any} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const verifyPayment = (purchaseId: string) => {
    db.updatePurchaseStatus(purchaseId, 'payment_verified');

    const purchase = purchases.find(p => p.id === purchaseId);
    if (purchase) {
      // Crear tickets completados
      const tickets = db.getTicketsByPurchaseId(purchaseId);
      tickets.forEach(ticket => {
        db.validateTicket(ticket.id, user?.id || '');
      });

      // Marcar como completado
      db.updatePurchaseStatus(purchaseId, 'completed');
      db.updatePurchaseNotification(purchaseId, 'paymentVerified');
      db.updatePurchaseNotification(purchaseId, 'ticketsReady');

      // Enviar notificación WhatsApp
      sendPaymentApprovedWhatsApp(purchase);

      loadData();
    }
  };

  const rejectPayment = (purchaseId: string) => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (purchase) {
      const reason = prompt('Motivo del rechazo:');
      if (reason) {
        db.updatePurchaseStatus(purchaseId, 'cancelled');
        sendPaymentRejectedWhatsApp(purchase, reason);
        loadData();
      }
    }
  };

  const sendPaymentApprovedWhatsApp = (purchase: Purchase) => {
    const event = events.find(e => e.id === purchase.eventId);
    if (!event) return;

    const message = `¡Hola ${purchase.customerName}! 🎉

✅ ¡Tu pago ha sido VERIFICADO exitosamente!

🎫 Tus entradas digitales ya están listas:
• Evento: ${event.title}
• Fecha: ${event.date}
• Cantidad: ${purchase.tickets.length} entrada(s)
• Total: Bs. ${purchase.totalAmount}

🔗 Ver y descargar entradas:
${window.location.origin}/entradas/${purchase.verificationCode}

📱 Guarda este link, lo necesitarás en la entrada del evento.

¡Nos vemos en el evento! 🎊`;

    const whatsappUrl = `https://wa.me/591${purchase.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

    if (confirm(`¿Enviar notificación de pago aprobado a ${purchase.customerName}?`)) {
      window.open(whatsappUrl, '_blank');
    }
  };

  const sendPaymentRejectedWhatsApp = (purchase: Purchase, reason: string) => {
    const event = events.find(e => e.id === purchase.eventId);
    if (!event) return;

    const message = `Hola ${purchase.customerName},

❌ Lamentablemente tu pago para el evento "${event.title}" ha sido rechazado.

Motivo: ${reason}

Puedes:
1. Verificar tu comprobante de pago
2. Realizar una nueva transferencia
3. Contactarnos para aclarar cualquier duda

Código de referencia: ${purchase.verificationCode}

Contáctanos si tienes alguna pregunta.`;

    const whatsappUrl = `https://wa.me/591${purchase.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

    if (confirm(`¿Enviar notificación de rechazo a ${purchase.customerName}?`)) {
      window.open(whatsappUrl, '_blank');
    }
  };

  const openPurchaseDetails = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowDetailsModal(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || loadingData) {
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

  const pendingPayments = purchases.filter(p => p.status === 'payment_submitted');
  const verifiedPayments = purchases.filter(p => p.status === 'payment_verified');
  const completedPurchases = purchases.filter(p => p.status === 'completed');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon size={20} className="mr-2" />
                Volver al Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Ventas
            </h1>
            <p className="text-gray-600">
              Administra las compras de entradas para tus eventos
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-yellow-600 mb-2">
                  {pendingPayments.length}
                </div>
                <div className="text-sm text-gray-600">Pagos Pendientes</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {verifiedPayments.length}
                </div>
                <div className="text-sm text-gray-600">Pagos Verificados</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {completedPurchases.length}
                </div>
                <div className="text-sm text-gray-600">Completadas</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  Bs. {purchases.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.totalAmount, 0)}
                </div>
                <div className="text-sm text-gray-600">Ingresos Totales</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending">
                Pagos Pendientes ({pendingPayments.length})
              </TabsTrigger>
              <TabsTrigger value="verified">
                Verificados ({verifiedPayments.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completadas ({completedPurchases.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Payments */}
            <TabsContent value="pending">
              <div className="space-y-4">
                {pendingPayments.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <CreditCardIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay pagos pendientes
                      </h3>
                      <p className="text-gray-600">
                        Todas las compras han sido procesadas.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  pendingPayments.map((purchase) => (
                    <PurchaseCard
                      key={purchase.id}
                      purchase={purchase}
                      events={events}
                      onVerify={() => verifyPayment(purchase.id)}
                      onReject={() => rejectPayment(purchase.id)}
                      onViewDetails={() => openPurchaseDetails(purchase)}
                      showActions={true}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="verified">
              <div className="space-y-4">
                {verifiedPayments.map((purchase) => (
                  <PurchaseCard
                    key={purchase.id}
                    purchase={purchase}
                    events={events}
                    onViewDetails={() => openPurchaseDetails(purchase)}
                    showActions={false}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="space-y-4">
                {completedPurchases.map((purchase) => (
                  <PurchaseCard
                    key={purchase.id}
                    purchase={purchase}
                    events={events}
                    onViewDetails={() => openPurchaseDetails(purchase)}
                    showActions={false}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Purchase Details Modal */}
          <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Detalles de la Compra</DialogTitle>
                <DialogDescription>
                  Información completa de la compra y comprobante de pago
                </DialogDescription>
              </DialogHeader>

              {selectedPurchase && (
                <div className="space-y-6">
                  {/* Purchase Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Información del Cliente</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                            <span>{selectedPurchase.customerName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <PhoneIcon className="h-4 w-4 text-gray-500" />
                            <span>{selectedPurchase.customerPhone}</span>
                          </div>
                          {selectedPurchase.customerEmail && (
                            <div className="flex items-center space-x-2">
                              <span>✉️</span>
                              <span>{selectedPurchase.customerEmail}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Detalles de la Compra</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4 text-gray-500" />
                            <span>{formatDate(selectedPurchase.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSignIcon className="h-4 w-4 text-gray-500" />
                            <span>Bs. {selectedPurchase.totalAmount}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>🎫</span>
                            <span>{selectedPurchase.tickets.length} entrada(s)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>📋</span>
                            <span className="font-mono">{selectedPurchase.verificationCode}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Comprobante de Pago</h4>
                      {selectedPurchase.paymentProof && (
                        <div className="border rounded-lg p-2">
                          <Image
                            src={selectedPurchase.paymentProof}
                            alt="Comprobante de pago"
                            width={300}
                            height={400}
                            className="w-full h-auto max-h-64 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {selectedPurchase.status === 'payment_submitted' && (
                    <div className="flex space-x-4 pt-4 border-t">
                      <Button
                        onClick={() => {
                          verifyPayment(selectedPurchase.id);
                          setShowDetailsModal(false);
                        }}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        <span>Aprobar Pago</span>
                      </Button>

                      <Button
                        onClick={() => {
                          rejectPayment(selectedPurchase.id);
                          setShowDetailsModal(false);
                        }}
                        variant="destructive"
                        className="flex items-center space-x-2"
                      >
                        <XCircleIcon className="h-4 w-4" />
                        <span>Rechazar Pago</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Purchase Card Component
function PurchaseCard({
  purchase,
  events,
  onVerify,
  onReject,
  onViewDetails,
  showActions
}: {
  purchase: Purchase;
  events: Event[];
  onVerify?: () => void;
  onReject?: () => void;
  onViewDetails: () => void;
  showActions: boolean;
}) {
  const event = events.find(e => e.id === purchase.eventId);

  const getStatusBadge = (status: Purchase['status']) => {
    const statusConfig = {
      'pending_payment': { label: 'Pendiente Pago', color: 'secondary' },
      'payment_submitted': { label: 'Pago Enviado', color: 'default' },
      'payment_verified': { label: 'Pago Verificado', color: 'default' },
      'completed': { label: 'Completado', color: 'default' },
      'cancelled': { label: 'Cancelado', color: 'destructive' }
    } as const;

    const config = statusConfig[status];
    return <Badge variant={config.color as any}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <h3 className="text-lg font-semibold">{purchase.customerName}</h3>
              {getStatusBadge(purchase.status)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Evento:</p>
                <p className="font-medium">{event?.title || 'Evento no encontrado'}</p>
              </div>

              <div>
                <p className="text-gray-600">Total:</p>
                <p className="font-medium">Bs. {purchase.totalAmount}</p>
              </div>

              <div>
                <p className="text-gray-600">Código:</p>
                <p className="font-mono text-xs">{purchase.verificationCode}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={onViewDetails}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <EyeIcon className="h-4 w-4" />
              <span>Ver Detalles</span>
            </Button>

            {showActions && onVerify && onReject && (
              <>
                <Button
                  onClick={onVerify}
                  size="sm"
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Aprobar</span>
                </Button>

                <Button
                  onClick={onReject}
                  variant="destructive"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <XCircleIcon className="h-4 w-4" />
                  <span>Rechazar</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
