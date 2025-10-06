'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Business } from '@/types';
import { db } from '@/lib/database';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Import the complete wizard components
import WizardProgress from '@/components/EventWizard/WizardProgress';
import Step1BasicInfo from '@/components/EventWizard/Step1BasicInfo';
import Step2Sectors from '@/components/EventWizard/Step2Sectors';
import Step3Conditions from '@/components/EventWizard/Step3Conditions';
import Step4SeatMap from '@/components/EventWizard/Step4SeatMap';
import Step5ContactPayment from '@/components/EventWizard/Step5ContactPayment';

export default function WizardEventoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [wizardData, setWizardData] = useState({
    // Step 1: Basic Info
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    city: '',
    image: '',

    // Step 2: Sectors
    sectors: [],

    // Step 3: Conditions & Combos
    reservationConditions: [],
    combos: [],

    // Step 4: Seat Map
    seatMapElements: [],

    // Step 5: Contact & Payment
    businessContact: {
      phone: '',
      whatsapp: ''
    },
    paymentInfo: {
      qrUrl: '',
      instructions: ''
    }
  });

  const totalSteps = 5;

  const wizardSteps = [
    { number: 1, title: 'Información', description: 'Datos básicos' },
    { number: 2, title: 'Sectores', description: 'Precios y áreas' },
    { number: 3, title: 'Condiciones', description: 'Reglas y combos' },
    { number: 4, title: 'Croquis', description: 'Layout del evento' },
    { number: 5, title: 'Finalizar', description: 'Contacto y pagos' }
  ];

  const loadBusiness = async () => {
    try {
      if (user?.businessId) {
        const businessData = await db.getBusinessById(user.businessId);
        setBusiness(businessData || null);

        if (businessData) {
          // Pre-fill with business data
          setWizardData(prev => ({
            ...prev,
            location: businessData.name,
            businessContact: {
              phone: businessData.phone,
              whatsapp: businessData.phone
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error loading business:', error);
    }
  };

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role === 'admin') {
      router.push('/admin');
      return;
    }

    if (user.role !== 'business') {
      router.push('/');
      return;
    }

    loadBusiness();
  }, [user, router, loading]);

  const updateWizardData = (field: string, value: any) => {
    setWizardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    try {
      setIsSubmitting(true);
      console.log('Creating event with data:', wizardData);

      // Validar que tenemos los datos mínimos necesarios
      if (!wizardData.title || !wizardData.date || !wizardData.time) {
        alert('Por favor completa todos los campos obligatorios.');
        return;
      }

      // Validar límites de tamaño para evitar errores de base de datos
      if (wizardData.title.length > 100) {
        alert(`El título es demasiado largo (máximo 100 caracteres). Actualmente: ${wizardData.title.length}`);
        return;
      }

      if (wizardData.description && wizardData.description.length > 500) {
        alert(`La descripción es demasiado larga (máximo 500 caracteres). Actualmente: ${wizardData.description.length}`);
        return;
      }

      if (wizardData.city && wizardData.city.length > 50) {
        alert(`El nombre de la ciudad es demasiado largo (máximo 50 caracteres). Actualmente: ${wizardData.city.length}`);
        return;
      }

      if (wizardData.location && wizardData.location.length > 200) {
        alert(`La ubicación es demasiado larga (máximo 200 caracteres). Actualmente: ${wizardData.location.length}`);
        return;
      }

      // Manejar imagen base64 muy larga
      if (wizardData.image && wizardData.image.startsWith('data:image/') && wizardData.image.length > 1000) {
        console.warn('⚠️ Image base64 too long, using default image');
        setWizardData(prev => ({ ...prev, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop' }));
      }

      if (!user?.businessId || !business?.name) {
        alert('Error: No se puede identificar el negocio. Por favor inicia sesión nuevamente.');
        return;
      }

      // Calcular capacidad total y precio base
      const totalCapacity = wizardData.sectors && wizardData.sectors.length > 0
        ? wizardData.sectors.reduce((total: number, sector: any) => total + (sector.capacity || 0), 0)
        : 100;

      const basePrice = wizardData.sectors && wizardData.sectors.length > 0
        ? Math.min(...wizardData.sectors.map((sector: any) => sector.basePrice || 50))
        : 50;

      const eventData = {
        title: wizardData.title,
        description: wizardData.description || '',
        date: wizardData.date,
        time: wizardData.time,
        image: wizardData.image || 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
        location: wizardData.location || '',
        city: wizardData.city || '',
        businessId: user.businessId,
        businessName: business.name,
        maxCapacity: totalCapacity,
        businessContact: wizardData.businessContact || { phone: '', whatsapp: '' },
        paymentInfo: wizardData.paymentInfo || { qrUrl: '', instructions: '' },
        status: 'pending' as const,
        isActive: false,
        currentSales: 0,
        sectors: wizardData.sectors || [],
        seatMapElements: wizardData.seatMapElements || [],
        reservationConditions: wizardData.reservationConditions || [],
        combos: wizardData.combos || [],
        price: basePrice
      };

      console.log('Sending event data to database:', eventData);

      const createdEvent = await db.addEvent(eventData);

      if (createdEvent) {
        console.log('✅ Event created successfully:', createdEvent.id);
        alert('¡Evento creado exitosamente! Está pendiente de aprobación por el administrador.');
        router.push('/dashboard');
      } else {
        console.error('❌ Event creation returned null');
        alert('Error al crear el evento: No se pudo insertar en la base de datos. Verifica tu conexión e inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('❌ Exception during event creation:', error);

      // Proporcionar mensaje de error más específico
      let errorMessage = 'Error al crear el evento. ';
      if (error instanceof Error) {
        errorMessage += `Detalles: ${error.message}`;
      } else {
        errorMessage += 'Error desconocido. Inténtalo de nuevo.';
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando wizard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || user.role !== 'business') {
    return null;
  }

  const renderStep = () => {
    // Añadir keys únicas y estabilidad
    const stepProps = {
      data: wizardData,
      onUpdate: updateWizardData,
    };

    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            key="step1"
            {...stepProps}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <Step2Sectors
            key="step2"
            {...stepProps}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <Step3Conditions
            key="step3"
            {...stepProps}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <Step4SeatMap
            key="step4"
            {...stepProps}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <Step5ContactPayment
            key="step5"
            {...stepProps}
            onFinish={handleFinish}
            onBack={handleBack}
            loading={isSubmitting}
          />
        );
      default:
        return <div key="no-step">Paso no encontrado</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Volver al Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Wizard de Eventos</h1>
            <p className="text-gray-600 mt-1">Crea tu evento paso a paso con nuestro asistente completo</p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <WizardProgress
              currentStep={currentStep}
              totalSteps={totalSteps}
              steps={wizardSteps}
            />
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div key={`step-${currentStep}`}>
              {renderStep()}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
