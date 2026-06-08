-- supabase/migrations/007_audit_cleanup.sql
-- Configuración de retención de auditoría

ALTER TABLE system_config ADD COLUMN IF NOT EXISTS audit_retention_days INTEGER NOT NULL DEFAULT 90 CHECK (audit_retention_days >= 30);
