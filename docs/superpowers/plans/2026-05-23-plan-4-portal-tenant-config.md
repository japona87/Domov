# Plan 4: Portal del Arrendatario (M5) + Configuración (M6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the tenant-facing portal (M5) so arrendatarios can log in and see their contract, payment calendar, and receipts; implement system config (M6) so the admin can update IPC, salary increase %, and notice days; and add the "Invite tenant" flow from the admin panel.

**Architecture:**
- M6 is a simple CRUD page on `system_config` table — one row per year, admin updates via server action.
- M5 tenant invite: admin clicks "Invitar" on the arrendatario edit page → server action calls `supabase.auth.admin.inviteUserByEmail()` using a service-role client, receives the new user ID, immediately writes it to `tenants.user_id`. Tenant receives email → sets password → logs in → middleware sends them to `/tenant/dashboard`.
- Tenant portal: server components fetch data filtered by `tenants.user_id = auth.uid()`. Three pages: dashboard (overview), contrato (details), pagos (payment calendar + receipt download).
- Tenant layout: simple top header (logo + logout), no sidebar. Applies Domov design tokens.

**Tech Stack:** Next.js 16 App Router, Supabase (Auth admin API + PostgreSQL), `@supabase/supabase-js` service role client for invite, signed URLs for private receipts, Tailwind v4 with Domov tokens.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/supabase/admin.ts` | Create | Service-role Supabase client (server only) |
| `src/lib/actions/config.ts` | Create | `getSystemConfig`, `updateSystemConfig` server actions |
| `src/lib/actions/tenants-admin.ts` | Create | `inviteTenant` server action using service-role client |
| `src/app/(admin)/admin/configuracion/page.tsx` | Create | System config form page |
| `src/components/admin/sidebar-nav.tsx` | Modify | Add Configuración nav link |
| `src/app/(admin)/admin/arrendatarios/[id]/page.tsx` | Modify | Add "Invitar al portal" button |
| `src/app/(tenant)/layout.tsx` | Rewrite | Tenant layout with Domov design header |
| `src/app/(tenant)/tenant/dashboard/page.tsx` | Rewrite | Tenant overview: contract status + next payment |
| `src/app/(tenant)/tenant/contrato/page.tsx` | Create | Tenant contract details page |
| `src/app/(tenant)/tenant/pagos/page.tsx` | Create | Tenant payment calendar with signed receipt URLs |

---

### Task 1: M6 — System Config

**Files:**
- Create: `src/lib/actions/config.ts`
- Create: `src/app/(admin)/admin/configuracion/page.tsx`
- Modify: `src/components/admin/sidebar-nav.tsx`

- [ ] **Step 1: Create config server actions**

```typescript
// src/lib/actions/config.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSystemConfig() {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()
  const { data } = await supabase
    .from('system_config')
    .select('*')
    .eq('year', currentYear)
    .single()
  return data
}

export async function updateSystemConfig(formData: FormData) {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()

  const values = {
    year: currentYear,
    ipc_rate: formData.get('ipc_rate') ? Number(formData.get('ipc_rate')) : null,
    min_wage_increase: formData.get('min_wage_increase') ? Number(formData.get('min_wage_increase')) : null,
    renewal_notice_days: formData.get('renewal_notice_days') ? Number(formData.get('renewal_notice_days')) : 120,
    updated_at: new Date().toISOString(),
  }

  // Upsert: create if not exists, update if exists
  const { error } = await supabase
    .from('system_config')
    .upsert(values, { onConflict: 'year' })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/configuracion')
}
```

- [ ] **Step 2: Create config page**

```tsx
// src/app/(admin)/admin/configuracion/page.tsx
import { getSystemConfig, updateSystemConfig } from '@/lib/actions/config'

export const dynamic = 'force-dynamic'

