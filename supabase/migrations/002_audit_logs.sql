-- supabase/migrations/002_audit_logs.sql

-- Auditoría: registro de acciones CRUD
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  entity TEXT NOT NULL CHECK (entity IN ('property', 'owner', 'tenant', 'contract', 'property_owner', 'payment')),
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  changes JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_audit_logs" ON audit_logs FOR ALL USING (is_admin());
