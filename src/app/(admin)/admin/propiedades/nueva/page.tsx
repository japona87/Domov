// src/app/(admin)/admin/propiedades/nueva/page.tsx
import { createProperty } from '@/lib/actions/properties'
import { getFeatureConfigs } from '@/lib/actions/config'
import { PropertyForm } from '@/components/properties/property-form'

export default async function NuevaPropiedadPage() {
  const featureConfigs = await getFeatureConfigs()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-sans font-semibold text-foreground">Nuevo inmueble</h2>
        <p className="text-muted-foreground">Completa la información del inmueble</p>
      </div>
      <PropertyForm onSubmit={createProperty} featureConfigs={featureConfigs as Array<{
        id: string; property_type: string; field_key: string; field_label: string
        placeholder: string; field_type: string; sort_order: number; is_active: boolean
      }>} />
    </div>
  )
}
