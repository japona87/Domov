'use server'

import type { Json } from '@/types/database'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit'

export async function linkOwnerToProperty(propertyId: string, ownerId: string, ownershipPct: number) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('property_owners').insert({
    property_id: propertyId,
    owner_id: ownerId,
    ownership_pct: ownershipPct,
  }).select('id').single()
  if (error) return { error: error.message }
  await logAudit({ action: 'create', entity: 'property_owner', entityId: data.id, entityName: `propiedad ${propertyId} ↔ propietario ${ownerId}`, changes: { property_id: { old: null, new: propertyId }, owner_id: { old: null, new: ownerId }, ownership_pct: { old: null, new: ownershipPct } } as unknown as Json })
  revalidatePath(`/admin/propiedades/${propertyId}`)
  revalidatePath('/admin/propiedades')
}

export async function unlinkOwnerFromProperty(propertyOwnerId: string, propertyId: string) {
  const supabase = await createClient()
  const { data: before } = await supabase.from('property_owners').select('owner_id, ownership_pct').eq('id', propertyOwnerId).single()
  const { error } = await supabase.from('property_owners').delete().eq('id', propertyOwnerId)
  if (error) return { error: error.message }
  await logAudit({ action: 'delete', entity: 'property_owner', entityId: propertyOwnerId, entityName: `propiedad ${propertyId} ↔ propietario ${before?.owner_id ?? ''}`, changes: { ownership_pct: { old: (before?.ownership_pct ?? null) as Json, new: null } } as unknown as Json })
  revalidatePath(`/admin/propiedades/${propertyId}`)
  revalidatePath('/admin/propiedades')
}

export async function updateOwnershipPct(propertyOwnerId: string, propertyId: string, ownershipPct: number) {
  const supabase = await createClient()
  const { data: before } = await supabase.from('property_owners').select('ownership_pct').eq('id', propertyOwnerId).single()
  const { error } = await supabase.from('property_owners').update({ ownership_pct: ownershipPct }).eq('id', propertyOwnerId)
  if (error) return { error: error.message }
  await logAudit({ action: 'update', entity: 'property_owner', entityId: propertyOwnerId, entityName: `propiedad ${propertyId}`, changes: { ownership_pct: { old: (before?.ownership_pct ?? null) as Json, new: ownershipPct as Json } } as unknown as Json })
  revalidatePath(`/admin/propiedades/${propertyId}`)
  revalidatePath('/admin/propiedades')
}
