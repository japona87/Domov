// src/app/(admin)/admin/propiedades/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { PropertyForm } from '@/components/properties/property-form'
import { OwnersManager } from '@/components/properties/owners-manager'
import { updateProperty } from '@/lib/actions/properties'
import { getFeatureConfigs } from '@/lib/actions/config'

export const dynamic = 'force-dynamic'

export default async function EditarPropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [propertyResult, featureConfigs] = await Promise.all([
    supabase.from('properties').select('*').eq('id', id).single(),
    getFeatureConfigs(),
  ])

  const { data: property } = propertyResult
  if (!property) notFound()

  const { data: propertyOwners } = await supabase
    .from('property_owners')
    .select('id, ownership_pct, owners(id, full_name, document_number, phone, email)')
    .eq('property_id', id)

  const updateWithId = updateProperty.bind(null, id)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            <Link href="/admin/propiedades" className="hover:underline">Propiedades</Link> / Editar
          </p>
          <h2 className="text-2xl font-sans font-semibold text-foreground">{property.name}</h2>
          <p className="text-muted-foreground">{property.address}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/propiedades/${id}/fotos`}>Fotos</Link>
          </Button>
        </div>
      </div>

      <PropertyForm
        property={property}
        onSubmit={updateWithId}
        featureConfigs={featureConfigs as Array<{
          id: string; property_type: string; field_key: string; field_label: string
          placeholder: string; field_type: string; sort_order: number; is_active: boolean
        }>}
      />

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Propietarios</h3>
        <OwnersManager
          propertyId={id}
          owners={(propertyOwners ?? []) as {
            id: string
            ownership_pct: number
            owners: { id: string; full_name: string; document_number: string | null; phone: string | null; email: string | null } | null
          }[]}
        />
      </div>
    </div>
  )
}
