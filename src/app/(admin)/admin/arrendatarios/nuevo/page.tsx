import Link from 'next/link'
import { TenantForm } from '@/components/tenants/tenant-form'
import { createTenant } from '@/lib/actions/contracts'

export const dynamic = 'force-dynamic'

export default function NuevoArrendatarioPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/arrendatarios" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Volver al listado
        </Link>
        <h2 className="text-2xl font-sans font-semibold text-foreground">Nuevo arrendatario</h2>
      </div>
      <div className="bg-card rounded-xl border border-border p-6">
        <TenantForm onSubmit={createTenant} cancelHref="/admin/arrendatarios" />
      </div>
    </div>
  )
}
