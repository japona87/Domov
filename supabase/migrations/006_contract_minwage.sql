-- supabase/migrations/006_contract_minwage.sql
-- Agregar min_wage_increase a nivel de contrato

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS min_wage_increase NUMERIC(5,2);
