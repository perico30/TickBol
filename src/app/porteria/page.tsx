'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { Ticket, Event } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  QrCodeIcon,
  SearchIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UsersIcon,
  ScanIcon,
  AlertTriangleIcon,
  CameraIcon,
  RefreshCwIcon
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PorteriaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [searchCode, setSearchCode] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [searchResult, setSearchResult] = useState<{
    ticket: Ticket | null;
    event: Event | null;
    message: string;
    type: 'success' | 'warning' | 'error' | null;
  }>({ ticket: null, event: null, message: '', type: null });

  const [eventStats, setEventStats] = useState<{
    total: number;
    pending: number;
    validated: number;
    used: number;
    cancelled: number;
  }>({ total: 0, pending: 0, validated: 0, used: 0, cancelled: 0 });

  // Estados para el scanner QR (temporalmente deshabilitado)
  const [activeTab, setActiveTab] = useState('manual');

  useEffect(() => {
    if (loading) return;

    // Verificar autenticación y permisos
    if (!user) {
      router.push('/login');
      return;
    }

    // Solo usuarios de portería, admin o business pueden acceder
    if (!['porteria', 'admin', 'business'].includes(user.role)) {
      router.push('/');
      return;
    }

    // Cargar eventos activos
    let activeEvents = db.getAllEvents().filter(e => e.status === 'approved');

    // Filtrar eventos por negocio para usuarios de portería
    if (user.role === 'porteria' && user.businessId) {
      activeEvents = activeEvents.filter(e => e.businessId === user.businessId);
    }

    // Filtrar por eventos permitidos si tiene restricciones
    if (user.role === 'porteria' && user.permissions?.allowedEvents) {
      activeEvents = activeEvents.filter(e =>
        user.permissions?.allowedEvents?.includes(e.id)
      );
    }

    setEvents(activeEvents);

    if (activeEvents.length > 0 && !selectedEvent) {
      setSelectedEvent(activeEvents[0].id);
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (selectedEvent) {
      const stats = db.getEventTicketStats(selectedEvent);
      setEventStats(stats);
    }
  }, [selectedEvent]);

  const validateTicketCode = useCallback((code: string) => {
    if (!code.trim()) {
      return {
        ticket: null,
        event: null,
        message: 'Código vacío',
        type: 'warning' as const
      };
    }

    // Buscar por código de verificación o QR
    let ticket = db.getTicketByVerificationCode(code.trim());
    if (!ticket) {
      ticket = db.getTicketByQRCode(code.trim());
    }

    if (!ticket) {
      return {
        ticket: null,
        event: null,
        message: 'Código no encontrado o inválido',
        type: 'error' as const
      };
    }

    const event = db.getEventById(ticket.eventId);
    if (!event) {
      return {
        ticket: null,
        event: null,
        message: 'Evento no encontrado',
        type: 'error' as const
      };
    }

    // Verificar si el ticket corresponde al evento seleccionado
    if (selectedEvent && ticket.eventId !== selectedEvent) {
      return {
        ticket: ticket,
        event: event,
        message: `Esta entrada es para "${event.title}", no para el evento actual`,
        type: 'warning' as const
      };
    }

    // Verificar estado del ticket
    if (ticket.status === 'cancelled') {
      return {
        ticket: ticket,
        event: event,
        message: 'Ticket cancelado - No válido',
        type: 'error' as const
      };
    }

    if (ticket.status === 'used') {
      return {
        ticket: ticket,
        event: event,
        message: 'Ticket ya utilizado anteriormente',
        type: 'error' as const
      };
    }

    return {
      ticket: ticket,
      event: event,
      message: ticket.status === 'validated' ? 'Ticket ya validado' : 'Ticket válido - Listo para validar',
      type: 'success' as const
    };
  }, [selectedEvent]);

  const searchTicket = () => {
    const result = validateTicketCode(searchCode);
    setSearchResult(result);
  };

  const validateTicket = () => {
    if (!searchResult.ticket || !user) return;

    const success = db.validateTicket(searchResult.ticket.id, user.id);
    if (success) {
      setSearchResult(prev => ({
        ...prev,
        ticket: prev.ticket ? { ...prev.ticket, status: 'validated' } : null,
        message: '¡Entrada validada correctamente!',
        type: 'success'
      }));

      // Actualizar estadísticas
      if (selectedEvent) {
        const stats = db.getEventTicketStats(selectedEvent);
        setEventStats(stats);
      }
    } else {
      setSearchResult(prev => ({
        ...prev,
        message: 'Error al validar la entrada',
        type: 'error'
      }));
    }
  };

  const useTicket = () => {
    if (!searchResult.ticket || !user) return;

    const success = db.useTicket(searchResult.ticket.id);
    if (success) {
      setSearchResult(prev => ({
        ...prev,
        ticket: prev.ticket ? { ...prev.ticket, status: 'used' } : null,
        message: '¡Entrada marcada como usada!',
        type: 'success'
      }));

      // Actualizar estadísticas
      if (selectedEvent) {
        const stats = db.getEventTicketStats(selectedEvent);
        setEventStats(stats);
      }
    } else {
      setSearchResult(prev => ({
        ...prev,
        message: 'Error al marcar entrada como usada',
        type: 'error'
      }));
    }
  };

  const clearSearch = () => {
    setSearchCode('');
    setSearchResult({ ticket: null, event: null, message: '', type: null });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Pendiente</Badge>;
      case 'validated':
        return <Badge className="bg-green-100 text-green-800">Validada</Badge>;
      case 'used':
        return <Badge className="bg-gray-100 text-gray-800">Usada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  if (!user || !['porteria', 'admin', 'business'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <AlertTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
            <p className="text-gray-600">
              Solo el personal autorizado puede acceder al sistema de portería.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard de Portería
          </h1>
          <p className="text-gray-600">
            Sistema de validación de entradas digitales
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel de validación */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selector de evento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5" />
                  <span>Evento Actual</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Validación de entradas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ScanIcon className="h-5 w-5" />
                  <span>Validar Entrada</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-3">
                  <Input
                    placeholder="Código de verificación o QR"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchTicket()}
                    className="font-mono"
                  />
                  <Button onClick={searchTicket} className="flex items-center space-x-2">
                    <SearchIcon className="h-4 w-4" />
                    <span>Buscar</span>
                  </Button>
                  <Button variant="outline" onClick={clearSearch}>
                    Limpiar
                  </Button>
                </div>

                {/* Nota sobre scanner QR */}
                <Alert className="border-blue-200 bg-blue-50">
                  <CameraIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>📱 Próximamente:</strong> Funcionalidad de escáner QR con cámara estará disponible en la próxima actualización.
                    Por ahora, usa la búsqueda manual copiando/pegando el código del ticket.
                  </AlertDescription>
                </Alert>

                {/* Resultado de búsqueda */}
                {searchResult.type && (
                  <Alert className={
                    searchResult.type === 'success' ? 'border-green-200 bg-green-50' :
                    searchResult.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  }>
                    <AlertDescription>
                      {searchResult.message}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Información del ticket */}
                {searchResult.ticket && searchResult.event && (
                  <Card className="border-2 border-blue-200">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg">{searchResult.event.title}</h4>
                          {getStatusBadge(searchResult.ticket.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Sector:</p>
                            <p className="font-medium">{searchResult.ticket.sectorName}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Tipo:</p>
                            <p className="font-medium">{searchResult.ticket.ticketType}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Precio:</p>
                            <p className="font-medium">Bs. {searchResult.ticket.unitPrice}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Código:</p>
                            <p className="font-mono text-xs">{searchResult.ticket.verificationCode}</p>
                          </div>
                        </div>

                        <div className="flex space-x-3 pt-3">
                          {searchResult.ticket.status === 'pending' && (
                            <Button
                              onClick={validateTicket}
                              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                              <span>Validar Entrada</span>
                            </Button>
                          )}

                          {searchResult.ticket.status === 'validated' && (
                            <Button
                              onClick={useTicket}
                              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                            >
                              <UsersIcon className="h-4 w-4" />
                              <span>Marcar como Usada</span>
                            </Button>
                          )}

                          {searchResult.ticket.status === 'used' && (
                            <div className="flex items-center space-x-2 text-green-600">
                              <CheckCircleIcon className="h-5 w-5" />
                              <span className="font-medium">Entrada ya utilizada</span>
                            </div>
                          )}

                          {searchResult.ticket.status === 'cancelled' && (
                            <div className="flex items-center space-x-2 text-red-600">
                              <XCircleIcon className="h-5 w-5" />
                              <span className="font-medium">Entrada cancelada</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel de estadísticas */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UsersIcon className="h-5 w-5" />
                  <span>Estadísticas del Evento</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{eventStats.total}</p>
                    <p className="text-sm text-blue-600">Total</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{eventStats.pending}</p>
                    <p className="text-sm text-yellow-600">Pendientes</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{eventStats.validated}</p>
                    <p className="text-sm text-green-600">Validadas</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-600">{eventStats.used}</p>
                    <p className="text-sm text-gray-600">Usadas</p>
                  </div>
                </div>

                {eventStats.total > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progreso de validación</span>
                      <span>{Math.round((eventStats.validated + eventStats.used) / eventStats.total * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(eventStats.validated + eventStats.used) / eventStats.total * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instrucciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCodeIcon className="h-5 w-5" />
                  <span>Instrucciones</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <p className="font-medium">Para validar entradas:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600">
                    <li>🔍 Escribe o pega el código del ticket</li>
                    <li>✅ Presiona "Buscar" para verificar</li>
                    <li>🎫 Valida la entrada si es correcta</li>
                    <li>👥 Marca como "Usada" al permitir entrada</li>
                  </ol>
                </div>

                <div className="pt-3 border-t">
                  <p className="font-medium text-blue-600">💡 Consejos:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Los códigos QR contienen texto que puedes copiar</li>
                    <li>Verifica que el evento coincida</li>
                    <li>Mantén buena iluminación para leer códigos</li>
                    <li>Contacta al supervisor si hay problemas</li>
                  </ul>
                </div>

                <div className="pt-3 border-t">
                  <p className="font-medium text-red-600">⚠️ Importante:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>No validar entradas ya usadas</li>
                    <li>Verificar identidad del portador</li>
                    <li>Solo entradas del evento actual</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
