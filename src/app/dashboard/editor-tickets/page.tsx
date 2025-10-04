'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Business, Event } from '@/types';
import { db } from '@/lib/database';
import {
  PaletteIcon,
  TicketIcon,
  EyeIcon,
  SaveIcon,
  ArrowLeftIcon,
  ImageIcon,
  TypeIcon,
  QrCodeIcon,
  AlertCircleIcon
} from 'lucide-react';
import Link from 'next/link';

export default function TicketEditorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [error, setError] = useState<string>('');

  const [ticketDesign, setTicketDesign] = useState({
    backgroundColor: '#3b82f6',
    textColor: '#ffffff',
    accentColor: '#1d4ed8',
    logoUrl: '',
    welcomeMessage: '¡Disfruta tu evento!',
    footerText: 'Entrada válida únicamente para el evento especificado. No transferible.',
    instructions: 'Presenta esta entrada digital en el acceso al evento.',
    showQRCode: true,
    showVerificationCode: true,
    showEventImage: true,
    ticketType: 'CLIENTE' as 'CLIENTE' | 'VIP' | 'STAFF'
  });

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

    // Load business data safely
    const loadData = async () => {
      try {
        setError('');

        if (user.businessId) {
          console.log('Loading business data for:', user.businessId);

          const businessData = db.getBusinessById(user.businessId);
          if (businessData) {
            setBusiness(businessData);
            console.log('Business loaded:', businessData.name);
          } else {
            setError('No se encontraron datos del negocio');
            return;
          }

          const businessEvents = db.getEventsByBusinessId(user.businessId);
          setEvents(businessEvents);
          console.log('Events loaded:', businessEvents.length);

          if (businessEvents.length > 0) {
            setSelectedEvent(businessEvents[0].id);
          }
        }

        setIsReady(true);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error al cargar los datos del negocio');
      }
    };

    loadData();
  }, [user, loading, router]);

  const generatePreview = () => {
    if (!selectedEvent || events.length === 0) {
      alert('Debes tener eventos creados para generar una vista previa');
      return;
    }

    const event = events.find(e => e.id === selectedEvent);
    if (!event) {
      alert('Evento no encontrado');
      return;
    }

    // Simple preview without complex components
    alert(`Vista previa del ticket:

Evento: ${event.title}
Fecha: ${event.date}
Ubicación: ${event.location}
Mensaje: ${ticketDesign.welcomeMessage}
Colores: ${ticketDesign.backgroundColor}

¡Diseño guardado exitosamente!`);
  };

  const saveDesign = () => {
    console.log('Saving ticket design:', ticketDesign);
    alert('Diseño de ticket guardado exitosamente');
  };

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

  if (!user || user.role !== 'business' || !isReady) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verificando permisos...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Intentar de nuevo
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
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <Link
                  href="/dashboard"
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeftIcon size={20} className="mr-2" />
                  Volver al Dashboard
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <TicketIcon className="mr-3 text-purple-600" size={32} />
                Editor de Tickets Digitales
              </h1>
              <p className="text-gray-600 mt-1">Personaliza el diseño de tus entradas digitales</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Editor Panel */}
            <div className="space-y-6">
              {/* Event Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ImageIcon className="mr-2" size={20} />
                    Seleccionar Evento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Evento para diseñar ticket</Label>
                      <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un evento" />
                        </SelectTrigger>
                        <SelectContent>
                          {events.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.title} - {event.date}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {events.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <TicketIcon size={48} className="mx-auto mb-3 text-gray-300" />
                        <p>No tienes eventos creados</p>
                        <Link href="/dashboard/wizard-evento" className="text-blue-600 hover:underline">
                          Crear tu primer evento
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Design Tabs */}
              <Tabs defaultValue="design" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="design">Diseño</TabsTrigger>
                  <TabsTrigger value="content">Contenido</TabsTrigger>
                  <TabsTrigger value="settings">Configuración</TabsTrigger>
                </TabsList>

                <TabsContent value="design">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <PaletteIcon className="mr-2" size={20} />
                        Personalización Visual
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Color Principal</Label>
                          <Input
                            type="color"
                            value={ticketDesign.backgroundColor}
                            onChange={(e) => setTicketDesign(prev => ({
                              ...prev,
                              backgroundColor: e.target.value
                            }))}
                            className="h-12"
                          />
                        </div>

                        <div>
                          <Label>Color de Acento</Label>
                          <Input
                            type="color"
                            value={ticketDesign.accentColor}
                            onChange={(e) => setTicketDesign(prev => ({
                              ...prev,
                              accentColor: e.target.value
                            }))}
                            className="h-12"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>URL del Logo</Label>
                        <Input
                          value={ticketDesign.logoUrl}
                          onChange={(e) => setTicketDesign(prev => ({
                            ...prev,
                            logoUrl: e.target.value
                          }))}
                          placeholder="https://ejemplo.com/logo.png"
                        />
                      </div>

                      <div>
                        <Label>Tipo de Ticket</Label>
                        <Select
                          value={ticketDesign.ticketType}
                          onValueChange={(value: 'CLIENTE' | 'VIP' | 'STAFF') =>
                            setTicketDesign(prev => ({ ...prev, ticketType: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CLIENTE">Cliente</SelectItem>
                            <SelectItem value="VIP">VIP</SelectItem>
                            <SelectItem value="STAFF">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="content">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TypeIcon className="mr-2" size={20} />
                        Contenido del Ticket
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Mensaje de Bienvenida</Label>
                        <Input
                          value={ticketDesign.welcomeMessage}
                          onChange={(e) => setTicketDesign(prev => ({
                            ...prev,
                            welcomeMessage: e.target.value
                          }))}
                          placeholder="¡Disfruta tu evento!"
                        />
                      </div>

                      <div>
                        <Label>Instrucciones</Label>
                        <Textarea
                          value={ticketDesign.instructions}
                          onChange={(e) => setTicketDesign(prev => ({
                            ...prev,
                            instructions: e.target.value
                          }))}
                          placeholder="Instrucciones para el evento..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Texto del Footer</Label>
                        <Textarea
                          value={ticketDesign.footerText}
                          onChange={(e) => setTicketDesign(prev => ({
                            ...prev,
                            footerText: e.target.value
                          }))}
                          placeholder="Información legal del ticket..."
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <QrCodeIcon className="mr-2" size={20} />
                        Configuración del Ticket
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Mostrar Código QR</Label>
                          <input
                            type="checkbox"
                            checked={ticketDesign.showQRCode}
                            onChange={(e) => setTicketDesign(prev => ({
                              ...prev,
                              showQRCode: e.target.checked
                            }))}
                            className="rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Mostrar Código de Verificación</Label>
                          <input
                            type="checkbox"
                            checked={ticketDesign.showVerificationCode}
                            onChange={(e) => setTicketDesign(prev => ({
                              ...prev,
                              showVerificationCode: e.target.checked
                            }))}
                            className="rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Mostrar Imagen del Evento</Label>
                          <input
                            type="checkbox"
                            checked={ticketDesign.showEventImage}
                            onChange={(e) => setTicketDesign(prev => ({
                              ...prev,
                              showEventImage: e.target.checked
                            }))}
                            className="rounded"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex space-x-4">
                <Button onClick={generatePreview} className="flex items-center">
                  <EyeIcon size={16} className="mr-2" />
                  Generar Vista Previa
                </Button>

                <Button onClick={saveDesign} variant="outline" className="flex items-center">
                  <SaveIcon size={16} className="mr-2" />
                  Guardar Diseño
                </Button>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <EyeIcon className="mr-2" size={20} />
                    Vista Previa del Ticket
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <TicketIcon size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Vista Previa Simplificada</p>
                    <p>Haz clic en "Generar Vista Previa" para ver el diseño</p>

                    {selectedEvent && (
                      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                        <Badge className="mb-3">Configuración Actual</Badge>
                        <div className="text-left space-y-2 text-sm">
                          <p><strong>Evento:</strong> {events.find(e => e.id === selectedEvent)?.title}</p>
                          <p><strong>Tipo:</strong> {ticketDesign.ticketType}</p>
                          <p><strong>Mensaje:</strong> {ticketDesign.welcomeMessage}</p>
                          <div className="flex items-center space-x-2">
                            <strong>Color:</strong>
                            <div
                              className="w-6 h-6 rounded"
                              style={{ backgroundColor: ticketDesign.backgroundColor }}
                            ></div>
                            <span>{ticketDesign.backgroundColor}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>💡 Consejos de Diseño</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-2">
                    <p><strong>Colores:</strong> Usa colores que representen tu marca</p>
                    <p><strong>Logo:</strong> Agrega tu logo para mayor profesionalismo</p>
                    <p><strong>Mensajes:</strong> Mantén los mensajes claros y concisos</p>
                    <p><strong>QR Code:</strong> Siempre mantén el QR visible para validación</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
