'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WizardProgress from '@/components/EventWizard/WizardProgress';
import Step1BasicInfo from '@/components/EventWizard/Step1BasicInfo';
import Step2Sectors from '@/components/EventWizard/Step2Sectors';
import Step3Conditions from '@/components/EventWizard/Step3Conditions';
import Step4SeatMap from '@/components/EventWizard/Step4SeatMap';
import Step5ContactPayment from '@/components/EventWizard/Step5ContactPayment';
import { EventWizardData, Event, Business, EventSector, ReservationCondition, EventCombo, SeatMapElement } from '@/types';
import { db } from '@/lib/database';

const wizardSteps = [
  {
    number: 1,
    title: 'Evento',
    description: 'Info básica'
  },
  {
    number: 2,
    title: 'Sectores',
    description: 'Precios y zonas'
  },
  {
    number: 3,
    title: 'Condiciones',
    description: 'Reglas y combos'
  },
  {
    number: 4,
    title: 'Croquis',
    description: 'Layout visual'
  },
  {
    number: 5,
    title: 'Contacto',
    description: 'Pagos y contacto'
  }
];

export default function EventWizardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);

  const [wizardData, setWizardData] = useState<EventWizardData>({
    // Step 1: Basic Info
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    city: 'Santa Cruz',
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

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'business') {
      router.push('/');
      return;
    }

    // Load business data
    if (user.businessId) {
      const businessData = db.getBusinessById(user.businessId);
      setBusiness(businessData || null);

      // Pre-populate some fields
      if (businessData) {
        setWizardData(prev => ({
          ...prev,
          location: businessData.name,
          businessContact: {
            phone: businessData.phone,
            whatsapp: ''
          }
        }));
      }
    }
  }, [user, authLoading, router]);

  const updateWizardData = (field: string, value: string | EventSector[] | ReservationCondition[] | EventCombo[] | SeatMapElement[] | { phone: string; whatsapp?: string } | { qrUrl?: string; instructions?: string }) => {
    setWizardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < wizardSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishWizard = async () => {
    if (!user || !business) return;

    setLoading(true);

    try {
      // Create the complete event object
      const newEvent: Event = {
        id: Date.now().toString(),
        title: wizardData.title,
        description: wizardData.description,
        date: wizardData.date,
        time: wizardData.time,
        location: wizardData.location || business.name,
        city: wizardData.city,
        image: wizardData.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop',
        price: wizardData.sectors.length > 0 ? wizardData.sectors[0].basePrice : 50,
        businessId: user.businessId!,
        businessName: business.name,
        maxCapacity: wizardData.sectors.reduce((total, sector) => total + sector.capacity, 0) || undefined,
        currentSales: 0,
        isActive: true,
        status: 'pending',
        createdAt: new Date().toISOString(),

        // Wizard specific data
        sectors: wizardData.sectors,
        combos: wizardData.combos,
        reservationConditions: wizardData.reservationConditions,
        seatMapElements: wizardData.seatMapElements,
        businessContact: wizardData.businessContact,
        paymentInfo: wizardData.paymentInfo
      };

      // Save to database
      db.addEvent(newEvent);

      // Redirect with success message
      router.push('/dashboard?created=true');
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
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

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <Step2Sectors
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <Step3Conditions
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <Step4SeatMap
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 5:
        return (
          <Step5ContactPayment
            data={wizardData}
            onUpdate={updateWizardData}
            onFinish={finishWizard}
            onBack={prevStep}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Crear Nuevo Evento
            </h1>
            <p className="text-gray-600">
              Sigue los pasos para configurar tu evento de manera profesional
            </p>
          </div>

          {/* Progress Indicator */}
          <WizardProgress
            currentStep={currentStep}
            totalSteps={wizardSteps.length}
            steps={wizardSteps}
          />

          {/* Step Content */}
          <div className="bg-white rounded-lg shadow-sm border p-8">
            {renderCurrentStep()}
          </div>

          {/* Debug Info (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <details>
                <summary className="cursor-pointer text-sm text-gray-600">
                  Ver datos del wizard (desarrollo)
                </summary>
                <pre className="mt-2 text-xs text-gray-500 overflow-auto">
                  {JSON.stringify(wizardData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