export default async function ConfiguracionPage() {
  const config = await getSystemConfig()
  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-navy-800">Configuración</h1>
        <p className="text-slate-500 text-sm mt-1">Parámetros del sistema para el año {currentYear}</p>
      </div>

      <form action={updateSystemConfig} className="bg-white rounded-xl border p-6 space-y-6 max-w-lg">
        <div className="space-y-1">
          <label htmlFor="ipc_rate" className="text-sm font-medium text-slate-700">
            IPC % vigente {currentYear}
          </label>
          <input
            id="ipc_rate"
            name="ipc_rate"
            type="number"
            step="0.01"
            min="0"
            defaultValue={config?.ipc_rate ?? ''}
            placeholder="Ej: 7.24"
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
          />
          <p className="text-xs text-slate-400">Usado para calcular el ajuste del canon en renovaciones.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="min_wage_increase" className="text-sm font-medium text-slate-700">
            % Aumento salario mínimo {currentYear}
          </label>
          <input
            id="min_wage_increase"
            name="min_wage_increase"
            type="number"
            step="0.01"
            min="0"
            defaultValue={config?.min_wage_increase ?? ''}
            placeholder="Ej: 12.00"
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
          />
          <p className="text-xs text-slate-400">Usado para ajustar la cuota de administración en renovaciones.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="renewal_notice_days" className="text-sm font-medium text-slate-700">
            Días de preaviso para alertas de vencimiento
          </label>
          <input
            id="renewal_notice_days"
            name="renewal_notice_days"
            type="number"
            min="1"
            defaultValue={config?.renewal_notice_days ?? 120}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
          />
          <p className="text-xs text-slate-400">
            El dashboard alertará contratos que venzan dentro de este plazo. Default: 120 días.
          </p>
        </div>

        <button
          type="submit"
          className="bg-navy-800 hover:bg-navy-700 text-white text-sm font-medium px-5 py-2.5 rounded-md transition-colors"
        >
          Guardar configuración
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Add Configuración to sidebar nav**

Read `src/components/admin/sidebar-nav.tsx` and add a new entry to `NAV_ITEMS`:

```tsx
{
  href: '/admin/configuracion',
  label: 'Configuración',
  icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
},
```

- [ ] **Step 4: Verify TypeScript compilation**

Run: `cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npx tsc --noEmit 2>&1 | head -30`

If `system_config` table is missing from `src/types/database.ts`, add it following the same pattern as other tables. Columns: `id`, `year` (number), `ipc_rate` (number | null), `min_wage_increase` (number | null), `renewal_notice_days` (number | null), `updated_at` (string | null).

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/config.ts src/app/(admin)/admin/configuracion/ src/components/admin/sidebar-nav.tsx src/types/database.ts
git commit -m "feat: add M6 system config page — IPC, salary increase, notice days"
```

---

### Task 2: Tenant Invite Flow (admin side)

**Files:**
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/actions/tenants-admin.ts`
- Modify: `src/app/(admin)/admin/arrendatarios/[id]/page.tsx`

- [ ] **Step 1: Create service-role Supabase client**

```typescript
// src/lib/supabase/admin.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')
  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
```

- [ ] **Step 2: Create inviteTenant server action**

```typescript
// src/lib/actions/tenants-admin.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function inviteTenant(tenantId: string, email: string) {
  // Verify caller is admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const adminClient = createAdminClient()

  // Send invite email via Supabase Auth admin API
  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/tenant/dashboard`,
  })
  if (inviteError) throw new Error(inviteError.message)

  // Link the new auth user to the tenants record immediately
  const { error: updateError } = await adminClient
    .from('tenants')
    .update({ user_id: inviteData.user.id })
    .eq('id', tenantId)
  if (updateError) throw new Error(updateError.message)

  // Also create the profile row so RBAC works on first login
  await adminClient.from('profiles').upsert({
    id: inviteData.user.id,
    role: 'tenant',
    full_name: null,
  }, { onConflict: 'id' })

  revalidatePath(`/admin/arrendatarios/${tenantId}`)
}
```

- [ ] **Step 3: Add .env.local variables check**

Verify `.env.local` has `SUPABASE_SERVICE_ROLE_KEY` set. Run:
```bash
grep SUPABASE_SERVICE_ROLE_KEY "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov/.env.local" | head -1 | cut -c1-40
```
If missing, the user needs to add it. Note this in your report but don't block.

Also check if `NEXT_PUBLIC_APP_URL` is set — if not, the redirect will default to `http://localhost:3000/tenant/dashboard` which is fine for dev.

- [ ] **Step 4: Add "Invitar al portal" button to arrendatario edit page**

Read `src/app/(admin)/admin/arrendatarios/[id]/page.tsx`. Add an invite section below the TenantForm card.

The invite button is a client component to handle the async action with feedback:

Create `src/components/tenants/invite-button.tsx`:

