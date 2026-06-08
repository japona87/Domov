# Contract Amendments & Admin UI Filters

## Problem

- Un contrato de arrendamiento puede durar años con incrementos anuales de canon y administración. Hoy no hay forma de representar renovaciones ni guardar la trazabilidad de subidas año a año.
- Los contratos finalizados no se pueden consultar fácilmente: el listado muestra todo junto sin filtros de estado.

## Solution: Opción A — Un solo contrato con enmiendas

Se elige la Opción A (mismo contrato con enmiendas) sobre la Opción B (nuevo contrato encadenado) porque:
- Un solo contrato centraliza todos los pagos, documentos y seguros.
- La trazabilidad es simple: una tabla plana de enmiendas por contrato.
- Reportes multi-año son consultas directas sin joins de cadena.
- La UI es un timeline vertical de enmiendas.

## Data Model

### New table: `contract_amendments`

```sql
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
```

### Contract table changes

No structural changes to `contracts`. The `monthly_rent`, `administration_fee`, `ipc_rate`, and `end_date` columns remain as the **current/latest** values (mirrored from the latest amendment for quick reads).

#### RLS

```sql
CREATE POLICY admin_all_contract_amendments ON contract_amendments FOR ALL USING (is_admin());
CREATE POLICY owner_own_contract_amendments ON contract_amendments
  FOR SELECT USING (
    contract_id IN (SELECT id FROM contracts WHERE property_id IN (
      SELECT property_id FROM property_owners WHERE owner_id = current_owner_id()
    ))
  );
CREATE POLICY tenant_own_contract_amendments ON contract_amendments
  FOR SELECT USING (
    contract_id IN (SELECT id FROM contracts WHERE tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    ))
  );
```

## Server Actions

### `addContractAmendment(contractId, data)`
- Validates admin-only
- Auto-increments `amendment_number` based on existing count
- Expects: `amendment_date`, `period_end`, `monthly_rent`, `ipc_rate`, `administration_fee`, `admin_fee_increase_pct`
- Sets `period_start = current end_date + 1 day` (automatically)
- Updates `contracts.end_date`, `monthly_rent`, `administration_fee` to the new values
- If contract was `ended`, updates it back to `active` and clears termination fields
- Logs audit

### `getContractAmendments(contractId)`
- Returns all amendments ordered by `amendment_number ASC`
- Available to admin, owner, tenant (via RLS)

## Admin UI

### Contracts list page — Status filter tabs

Add tabs above the table: **Todos**, **Activos**, **Por terminar**, **Finalizados**.

Tab | Where clause
----|------------
Todos | (none — all contracts)
Activos | `status = 'active'`
Por terminar | `status = 'ending'`
Finalizados | `status = 'ended'`

### Contract detail page — Amendments timeline

Below the contract info, add a **Trazabilidad** section showing a vertical timeline:

```
📄 Contrato original — Jun 2025 - May 2026 | $2.000.000 + $150.000 | IPC 5.2%
  📋 Enmienda #1 — Jun 2026 - May 2027 | $2.104.000 + $157.800 | IPC 4.1%
  📋 Enmienda #2 — Jun 2027 - May 2028 | $2.190.000 + $164.250 | Admin +4%
```

Each amendment row shows: number, period, monthly_rent, admin_fee, IPC rate, admin increase %.

At the top of the timeline: summary stats (total amendments, years of tenure, rent progression).

### Contract detail page — "Crear enmienda" button

Visible only to admin, only when contract status is `active` or `ending`. Opens a form/modal with:
- Current values pre-filled
- New monthly rent (required)
- IPC rate applied
- New administration fee (required)
- Admin fee increase %
- Extended period end date
- Notes (optional)

## Owner & Tenant portals

Both portals already show contract info. The amendments timeline should also appear on:
- `/owner/propiedades/[id]` — owner sees the timeline for their contract
- `/tenant/contrato` — tenant sees the timeline for their contract

## Out of scope (for this iteration)

- Payment rows generation for amendment periods (payment UI is currently commented out pending redesign)
- Dashboard/reporting for multi-year trends
- CSV/PDF export of amendment history
