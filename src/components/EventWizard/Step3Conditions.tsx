'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventCombo, ReservationCondition, EventSector } from '@/types';
import { Plus, Trash2, Gift, Coffee, Star } from 'lucide-react';

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

export default function Step3Conditions({ data, onUpdate, onNext, onBack }: Step3Props) {
  const [newCondition, setNewCondition] = useState<Partial<ReservationCondition>>({
    description: '',
    minTicketsPerTable: 1,
    maxTicketsPerTable: undefined,
    advancePaymentRequired: 0,
    cancellationPolicy: ''
  });

  const [newCombo, setNewCombo] = useState<Partial<EventCombo>>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    type: 'cumple',
    sectorRestriction: [],
    isActive: true
  });

  const addCondition = () => {
    if (!newCondition.description) return;

    const condition: ReservationCondition = {
      id: Date.now().toString(),
      description: newCondition.description,
      minTicketsPerTable: newCondition.minTicketsPerTable,
      maxTicketsPerTable: newCondition.maxTicketsPerTable,
      advancePaymentRequired: newCondition.advancePaymentRequired,
      cancellationPolicy: newCondition.cancellationPolicy
    };

    onUpdate('reservationConditions', [...data.reservationConditions, condition]);
    setNewCondition({
      description: '',
      minTicketsPerTable: 1,
      maxTicketsPerTable: undefined,
      advancePaymentRequired: 0,
      cancellationPolicy: ''
    });
  };

  const addCombo = () => {
    if (!newCombo.name || !newCombo.price) return;

    const combo: EventCombo = {
      id: Date.now().toString(),
      name: newCombo.name,
      description: newCombo.description || '',
      price: newCombo.price,
      stock: newCombo.stock || 0,
      type: newCombo.type as 'cumple' | 'tragos' | 'otros',
      sectorRestriction: newCombo.sectorRestriction,
      isActive: true
    };

    onUpdate('combos', [...data.combos, combo]);
    setNewCombo({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      type: 'cumple',
      sectorRestriction: [],
      isActive: true
    });
  };

  const removeCondition = (id: string) => {
    const updated = data.reservationConditions.filter(c => c.id !== id);
    onUpdate('reservationConditions', updated);
  };

  const removeCombo = (id: string) => {
    const updated = data.combos.filter(c => c.id !== id);
    onUpdate('combos', updated);
  };

  const getComboIcon = (type: string) => {
    switch (type) {
      case 'cumple': return <Gift size={16} className="text-pink-500" />;
      case 'tragos': return <Coffee size={16} className="text-amber-500" />;
      default: return <Star size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Condiciones de Reserva</h2>
        <p className="text-gray-600 mt-2">
          Define las reglas para reservar mesas y agrega combos especiales
        </p>
      </div>

      <div className="grid gap-6">
        {/* Reservation Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Condiciones de Reserva</CardTitle>
            <CardDescription>
              Establece reglas para las reservas de mesas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="conditionDesc">Descripción de la Condición</Label>
                  <Textarea
                    id="conditionDesc"
                    value={newCondition.description}
                    onChange={(e) => setNewCondition({...newCondition, description: e.target.value})}
                    placeholder="Ej: Para reservar mesa VIP se requiere consumo mínimo de 4 personas"
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="minTickets">Mín. Tickets por Mesa</Label>
                    <Input
                      id="minTickets"
                      type="number"
                      min="1"
                      value={newCondition.minTicketsPerTable}
                      onChange={(e) => setNewCondition({...newCondition, minTicketsPerTable: parseInt(e.target.value) || 1})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxTickets">Máx. Tickets por Mesa</Label>
                    <Input
                      id="maxTickets"
                      type="number"
                      min="1"
                      value={newCondition.maxTicketsPerTable || ''}
                      onChange={(e) => setNewCondition({...newCondition, maxTicketsPerTable: parseInt(e.target.value) || undefined})}
                      placeholder="Sin límite"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="advancePayment">Pago Anticipado (%)</Label>
                  <Input
                    id="advancePayment"
                    type="number"
                    min="0"
                    max="100"
                    value={newCondition.advancePaymentRequired}
                    onChange={(e) => setNewCondition({...newCondition, advancePaymentRequired: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>

                <Button onClick={addCondition} disabled={!newCondition.description}>
                  <Plus size={16} className="mr-2" />
                  Agregar Condición
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-3">Condiciones Configuradas</h4>
                {data.reservationConditions.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-sm">No hay condiciones configuradas</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.reservationConditions.map((condition) => (
                      <div key={condition.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{condition.description}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              {condition.minTicketsPerTable && (
                                <span>Mín: {condition.minTicketsPerTable} • </span>
                              )}
                              {condition.maxTicketsPerTable && (
                                <span>Máx: {condition.maxTicketsPerTable} • </span>
                              )}
                              {condition.advancePaymentRequired && condition.advancePaymentRequired > 0 && (
                                <span>Anticipo: {condition.advancePaymentRequired}%</span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeCondition(condition.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Combos and Packages */}
        <Card>
          <CardHeader>
            <CardTitle>Combos y Paquetes</CardTitle>
            <CardDescription>
              Agrega combos cumpleañeros, packs de tragos y ofertas especiales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="comboName">Nombre del Combo</Label>
                  <Input
                    id="comboName"
                    value={newCombo.name}
                    onChange={(e) => setNewCombo({...newCombo, name: e.target.value})}
                    placeholder="Combo Cumpleañero VIP"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="comboDesc">Descripción</Label>
                  <Textarea
                    id="comboDesc"
                    value={newCombo.description}
                    onChange={(e) => setNewCombo({...newCombo, description: e.target.value})}
                    placeholder="Incluye torta, globos, botella de whisky y 4 entradas"
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="comboPrice">Precio (Bs.)</Label>
                    <Input
                      id="comboPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newCombo.price}
                      onChange={(e) => setNewCombo({...newCombo, price: parseFloat(e.target.value) || 0})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="comboStock">Stock</Label>
                    <Input
                      id="comboStock"
                      type="number"
                      min="0"
                      value={newCombo.stock}
                      onChange={(e) => setNewCombo({...newCombo, stock: parseInt(e.target.value) || 0})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="comboType">Tipo</Label>
                    <Select
                      value={newCombo.type}
                      onValueChange={(value: 'cumple' | 'tragos' | 'otros') => setNewCombo({...newCombo, type: value})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cumple">Cumpleañero</SelectItem>
                        <SelectItem value="tragos">Pack Tragos</SelectItem>
                        <SelectItem value="otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {data.sectors.length > 0 && (
                  <div>
                    <Label>Restringir a Sectores (opcional)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {data.sectors.map((sector) => (
                        <label key={sector.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newCombo.sectorRestriction?.includes(sector.id) || false}
                            onChange={(e) => {
                              const current = newCombo.sectorRestriction || [];
                              const updated = e.target.checked
                                ? [...current, sector.id]
                                : current.filter(id => id !== sector.id);
                              setNewCombo({...newCombo, sectorRestriction: updated});
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{sector.name}</span>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: sector.color }}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={addCombo} disabled={!newCombo.name || !newCombo.price}>
                  <Plus size={16} className="mr-2" />
                  Agregar Combo
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-3">Combos Configurados</h4>
                {data.combos.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-sm">No hay combos configurados</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.combos.map((combo) => (
                      <div key={combo.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getComboIcon(combo.type)}
                              <p className="text-sm font-medium">{combo.name}</p>
                            </div>
                            <p className="text-xs text-gray-600 mb-1">{combo.description}</p>
                            <div className="text-xs text-gray-500">
                              Bs. {combo.price} • Stock: {combo.stock}
                              {combo.sectorRestriction && combo.sectorRestriction.length > 0 && (
                                <span> • Sectores: {combo.sectorRestriction.length}</span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeCombo(combo.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          ← Anterior
        </Button>
        <Button onClick={onNext}>
          Siguiente: Diseñar Croquis →
        </Button>
      </div>
    </div>
  );
}