```tsx
'use client'

import { useTransition } from 'react'
import { inviteTenant } from '@/lib/actions/tenants-admin'
import { toast } from 'sonner'

interface InviteButtonProps {
  tenantId: string
  email: string | null
  hasUserId: boolean
}

export function InviteButton({ tenantId, email, hasUserId }: InviteButtonProps) {
  const [isPending, startTransition] = useTransition()

  if (!email) {
    return (
      <p className="text-sm text-slate-400">
        Agrega un email al arrendatario para poder invitarlo al portal.
      </p>
    )
  }

  if (hasUserId) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
        <p className="text-sm text-slate-600">Ya tiene acceso al portal ({email})</p>
      </div>
    )
  }

  function handleInvite() {
    if (!confirm(`¿Enviar invitación al portal a ${email}?`)) return
    startTransition(async () => {
      try {
        await inviteTenant(tenantId, email!)
        toast.success('Invitación enviada por email')
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al enviar invitación'
        toast.error(msg)
      }
    })
  }

  return (
    <button
      onClick={handleInvite}
      disabled={isPending}
      className="bg-navy-800 hover:bg-navy-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
    >
      {isPending ? 'Enviando...' : 'Invitar al portal'}
    </button>
  )
}
```

In `src/app/(admin)/admin/arrendatarios/[id]/page.tsx`, add to the query `user_id` field, and add below the form card:

```tsx
import { InviteButton } from '@/components/tenants/invite-button'

// In the select query add user_id:
// .select('id, full_name, document_number, phone, email, user_id')

// Below the TenantForm card:
<div className="bg-white rounded-xl border p-6 max-w-lg space-y-3">
  <h3 className="font-medium text-slate-800">Acceso al portal</h3>
  <InviteButton
    tenantId={id}
    email={tenant.email}
    hasUserId={!!tenant.user_id}
  />
</div>
```

- [ ] **Step 5: Verify TypeScript compilation**

Run: `cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npx tsc --noEmit 2>&1 | head -30`

Add `user_id` to `tenants.Row/Insert/Update` in `src/types/database.ts` if TypeScript errors appear.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/admin.ts src/lib/actions/tenants-admin.ts src/components/tenants/invite-button.tsx src/app/(admin)/admin/arrendatarios/ src/types/database.ts
git commit -m "feat: add tenant invite flow — service role invite + link user_id to tenants record"
```

---

### Task 3: Tenant Layout + Dashboard

**Files:**
- Rewrite: `src/app/(tenant)/layout.tsx`
- Rewrite: `src/app/(tenant)/tenant/dashboard/page.tsx`

- [ ] **Step 1: Read current files**

Read `src/app/(tenant)/layout.tsx` and `src/app/(tenant)/tenant/dashboard/page.tsx` to understand what's there.

- [ ] **Step 2: Rewrite tenant layout**

Simple top header — no sidebar. Logo, tenant name, logout button.

```tsx
// src/app/(tenant)/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('full_name')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-navy-800 h-[64px] flex items-center px-6 sticky top-0 z-40">
        <div className="w-full max-w-[1080px] mx-auto flex items-center justify-between">
          <Link href="/tenant/dashboard" className="font-heading text-xl text-white tracking-tight">
            Dom<span className="text-lime-500">ov</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-navy-200">{tenant?.full_name ?? user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1080px] mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Rewrite tenant dashboard**

