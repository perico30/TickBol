'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, ClockIcon, MapPinIcon, ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import FileUpload from '@/components/ui/file-upload';

interface Step1Props {
  data: {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    city: string;
    image: string;
  };
  onUpdate: (field: string, value: string) => void;
  onNext: () => void;
}

interface ValidationErrors {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  city?: string;
  image?: string;
}

export default function Step1BasicInfo({ data, onUpdate, onNext }: Step1Props) {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showErrors, setShowErrors] = useState(false);

  const validateStep = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Validar título
    if (!data.title || data.title.trim().length < 5) {
      newErrors.title = 'El título debe tener al menos 5 caracteres';
    } else if (data.title.length > 100) {
      newErrors.title = 'El título no puede exceder 100 caracteres';
    }

    // Validar descripción
    if (!data.description || data.description.trim().length === 0) {
      newErrors.description = 'La descripción es obligatoria';
    } else if (data.description.length > 500) {
      newErrors.description = 'La descripción no puede exceder 500 caracteres';
    }

    // Validar fecha
    if (!data.date) {
      newErrors.date = 'La fecha es obligatoria';
    } else {
      // Crear fecha usando los componentes para evitar problemas de zona horaria
      const dateParts = data.date.split('-');
      const selectedDate = new Date(
        parseInt(dateParts[0]), // año
        parseInt(dateParts[1]) - 1, // mes (0-indexado)
        parseInt(dateParts[2]) // día
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalizar a medianoche

      if (selectedDate < today) {
        newErrors.date = 'La fecha debe ser hoy o en el futuro';
      }

      // Verificar que no sea más de 1 año en el futuro
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      oneYearFromNow.setHours(0, 0, 0, 0);
      if (selectedDate > oneYearFromNow) {
        newErrors.date = 'La fecha no puede ser más de 1 año en el futuro';
      }
    }

    // Validar hora
    if (!data.time) {
      newErrors.time = 'La hora es obligatoria';
    } else {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(data.time)) {
        newErrors.time = 'Formato de hora inválido (HH:MM)';
      }
    }

    // Validar ciudad
    if (!data.city || data.city.trim().length < 2) {
      newErrors.city = 'La ciudad es obligatoria (mínimo 2 caracteres)';
    } else if (data.city.length > 50) {
      newErrors.city = 'La ciudad no puede exceder 50 caracteres';
    }

    // Validar imagen (opcional)
    if (data.image && data.image.trim()) {
      // Aceptar base64 (imágenes subidas desde PC) sin restricciones
      if (data.image.startsWith('data:image/')) {
        // Las imágenes base64 subidas desde PC son siempre válidas
        // El backend se encargará de manejar el tamaño si es necesario
        console.log('✅ Imagen subida desde PC - válida');
      } else {
        // Verificar si es una URL válida
        try {
          const url = new URL(data.image);
          if (!['http:', 'https:'].includes(url.protocol)) {
            newErrors.image = 'La URL de la imagen debe usar http:// o https://';
          }
          // Verificar que la URL no sea demasiado larga
          if (data.image.length > 500) {
            newErrors.image = 'La URL de la imagen es demasiado larga (máximo 500 caracteres)';
          }
        } catch {
          // Si no es URL ni base64, es inválida
          newErrors.image = 'Debe ser una URL válida o subir una imagen desde tu dispositivo';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    setShowErrors(true);
    if (validateStep()) {
      onNext();
    }
  };

  const getFieldError = (field: keyof ValidationErrors) => {
    return showErrors && errors[field] ? errors[field] : '';
  };

  const isFieldInvalid = (field: keyof ValidationErrors) => {
    return showErrors && !!errors[field];
  };

  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (value: string) => {
    onUpdate('date', value);
    // Limpiar error al cambiar
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: undefined }));
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    onUpdate(field, value);
    // Limpiar error al cambiar
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Información Básica</h2>
        <p className="text-gray-600 mt-2">
          Proporciona los detalles principales de tu evento
        </p>
      </div>

      {/* Mostrar resumen de errores si hay alguno */}
      {showErrors && Object.keys(errors).length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-medium text-red-800 mb-2">Por favor corrige los siguientes errores:</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Información del Evento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon size={20} />
              Detalles del Evento
            </CardTitle>
            <CardDescription>
              Información principal que verán los asistentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título del Evento *</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Ej: Noche Electrónica - Año Nuevo 2025"
                className={`mt-1 ${isFieldInvalid('title') ? 'border-red-500 bg-red-50' : ''}`}
                maxLength={100}
              />
              {getFieldError('title') && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {getFieldError('title')}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {data.title.length}/100 caracteres
              </p>
            </div>

            <div>
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={data.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Describe tu evento: música, ambiente, atracciones especiales..."
                rows={4}
                className={`mt-1 ${isFieldInvalid('description') ? 'border-red-500 bg-red-50' : ''}`}
                maxLength={500}
              />
              {getFieldError('description') && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {getFieldError('description')}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {data.description.length}/500 caracteres
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fecha, Hora y Ubicación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinIcon size={20} />
              Fecha y Ubicación
            </CardTitle>
            <CardDescription>
              Cuándo y dónde se realizará el evento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formatDateForInput(data.date)}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className={`mt-1 ${isFieldInvalid('date') ? 'border-red-500 bg-red-50' : ''}`}
                  min={new Date().toISOString().split('T')[0]}
                />
                {getFieldError('date') && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {getFieldError('date')}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="time">Hora *</Label>
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    id="time"
                    type="time"
                    value={data.time}
                    onChange={(e) => handleFieldChange('time', e.target.value)}
                    className={`mt-1 pl-10 ${isFieldInvalid('time') ? 'border-red-500 bg-red-50' : ''}`}
                  />
                </div>
                {getFieldError('time') && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {getFieldError('time')}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={data.location}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                placeholder="Ej: Av. Las Américas #123, Club Paradise"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Dirección específica del evento
              </p>
            </div>

            <div>
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                value={data.city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                placeholder="Ej: Santa Cruz"
                className={`mt-1 ${isFieldInvalid('city') ? 'border-red-500 bg-red-50' : ''}`}
                maxLength={50}
              />
              {getFieldError('city') && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {getFieldError('city')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Imagen del Evento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon size={20} />
            Imagen del Evento
          </CardTitle>
          <CardDescription>
            Sube una imagen atractiva que represente tu evento (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FileUpload
              value={data.image}
              onChange={(value) => handleFieldChange('image', value || '')}
              placeholder="Sube una imagen desde tu computadora"
              accept="image/*"
              maxSize={5}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">O usar URL</span>
              </div>
            </div>

            <div>
              <Input
                type="url"
                value={data.image?.startsWith('data:') ? '' : data.image || ''}
                onChange={(e) => handleFieldChange('image', e.target.value)}
                placeholder="https://ejemplo.com/imagen-evento.jpg"
                className={isFieldInvalid('image') ? 'border-red-500 bg-red-50' : ''}
              />
              {getFieldError('image') && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {getFieldError('image')}
                </p>
              )}
            </div>

            {/* Mensaje de éxito para imagen subida */}
            {data.image && data.image.startsWith('data:image/') && !getFieldError('image') && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">¡Imagen subida correctamente desde tu PC!</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  La imagen se procesará automáticamente al crear el evento.
                </p>
              </div>
            )}

            {/* Vista previa de imagen */}
            {data.image && !getFieldError('image') && (
              <div className="mt-4">
                <Label>Vista Previa:</Label>
                <div className="mt-2 border rounded-lg overflow-hidden">
                  <img
                    src={data.image}
                    alt="Vista previa"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      // Solo mostrar error para URLs, no para imágenes subidas
                      if (!data.image?.startsWith('data:image/')) {
                        setErrors(prev => ({ ...prev, image: 'Error al cargar la imagen desde la URL' }));
                      }
                    }}
                  />
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              <p>• Formatos soportados: JPG, PNG, GIF</p>
              <p>• Tamaño máximo: 5MB</p>
              <p>• Resolución recomendada: 1200x600 píxeles</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navegación */}
      <div className="flex justify-end pt-6 border-t">
        <Button
          onClick={handleNext}
          size="lg"
          disabled={showErrors && Object.keys(errors).length > 0}
          className={showErrors && Object.keys(errors).length > 0 ? 'opacity-50 cursor-not-allowed' : ''}
        >
          Siguiente →
        </Button>
      </div>

      {/* Indicador de campos requeridos */}
      <p className="text-xs text-gray-500 text-center">
        Los campos marcados con * son obligatorios
      </p>
    </div>
  );
}
