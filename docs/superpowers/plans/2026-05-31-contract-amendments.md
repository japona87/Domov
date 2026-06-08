# Contract Amendments & Status Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add contract_amendments table, RLS, server actions, and admin UI (status filter tabs + amendments timeline + create amendment flow).

**Architecture:** Single contract with versioned amendments. Amendments are separate rows linked via FK. Current contract values mirror latest amendment. Admin list gets status tabs. Contract detail gets an amendments timeline section and a "Crear enmienda" button that opens a form.

**Tech Stack:** Next.js 16.2.6, Supabase SSR (server client + admin client), Tailwind CSS 4, shadcn/ui

---

### Task 1: Database migration — create `contract_amendments` table + RLS

**Files:**
- Create: `supabase/migrations/014_contract_amendments.sql`

- [ ] **Step 1: Create migration**

```sql
-- Create contract_amendments table
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

-- RLS
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
```

- [ ] **Step 2: Apply migration to Supabase**

Provide user with SQL to run in Supabase Dashboard > SQL Editor, OR run via direct DB connection if available.

---

### Task 2: Update TypeScript types

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1: Add `ContractAmendment` type and `UserRole` values**

```typescript
export type ContractAmendment = {
  id: string
  contract_id: string
  amendment_number: number
  amendment_date: string
  period_start: string
  period_end: string
  monthly_rent: number
  ipc_rate: number | null
  administration_fee: number
  admin_fee_increase_pct: number | null
  notes: string | null
  created_at: string
}
```

- [ ] **Step 2: Add `contract_amendments` to the `Database` interface**

Add after `contracts` entry in `Tables`:

```typescript
contract_amendments: {
  Row: ContractAmendment
  Insert: { id?: string; contract_id: string; amendment_number: number; amendment_date: string; period_start: string; period_end: string; monthly_rent: number; ipc_rate?: number | null; administration_fee?: number; admin_fee_increase_pct?: number | null; notes?: string | null }
  Update: { monthly_rent?: number; ipc_rate?: number | null; administration_fee?: number; admin_fee_increase_pct?: number | null; period_end?: string; notes?: string }
  Relationships: [{ type: 'foreign_key'; columns: ['contract_id']; references: { table: 'contracts'; columns: ['id'] } }]
}
```

---

### Task 3: Server actions for amendments

**Files:**
- Create: `src/lib/actions/contract-amendments.ts`

- [ ] **Step 1: Create `addContractAmendment` action**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit'

