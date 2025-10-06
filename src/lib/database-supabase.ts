import { supabase } from './supabase';
import bcrypt from 'bcryptjs';
import type {
  User,
  Event,
  Business,
  Purchase,
  Ticket,
  EventSector,
  EventCombo,
  SeatMapElement,
  CroquisTemplate,
  SiteConfig,
  CarouselImage,
  VerificationCode
} from '@/types';

// =============================================================================
// USUARIOS
// =============================================================================

async function addUser(userData: {
  email: string;
  password: string;
  name: string;
  role: User['role'];
  businessId?: string;
  createdBy?: string;
  permissions?: Record<string, any>;
}): Promise<User | null> {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert({
        email: userData.email,
        password_hash: hashedPassword,
        name: userData.name,
        role: userData.role,
        business_id: userData.businessId || null,
        created_by: userData.createdBy || null,
        permissions: userData.permissions || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding user:', error);
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      businessId: data.business_id,
      createdBy: data.created_by,
      permissions: data.permissions,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Exception adding user:', error);
    return null;
  }
}

async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      console.log('User not found:', email);
      return null;
    }

    const passwordMatch = await bcrypt.compare(password, data.password_hash);
    if (!passwordMatch) {
      console.log('Invalid password for:', email);
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      businessId: data.business_id,
      createdBy: data.created_by,
      permissions: data.permissions,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Exception authenticating user:', error);
    return null;
  }
}

async function getUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      businessId: data.business_id,
      createdBy: data.created_by,
      permissions: data.permissions,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Exception getting user by ID:', error);
    return null;
  }
}

async function getAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting all users:', error);
      return [];
    }

    return data.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: user.business_id,
      createdBy: user.created_by,
      permissions: user.permissions,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));
  } catch (error) {
    console.error('Exception getting all users:', error);
    return [];
  }
}

// =============================================================================
// NEGOCIOS
// =============================================================================

async function addBusiness(businessData: {
  name: string;
  email: string;
  phone: string;
  address?: string;
  logo?: string;
  description?: string;
  ownerId?: string;
  paymentQrUrl?: string;
  paymentInstructions?: string;
}): Promise<Business | null> {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .insert({
        name: businessData.name,
        email: businessData.email,
        phone: businessData.phone,
        address: businessData.address,
        logo: businessData.logo,
        description: businessData.description,
        owner_id: businessData.ownerId,
        payment_qr_url: businessData.paymentQrUrl,
        payment_instructions: businessData.paymentInstructions
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding business:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      logo: data.logo,
      description: data.description,
      ownerId: data.owner_id,
      paymentQrUrl: data.payment_qr_url,
      paymentInstructions: data.payment_instructions,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Exception adding business:', error);
    return null;
  }
}

async function getAllBusinesses(): Promise<Business[]> {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting all businesses:', error);
      return [];
    }

    return data.map(business => ({
      id: business.id,
      name: business.name,
      email: business.email,
      phone: business.phone,
      address: business.address,
      logo: business.logo,
      description: business.description,
      ownerId: business.owner_id,
      paymentQrUrl: business.payment_qr_url,
      paymentInstructions: business.payment_instructions,
      createdAt: business.created_at,
      updatedAt: business.updated_at
    }));
  } catch (error) {
    console.error('Exception getting all businesses:', error);
    return [];
  }
}

async function getBusinessById(id: string): Promise<Business | null> {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      logo: data.logo,
      description: data.description,
      ownerId: data.owner_id,
      paymentQrUrl: data.payment_qr_url,
      paymentInstructions: data.payment_instructions,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Exception getting business by ID:', error);
    return null;
  }
}

// =============================================================================
// EVENTOS
// =============================================================================

async function addEvent(eventData: {
  title: string;
  description: string;
  date: string;
  time: string;
  image?: string;
  businessId: string;
  status?: Event['status'];
  totalCapacity?: number;
  seatMapData?: any;
}): Promise<Event | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: eventData.title,
        description: eventData.description,
        date: eventData.date,
        time: eventData.time,
        image: eventData.image,
        business_id: eventData.businessId,
        status: eventData.status || 'pending',
        total_capacity: eventData.totalCapacity,
        seat_map_data: eventData.seatMapData
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding event:', error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      date: data.date,
      time: data.time,
      image: data.image,
      businessId: data.business_id,
      status: data.status,
      totalCapacity: data.total_capacity,
      seatMapData: data.seat_map_data,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Exception adding event:', error);
    return null;
  }
}

async function getAllEvents(): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error getting all events:', error);
      return [];
    }

    return data.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      image: event.image,
      businessId: event.business_id,
      status: event.status,
      totalCapacity: event.total_capacity,
      seatMapData: event.seat_map_data,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }));
  } catch (error) {
    console.error('Exception getting all events:', error);
    return [];
  }
}

async function getEventById(id: string): Promise<Event | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      date: data.date,
      time: data.time,
      image: data.image,
      businessId: data.business_id,
      status: data.status,
      totalCapacity: data.total_capacity,
      seatMapData: data.seat_map_data,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Exception getting event by ID:', error);
    return null;
  }
}

