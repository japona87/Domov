CREATE TABLE contract_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,

  amendment_number INT NOT NULL,
  amendment_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  monthly_rent NUMERIC(12,2) NOT NULL CHECK (monthly_rent > 0),
  ipc_rate NUMERIC(5,2),
  administration_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (administration_fee >= 0),
  admin_fee_increase_pct NUMERIC(5,2),

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(contract_id, amendment_number)
);

ALTER TABLE contract_amendments ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_contract_amendments ON contract_amendments
  FOR ALL USING (is_admin());

CREATE POLICY owner_own_contract_amendments ON contract_amendments
  FOR SELECT USING (
    contract_id IN (
      SELECT id FROM contracts
      WHERE property_id IN (
        SELECT property_id FROM property_owners WHERE owner_id = current_owner_id()
      )
    )
  );

CREATE POLICY tenant_own_contract_amendments ON contract_amendments
  FOR SELECT USING (
    contract_id IN (
      SELECT id FROM contracts
      WHERE tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()
      )
    )
  );
