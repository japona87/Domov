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
