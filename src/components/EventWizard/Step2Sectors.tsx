'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, Trash2Icon, Users, DollarSign, Palette, AlertCircle, CheckCircle } from 'lucide-react';

interface EventSector {
  id: string;
  name: string;
  color: string;
  capacity: number;
  priceType: 'per_seat' | 'per_table';
  basePrice: number;
  isActive: boolean;
}

interface Step2Props {
  data: {
    sectors: EventSector[];
  };
  onUpdate: (field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ValidationErrors {
  general?: string;
  sectors?: { [key: string]: string };
}

interface SectorErrors {
  name?: string;
  capacity?: string;
  basePrice?: string;
  color?: string;
  priceType?: string;
}

export default function Step2Sectors({ data, onUpdate, onNext, onBack }: Step2Props) {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showErrors, setShowErrors] = useState(false);

  const colorOptions = [
    { value: '#FF6B6B', label: 'Rojo Coral', color: '#FF6B6B' },
    { value: '#4ECDC4', label: 'Turquesa', color: '#4ECDC4' },
    { value: '#45B7D1', label: 'Azul Cielo', color: '#45B7D1' },
    { value: '#96CEB4', label: 'Verde Menta', color: '#96CEB4' },
    { value: '#FECA57', label: 'Amarillo Sol', color: '#FECA57' },
    { value: '#FF9FF3', label: 'Rosa Chicle', color: '#FF9FF3' },
    { value: '#54A0FF', label: 'Azul Real', color: '#54A0FF' },
    { value: '#5F27CD', label: 'Púrpura', color: '#5F27CD' },
    { value: '#00D2D3', label: 'Cian', color: '#00D2D3' },
    { value: '#FF6348', label: 'Rojo Tomate', color: '#FF6348' },
    { value: '#2ED573', label: 'Verde Lima', color: '#2ED573' },
    { value: '#FFA502', label: 'Naranja', color: '#FFA502' }
  ];

  const validateSector = (sector: EventSector): SectorErrors => {
    const errors: SectorErrors = {};

    // Validar nombre
    if (!sector.name || sector.name.trim().length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres';
    } else if (sector.name.length > 30) {
      errors.name = 'El nombre no puede exceder 30 caracteres';
    }

    // Validar capacidad
    if (!sector.capacity || sector.capacity < 1) {
      errors.capacity = 'La capacidad debe ser mayor a 0';
    } else if (sector.capacity > 1000) {
      errors.capacity = 'La capacidad no puede exceder 1000 personas';
    }

    // Validar precio
    if (!sector.basePrice || sector.basePrice < 1) {
      errors.basePrice = 'El precio debe ser mayor a 0';
    } else if (sector.basePrice > 10000) {
      errors.basePrice = 'El precio no puede exceder Bs. 10,000';
    }

    // Validar color
    if (!sector.color) {
      errors.color = 'Debes seleccionar un color';
    }

    // Validar tipo de precio
    if (!sector.priceType) {
      errors.priceType = 'Debes seleccionar el tipo de precio';
    }

    return errors;
  };

  const validateStep = (): boolean => {
    const newErrors: ValidationErrors = { sectors: {} };

    // Validar que haya al menos un sector
    if (!data.sectors || data.sectors.length === 0) {
      newErrors.general = 'Debes crear al menos un sector para tu evento';
      setErrors(newErrors);
      return false;
    }

    // Validar que haya al menos un sector activo
    const activeSectors = data.sectors.filter(s => s.isActive);
    if (activeSectors.length === 0) {
      newErrors.general = 'Debes tener al menos un sector activo';
      setErrors(newErrors);
      return false;
    }

    // Validar cada sector
    let hasErrors = false;
    data.sectors.forEach((sector, index) => {
      const sectorErrors = validateSector(sector);
      if (Object.keys(sectorErrors).length > 0) {
        newErrors.sectors![index] = Object.values(sectorErrors).join(', ');
        hasErrors = true;
      }
    });

    // Validar nombres únicos
    const names = data.sectors.map(s => s.name.toLowerCase().trim());
    const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      newErrors.general = 'Los nombres de los sectores deben ser únicos';
      hasErrors = true;
    }

    // Validar colores únicos
    const colors = data.sectors.map(s => s.color);
    const duplicateColors = colors.filter((color, index) => colors.indexOf(color) !== index);
    if (duplicateColors.length > 0) {
      newErrors.general = 'Cada sector debe tener un color diferente';
      hasErrors = true;
    }

    setErrors(newErrors);
    return !hasErrors && !newErrors.general;
  };

