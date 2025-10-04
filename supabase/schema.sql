-- EventosDiscos - Esquema SQL Completo para Supabase
-- ====================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipos ENUM
CREATE TYPE user_role AS ENUM ('admin', 'business', 'customer', 'porteria');
CREATE TYPE event_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE purchase_status AS ENUM ('pending_payment', 'payment_submitted', 'payment_verified', 'completed', 'cancelled');
CREATE TYPE ticket_status AS ENUM ('pending', 'validated', 'used', 'cancelled');
CREATE TYPE verification_code_type AS ENUM ('purchase', 'ticket');
CREATE TYPE seat_map_element_type AS ENUM ('table', 'chair', 'bar', 'bathroom', 'stage', 'entrance');
CREATE TYPE price_type AS ENUM ('per_seat', 'per_table');
CREATE TYPE payment_method AS ENUM ('qr', 'transfer', 'cash', 'external');
CREATE TYPE ticket_type AS ENUM ('CLIENTE', 'VIP', 'STAFF');
CREATE TYPE combo_type AS ENUM ('cumple', 'tragos', 'otros');

-- ====================================================
-- TABLA: users
-- ====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- TABLA: businesses
-- ====================================================
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    logo VARCHAR(500),
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    payment_qr_url VARCHAR(500),
    payment_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- TABLA: events
-- ====================================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    image VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    max_capacity INTEGER,
    current_sales INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    status event_status DEFAULT 'pending',
    rejection_reason TEXT,
    business_contact JSONB DEFAULT '{}',
    payment_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- TABLA: event_sectors
-- ====================================================
CREATE TABLE event_sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color
    capacity INTEGER NOT NULL,
    price_type price_type DEFAULT 'per_seat',
    base_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- TABLA: event_combos
-- ====================================================
CREATE TABLE event_combos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    type combo_type DEFAULT 'otros',
    sector_restriction UUID[] DEFAULT '{}', -- Array de sector IDs
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- TABLA: reservation_conditions
-- ====================================================
CREATE TABLE reservation_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    min_tickets_per_table INTEGER,
    max_tickets_per_table INTEGER,
    advance_payment_required INTEGER, -- porcentaje
    cancellation_policy TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- TABLA: seat_map_elements
-- ====================================================
CREATE TABLE seat_map_elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    type seat_map_element_type NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    rotation INTEGER DEFAULT 0,
    sector_id UUID REFERENCES event_sectors(id) ON DELETE SET NULL,
    capacity INTEGER,
    label VARCHAR(255),
    is_reservable BOOLEAN DEFAULT FALSE,
    color VARCHAR(7), -- Hex color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- TABLA: croquis_templates
-- ====================================================
CREATE TABLE croquis_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    seat_map_elements JSONB DEFAULT '[]',
    sectors JSONB DEFAULT '[]',
    is_default BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- TABLA: purchases
-- ====================================================
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_proof VARCHAR(500),
    status purchase_status DEFAULT 'pending_payment',
    verification_code VARCHAR(8) UNIQUE NOT NULL,
    payment_submitted_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notifications_sent JSONB DEFAULT '{"paymentReceived": false, "paymentVerified": false, "ticketsReady": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- TABLA: tickets
-- ====================================================
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    event_title VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    event_location VARCHAR(255) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    business_logo VARCHAR(500),
    sector_name VARCHAR(100) NOT NULL,
    sector_color VARCHAR(7) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    ticket_type ticket_type DEFAULT 'CLIENTE',
    verification_code VARCHAR(8) UNIQUE NOT NULL,
    qr_code VARCHAR(100) UNIQUE NOT NULL,
    status ticket_status DEFAULT 'pending',
    is_active BOOLEAN DEFAULT TRUE,
    validated_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- TABLA: verification_codes
-- ====================================================
CREATE TABLE verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(8) UNIQUE NOT NULL,
    type verification_code_type NOT NULL,
    related_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- TABLA: carousel_images
-- ====================================================
CREATE TABLE carousel_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url VARCHAR(500) NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    link VARCHAR(500),
    order_position INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- TABLA: site_config
-- ====================================================
CREATE TABLE site_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logo_url VARCHAR(500),
    site_name VARCHAR(255) DEFAULT 'EventosDiscos',
    tagline TEXT DEFAULT '# ACOMPAÑANDO LOS MEJORES EVENTOS',
    footer_content JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ====================================================

-- Índices para users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_business_id ON users(business_id);

-- Índices para businesses
CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);

