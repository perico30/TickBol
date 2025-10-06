'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FileUpload from '@/components/ui/file-upload';
import { CroquisTemplate, SeatMapElement } from '@/types';
import { db } from '@/lib/database';
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
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';

export default function EditorCroquisPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<CroquisTemplate | null>(null);
  const [loading_template, setLoadingTemplate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');

  // Editor state
  const [selectedElement, setSelectedElement] = useState<SeatMapElement | null>(null);
  const [selectedTool, setSelectedTool] = useState<'select' | SeatMapElement['type']>('select');
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [resizingElement, setResizingElement] = useState<{ id: string; handle: string } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Template data
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [backgroundMode, setBackgroundMode] = useState<'contain' | 'cover' | 'stretch'>('contain');
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.7);
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 700 });
  const [elements, setElements] = useState<SeatMapElement[]>([]);

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

  const loadTemplate = async () => {
    try {
      setLoadingTemplate(true);
      const templateData = await db.getCroquisTemplateById(templateId);

      if (!templateData) {
        router.push('/dashboard/plantillas-croquis');
        return;
      }

      if (templateData.businessId !== user?.businessId) {
        router.push('/dashboard/plantillas-croquis');
        return;
      }

      setTemplate(templateData);
      setTemplateName(templateData.name);
      setTemplateDescription(templateData.description || '');
      setBackgroundImage(templateData.backgroundImage || '');
      setCanvasSize(templateData.canvasSize);
      setElements(templateData.elements || []);
    } catch (error) {
      console.error('Error loading template:', error);
      router.push('/dashboard/plantillas-croquis');
    } finally {
      setLoadingTemplate(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'business') {
      router.push('/');
      return;
    }
    if (templateId) {
      loadTemplate();
    }
  }, [user, router, templateId]);

  const saveTemplate = async () => {
    if (!template) return;

    try {
      setSaving(true);

      const updatedTemplate = {
        ...template,
        name: templateName,
        description: templateDescription,
        backgroundImage,
        canvasSize,
        elements
      };

      const success = await db.updateCroquisTemplate(template.id, updatedTemplate);

      if (success) {
        setTemplate(updatedTemplate);
        setLastSaved(new Date().toLocaleTimeString());
      } else {
        alert('Error al guardar la plantilla');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error al guardar la plantilla');
    } finally {
      setSaving(false);
    }
  };

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
      isOccupied: false
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    setSelectedElement(newElement);
  };

  const updateElement = (elementId: string, updates: Partial<SeatMapElement>) => {
    const newElements = elements.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    );
    setElements(newElements);

    if (selectedElement?.id === elementId) {
      setSelectedElement({ ...selectedElement, ...updates });
    }
  };

  const deleteElement = (elementId: string) => {
    const newElements = elements.filter(el => el.id !== elementId);
    setElements(newElements);
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

    const newElements = [...elements, newElement];
    setElements(newElements);
    setSelectedElement(newElement);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === 'select') {
      setSelectedElement(null);
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    addElement(selectedTool, x, y);
    setSelectedTool('select');
  };

  const handleElementMouseDown = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
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
      const element = elements.find(el => el.id === draggedElement);
      if (element) {
        const newX = Math.max(0, Math.min(x - element.width / 2, canvasSize.width - element.width));
        const newY = Math.max(0, Math.min(y - element.height / 2, canvasSize.height - element.height));
        updateElement(draggedElement, { x: newX, y: newY });
      }
    }

    // Handle resizing
    if (resizingElement) {
      const element = elements.find(el => el.id === resizingElement.id);
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
  }, [draggedElement, resizingElement, zoom, canvasSize, elements]);

  const handleMouseUp = () => {
    setDraggedElement(null);
    setResizingElement(null);
  };

  const clearCanvas = () => {
    setElements([]);
    setSelectedElement(null);
  };

  const exportTemplate = () => {
    if (!template) return;

    const exportData = {
      name: templateName,
      description: templateDescription,
      elements,
      backgroundImage,
      canvasSize,
      metadata: {
        exported: new Date().toISOString(),
        version: '2.0',
        originalId: template.id
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla-${templateName.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
  };

  const getElementIcon = (type: string) => {
    const elementType = elementTypes.find(t => t.type === type);
    return elementType?.icon || Square;
  };

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

  if (loading || loading_template) {
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

  if (!user || user.role !== 'business' || !template) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/dashboard/plantillas-croquis"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Volver a Plantillas
            </Link>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Editor de Croquis</h1>
                <p className="text-gray-600 mt-1">Diseña el layout de tu plantilla</p>
              </div>

              <div className="flex items-center gap-4">
                {lastSaved && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle size={16} />
                    Guardado a las {lastSaved}
                  </div>
                )}

                <Button onClick={saveTemplate} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Guardar
                    </>
                  )}
                </Button>

                <Button variant="outline" onClick={exportTemplate}>
                  <Download size={16} className="mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </div>

          {/* Template Info */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-4">
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
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border-blue-200 bg-blue-50 mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-blue-800 font-semibold text-lg">{elements.length}</p>
                  <p className="text-blue-600 text-sm">Elementos</p>
                </div>
                <div>
                  <p className="text-blue-800 font-semibold text-lg">
                    {elements.filter(el => el.isReservable && el.capacity).reduce((total, el) => total + (el.capacity || 0), 0)}
                  </p>
                  <p className="text-blue-600 text-sm">Capacidad Total</p>
                </div>
                <div>
                  <p className="text-blue-800 font-semibold text-lg">{canvasSize.width}x{canvasSize.height}</p>
                  <p className="text-blue-600 text-sm">Tamaño Canvas</p>
                </div>
                <div>
                  <p className="text-blue-800 font-semibold text-lg">{template.usageCount || 0}</p>
                  <p className="text-blue-600 text-sm">Veces Usado</p>
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
                    onChange={(value) => setBackgroundImage(value || '')}
                    placeholder="Sube una imagen de tu local"
                    accept="image/*"
                    maxSize={5}
                  />
                  {backgroundImage && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBackgroundImage('')}
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
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {canvasSize.width} x {canvasSize.height}
                      </Badge>
                      <Badge variant="outline">
                        Zoom: {Math.round(zoom * 100)}%
                      </Badge>
                    </div>
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
                      {elements.map((element) => {
                        const Icon = getElementIcon(element.type);
                        const elementType = elementTypes.find(t => t.type === element.type);

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
                              backgroundColor: element.isOccupied
                                ? '#fecaca'
                                : elementType?.color + '20' || '#f3f4f6'
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

          {/* Auto-save indicator */}
          <Alert className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              💡 <strong>Consejo:</strong> Recuerda guardar tu plantilla frecuentemente. Los cambios se pueden perder si sales sin guardar.
            </AlertDescription>
          </Alert>
        </div>
      </main>

      <Footer />
    </div>
  );
}
