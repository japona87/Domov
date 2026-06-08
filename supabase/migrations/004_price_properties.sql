-- supabase/migrations/004_price_properties.sql
-- Precio de referencia para publicación en landing

ALTER TABLE properties
  ADD COLUMN monthly_price NUMERIC(12,2),
  ADD COLUMN administration_fee NUMERIC(12,2) DEFAULT 0;

-- Política existente admin_all_properties ya cubre estos campos