export async function addContractAmendment(contractId: string, formData: FormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('No autorizado')

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, end_date, monthly_rent, administration_fee, status, termination_reason, termination_notice_date, ended_at')
    .eq('id', contractId)
    .single()
  if (!contract) throw new Error('Contrato no encontrado')

  const amendmentDate = String(formData.get('amendment_date'))
  const newEndDate = String(formData.get('period_end'))
  const newRent = Number(formData.get('monthly_rent'))
  const newAdminFee = Number(formData.get('administration_fee'))
  const ipcRaw = formData.get('ipc_rate')
  const adminPctRaw = formData.get('admin_fee_increase_pct')
  const notes = formData.get('notes') ? String(formData.get('notes')) : null

  if (!amendmentDate || !newEndDate) throw new Error('Fechas inválidas')
  if (!newRent || newRent <= 0) throw new Error('Canon inválido')

  const periodStart = contract.end_date

  // Get next amendment number
  const { data: existingAmendments } = await supabase
    .from('contract_amendments')
    .select('amendment_number')
    .eq('contract_id', contractId)
    .order('amendment_number', { ascending: false })
    .limit(1)
  const nextNumber = existingAmendments && existingAmendments.length > 0
    ? existingAmendments[0].amendment_number + 1
    : 1

  // Insert amendment
  const { error: insertError } = await supabase.from('contract_amendments').insert({
    contract_id: contractId,
    amendment_number: nextNumber,
    amendment_date: amendmentDate,
    period_start: periodStart,
    period_end: newEndDate,
    monthly_rent: newRent,
    ipc_rate: ipcRaw && String(ipcRaw) !== '' ? Number(ipcRaw) : null,
    administration_fee: newAdminFee || 0,
    admin_fee_increase_pct: adminPctRaw && String(adminPctRaw) !== '' ? Number(adminPctRaw) : null,
    notes,
  })
  if (insertError) throw new Error(insertError.message)

  // Update contract with new values and extend end_date
  const contractUpdate: Record<string, unknown> = {
    end_date: newEndDate,
    monthly_rent: newRent,
    administration_fee: newAdminFee || 0,
    ipc_rate: ipcRaw && String(ipcRaw) !== '' ? Number(ipcRaw) : null,
  }

  // If contract was ended, reactivate it
  if (contract.status === 'ended') {
    contractUpdate.status = 'active'
    contractUpdate.termination_reason = null
    contractUpdate.termination_notice_date = null
    contractUpdate.ended_at = null
  }

  const { error: updateError } = await supabase.from('contracts').update(contractUpdate as never).eq('id', contractId)
  if (updateError) throw new Error(updateError.message)

  // Generate payment rows for the new period
  function generatePaymentRows(id: string, start: Date, end: Date, rent: number) {
    const rows: { contract_id: string; amount: number; due_date: string; status: string }[] = []
    const dueDay = start.getDate()
    let year = start.getFullYear()
    let month = start.getMonth()
    while (true) {
      const maxDay = new Date(year, month + 1, 0).getDate()
      const due = new Date(year, month, Math.min(dueDay, maxDay))
      if (due > end) break
      rows.push({ contract_id: id, amount: rent, due_date: due.toISOString().split('T')[0], status: 'pending' })
      month += 1
      if (month > 11) { month = 0; year += 1 }
    }
    return rows
  }

  const paymentRows = generatePaymentRows(
    contractId,
    new Date(periodStart + 'T00:00:00'),
    new Date(newEndDate + 'T00:00:00'),
    newRent
  )
  if (paymentRows.length > 0) {
    const { error: paymentsError } = await supabase.from('payments').insert(
      paymentRows.map(r => ({ contract_id: r.contract_id, amount: r.amount, due_date: r.due_date, status: r.status as 'pending' }))
    )
    if (paymentsError) throw new Error(paymentsError.message)
  }

  await logAudit({
    action: 'create',
    entity: 'contract_amendment',
    entityId: contractId,
    entityName: `Enmienda #${nextNumber} - contrato ${contractId}`,
    changes: { amendment_number: nextNumber, monthly_rent: newRent, period_start: periodStart, period_end: newEndDate, administration_fee: newAdminFee },
  })

  revalidatePath(`/admin/contratos/${contractId}`)
  revalidatePath('/admin/contratos')
  revalidatePath('/admin/propiedades')
}
```

- [ ] **Step 2: Create `getContractAmendments` action**

```typescript
export async function getContractAmendments(contractId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('contract_amendments')
    .select('id, amendment_number, amendment_date, period_start, period_end, monthly_rent, ipc_rate, administration_fee, admin_fee_increase_pct, notes, created_at')
    .eq('contract_id', contractId)
    .order('amendment_number', { ascending: true })
  return data ?? []
}
```

---

### Task 4: Contracts list page — status filter tabs

**Files:**
- Modify: `src/app/(admin)/admin/contratos/page.tsx`

- [ ] **Step 1: Add search params for tab filter and filter logic**

Add `searchParams` to the page component and filter contracts by status based on tab:

```typescript
export default async function ContratosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('contracts')
    .select(`id, status, start_date, end_date, monthly_rent, properties(name, address), tenants(full_name)`)
    .order('created_at', { ascending: false })

  if (tab && tab !== 'all') {
    if (tab === 'ending') {
      query = query.eq('status', 'ending')
    } else if (tab === 'ended') {
      query = query.eq('status', 'ended')
    } else {
      query = query.eq('status', tab)
    }
  }

  // If no tab or tab=all, we show all (no filter)
  const contracts = tab && tab !== 'all' ? await query : await query
