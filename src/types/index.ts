export interface User {
  id: string;
  email: string;
  password?: string; // Password only needed for creation, not for display
  name: string;
  role: 'admin' | 'business' | 'customer' | 'porteria';
  businessId?: string;
  createdBy?: string; // ID del usuario que creó este usuario
  permissions?: {
    canValidateTickets?: boolean;
    canViewStats?: boolean;
    allowedEvents?: string[]; // IDs de eventos que puede validar
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Business {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
  description?: string;
  ownerId: string;
  paymentQrUrl?: string;
  paymentInstructions?: string;
}

export interface EventSector {
  id: string;
  eventId?: string;
  name: string;
  color: string;
  capacity: number;
  price: number;
  priceType?: 'per_seat' | 'per_table';
  basePrice?: number;
  isActive?: boolean;
  description?: string;
  createdAt?: string;
}

export interface EventCombo {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  type: 'cumple' | 'tragos' | 'otros';
  sectorRestriction?: string[]; // IDs de sectores donde aplica
  isActive: boolean;
}

export interface ReservationCondition {
  id: string;
  description: string;
  minTicketsPerTable?: number;
  maxTicketsPerTable?: number;
  advancePaymentRequired?: number; // porcentaje
  cancellationPolicy?: string;
}

export interface SeatMapElement {
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

export interface CroquisTemplate {
  id: string;
  name: string;
  description?: string;
  businessId: string;
  elements: SeatMapElement[];
  backgroundImage?: string;
  canvasSize?: { width: number; height: number };
  isDefault?: boolean;
  createdAt: string;
  updatedAt?: string;
  usageCount?: number; // Para estadísticas
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  city: string;
  image: string;
  price: number;
  businessId: string;
  businessName: string;
  maxCapacity?: number;
  currentSales?: number;
  isActive: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;

  // Wizard data
  sectors: EventSector[];
  combos: EventCombo[];
  reservationConditions: ReservationCondition[];
  seatMapElements: SeatMapElement[];
  businessContact: {
    phone: string;
    whatsapp?: string;
  };
  paymentInfo: {
    qrUrl?: string;
    instructions?: string;
  };
  croquisId?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (email: string, password: string, name: string, role: User['role']) => Promise<boolean>;
}

export interface SiteConfig {
  id: string;
  siteName: string;
  siteDescription?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CarouselImage {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventWizardData {
  // Step 1: Basic Info
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  city: string;
  image: string;

  // Step 2: Sectors
  sectors: EventSector[];

  // Step 3: Reservation Conditions & Combos
  reservationConditions: ReservationCondition[];
  combos: EventCombo[];

  // Step 4: Seat Map
  seatMapElements: SeatMapElement[];

  // Step 5: Contact & Payment
  businessContact: {
    phone: string;
    whatsapp?: string;
  };
  paymentInfo: {
    qrUrl?: string;
    instructions?: string;
  };
}

// Sistema de Tickets Digitales
export interface Ticket {
  id: string;
  purchaseId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  businessName: string;
  businessLogo?: string;

  // Datos del ticket
  sectorName: string;
  sectorColor: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  ticketType: 'CLIENTE' | 'VIP' | 'STAFF';

  // Códigos únicos
  verificationCode: string; // 8 dígitos alfanuméricos
  qrCode: string; // ID único para el QR

  // Estado y fechas
  status: 'pending' | 'validated' | 'used' | 'cancelled';
  isActive: boolean;
  createdAt: string;
  validatedAt?: string;
  usedAt?: string;
}

export interface Purchase {
  id: string;
  eventId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;

  // Detalles de compra
  tickets: Ticket[];
  totalAmount: number;
  paymentMethod: 'qr' | 'transfer' | 'cash' | 'external';
  paymentProof?: string; // URL del comprobante

  // Estado y fechas
  status: 'pending_payment' | 'payment_submitted' | 'payment_verified' | 'completed' | 'cancelled';
  verificationCode: string; // Código principal de la compra

  createdAt: string;
  paymentSubmittedAt?: string;
  verifiedAt?: string;
  completedAt?: string;

  // WhatsApp notifications
  notificationsSent: {
    paymentReceived: boolean;
    paymentVerified: boolean;
    ticketsReady: boolean;
  };
}

export interface VerificationCode {
  id: string;
  code: string; // 8 dígitos alfanuméricos únicos
  type: 'purchase' | 'ticket';
  relatedId: string; // purchaseId o ticketId
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

// Portal de entradas
export interface TicketPortalData {
  purchase: Purchase;
  tickets: Ticket[];
  event: Event;
  business: Business;
}

// Dashboard de portería
export interface PorteriaValidation {
  ticketId: string;
  verificationCode: string;
  qrCode: string;
  validatedBy: string; // userId del portero
  validatedAt: string;
  location: string; // ubicación de la validación
}
