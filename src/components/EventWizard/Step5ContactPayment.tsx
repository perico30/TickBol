'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Phone, MessageCircle, QrCode, CreditCard, Eye, Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import Image from 'next/image';
import FileUpload from '@/components/ui/file-upload';

interface Step5Props {
  data: {
    // All wizard data for preview
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    city: string;
    image: string;
    sectors: any[];
    businessContact: {
      phone: string;
      whatsapp?: string;
    };
    paymentInfo: {
      qrUrl?: string;
      instructions?: string;
    };
  };
  onUpdate: (field: string, value: { phone: string; whatsapp?: string } | { qrUrl?: string; instructions?: string }) => void;
  onFinish: () => void;
  onBack: () => void;
  loading?: boolean;
}

export default function Step5ContactPayment({ data, onUpdate, onFinish, onBack, loading }: Step5Props) {
  const [previewQr, setPreviewQr] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const updateContact = (field: string, value: string) => {
    onUpdate('businessContact', {
      ...data.businessContact,
      [field]: value
    });
  };

  const updatePayment = (field: string, value: string) => {
    onUpdate('paymentInfo', {
      ...data.paymentInfo,
      [field]: value
    });
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove any non-numeric characters and add country code if needed
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('591') ? cleaned : `591${cleaned}`;
  };

  const generateWhatsAppMessage = () => {
    return encodeURIComponent(
      `Hola! Me interesa obtener información sobre sus eventos. Vi su página web y me gustaría hacer una consulta.`
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const whatsappNumber = data.businessContact.whatsapp || data.businessContact.phone;
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${formatPhoneForWhatsApp(whatsappNumber)}?text=${generateWhatsAppMessage()}`
    : '';

  const isValid = data.businessContact.phone && (data.paymentInfo.qrUrl || data.paymentInfo.instructions);

  // Calculate event price from sectors
  const eventPrice = data.sectors.length > 0 ? data.sectors[0].basePrice || 50 : 50;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Contacto y Pagos</h2>
        <p className="text-gray-600 mt-2">
          Configura la información de contacto y métodos de pago para tu evento
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone size={20} />
              Información de Contacto
            </CardTitle>
            <CardDescription>
              Los clientes podrán contactarte directamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessPhone">Teléfono del Negocio *</Label>
              <Input
                id="businessPhone"
                value={data.businessContact.phone}
                onChange={(e) => updateContact('phone', e.target.value)}
                placeholder="78005026"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Este número aparecerá como contacto principal
              </p>
            </div>

            <div>
              <Label htmlFor="whatsappPhone">WhatsApp (opcional)</Label>
              <Input
                id="whatsappPhone"
                value={data.businessContact.whatsapp || ''}
                onChange={(e) => updateContact('whatsapp', e.target.value)}
                placeholder="Si es diferente al teléfono principal"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Si está vacío, se usará el teléfono principal
              </p>
            </div>

            {/* WhatsApp Preview */}
            {whatsappNumber && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  <MessageCircle size={16} />
                  Vista Previa WhatsApp
                </h4>
                <p className="text-sm text-green-700 mb-3">
                  Los clientes verán un botón que los llevará a WhatsApp:
                </p>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  <MessageCircle size={16} />
                  Contactar por WhatsApp
                </a>
                <p className="text-xs text-green-600 mt-2">
                  Número: +{formatPhoneForWhatsApp(whatsappNumber)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={20} />
              Información de Pagos
            </CardTitle>
            <CardDescription>
              Configura cómo los clientes pueden realizar pagos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="qrUrl">QR de Pago</Label>

              {/* File Upload Option */}
              <div className="mt-1">
                <FileUpload
                  value={data.paymentInfo.qrUrl || ''}
                  onChange={(value) => updatePayment('qrUrl', value || '')}
                  placeholder="Subir QR desde tu computadora"
                  accept="image/*"
                  maxSize={5}
                />
              </div>

              {/* URL Option */}
              <div className="relative mt-3">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">O usar URL</span>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <Input
                  id="qrUrl"
                  type="url"
                  value={data.paymentInfo.qrUrl?.startsWith('data:') ? '' : data.paymentInfo.qrUrl || ''}
                  onChange={(e) => updatePayment('qrUrl', e.target.value)}
                  placeholder="https://ejemplo.com/qr-pago.jpg"
                />
                {data.paymentInfo.qrUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPreviewQr(!previewQr)}
                  >
                    <Eye size={16} />
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Sube tu QR desde tu PC o pega una URL directa
              </p>
            </div>

            {/* QR Preview */}
            {data.paymentInfo.qrUrl && previewQr && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium mb-2">Vista Previa del QR:</h4>
                <div className="max-w-48 mx-auto">
                  <Image
                    src={data.paymentInfo.qrUrl}
                    alt="QR de Pago"
                    width={200}
                    height={200}
                    className="w-full h-auto border rounded"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="paymentInstructions">Instrucciones de Pago *</Label>
              <Textarea
                id="paymentInstructions"
                value={data.paymentInfo.instructions || ''}
                onChange={(e) => updatePayment('instructions', e.target.value)}
                placeholder="Ejemplo:&#10;1. Escanea el QR con tu banco&#10;2. Realiza el pago del monto exacto&#10;3. Envía el comprobante por WhatsApp&#10;4. Espera la confirmación"
                rows={5}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Explica paso a paso cómo realizar el pago
              </p>
            </div>

            {/* Payment Flow Preview */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <QrCode size={16} />
                Flujo de Pago para Clientes
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>1. Cliente selecciona mesas/entradas</p>
                <p>2. Ve el QR de pago e instrucciones</p>
                <p>3. Realiza el pago y sube comprobante</p>
                <p>4. Puede contactarte por WhatsApp</p>
                <p>5. Tú confirmas el pago manualmente</p>
              </div>
            </div>

            {/* Sample Payment Instructions */}
            <div>
              <Label>Instrucciones de ejemplo (click para usar):</Label>
              <div className="space-y-2 mt-2">
                {[
                  "1. Escanea el código QR con la app de tu banco\n2. Realiza la transferencia por el monto exacto\n3. Envía el comprobante de pago por WhatsApp\n4. Recibirás la confirmación en máximo 30 minutos",

                  "PASOS PARA PAGAR:\n• Transfiere el monto exacto usando el QR\n• Guarda el comprobante de transferencia\n• Envíanos el comprobante por WhatsApp\n• Tu reserva se confirmará al verificar el pago",

                  "💳 FORMAS DE PAGO:\n1. Transferencia bancaria (QR)\n2. Pago en efectivo (coordinar por WhatsApp)\n\n📱 Envía tu comprobante y datos al WhatsApp para confirmar tu reserva"
                ].map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => updatePayment('instructions', example)}
                    className="w-full text-left p-3 text-xs bg-white border rounded hover:bg-gray-50 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Final Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen Final</CardTitle>
          <CardDescription>
            Revisa la configuración antes de crear tu evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Contacto</h4>
              <div className="space-y-1 text-gray-600">
                <p>📞 {data.businessContact.phone || 'No configurado'}</p>
                <p>💬 WhatsApp disponible: {whatsappNumber ? 'Sí' : 'No'}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Pagos</h4>
              <div className="space-y-1 text-gray-600">
                <p>📱 QR configurado: {data.paymentInfo.qrUrl ? 'Sí' : 'No'}</p>
                <p>📋 Instrucciones: {data.paymentInfo.instructions ? 'Configuradas' : 'Pendientes'}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Estado</h4>
              <div className="space-y-1">
                {isValid ? (
                  <p className="text-green-600">✅ Listo para crear evento</p>
                ) : (
                  <p className="text-red-600">❌ Información incompleta</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          ← Anterior
        </Button>
        <div className="flex gap-3">
          {/* Preview Button */}
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={!data.title || !data.date || !isValid}
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <Eye size={16} className="mr-2" />
                Vista Previa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Vista Previa del Evento</DialogTitle>
                <DialogDescription>
                  Así se verá tu evento en la página principal (después de la aprobación del admin)
                </DialogDescription>
              </DialogHeader>

              {/* Event Preview Card */}
              <div className="space-y-6">
                {/* Event Card Preview */}
                <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <Image
                        src={data.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'}
                        alt={data.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute top-4 left-4">
                      <div className="bg-white/90 text-gray-800 px-3 py-1 rounded text-sm font-medium">
                        Bs. {eventPrice}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {data.title}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{data.date ? formatDate(data.date) : 'Fecha no especificada'} - {data.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{data.location}, {data.city}</span>
                      </div>
                      {data.sectors.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>{data.sectors.length} sectores configurados</span>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-700 text-sm mb-4">
                      {data.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        por Tu Negocio
                      </div>
                      <div className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                        Ver Más
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sectors Preview */}
                {data.sectors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Sectores Configurados:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {data.sectors.map((sector: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: sector.color }}
                            />
                            <span className="font-medium text-sm">{sector.name}</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            Bs. {sector.basePrice} • {sector.capacity || 'Sin límite'} personas
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Preview */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Información de Contacto:</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>📞 Teléfono: {data.businessContact.phone}</p>
                    {whatsappNumber && (
                      <p>💬 WhatsApp disponible</p>
                    )}
                    {data.paymentInfo.qrUrl && (
                      <p>📱 QR de pago configurado</p>
                    )}
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500">
                  <p className="mb-2">⚠️ Este evento será enviado para aprobación del administrador</p>
                  <p>Una vez aprobado, aparecerá públicamente en la página principal</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={onFinish}
            disabled={!isValid || loading}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Creando Evento...' : '🎉 Crear Evento'}
          </Button>
        </div>
      </div>
    </div>
  );
}
