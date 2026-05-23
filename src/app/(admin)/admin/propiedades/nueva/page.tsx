// src/app/(admin)/admin/propiedades/nueva/page.tsx
import { createProperty } from '@/lib/actions/properties'
import { PropertyForm } from '@/components/properties/property-form'

export default function NuevaPropiedadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Nuevo inmueble</h2>
        <p className="text-slate-500">Completa la información del inmueble</p>
      </div>
      <PropertyForm onSubmit={createProperty} />
    </div>
  )
}
