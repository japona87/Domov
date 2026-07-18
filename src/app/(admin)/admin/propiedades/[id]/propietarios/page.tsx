// src/app/(admin)/admin/propiedades/[id]/propietarios/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OwnersManager } from '@/components/properties/owners-manager'

export const dynamic = 'force-dynamic'

export default async function PropietariosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: property } = await supabase.from('properties').select('id').eq('id', id).single()
  if (!property) notFound()

  const { data: propertyOwners } = await supabase
    .from('property_owners')
    .select('id, ownership_pct, owners(id, full_name, document_number, phone, email)')
    .eq('property_id', id)

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <OwnersManager
        propertyId={id}
        owners={(propertyOwners ?? []) as {
          id: string
          ownership_pct: number
          owners: { id: string; full_name: string; document_number: string | null; phone: string | null; email: string | null } | null
        }[]}
      />
    </div>
  )
}