  const handleNext = () => {
    setShowErrors(true);
    if (validateStep()) {
      onNext();
    }
  };

  const addSector = () => {
    const usedColors = data.sectors.map(s => s.color);
    const availableColor = colorOptions.find(c => !usedColors.includes(c.value))?.value || colorOptions[0].value;

    const newSector: EventSector = {
      id: `sector-${Date.now()}`,
      name: '',
      color: availableColor,
      capacity: 50,
      priceType: 'per_seat',
      basePrice: 100,
      isActive: true
    };

    const newSectors = [...data.sectors, newSector];
    onUpdate('sectors', newSectors);

    // Limpiar errores al agregar
    setErrors({ sectors: {} });
  };

  const updateSector = (index: number, field: keyof EventSector, value: any) => {
    const newSectors = [...data.sectors];
    newSectors[index] = { ...newSectors[index], [field]: value };
    onUpdate('sectors', newSectors);

    // Limpiar error del sector al cambiar
    if (errors.sectors && errors.sectors[index]) {
      const newErrors = { ...errors };
      delete newErrors.sectors![index];
      setErrors(newErrors);
    }
  };

  const removeSector = (index: number) => {
    const newSectors = data.sectors.filter((_, i) => i !== index);
    onUpdate('sectors', newSectors);

    // Limpiar errores relacionados
    if (errors.sectors) {
      const newSectorErrors = { ...errors.sectors };
      delete newSectorErrors[index];
      setErrors({ ...errors, sectors: newSectorErrors });
    }
  };

  const toggleSectorActive = (index: number) => {
    updateSector(index, 'isActive', !data.sectors[index].isActive);
  };

  const getSectorError = (index: number) => {
    return showErrors && errors.sectors && errors.sectors[index] ? errors.sectors[index] : '';
  };

