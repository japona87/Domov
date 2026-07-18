// src/app/(admin)/admin/propiedades/[id]/servicios/page.tsx
import { createClient } from '@/lib/supabase/server'
import { ServicesManager } from '@/components/properties/services-manager'
import { getServicesForProperty } from '@/lib/actions/services'

export const dynamic = 'force-dynamic'

export default async function ServiciosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const services = await getServicesForProperty(id)

  return (
    <ServicesManager services={services} propertyId={id} />
  )
}
