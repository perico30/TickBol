'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, Trash2Icon, FileText, Gift, AlertCircle, CheckCircle, DollarSign, Package } from 'lucide-react';

interface ReservationCondition {
  id: string;
  description: string;
  minTicketsPerTable?: number;
  maxTicketsPerTable?: number;
  advancePaymentRequired?: number;
  cancellationPolicy?: string;
}

interface EventCombo {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  type: 'cumple' | 'tragos' | 'otros';
  sectorRestriction?: string[];
  isActive: boolean;
}

interface EventSector {
  id: string;
  name: string;
  color: string;
  capacity: number;
  priceType: 'per_seat' | 'per_table';
  basePrice: number;
  isActive: boolean;
}

interface Step3Props {
  data: {
    reservationConditions: ReservationCondition[];
    combos: EventCombo[];
    sectors: EventSector[];
  };
  onUpdate: (field: string, value: ReservationCondition[] | EventCombo[]) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ValidationErrors {
  general?: string;
  conditions?: { [key: string]: string };
  combos?: { [key: string]: string };
}

interface ConditionErrors {
  description?: string;
  minTicketsPerTable?: string;
  maxTicketsPerTable?: string;
  advancePaymentRequired?: string;
}

interface ComboErrors {
  name?: string;
  description?: string;
  price?: string;
  stock?: string;
  type?: string;
}

export default function Step3Conditions({ data, onUpdate, onNext, onBack }: Step3Props) {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showErrors, setShowErrors] = useState(false);

  const comboTypes = [
    { value: 'cumple', label: 'Cumpleaños', icon: '🎂' },
    { value: 'tragos', label: 'Tragos/Bebidas', icon: '🍹' },
    { value: 'otros', label: 'Otros', icon: '🎁' }
  ];

  const validateCondition = (condition: ReservationCondition): ConditionErrors => {
    const errors: ConditionErrors = {};

    // Validar descripción
    if (!condition.description || condition.description.trim().length < 10) {
      errors.description = 'La descripción debe tener al menos 10 caracteres';
    } else if (condition.description.length > 200) {
      errors.description = 'La descripción no puede exceder 200 caracteres';
    }

    // Validar mínimo tickets por mesa
    if (condition.minTicketsPerTable !== undefined) {
      if (condition.minTicketsPerTable < 1) {
        errors.minTicketsPerTable = 'El mínimo debe ser mayor a 0';
      } else if (condition.minTicketsPerTable > 20) {
        errors.minTicketsPerTable = 'El mínimo no puede exceder 20';
      }
    }

    // Validar máximo tickets por mesa
    if (condition.maxTicketsPerTable !== undefined) {
      if (condition.maxTicketsPerTable < 1) {
        errors.maxTicketsPerTable = 'El máximo debe ser mayor a 0';
      } else if (condition.maxTicketsPerTable > 50) {
        errors.maxTicketsPerTable = 'El máximo no puede exceder 50';
      }

      // Validar que el máximo sea mayor que el mínimo
      if (condition.minTicketsPerTable && condition.maxTicketsPerTable <= condition.minTicketsPerTable) {
        errors.maxTicketsPerTable = 'El máximo debe ser mayor que el mínimo';
      }
    }

    // Validar porcentaje de pago adelantado
    if (condition.advancePaymentRequired !== undefined) {
      if (condition.advancePaymentRequired < 0) {
        errors.advancePaymentRequired = 'El porcentaje no puede ser negativo';
      } else if (condition.advancePaymentRequired > 100) {
        errors.advancePaymentRequired = 'El porcentaje no puede exceder 100%';
      }
    }

    return errors;
  };

  const validateCombo = (combo: EventCombo): ComboErrors => {
    const errors: ComboErrors = {};

    // Validar nombre
    if (!combo.name || combo.name.trim().length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres';
    } else if (combo.name.length > 50) {
      errors.name = 'El nombre no puede exceder 50 caracteres';
    }

    // Validar descripción
    if (!combo.description || combo.description.trim().length < 10) {
      errors.description = 'La descripción debe tener al menos 10 caracteres';
    } else if (combo.description.length > 150) {
      errors.description = 'La descripción no puede exceder 150 caracteres';
    }

    // Validar precio
    if (!combo.price || combo.price < 1) {
      errors.price = 'El precio debe ser mayor a 0';
    } else if (combo.price > 5000) {
      errors.price = 'El precio no puede exceder Bs. 5,000';
    }

    // Validar stock
    if (!combo.stock || combo.stock < 1) {
      errors.stock = 'El stock debe ser mayor a 0';
    } else if (combo.stock > 1000) {
      errors.stock = 'El stock no puede exceder 1,000';
    }

    // Validar tipo
    if (!combo.type) {
      errors.type = 'Debes seleccionar un tipo de combo';
    }

    return errors;
  };

