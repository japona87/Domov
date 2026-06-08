-- supabase/migrations/003_feature_configs.sql
-- Configuración dinámica de campos por tipo de inmueble

CREATE TABLE IF NOT EXISTS property_feature_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'house', 'office', 'local', 'garage', 'other')),
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  placeholder TEXT DEFAULT '',
  field_type TEXT NOT NULL DEFAULT 'number' CHECK (field_type IN ('number', 'text')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(property_type, field_key)
);

ALTER TABLE property_feature_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_feature_configs" ON property_feature_configs FOR ALL USING (is_admin());

-- Seed: Apartamento
INSERT INTO property_feature_configs (property_type, field_key, field_label, placeholder, field_type, sort_order, is_active) VALUES
  ('apartment', 'bedrooms', 'Habitaciones', '3', 'number', 1, true),
  ('apartment', 'bathrooms', 'Baños', '2', 'number', 2, true),
  ('apartment', 'area_sqm', 'Área (m²)', '85', 'number', 3, true),
  ('apartment', 'parking_spots', 'Parqueaderos', '1', 'number', 4, true),
  ('apartment', 'floor', 'Piso (nivel)', '4', 'number', 5, true),
  ('apartment', 'estrato', 'Estrato', '3', 'number', 6, true);

-- Seed: Casa
INSERT INTO property_feature_configs (property_type, field_key, field_label, placeholder, field_type, sort_order, is_active) VALUES
  ('house', 'bedrooms', 'Habitaciones', '3', 'number', 1, true),
  ('house', 'bathrooms', 'Baños', '2', 'number', 2, true),
  ('house', 'area_sqm', 'Área (m²)', '120', 'number', 3, true),
  ('house', 'parking_spots', 'Parqueaderos', '2', 'number', 4, true),
  ('house', 'total_floors', 'N° pisos', '2', 'number', 5, true),
  ('house', 'estrato', 'Estrato', '4', 'number', 6, true);

-- Seed: Oficina
INSERT INTO property_feature_configs (property_type, field_key, field_label, placeholder, field_type, sort_order, is_active) VALUES
  ('office', 'bathrooms', 'Baños', '1', 'number', 1, true),
  ('office', 'area_sqm', 'Área (m²)', '60', 'number', 2, true),
  ('office', 'parking_spots', 'Parqueaderos', '1', 'number', 3, true),
  ('office', 'floor', 'Piso (nivel)', '3', 'number', 4, true),
  ('office', 'estrato', 'Estrato', '5', 'number', 5, true);

-- Seed: Local comercial
INSERT INTO property_feature_configs (property_type, field_key, field_label, placeholder, field_type, sort_order, is_active) VALUES
  ('local', 'bathrooms', 'Baños', '1', 'number', 1, true),
  ('local', 'area_sqm', 'Área (m²)', '50', 'number', 2, true),
  ('local', 'parking_spots', 'Parqueaderos', '1', 'number', 3, true),
  ('local', 'floor', 'Piso (nivel)', '1', 'number', 4, true),
  ('local', 'estrato', 'Estrato', '4', 'number', 5, true);

-- Seed: Garaje
INSERT INTO property_feature_configs (property_type, field_key, field_label, placeholder, field_type, sort_order, is_active) VALUES
  ('garage', 'area_sqm', 'Área (m²)', '15', 'number', 1, true),
  ('garage', 'estrato', 'Estrato', '3', 'number', 2, true);

-- Seed: Otro
INSERT INTO property_feature_configs (property_type, field_key, field_label, placeholder, field_type, sort_order, is_active) VALUES
  ('other', 'bathrooms', 'Baños', '1', 'number', 1, true),
  ('other', 'area_sqm', 'Área (m²)', '50', 'number', 2, true),
  ('other', 'estrato', 'Estrato', '3', 'number', 3, true);
