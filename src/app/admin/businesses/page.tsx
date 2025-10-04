'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Business, User } from '@/types';
import { db } from '@/lib/database';
import { ArrowLeft, Search, Users, Building, Mail, Phone, Plus, Copy, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function AdminBusinessesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessUsers, setBusinessUsers] = useState<User[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{email: string, password: string} | null>(null);
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: ''
  });

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/');
      return;
    }

    loadData();
  }, [user, router]);

  useEffect(() => {
    filterBusinesses();
  }, [businesses, searchTerm]);

  const loadData = () => {
    try {
      console.log('Loading businesses data...');
      const allBusinesses = db.getBusinesses();
      const allUsers = db.getUsers().filter(u => u.role === 'business');

      console.log('Loaded businesses:', allBusinesses.length);
      console.log('Loaded business users:', allUsers.length);

      setBusinesses(allBusinesses);
      setBusinessUsers(allUsers);
    } catch (error) {
      console.error('Error loading businesses data:', error);
    }
  };

  const filterBusinesses = () => {
    let filtered = [...businesses];

    if (searchTerm) {
      filtered = filtered.filter(business =>
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    console.log('Filtered businesses:', filtered.length);
    setFilteredBusinesses(filtered);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleCreateBusiness = () => {
    if (!newBusiness.name || !newBusiness.email || !newBusiness.phone) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const businessId = Date.now().toString();
      const userId = (Date.now() + 1).toString();
      const generatedPassword = generatePassword();

      console.log('Creating business:', { businessId, userId, email: newBusiness.email });

      // Create business
      const business: Business = {
        id: businessId,
        name: newBusiness.name,
        email: newBusiness.email,
        phone: newBusiness.phone,
        address: newBusiness.address,
        description: newBusiness.description,
        ownerId: userId
      };

      // Create user
      const businessUser: User = {
        id: userId,
        email: newBusiness.email,
        password: generatedPassword,
        name: newBusiness.name,
        role: 'business',
        businessId: businessId
      };

      // Save to database
      db.addBusiness(business);
      db.addUser(businessUser);

      console.log('Business and user created successfully');

      // Show credentials
      setGeneratedCredentials({
        email: newBusiness.email,
        password: generatedPassword
      });
      setShowCredentials(true);

      // Reset form
      setNewBusiness({
        name: '',
        email: '',
        phone: '',
        address: '',
        description: ''
      });
      setShowAddDialog(false);

      // Reload data
      loadData();

      alert('Negocio creado exitosamente');
    } catch (error) {
      console.error('Error creating business:', error);
      alert('Error al crear el negocio');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const copyCredentials = () => {
    if (generatedCredentials) {
      const credentialsText = `Email: ${generatedCredentials.email}\nContraseña: ${generatedCredentials.password}`;
      navigator.clipboard.writeText(credentialsText);
    }
  };

  const getBusinessOwner = (ownerId: string) => {
    return businessUsers.find(user => user.id === ownerId);
  };

  const getBusinessEvents = (businessId: string) => {
    return db.getEventsByBusinessId(businessId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando gestión de negocios...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Volver al Panel Admin
            </Link>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Negocios</h1>
                <p className="text-gray-600 mt-1">Administra las discotecas registradas en la plataforma</p>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus size={16} className="mr-2" />
                    Agregar Negocio
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Negocio</DialogTitle>
                    <DialogDescription>
                      Completa la información del negocio. Se generarán credenciales automáticamente.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="businessName">Nombre del Negocio *</Label>
                      <Input
                        id="businessName"
                        value={newBusiness.name}
                        onChange={(e) => setNewBusiness({...newBusiness, name: e.target.value})}
                        placeholder="Club Paradise"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="businessEmail">Email *</Label>
                      <Input
                        id="businessEmail"
                        type="email"
                        value={newBusiness.email}
                        onChange={(e) => setNewBusiness({...newBusiness, email: e.target.value})}
                        placeholder="club@paradise.com"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Este será el email de acceso para el negocio
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="businessPhone">Teléfono *</Label>
                      <Input
                        id="businessPhone"
                        value={newBusiness.phone}
                        onChange={(e) => setNewBusiness({...newBusiness, phone: e.target.value})}
                        placeholder="78005026"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="businessAddress">Dirección</Label>
                      <Input
                        id="businessAddress"
                        value={newBusiness.address}
                        onChange={(e) => setNewBusiness({...newBusiness, address: e.target.value})}
                        placeholder="Av. Las Americas #123"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="businessDescription">Descripción</Label>
                      <Textarea
                        id="businessDescription"
                        value={newBusiness.description}
                        onChange={(e) => setNewBusiness({...newBusiness, description: e.target.value})}
                        placeholder="Breve descripción del negocio..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">🔐 Credenciales</h4>
                      <p className="text-sm text-blue-700">
                        Se generarán automáticamente credenciales de acceso para el negocio.
                        Podrás copiarlas después de crear el negocio.
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleCreateBusiness}
                        disabled={!newBusiness.name || !newBusiness.email || !newBusiness.phone}
                        className="flex-1"
                      >
                        Crear Negocio
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddDialog(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Building className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Negocios</p>
                    <p className="text-2xl font-bold text-gray-900">{businesses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Usuarios Negocio</p>
                    <p className="text-2xl font-bold text-gray-900">{businessUsers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-purple-600 rounded flex items-center justify-center text-white font-bold">
                    📅
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Eventos Totales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {businesses.reduce((total, business) =>
                        total + getBusinessEvents(business.id).length, 0
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Buscar negocios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Businesses List */}
          <Card>
            <CardHeader>
              <CardTitle>Negocios Registrados ({filteredBusinesses.length})</CardTitle>
              <CardDescription>
                Lista de todas las discotecas registradas en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredBusinesses.length === 0 ? (
                <div className="text-center py-12">
                  <Building size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontraron negocios
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm
                      ? 'Intenta ajustar la búsqueda'
                      : 'No hay negocios registrados aún'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredBusinesses.map((business) => {
                    const owner = getBusinessOwner(business.ownerId);
                    const events = getBusinessEvents(business.id);
                    const approvedEvents = events.filter(e => e.status === 'approved');
                    const pendingEvents = events.filter(e => e.status === 'pending');

                    return (
                      <div key={business.id} className="border rounded-lg p-6 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{business.name}</h3>
                            {business.description && (
                              <p className="text-gray-600 mt-1">{business.description}</p>
                            )}
                          </div>
                          <Badge variant="outline">
                            {events.length} evento{events.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Business Info */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Información del Negocio</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail size={16} className="text-gray-400" />
                                <span>{business.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone size={16} className="text-gray-400" />
                                <span>{business.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span>📍</span>
                                <span>{business.address}</span>
                              </div>
                            </div>
                          </div>

                          {/* Owner & Stats */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Propietario y Estadísticas</h4>
                            <div className="space-y-2 text-sm">
                              {owner && (
                                <div className="flex items-center gap-2">
                                  <Users size={16} className="text-gray-400" />
                                  <span>{owner.name} ({owner.email})</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <span>✅</span>
                                <span>{approvedEvents.length} eventos aprobados</span>
                              </div>
                              {pendingEvents.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <span>⏳</span>
                                  <span>{pendingEvents.length} eventos pendientes</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <span>🎫</span>
                                <span>
                                  {events.reduce((total, event) => total + (event.currentSales || 0), 0)} entradas vendidas
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Recent Events */}
                        {events.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="font-medium text-gray-900 mb-2">Eventos Recientes</h4>
                            <div className="flex flex-wrap gap-2">
                              {events.slice(0, 3).map((event) => (
                                <Badge
                                  key={event.id}
                                  variant={event.status === 'approved' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {event.title} - {event.status}
                                </Badge>
                              ))}
                              {events.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{events.length - 3} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Credentials Dialog */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 ¡Negocio Creado Exitosamente!</DialogTitle>
            <DialogDescription>
              Se han generado las credenciales de acceso. Compártelas con el negocio.
            </DialogDescription>
          </DialogHeader>

          {generatedCredentials && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3">Credenciales de Acceso</h4>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Email de acceso:</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={generatedCredentials.email}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedCredentials.email)}
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Contraseña:</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={generatedCredentials.password}
                        type={showPassword ? 'text' : 'password'}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedCredentials.password)}
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-green-200">
                  <Button
                    onClick={copyCredentials}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Copy size={16} className="mr-2" />
                    Copiar Todas las Credenciales
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">📋 Instrucciones para el Negocio</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Pueden acceder en: <strong>/login</strong></li>
                  <li>• Su panel está en: <strong>/dashboard</strong></li>
                  <li>• Pueden crear eventos con el wizard</li>
                  <li>• Los eventos necesitan aprobación del admin</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowCredentials(false)}
                  className="flex-1"
                >
                  Entendido
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
