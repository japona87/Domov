// src/app/(admin)/admin/propiedades/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { PropertyForm } from '@/components/properties/property-form'
import { OwnersManager } from '@/components/properties/owners-manager'
import { updateProperty, deleteProperty } from '@/lib/actions/properties'

export const dynamic = 'force-dynamic'

export default async function EditarPropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

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
          <p className="text-sm text-slate-500 mb-1">
            <Link href="/admin/propiedades" className="hover:underline">Propiedades</Link> / Editar
          </p>
          <h2 className="text-2xl font-bold text-slate-800">{property.name}</h2>
          <p className="text-slate-500">{property.address}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/propiedades/${id}/fotos`}>Fotos</Link>
          </Button>
          <form action={deleteProperty.bind(null, id)}>
            <Button variant="destructive" size="sm" type="submit">
              Eliminar
            </Button>
          </form>
        </div>
      </div>

      <PropertyForm property={property} onSubmit={updateWithId} />

      <div className="bg-white rounded-lg border p-6 space-y-4 max-w-2xl">
        <h3 className="font-semibold text-slate-800">Propietarios</h3>
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
