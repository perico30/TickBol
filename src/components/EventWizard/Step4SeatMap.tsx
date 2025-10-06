'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import FileUpload from '@/components/ui/file-upload';
import {
  Map,
  Layout,
  Plus,
  Trash2,
  Copy,
  Save,
  Download,
  Upload,
  Grid,
  Circle,
  Square,
  Minus,
  Sofa,
  Home,
  Maximize2,
  RotateCw,
  Palette,
  Image as ImageIcon
} from 'lucide-react';

interface SeatMapElement {
  id: string;
  type: 'table' | 'chair' | 'stage' | 'bar' | 'bathroom' | 'entrance' | 'decoration' | 'wall';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  sectorId?: string;
  capacity?: number;
  label?: string;
  color?: string;
  isReservable: boolean;
  isOccupied?: boolean;
}

interface CroquisTemplate {
  id: string;
  name: string;
  description: string;
  elements: SeatMapElement[];
  backgroundImage?: string;
  canvasSize: { width: number; height: number };
  createdAt: string;
  businessId: string;
}

interface Step4Props {
  data: {
    seatMapElements: SeatMapElement[];
    sectors: any[];
    backgroundImage?: string;
    selectedTemplate?: string;
  };
  onUpdate: (field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step4SeatMap({ data, onUpdate, onNext, onBack }: Step4Props) {
  const [selectedElement, setSelectedElement] = useState<SeatMapElement | null>(null);
  const [selectedTool, setSelectedTool] = useState<'select' | SeatMapElement['type']>('select');
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [resizingElement, setResizingElement] = useState<{ id: string; handle: string } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 700 });
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [backgroundImage, setBackgroundImage] = useState<string>(data.backgroundImage || '');
  const [backgroundMode, setBackgroundMode] = useState<'contain' | 'cover' | 'stretch'>('contain');
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.7);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [savedTemplates, setSavedTemplates] = useState<CroquisTemplate[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  const elementTypes = [
    { type: 'table', icon: Square, label: 'Mesa', color: '#8B5CF6', defaultSize: { width: 80, height: 80 } },
    { type: 'chair', icon: Circle, label: 'Silla', color: '#06B6D4', defaultSize: { width: 40, height: 40 } },
    { type: 'stage', icon: Grid, label: 'Escenario', color: '#EF4444', defaultSize: { width: 150, height: 100 } },
    { type: 'bar', icon: Minus, label: 'Barra', color: '#F59E0B', defaultSize: { width: 120, height: 50 } },
    { type: 'bathroom', icon: Home, label: 'Baño', color: '#14B8A6', defaultSize: { width: 60, height: 60 } },
    { type: 'entrance', icon: Plus, label: 'Entrada', color: '#84CC16', defaultSize: { width: 80, height: 30 } },
    { type: 'decoration', icon: Sofa, label: 'Decoración', color: '#10B981', defaultSize: { width: 60, height: 60 } },
    { type: 'wall', icon: Minus, label: 'Pared', color: '#6B7280', defaultSize: { width: 150, height: 20 } }
  ];

  // Cargar plantillas guardadas (simulado - en producción vendría de la BD)
  useEffect(() => {
    // Simular carga de plantillas del negocio
    const templates: CroquisTemplate[] = [
      {
        id: 'template-1',
        name: 'Layout Principal',
        description: 'Configuración estándar de la discoteca',
        elements: [],
        canvasSize: { width: 1000, height: 700 },
        createdAt: new Date().toISOString(),
        businessId: 'business-1'
      }
    ];
    setSavedTemplates(templates);
  }, []);

  const addElement = (type: SeatMapElement['type'], x: number, y: number) => {
    const elementType = elementTypes.find(t => t.type === type);
    const newElement: SeatMapElement = {
      id: `${type}-${Date.now()}`,
      type,
      x: Math.max(0, Math.min(x, canvasSize.width - (elementType?.defaultSize.width || 50))),
      y: Math.max(0, Math.min(y, canvasSize.height - (elementType?.defaultSize.height || 50))),
      width: elementType?.defaultSize.width || 50,
      height: elementType?.defaultSize.height || 50,
      rotation: 0,
      capacity: type === 'table' ? 4 : type === 'chair' ? 1 : undefined,
      label: '',
      isReservable: type === 'table' || type === 'chair',
      sectorId: data.sectors.length > 0 ? data.sectors[0].id : undefined,
      isOccupied: false
    };

    const newElements = [...data.seatMapElements, newElement];
    onUpdate('seatMapElements', newElements);
    setSelectedElement(newElement);
  };

  const updateElement = (elementId: string, updates: Partial<SeatMapElement>) => {
    const newElements = data.seatMapElements.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    );
    onUpdate('seatMapElements', newElements);

    if (selectedElement?.id === elementId) {
      setSelectedElement({ ...selectedElement, ...updates });
    }
  };

  const deleteElement = (elementId: string) => {
    const newElements = data.seatMapElements.filter(el => el.id !== elementId);
    onUpdate('seatMapElements', newElements);
    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }
  };

  const duplicateElement = (element: SeatMapElement) => {
    const newElement: SeatMapElement = {
      ...element,
      id: `${element.type}-${Date.now()}`,
      x: Math.min(element.x + 20, canvasSize.width - element.width),
      y: Math.min(element.y + 20, canvasSize.height - element.height)
    };

    const newElements = [...data.seatMapElements, newElement];
    onUpdate('seatMapElements', newElements);
    setSelectedElement(newElement);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === 'select') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    addElement(selectedTool, x, y);
    setSelectedTool('select');
  };

  const handleElementMouseDown = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const element = data.seatMapElements.find(el => el.id === elementId);
    if (element) {
      setSelectedElement(element);
      setDraggedElement(elementId);
    }
  };

  const handleResizeStart = (elementId: string, handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResizingElement({ id: elementId, handle });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    // Handle dragging
    if (draggedElement && !resizingElement) {
      const element = data.seatMapElements.find(el => el.id === draggedElement);
      if (element) {
        const newX = Math.max(0, Math.min(x - element.width / 2, canvasSize.width - element.width));
        const newY = Math.max(0, Math.min(y - element.height / 2, canvasSize.height - element.height));
        updateElement(draggedElement, { x: newX, y: newY });
      }
    }

    // Handle resizing
    if (resizingElement) {
      const element = data.seatMapElements.find(el => el.id === resizingElement.id);
      if (element) {
        const { handle } = resizingElement;
        let newWidth = element.width;
        let newHeight = element.height;
        let newX = element.x;
        let newY = element.y;

        switch (handle) {
          case 'nw':
            newWidth = element.x + element.width - x;
            newHeight = element.y + element.height - y;
            newX = x;
            newY = y;
            break;
          case 'ne':
            newWidth = x - element.x;
            newHeight = element.y + element.height - y;
            newY = y;
            break;
          case 'sw':
            newWidth = element.x + element.width - x;
            newHeight = y - element.y;
            newX = x;
            break;
          case 'se':
            newWidth = x - element.x;
            newHeight = y - element.y;
            break;
        }

        // Aplicar límites mínimos y máximos
        newWidth = Math.max(30, Math.min(300, newWidth));
        newHeight = Math.max(30, Math.min(300, newHeight));
        newX = Math.max(0, Math.min(newX, canvasSize.width - newWidth));
        newY = Math.max(0, Math.min(newY, canvasSize.height - newHeight));

        updateElement(resizingElement.id, {
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY
        });
      }
    }
  }, [draggedElement, resizingElement, zoom, canvasSize, data.seatMapElements]);

  const handleMouseUp = () => {
    setDraggedElement(null);
    setResizingElement(null);
  };

  const clearCanvas = () => {
    onUpdate('seatMapElements', []);
    setSelectedElement(null);
  };

  const saveAsTemplate = () => {
    if (!templateName.trim()) {
      alert('Por favor ingresa un nombre para la plantilla');
      return;
    }

    const template: CroquisTemplate = {
      id: `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      elements: data.seatMapElements,
      backgroundImage,
      canvasSize,
      createdAt: new Date().toISOString(),
      businessId: 'current-business' // En producción vendría del contexto
    };

    setSavedTemplates([...savedTemplates, template]);
    setShowTemplateDialog(false);
    setTemplateName('');
    setTemplateDescription('');
    alert('Plantilla guardada exitosamente');
  };

  const loadTemplate = (template: CroquisTemplate) => {
    onUpdate('seatMapElements', template.elements);
    setBackgroundImage(template.backgroundImage || '');
    setCanvasSize(template.canvasSize);
    onUpdate('backgroundImage', template.backgroundImage || '');
    onUpdate('selectedTemplate', template.id);
  };

  const exportLayout = () => {
    const layoutData = {
      elements: data.seatMapElements,
      backgroundImage,
      canvasSize,
      sectors: data.sectors,
      metadata: {
        created: new Date().toISOString(),
        version: '2.0'
      }
    };

    const blob = new Blob([JSON.stringify(layoutData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'croquis-evento.json';
    a.click();
  };

  const importLayout = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const layoutData = JSON.parse(event.target?.result as string);
        if (layoutData.elements) {
          onUpdate('seatMapElements', layoutData.elements);
          if (layoutData.backgroundImage) {
            setBackgroundImage(layoutData.backgroundImage);
            onUpdate('backgroundImage', layoutData.backgroundImage);
          }
          if (layoutData.canvasSize) {
            setCanvasSize(layoutData.canvasSize);
          }
        }
      } catch (error) {
        alert('Error al importar el archivo. Formato inválido.');
      }
    };
    reader.readAsText(file);
  };

  const getElementIcon = (type: string) => {
    const elementType = elementTypes.find(t => t.type === type);
    return elementType?.icon || Square;
  };

  const getSectorColor = (sectorId?: string) => {
    if (!sectorId) return '#6B7280';
    const sector = data.sectors.find((s: any) => s.id === sectorId);
    return sector?.color || '#6B7280';
  };

  const totalCapacity = data.seatMapElements
    .filter(el => el.isReservable && el.capacity)
    .reduce((total, el) => total + (el.capacity || 0), 0);

  const renderResizeHandles = (element: SeatMapElement) => {
    if (selectedElement?.id !== element.id) return null;

    const handles = ['nw', 'ne', 'sw', 'se'];

    return handles.map(handle => {
      let style: React.CSSProperties = {
        position: 'absolute',
        width: 8,
        height: 8,
        backgroundColor: '#3B82F6',
        border: '1px solid white',
        cursor: handle.includes('n') && handle.includes('w') ? 'nw-resize' :
                handle.includes('n') && handle.includes('e') ? 'ne-resize' :
                handle.includes('s') && handle.includes('w') ? 'sw-resize' : 'se-resize'
      };

      if (handle.includes('n')) style.top = -4;
      if (handle.includes('s')) style.bottom = -4;
      if (handle.includes('w')) style.left = -4;
      if (handle.includes('e')) style.right = -4;

      return (
        <div
          key={handle}
          style={style}
          onMouseDown={(e) => handleResizeStart(element.id, handle, e)}
        />
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Editor de Croquis Avanzado</h2>
        <p className="text-gray-600 mt-2">
          Diseña el layout completo de tu evento con imagen de fondo y elementos personalizables
        </p>
      </div>

      {/* Stats Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-blue-800 font-semibold text-lg">{data.seatMapElements.length}</p>
              <p className="text-blue-600 text-sm">Elementos</p>
            </div>
            <div>
              <p className="text-blue-800 font-semibold text-lg">{totalCapacity}</p>
              <p className="text-blue-600 text-sm">Capacidad Total</p>
            </div>
            <div>
              <p className="text-blue-800 font-semibold text-lg">{data.sectors.length}</p>
              <p className="text-blue-600 text-sm">Sectores</p>
            </div>
            <div>
              <p className="text-blue-800 font-semibold text-lg">{savedTemplates.length}</p>
              <p className="text-blue-600 text-sm">Plantillas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Toolbar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Background Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon size={16} />
                Imagen de Fondo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                value={backgroundImage}
                onChange={(value) => {
                  setBackgroundImage(value || '');
                  onUpdate('backgroundImage', value || '');
                }}
                placeholder="Sube una imagen de tu local"
                accept="image/*"
                maxSize={5}
              />
              {backgroundImage && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setBackgroundImage('');
                      onUpdate('backgroundImage', '');
                    }}
                    className="w-full mt-2"
                  >
                    Quitar Imagen
                  </Button>

                  <div className="space-y-3 mt-4 pt-4 border-t">
                    <div>
                      <Label className="text-sm font-medium">Modo de Visualización</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <Button
                          size="sm"
                          variant={backgroundMode === 'contain' ? 'default' : 'outline'}
                          onClick={() => setBackgroundMode('contain')}
                          className="text-xs"
                        >
                          Completa
                        </Button>
                        <Button
                          size="sm"
                          variant={backgroundMode === 'cover' ? 'default' : 'outline'}
                          onClick={() => setBackgroundMode('cover')}
                          className="text-xs"
                        >
                          Llenar
                        </Button>
                        <Button
                          size="sm"
                          variant={backgroundMode === 'stretch' ? 'default' : 'outline'}
                          onClick={() => setBackgroundMode('stretch')}
                          className="text-xs"
                        >
                          Estirar
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {backgroundMode === 'contain' && '• Muestra imagen completa'}
                        {backgroundMode === 'cover' && '• Llena el canvas (puede cortar)'}
                        {backgroundMode === 'stretch' && '• Estira para ajustar'}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Opacidad: {Math.round(backgroundOpacity * 100)}%</Label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={backgroundOpacity}
                        onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
                        className="w-full mt-1"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plantillas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="w-full">
                    <Save size={16} className="mr-2" />
                    Guardar Como Plantilla
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guardar Plantilla</DialogTitle>
                    <DialogDescription>
                      Guarda este diseño como plantilla reutilizable
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="templateName">Nombre de la Plantilla</Label>
                      <Input
                        id="templateName"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Ej: Layout Principal"
                      />
                    </div>
                    <div>
                      <Label htmlFor="templateDescription">Descripción</Label>
                      <Input
                        id="templateDescription"
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        placeholder="Descripción opcional"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveAsTemplate} className="flex-1">
                        Guardar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowTemplateDialog(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {savedTemplates.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cargar Plantilla</Label>
                  {savedTemplates.map((template) => (
                    <div key={template.id} className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadTemplate(template)}
                        className="flex-1 text-left justify-start"
                      >
                        <Map size={12} className="mr-2" />
                        {template.name}
                      </Button>
                    </div>
                  ))}
                  <div className="text-xs text-gray-500 mt-2">
                    💡 <strong>Tip:</strong> Gestiona tus plantillas en{' '}
                    <span className="text-blue-600">Plantillas de Croquis</span>
                  </div>
                </div>
              )}

              {savedTemplates.length === 0 && (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <Map size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">No tienes plantillas</p>
                  <p className="text-xs text-gray-500">Crea plantillas desde el dashboard</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Herramientas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Herramienta Activa</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant={selectedTool === 'select' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('select')}
                    className="h-auto py-2"
                  >
                    <Layout size={16} className="mb-1" />
                    Seleccionar
                  </Button>
                  {elementTypes.map(elementType => {
                    const Icon = elementType.icon;
                    return (
                      <Button
                        key={elementType.type}
                        variant={selectedTool === elementType.type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTool(elementType.type as any)}
                        className="h-auto py-2 flex flex-col text-xs"
                        style={{
                          backgroundColor: selectedTool === elementType.type ? elementType.color : undefined,
                          borderColor: selectedTool === elementType.type ? elementType.color : undefined
                        }}
                      >
                        <Icon size={14} className="mb-1" />
                        {elementType.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Canvas Controls */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Zoom: {Math.round(zoom * 100)}%</Label>
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" variant="outline" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>-</Button>
                    <Button size="sm" variant="outline" onClick={() => setZoom(1)}>100%</Button>
                    <Button size="sm" variant="outline" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>+</Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showGrid"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                  />
                  <Label htmlFor="showGrid" className="text-sm">Mostrar cuadrícula</Label>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button size="sm" variant="outline" onClick={clearCanvas} className="w-full">
                  <Trash2 size={16} className="mr-2" />
                  Limpiar Todo
                </Button>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={exportLayout} className="flex-1">
                    <Download size={16} className="mr-1" />
                    Exportar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <label>
                      <Upload size={16} className="mr-1" />
                      Importar
                      <input
                        type="file"
                        accept=".json"
                        onChange={importLayout}
                        className="hidden"
                      />
                    </label>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Element Properties */}
          {selectedElement && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {(() => {
                    const Icon = getElementIcon(selectedElement.type);
                    return <Icon size={16} />;
                  })()}
                  Propiedades
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="elementLabel">Etiqueta</Label>
                  <Input
                    id="elementLabel"
                    value={selectedElement.label || ''}
                    onChange={(e) => updateElement(selectedElement.id, { label: e.target.value })}
                    placeholder="Ej: Mesa VIP 1"
                  />
                </div>

                {selectedElement.isReservable && (
                  <div>
                    <Label htmlFor="elementCapacity">Capacidad</Label>
                    <Input
                      id="elementCapacity"
                      type="number"
                      min="1"
                      max="20"
                      value={selectedElement.capacity || 1}
                      onChange={(e) => updateElement(selectedElement.id, { capacity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                )}

                {data.sectors.length > 0 && selectedElement.isReservable && (
                  <div>
                    <Label htmlFor="elementSector">Sector</Label>
                    <Select
                      value={selectedElement.sectorId || ''}
                      onValueChange={(value) => updateElement(selectedElement.id, { sectorId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {data.sectors.map((sector: any) => (
                          <SelectItem key={sector.id} value={sector.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: sector.color }}
                              />
                              {sector.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Rotación: {selectedElement.rotation}°</Label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="15"
                    value={selectedElement.rotation}
                    onChange={(e) => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                    className="w-full mt-1"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => duplicateElement(selectedElement)}
                    className="flex-1"
                  >
                    <Copy size={16} className="mr-1" />
                    Duplicar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteElement(selectedElement.id)}
                    className="flex-1 text-red-600 border-red-300"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Canvas */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Map size={20} />
                  Canvas de Diseño
                </span>
                <Badge variant="outline">
                  {canvasSize.width} x {canvasSize.height}
                </Badge>
              </CardTitle>
              <CardDescription>
                {selectedTool === 'select'
                  ? 'Haz clic en un elemento para seleccionarlo. Arrastra desde las esquinas para redimensionar.'
                  : `Haz clic en el canvas para agregar: ${elementTypes.find(t => t.type === selectedTool)?.label}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-auto bg-gray-50 p-4">
                <div
                  ref={canvasRef}
                  className="relative bg-white border-2 border-dashed border-gray-300 cursor-crosshair"
                  style={{
                    width: canvasSize.width * zoom,
                    height: canvasSize.height * zoom,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    backgroundImage: backgroundImage
                      ? `linear-gradient(rgba(255, 255, 255, ${1 - backgroundOpacity}), rgba(255, 255, 255, ${1 - backgroundOpacity})), url(${backgroundImage})`
                      : showGrid
                        ? `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`
                        : undefined,
                    backgroundSize: backgroundImage
                      ? backgroundMode === 'stretch' ? '100% 100%' : backgroundMode
                      : showGrid ? '20px 20px' : undefined,
                    backgroundPosition: backgroundImage ? 'center' : undefined,
                    backgroundRepeat: backgroundImage ? 'no-repeat' : undefined
                  }}
                  onClick={handleCanvasClick}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  {data.seatMapElements.map((element) => {
                    const sector = data.sectors.find((s: any) => s.id === element.sectorId);
                    const Icon = getElementIcon(element.type);
                    const sectorColor = getSectorColor(element.sectorId);

                    return (
                      <div
                        key={element.id}
                        className={`absolute border-2 flex items-center justify-center text-xs font-medium cursor-move transition-all ${
                          selectedElement?.id === element.id
                            ? 'border-blue-500 bg-blue-100 z-10'
                            : element.isOccupied
                              ? 'border-red-500 bg-red-100'
                              : 'border-gray-400 bg-white hover:border-gray-600'
                        }`}
                        style={{
                          left: element.x,
                          top: element.y,
                          width: element.width,
                          height: element.height,
                          transform: `rotate(${element.rotation}deg)`,
                          backgroundColor: element.isReservable && sector
                            ? `${sectorColor}40`
                            : element.isOccupied
                              ? '#fecaca'
                              : 'white',
                          borderColor: element.isReservable && sector ? sectorColor : undefined
                        }}
                        onMouseDown={(e) => handleElementMouseDown(element.id, e)}
                      >
                        {renderResizeHandles(element)}

                        <div className="flex flex-col items-center gap-1 pointer-events-none">
                          <Icon size={Math.min(element.width / 3, element.height / 3, 24)} />
                          {element.label && (
                            <span className="text-xs truncate max-w-full">
                              {element.label}
                            </span>
                          )}
                          {element.capacity && (
                            <span className="text-xs text-gray-600">
                              {element.capacity}p
                            </span>
                          )}
                          {element.isOccupied && (
                            <span className="text-xs text-red-600 font-bold">
                              OCUPADO
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Canvas Size Controls */}
              <div className="flex gap-4 mt-4 items-center">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCanvasSize({ width: 800, height: 600 })}
                  >
                    Pequeño
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCanvasSize({ width: 1000, height: 700 })}
                  >
                    Mediano
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCanvasSize({ width: 1200, height: 900 })}
                  >
                    Grande
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          ← Anterior
        </Button>
        <Button onClick={onNext} size="lg">
          Siguiente →
        </Button>
      </div>

      {/* Help */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 <strong>Nuevas Funcionalidades:</strong></p>
        <p>• Sube una imagen de fondo de tu local para diseñar sobre ella</p>
        <p>• Redimensiona elementos arrastrando desde las esquinas azules</p>
        <p>• Los colores de sector se aplican automáticamente a mesas y sillas</p>
        <p>• Guarda diseños como plantillas reutilizables</p>
        <p>• Incluye elementos como baños, entradas y decoraciones</p>
        <p>• Sistema de ocupación integrado para reservas futuras</p>
      </div>
    </div>
  );
}