  const isSectorInvalid = (index: number) => {
    return showErrors && errors.sectors && !!errors.sectors[index];
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Sectores y Precios</h2>
        <p className="text-gray-600 mt-2">
          Define las diferentes áreas de tu evento con sus precios y capacidades
        </p>
      </div>

      {/* Mostrar errores generales */}
      {showErrors && errors.general && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-medium text-red-800 mb-1">Error en la configuración:</h3>
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen de sectores */}
      {data.sectors.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-medium text-blue-800 mb-2">Resumen de sectores:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {data.sectors.map((sector, index) => (
                    <div key={sector.id} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: sector.color }}
                      />
                      <span className={sector.isActive ? 'text-blue-700' : 'text-gray-500'}>
                        {sector.name || `Sector ${index + 1}`}
                        {!sector.isActive && ' (Inactivo)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de sectores */}
      <div className="space-y-4">
        {data.sectors.map((sector, index) => (
          <Card
            key={sector.id}
            className={`${isSectorInvalid(index) ? 'border-red-300 bg-red-50' : ''} ${!sector.isActive ? 'opacity-75' : ''}`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: sector.color }}
                  />
                  <div>
                    <CardTitle className="text-lg">
                      {sector.name || `Sector ${index + 1}`}
                    </CardTitle>
                    <CardDescription>
                      {sector.isActive ? 'Activo' : 'Inactivo'} • {
                        sector.priceType === 'per_seat' ? 'Precio por persona' : 'Precio por mesa'
                      }
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={sector.isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSectorActive(index)}
                  >
                    {sector.isActive ? 'Activo' : 'Inactivo'}
                  </Button>
                  {data.sectors.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSector(index)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2Icon size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error del sector */}
              {getSectorError(index) && (
                <div className="flex items-start gap-2 p-3 bg-red-100 border border-red-300 rounded-md">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-sm text-red-700">{getSectorError(index)}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Nombre */}
                <div className="lg:col-span-2">
                  <Label htmlFor={`sector-name-${index}`}>Nombre del Sector *</Label>
                  <Input
                    id={`sector-name-${index}`}
                    value={sector.name}
                    onChange={(e) => updateSector(index, 'name', e.target.value)}
                    placeholder="Ej: VIP, General, Terraza..."
                    className={`mt-1 ${isSectorInvalid(index) ? 'border-red-500' : ''}`}
                    maxLength={30}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {sector.name.length}/30 caracteres
                  </p>
                </div>

                {/* Color */}
                <div>
                  <Label htmlFor={`sector-color-${index}`}>Color *</Label>
                  <Select
                    value={sector.color}
                    onValueChange={(value) => updateSector(index, 'color', value)}
                  >
                    <SelectTrigger className={`mt-1 ${isSectorInvalid(index) ? 'border-red-500' : ''}`}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: sector.color }}
                        />
                        <SelectValue placeholder="Seleccionar color" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabled={data.sectors.some(s => s.color === option.value && s.id !== sector.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: option.color }}
                            />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo de precio */}
                <div>
                  <Label htmlFor={`sector-price-type-${index}`}>Tipo de Precio *</Label>
                  <Select
                    value={sector.priceType}
                    onValueChange={(value: 'per_seat' | 'per_table') => updateSector(index, 'priceType', value)}
                  >
                    <SelectTrigger className={`mt-1 ${isSectorInvalid(index) ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_seat">
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          Por Persona
                        </div>
                      </SelectItem>
                      <SelectItem value="per_table">
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          Por Mesa
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Capacidad */}
                <div>
                  <Label htmlFor={`sector-capacity-${index}`}>Capacidad *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      id={`sector-capacity-${index}`}
                      type="number"
                      value={sector.capacity}
                      onChange={(e) => updateSector(index, 'capacity', parseInt(e.target.value) || 0)}
                      placeholder="50"
                      className={`mt-1 pl-10 ${isSectorInvalid(index) ? 'border-red-500' : ''}`}
                      min={1}
                      max={1000}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {sector.priceType === 'per_table' ? 'Número de mesas' : 'Número de personas'}
                  </p>
                </div>

                {/* Precio base */}
                <div>
                  <Label htmlFor={`sector-price-${index}`}>Precio Base *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      id={`sector-price-${index}`}
                      type="number"
                      value={sector.basePrice}
                      onChange={(e) => updateSector(index, 'basePrice', parseFloat(e.target.value) || 0)}
                      placeholder="100"
                      className={`mt-1 pl-10 ${isSectorInvalid(index) ? 'border-red-500' : ''}`}
                      min={1}
                      max={10000}
                      step={5}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Precio en Bolivianos (Bs.)
                  </p>
                </div>
              </div>

              {/* Información calculada */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Capacidad Total</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {sector.priceType === 'per_table' ? `${sector.capacity} mesas` : `${sector.capacity} personas`}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Ingreso Máximo</p>
                  <p className="text-lg font-semibold text-green-600">
                    Bs. {(sector.capacity * sector.basePrice).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botón para agregar sector */}
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={addSector}
            className="w-full h-20 border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
            disabled={data.sectors.length >= 10}
          >
            <div className="flex flex-col items-center gap-2">
              <PlusIcon size={24} className="text-gray-400" />
              <span className="text-gray-600">
                {data.sectors.length === 0 ? 'Crear tu primer sector' : 'Agregar otro sector'}
              </span>
            </div>
          </Button>
          {data.sectors.length >= 10 && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Máximo 10 sectores permitidos
            </p>
          )}
        </CardContent>
      </Card>

      {/* Resumen total */}
      {data.sectors.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">Resumen Total del Evento</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Sectores Totales</p>
                <p className="text-xl font-bold text-blue-600">{data.sectors.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sectores Activos</p>
                <p className="text-xl font-bold text-green-600">
                  {data.sectors.filter(s => s.isActive).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Capacidad Total</p>
                <p className="text-xl font-bold text-purple-600">
                  {data.sectors.reduce((acc, s) => acc + (s.isActive ? s.capacity : 0), 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ingreso Potencial</p>
                <p className="text-xl font-bold text-orange-600">
                  Bs. {data.sectors.reduce((acc, s) => acc + (s.isActive ? s.capacity * s.basePrice : 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navegación */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          ← Anterior
        </Button>
        <Button
          onClick={handleNext}
          size="lg"
          disabled={showErrors && (!!errors.general || Object.keys(errors.sectors || {}).length > 0)}
          className={showErrors && (!!errors.general || Object.keys(errors.sectors || {}).length > 0) ? 'opacity-50 cursor-not-allowed' : ''}
        >
          Siguiente →
        </Button>
      </div>

      {/* Ayuda */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 <strong>Consejos:</strong></p>
        <p>• Crea sectores que reflejen las diferentes áreas de tu evento</p>
        <p>• Los sectores VIP generalmente tienen menor capacidad pero mayor precio</p>
        <p>• Asegúrate de que los colores sean fáciles de distinguir</p>
        <p>• Puedes desactivar sectores temporalmente sin eliminarlos</p>
      </div>
    </div>
  );
}