  const validateStep = (): boolean => {
    const newErrors: ValidationErrors = { conditions: {}, combos: {} };

    // Es opcional tener condiciones y combos, pero si existen deben ser válidos
    let hasErrors = false;

    // Validar condiciones
    if (data.reservationConditions && data.reservationConditions.length > 0) {
      data.reservationConditions.forEach((condition, index) => {
        const conditionErrors = validateCondition(condition);
        if (Object.keys(conditionErrors).length > 0) {
          newErrors.conditions![index] = Object.values(conditionErrors).join(', ');
          hasErrors = true;
        }
      });
    }

    // Validar combos
    if (data.combos && data.combos.length > 0) {
      data.combos.forEach((combo, index) => {
        const comboErrors = validateCombo(combo);
        if (Object.keys(comboErrors).length > 0) {
          newErrors.combos![index] = Object.values(comboErrors).join(', ');
          hasErrors = true;
        }
      });

      // Validar nombres únicos de combos
      const comboNames = data.combos.map(c => c.name.toLowerCase().trim());
      const duplicateComboNames = comboNames.filter((name, index) => comboNames.indexOf(name) !== index);
      if (duplicateComboNames.length > 0) {
        newErrors.general = 'Los nombres de los combos deben ser únicos';
        hasErrors = true;
      }
    }

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleNext = () => {
    setShowErrors(true);
    if (validateStep()) {
      onNext();
    }
  };

  const addCondition = () => {
    const newCondition: ReservationCondition = {
      id: `condition-${Date.now()}`,
      description: '',
      minTicketsPerTable: undefined,
      maxTicketsPerTable: undefined,
      advancePaymentRequired: undefined,
      cancellationPolicy: undefined
    };

    const newConditions = [...(data.reservationConditions || []), newCondition];
    onUpdate('reservationConditions', newConditions);

    // Limpiar errores
    setErrors(prev => ({ ...prev, conditions: {} }));
  };

  const updateCondition = (index: number, field: keyof ReservationCondition, value: string | number | undefined) => {
    if (!data.reservationConditions || index >= data.reservationConditions.length) return;

    const newConditions = [...data.reservationConditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    onUpdate('reservationConditions', newConditions);

    // Limpiar error
    if (errors.conditions && errors.conditions[index]) {
      const newErrors = { ...errors };
      delete newErrors.conditions![index];
      setErrors(newErrors);
    }
  };

  const removeCondition = (index: number) => {
    if (!data.reservationConditions || index >= data.reservationConditions.length) return;

    const newConditions = data.reservationConditions.filter((_, i) => i !== index);
    onUpdate('reservationConditions', newConditions);

    // Limpiar errores
    if (errors.conditions) {
      const newConditionErrors = { ...errors.conditions };
      delete newConditionErrors[index];
      setErrors({ ...errors, conditions: newConditionErrors });
    }
  };

  const addCombo = () => {
    const newCombo: EventCombo = {
      id: `combo-${Date.now()}`,
      name: '',
      description: '',
      price: 100,
      stock: 10,
      type: 'otros',
      sectorRestriction: [],
      isActive: true
    };

    const newCombos = [...(data.combos || []), newCombo];
    onUpdate('combos', newCombos);

    // Limpiar errores
    setErrors(prev => ({ ...prev, combos: {} }));
  };

  const updateCombo = (index: number, field: keyof EventCombo, value: string | number | boolean | string[]) => {
    if (!data.combos || index >= data.combos.length) return;

    const newCombos = [...data.combos];
    newCombos[index] = { ...newCombos[index], [field]: value };
    onUpdate('combos', newCombos);

    // Limpiar error
    if (errors.combos && errors.combos[index]) {
      const newErrors = { ...errors };
      delete newErrors.combos![index];
      setErrors(newErrors);
    }
  };

  const removeCombo = (index: number) => {
    if (!data.combos || index >= data.combos.length) return;

    const newCombos = data.combos.filter((_, i) => i !== index);
    onUpdate('combos', newCombos);

    // Limpiar errores
    if (errors.combos) {
      const newComboErrors = { ...errors.combos };
      delete newComboErrors[index];
      setErrors({ ...errors, combos: newComboErrors });
    }
  };

  const toggleComboActive = (index: number) => {
    if (!data.combos || index >= data.combos.length) return;
    updateCombo(index, 'isActive', !data.combos[index].isActive);
  };

  const getConditionError = (index: number) => {
    return showErrors && errors.conditions && errors.conditions[index] ? errors.conditions[index] : '';
  };

  const getComboError = (index: number) => {
    return showErrors && errors.combos && errors.combos[index] ? errors.combos[index] : '';
  };

  const isConditionInvalid = (index: number) => {
    return showErrors && errors.conditions && !!errors.conditions[index];
  };

  const isComboInvalid = (index: number) => {
    return showErrors && errors.combos && !!errors.combos[index];
  };

  // Plantillas de condiciones predefinidas
  const conditionTemplates = [
    {
      description: 'Mesas VIP requieren mínimo 4 personas',
      minTicketsPerTable: 4,
      maxTicketsPerTable: 8,
      advancePaymentRequired: 50
    },
    {
      description: 'Entrada general incluye 1 trago de bienvenida',
      cancellationPolicy: 'No reembolsable después de 24 horas'
    },
    {
      description: 'Descuento del 10% para grupos de más de 6 personas',
      minTicketsPerTable: 6,
      advancePaymentRequired: 30
    }
  ];

  const comboTemplates = [
    {
      name: 'Paquete Cumpleañero',
      description: 'Botella de whisky + torta + decoración',
      price: 650,
      stock: 20,
      type: 'cumple' as const
    },
    {
      name: 'Barra Libre Premium',
      description: 'Tragos ilimitados por 3 horas',
      price: 280,
      stock: 100,
      type: 'tragos' as const
    },
    {
      name: 'VIP Experience',
      description: 'Mesa reservada + botella + servicio personalizado',
      price: 450,
      stock: 15,
      type: 'otros' as const
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Condiciones y Combos</h2>
        <p className="text-gray-600 mt-2">
          Establece reglas de reserva y crea ofertas especiales para tu evento
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

      {/* Información sobre este paso */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-medium text-blue-800 mb-2">Este paso es opcional</h3>
              <p className="text-sm text-blue-700">
                Puedes continuar sin agregar condiciones o combos, pero estas opciones te ayudarán a
                gestionar mejor las reservas y generar ingresos adicionales.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Condiciones de Reserva */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} />
            Condiciones de Reserva
            <Badge variant="secondary">{data.reservationConditions.length}</Badge>
          </CardTitle>
          <CardDescription>
            Establece reglas y restricciones para las reservas de tu evento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plantillas de condiciones */}
          {data.reservationConditions.length === 0 && (
            <div>
              <Label>Plantillas de ejemplo (click para usar):</Label>
              <div className="grid gap-2 mt-2">
                {conditionTemplates.map((template, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    className="justify-start h-auto p-4 text-left"
                    onClick={() => {
                      addCondition();
                      const newIndex = data.reservationConditions.length;
                      setTimeout(() => {
                        Object.entries(template).forEach(([field, value]) => {
                          updateCondition(newIndex, field as keyof ReservationCondition, value);
                        });
                      }, 100);
                    }}
                  >
                    <div>
                      <div className="font-medium">{template.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {template.minTicketsPerTable && `Mín: ${template.minTicketsPerTable} personas • `}
                        {template.maxTicketsPerTable && `Máx: ${template.maxTicketsPerTable} personas • `}
                        {template.advancePaymentRequired && `Adelanto: ${template.advancePaymentRequired}%`}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Lista de condiciones */}
          {data.reservationConditions.map((condition, index) => (
            <Card key={condition.id} className={isConditionInvalid(index) ? 'border-red-300 bg-red-50' : 'border-gray-200'}>
              <CardContent className="pt-6">
                {/* Error de la condición */}
                {getConditionError(index) && (
                  <div className="flex items-start gap-2 p-3 bg-red-100 border border-red-300 rounded-md mb-4">
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-sm text-red-700">{getConditionError(index)}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Label htmlFor={`condition-desc-${index}`}>Descripción de la Condición *</Label>
                      <Textarea
                        id={`condition-desc-${index}`}
                        value={condition.description}
                        onChange={(e) => updateCondition(index, 'description', e.target.value)}
                        placeholder="Ej: Mesas VIP requieren mínimo 4 personas..."
                        className={`mt-1 ${isConditionInvalid(index) ? 'border-red-500' : ''}`}
                        rows={2}
                        maxLength={200}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {condition.description.length}/200 caracteres
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCondition(index)}
                      className="ml-4 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2Icon size={16} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor={`min-tickets-${index}`}>Mínimo por Mesa</Label>
                      <Input
                        id={`min-tickets-${index}`}
                        type="number"
                        value={condition.minTicketsPerTable || ''}
                        onChange={(e) => updateCondition(index, 'minTicketsPerTable', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="4"
                        className="mt-1"
                        min={1}
                        max={20}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`max-tickets-${index}`}>Máximo por Mesa</Label>
                      <Input
                        id={`max-tickets-${index}`}
                        type="number"
                        value={condition.maxTicketsPerTable || ''}
                        onChange={(e) => updateCondition(index, 'maxTicketsPerTable', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="8"
                        className="mt-1"
                        min={1}
                        max={50}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`advance-payment-${index}`}>Pago Adelantado (%)</Label>
                      <Input
                        id={`advance-payment-${index}`}
                        type="number"
                        value={condition.advancePaymentRequired || ''}
                        onChange={(e) => updateCondition(index, 'advancePaymentRequired', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="50"
                        className="mt-1"
                        min={0}
                        max={100}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`cancellation-${index}`}>Política de Cancelación</Label>
                      <Input
                        id={`cancellation-${index}`}
                        value={condition.cancellationPolicy || ''}
                        onChange={(e) => updateCondition(index, 'cancellationPolicy', e.target.value)}
                        placeholder="48 horas antes..."
                        className="mt-1"
                        maxLength={100}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Botón para agregar condición */}
          <Button
            type="button"
            variant="outline"
            onClick={addCondition}
            className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
            disabled={data.reservationConditions.length >= 5}
          >
            <PlusIcon size={16} className="mr-2" />
            {data.reservationConditions.length === 0 ? 'Agregar primera condición' : 'Agregar otra condición'}
          </Button>

          {data.reservationConditions.length >= 5 && (
            <p className="text-xs text-gray-500 text-center">
              Máximo 5 condiciones permitidas
            </p>
          )}
        </CardContent>
      </Card>

      {/* Combos Especiales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift size={20} />
            Combos Especiales
            <Badge variant="secondary">{data.combos.length}</Badge>
          </CardTitle>
          <CardDescription>
            Crea ofertas especiales y paquetes para incrementar tus ventas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plantillas de combos */}
          {data.combos.length === 0 && (
            <div>
              <Label>Plantillas de ejemplo (click para usar):</Label>
              <div className="grid gap-2 mt-2">
                {comboTemplates.map((template, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    className="justify-start h-auto p-4 text-left"
                    onClick={() => {
                      addCombo();
                      const newIndex = data.combos.length;
                      setTimeout(() => {
                        Object.entries(template).forEach(([field, value]) => {
                          updateCombo(newIndex, field as keyof EventCombo, value);
                        });
                      }, 100);
                    }}
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{template.name}</span>
                        <span className="text-green-600 font-semibold">Bs. {template.price}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                      <div className="text-xs text-blue-600 mt-1">
                        Stock: {template.stock} • Tipo: {comboTypes.find(t => t.value === template.type)?.label}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Lista de combos */}
          {data.combos.map((combo, index) => (
            <Card
              key={combo.id}
              className={`${isComboInvalid(index) ? 'border-red-300 bg-red-50' : 'border-gray-200'} ${!combo.isActive ? 'opacity-75' : ''}`}
            >
              <CardContent className="pt-6">
                {/* Error del combo */}
                {getComboError(index) && (
                  <div className="flex items-start gap-2 p-3 bg-red-100 border border-red-300 rounded-md mb-4">
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-sm text-red-700">{getComboError(index)}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`combo-name-${index}`}>Nombre del Combo *</Label>
                          <Input
                            id={`combo-name-${index}`}
                            value={combo.name}
                            onChange={(e) => updateCombo(index, 'name', e.target.value)}
                            placeholder="Ej: Paquete Cumpleañero"
                            className={`mt-1 ${isComboInvalid(index) ? 'border-red-500' : ''}`}
                            maxLength={50}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {combo.name.length}/50 caracteres
                          </p>
                        </div>

                        <div>
                          <Label htmlFor={`combo-type-${index}`}>Tipo de Combo *</Label>
                          <Select
                            value={combo.type}
                            onValueChange={(value: 'cumple' | 'tragos' | 'otros') => updateCombo(index, 'type', value)}
                          >
                            <SelectTrigger className={`mt-1 ${isComboInvalid(index) ? 'border-red-500' : ''}`}>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {comboTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <span>{type.icon}</span>
                                    {type.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        type="button"
                        variant={combo.isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleComboActive(index)}
                      >
                        {combo.isActive ? 'Activo' : 'Inactivo'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCombo(index)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2Icon size={16} />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`combo-desc-${index}`}>Descripción *</Label>
                    <Textarea
                      id={`combo-desc-${index}`}
                      value={combo.description}
                      onChange={(e) => updateCombo(index, 'description', e.target.value)}
                      placeholder="Describe qué incluye este combo..."
                      className={`mt-1 ${isComboInvalid(index) ? 'border-red-500' : ''}`}
                      rows={2}
                      maxLength={150}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {combo.description.length}/150 caracteres
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`combo-price-${index}`}>Precio *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                          id={`combo-price-${index}`}
                          type="number"
                          value={combo.price}
                          onChange={(e) => updateCombo(index, 'price', parseFloat(e.target.value) || 0)}
                          placeholder="150"
                          className={`mt-1 pl-10 ${isComboInvalid(index) ? 'border-red-500' : ''}`}
                          min={1}
                          max={5000}
                          step={5}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Precio en Bolivianos (Bs.)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor={`combo-stock-${index}`}>Stock Disponible *</Label>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                          id={`combo-stock-${index}`}
                          type="number"
                          value={combo.stock}
                          onChange={(e) => updateCombo(index, 'stock', parseInt(e.target.value) || 0)}
                          placeholder="20"
                          className={`mt-1 pl-10 ${isComboInvalid(index) ? 'border-red-500' : ''}`}
                          min={1}
                          max={1000}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Cantidad disponible
                      </p>
                    </div>
                  </div>

                  {/* Información calculada */}
                  <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Precio Unitario</p>
                      <p className="text-lg font-semibold text-green-600">
                        Bs. {combo.price}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Stock</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {combo.stock} unidades
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Ingreso Máximo</p>
                      <p className="text-lg font-semibold text-purple-600">
                        Bs. {(combo.price * combo.stock).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Botón para agregar combo */}
          <Button
            type="button"
            variant="outline"
            onClick={addCombo}
            className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
            disabled={data.combos.length >= 10}
          >
            <PlusIcon size={16} className="mr-2" />
            {data.combos.length === 0 ? 'Crear primer combo' : 'Agregar otro combo'}
          </Button>

          {data.combos.length >= 10 && (
            <p className="text-xs text-gray-500 text-center">
              Máximo 10 combos permitidos
            </p>
          )}
        </CardContent>
      </Card>

      {/* Resumen */}
      {(data.reservationConditions.length > 0 || data.combos.length > 0) && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">Resumen de Configuración</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Condiciones</p>
                <p className="text-xl font-bold text-blue-600">{data.reservationConditions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Combos Totales</p>
                <p className="text-xl font-bold text-green-600">{data.combos.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Combos Activos</p>
                <p className="text-xl font-bold text-purple-600">
                  {data.combos.filter(c => c.isActive).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ingreso Combos</p>
                <p className="text-xl font-bold text-orange-600">
                  Bs. {data.combos.reduce((acc, c) => acc + (c.isActive ? c.price * c.stock : 0), 0).toLocaleString()}
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
          disabled={showErrors && (!!errors.general || Object.keys(errors.conditions || {}).length > 0 || Object.keys(errors.combos || {}).length > 0)}
          className={showErrors && (!!errors.general || Object.keys(errors.conditions || {}).length > 0 || Object.keys(errors.combos || {}).length > 0) ? 'opacity-50 cursor-not-allowed' : ''}
        >
          Siguiente →
        </Button>
      </div>

      {/* Ayuda */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 <strong>Consejos:</strong></p>
        <p>• Las condiciones te ayudan a gestionar mejor las reservas</p>
        <p>• Los combos pueden incrementar significativamente tus ingresos</p>
        <p>• Puedes activar/desactivar combos según la demanda</p>
        <p>• Este paso es opcional - puedes continuar sin agregar nada</p>
      </div>
    </div>
  );
}
