// src/lib/actions/properties.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { PropertyFeatures } from '@/types/database'

function extractFeatures(formData: FormData): PropertyFeatures {
  const features: PropertyFeatures = {}
  const bedrooms = formData.get('bedrooms')
  const bathrooms = formData.get('bathrooms')
  const area_sqm = formData.get('area_sqm')
  const parking_spots = formData.get('parking_spots')
  const floor = formData.get('floor')
  if (bedrooms && String(bedrooms) !== '') features.bedrooms = Number(bedrooms)
  if (bathrooms && String(bathrooms) !== '') features.bathrooms = Number(bathrooms)
  if (area_sqm && String(area_sqm) !== '') features.area_sqm = Number(area_sqm)
  if (parking_spots && String(parking_spots) !== '') features.parking_spots = Number(parking_spots)
  if (floor && String(floor) !== '') features.floor = Number(floor)
  return features
}

export async function createProperty(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('properties').insert({
    name: String(formData.get('name')),
    address: String(formData.get('address')),
    type: String(formData.get('type')),
    description: formData.get('description') ? String(formData.get('description')) : null,
    features: extractFeatures(formData),
    is_published: formData.get('is_published') === 'true',
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/propiedades')
  redirect('/admin/propiedades')
}

export async function updateProperty(id: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('properties').update({
    name: String(formData.get('name')),
    address: String(formData.get('address')),
    type: String(formData.get('type')),
    description: formData.get('description') ? String(formData.get('description')) : null,
    features: extractFeatures(formData),
    is_published: formData.get('is_published') === 'true',
  }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/propiedades')
  revalidatePath(`/admin/propiedades/${id}`)
  revalidatePath('/propiedades')
}

export async function deleteProperty(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/propiedades')
  redirect('/admin/propiedades')
}

export async function togglePublished(id: string, isPublished: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('properties')
    .update({ is_published: isPublished })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/propiedades')
  revalidatePath('/propiedades')
}

export async function addPropertyOwner(
  propertyId: string,
  fullName: string,
  documentNumber: string,
  phone: string,
  email: string,
  ownershipPct: number
) {
  const supabase = await createClient()
  let ownerId: string

  const { data: existing } = await supabase
    .from('owners')
    .select('id')
    .eq('document_number', documentNumber)
    .single()

  if (existing) {
    ownerId = existing.id
  } else {
    const { data: newOwner, error } = await supabase
      .from('owners')
      .insert({ full_name: fullName, document_number: documentNumber || null, phone: phone || null, email: email || null })
      .select('id')
      .single()
    if (error || !newOwner) throw new Error(error?.message ?? 'Error creando propietario')
    ownerId = newOwner.id
  }

  const { error } = await supabase.from('property_owners').insert({
    property_id: propertyId,
    owner_id: ownerId,
    ownership_pct: ownershipPct,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/propiedades/${propertyId}`)
}

export async function removePropertyOwner(propertyOwnerId: string, propertyId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('property_owners').delete().eq('id', propertyOwnerId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/propiedades/${propertyId}`)
}

export async function updateOwner(
  ownerId: string,
  propertyOwnerId: string,
  propertyId: string,
  fullName: string,
  documentNumber: string,
  phone: string,
  email: string,
  ownershipPct: number
) {
  const supabase = await createClient()
  const { error: ownerError } = await supabase
    .from('owners')
    .update({
      full_name: fullName,
      document_number: documentNumber || null,
      phone: phone || null,
      email: email || null,
    })
    .eq('id', ownerId)
  if (ownerError) throw new Error(ownerError.message)
  const { error: pctError } = await supabase
    .from('property_owners')
    .update({ ownership_pct: ownershipPct })
    .eq('id', propertyOwnerId)
  if (pctError) throw new Error(pctError.message)
  revalidatePath(`/admin/propiedades/${propertyId}`)
}

export async function addPropertyPhoto(propertyId: string, photoUrl: string, isCover: boolean) {
  const supabase = await createClient()
  if (isCover) {
    await supabase.from('property_photos')
      .update({ is_cover: false })
      .eq('property_id', propertyId)
  }
  const { error } = await supabase.from('property_photos').insert({
    property_id: propertyId,
    photo_url: photoUrl,
    is_cover: isCover,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/propiedades/${propertyId}/fotos`)
  revalidatePath('/propiedades')
}

export async function deletePropertyPhoto(photoId: string, photoPath: string, propertyId: string) {
  const supabase = await createClient()
  const { error: storageError } = await supabase.storage.from('property-photos').remove([photoPath])
  if (storageError) throw new Error(storageError.message)
  const { error } = await supabase.from('property_photos').delete().eq('id', photoId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/propiedades/${propertyId}/fotos`)
  revalidatePath('/propiedades')
}

export async function setCoverPhoto(photoId: string, propertyId: string) {
  const supabase = await createClient()
  await supabase.from('property_photos')
    .update({ is_cover: false })
    .eq('property_id', propertyId)
  const { error } = await supabase.from('property_photos')
    .update({ is_cover: true })
    .eq('id', photoId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/propiedades/${propertyId}/fotos`)
  revalidatePath('/propiedades')
}
