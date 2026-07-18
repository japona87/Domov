// src/app/(admin)/admin/propiedades/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PropertyForm } from '@/components/properties/property-form'
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

  const [propertyResult, featureConfigs, parentsResult] = await Promise.all([
    supabase.from('properties').select('*').eq('id', id).single(),
    getFeatureConfigs(),
    supabase.from('properties').select('id, name, address').is('parent_property_id', null).neq('type', 'garage').neq('id', id).order('name') as unknown as { data: Array<{id: string; name: string; address: string}> | null },
  ])

  const { data: property } = propertyResult
  if (!property) notFound()

  const parentOptions = (parentsResult.data ?? []).map((p) => ({
    id: p.id,
    label: `${p.name} — ${p.address}`,
  }))

  const updateWithId = updateProperty.bind(null, id)

  return (
    <PropertyForm
      property={property}
      onSubmit={updateWithId}
      featureConfigs={featureConfigs as Array<{
        id: string; property_type: string; field_key: string; field_label: string
        placeholder: string; field_type: string; sort_order: number; is_active: boolean
      }>}
      parentOptions={parentOptions}
      cancelHref="/admin/propiedades"
      fotosHref={`/admin/propiedades/${id}/fotos`}
    />
  )
}