```

- [ ] **Step 2: Add tab bar above the table**

```typescript
const TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'ending', label: 'Por terminar' },
  { key: 'ended', label: 'Finalizados' },
]
```

```tsx
<div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border border-border">
  {TABS.map(t => (
    <Link
      key={t.key}
      href={t.key === 'all' ? '/admin/contratos' : `/admin/contratos?tab=${t.key}`}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        (tab === t.key || (!tab && t.key === 'all'))
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {t.label}
    </Link>
  ))}
</div>
```

Also wrap the count in `contracts?.length ?? 0`.

---

### Task 5: Contract detail page — amendments timeline

**Files:**
- Modify: `src/app/(admin)/admin/contratos/[id]/page.tsx`

- [ ] **Step 1: Add server action import and fetch amendments**

```typescript
import { getContractAmendments } from '@/lib/actions/contract-amendments'
```

After the contract fetch:

```typescript
const amendments = await getContractAmendments(id)
// compute totals
const totalAmendments = amendments.length
const yearsTenure = (() => {
  if (amendments.length > 0) {
    const first = new Date(amendments[0].period_start)
    const last = amendments[amendments.length - 1].period_end
    return Math.round((new Date(last).getTime() - first.getTime()) / 365.25 / 86400000 * 10) / 10
  }
  return 0
})()
```

- [ ] **Step 2: Add amendments timeline section after the info grid**

```tsx
{/* Amendments timeline */}
{amendments.length > 0 && (
  <div className="bg-white rounded-lg border p-6 space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-slate-800">Trazabilidad de enmiendas</h3>
      <p className="text-xs text-slate-500">
        {totalAmendments} enmienda{totalAmendments !== 1 ? 's' : ''} · {yearsTenure} años de antigüedad
      </p>
    </div>
    <div className="space-y-0">
      {/* Contract original (always shown) */}
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="w-3 h-3 rounded-full bg-green-600 mt-1.5" />
          <div className="w-0.5 flex-1 bg-green-200" />
        </div>
        <div className="pb-6">
          <p className="text-sm font-medium text-slate-800">Contrato original</p>
          <p className="text-xs text-slate-500">
            {contract.start_date} → {contract.end_date}
          </p>
          <p className="text-xs text-slate-600">
            ${amendments[0].monthly_rent.toLocaleString('es-CO')} + $
            {amendments[0].administration_fee.toLocaleString('es-CO')} admón
            {amendments[0].ipc_rate != null && ` · IPC ${amendments[0].ipc_rate}%`}
          </p>
        </div>
      </div>
      {/* Amendments */}
      {amendments.slice(1).map((a) => (
        <div key={a.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-blue-600 mt-1.5" />
            <div className="w-0.5 flex-1 bg-blue-200" />
          </div>
          <div className="pb-6">
            <p className="text-sm font-medium text-slate-800">Enmienda #{a.amendment_number}</p>
            <p className="text-xs text-slate-500">
              {a.amendment_date} · {a.period_start} → {a.period_end}
            </p>
            <p className="text-xs text-slate-600">
              ${a.monthly_rent.toLocaleString('es-CO')} + $
              {a.administration_fee.toLocaleString('es-CO')} admón
              {a.ipc_rate != null && ` · IPC ${a.ipc_rate}%`}
              {a.admin_fee_increase_pct != null && ` · Admin +${a.admin_fee_increase_pct}%`}
            </p>
            {a.notes && <p className="text-xs text-slate-400 mt-0.5">{a.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

---

### Task 6: Contract detail page — "Crear enmienda" button + form

**Files:**
- Create: `src/components/contracts/amendment-form.tsx`
- Modify: `src/app/(admin)/admin/contratos/[id]/page.tsx`

- [ ] **Step 1: Create the amendment form component**

```typescript
'use client'

import { useActionState } from 'react'
import { addContractAmendment } from '@/lib/actions/contract-amendments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AmendmentForm({
  contractId,
  currentRent,
  currentAdminFee,
  currentEndDate,
}: {
  contractId: string
  currentRent: number
  currentAdminFee: number
  currentEndDate: string
}) {
  const [, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      try {
        await addContractAmendment(contractId, formData)
      } catch (e) {
        return { error: (e as Error).message }
      }
    },
    null
  )

  // Calculate suggested period_end (+1 year from current end_date)
  const nextEnd = new Date(currentEndDate + 'T00:00:00')
  nextEnd.setFullYear(nextEnd.getFullYear() + 1)
  const suggestedEnd = nextEnd.toISOString().split('T')[0]

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Fecha de enmienda</Label>
          <Input name="amendment_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
        </div>
        <div>
          <Label>Nuevo canon mensual</Label>
          <Input name="monthly_rent" type="number" defaultValue={currentRent} required min={1} />
        </div>
        <div>
          <Label>IPC aplicado (%)</Label>
          <Input name="ipc_rate" type="number" step="0.01" placeholder="ej: 5.2" />
        </div>
        <div>
          <Label>Nueva administración</Label>
          <Input name="administration_fee" type="number" defaultValue={currentAdminFee || 0} required min={0} />
        </div>
        <div>
          <Label>Aumento admin (%)</Label>
          <Input name="admin_fee_increase_pct" type="number" step="0.01" placeholder="ej: 5" />
        </div>
        <div>
          <Label>Nueva fecha fin</Label>
          <Input name="period_end" type="date" defaultValue={suggestedEnd} required />
        </div>
      </div>
      <div>
        <Label>Notas</Label>
        <Input name="notes" placeholder="Opcional" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando...' : 'Crear enmienda'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Add "Crear enmienda" button and form to detail page**

After the amendments timeline section, add a toggle button that shows/hides the form (only for admin, when status is active or ending):

```tsx
{c.status === 'active' || c.status === 'ending' ? (
  <details className="bg-white rounded-lg border p-6">
    <summary className="cursor-pointer font-semibold text-slate-800 hover:text-blue-600">
      + Crear nueva enmienda
    </summary>
    <div className="mt-4">
      <AmendmentForm
        contractId={c.id}
        currentRent={c.monthly_rent}
        currentAdminFee={c.administration_fee ?? 0}
        currentEndDate={c.end_date}
      />
    </div>
  </details>
) : null}
```

- [ ] **Step 3: Create `Label` component if not exists**

Check if `@/components/ui/label` exists; if not, create a basic one:

```typescript
'use client'
import * as LabelPrimitive from '@radix-ui/react-label'
// re-export shadcn-ui-style label
```

(Follow existing pattern from other form components in the project.)

---

### Task 7: Owner portal — show amendments timeline

**Files:**
- Modify: `src/app/(owner)/owner/propiedades/[id]/page.tsx`

- [ ] **Step 1: Import and add amendments timeline**

Same approach as Task 5 but adapted for the owner view. The owner page already fetches contract data for the property. Add `getContractAmendments` call and render the timeline in a similar format but simpler.

---

### Task 8: Tenant portal — show amendments timeline

**Files:**
- Modify: `src/app/(tenant)/tenant/contrato/page.tsx`

- [ ] **Step 1: Import and add amendments timeline**

Same approach — add the timeline to the tenant's contract view so they can see their own rent progression.

---

### Task 9: Apply migration to Supabase

- [ ] **Step 1: Run the migration SQL in Supabase Dashboard > SQL Editor**

The user needs to paste the SQL from Task 1 into the Supabase SQL Editor and run it. Offer to help if they share DB access.

---

### Task 10: Verify and test

- [ ] **Step 1: Verify the migration ran correctly**

Check that the migration is in the project's migration folder and applied.

- [ ] **Step 2: Test the flow end-to-end**

1. Create a contract
2. Go to detail page, see "Crear nueva enmienda" button
3. Create an amendment, verify it shows in the timeline
4. Check that payments were generated for the new period
5. Check that the contract's monthly_rent/end_date were updated
6. Test with owner login — verify they see the timeline
7. Test filter tabs on the contracts list page
8. Test with a contract that was ended — create an amendment to reactivate it
