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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Event } from '@/types';
import { db } from '@/lib/database';
import {
  ArrowLeftIcon,
  UserPlusIcon,
  UserIcon,
  EyeIcon,
  EyeOffIcon,
  EditIcon,
  TrashIcon,
  CopyIcon,
  ShieldCheckIcon,
  KeyIcon
} from 'lucide-react';
import Link from 'next/link';

export default function PersonalPorteriaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [porteriaUsers, setPorteriaUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showPasswordFor, setShowPasswordFor] = useState<string>('');
  const [newCredentials, setNewCredentials] = useState<{email: string, password: string} | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    canValidateTickets: true,
    canViewStats: true,
    allowedEvents: [] as string[]
  });

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

    loadData();
  }, [user, loading, router]);

  const loadData = () => {
    if (user?.businessId) {
      try {
        // Cargar usuarios de portería del negocio
        const porteriaStaff = db.getPorteriaUsersByBusinessId(user.businessId);
        setPorteriaUsers(porteriaStaff);

        // Cargar eventos del negocio
        const businessEvents = db.getEventsByBusinessId(user.businessId);
        setEvents(businessEvents);

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading porteria users:', error);
        setIsLoading(false);
      }
    }
  };

  const generateCredentials = () => {
    const credentials = db.generatePorteriaCredentials();
    setNewUser(prev => ({
      ...prev,
      email: credentials.email,
      password: credentials.password
    }));
  };

  const handleCreate = () => {
    if (!user?.businessId || !newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const porteriaUser = db.createPorteriaUser({
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        businessId: user.businessId,
        createdBy: user.id,
        permissions: {
          canValidateTickets: newUser.canValidateTickets,
          canViewStats: newUser.canViewStats,
          allowedEvents: newUser.allowedEvents.length > 0 ? newUser.allowedEvents : undefined
        }
      });

      // Mostrar credenciales generadas
      setNewCredentials({
        email: porteriaUser.email,
        password: newUser.password
      });
      setShowCredentialsModal(true);

      // Resetear formulario
      setNewUser({
        name: '',
        email: '',
        password: '',
        canValidateTickets: true,
        canViewStats: true,
        allowedEvents: []
      });
      setShowCreateModal(false);

      // Recargar datos
      loadData();

      alert('Usuario de portería creado exitosamente');
    } catch (error) {
      console.error('Error creating porteria user:', error);
      alert('Error al crear el usuario de portería');
    }
  };

  const handleDelete = (userId: string, userName: string) => {
    if (confirm(`¿Estás seguro de eliminar al usuario de portería "${userName}"? Esta acción no se puede deshacer.`)) {
      try {
        const success = db.deletePorteriaUser(userId);
        if (success) {
          loadData();
          alert('Usuario eliminado exitosamente');
        } else {
          alert('Error al eliminar el usuario');
        }
      } catch (error) {
        console.error('Error deleting porteria user:', error);
        alert('Error al eliminar el usuario');
      }
    }
  };

  const copyCredentials = (email: string, password: string) => {
    const credentials = `Email: ${email}\nContraseña: ${password}\nAcceso: ${window.location.origin}/porteria`;
    navigator.clipboard.writeText(credentials);
    alert('Credenciales copiadas al portapapeles');
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordFor(showPasswordFor === userId ? '' : userId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando personal de portería...</p>
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
                <ShieldCheckIcon className="mr-3 text-green-600" size={32} />
                Personal de Portería
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona los usuarios que pueden validar tickets en tus eventos
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <UserPlusIcon size={16} className="mr-2" />
              Agregar Personal
            </Button>
          </div>

          {porteriaUsers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ShieldCheckIcon size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes personal de portería
                </h3>
                <p className="text-gray-500 mb-6">
                  Crea usuarios dedicados para validar tickets en la entrada de tus eventos
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <UserPlusIcon size={16} className="mr-2" />
                  Agregar Primer Usuario
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {porteriaUsers.map((porteriaUser) => (
                <Card key={porteriaUser.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <UserIcon size={20} />
                          {porteriaUser.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {porteriaUser.email}
                        </CardDescription>
                      </div>
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        Portería
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Credenciales */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600">Contraseña:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePasswordVisibility(porteriaUser.id)}
                            >
                              {showPasswordFor === porteriaUser.id ? (
                                <EyeOffIcon size={14} />
                              ) : (
                                <EyeIcon size={14} />
                              )}
                            </Button>
                          </div>
                          <div className="font-mono text-xs">
                            {showPasswordFor === porteriaUser.id
                              ? porteriaUser.password
                              : '••••••••'
                            }
                          </div>
                        </div>
                      </div>

                      {/* Permisos */}
                      <div className="space-y-2 text-sm">
                        <div className="font-medium text-gray-700">Permisos:</div>
                        <div className="flex flex-wrap gap-2">
                          {porteriaUser.permissions?.canValidateTickets && (
                            <Badge variant="secondary" className="text-xs">
                              Validar Tickets
                            </Badge>
                          )}
                          {porteriaUser.permissions?.canViewStats && (
                            <Badge variant="secondary" className="text-xs">
                              Ver Estadísticas
                            </Badge>
                          )}
                        </div>

                        {porteriaUser.permissions?.allowedEvents && porteriaUser.permissions.allowedEvents.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Eventos específicos: {porteriaUser.permissions.allowedEvents.length}
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyCredentials(porteriaUser.email, porteriaUser.password)}
                          className="flex items-center gap-1"
                        >
                          <CopyIcon size={14} />
                          Copiar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(porteriaUser.id, porteriaUser.name)}
                          className="flex items-center gap-1"
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
                <KeyIcon size={20} />
                💡 Información sobre Personal de Portería
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-medium mb-2">¿Qué pueden hacer?</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Acceder al dashboard de portería (/porteria)</li>
                    <li>• Escanear y validar tickets de entrada</li>
                    <li>• Ver estadísticas de eventos en tiempo real</li>
                    <li>• Marcar tickets como usados al permitir entrada</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Seguridad</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Solo pueden validar tickets de tu negocio</li>
                    <li>• Acceso limitado a funciones específicas</li>
                    <li>• Contraseñas únicas generadas automáticamente</li>
                    <li>• Puedes eliminar acceso en cualquier momento</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal para crear usuario */}
      {showCreateModal && (
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Personal de Portería</DialogTitle>
              <DialogDescription>
                Crea un usuario para validar tickets en tus eventos
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Juan Pérez"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@ejemplo.com"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateCredentials}
                    size="sm"
                  >
                    Generar
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Contraseña segura"
                  className="mt-1"
                />
              </div>

              <div className="border-t pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Puede validar tickets</Label>
                    <input
                      type="checkbox"
                      checked={newUser.canValidateTickets}
                      onChange={(e) => setNewUser(prev => ({
                        ...prev,
                        canValidateTickets: e.target.checked
                      }))}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Puede ver estadísticas</Label>
                    <input
                      type="checkbox"
                      checked={newUser.canViewStats}
                      onChange={(e) => setNewUser(prev => ({
                        ...prev,
                        canViewStats: e.target.checked
                      }))}
                      className="rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()}
                  className="flex-1"
                >
                  Crear Usuario
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal para mostrar credenciales */}
      {showCredentialsModal && newCredentials && (
        <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>¡Usuario Creado Exitosamente!</DialogTitle>
              <DialogDescription>
                Guarda estas credenciales para el personal de portería
              </DialogDescription>
            </DialogHeader>

            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <div>
                <span className="text-sm font-medium text-blue-900">Email:</span>
                <div className="font-mono text-sm bg-white p-2 rounded mt-1">
                  {newCredentials.email}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-blue-900">Contraseña:</span>
                <div className="font-mono text-sm bg-white p-2 rounded mt-1">
                  {newCredentials.password}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-blue-900">Acceso:</span>
                <div className="font-mono text-sm bg-white p-2 rounded mt-1">
                  {window.location.origin}/porteria
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => copyCredentials(newCredentials.email, newCredentials.password)}
                className="flex-1"
              >
                <CopyIcon size={16} className="mr-2" />
                Copiar Todo
              </Button>
              <Button
                onClick={() => setShowCredentialsModal(false)}
                className="flex-1"
              >
                Entendido
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Footer />
    </div>
  );
}
