-- supabase/migrations/001_initial_schema.sql

-- Perfiles de usuario (roles)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'tenant' CHECK (role IN ('admin', 'tenant')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role) VALUES (NEW.id, 'tenant');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Propietarios
CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  document_number TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inmuebles
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('apartment', 'house', 'office', 'local', 'garage', 'other')),
  description TEXT,
  features JSONB DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Co-propiedad (N:M owners <-> properties)
CREATE TABLE property_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  ownership_pct NUMERIC(5,2) NOT NULL DEFAULT 100.00 CHECK (ownership_pct > 0 AND ownership_pct <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, owner_id)
);

-- Fotos de inmuebles
CREATE TABLE property_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_cover BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Arrendatarios
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  document_number TEXT,
  phone TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aseguradoras
CREATE TABLE insurers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contratos
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent NUMERIC(12,2) NOT NULL CHECK (monthly_rent > 0),
  administration_fee NUMERIC(12,2) DEFAULT 0 CHECK (administration_fee >= 0),
  ipc_rate NUMERIC(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ending', 'ended', 'cancelled')),
  termination_reason TEXT CHECK (termination_reason IN ('non_renewal_admin', 'non_renewal_tenant', 'renewed')),
  termination_notice_date DATE,
  ended_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pagos
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documentos del contrato
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pólizas de seguro
CREATE TABLE insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  insurer_id UUID NOT NULL REFERENCES insurers(id),
  policy_number TEXT,
  monthly_cost NUMERIC(12,2) DEFAULT 0 CHECK (monthly_cost >= 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración del sistema
CREATE TABLE system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE CHECK (year >= 2020),
  ipc_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  min_wage_increase NUMERIC(5,2) NOT NULL DEFAULT 0,
  renewal_notice_days INTEGER NOT NULL DEFAULT 120 CHECK (renewal_notice_days >= 30),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar config inicial para 2026
INSERT INTO system_config (year, ipc_rate, min_wage_increase, renewal_notice_days)
VALUES (2026, 5.20, 9.53, 120);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Helper: verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: obtener tenant_id del usuario actual
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
  SELECT id FROM tenants WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Admin: acceso total a todo
CREATE POLICY "admin_all_profiles" ON profiles FOR ALL USING (is_admin());
CREATE POLICY "admin_all_owners" ON owners FOR ALL USING (is_admin());
CREATE POLICY "admin_all_properties" ON properties FOR ALL USING (is_admin());
CREATE POLICY "admin_all_property_owners" ON property_owners FOR ALL USING (is_admin());
CREATE POLICY "admin_all_property_photos" ON property_photos FOR ALL USING (is_admin());
CREATE POLICY "admin_all_tenants" ON tenants FOR ALL USING (is_admin());
CREATE POLICY "admin_all_insurers" ON insurers FOR ALL USING (is_admin());
CREATE POLICY "admin_all_contracts" ON contracts FOR ALL USING (is_admin());
CREATE POLICY "admin_all_payments" ON payments FOR ALL USING (is_admin());
CREATE POLICY "admin_all_documents" ON documents FOR ALL USING (is_admin());
CREATE POLICY "admin_all_insurance_policies" ON insurance_policies FOR ALL USING (is_admin());
CREATE POLICY "admin_all_system_config" ON system_config FOR ALL USING (is_admin());

-- Tenant: solo puede leer su propio perfil
CREATE POLICY "tenant_own_profile" ON profiles FOR SELECT
  USING (id = auth.uid());

-- Tenant: solo puede leer sus contratos activos
CREATE POLICY "tenant_own_contracts" ON contracts FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Tenant: solo puede leer sus pagos
CREATE POLICY "tenant_own_payments" ON payments FOR SELECT
  USING (contract_id IN (SELECT id FROM contracts WHERE tenant_id = current_tenant_id()));

-- Tenant: solo puede leer sus documentos
CREATE POLICY "tenant_own_documents" ON documents FOR SELECT
  USING (contract_id IN (SELECT id FROM contracts WHERE tenant_id = current_tenant_id()));

-- Landing pública: inmuebles publicados visibles sin login
CREATE POLICY "public_published_properties" ON properties FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "public_property_photos" ON property_photos FOR SELECT
  USING (property_id IN (SELECT id FROM properties WHERE is_published = TRUE));

-- =============================================
-- STORAGE BUCKETS
-- =============================================

-- Bucket para documentos de contratos (privado)
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Bucket para comprobantes de pago (privado)
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

-- Bucket para fotos de inmuebles (público)
INSERT INTO storage.buckets (id, name, public) VALUES ('property-photos', 'property-photos', true);

-- Políticas de storage
CREATE POLICY "admin_documents" ON storage.objects FOR ALL
  USING (bucket_id = 'documents' AND is_admin());

CREATE POLICY "admin_receipts" ON storage.objects FOR ALL
  USING (bucket_id = 'receipts' AND is_admin());

CREATE POLICY "tenant_own_receipts" ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "admin_property_photos" ON storage.objects FOR ALL
  USING (bucket_id = 'property-photos' AND is_admin());

CREATE POLICY "public_property_photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');
