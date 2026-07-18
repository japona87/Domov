import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PropertyTabs } from '@/components/admin/property-tabs'

export default async function AdminPropertyLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: property } = await supabase.from('properties').select('name, address').eq('id', id).single()
  if (!property) notFound()

  const baseUrl = `/admin/propiedades/${id}`

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-sans font-semibold text-foreground">{property.name}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{property.address}</p>
      </div>
      <PropertyTabs baseUrl={baseUrl} role="admin" />
      {children}
    </div>
  )
}
