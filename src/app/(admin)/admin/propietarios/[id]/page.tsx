import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { OwnerForm } from '@/components/owners/owner-form'
import { updateOwner } from '@/lib/actions/owners'
import { OwnerOnboardingButton, OwnerPasswordManager } from '@/components/owners/owner-onboarding'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

type PropertyOwnerLink = {
  id: string
  ownership_pct: number
  properties: { id: string; name: string; address: string; type: string } | null
}

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartamento',
  house: 'Casa',
  office: 'Oficina',
  local: 'Local',
  garage: 'Garaje',
  other: 'Inmueble',
}

export default async function EditarPropietarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: owner } = await supabase
    .from('owners')
    .select('*')
    .eq('id', id)
    .single()

  if (!owner) notFound()

  const { data: properties } = await supabase
    .from('property_owners')
    .select('id, ownership_pct, properties!inner(id, name, address, type)')
    .eq('owner_id', id) as { data: PropertyOwnerLink[] | null }

  const updateWithId = updateOwner.bind(null, id)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/propietarios" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Volver al listado
        </Link>
        <h2 className="text-2xl font-sans font-semibold text-foreground">{owner.full_name}</h2>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <OwnerForm owner={owner} onSubmit={updateWithId} cancelHref="/admin/propietarios" />

        <hr className="border-border" />

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Acceso al portal</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {owner.user_id
                ? 'El propietario ya tiene acceso al portal.'
                : 'El propietario aún no tiene acceso. Envíale un onboarding.'}
            </p>
          </div>
          <OwnerOnboardingButton ownerId={owner.id} hasAccess={!!owner.user_id} />
        </div>

        <OwnerPasswordManager ownerId={owner.id} hasAccess={!!owner.user_id} />
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Propiedades asociadas</h3>
        {properties && properties.length > 0 ? (
          <div className="space-y-2">
            {properties.map((po) => {
              const prop = po.properties
              if (!prop) return null
              return (
                <div key={po.id} className="flex items-center justify-between bg-muted/50 rounded-md px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">{prop.name}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{(TYPE_LABELS[prop.type] ?? prop.type)}</span>
                      <span>{prop.address}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{po.ownership_pct}%</Badge>
                    <Link
                      href={`/admin/propiedades/${prop.id}`}
                      className="text-accent hover:text-accent/80 text-sm font-medium"
                    >
                      Ir a propiedad
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No está asociado a ninguna propiedad.</p>
        )}
      </div>
    </div>
  )
}
