-- supabase/migrations/005_fix_feature_configs.sql
-- Fix: agregar field_type faltante y reseed data

ALTER TABLE property_feature_configs ADD COLUMN IF NOT EXISTS field_type TEXT NOT NULL DEFAULT 'number' CHECK (field_type IN ('number', 'text'));

-- Reseed: limpiar datos existentes y recargar
DELETE FROM property_feature_configs;

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
