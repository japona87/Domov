import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ContractForm } from '@/components/contracts/contract-form'
import { createContract } from '@/lib/actions/contracts'

export const dynamic = 'force-dynamic'

export default async function NuevoContratoPage() {
  const supabase = await createClient()

  const [{ data: properties }, { data: tenants }] = await Promise.all([
    supabase.from('properties').select('id, name, address').order('name') as unknown as { data: Array<{id: string; name: string; address: string}> | null },
    supabase.from('tenants').select('id, full_name, document_number').order('full_name') as unknown as { data: Array<{id: string; full_name: string; document_number: string | null}> | null },
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
