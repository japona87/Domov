import Link from 'next/link'
import { OwnerForm } from '@/components/owners/owner-form'
import { createOwner } from '@/lib/actions/owners'

export const dynamic = 'force-dynamic'

export default function NuevoPropietarioPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/propietarios" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Volver al listado
        </Link>
        <h2 className="text-2xl font-sans font-semibold text-foreground">Nuevo propietario</h2>
      </div>
      <div className="bg-card rounded-xl border border-border p-6">
        <OwnerForm onSubmit={createOwner} cancelHref="/admin/propietarios" />
      </div>
    </div>
  )
}
