'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addPropertyPhoto(propertyId: string, photoUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // If no photos yet, this one becomes the cover
  const { count } = await supabase
    .from('property_photos')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', propertyId)

  const { error } = await supabase.from('property_photos').insert({
    property_id: propertyId,
    photo_url: photoUrl,
    is_cover: (count ?? 0) === 0,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/propiedades/${propertyId}/fotos`)
  revalidatePath('/propiedades')
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

  await supabase.from('property_photos').update({ is_cover: false }).eq('property_id', propertyId)
  const { error } = await supabase.from('property_photos').update({ is_cover: true }).eq('id', photoId)
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/propiedades/${propertyId}/fotos`)
  revalidatePath('/propiedades')
}