```tsx
// src/app/(tenant)/tenant/dashboard/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active:  { label: 'Activo',     className: 'bg-green-100 text-green-700' },
  ending:  { label: 'Terminando', className: 'bg-amber-100 text-amber-700' },
  ended:   { label: 'Terminado',  className: 'bg-slate-100 text-slate-600' },
}

export default async function TenantDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get tenant record linked to this user
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single()

  if (!tenant) {
    return (
      <div className="text-center py-20">
        <p className="font-heading text-2xl text-navy-800 mb-2">Sin contrato asignado</p>
        <p className="text-slate-500 text-sm">Contacta al administrador para más información.</p>
      </div>
    )
  }

  // Get active/ending contract
  const { data: contract } = await supabase
    .from('contracts')
    .select(`
      id, status, start_date, end_date, monthly_rent, administration_fee,
      properties(name, address)
    `)
    .eq('tenant_id', tenant.id)
    .in('status', ['active', 'ending'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Get next pending payment
  const { data: nextPayment } = contract
    ? await supabase
        .from('payments')
        .select('id, due_date, amount, status')
        .eq('contract_id', contract.id)
        .eq('status', 'pending')
        .order('due_date')
        .limit(1)
        .single()
    : { data: null }

  // Count pending payments
  const { count: pendingCount } = contract
    ? await supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('contract_id', contract.id)
        .eq('status', 'pending')
    : { count: 0 }

  const c = contract as unknown as {
    id: string
    status: string
    start_date: string
    end_date: string
    monthly_rent: number
    administration_fee: number | null
    properties: { name: string; address: string } | null
  } | null

  const badge = c ? (STATUS_LABEL[c.status] ?? { label: c.status, className: 'bg-slate-100 text-slate-600' }) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-navy-800">Bienvenido, {tenant.full_name?.split(' ')[0]}</h1>
        <p className="text-slate-500 text-sm mt-1">Resumen de tu arrendamiento</p>
      </div>

      {!c ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <p className="text-slate-400">No tienes un contrato activo actualmente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Contract card */}
          <div className="md:col-span-2 bg-white rounded-xl border p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Inmueble</p>
                <p className="font-heading text-xl text-navy-800">{c.properties?.name}</p>
                <p className="text-sm text-slate-500">{c.properties?.address}</p>
              </div>
              {badge && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                  {badge.label}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-cream-dark">
              <div>
                <p className="text-xs text-slate-400">Vigencia</p>
                <p className="text-sm font-medium text-slate-700">{c.start_date} → {c.end_date}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Canon mensual</p>
                <p className="font-heading text-lg text-navy-800">${c.monthly_rent.toLocaleString('es-CO')}</p>
              </div>
              {c.administration_fee != null && (
                <div>
                  <p className="text-xs text-slate-400">Administración</p>
                  <p className="text-sm font-medium text-slate-700">${c.administration_fee.toLocaleString('es-CO')}</p>
                </div>
              )}
            </div>
            <div className="pt-2">
              <Link href="/tenant/contrato" className="text-sm text-navy-600 hover:text-navy-800 font-medium">
                Ver detalles del contrato →
              </Link>
            </div>
          </div>

          {/* Next payment card */}
          <div className="bg-white rounded-xl border p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">Próximo pago</p>
              {nextPayment ? (
                <>
                  <p className="font-heading text-2xl text-navy-800">${nextPayment.amount.toLocaleString('es-CO')}</p>
                  <p className="text-sm text-slate-500 mt-1">Vence: {nextPayment.due_date}</p>
                  {(pendingCount ?? 0) > 1 && (
                    <p className="text-xs text-amber-600 mt-2">{pendingCount} cuotas pendientes en total</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-green-600 font-medium mt-1">¡Al día con tus pagos!</p>
              )}
            </div>
            <Link href="/tenant/pagos" className="mt-4 block text-center bg-navy-800 hover:bg-navy-700 text-white text-sm font-medium px-4 py-2.5 rounded-md transition-colors">
              Ver mis pagos
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript compilation**

Run: `cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npx tsc --noEmit 2>&1 | head -30`

- [ ] **Step 5: Commit**

```bash
git add src/app/(tenant)/layout.tsx src/app/(tenant)/tenant/dashboard/page.tsx
git commit -m "feat: add tenant layout (navy header) and dashboard with contract overview + next payment"
```

---

### Task 4: Tenant Contract Detail + Payment Calendar

**Files:**
- Create: `src/app/(tenant)/tenant/contrato/page.tsx`
- Create: `src/app/(tenant)/tenant/pagos/page.tsx`

- [ ] **Step 1: Create tenant contract detail page**

```tsx
// src/app/(tenant)/tenant/contrato/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TenantContratoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, full_name, document_number, phone, email')
    .eq('user_id', user.id)
    .single()

  if (!tenant) redirect('/tenant/dashboard')

  const { data: contract } = await supabase
    .from('contracts')
    .select(`
      id, status, start_date, end_date, monthly_rent, administration_fee,
      ipc_rate, termination_reason, termination_notice_date, notes,
      properties(name, address, type, features)
    `)
    .eq('tenant_id', tenant.id)
    .in('status', ['active', 'ending', 'ended'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

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
    notes: string | null
    properties: { name: string; address: string; type: string; features: Record<string, unknown> | null } | null
  } | null

  if (!c) {
    return (
      <div className="text-center py-20">
        <p className="font-heading text-xl text-navy-800">Sin contrato disponible</p>
      </div>
    )
  }

  const STATUS_LABEL: Record<string, { label: string; className: string }> = {
    active:  { label: 'Activo',     className: 'bg-green-100 text-green-700' },
    ending:  { label: 'Terminando', className: 'bg-amber-100 text-amber-700' },
    ended:   { label: 'Terminado',  className: 'bg-slate-100 text-slate-600' },
  }
  const badge = STATUS_LABEL[c.status] ?? { label: c.status, className: 'bg-slate-100 text-slate-600' }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl text-navy-800">Mi contrato</h1>

      <div className="bg-white rounded-xl border p-6 space-y-6">
        {/* Property */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Inmueble</p>
            <p className="font-heading text-xl text-navy-800">{c.properties?.name}</p>
            <p className="text-sm text-slate-500">{c.properties?.address}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>{badge.label}</span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-cream-dark">
          <div><p className="text-xs text-slate-400">Inicio</p><p className="text-sm font-medium">{c.start_date}</p></div>
          <div><p className="text-xs text-slate-400">Fin</p><p className="text-sm font-medium">{c.end_date}</p></div>
          <div><p className="text-xs text-slate-400">Canon</p><p className="text-sm font-medium">${c.monthly_rent.toLocaleString('es-CO')}</p></div>
          {c.administration_fee != null && (
            <div><p className="text-xs text-slate-400">Administración</p><p className="text-sm font-medium">${c.administration_fee.toLocaleString('es-CO')}</p></div>
          )}
          {c.ipc_rate != null && (
            <div><p className="text-xs text-slate-400">IPC aplicado</p><p className="text-sm font-medium">{c.ipc_rate}%</p></div>
          )}
        </div>

        {/* Termination notice */}
        {c.termination_notice_date && (
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
            <p className="text-sm font-medium text-amber-800 mb-1">Aviso de no renovación</p>
            <p className="text-sm text-amber-700">
              Notificado el {c.termination_notice_date}.
              {c.termination_reason === 'non_renewal_tenant' && (
                <> Fecha estimada de entrega: {new Date(new Date(c.termination_notice_date).getTime() + 90 * 86400000).toISOString().split('T')[0]}.</>
              )}
            </p>
          </div>
        )}

        {/* Notes */}
        {c.notes && (
          <div className="pt-4 border-t border-cream-dark">
            <p className="text-xs text-slate-400 mb-1">Observaciones</p>
            <p className="text-sm text-slate-600">{c.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create tenant payment calendar page**

```tsx
// src/app/(tenant)/tenant/pagos/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const PAYMENT_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-amber-100 text-amber-700' },
  paid:    { label: 'Pagado',    className: 'bg-green-100 text-green-700' },
  overdue: { label: 'Vencido',   className: 'bg-red-100 text-red-600' },
}

export default async function TenantPagosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!tenant) redirect('/tenant/dashboard')

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, monthly_rent, status')
    .eq('tenant_id', tenant.id)
    .in('status', ['active', 'ending', 'ended'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: payments } = contract
    ? await supabase
        .from('payments')
        .select('id, amount, due_date, paid_date, status, receipt_url, notes')
        .eq('contract_id', contract.id)
        .order('due_date')
    : { data: [] }

  // Generate signed URLs for receipts
  const paymentsWithUrls = await Promise.all(
    (payments ?? []).map(async (p) => {
      if (!p.receipt_url) return { ...p, signedUrl: null }
      const urlPath = p.receipt_url.split('/storage/v1/object/receipts/')[1]
      if (!urlPath) return { ...p, signedUrl: null }
      const { data } = await supabase.storage.from('receipts').createSignedUrl(urlPath, 3600)
      return { ...p, signedUrl: data?.signedUrl ?? null }
    })
  )

  const paid = paymentsWithUrls.filter(p => p.status === 'paid').length
  const pending = paymentsWithUrls.filter(p => p.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-navy-800">Mis pagos</h1>
        <div className="flex gap-4 text-sm text-slate-500">
          <span><strong className="text-green-600">{paid}</strong> pagados</span>
          <span><strong className="text-amber-600">{pending}</strong> pendientes</span>
        </div>
      </div>

      {paymentsWithUrls.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-slate-400">
          Sin pagos registrados.
        </div>
      ) : (
        <div className="space-y-2">
          {paymentsWithUrls.map((p) => {
            const badge = PAYMENT_BADGE[p.status] ?? { label: p.status, className: 'bg-slate-100 text-slate-600' }
            return (
              <div key={p.id} className="bg-white rounded-xl border px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{p.due_date}</p>
                  <p className="text-xs text-slate-400">${p.amount.toLocaleString('es-CO')}</p>
                  {p.paid_date && <p className="text-xs text-green-600 mt-0.5">Pagado el {p.paid_date}</p>}
                  {p.notes && <p className="text-xs text-slate-400 mt-0.5">{p.notes}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                  {p.signedUrl && (
                    <a
                      href={p.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-navy-600 hover:text-navy-800 font-medium underline underline-offset-2"
                    >
                      Ver comprobante
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npx tsc --noEmit 2>&1 | head -30`

- [ ] **Step 4: Commit**

```bash
git add src/app/(tenant)/tenant/contrato/page.tsx src/app/(tenant)/tenant/pagos/page.tsx
git commit -m "feat: add tenant contract detail and payment calendar pages with signed receipt URLs"
```
