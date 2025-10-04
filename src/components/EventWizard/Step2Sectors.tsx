'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventSector } from '@/types';
import { Plus, Trash2, Edit } from 'lucide-react';

interface Step2Props {
  data: {
    sectors: EventSector[];
  };
  onUpdate: (field: string, value: EventSector[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const predefinedColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#84cc16', '#06d6a0', '#ff6b6b', '#4ecdc4'
];

export default function Step2Sectors({ data, onUpdate, onNext, onBack }: Step2Props) {
  const [newSector, setNewSector] = useState<Partial<EventSector>>({
    name: '',
    color: '#3b82f6',
    capacity: 0,
    priceType: 'per_seat',
    basePrice: 0,
    isActive: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const addSector = () => {
    if (!newSector.name || !newSector.basePrice) return;

    const sector: EventSector = {
      id: Date.now().toString(),
      name: newSector.name,
      color: newSector.color || '#3b82f6',
      capacity: newSector.capacity || 0,
      priceType: newSector.priceType as 'per_seat' | 'per_table',
      basePrice: newSector.basePrice,
      isActive: true
    };

    const updatedSectors = [...data.sectors, sector];
    onUpdate('sectors', updatedSectors);

    // Reset form
    setNewSector({
      name: '',
      color: '#3b82f6',
      capacity: 0,
      priceType: 'per_seat',
      basePrice: 0,
      isActive: true
    });
  };

  const updateSector = (id: string, updates: Partial<EventSector>) => {
    const updatedSectors = data.sectors.map(sector =>
      sector.id === id ? { ...sector, ...updates } : sector
    );
    onUpdate('sectors', updatedSectors);
  };

  const removeSector = (id: string) => {
    const updatedSectors = data.sectors.filter(sector => sector.id !== id);
    onUpdate('sectors', updatedSectors);
  };

  const isValid = data.sectors.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Configurar Sectores</h2>
        <p className="text-gray-600 mt-2">
          Define los sectores de tu evento con precios y capacidades personalizadas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Add New Sector */}
        <Card>
          <CardHeader>
            <CardTitle>Agregar Nuevo Sector</CardTitle>
            <CardDescription>
              Crea sectores como VIP, General, Palcos, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sectorName">Nombre del Sector</Label>
              <Input
                id="sectorName"
                value={newSector.name}
                onChange={(e) => setNewSector({...newSector, name: e.target.value})}
                placeholder="VIP, General, Palco..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Color del Sector</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewSector({...newSector, color})}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newSector.color === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  type="color"
                  value={newSector.color}
                  onChange={(e) => setNewSector({...newSector, color: e.target.value})}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={newSector.color}
                  onChange={(e) => setNewSector({...newSector, color: e.target.value})}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="capacity">Capacidad</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="0"
                  value={newSector.capacity}
                  onChange={(e) => setNewSector({...newSector, capacity: parseInt(e.target.value) || 0})}
                  placeholder="100"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="basePrice">Precio Base (Bs.)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newSector.basePrice}
                  onChange={(e) => setNewSector({...newSector, basePrice: parseFloat(e.target.value) || 0})}
                  placeholder="50.00"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="priceType">Tipo de Precio</Label>
              <Select
                value={newSector.priceType}
                onValueChange={(value: 'per_seat' | 'per_table') => setNewSector({...newSector, priceType: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_seat">Por Persona</SelectItem>
                  <SelectItem value="per_table">Por Mesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={addSector}
              disabled={!newSector.name || !newSector.basePrice}
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              Agregar Sector
            </Button>
          </CardContent>
        </Card>

        {/* Right Column - Sectors List */}
        <Card>
          <CardHeader>
            <CardTitle>Sectores Configurados ({data.sectors.length})</CardTitle>
            <CardDescription>
              Gestiona los sectores de tu evento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.sectors.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">📍</div>
                <p className="text-gray-500">No hay sectores configurados</p>
                <p className="text-xs text-gray-400 mt-1">
                  Agrega al menos un sector para continuar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.sectors.map((sector) => (
                  <div key={sector.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: sector.color }}
                        />
                        <h3 className="font-medium">{sector.name}</h3>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(editingId === sector.id ? null : sector.id)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeSector(sector.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>Capacidad: {sector.capacity || 'Sin límite'}</div>
                      <div>Precio: Bs. {sector.basePrice}</div>
                      <div className="col-span-2">
                        Tipo: {sector.priceType === 'per_seat' ? 'Por Persona' : 'Por Mesa'}
                      </div>
                    </div>

                    {editingId === sector.id && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={sector.name}
                            onChange={(e) => updateSector(sector.id, { name: e.target.value })}
                            placeholder="Nombre"
                          />
                          <Input
                            type="number"
                            value={sector.basePrice}
                            onChange={(e) => updateSector(sector.id, { basePrice: parseFloat(e.target.value) || 0 })}
                            placeholder="Precio"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            value={sector.capacity}
                            onChange={(e) => updateSector(sector.id, { capacity: parseInt(e.target.value) || 0 })}
                            placeholder="Capacidad"
                          />
                          <Select
                            value={sector.priceType}
                            onValueChange={(value: 'per_seat' | 'per_table') => updateSector(sector.id, { priceType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="per_seat">Por Persona</SelectItem>
                              <SelectItem value="per_table">Por Mesa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          ← Anterior
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
        >
          Siguiente: Condiciones de Reserva →
        </Button>
      </div>
    </div>
  );
}
