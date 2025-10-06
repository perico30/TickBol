import { supabase } from './supabase';
import { User, Business, Event, SiteConfig, CarouselImage, Ticket, Purchase, VerificationCode, CroquisTemplate } from '@/types';
import bcrypt from 'bcryptjs';

// Base de datos con Supabase - VERSIÓN PRODUCCIÓN
class SupabaseDatabase {

  // ====================================================
  // UTILIDADES PRIVADAS
  // ====================================================

  private async handleDatabaseError(error: any, operation: string, defaultReturn: any = null) {
    if (error?.message?.includes('Could not find the table') ||
        error?.message?.includes('relation') && error?.message?.includes('does not exist')) {
      console.warn(`⚠️ Tabla no existe para operación: ${operation}. Retornando valor por defecto.`);
      return defaultReturn;
    }

    // Log más detallado para debugging
    console.error(`❌ Error en ${operation}:`, {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      error: error
    });

    return defaultReturn;
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  private generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateQRCode(): string {
    return 'QR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  private generateRandomPassword(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // ====================================================
  // USERS
  // ====================================================

  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return this.handleDatabaseError(error, 'getUsers', []);
      }

      return data.map(this.mapUserFromDB);
    } catch (error) {
      return this.handleDatabaseError(error, 'getUsers', []);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        return this.handleDatabaseError(error, 'getUserByEmail', undefined);
      }
      return this.mapUserFromDB(data);
    } catch (error) {
      return this.handleDatabaseError(error, 'getUserByEmail', undefined);
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return this.handleDatabaseError(error, 'getUserById', undefined);
      }
      return this.mapUserFromDB(data);
    } catch (error) {
      return this.handleDatabaseError(error, 'getUserById', undefined);
    }
  }

  async addUser(userData: Omit<User, 'id'>): Promise<User | null> {
    try {
      const hashedPassword = await this.hashPassword(userData.password);

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
        return this.handleDatabaseError(error, 'addUser', null);
      }

      return this.mapUserFromDB(data);
    } catch (error) {
      return this.handleDatabaseError(error, 'addUser', null);
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      const updateData: any = {};

      if (updates.email) updateData.email = updates.email;
      if (updates.name) updateData.name = updates.name;
      if (updates.role) updateData.role = updates.role;
      if (updates.businessId !== undefined) updateData.business_id = updates.businessId;
      if (updates.permissions) updateData.permissions = updates.permissions;
      if (updates.password) updateData.password_hash = await this.hashPassword(updates.password);

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return this.handleDatabaseError(error, 'updateUser', null);
      }

      return this.mapUserFromDB(data);
    } catch (error) {
      return this.handleDatabaseError(error, 'updateUser', null);
    }
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        return this.handleDatabaseError(error, 'authenticateUser', null);
      }

      const isValidPassword = await this.verifyPassword(password, data.password_hash);
      if (!isValidPassword) return null;

      return this.mapUserFromDB(data);
    } catch (error) {
      return this.handleDatabaseError(error, 'authenticateUser', null);
    }
  }

  // ====================================================
  // PORTERÍA USER MANAGEMENT
  // ====================================================

  async createPorteriaUser(userData: {
    name: string;
    email: string;
    password: string;
    businessId: string;
    createdBy: string;
    permissions?: {
      canValidateTickets?: boolean;
      canViewStats?: boolean;
      allowedEvents?: string[];
    };
  }): Promise<User | null> {
    const user = await this.addUser({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: 'porteria',
      businessId: userData.businessId,
      createdBy: userData.createdBy,
      permissions: {
        canValidateTickets: true,
        canViewStats: true,
        ...userData.permissions
      }
    });

    return user;
  }

  async getPorteriaUsersByBusinessId(businessId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'porteria')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching porteria users:', error);
      return [];
    }

    return data.map(this.mapUserFromDB);
  }

  async updatePorteriaUser(userId: string, updates: Partial<User>): Promise<boolean> {
    const updateData: any = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.email) updateData.email = updates.email;
    if (updates.permissions) updateData.permissions = updates.permissions;
    if (updates.password) updateData.password_hash = await this.hashPassword(updates.password);

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .eq('role', 'porteria');

    if (error) {
      console.error('Error updating porteria user:', error);
      return false;
    }

    return true;
  }

  async deletePorteriaUser(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
      .eq('role', 'porteria');

    if (error) {
      console.error('Error deleting porteria user:', error);
      return false;
    }

    return true;
  }

  generatePorteriaCredentials(): { email: string; password: string } {
    const timestamp = Date.now().toString().slice(-6);
    return {
      email: `porteria${timestamp}@temp.local`,
      password: this.generateRandomPassword(8)
    };
  }

  // ====================================================
  // BUSINESSES
  // ====================================================

  async getBusinesses(): Promise<Business[]> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return this.handleDatabaseError(error, 'getBusinesses', []);
      }

      return data.map(this.mapBusinessFromDB);
    } catch (error) {
      return this.handleDatabaseError(error, 'getBusinesses', []);
    }
  }

  async getBusinessById(id: string): Promise<Business | undefined> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return this.handleDatabaseError(error, 'getBusinessById', undefined);
      }
      return this.mapBusinessFromDB(data);
    } catch (error) {
      return this.handleDatabaseError(error, 'getBusinessById', undefined);
    }
  }

  async addBusiness(businessData: Omit<Business, 'id'>): Promise<Business | null> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          name: businessData.name,
          email: businessData.email,
          phone: businessData.phone,
          address: businessData.address || null,
          logo: businessData.logo || null,
          description: businessData.description || null,
          owner_id: businessData.ownerId,
          payment_qr_url: businessData.paymentQrUrl || null,
          payment_instructions: businessData.paymentInstructions || null
        })
        .select()
        .single();

      if (error) {
        return this.handleDatabaseError(error, 'addBusiness', null);
      }

      return this.mapBusinessFromDB(data);
    } catch (error) {
      return this.handleDatabaseError(error, 'addBusiness', null);
    }
  }

  // ====================================================
  // EVENTS
  // ====================================================

  async getEvents(): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_sectors(*),
          event_combos(*),
          reservation_conditions(*),
          seat_map_elements(*)
        `)
        .eq('is_active', true)
        .eq('status', 'approved')
        .order('date', { ascending: true });

      if (error) {
        return this.handleDatabaseError(error, 'getEvents', []);
      }

      return data.map(this.mapEventFromDB);
    } catch (error) {
      return this.handleDatabaseError(error, 'getEvents', []);
    }
  }

  async getAllEvents(): Promise<Event[]> {
    try {
      console.log('🔍 Fetching all events (including inactive for admin)...');

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_sectors(*),
          event_combos(*),
          reservation_conditions(*),
          seat_map_elements(*)
        `)
        // Removido el filtro .eq('is_active', true) para que el admin pueda ver todos los eventos
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching all events:', error);
        return this.handleDatabaseError(error, 'getAllEvents', []);
      }

      console.log(`✅ Found ${data?.length || 0} total events`);
      return data.map(this.mapEventFromDB);
    } catch (error) {
      console.error('❌ Exception in getAllEvents:', error);
      return this.handleDatabaseError(error, 'getAllEvents', []);
    }
  }

  async getEventById(id: string): Promise<Event | undefined> {
    try {
      // Primero intenta obtener el evento con todas las relaciones
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_sectors(*),
          event_combos(*),
          reservation_conditions(*),
          seat_map_elements(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.warn('⚠️ Error getting event with relations, trying basic event:', error.message);

        // Si falla, intenta obtener solo el evento básico
        const { data: basicData, error: basicError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (basicError) {
          return this.handleDatabaseError(basicError, 'getEventById', undefined);
        }

        // Retorna evento básico sin relaciones
        return this.mapEventFromDB({
          ...basicData,
          event_sectors: [],
          event_combos: [],
          reservation_conditions: [],
          seat_map_elements: []
        });
      }

      return this.mapEventFromDB(data);
    } catch (error) {
      return this.handleDatabaseError(error, 'getEventById', undefined);
    }
  }

  async getEventsByBusinessId(businessId: string): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_sectors(*),
          event_combos(*),
          reservation_conditions(*),
          seat_map_elements(*)
        `)
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        return this.handleDatabaseError(error, 'getEventsByBusinessId', []);
      }

      return data.map(this.mapEventFromDB);
    } catch (error) {
      return this.handleDatabaseError(error, 'getEventsByBusinessId', []);
    }
  }

  async getPendingEvents(): Promise<Event[]> {
    try {
      console.log('🔍 Fetching pending events for admin approval...');

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_sectors(*),
          event_combos(*),
          reservation_conditions(*),
          seat_map_elements(*)
        `)
        .eq('status', 'pending')
        // Removido el filtro .eq('is_active', true) porque los eventos pendientes
        // pueden estar inactivos hasta ser aprobados
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching pending events:', error);
        return this.handleDatabaseError(error, 'getPendingEvents', []);
      }

      console.log(`✅ Found ${data?.length || 0} pending events`);
      return data.map(this.mapEventFromDB);
    } catch (error) {
      console.error('❌ Exception in getPendingEvents:', error);
      return this.handleDatabaseError(error, 'getPendingEvents', []);
    }
  }

  async addEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event | null> {
    try {
      console.log('📅 Starting simplified event creation...');

      // Función auxiliar para truncar texto de manera segura
      const safeTruncate = (text: string | undefined, maxLength: number): string => {
        if (!text || typeof text !== 'string') return '';
        return text.length > maxLength ? text.substring(0, maxLength) : text;
      };

      // Función para procesar imagen de manera segura
      const safeProcessImage = (imageUrl?: string): string => {
        const defaultImage = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop';

        if (!imageUrl || typeof imageUrl !== 'string') return defaultImage;

        // Si es base64 muy largo, usar imagen por defecto
        if (imageUrl.startsWith('data:image/') && imageUrl.length > 500) {
          console.warn('⚠️ Image base64 too long, using default');
          return defaultImage;
        }

        // Si es URL muy larga, usar imagen por defecto
        if (imageUrl.length > 300) {
          console.warn('⚠️ Image URL too long, using default');
          return defaultImage;
        }

        return imageUrl;
      };

      // Preparar datos del evento de manera segura y simple
      const safeEventData = {
        title: safeTruncate(eventData.title, 100),
        description: safeTruncate(eventData.description, 500),
        date: eventData.date || new Date().toISOString().split('T')[0],
        time: eventData.time || '20:00',
        location: safeTruncate(eventData.location, 200),
        city: safeTruncate(eventData.city, 50),
        image: safeProcessImage(eventData.image),
        price: Math.max(1, Math.min(10000, eventData.price || 50)),
        business_id: eventData.businessId,
        business_name: safeTruncate(eventData.businessName, 100),
        max_capacity: Math.max(1, Math.min(10000, eventData.maxCapacity || 100)),
        current_sales: Math.max(0, eventData.currentSales || 0),
        status: eventData.status || 'pending',
        is_active: Boolean(eventData.isActive),
        business_contact: eventData.businessContact || {},
        payment_info: eventData.paymentInfo || {}
      };

      console.log('💾 Inserting event with safe data:', safeEventData.title);

      // Insertar solo el evento principal
      const { data: eventResult, error: eventError } = await supabase
        .from('events')
        .insert(safeEventData)
        .select()
        .single();

      if (eventError) {
        console.error('❌ Database error:', eventError.message);
        console.error('❌ Error code:', eventError.code);
        console.error('❌ Error details:', eventError.details);
        return null;
      }

      if (!eventResult) {
        console.error('❌ No result returned from database');
        return null;
      }

      console.log('✅ Event created successfully! ID:', eventResult.id);

      // Retornar evento exitoso inmediatamente
      const successEvent: Event = {
        id: eventResult.id,
        title: safeEventData.title,
        description: safeEventData.description,
        date: safeEventData.date,
        time: safeEventData.time,
        location: safeEventData.location,
        city: safeEventData.city,
        image: safeEventData.image,
        price: safeEventData.price,
        businessId: safeEventData.business_id,
        businessName: safeEventData.business_name,
        maxCapacity: safeEventData.max_capacity,
        currentSales: safeEventData.current_sales,
        isActive: safeEventData.is_active,
        status: safeEventData.status,
        createdAt: eventResult.created_at || new Date().toISOString(),
        updatedAt: eventResult.updated_at || new Date().toISOString(),
        sectors: eventData.sectors || [],
        combos: eventData.combos || [],
        reservationConditions: eventData.reservationConditions || [],
        seatMapElements: eventData.seatMapElements || [],
        businessContact: safeEventData.business_contact,
        paymentInfo: safeEventData.payment_info,
        rejectionReason: undefined
      };

      console.log('🎉 Event creation completed successfully!');
      return successEvent;

    } catch (error) {
      console.error('❌ Exception during event creation:', error);
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      return null;
    }
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<boolean> {
    const updateData: any = {};

    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.date) updateData.date = updates.date;
    if (updates.time) updateData.time = updates.time;
    if (updates.location) updateData.location = updates.location;
    if (updates.city) updateData.city = updates.city;
    if (updates.image) updateData.image = updates.image;
    if (updates.price) updateData.price = updates.price;
    if (updates.maxCapacity !== undefined) updateData.max_capacity = updates.maxCapacity;
    if (updates.currentSales !== undefined) updateData.current_sales = updates.currentSales;
    if (updates.status) updateData.status = updates.status;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.rejectionReason !== undefined) updateData.rejection_reason = updates.rejectionReason;
    if (updates.businessContact) updateData.business_contact = updates.businessContact;
    if (updates.paymentInfo) updateData.payment_info = updates.paymentInfo;

    const { error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating event:', error);
      return false;
    }

    return true;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('events')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      return false;
    }

    return true;
  }

  async approveEvent(id: string): Promise<boolean> {
    console.log('✅ Approving event and activating it:', id);
    // Cuando se aprueba un evento, también debe activarse para que aparezca públicamente
    return await this.updateEvent(id, {
      status: 'approved',
      isActive: true
    });
  }

  async rejectEvent(id: string, reason: string): Promise<boolean> {
    return await this.updateEvent(id, { status: 'rejected', rejectionReason: reason });
  }

  // ====================================================
  // SITE CONFIGURATION
  // ====================================================

  async getSiteConfig(): Promise<SiteConfig> {
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        // Retornar configuración por defecto si no existe o hay error
        return {
          id: '1',
          logoUrl: '/logo.png',
          siteName: 'EventosDiscos',
          tagline: '# ACOMPAÑANDO LOS MEJORES EVENTOS',
          footerContent: {
            companyDescription: 'La plataforma líder para eventos de discotecas y entretenimiento nocturno en Bolivia.',
            contactInfo: {
              address: 'Av. Las Américas #123, Santa Cruz',
              email: 'soporte@eventosdisc.com',
              phone: '78005026'
            },
            socialLinks: {
              facebook: 'https://facebook.com/eventosdisc',
              instagram: 'https://instagram.com/eventosdisc'
            }
          },
          carouselImages: await this.getCarouselImages()
        };
      }

      return {
        id: data.id,
        logoUrl: data.logo_url || '/logo.png',
        siteName: data.site_name || 'EventosDiscos',
        tagline: data.tagline || '# ACOMPAÑANDO LOS MEJORES EVENTOS',
        footerContent: data.footer_content || {},
        carouselImages: await this.getCarouselImages()
      };
    } catch (error) {
      return this.handleDatabaseError(error, 'getSiteConfig', {
        id: '1',
        logoUrl: '/logo.png',
        siteName: 'EventosDiscos',
        tagline: '# ACOMPAÑANDO LOS MEJORES EVENTOS',
        footerContent: {},
        carouselImages: []
      });
    }
  }

  async updateSiteConfig(updates: Partial<SiteConfig>): Promise<boolean> {
    const updateData: any = {};

    if (updates.logoUrl) updateData.logo_url = updates.logoUrl;
    if (updates.siteName) updateData.site_name = updates.siteName;
    if (updates.tagline) updateData.tagline = updates.tagline;
    if (updates.footerContent) updateData.footer_content = updates.footerContent;

    const { error } = await supabase
      .from('site_config')
      .upsert(updateData);

    if (error) {
      console.error('Error updating site config:', error);
      return false;
    }

    return true;
  }

  // ====================================================
  // CAROUSEL IMAGES
  // ====================================================

  async getCarouselImages(): Promise<CarouselImage[]> {
    try {
      const { data, error } = await supabase
        .from('carousel_images')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true });

      if (error) {
        return this.handleDatabaseError(error, 'getCarouselImages', []);
      }

      return data.map(image => ({
        id: image.id,
        url: image.url,
        title: image.title,
        subtitle: image.subtitle,
        link: image.link,
        order: image.order_position,
        isActive: image.is_active
      }));
    } catch (error) {
      return this.handleDatabaseError(error, 'getCarouselImages', []);
    }
  }

  async addCarouselImage(imageData: Omit<CarouselImage, 'id'>): Promise<boolean> {
    const { error } = await supabase
      .from('carousel_images')
      .insert({
        url: imageData.url,
        title: imageData.title,
        subtitle: imageData.subtitle || null,
        link: imageData.link || null,
        order_position: imageData.order,
        is_active: imageData.isActive
      });

    if (error) {
      console.error('Error adding carousel image:', error);
      return false;
    }

    return true;
  }

  async updateCarouselImage(id: string, updates: Partial<CarouselImage>): Promise<boolean> {
    const updateData: any = {};

    if (updates.url) updateData.url = updates.url;
    if (updates.title) updateData.title = updates.title;
    if (updates.subtitle !== undefined) updateData.subtitle = updates.subtitle;
    if (updates.link !== undefined) updateData.link = updates.link;
    if (updates.order !== undefined) updateData.order_position = updates.order;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { error } = await supabase
      .from('carousel_images')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating carousel image:', error);
      return false;
    }

    return true;
  }

  async deleteCarouselImage(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('carousel_images')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting carousel image:', error);
      return false;
    }

    // Reordenar las imágenes restantes
    const images = await this.getCarouselImages();
    for (let i = 0; i < images.length; i++) {
      await this.updateCarouselImage(images[i].id, { order: i + 1 });
    }

    return true;
  }

  // ====================================================
  // MÉTODOS SIMPLIFICADOS PARA PURCHASES Y TICKETS
  // ====================================================

  // Métodos básicos que retornan datos vacíos para compatibilidad
  async createPurchase(purchaseData: any): Promise<Purchase> {
    console.warn('⚠️ Método createPurchase no implementado aún en Supabase');
    return {} as Purchase;
  }

  async getAllPurchases(): Promise<Purchase[]> {
    console.warn('⚠️ Método getAllPurchases no implementado aún en Supabase');
    return [];
  }

  async getPurchasesByBusinessId(businessId: string): Promise<Purchase[]> {
    console.warn('⚠️ Método getPurchasesByBusinessId no implementado aún en Supabase');
    return [];
  }

  async createTicketsForPurchase(purchaseId: string, ticketsData: any[]): Promise<Ticket[]> {
    console.warn('⚠️ Método createTicketsForPurchase no implementado aún en Supabase');
    return [];
  }

  async getTicketsByPurchaseId(purchaseId: string): Promise<Ticket[]> {
    console.warn('⚠️ Método getTicketsByPurchaseId no implementado aún en Supabase');
    return [];
  }

  async getTicketByVerificationCode(code: string): Promise<Ticket | undefined> {
    console.warn('⚠️ Método getTicketByVerificationCode no implementado aún en Supabase');
    return undefined;
  }

  async getTicketByQRCode(qrCode: string): Promise<Ticket | undefined> {
    console.warn('⚠️ Método getTicketByQRCode no implementado aún en Supabase');
    return undefined;
  }

  async validateTicket(ticketId: string, validatedBy: string): Promise<boolean> {
    console.warn('⚠️ Método validateTicket no implementado aún en Supabase');
    return false;
  }

  async useTicket(ticketId: string): Promise<boolean> {
    console.warn('⚠️ Método useTicket no implementado aún en Supabase');
    return false;
  }

  async getCroquisTemplates(): Promise<CroquisTemplate[]> {
    console.warn('⚠️ Método getCroquisTemplates no implementado aún en Supabase');
    return [];
  }

  async getCroquisTemplatesByBusinessId(businessId: string): Promise<CroquisTemplate[]> {
    console.warn('⚠️ Método getCroquisTemplatesByBusinessId no implementado aún en Supabase');
    return [];
  }

  // Mantener métodos stub para compatibilidad con datos vacíos
  getPurchaseById(id: string): Purchase | undefined {
    console.warn('⚠️ Método getPurchaseById no implementado aún en Supabase');
    return undefined;
  }

  getPurchaseByVerificationCode(code: string): Purchase | undefined {
    console.warn('⚠️ Método getPurchaseByVerificationCode no implementado aún en Supabase');
    return undefined;
  }

  updatePurchaseStatus(id: string, status: any): boolean {
    console.warn('⚠️ Método updatePurchaseStatus no implementado aún en Supabase');
    return false;
  }

  updatePurchaseNotification(id: string, type: any): boolean {
    console.warn('⚠️ Método updatePurchaseNotification no implementado aún en Supabase');
    return false;
  }

  getCroquisTemplateById(id: string): CroquisTemplate | undefined {
    console.warn('⚠️ Método getCroquisTemplateById no implementado aún en Supabase');
    return undefined;
  }

  createCroquisTemplate(template: any): CroquisTemplate {
    console.warn('⚠️ Método createCroquisTemplate no implementado aún en Supabase');
    return {} as CroquisTemplate;
  }

  updateCroquisTemplate(id: string, updates: any): boolean {
    console.warn('⚠️ Método updateCroquisTemplate no implementado aún en Supabase');
    return false;
  }

  deleteCroquisTemplate(id: string): boolean {
    console.warn('⚠️ Método deleteCroquisTemplate no implementado aún en Supabase');
    return false;
  }

  duplicateCroquisTemplate(id: string, newName: string): CroquisTemplate | null {
    console.warn('⚠️ Método duplicateCroquisTemplate no implementado aún en Supabase');
    return null;
  }

  incrementTemplateUsage(id: string): void {
    console.warn('⚠️ Método incrementTemplateUsage no implementado aún en Supabase');
  }

  setDefaultTemplate(businessId: string, templateId: string): boolean {
    console.warn('⚠️ Método setDefaultTemplate no implementado aún en Supabase');
    return false;
  }

  getDefaultTemplate(businessId: string): CroquisTemplate | undefined {
    console.warn('⚠️ Método getDefaultTemplate no implementado aún en Supabase');
    return undefined;
  }

  getVerificationCode(code: string): VerificationCode | undefined {
    console.warn('⚠️ Método getVerificationCode no implementado aún en Supabase');
    return undefined;
  }

  deactivateVerificationCode(code: string): boolean {
    console.warn('⚠️ Método deactivateVerificationCode no implementado aún en Supabase');
    return false;
  }

  getTicketPortalData(code: string): any {
    console.warn('⚠️ Método getTicketPortalData no implementado aún en Supabase');
    return null;
  }

  getEventTicketStats(eventId: string): any {
    console.warn('⚠️ Método getEventTicketStats no implementado aún en Supabase');
    return {
      total: 0,
      pending: 0,
      validated: 0,
      used: 0,
      cancelled: 0
    };
  }

  // ====================================================
  // MAPPERS PRIVADOS
  // ====================================================

  private mapUserFromDB(data: any): User {
    return {
      id: data.id,
      email: data.email,
      password: data.password_hash, // Para compatibilidad con la API actual
      name: data.name,
      role: data.role,
      businessId: data.business_id,
      createdBy: data.created_by,
      permissions: data.permissions || {}
    };
  }

  private mapBusinessFromDB(data: any): Business {
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
      paymentInstructions: data.payment_instructions
    };
  }

  private mapEventFromDB(data: any): Event {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      date: data.date,
      time: data.time,
      location: data.location,
      city: data.city,
      image: data.image,
      price: data.price,
      businessId: data.business_id,
      businessName: data.business_name,
      maxCapacity: data.max_capacity,
      currentSales: data.current_sales,
      isActive: data.is_active,
      status: data.status,
      rejectionReason: data.rejection_reason,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      sectors: data.event_sectors?.map((sector: any) => ({
        id: sector.id,
        name: sector.name,
        color: sector.color,
        capacity: sector.capacity,
        priceType: sector.price_type,
        basePrice: sector.base_price,
        isActive: sector.is_active
      })) || [],
      combos: data.event_combos?.map((combo: any) => ({
        id: combo.id,
        name: combo.name,
        description: combo.description,
        price: combo.price,
        stock: combo.stock,
        type: combo.type,
        sectorRestriction: combo.sector_restriction || [],
        isActive: combo.is_active
      })) || [],
      reservationConditions: data.reservation_conditions?.map((condition: any) => ({
        id: condition.id,
        description: condition.description,
        minTicketsPerTable: condition.min_tickets_per_table,
        maxTicketsPerTable: condition.max_tickets_per_table,
        advancePaymentRequired: condition.advance_payment_required,
        cancellationPolicy: condition.cancellation_policy
      })) || [],
      seatMapElements: data.seat_map_elements?.map((element: any) => ({
        id: element.id,
        type: element.type,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        rotation: element.rotation,
        sectorId: element.sector_id,
        capacity: element.capacity,
        label: element.label,
        isReservable: element.is_reservable,
        color: element.color
      })) || [],
      businessContact: data.business_contact || {},
      paymentInfo: data.payment_info || {}
    };
  }


}

export const db = new SupabaseDatabase();
