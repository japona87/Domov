'use server'

import type { Json } from '@/types/database'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit'

export async function addPropertyPhoto(propertyId: string, photoUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // If no photos yet, this one becomes the cover
  const { count } = await supabase
    .from('property_photos')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', propertyId)

  const isCover = (count ?? 0) === 0
  const { data, error } = await supabase.from('property_photos').insert({
    property_id: propertyId,
    photo_url: photoUrl,
    is_cover: isCover,
  }).select('id, is_cover').single()
  if (error) throw new Error(error.message)
  await logAudit({ action: 'create', entity: 'property_photo', entityId: data.id, entityName: propertyId, changes: { photo_url: photoUrl, is_cover: isCover } as unknown as Json })
  revalidatePath(`/admin/propiedades/${propertyId}/fotos`)
  revalidatePath('/propiedades')
  return { id: data.id, is_cover: data.is_cover }
}

export async function deletePropertyPhoto(photoId: string, storagePath: string, propertyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: photo } = await supabase
    .from('property_photos')
    .select('is_cover')
    .eq('id', photoId)
    .single()

  await supabase.storage.from('property-photos').remove([storagePath])

  const { error } = await supabase.from('property_photos').delete().eq('id', photoId)
  if (error) throw new Error(error.message)
  await logAudit({ action: 'delete', entity: 'property_photo', entityId: photoId, entityName: propertyId })

  // If we deleted the cover, promote the next photo
  if (photo?.is_cover) {
    const { data: next } = await supabase
      .from('property_photos')
      .select('id')
      .eq('property_id', propertyId)
      .order('sort_order')
      .limit(1)
      .single()
    if (next) {
      await supabase.from('property_photos').update({ is_cover: true }).eq('id', next.id)
    }
  }

  revalidatePath(`/admin/propiedades/${propertyId}/fotos`)
  revalidatePath('/propiedades')
}

export async function setCoverPhoto(propertyId: string, photoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('set_cover_photo', { p_property_id: propertyId, p_photo_id: photoId })
  if (error) throw new Error(error.message)
  await logAudit({ action: 'update', entity: 'property_photo', entityId: photoId, entityName: propertyId, changes: { is_cover: { old: false, new: true } } as unknown as Json })

  revalidatePath(`/admin/propiedades/${propertyId}/fotos`)
  revalidatePath('/propiedades')
}