async function updateEventStatus(eventId: string, status: Event['status']): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('events')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', eventId);

    if (error) {
      console.error('Error updating event status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating event status:', error);
    return false;
  }
}

async function getEventsByBusiness(businessId: string): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('business_id', businessId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error getting events by business:', error);
      return [];
    }

    return data.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      image: event.image,
      businessId: event.business_id,
      status: event.status,
      totalCapacity: event.total_capacity,
      seatMapData: event.seat_map_data,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }));
  } catch (error) {
    console.error('Exception getting events by business:', error);
    return [];
  }
}

// =============================================================================
// SECTORES DE EVENTOS
// =============================================================================

async function addEventSector(sectorData: {
  eventId: string;
  name: string;
  price: number;
  capacity: number;
  priceType: EventSector['priceType'];
  color?: string;
}): Promise<EventSector | null> {
  try {
    const { data, error } = await supabase
      .from('event_sectors')
      .insert({
        event_id: sectorData.eventId,
        name: sectorData.name,
        price: sectorData.price,
        capacity: sectorData.capacity,
        price_type: sectorData.priceType,
        color: sectorData.color
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding event sector:', error);
      return null;
    }

    return {
      id: data.id,
      eventId: data.event_id,
      name: data.name,
      price: data.price,
      capacity: data.capacity,
      priceType: data.price_type,
      color: data.color,
      availableSpots: data.available_spots,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Exception adding event sector:', error);
    return null;
  }
}

async function getEventSectors(eventId: string): Promise<EventSector[]> {
  try {
    const { data, error } = await supabase
      .from('event_sectors')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting event sectors:', error);
      return [];
    }

    return data.map(sector => ({
      id: sector.id,
      eventId: sector.event_id,
      name: sector.name,
      price: sector.price,
      capacity: sector.capacity,
      priceType: sector.price_type,
      color: sector.color,
      availableSpots: sector.available_spots,
      createdAt: sector.created_at,
      updatedAt: sector.updated_at
    }));
  } catch (error) {
    console.error('Exception getting event sectors:', error);
    return [];
  }
}

// =============================================================================
// CONFIGURACIÓN DEL SITIO
// =============================================================================

async function getSiteConfig(): Promise<SiteConfig | null> {
  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      siteName: data.site_name,
      siteDescription: data.site_description,
      logo: data.logo,
      favicon: data.favicon,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      contactEmail: data.contact_email,
      contactPhone: data.contact_phone,
      socialLinks: data.social_links,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Exception getting site config:', error);
    return null;
  }
}

async function updateSiteConfig(configData: Partial<SiteConfig>): Promise<boolean> {
  try {
    const updateData: any = {};

    if (configData.siteName !== undefined) updateData.site_name = configData.siteName;
    if (configData.siteDescription !== undefined) updateData.site_description = configData.siteDescription;
    if (configData.logo !== undefined) updateData.logo = configData.logo;
    if (configData.favicon !== undefined) updateData.favicon = configData.favicon;
    if (configData.primaryColor !== undefined) updateData.primary_color = configData.primaryColor;
    if (configData.secondaryColor !== undefined) updateData.secondary_color = configData.secondaryColor;
    if (configData.contactEmail !== undefined) updateData.contact_email = configData.contactEmail;
    if (configData.contactPhone !== undefined) updateData.contact_phone = configData.contactPhone;
    if (configData.socialLinks !== undefined) updateData.social_links = configData.socialLinks;

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('site_config')
      .upsert(updateData);

    if (error) {
      console.error('Error updating site config:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating site config:', error);
    return false;
  }
}

// =============================================================================
// IMÁGENES DEL CARRUSEL
// =============================================================================

async function addCarouselImage(imageData: {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  isActive?: boolean;
}): Promise<CarouselImage | null> {
  try {
    // Obtener el siguiente order_position
    const { data: maxOrder } = await supabase
      .from('carousel_images')
      .select('order_position')
      .order('order_position', { ascending: false })
      .limit(1);

    const nextOrderPosition = (maxOrder && maxOrder[0]?.order_position || 0) + 1;

    const { data, error } = await supabase
      .from('carousel_images')
      .insert({
        url: imageData.imageUrl,                    // ✅ Correcto
        title: imageData.title || 'Nueva imagen',   // ✅ REQUIRED - valor por defecto
        subtitle: imageData.subtitle || null,       // ✅ Opcional
        link: imageData.linkUrl || null,            // ✅ Opcional
        order_position: nextOrderPosition,          // ✅ REQUIRED - calculado
        is_active: imageData.isActive ?? true       // ✅ Correcto
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding carousel image:', error);
      return null;
    }

    return {
      id: data.id,
      imageUrl: data.url,              // ✅ Correcto: url -> imageUrl
      title: data.title,
      subtitle: data.subtitle,
      linkUrl: data.link,              // ✅ Correcto: link -> linkUrl
      isActive: data.is_active,        // ✅ Correcto: is_active -> isActive
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Exception adding carousel image:', error);
    return null;
  }
}

async function getCarouselImages(): Promise<CarouselImage[]> {
  try {
    const { data, error } = await supabase
      .from('carousel_images')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting carousel images:', error);
      return [];
    }

    return data.map(image => ({
      id: image.id,
      imageUrl: image.url,             // ✅ Correcto: url -> imageUrl
      title: image.title,
      subtitle: image.subtitle,
      linkUrl: image.link,             // ✅ Correcto: link -> linkUrl
      isActive: image.is_active,       // ✅ Correcto: is_active -> isActive
      createdAt: image.created_at,
      updatedAt: image.updated_at
    }));
  } catch (error) {
    console.error('Exception getting carousel images:', error);
    return [];
  }
}

async function getAllCarouselImages(): Promise<CarouselImage[]> {
  try {
    const { data, error } = await supabase
      .from('carousel_images')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting all carousel images:', error);
      return [];
    }

    return data.map(image => ({
      id: image.id,
      imageUrl: image.url,             // ✅ Correcto: url -> imageUrl
      title: image.title,
      subtitle: image.subtitle,
      linkUrl: image.link,             // ✅ Correcto: link -> linkUrl
      isActive: image.is_active,       // ✅ Correcto: is_active -> isActive
      createdAt: image.created_at,
      updatedAt: image.updated_at
    }));
  } catch (error) {
    console.error('Exception getting all carousel images:', error);
    return [];
  }
}

async function deleteCarouselImage(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('carousel_images')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting carousel image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception deleting carousel image:', error);
    return false;
  }
}

