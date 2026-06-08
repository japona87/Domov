# Plan 3: Contratos y Pagos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement M3 (Gestión de Contratos) and M4 (Gestión de Pagos) — tenant CRUD, contract creation with auto-generated payment calendars, payment registration with private-bucket receipt upload, and two-path contract termination (admin-initiated and tenant-initiated per Colombian 90-day law).

**Architecture:** Server actions in `src/lib/actions/contracts.ts` handle all mutations; server components fetch data and generate signed URLs for private receipts via `supabase.storage.from('receipts').createSignedUrl(path, 3600)`; client components handle receipt upload (browser Supabase client) and interactive forms. Contract creation calls `generatePaymentRows` helper that iterates month-by-month from `start_date` to `end_date`, clamping the due day to the last day of each month. Termination has two paths: admin-initiated (status → `ending`, delivery = `end_date`) and tenant-initiated (status → `ending`, delivery = `notice_date` + 90 days). Admin confirms physical delivery → status → `ended`.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL + Storage), React `useTransition`, `sonner` toast, shadcn/ui components, `@supabase/ssr` `createBrowserClient` for client-side uploads.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/actions/contracts.ts` | Create | All contract/tenant/payment server actions + `generatePaymentRows` helper |
| `src/app/(admin)/layout.tsx` | Modify | Add Arrendatarios and Contratos nav links |
| `src/components/tenants/tenant-form.tsx` | Create | Reusable add/edit tenant form (client component) |
| `src/app/(admin)/admin/arrendatarios/page.tsx` | Create | Tenant list page |
| `src/app/(admin)/admin/arrendatarios/nuevo/page.tsx` | Create | Create tenant page |
| `src/app/(admin)/admin/arrendatarios/[id]/page.tsx` | Create | Edit tenant page |
| `src/app/(admin)/admin/contratos/page.tsx` | Create | Contract list with status badges |
| `src/components/contracts/contract-form.tsx` | Create | Create contract form (client component) |
| `src/app/(admin)/admin/contratos/nuevo/page.tsx` | Create | Create contract page (server — loads available properties + tenants) |
| `src/components/contracts/payment-register.tsx` | Create | Mark payment paid + upload receipt to `receipts` bucket (client component) |
| `src/app/(admin)/admin/contratos/[id]/page.tsx` | Create | Contract detail + payment calendar with signed URLs (server component) |
| `src/components/contracts/contract-actions.tsx` | Create | Termination entry button + confirm-ended button (client component) |
| `src/app/(admin)/admin/contratos/[id]/terminar/page.tsx` | Create | Non-renewal registration form with optional document upload (client component) |

---

### Task 1: Server Actions — contracts.ts

**Files:**
- Create: `src/lib/actions/contracts.ts`

- [ ] **Step 1: Create the server actions file**

```typescript
// src/lib/actions/contracts.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── Helpers ───────────────────────────────────────────────────────────────────

function generatePaymentRows(
  contractId: string,
  startDate: Date,
  endDate: Date,
  monthlyRent: number
) {
  const rows: { contract_id: string; amount: number; due_date: string; status: string }[] = []
  const dueDay = startDate.getDate()
  let year = startDate.getFullYear()
  let month = startDate.getMonth()

  while (true) {
    const maxDay = new Date(year, month + 1, 0).getDate()
    const due = new Date(year, month, Math.min(dueDay, maxDay))
    if (due > endDate) break
    rows.push({
      contract_id: contractId,
      amount: monthlyRent,
      due_date: due.toISOString().split('T')[0],
      status: 'pending',
    })
    month += 1
    if (month > 11) { month = 0; year += 1 }
  }
  return rows
}

// ── Tenant actions ─────────────────────────────────────────────────────────────

