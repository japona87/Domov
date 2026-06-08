-- 1. Agregar user_id a owners
ALTER TABLE owners ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Agregar rol 'owner' al CHECK de profiles
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'tenant', 'owner'));

-- 3. Tabla de contraseñas cifradas
CREATE TABLE encrypted_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. Helper para obtener el owner_id desde auth.uid()
CREATE OR REPLACE FUNCTION current_owner_id()
RETURNS UUID AS $$
  SELECT id FROM owners WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 5. RLS policies para owners (solo lectura de sus datos)
-- Nota: tenant_own_profile ya cubre SELECT on profile para auth.uid() = id

-- 5a. Propiedades donde es dueño (incluye no publicadas)
DROP POLICY IF EXISTS owner_own_properties ON properties;
CREATE POLICY owner_own_properties ON properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM property_owners
      WHERE property_id = properties.id AND owner_id = current_owner_id()
    )
  );

-- 5b. Relación propio-propiedad (solo sus registros)
DROP POLICY IF EXISTS owner_own_property_owners ON property_owners;
CREATE POLICY owner_own_property_owners ON property_owners
  FOR SELECT USING (owner_id = current_owner_id());

-- 5c. Contratos de sus propiedades
DROP POLICY IF EXISTS owner_own_contracts ON contracts;
CREATE POLICY owner_own_contracts ON contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM property_owners
      WHERE property_id = contracts.property_id AND owner_id = current_owner_id()
    )
  );

-- 5d. Pagos de contratos de sus propiedades
DROP POLICY IF EXISTS owner_own_payments ON payments;
CREATE POLICY owner_own_payments ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contracts
      JOIN property_owners ON property_owners.property_id = contracts.property_id
      WHERE contracts.id = payments.contract_id
      AND property_owners.owner_id = current_owner_id()
    )
  );

-- 5e. Documentos de contratos de sus propiedades
DROP POLICY IF EXISTS owner_own_documents ON documents;
CREATE POLICY owner_own_documents ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contracts
      JOIN property_owners ON property_owners.property_id = contracts.property_id
      WHERE contracts.id = documents.contract_id
      AND property_owners.owner_id = current_owner_id()
    )
  );

-- 5f. Fotos de sus propiedades
DROP POLICY IF EXISTS owner_own_property_photos ON property_photos;
CREATE POLICY owner_own_property_photos ON property_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM property_owners
      WHERE property_id = property_photos.property_id AND owner_id = current_owner_id()
    )
  );