// =============================================================================
// COMPRAS Y TICKETS
// =============================================================================

async function addPurchase(purchaseData: {
  eventId: string;
  sectorId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
  totalAmount: number;
  selectedSeats?: string[];
  paymentMethod?: Purchase['paymentMethod'];
}): Promise<Purchase | null> {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .insert({
        event_id: purchaseData.eventId,
        sector_id: purchaseData.sectorId,
        customer_name: purchaseData.customerName,
        customer_email: purchaseData.customerEmail,
        customer_phone: purchaseData.customerPhone,
        quantity: purchaseData.quantity,
        total_amount: purchaseData.totalAmount,
        selected_seats: purchaseData.selectedSeats,
        payment_method: purchaseData.paymentMethod || 'qr',
        status: 'pending_payment'
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding purchase:', error);
      return null;
    }

    return {
      id: data.id,
      eventId: data.event_id,
      sectorId: data.sector_id,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerPhone: data.customer_phone,
      quantity: data.quantity,
      totalAmount: data.total_amount,
      selectedSeats: data.selected_seats,
      paymentMethod: data.payment_method,
      status: data.status,
      verificationCode: data.verification_code,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Exception adding purchase:', error);
    return null;
  }
}

async function generateVerificationCode(purchaseId: string, type: VerificationCode['type']): Promise<string | null> {
  try {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from('verification_codes')
      .insert({
        code,
        purchase_id: purchaseId,
        type,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        is_used: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error generating verification code:', error);
      return null;
    }

    return data.code;
  } catch (error) {
    console.error('Exception generating verification code:', error);
    return null;
  }
}

// Funciones auxiliares faltantes
async function getPendingEvents(): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting pending events:', error);
      return [];
    }

    return data.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      city: event.city,
      image: event.image,
      price: event.price,
      businessId: event.business_id,
      businessName: event.business_name,
      maxCapacity: event.max_capacity,
      currentSales: event.current_sales,
      isActive: event.is_active,
      status: event.status,
      rejectionReason: event.rejection_reason,
      businessContact: event.business_contact,
      paymentInfo: event.payment_info,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }));
  } catch (error) {
    console.error('Exception getting pending events:', error);
    return [];
  }
}

async function approveEvent(eventId: string): Promise<boolean> {
  return updateEventStatus(eventId, 'approved');
}

async function rejectEvent(eventId: string, reason?: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);

    return !error;
  } catch (error) {
    console.error('Exception rejecting event:', error);
    return false;
  }
}

// Exportar todas las funciones
export const db = {
  // Usuarios
  addUser,
  authenticateUser,
  getUserById,
  getAllUsers,

  // Negocios
  addBusiness,
  getAllBusinesses,
  getBusinessById,

  // Eventos
  addEvent,
  getAllEvents,
  getEventById,
  updateEventStatus,
  getEventsByBusiness,
  getPendingEvents,
  approveEvent,
  rejectEvent,

  // Sectores
  addEventSector,
  getEventSectors,

  // Configuración del sitio
  getSiteConfig,
  updateSiteConfig,

  // Carrusel
  addCarouselImage,
  getCarouselImages,
  getAllCarouselImages,
  deleteCarouselImage,

  // Compras y tickets
  addPurchase,
  generateVerificationCode
};
