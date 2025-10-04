'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CroquisTemplate } from '@/types';
import { db } from '@/lib/database';
import {
  ArrowLeftIcon,
  BookmarkIcon,
  CopyIcon,
  TrashIcon,
  EditIcon,
  StarIcon,
  PlusIcon,
  EyeIcon,
  SettingsIcon
} from 'lucide-react';
import Link from 'next/link';

export default function PlantillasCroquisPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<CroquisTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<CroquisTemplate | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'business') {
      router.push('/');
      return;
    }

    loadTemplates();
  }, [user, loading, router]);

  const loadTemplates = () => {
    if (user?.businessId) {
      try {
        const businessTemplates = db.getCroquisTemplatesByBusinessId(user.businessId);
        setTemplates(businessTemplates);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading templates:', error);
        setIsLoading(false);
      }
    }
  };

  const handleEdit = (template: CroquisTemplate) => {
    setEditingTemplate(template);
    setEditName(template.name);
    setEditDescription(template.description || '');
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingTemplate || !editName.trim()) {
      alert('El nombre es requerido');
      return;
    }

    try {
      const success = db.updateCroquisTemplate(editingTemplate.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined
      });

      if (success) {
        loadTemplates();
        setShowEditModal(false);
        setEditingTemplate(null);
        alert('Plantilla actualizada exitosamente');
      } else {
        alert('Error al actualizar la plantilla');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Error al actualizar la plantilla');
    }
  };

  const handleDuplicate = (template: CroquisTemplate) => {
    const newName = prompt(`Nombre para la copia de "${template.name}":`, `${template.name} - Copia`);
    if (newName && newName.trim()) {
      try {
        const duplicated = db.duplicateCroquisTemplate(template.id, newName.trim());
        if (duplicated) {
          loadTemplates();
          alert(`Plantilla duplicada como "${duplicated.name}"`);
        } else {
          alert('Error al duplicar la plantilla');
        }
      } catch (error) {
        console.error('Error duplicating template:', error);
        alert('Error al duplicar la plantilla');
      }
    }
  };

  const handleDelete = (template: CroquisTemplate) => {
    if (confirm(`¿Estás seguro de eliminar la plantilla "${template.name}"? Esta acción no se puede deshacer.`)) {
      try {
        const success = db.deleteCroquisTemplate(template.id);
        if (success) {
          loadTemplates();
          alert('Plantilla eliminada exitosamente');
        } else {
          alert('Error al eliminar la plantilla');
        }
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Error al eliminar la plantilla');
      }
    }
  };

  const handleSetDefault = (template: CroquisTemplate) => {
    if (user?.businessId && confirm(`¿Establecer "${template.name}" como plantilla predeterminada?`)) {
      try {
        const success = db.setDefaultTemplate(user.businessId, template.id);
        if (success) {
          loadTemplates();
          alert('Plantilla establecida como predeterminada');
        } else {
          alert('Error al establecer como predeterminada');
        }
      } catch (error) {
        console.error('Error setting default template:', error);
        alert('Error al establecer como predeterminada');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || isLoading) {
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
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <Link
                  href="/dashboard"
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeftIcon size={20} className="mr-2" />
                  Volver al Dashboard
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BookmarkIcon className="mr-3 text-blue-600" size={32} />
                Plantillas de Croquis
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona tus layouts guardados para reutilizar en futuros eventos
              </p>
            </div>
            <Link href="/dashboard/wizard-evento">
              <Button>
                <PlusIcon size={16} className="mr-2" />
                Crear Evento
              </Button>
            </Link>
          </div>

          {templates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookmarkIcon size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes plantillas guardadas
                </h3>
                <p className="text-gray-500 mb-6">
                  Crea un evento y guarda el croquis como plantilla para reutilizarlo en futuros eventos
                </p>
                <Link href="/dashboard/wizard-evento">
                  <Button>
                    <PlusIcon size={16} className="mr-2" />
                    Crear Primer Evento
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="relative group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {template.name}
                          {template.isDefault && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs">
                              <StarIcon size={12} className="mr-1" />
                              Default
                            </Badge>
                          )}
                        </CardTitle>
                        {template.description && (
                          <CardDescription className="mt-1">
                            {template.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Estadísticas */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium text-gray-900">
                            {template.seatMapElements.length}
                          </div>
                          <div className="text-gray-600">Elementos</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium text-gray-900">
                            {template.sectors.length}
                          </div>
                          <div className="text-gray-600">Sectores</div>
                        </div>
                      </div>

                      {/* Información adicional */}
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Creado: {formatDate(template.createdAt)}</div>
                        {template.updatedAt && (
                          <div>Actualizado: {formatDate(template.updatedAt)}</div>
                        )}
                        <div>Usado: {template.usageCount} veces</div>
                      </div>

                      {/* Acciones */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(template)}
                          className="flex items-center gap-1"
                        >
                          <EditIcon size={14} />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicate(template)}
                          className="flex items-center gap-1"
                        >
                          <CopyIcon size={14} />
                          Duplicar
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {!template.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(template)}
                            className="flex items-center gap-1"
                          >
                            <StarIcon size={14} />
                            Default
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(template)}
                          className="flex items-center gap-1"
                          disabled={template.isDefault && templates.length === 1}
                        >
                          <TrashIcon size={14} />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Información útil */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon size={20} />
                💡 Consejos sobre Plantillas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-medium mb-2">¿Cómo funcionan?</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Guarda layouts para reutilizar en futuros eventos</li>
                    <li>• Incluye posición de mesas, sectores y configuraciones</li>
                    <li>• La plantilla default se carga automáticamente</li>
                    <li>• Duplica plantillas para crear variaciones</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Mejores prácticas</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Usa nombres descriptivos ("Layout VIP", "Configuración Bodas")</li>
                    <li>• Agrega descripciones para recordar el uso específico</li>
                    <li>• Mantén una plantilla base como default</li>
                    <li>• Elimina plantillas que ya no uses</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de edición */}
      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Editar Plantilla</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="editName">Nombre *</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="editDescription">Descripción</Label>
                <Input
                  id="editDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={saveEdit}
                  disabled={!editName.trim()}
                  className="flex-1"
                >
                  Guardar Cambios
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
