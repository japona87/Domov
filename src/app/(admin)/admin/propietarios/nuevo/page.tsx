import Link from 'next/link'
import { OwnerForm } from '@/components/owners/owner-form'
import { createOwner } from '@/lib/actions/owners'

export const dynamic = 'force-dynamic'

export default function NuevoPropietarioPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          <Link href="/admin/propietarios" className="hover:underline">Propietarios</Link> / Nuevo
        </p>
        <h2 className="text-2xl font-sans font-semibold text-foreground">Nuevo propietario</h2>
      </div>
      <div className="bg-card rounded-xl border border-border p-6">
        <OwnerForm onSubmit={createOwner} />
      </div>
    </div>
  )
}