export async function createTenant(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('tenants').insert({
    full_name: String(formData.get('full_name')),
    document_number: formData.get('document_number') ? String(formData.get('document_number')) : null,
    phone: formData.get('phone') ? String(formData.get('phone')) : null,
    email: formData.get('email') ? String(formData.get('email')) : null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/arrendatarios')
  redirect('/admin/arrendatarios')
}

export async function updateTenant(id: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('tenants').update({
    full_name: String(formData.get('full_name')),
    document_number: formData.get('document_number') ? String(formData.get('document_number')) : null,
    phone: formData.get('phone') ? String(formData.get('phone')) : null,
    email: formData.get('email') ? String(formData.get('email')) : null,
  }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/arrendatarios')
  revalidatePath(`/admin/arrendatarios/${id}`)
  redirect('/admin/arrendatarios')
}

// ── Contract actions ───────────────────────────────────────────────────────────

export async function createContract(formData: FormData) {
  const supabase = await createClient()
  const startDate = new Date(String(formData.get('start_date')))
  const endDate = new Date(String(formData.get('end_date')))
  const monthlyRent = Number(formData.get('monthly_rent'))

  const { data: contract, error } = await supabase.from('contracts').insert({
    property_id: String(formData.get('property_id')),
    tenant_id: String(formData.get('tenant_id')),
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    monthly_rent: monthlyRent,
    administration_fee: formData.get('administration_fee') ? Number(formData.get('administration_fee')) : null,
    ipc_rate: formData.get('ipc_rate') ? Number(formData.get('ipc_rate')) : null,
    status: 'active',
    notes: formData.get('notes') ? String(formData.get('notes')) : null,
  }).select('id').single()
  if (error || !contract) throw new Error(error?.message ?? 'Error creando contrato')

  const paymentRows = generatePaymentRows(contract.id, startDate, endDate, monthlyRent)
  if (paymentRows.length > 0) {
    const { error: payError } = await supabase.from('payments').insert(paymentRows)
    if (payError) throw new Error(payError.message)
  }

  revalidatePath('/admin/contratos')
  revalidatePath('/admin/propiedades')
  redirect(`/admin/contratos/${contract.id}`)
}

export async function markPaymentPaid(
  paymentId: string,
  contractId: string,
  receiptPath: string | null,
  notes: string | null
) {
  const supabase = await createClient()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const receiptUrl = receiptPath
    ? `${supabaseUrl}/storage/v1/object/receipts/${receiptPath}`
    : null

  const { error } = await supabase.from('payments').update({
    status: 'paid',
    paid_date: new Date().toISOString().split('T')[0],
    receipt_url: receiptUrl,
    notes: notes || null,
  }).eq('id', paymentId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/contratos/${contractId}`)
}

export async function setContractEnding(
  contractId: string,
  reason: 'non_renewal_admin' | 'non_renewal_tenant',
  noticeDate: string,
  documentPath: string | null
) {
  const supabase = await createClient()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  if (documentPath) {
    const documentUrl = `${supabaseUrl}/storage/v1/object/documents/${documentPath}`
    await supabase.from('documents').insert({
      contract_id: contractId,
      type: 'termination_notice',
      file_url: documentUrl,
      uploaded_by: 'admin',
    })
  }

  const { error } = await supabase.from('contracts').update({
    status: 'ending',
    termination_reason: reason,
    termination_notice_date: noticeDate,
  }).eq('id', contractId)
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/contratos/${contractId}`)
  revalidatePath('/admin/contratos')
  revalidatePath('/admin/propiedades')
  redirect(`/admin/contratos/${contractId}`)
}

export async function setContractEnded(contractId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('contracts').update({
    status: 'ended',
    ended_at: new Date().toISOString(),
  }).eq('id', contractId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/contratos/${contractId}`)
  revalidatePath('/admin/contratos')
  revalidatePath('/admin/propiedades')
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npx tsc --noEmit 2>&1 | head -30`

Expected: No errors. If there are type errors on `.from('tenants')` or `.from('contracts')`, check that those tables exist in `src/types/database.ts` with the correct Insert/Update types.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/contracts.ts
git commit -m "feat: add contracts/tenants/payments server actions with auto payment calendar"
```

---

### Task 2: Admin Nav + Tenants CRUD

**Files:**
- Modify: `src/app/(admin)/layout.tsx`
- Create: `src/components/tenants/tenant-form.tsx`
- Create: `src/app/(admin)/admin/arrendatarios/page.tsx`
- Create: `src/app/(admin)/admin/arrendatarios/nuevo/page.tsx`
- Create: `src/app/(admin)/admin/arrendatarios/[id]/page.tsx`

- [ ] **Step 1: Read the current layout.tsx to find the nav link pattern**

Read `src/app/(admin)/layout.tsx` and find the existing nav links (Dashboard, Propiedades). Add two more links with the exact same className pattern:

```tsx
<Link href="/admin/arrendatarios" className={/* same class as existing links */}>Arrendatarios</Link>
<Link href="/admin/contratos" className={/* same class as existing links */}>Contratos</Link>
```

- [ ] **Step 2: Create tenant-form.tsx**

```tsx
// src/components/tenants/tenant-form.tsx
'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TenantFormProps {
  tenant?: {
    full_name: string
    document_number: string | null
    phone: string | null
    email: string | null
  }
  onSubmit: (formData: FormData) => Promise<void>
}

export function TenantForm({ tenant, onSubmit }: TenantFormProps) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => onSubmit(formData))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-1">
        <Label htmlFor="full_name">Nombre completo *</Label>
        <Input id="full_name" name="full_name" required defaultValue={tenant?.full_name ?? ''} placeholder="Juan Pérez" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="document_number">Cédula</Label>
        <Input id="document_number" name="document_number" defaultValue={tenant?.document_number ?? ''} placeholder="12345678" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" name="phone" defaultValue={tenant?.phone ?? ''} placeholder="3001234567" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={tenant?.email ?? ''} placeholder="juan@ejemplo.com" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : (tenant ? 'Guardar cambios' : 'Crear arrendatario')}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Create arrendatarios list page**

```tsx
// src/app/(admin)/admin/arrendatarios/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function ArrendatariosPage() {
  const supabase = await createClient()
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, full_name, document_number, phone, email')
    .order('full_name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Arrendatarios</h2>
        <Button asChild>
          <Link href="/admin/arrendatarios/nuevo">+ Nuevo arrendatario</Link>
        </Button>
      </div>

      {tenants && tenants.length > 0 ? (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Cédula</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Teléfono</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{t.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{t.document_number ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{t.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{t.email ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/arrendatarios/${t.id}`} className="text-blue-600 hover:underline text-sm">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-slate-400">Sin arrendatarios registrados.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create nuevo arrendatario page**

```tsx
// src/app/(admin)/admin/arrendatarios/nuevo/page.tsx
import Link from 'next/link'
import { TenantForm } from '@/components/tenants/tenant-form'
import { createTenant } from '@/lib/actions/contracts'

export const dynamic = 'force-dynamic'

export default function NuevoArrendatarioPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500 mb-1">
          <Link href="/admin/arrendatarios" className="hover:underline">Arrendatarios</Link> / Nuevo
        </p>
        <h2 className="text-2xl font-bold text-slate-800">Nuevo arrendatario</h2>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <TenantForm onSubmit={createTenant} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create editar arrendatario page**

```tsx
// src/app/(admin)/admin/arrendatarios/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TenantForm } from '@/components/tenants/tenant-form'
import { updateTenant } from '@/lib/actions/contracts'

export const dynamic = 'force-dynamic'

export default async function EditarArrendatarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, full_name, document_number, phone, email')
    .eq('id', id)
    .single()

  if (!tenant) notFound()

  const updateWithId = updateTenant.bind(null, id)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500 mb-1">
          <Link href="/admin/arrendatarios" className="hover:underline">Arrendatarios</Link> / Editar
        </p>
        <h2 className="text-2xl font-bold text-slate-800">{tenant.full_name}</h2>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <TenantForm tenant={tenant} onSubmit={updateWithId} />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify TypeScript compilation**

Run: `cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npx tsc --noEmit 2>&1 | head -30`

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/(admin)/layout.tsx src/components/tenants/ src/app/(admin)/admin/arrendatarios/
git commit -m "feat: add tenant CRUD pages and Arrendatarios/Contratos nav links"
```

---

### Task 3: Contract List Page

**Files:**
- Create: `src/app/(admin)/admin/contratos/page.tsx`

- [ ] **Step 1: Create contracts list page**

```tsx
// src/app/(admin)/admin/contratos/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active:    { label: 'Activo',     className: 'bg-green-100 text-green-700' },
  ending:    { label: 'Terminando', className: 'bg-amber-100 text-amber-700' },
  ended:     { label: 'Terminado',  className: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Cancelado',  className: 'bg-red-100 text-red-600' },
}

export default async function ContratosPage() {
  const supabase = await createClient()
  const { data: contracts } = await supabase
    .from('contracts')
    .select(`
      id, status, start_date, end_date, monthly_rent,
      properties(name, address),
      tenants(full_name)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Contratos</h2>
        <Button asChild>
          <Link href="/admin/contratos/nuevo">+ Nuevo contrato</Link>
        </Button>
      </div>

      {contracts && contracts.length > 0 ? (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Inmueble</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Arrendatario</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Vigencia</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Canon</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(contracts as unknown as Array<{
                id: string
                status: string
                start_date: string
                end_date: string
                monthly_rent: number
                properties: { name: string; address: string } | null
                tenants: { full_name: string } | null
              }>).map((c) => {
                const badge = STATUS_LABEL[c.status] ?? { label: c.status, className: 'bg-slate-100 text-slate-600' }
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{c.properties?.name}</p>
                      <p className="text-xs text-slate-500">{c.properties?.address}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{c.tenants?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                      {c.start_date} → {c.end_date}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      ${c.monthly_rent.toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/contratos/${c.id}`} className="text-blue-600 hover:underline text-sm">
                        Ver
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-slate-400">Sin contratos registrados.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npx tsc --noEmit 2>&1 | head -30`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(admin)/admin/contratos/page.tsx
git commit -m "feat: add contracts list page with status badges"
```

---

### Task 4: Create Contract Page

**Files:**
- Create: `src/components/contracts/contract-form.tsx`
- Create: `src/app/(admin)/admin/contratos/nuevo/page.tsx`

- [ ] **Step 1: Create contract-form.tsx client component**

```tsx
// src/components/contracts/contract-form.tsx
'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Selectable { id: string; label: string }

interface ContractFormProps {
  properties: Selectable[]
  tenants: Selectable[]
  onSubmit: (formData: FormData) => Promise<void>
}

export function ContractForm({ properties, tenants, onSubmit }: ContractFormProps) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => onSubmit(formData))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="property_id">Inmueble *</Label>
          <select
            id="property_id"
            name="property_id"
            required
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">Seleccionar inmueble</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="tenant_id">Arrendatario *</Label>
          <select
            id="tenant_id"
            name="tenant_id"
            required
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">Seleccionar arrendatario</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="start_date">Fecha inicio *</Label>
          <Input id="start_date" name="start_date" type="date" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end_date">Fecha fin *</Label>
          <Input id="end_date" name="end_date" type="date" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="monthly_rent">Canon mensual (COP) *</Label>
          <Input id="monthly_rent" name="monthly_rent" type="number" min="0" required placeholder="1500000" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="administration_fee">Cuota administración (COP)</Label>
          <Input id="administration_fee" name="administration_fee" type="number" min="0" placeholder="150000" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ipc_rate">IPC % vigente</Label>
          <Input id="ipc_rate" name="ipc_rate" type="number" min="0" step="0.01" placeholder="7.24" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Observaciones adicionales..." />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Creando contrato...' : 'Crear contrato'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create nuevo contrato page**

```tsx
// src/app/(admin)/admin/contratos/nuevo/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ContractForm } from '@/components/contracts/contract-form'
import { createContract } from '@/lib/actions/contracts'

export const dynamic = 'force-dynamic'

export default async function NuevoContratoPage() {
  const supabase = await createClient()

  const [{ data: properties }, { data: tenants }] = await Promise.all([
    supabase.from('properties').select('id, name, address').order('name'),
    supabase.from('tenants').select('id, full_name, document_number').order('full_name'),
  ])

  const propertyOptions = (properties ?? []).map((p) => ({
    id: p.id,
    label: `${p.name} — ${p.address}`,
  }))

  const tenantOptions = (tenants ?? []).map((t) => ({
    id: t.id,
    label: t.document_number
      ? `${t.full_name} (CC ${t.document_number})`
      : t.full_name,
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500 mb-1">
          <Link href="/admin/contratos" className="hover:underline">Contratos</Link> / Nuevo
        </p>
        <h2 className="text-2xl font-bold text-slate-800">Nuevo contrato</h2>
        <p className="text-slate-500 text-sm mt-1">
          El calendario de pagos se genera automáticamente al crear el contrato.
        </p>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <ContractForm
          properties={propertyOptions}
          tenants={tenantOptions}
          onSubmit={createContract}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npx tsc --noEmit 2>&1 | head -30`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/contracts/contract-form.tsx src/app/(admin)/admin/contratos/nuevo/
git commit -m "feat: add create contract form with property/tenant selectors and auto-calendar note"
```

---

### Task 5: Contract Detail + Payment Registration

**Files:**
- Create: `src/components/contracts/payment-register.tsx`
- Create: `src/components/contracts/contract-actions.tsx` (placeholder — full implementation in Task 6)
- Create: `src/app/(admin)/admin/contratos/[id]/page.tsx`

- [ ] **Step 1: Create payment-register.tsx client component**

Uploads receipt to private `receipts` bucket using browser Supabase client, then calls `markPaymentPaid` server action.

```tsx
// src/components/contracts/payment-register.tsx
'use client'

import { useState, useTransition } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { markPaymentPaid } from '@/lib/actions/contracts'
import { toast } from 'sonner'

interface PaymentRegisterProps {
  paymentId: string
  contractId: string
  dueDate: string
  amount: number
}

export function PaymentRegister({ paymentId, contractId, dueDate, amount }: PaymentRegisterProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit() {
    startTransition(async () => {
      try {
        let receiptPath: string | null = null
        if (file) {
          const ext = file.name.split('.').pop()
          const path = `contracts/${contractId}/payments/${paymentId}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(path, file, { upsert: true })
          if (uploadError) throw new Error(uploadError.message)
          receiptPath = path
        }
        await markPaymentPaid(paymentId, contractId, receiptPath, notes || null)
        toast.success('Pago registrado')
        setOpen(false)
      } catch {
        toast.error('Error al registrar el pago')
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-green-600 hover:text-green-800 text-sm font-medium"
      >
        Registrar pago
      </button>
    )
  }

  return (
    <div className="border rounded-lg p-4 bg-green-50 space-y-3 mt-2">
      <p className="text-sm font-medium text-slate-700">
        Registrar pago — Cuota {dueDate} (${amount.toLocaleString('es-CO')})
      </p>
      <div className="space-y-1">
        <Label className="text-xs">Comprobante (opcional)</Label>
        <Input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Notas</Label>
        <Textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observación..."
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Guardando...' : 'Confirmar pago'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create contract-actions.tsx placeholder**

This placeholder satisfies the import in the detail page. It will be replaced in full in Task 6.

```tsx
// src/components/contracts/contract-actions.tsx
'use client'

interface ContractActionsProps {
  contractId: string
  status: string
}

export function ContractActions({ contractId: _contractId, status: _status }: ContractActionsProps) {
  return null
}
```

- [ ] **Step 3: Create contract detail page**

Server component — generates signed URLs for all payment receipts via `Promise.all`.

```tsx
// src/app/(admin)/admin/contratos/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PaymentRegister } from '@/components/contracts/payment-register'
import { ContractActions } from '@/components/contracts/contract-actions'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active:    { label: 'Activo',     className: 'bg-green-100 text-green-700' },
  ending:    { label: 'Terminando', className: 'bg-amber-100 text-amber-700' },
  ended:     { label: 'Terminado',  className: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Cancelado',  className: 'bg-red-100 text-red-600' },
}

const PAYMENT_STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-amber-100 text-amber-700' },
  paid:    { label: 'Pagado',    className: 'bg-green-100 text-green-700' },
  overdue: { label: 'Vencido',   className: 'bg-red-100 text-red-600' },
}

export default async function ContratoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select(`
      id, status, start_date, end_date, monthly_rent, administration_fee,
      ipc_rate, termination_reason, termination_notice_date, ended_at, notes,
      properties(id, name, address),
      tenants(id, full_name, document_number, phone, email)
    `)
    .eq('id', id)
    .single()

  if (!contract) notFound()

  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, due_date, paid_date, status, receipt_url, notes')
    .eq('contract_id', id)
    .order('due_date')

  const paymentsWithSignedUrls = await Promise.all(
    (payments ?? []).map(async (p) => {
      if (!p.receipt_url) return { ...p, signedReceiptUrl: null }
      const urlPath = p.receipt_url.split('/storage/v1/object/receipts/')[1]
      if (!urlPath) return { ...p, signedReceiptUrl: null }
      const { data } = await supabase.storage.from('receipts').createSignedUrl(urlPath, 3600)
      return { ...p, signedReceiptUrl: data?.signedUrl ?? null }
    })
  )

  const c = contract as unknown as {
    id: string
    status: string
    start_date: string
    end_date: string
    monthly_rent: number
    administration_fee: number | null
    ipc_rate: number | null
    termination_reason: string | null
    termination_notice_date: string | null
    ended_at: string | null
    notes: string | null
    properties: { id: string; name: string; address: string } | null
    tenants: {
      id: string
      full_name: string
      document_number: string | null
      phone: string | null
      email: string | null
    } | null
  }

  const badge = STATUS_LABEL[c.status] ?? { label: c.status, className: 'bg-slate-100 text-slate-600' }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">
            <Link href="/admin/contratos" className="hover:underline">Contratos</Link> / Detalle
          </p>
          <h2 className="text-2xl font-bold text-slate-800">{c.properties?.name}</h2>
          <p className="text-slate-500">{c.properties?.address}</p>
          <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <ContractActions contractId={id} status={c.status} />
      </div>

      <div className="grid grid-cols-2 gap-6 bg-white rounded-lg border p-6">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Arrendatario</p>
          <p className="font-medium text-slate-800">{c.tenants?.full_name}</p>
          {c.tenants?.document_number && (
            <p className="text-sm text-slate-500">CC: {c.tenants.document_number}</p>
          )}
          {c.tenants?.phone && <p className="text-sm text-slate-500">{c.tenants.phone}</p>}
          {c.tenants?.email && <p className="text-sm text-slate-500">{c.tenants.email}</p>}
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-slate-500">Vigencia</p>
            <p className="text-sm font-medium">{c.start_date} → {c.end_date}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Canon mensual</p>
            <p className="text-sm font-medium">${c.monthly_rent.toLocaleString('es-CO')}</p>
          </div>
          {c.administration_fee != null && (
            <div>
              <p className="text-xs text-slate-500">Administración</p>
              <p className="text-sm font-medium">${c.administration_fee.toLocaleString('es-CO')}</p>
            </div>
          )}
          {c.ipc_rate != null && (
            <div>
              <p className="text-xs text-slate-500">IPC</p>
              <p className="text-sm font-medium">{c.ipc_rate}%</p>
            </div>
          )}
        </div>
        {c.notes && (
          <div className="col-span-2">
            <p className="text-xs text-slate-500 mb-0.5">Notas</p>
            <p className="text-sm text-slate-700">{c.notes}</p>
          </div>
        )}
        {c.termination_notice_date && (
          <div className="col-span-2 bg-amber-50 rounded-md p-3">
            <p className="text-xs font-medium text-amber-700 mb-0.5">No renovación registrada</p>
            <p className="text-sm text-amber-800">
              Motivo:{' '}
              {c.termination_reason === 'non_renewal_admin'
                ? 'Por el administrador'
                : 'Por el arrendatario'}
              {' · '}Notificación: {c.termination_notice_date}
              {c.termination_reason === 'non_renewal_tenant' && (
                <>
                  {' · '}Entrega estimada:{' '}
                  {new Date(
                    new Date(c.termination_notice_date).getTime() + 90 * 86400000
                  )
                    .toISOString()
                    .split('T')[0]}
                </>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-semibold text-slate-800">Calendario de pagos</h3>
        {paymentsWithSignedUrls.length > 0 ? (
          <div className="space-y-2">
            {paymentsWithSignedUrls.map((p) => {
              const pb =
                PAYMENT_STATUS_LABEL[p.status] ?? {
                  label: p.status,
                  className: 'bg-slate-100 text-slate-600',
                }
              return (
                <div key={p.id} className="border rounded-md px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.due_date}</p>
                      <p className="text-xs text-slate-500">${p.amount.toLocaleString('es-CO')}</p>
                      {p.paid_date && (
                        <p className="text-xs text-green-600">Pagado: {p.paid_date}</p>
                      )}
                      {p.notes && <p className="text-xs text-slate-400">{p.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${pb.className}`}
                      >
                        {pb.label}
                      </span>
                      {p.signedReceiptUrl && (
                        <a
                          href={p.signedReceiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Ver comprobante
                        </a>
                      )}
                      {p.status !== 'paid' && c.status === 'active' && (
                        <PaymentRegister
                          paymentId={p.id}
                          contractId={id}
                          dueDate={p.due_date}
                          amount={p.amount}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Sin pagos registrados.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript compilation**

Run: `cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npx tsc --noEmit 2>&1 | head -30`

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/contracts/ src/app/(admin)/admin/contratos/[id]/page.tsx
git commit -m "feat: add contract detail page with payment calendar and receipt upload"
```

---

### Task 6: Contract Termination Actions

**Files:**
- Modify: `src/components/contracts/contract-actions.tsx` (replace placeholder with full implementation)
- Create: `src/app/(admin)/admin/contratos/[id]/terminar/page.tsx`

- [ ] **Step 1: Replace contract-actions.tsx with full implementation**

```tsx
// src/components/contracts/contract-actions.tsx
'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { setContractEnded } from '@/lib/actions/contracts'
import { toast } from 'sonner'

interface ContractActionsProps {
  contractId: string
  status: string
}

export function ContractActions({ contractId, status }: ContractActionsProps) {
  const [isPending, startTransition] = useTransition()

  function handleConfirmEnded() {
    if (!confirm('¿Confirmar que el inmueble fue entregado? Esto cerrará el contrato definitivamente.')) return
    startTransition(async () => {
      try {
        await setContractEnded(contractId)
        toast.success('Contrato cerrado')
      } catch {
        toast.error('Error al cerrar el contrato')
      }
    })
  }

  if (status !== 'active' && status !== 'ending') return null

  return (
    <div className="flex gap-2">
      {status === 'active' && (
        <Button variant="outline" asChild>
          <Link href={`/admin/contratos/${contractId}/terminar`}>Iniciar no renovación</Link>
        </Button>
      )}
      {status === 'ending' && (
        <Button variant="destructive" onClick={handleConfirmEnded} disabled={isPending}>
          {isPending ? 'Cerrando...' : 'Confirmar entrega'}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create termination page**

This is a client component — needs browser Supabase client for document upload and `useParams` for the contract ID.

```tsx
// src/app/(admin)/admin/contratos/[id]/terminar/page.tsx
'use client'

import { useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setContractEnding } from '@/lib/actions/contracts'
import { toast } from 'sonner'

export default function TerminarContratoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [reason, setReason] = useState<'non_renewal_admin' | 'non_renewal_tenant'>('non_renewal_admin')
  const [noticeDate, setNoticeDate] = useState(new Date().toISOString().split('T')[0])
  const [file, setFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const deliveryDate =
    reason === 'non_renewal_tenant'
      ? new Date(new Date(noticeDate).getTime() + 90 * 86400000).toISOString().split('T')[0]
      : null

  function handleSubmit() {
    if (!confirm('¿Registrar la no renovación de este contrato?')) return
    startTransition(async () => {
      try {
        let documentPath: string | null = null
        if (file) {
          const ext = file.name.split('.').pop()
          const path = `contracts/${id}/termination-notice.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(path, file, { upsert: true })
          if (uploadError) throw new Error(uploadError.message)
          documentPath = path
        }
        await setContractEnding(id, reason, noticeDate, documentPath)
        toast.success('No renovación registrada')
        router.push(`/admin/contratos/${id}`)
      } catch {
        toast.error('Error al registrar la no renovación')
      }
    })
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <p className="text-sm text-slate-500 mb-1">
          <Link href="/admin/contratos" className="hover:underline">Contratos</Link>
          {' / '}
          <Link href={`/admin/contratos/${id}`} className="hover:underline">Detalle</Link>
          {' / '}Registrar no renovación
        </p>
        <h2 className="text-2xl font-bold text-slate-800">Registrar no renovación</h2>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-5">
        <div className="space-y-2">
          <Label>¿Quién no renueva?</Label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="non_renewal_admin"
                checked={reason === 'non_renewal_admin'}
                onChange={() => setReason('non_renewal_admin')}
              />
              <span className="text-sm">El administrador</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="non_renewal_tenant"
                checked={reason === 'non_renewal_tenant'}
                onChange={() => setReason('non_renewal_tenant')}
              />
              <span className="text-sm">El arrendatario</span>
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="noticeDate">
            {reason === 'non_renewal_admin'
              ? 'Fecha de notificación al arrendatario'
              : 'Fecha de la carta del arrendatario'}
          </Label>
          <Input
            id="noticeDate"
            type="date"
            value={noticeDate}
            onChange={(e) => setNoticeDate(e.target.value)}
          />
        </div>

        {deliveryDate && (
          <div className="bg-amber-50 rounded-md p-3 text-sm text-amber-800">
            Fecha estimada de entrega: <strong>{deliveryDate}</strong>
            <span className="text-amber-600"> (fecha carta + 90 días — Ley 820 de 2003)</span>
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="doc">
            {reason === 'non_renewal_admin'
              ? 'Copia de carta enviada (opcional)'
              : 'Carta del arrendatario (opcional)'}
          </Label>
          <Input
            id="doc"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Guardando...' : 'Registrar no renovación'}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/contratos/${id}`}>Cancelar</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npx tsc --noEmit 2>&1 | head -30`

Expected: No errors.

- [ ] **Step 4: Manual smoke test**

Open the dev server at `http://localhost:3000` and verify:
1. Admin nav shows Arrendatarios and Contratos links
2. `/admin/arrendatarios` — list loads, "Nuevo arrendatario" button works, form submits and redirects back
3. `/admin/contratos/nuevo` — property and tenant dropdowns populate, filling all required fields and submitting creates the contract and redirects to the detail page
4. Contract detail page — payment calendar renders, "Registrar pago" button opens inline form, submitting with or without a receipt updates the payment to "Pagado"
5. "Iniciar no renovación" button on an active contract navigates to `/terminar` page, selecting tenant option shows the 90-day delivery estimate
6. After registering non-renewal, contract shows amber banner with dates and "Confirmar entrega" button
7. Confirming delivery closes the contract (status → Terminado)

- [ ] **Step 5: Commit**

```bash
git add src/components/contracts/contract-actions.tsx src/app/(admin)/admin/contratos/[id]/terminar/
git commit -m "feat: add contract termination flow — non-renewal (admin/tenant) and confirm-ended"
```
