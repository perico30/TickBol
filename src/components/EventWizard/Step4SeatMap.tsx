'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FileUpload from '@/components/ui/file-upload';
import { SeatMapElement, EventSector, CroquisTemplate } from '@/types';
import { Plus, RotateCw, Trash2, Move, Image as ImageIcon, Palette, Save, Download, Copy, Bookmark } from 'lucide-react';
import { db } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';

interface Step4Props {
  data: {
    seatMapElements: SeatMapElement[];
    sectors: EventSector[];
  };
  onUpdate: (field: string, value: SeatMapElement[]) => void;
  onNext: () => void;
  onBack: () => void;
}

type ElementType = 'table' | 'chair' | 'bar' | 'bathroom' | 'stage' | 'entrance';

const elementTypes = [
  { id: 'table' as ElementType, name: 'Mesa', defaultSize: { width: 60, height: 60 } },
  { id: 'chair' as ElementType, name: 'Silla', defaultSize: { width: 30, height: 30 } },
  { id: 'bar' as ElementType, name: 'Bar', defaultSize: { width: 100, height: 40 } },
  { id: 'bathroom' as ElementType, name: 'Baño', defaultSize: { width: 50, height: 50 } },
  { id: 'stage' as ElementType, name: 'Escenario', defaultSize: { width: 120, height: 60 } },
  { id: 'entrance' as ElementType, name: 'Entrada', defaultSize: { width: 80, height: 40 } }
];

const predefinedColors = [
  '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#84cc16', '#06d6a0', '#ff6b6b', '#4ecdc4'
];

