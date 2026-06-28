// src/app/(admin)/admin/propiedades/nueva/page.tsx
import Link from 'next/link'
import { createProperty } from '@/lib/actions/properties'
import { getFeatureConfigs } from '@/lib/actions/config'
import { PropertyForm } from '@/components/properties/property-form'

export default async function NuevaPropiedadPage() {
  const featureConfigs = await getFeatureConfigs()

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/propiedades" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Volver al listado
        </Link>
        <h2 className="text-2xl font-sans font-semibold text-foreground">Nuevo inmueble</h2>
        <p className="text-muted-foreground">Completa la información del inmueble</p>
      </div>
      <PropertyForm onSubmit={createProperty} featureConfigs={featureConfigs as Array<{
        id: string; property_type: string; field_key: string; field_label: string
        placeholder: string; field_type: string; sort_order: number; is_active: boolean
      }>} cancelHref="/admin/propiedades" />
    </div>
  )
}
