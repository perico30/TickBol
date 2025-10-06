-- EventosDiscos - Esquema SQL CORREGIDO para Supabase
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
-- TABLA: businesses (PRIMERO - sin dependencias)
-- ====================================================
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    logo VARCHAR(500),
    description TEXT,
    owner_id UUID, -- Sin REFERENCES por ahora
    payment_qr_url VARCHAR(500),
    payment_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- TABLA: users (SEGUNDO)
-- ====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    created_by UUID, -- Sin REFERENCES por ahora
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar las foreign keys que faltaban
ALTER TABLE businesses ADD CONSTRAINT fk_businesses_owner
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE users ADD CONSTRAINT fk_users_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

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
    total_capacity INTEGER,
    seat_map_data JSONB DEFAULT '{}',
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
    color VARCHAR(7) NOT NULL,
    capacity INTEGER NOT NULL,
    price_type price_type DEFAULT 'per_seat',
    price DECIMAL(10,2) NOT NULL,
    available_spots INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    sector_restriction UUID[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
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
    color VARCHAR(7),
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
    sector_id UUID REFERENCES event_sectors(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    total_amount DECIMAL(10,2) NOT NULL,
    selected_seats JSONB DEFAULT '[]',
    payment_method payment_method NOT NULL,
    payment_proof VARCHAR(500),
    status purchase_status DEFAULT 'pending_payment',
    verification_code VARCHAR(8) UNIQUE,
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
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    related_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- TABLA: carousel_images
-- ====================================================
CREATE TABLE carousel_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url VARCHAR(500) NOT NULL,
    title VARCHAR(255),
    subtitle TEXT,
    link_url VARCHAR(500),
    order_position INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- TABLA: site_config
-- ====================================================
CREATE TABLE site_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_name VARCHAR(255) DEFAULT 'EventosDiscos',
    site_description TEXT DEFAULT '# ACOMPAÑANDO LOS MEJORES EVENTOS',
    logo VARCHAR(500),
    favicon VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#1E40AF',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_business_id ON users(business_id);
CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX idx_events_business_id ON events(business_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_event_sectors_event_id ON event_sectors(event_id);
CREATE INDEX idx_purchases_event_id ON purchases(event_id);
CREATE INDEX idx_tickets_purchase_id ON tickets(purchase_id);
CREATE INDEX idx_carousel_images_active ON carousel_images(is_active);

-- ====================================================
-- TRIGGERS PARA AUTO-UPDATES
-- ====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_config_updated_at BEFORE UPDATE ON site_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================
-- RLS (Row Level Security) POLÍTICAS
-- ====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Política básica: permitir lectura para eventos aprobados
CREATE POLICY "Events are publicly readable" ON events
    FOR SELECT USING (is_active = true AND status = 'approved');

-- ====================================================
-- DATOS INICIALES
-- ====================================================
INSERT INTO site_config (site_name, site_description, contact_email, contact_phone) VALUES (
    'EventosDiscos',
    '# ACOMPAÑANDO LOS MEJORES EVENTOS',
    'soporte@eventosdisc.com',
    '78005026'
);

-- ====================================================
-- FIN DEL ESQUEMA CORREGIDO
-- ====================================================