export default function Step4SeatMap({ data, onUpdate, onNext, onBack }: Step4Props) {
  const { user } = useAuth();
  const [selectedElement, setSelectedElement] = useState<SeatMapElement | null>(null);
  const [newElementType, setNewElementType] = useState<ElementType>('table');
  const [newElementColor, setNewElementColor] = useState('#ffffff');
  const [referenceImage, setReferenceImage] = useState<string>('');
  const [referenceOpacity, setReferenceOpacity] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'se' | 'sw' | 'ne' | 'nw' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Estados para plantillas
  const [templates, setTemplates] = useState<CroquisTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const canvasRef = useRef<HTMLDivElement>(null);

  // Cargar plantillas del negocio
  useEffect(() => {
    if (user?.businessId) {
      const businessTemplates = db.getCroquisTemplatesByBusinessId(user.businessId);
      setTemplates(businessTemplates);
    }
  }, [user?.businessId]);

  const addElement = () => {
    const elementType = elementTypes.find(t => t.id === newElementType);
    if (!elementType) return;

    const newElement: SeatMapElement = {
      id: Date.now().toString(),
      type: newElementType,
      x: 50,
      y: 50,
      width: elementType.defaultSize.width,
      height: elementType.defaultSize.height,
      rotation: 0,
      sectorId: data.sectors[0]?.id,
      capacity: newElementType === 'table' ? 4 : 1,
      label: `${elementType.name} ${data.seatMapElements.length + 1}`,
      isReservable: newElementType === 'table' || newElementType === 'chair',
      color: newElementColor
    };

    onUpdate('seatMapElements', [...data.seatMapElements, newElement]);
  };

  const updateElement = (id: string, updates: Partial<SeatMapElement>) => {
    const updated = data.seatMapElements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    );
    onUpdate('seatMapElements', updated);

    // Update selectedElement if it's the one being edited
    if (selectedElement?.id === id) {
      setSelectedElement({ ...selectedElement, ...updates });
    }
  };

  const removeElement = (id: string) => {
    const updated = data.seatMapElements.filter(el => el.id !== id);
    onUpdate('seatMapElements', updated);
    if (selectedElement?.id === id) {
      setSelectedElement(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, element: SeatMapElement, action: 'drag' | 'resize', handle?: 'se' | 'sw' | 'ne' | 'nw') => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedElement(element);

    if (action === 'drag') {
      setIsDragging(true);
    } else {
      setIsResizing(true);
      setResizeHandle(handle || 'se');
    }

    setDragStart({
      x: e.clientX,
      y: e.clientY,
      width: element.width,
      height: element.height
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectedElement || (!isDragging && !isResizing)) return;

    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    if (isDragging) {
      updateElement(selectedElement.id, {
        x: Math.max(0, Math.min(canvasX - 30, rect.width - selectedElement.width)),
        y: Math.max(0, Math.min(canvasY - 30, rect.height - selectedElement.height))
      });
    } else if (isResizing && resizeHandle) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      let newWidth = dragStart.width;
      let newHeight = dragStart.height;
      let newX = selectedElement.x;
      let newY = selectedElement.y;

      switch (resizeHandle) {
        case 'se': // bottom-right
          newWidth = Math.max(20, dragStart.width + deltaX);
          newHeight = Math.max(20, dragStart.height + deltaY);
          break;
        case 'sw': // bottom-left
          newWidth = Math.max(20, dragStart.width - deltaX);
          newHeight = Math.max(20, dragStart.height + deltaY);
          newX = selectedElement.x + (dragStart.width - newWidth);
          break;
        case 'ne': // top-right
          newWidth = Math.max(20, dragStart.width + deltaX);
          newHeight = Math.max(20, dragStart.height - deltaY);
          newY = selectedElement.y + (dragStart.height - newHeight);
          break;
        case 'nw': // top-left
          newWidth = Math.max(20, dragStart.width - deltaX);
          newHeight = Math.max(20, dragStart.height - deltaY);
          newX = selectedElement.x + (dragStart.width - newWidth);
          newY = selectedElement.y + (dragStart.height - newHeight);
          break;
      }

      updateElement(selectedElement.id, {
        x: Math.max(0, newX),
        y: Math.max(0, newY),
        width: newWidth,
        height: newHeight
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const getSectorColor = (sectorId?: string) => {
    const sector = data.sectors.find(s => s.id === sectorId);
    return sector?.color || '#gray';
  };

  // Funciones para manejar plantillas
  const loadTemplate = (templateId: string) => {
    const template = db.getCroquisTemplateById(templateId);
    if (template) {
      onUpdate('seatMapElements', template.seatMapElements);
      // También actualizar sectores si la plantilla los incluye
      if (template.sectors.length > 0) {
        // Aquí podrías actualizar los sectores también si es necesario
        // Por ahora solo actualizamos los elementos del croquis
      }
      db.incrementTemplateUsage(templateId);
      setSelectedTemplate(templateId);
    }
  };

  const saveAsTemplate = () => {
    if (!user?.businessId || !templateName.trim()) {
      alert('Por favor ingresa un nombre para la plantilla');
      return;
    }

    try {
      const template = db.createCroquisTemplate({
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        businessId: user.businessId,
        seatMapElements: data.seatMapElements,
        sectors: data.sectors,
        isDefault: templates.length === 0 // Primera plantilla será default
      });

      // Actualizar estado local
      const updatedTemplates = db.getCroquisTemplatesByBusinessId(user.businessId);
      setTemplates(updatedTemplates);

      // Limpiar formulario
      setTemplateName('');
      setTemplateDescription('');
      setShowTemplateModal(false);

      alert(`Plantilla "${template.name}" guardada exitosamente`);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error al guardar la plantilla');
    }
  };

  const duplicateTemplate = (templateId: string) => {
    const originalTemplate = templates.find(t => t.id === templateId);
    if (originalTemplate && user?.businessId) {
      const newName = prompt(`Nombre para la copia de "${originalTemplate.name}":`, `${originalTemplate.name} - Copia`);
      if (newName && newName.trim()) {
        const duplicated = db.duplicateCroquisTemplate(templateId, newName.trim());
        if (duplicated) {
          const updatedTemplates = db.getCroquisTemplatesByBusinessId(user.businessId);
          setTemplates(updatedTemplates);
          alert(`Plantilla duplicada como "${duplicated.name}"`);
        }
      }
    }
  };

  const deleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template && confirm(`¿Estás seguro de eliminar la plantilla "${template.name}"?`)) {
      if (db.deleteCroquisTemplate(templateId) && user?.businessId) {
        const updatedTemplates = db.getCroquisTemplatesByBusinessId(user.businessId);
        setTemplates(updatedTemplates);
        if (selectedTemplate === templateId) {
          setSelectedTemplate('');
        }
        alert('Plantilla eliminada exitosamente');
      }
    }
  };

  const setAsDefault = (templateId: string) => {
    if (user?.businessId && db.setDefaultTemplate(user.businessId, templateId)) {
      const updatedTemplates = db.getCroquisTemplatesByBusinessId(user.businessId);
      setTemplates(updatedTemplates);
      alert('Plantilla establecida como predeterminada');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Diseñar Croquis</h2>
        <p className="text-gray-600 mt-2">
          Arrastra y organiza los elementos para crear el layout de tu evento
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Toolbar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Plantillas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Plantillas
              </CardTitle>
              <CardDescription>
                Cargar o guardar layouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates.length > 0 && (
                <div>
                  <Label>Cargar Plantilla</Label>
                  <Select value={selectedTemplate} onValueChange={loadTemplate}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona una plantilla" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            {template.name}
                            {template.isDefault && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Default</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateModal(true)}
                  className="flex-1"
                  disabled={data.seatMapElements.length === 0}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Guardar
                </Button>
                {selectedTemplate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateTemplate(selectedTemplate)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {templates.length > 0 && (
                <div className="text-xs text-gray-500">
                  {templates.length} plantilla(s) guardada(s)
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Elementos</CardTitle>
              <CardDescription>
                Agregar elementos al croquis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="elementType">Tipo de Elemento</Label>
                <Select value={newElementType} onValueChange={(value: ElementType) => setNewElementType(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {elementTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Color del Elemento</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewElementColor(color)}
                      className={`w-8 h-8 rounded border-2 ${
                        newElementColor === color ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="color"
                    value={newElementColor}
                    onChange={(e) => setNewElementColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={newElementColor}
                    onChange={(e) => setNewElementColor(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>

              <Button onClick={addElement} className="w-full">
                <Plus size={16} className="mr-2" />
                Agregar Elemento
              </Button>

              <div className="text-xs text-gray-500 space-y-1">
                <p>💡 Click y arrastra para mover</p>
                <p>💡 Esquinas para redimensionar</p>
                <p>💡 Click en elemento para seleccionar</p>
              </div>
            </CardContent>
          </Card>

          {/* Reference Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon size={16} />
                Imagen de Referencia
              </CardTitle>
              <CardDescription>
                Sube un plano o foto de tu local (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                value={referenceImage}
                onChange={(value) => setReferenceImage(value || '')}
                placeholder="Subir imagen de referencia"
                accept="image/*"
                maxSize={5}
              />
              {referenceImage && (
                <div className="mt-3">
                  <Label>Opacidad de la imagen: {referenceOpacity}%</Label>
                  <Input
                    type="range"
                    min="10"
                    max="100"
                    value={referenceOpacity}
                    onChange={(e) => setReferenceOpacity(parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Element Properties */}
          {selectedElement && (
            <Card>
              <CardHeader>
                <CardTitle>Propiedades</CardTitle>
                <CardDescription>
                  {selectedElement.label}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="elementLabel">Etiqueta</Label>
                  <Input
                    id="elementLabel"
                    value={selectedElement.label || ''}
                    onChange={(e) => updateElement(selectedElement.id, { label: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Color del Elemento</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateElement(selectedElement.id, { color })}
                        className={`w-6 h-6 rounded border ${
                          selectedElement.color === color ? 'border-gray-900 border-2' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="color"
                      value={selectedElement.color || '#ffffff'}
                      onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                      className="w-12 h-8 p-1"
                    />
                    <Input
                      value={selectedElement.color || '#ffffff'}
                      onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="elementWidth">Ancho</Label>
                    <Input
                      id="elementWidth"
                      type="number"
                      min="20"
                      value={selectedElement.width}
                      onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 20 })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="elementHeight">Alto</Label>
                    <Input
                      id="elementHeight"
                      type="number"
                      min="20"
                      value={selectedElement.height}
                      onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 20 })}
                      className="mt-1"
                    />
                  </div>
                </div>

                {selectedElement.isReservable && (
                  <>
                    <div>
                      <Label htmlFor="elementCapacity">Capacidad</Label>
                      <Input
                        id="elementCapacity"
                        type="number"
                        min="1"
                        value={selectedElement.capacity || 1}
                        onChange={(e) => updateElement(selectedElement.id, { capacity: parseInt(e.target.value) || 1 })}
                        className="mt-1"
                      />
                    </div>

                    {data.sectors.length > 0 && (
                      <div>
                        <Label htmlFor="elementSector">Sector</Label>
                        <Select
                          value={selectedElement.sectorId || ''}
                          onValueChange={(value) => updateElement(selectedElement.id, { sectorId: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {data.sectors.map((sector) => (
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
                  </>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateElement(selectedElement.id, { rotation: (selectedElement.rotation + 90) % 360 })}
                  >
                    <RotateCw size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeElement(selectedElement.id)}
                  >
                    <Trash2 size={14} />
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
              <CardTitle>Croquis del Evento</CardTitle>
              <CardDescription>
                Vista del layout de tu evento ({data.seatMapElements.length} elementos)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={canvasRef}
                className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-crosshair select-none"
                style={{ width: '100%', height: '500px' }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Reference Image */}
                {referenceImage && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ opacity: referenceOpacity / 100 }}
                  >
                    <img
                      src={referenceImage}
                      alt="Referencia"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Empty State */}
                {data.seatMapElements.length === 0 && !referenceImage && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🏗️</div>
                      <p className="text-gray-500">Agrega elementos para comenzar</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Usa el panel de la izquierda para agregar mesas, sillas, etc.
                      </p>
                    </div>
                  </div>
                )}

                {/* Elements */}
                {data.seatMapElements.map((element) => (
                  <div
                    key={element.id}
                    className={`absolute border-2 rounded flex items-center justify-center text-xs font-medium transition-all hover:shadow-md cursor-move ${
                      selectedElement?.id === element.id
                        ? 'border-blue-500 z-10'
                        : 'border-gray-400'
                    }`}
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                      transform: `rotate(${element.rotation}deg)`,
                      backgroundColor: element.color || '#ffffff',
                      borderColor: element.isReservable && element.sectorId
                        ? getSectorColor(element.sectorId)
                        : element.color || '#gray'
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedElement(element);
                    }}
                  >
                    <div
                      className="flex-1 h-full flex items-center justify-center text-center cursor-move"
                      onMouseDown={(e) => handleMouseDown(e, element, 'drag')}
                    >
                      <div className="leading-tight">
                        <div className="text-xs truncate max-w-full font-medium text-gray-800">
                          {element.label}
                        </div>
                        {element.capacity && element.capacity > 1 && (
                          <div className="text-xs text-gray-600">
                            {element.capacity}p
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selection Indicator and Resize Handles */}
                    {selectedElement?.id === element.id && (
                      <>
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs pointer-events-none">
                          <Move size={10} />
                        </div>

                        {/* Corner Resize Handles */}
                        <div
                          className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize"
                          onMouseDown={(e) => handleMouseDown(e, element, 'resize', 'nw')}
                        />
                        <div
                          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize"
                          onMouseDown={(e) => handleMouseDown(e, element, 'resize', 'ne')}
                        />
                        <div
                          className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize"
                          onMouseDown={(e) => handleMouseDown(e, element, 'resize', 'sw')}
                        />
                        <div
                          className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-se-resize"
                          onMouseDown={(e) => handleMouseDown(e, element, 'resize', 'se')}
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              {data.sectors.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <h4 className="font-medium text-sm mb-2">Leyenda de Sectores:</h4>
                  <div className="flex flex-wrap gap-3">
                    {data.sectors.map((sector) => (
                      <div key={sector.id} className="flex items-center gap-2 text-xs">
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: sector.color }}
                        />
                        <span>{sector.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal para guardar plantilla */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Guardar como Plantilla</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplateModal(false)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="templateName">Nombre de la Plantilla *</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ej: Layout Estándar"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="templateDescription">Descripción (opcional)</Label>
                <Input
                  id="templateDescription"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe la configuración de este layout"
                  className="mt-1"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
                <strong>📊 Este layout incluye:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• {data.seatMapElements.length} elementos</li>
                  <li>• {data.sectors.length} sectores configurados</li>
                  {templates.length === 0 && (
                    <li>• Se establecerá como plantilla predeterminada</li>
                  )}
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={saveAsTemplate}
                  disabled={!templateName.trim()}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          ← Anterior
        </Button>
        <Button onClick={onNext}>
          Siguiente: Contacto y Pagos →
        </Button>
      </div>
    </div>
  );
}
