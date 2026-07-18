CREATE TABLE property_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  account_number TEXT NOT NULL,
  contract_number TEXT,
  provider_name TEXT,
  client_number TEXT,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_property_services_property ON property_services(property_id);

INSERT INTO storage.buckets (id, name, public) VALUES ('service-files', 'service-files', false);

CREATE POLICY "admin_service_files" ON storage.objects FOR ALL
  USING (bucket_id = 'service-files' AND is_admin());

CREATE POLICY "owner_read_service_files" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'service-files'
    AND EXISTS (
      SELECT 1 FROM property_owners po
      JOIN owners o ON o.id = po.owner_id
      WHERE o.user_id = auth.uid()
      AND po.property_id = (regexp_match(storage.objects.name, '^([^/]+)'))[1]::uuid
    )
  );
