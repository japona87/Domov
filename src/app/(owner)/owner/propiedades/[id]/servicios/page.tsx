// src/app/(owner)/owner/propiedades/[id]/servicios/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { getServicesForProperty } from '@/lib/actions/services'
import { OwnerServicesView } from '@/components/owner/owner-services-view'

export const dynamic = 'force-dynamic'

export default async function OwnerServiciosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: property } = await supabase.from('properties').select('id').eq('id', id).single()
  if (!property) notFound()

  const services = await getServicesForProperty(id)

  return <OwnerServicesView services={services} />
}
