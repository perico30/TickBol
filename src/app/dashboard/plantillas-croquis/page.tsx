'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CroquisTemplate } from '@/types';
import { db } from '@/lib/database';
import { Map, Plus, Trash2, Edit, Copy, Star, Download, Upload, Clock, User } from 'lucide-react';
import Link from 'next/link';

export default function PlantillasCroquisPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<CroquisTemplate[]>([]);
  const [loading_templates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<CroquisTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');

  const loadTemplates = async () => {
    try {
      if (user?.businessId) {
        setLoadingTemplates(true);
        const businessTemplates = await db.getCroquisTemplatesByBusinessId(user.businessId);
        setTemplates(businessTemplates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'business') {
      router.push('/');
      return;
    }
    loadTemplates();
  }, [user, router]);

  const createEmptyTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert('Por favor ingresa un nombre para la plantilla');
      return;
    }

    try {
      const newTemplate = {
        name: newTemplateName,
        description: newTemplateDescription,
        elements: [],
        backgroundImage: '',
        canvasSize: { width: 1000, height: 700 },
        businessId: user?.businessId || ''
      };

      const createdTemplate = await db.createCroquisTemplate(newTemplate);
      setTemplates([...templates, createdTemplate]);
      setShowCreateDialog(false);
      setNewTemplateName('');
      setNewTemplateDescription('');

      // Redirect to editor with new template
      router.push(`/dashboard/editor-croquis/${createdTemplate.id}`);
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error al crear la plantilla');
    }
  };

  const duplicateTemplate = async (template: CroquisTemplate) => {
    try {
      const duplicatedTemplate = await db.duplicateCroquisTemplate(template.id, `${template.name} (Copia)`);
      if (duplicatedTemplate) {
        setTemplates([...templates, duplicatedTemplate]);
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Error al duplicar la plantilla');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const success = await db.deleteCroquisTemplate(templateId);
      if (success) {
        setTemplates(templates.filter(t => t.id !== templateId));
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error al eliminar la plantilla');
    }
  };

  const setAsDefault = async (templateId: string) => {
    try {
      const success = await db.setDefaultTemplate(user?.businessId || '', templateId);
      if (success) {
        // Refresh templates to show updated default status
        loadTemplates();
      }
    } catch (error) {
      console.error('Error setting default template:', error);
      alert('Error al establecer como predeterminada');
    }
  };

  const exportTemplate = (template: CroquisTemplate) => {
    const exportData = {
      name: template.name,
      description: template.description,
      elements: template.elements,
      backgroundImage: template.backgroundImage,
      canvasSize: template.canvasSize,
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
    a.download = `plantilla-${template.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
  };

  const importTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);

        const newTemplate = {
          name: importData.name || 'Plantilla Importada',
          description: importData.description || '',
          elements: importData.elements || [],
          backgroundImage: importData.backgroundImage || '',
          canvasSize: importData.canvasSize || { width: 1000, height: 700 },
          businessId: user?.businessId || ''
        };

        const createdTemplate = await db.createCroquisTemplate(newTemplate);
        setTemplates([...templates, createdTemplate]);

        alert('Plantilla importada exitosamente');
      } catch (error) {
        console.error('Error importing template:', error);
        alert('Error al importar la plantilla. Verifica que el archivo sea válido.');
      }
    };
    reader.readAsText(file);

    // Reset the input
    event.target.value = '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || loading_templates) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando plantillas...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || user.role !== 'business') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              ← Volver al Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Plantillas de Croquis</h1>
            <p className="text-gray-600 mt-1">Gestiona los diseños de layout para tus eventos</p>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={16} className="mr-2" />
                  Nueva Plantilla
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Plantilla</DialogTitle>
                  <DialogDescription>
                    Crea una plantilla de croquis desde cero
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="templateName">Nombre de la Plantilla</Label>
                    <Input
                      id="templateName"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Ej: Layout Principal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="templateDescription">Descripción</Label>
                    <Input
                      id="templateDescription"
                      value={newTemplateDescription}
                      onChange={(e) => setNewTemplateDescription(e.target.value)}
                      placeholder="Descripción opcional"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createEmptyTemplate} className="flex-1">
                      Crear y Editar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                <Upload size={16} className="mr-2" />
                Importar Plantilla
                <input
                  type="file"
                  accept=".json"
                  onChange={importTemplate}
                  className="hidden"
                />
              </label>
            </Button>

            <Link href="/dashboard/wizard-evento">
              <Button variant="outline">
                <Map size={16} className="mr-2" />
                Usar en Evento
              </Button>
            </Link>
          </div>

          {/* Templates Grid */}
          {templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {template.backgroundImage ? (
                      <div
                        className="h-48 bg-cover bg-center bg-gray-200"
                        style={{ backgroundImage: `url(${template.backgroundImage})` }}
                      >
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                          <div className="text-white text-center">
                            <Map size={32} className="mx-auto mb-2" />
                            <p className="text-sm">{template.elements?.length || 0} elementos</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <div className="text-gray-400 text-center">
                          <Map size={32} className="mx-auto mb-2" />
                          <p className="text-sm">{template.elements?.length || 0} elementos</p>
                          <p className="text-xs">Sin imagen de fondo</p>
                        </div>
                      </div>
                    )}

                    {template.isDefault && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500">
                        <Star size={12} className="mr-1" />
                        Predeterminada
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
                      {template.name}
                    </h3>

                    {template.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    <div className="space-y-2 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock size={12} />
                        <span>Creada: {formatDate(template.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Map size={12} />
                        <span>{template.canvasSize.width}x{template.canvasSize.height}px</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={12} />
                        <span>Usada {template.usageCount || 0} veces</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/editor-croquis/${template.id}`}
                        className="flex-1"
                      >
                        <Button size="sm" className="w-full">
                          <Edit size={12} className="mr-1" />
                          Editar
                        </Button>
                      </Link>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => duplicateTemplate(template)}
                      >
                        <Copy size={12} />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportTemplate(template)}
                      >
                        <Download size={12} />
                      </Button>

                      {!template.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAsDefault(template.id)}
                          title="Establecer como predeterminada"
                        >
                          <Star size={12} />
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => {
                          if (confirm(`¿Eliminar la plantilla "${template.name}"? Esta acción no se puede deshacer.`)) {
                            deleteTemplate(template.id);
                          }
                        }}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Map size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No tienes plantillas de croquis
                </h3>
                <p className="text-gray-600 mb-6">
                  Crea tu primera plantilla para diseñar el layout de tus eventos
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus size={16} className="mr-2" />
                    Crear Primera Plantilla
                  </Button>
                  <Button variant="outline" asChild>
                    <label className="cursor-pointer">
                      <Upload size={16} className="mr-2" />
                      Importar Plantilla
                      <input
                        type="file"
                        accept=".json"
                        onChange={importTemplate}
                        className="hidden"
                      />
                    </label>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">¿Cómo usar las plantillas?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Crear plantillas</h4>
                  <ul className="space-y-1">
                    <li>• Crea plantillas desde cero o importa diseños existentes</li>
                    <li>• Sube una imagen de fondo de tu local</li>
                    <li>• Agrega mesas, escenario, barras y otros elementos</li>
                    <li>• Asigna sectores con diferentes precios</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Usar en eventos</h4>
                  <ul className="space-y-1">
                    <li>• Selecciona una plantilla al crear un evento</li>
                    <li>• Las plantillas se aplican automáticamente en el Step 4</li>
                    <li>• Puedes modificar el diseño para cada evento específico</li>
                    <li>• Los cambios no afectan la plantilla original</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
