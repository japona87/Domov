// src/app/(owner)/owner/propiedades/[id]/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PropertyTabs } from '@/components/admin/property-tabs'

export default async function OwnerPropertyLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: property } = await supabase.from('properties').select('name, address').eq('id', id).single()
  if (!property) notFound()

  const baseUrl = `/owner/propiedades/${id}`

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-sans font-semibold text-foreground">{property.name}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{property.address}</p>
      </div>
      <PropertyTabs baseUrl={baseUrl} role="owner" />
      {children}
    </div>
  )
}
