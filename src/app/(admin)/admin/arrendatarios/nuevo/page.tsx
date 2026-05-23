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
