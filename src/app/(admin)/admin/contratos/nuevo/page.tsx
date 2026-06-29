import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ContractForm } from '@/components/contracts/contract-form'
import { createContract } from '@/lib/actions/contracts'

export const dynamic = 'force-dynamic'

export default async function NuevoContratoPage() {
  const supabase = await createClient()

  const [{ data: properties }, { data: tenants }, childrenResult] = await Promise.all([
    supabase.from('properties').select('id, name, address').order('name') as unknown as { data: Array<{id: string; name: string; address: string}> | null },
    supabase.from('tenants').select('id, full_name, document_number').order('full_name') as unknown as { data: Array<{id: string; full_name: string; document_number: string | null}> | null },
    supabase.from('properties').select('id, name, parent_property_id').not('parent_property_id', 'is', null) as unknown as { data: Array<{id: string; name: string; parent_property_id: string}> | null },
  ])

  const propertyOptions = (properties ?? []).map((p) => ({
    id: p.id,
    label: `${p.name} — ${p.address}`,
  }))

  const childrenByParent = new Map<string, { id: string; name: string }[]>()
  for (const child of childrenResult.data ?? []) {
    const list = childrenByParent.get(child.parent_property_id) ?? []
    list.push({ id: child.id, name: child.name })
    childrenByParent.set(child.parent_property_id, list)
  }

  const childrenMap = Object.fromEntries(childrenByParent)

  const tenantOptions = (tenants ?? []).map((t) => ({
    id: t.id,
    label: t.document_number
      ? `${t.full_name} (CC ${t.document_number})`
      : t.full_name,
  }))

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/contratos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Volver al listado
        </Link>
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
          cancelHref="/admin/contratos"
          childrenMap={childrenMap}
        />
      </div>
    </div>
  )
}
