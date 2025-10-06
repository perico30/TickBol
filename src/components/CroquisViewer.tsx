'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SeatMapElement, EventSector } from '@/types';
import {
  Map,
  Users,
  CheckCircle,
  XCircle,
  Grid,
  Circle,
  Square,
  Minus,
  Sofa,
  Home,
  Plus,
  Star
} from 'lucide-react';

interface CroquisViewerProps {
  elements: SeatMapElement[];
  sectors: EventSector[];
  backgroundImage?: string;
  backgroundMode?: 'contain' | 'cover' | 'stretch';
  backgroundOpacity?: number;
  canvasSize: { width: number; height: number };
  selectedSector?: string; // Filtrar por sector
  onSeatSelect?: (elementId: string, isSelected: boolean) => void;
  selectedSeats?: string[]; // IDs de elementos seleccionados
  readOnly?: boolean; // Solo vista, sin selección
  showCapacity?: boolean;
  showPrices?: boolean;
  className?: string;
}

export default function CroquisViewer({
  elements,
  sectors,
  backgroundImage,
  backgroundMode = 'contain',
  backgroundOpacity = 0.7,
  canvasSize,
  selectedSector,
  onSeatSelect,
  selectedSeats = [],
  readOnly = false,
  showCapacity = true,
  showPrices = false,
  className = ''
}: CroquisViewerProps) {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.8);
  const canvasRef = useRef<HTMLDivElement>(null);

  const elementTypes = [
    { type: 'table', icon: Square, label: 'Mesa' },
    { type: 'chair', icon: Circle, label: 'Silla' },
    { type: 'stage', icon: Grid, label: 'Escenario' },
    { type: 'bar', icon: Minus, label: 'Barra' },
    { type: 'bathroom', icon: Home, label: 'Baño' },
    { type: 'entrance', icon: Plus, label: 'Entrada' },
    { type: 'decoration', icon: Sofa, label: 'Decoración' },
    { type: 'wall', icon: Minus, label: 'Pared' }
  ];

  const getElementIcon = (type: string) => {
    const elementType = elementTypes.find(t => t.type === type);
    return elementType?.icon || Square;
  };

  const getSector = (sectorId?: string) => {
    return sectors.find(s => s.id === sectorId);
  };

  const getSectorColor = (sectorId?: string) => {
    const sector = getSector(sectorId);
    return sector?.color || '#6B7280';
  };

  const getSectorPrice = (sectorId?: string) => {
    const sector = getSector(sectorId);
    return sector?.basePrice || 0;
  };

  // Filtrar elementos por sector si está seleccionado
  const filteredElements = selectedSector
    ? elements.filter(el => el.sectorId === selectedSector || !el.isReservable)
    : elements;

  // Elementos reservables disponibles
  const availableElements = filteredElements.filter(el =>
    el.isReservable && !el.isOccupied && (!selectedSector || el.sectorId === selectedSector)
  );

  const totalCapacity = availableElements.reduce((total, el) => total + (el.capacity || 0), 0);
  const selectedCapacity = selectedSeats.reduce((total, seatId) => {
    const element = elements.find(el => el.id === seatId);
    return total + (element?.capacity || 0);
  }, 0);

  const handleElementClick = (element: SeatMapElement) => {
    if (readOnly || !element.isReservable || element.isOccupied) return;
    if (selectedSector && element.sectorId !== selectedSector) return;

    const isSelected = selectedSeats.includes(element.id);
    onSeatSelect?.(element.id, !isSelected);
  };

  const getElementStatus = (element: SeatMapElement) => {
    if (!element.isReservable) return 'not-reservable';
    if (element.isOccupied) return 'occupied';
    if (selectedSeats.includes(element.id)) return 'selected';
    if (selectedSector && element.sectorId !== selectedSector) return 'filtered-out';
    return 'available';
  };

  const getElementStyles = (element: SeatMapElement) => {
    const status = getElementStatus(element);
    const sector = getSector(element.sectorId);
    const isHovered = hoveredElement === element.id;

    let backgroundColor = '#f3f4f6';
    let borderColor = '#9ca3af';
    let opacity = 1;

    switch (status) {
      case 'available':
        backgroundColor = sector ? `${sector.color}30` : '#f3f4f6';
        borderColor = sector?.color || '#9ca3af';
        if (isHovered) {
          backgroundColor = sector ? `${sector.color}50` : '#e5e7eb';
          borderColor = sector?.color || '#6b7280';
        }
        break;
      case 'selected':
        backgroundColor = sector ? `${sector.color}80` : '#3b82f6';
        borderColor = sector?.color || '#3b82f6';
        break;
      case 'occupied':
        backgroundColor = '#fecaca';
        borderColor = '#ef4444';
        break;
      case 'filtered-out':
        backgroundColor = '#f9fafb';
        borderColor = '#e5e7eb';
        opacity = 0.3;
        break;
      case 'not-reservable':
        backgroundColor = '#f9fafb';
        borderColor = '#e5e7eb';
        break;
    }

    return {
      backgroundColor,
      borderColor,
      opacity,
      cursor: status === 'available' && !readOnly ? 'pointer' : 'default',
      transform: `rotate(${element.rotation}deg)`
    };
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalCapacity}</div>
            <div className="text-sm text-gray-600">Capacidad Total</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-green-600">{availableElements.length}</div>
            <div className="text-sm text-gray-600">Mesas Disponibles</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{selectedSeats.length}</div>
            <div className="text-sm text-gray-600">Seleccionadas</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{selectedCapacity}</div>
            <div className="text-sm text-gray-600">Personas</div>
          </CardContent>
        </Card>
      </div>

      {/* Sector Legend */}
      {sectors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sectores Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {sectors.filter(s => s.isActive).map(sector => (
                <div key={sector.id} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border-2"
                    style={{ backgroundColor: sector.color, borderColor: sector.color }}
                  />
                  <span className="text-sm font-medium">{sector.name}</span>
                  {showPrices && (
                    <Badge variant="outline">Bs. {sector.basePrice}</Badge>
                  )}
                  <span className="text-xs text-gray-500">
                    ({availableElements.filter(el => el.sectorId === sector.id).length} disponibles)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Legend */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 border-2 border-green-500 rounded"></div>
              <span>Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 border-2 border-blue-600 rounded"></div>
              <span>Seleccionada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-200 border-2 border-red-500 rounded"></div>
              <span>Ocupada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
              <span>No reservable</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Map size={20} />
              Layout del Evento
            </span>
            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}
              >
                -
              </Button>
              <span className="text-sm min-w-16 text-center">{Math.round(zoom * 100)}%</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
              >
                +
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-auto bg-gray-50 p-4 max-h-96">
            <div
              ref={canvasRef}
              className="relative bg-white border border-gray-200 mx-auto"
              style={{
                width: canvasSize.width * zoom,
                height: canvasSize.height * zoom,
                backgroundImage: backgroundImage
                  ? `linear-gradient(rgba(255, 255, 255, ${1 - backgroundOpacity}), rgba(255, 255, 255, ${1 - backgroundOpacity})), url(${backgroundImage})`
                  : `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
                backgroundSize: backgroundImage
                  ? backgroundMode === 'stretch' ? '100% 100%' : backgroundMode
                  : '20px 20px',
                backgroundPosition: backgroundImage ? 'center' : undefined,
                backgroundRepeat: backgroundImage ? 'no-repeat' : undefined
              }}
            >
              {filteredElements.map((element) => {
                const Icon = getElementIcon(element.type);
                const sector = getSector(element.sectorId);
                const status = getElementStatus(element);
                const styles = getElementStyles(element);

                return (
                  <div
                    key={element.id}
                    className={`absolute border-2 flex items-center justify-center text-xs font-medium transition-all ${
                      !readOnly && element.isReservable && !element.isOccupied
                        ? 'hover:shadow-md'
                        : ''
                    }`}
                    style={{
                      left: element.x * zoom,
                      top: element.y * zoom,
                      width: element.width * zoom,
                      height: element.height * zoom,
                      ...styles
                    }}
                    onClick={() => handleElementClick(element)}
                    onMouseEnter={() => setHoveredElement(element.id)}
                    onMouseLeave={() => setHoveredElement(null)}
                    title={
                      element.label ||
                      `${elementTypes.find(t => t.type === element.type)?.label} ${
                        element.capacity ? `(${element.capacity} personas)` : ''
                      } ${sector ? `- ${sector.name}` : ''} ${
                        showPrices && sector ? `- Bs. ${sector.basePrice}` : ''
                      }`
                    }
                  >
                    <div className="flex flex-col items-center gap-1 pointer-events-none">
                      <Icon size={Math.min(element.width * zoom / 3, element.height * zoom / 3, 20)} />

                      {element.label && zoom > 0.6 && (
                        <span className="text-xs truncate max-w-full">
                          {element.label}
                        </span>
                      )}

                      {element.capacity && showCapacity && zoom > 0.5 && (
                        <span className="text-xs">
                          {element.capacity}p
                        </span>
                      )}

                      {status === 'selected' && (
                        <CheckCircle size={12} className="text-white absolute -top-1 -right-1" />
                      )}

                      {status === 'occupied' && (
                        <XCircle size={12} className="text-red-600 absolute -top-1 -right-1" />
                      )}

                      {sector && sector.name === 'VIP' && zoom > 0.7 && (
                        <Star size={10} className="text-yellow-500 absolute top-0 left-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Summary */}
      {selectedSeats.length > 0 && !readOnly && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-green-800">
                  {selectedSeats.length} mesa{selectedSeats.length !== 1 ? 's' : ''} seleccionada{selectedSeats.length !== 1 ? 's' : ''}
                </div>
                <div className="text-sm text-green-600">
                  Capacidad total: {selectedCapacity} persona{selectedCapacity !== 1 ? 's' : ''}
                </div>
                {showPrices && selectedSeats.length > 0 && (
                  <div className="text-sm text-green-600">
                    Precio estimado: Bs. {selectedSeats.reduce((total, seatId) => {
                      const element = elements.find(el => el.id === seatId);
                      const sector = getSector(element?.sectorId);
                      return total + (sector?.basePrice || 0);
                    }, 0)}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    selectedSeats.forEach(seatId => onSeatSelect?.(seatId, false));
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      {!readOnly && (
        <div className="text-xs text-gray-500 text-center">
          💡 Haz clic en las mesas disponibles para seleccionarlas.
          {selectedSector && ' Solo se muestran las mesas del sector seleccionado.'}
        </div>
      )}
    </div>
  );
}