-- Índices para events
CREATE INDEX idx_events_business_id ON events(business_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_is_active ON events(is_active);

-- Índices para event_sectors
CREATE INDEX idx_event_sectors_event_id ON event_sectors(event_id);

-- Índices para seat_map_elements
CREATE INDEX idx_seat_map_elements_event_id ON seat_map_elements(event_id);
CREATE INDEX idx_seat_map_elements_sector_id ON seat_map_elements(sector_id);

-- Índices para croquis_templates
CREATE INDEX idx_croquis_templates_business_id ON croquis_templates(business_id);
CREATE INDEX idx_croquis_templates_is_default ON croquis_templates(is_default);

-- Índices para purchases
CREATE INDEX idx_purchases_event_id ON purchases(event_id);
CREATE INDEX idx_purchases_verification_code ON purchases(verification_code);
CREATE INDEX idx_purchases_status ON purchases(status);

-- Índices para tickets
CREATE INDEX idx_tickets_purchase_id ON tickets(purchase_id);
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_tickets_verification_code ON tickets(verification_code);
CREATE INDEX idx_tickets_qr_code ON tickets(qr_code);
CREATE INDEX idx_tickets_status ON tickets(status);

-- Índices para verification_codes
CREATE INDEX idx_verification_codes_code ON verification_codes(code);
CREATE INDEX idx_verification_codes_type ON verification_codes(type);
CREATE INDEX idx_verification_codes_related_id ON verification_codes(related_id);

-- ====================================================
-- FUNCIONES PARA AUTO-GENERACIÓN DE CÓDIGOS
-- ====================================================

-- Función para generar códigos de verificación únicos
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para generar códigos QR únicos
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'QR-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 9);
END;
$$ LANGUAGE plpgsql;

-- ====================================================
-- TRIGGERS PARA AUTO-UPDATES
-- ====================================================

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas que tienen updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_croquis_templates_updated_at BEFORE UPDATE ON croquis_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carousel_images_updated_at BEFORE UPDATE ON carousel_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_config_updated_at BEFORE UPDATE ON site_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================
-- RLS (Row Level Security) POLÍTICAS
-- ====================================================

-- Habilitar RLS en tablas sensibles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Política para users: usuarios pueden ver/editar su propia información
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Política para businesses: propietarios pueden gestionar su negocio
CREATE POLICY "Business owners can manage their business" ON businesses
    FOR ALL USING (owner_id = auth.uid());

-- Política para events: públicos para lectura, negocios pueden gestionar sus eventos
CREATE POLICY "Events are publicly readable" ON events
    FOR SELECT USING (is_active = true AND status = 'approved');

CREATE POLICY "Business can manage own events" ON events
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- ====================================================
-- DATOS INICIALES
-- ====================================================

-- Insertar configuración inicial del sitio
INSERT INTO site_config (logo_url, site_name, tagline, footer_content) VALUES (
    '/logo.png',
    'EventosDiscos',
    '# ACOMPAÑANDO LOS MEJORES EVENTOS',
    '{
        "companyDescription": "La plataforma líder para eventos de discotecas y entretenimiento nocturno en Bolivia.",
        "contactInfo": {
            "address": "Av. Las Américas #123, Santa Cruz",
            "email": "soporte@eventosdisc.com",
            "phone": "78005026"
        },
        "socialLinks": {
            "facebook": "https://facebook.com/eventosdisc",
            "instagram": "https://instagram.com/eventosdisc"
        }
    }'::jsonb
);

-- ====================================================
-- COMENTARIOS EN TABLAS
-- ====================================================

COMMENT ON TABLE users IS 'Usuarios del sistema con diferentes roles';
COMMENT ON TABLE businesses IS 'Negocios/discotecas registradas en la plataforma';
COMMENT ON TABLE events IS 'Eventos creados por los negocios';
COMMENT ON TABLE event_sectors IS 'Sectores de precios de cada evento';
COMMENT ON TABLE seat_map_elements IS 'Elementos del croquis/mapa de asientos';
COMMENT ON TABLE croquis_templates IS 'Plantillas de croquis reutilizables';
COMMENT ON TABLE purchases IS 'Compras realizadas por clientes';
COMMENT ON TABLE tickets IS 'Tickets digitales generados';
COMMENT ON TABLE verification_codes IS 'Códigos de verificación únicos';
COMMENT ON TABLE carousel_images IS 'Imágenes del carrusel principal';
COMMENT ON TABLE site_config IS 'Configuración general del sitio';

-- ====================================================
-- FIN DEL ESQUEMA
-- ====================================================
