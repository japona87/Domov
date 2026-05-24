// src/lib/actions/properties.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Json, PropertyFeatures } from '@/types/database'
import { logAudit, diffFields } from '@/lib/audit'

const FEATURE_KEYS = ['bedrooms', 'bathrooms', 'area_sqm', 'parking_spots', 'floor', 'total_floors', 'estrato']

function extractFeatures(formData: FormData): PropertyFeatures {
  const features: PropertyFeatures = {}
  for (const key of FEATURE_KEYS) {
    const val = formData.get(key)
    if (val && String(val) !== '') features[key] = Number(val)
  }
  return features
}

export async function createProperty(formData: FormData) {
  const supabase = await createClient()
  const monthlyPrice = formData.get('monthly_price')
  const adminFee = formData.get('administration_fee')
  const insert = {
    name: String(formData.get('name')),
    address: String(formData.get('address')),
    type: String(formData.get('type')),
    description: formData.get('description') ? String(formData.get('description')) : null,
    features: extractFeatures(formData),
    monthly_price: monthlyPrice && String(monthlyPrice) !== '' ? Number(monthlyPrice) : null,
    administration_fee: adminFee && String(adminFee) !== '' ? Number(adminFee) : null,
    is_published: formData.get('is_published') === 'true',
  }
  const { data, error } = await supabase.from('properties').insert(insert).select('id').single()
  if (error) throw new Error(error.message)
  await logAudit({ action: 'create', entity: 'property', entityId: data.id, entityName: insert.name, changes: insert as unknown as Json })
  revalidatePath('/admin/propiedades')
  redirect(`/admin/propiedades/${data.id}/fotos`)
}

export async function updateProperty(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: before } = await supabase.from('properties').select('name, address, type, description, features, monthly_price, administration_fee, is_published').eq('id', id).single()
  const monthlyPrice = formData.get('monthly_price')
  const adminFee = formData.get('administration_fee')
  const update = {
    name: String(formData.get('name')),
    address: String(formData.get('address')),
    type: String(formData.get('type')),
    description: formData.get('description') ? String(formData.get('description')) : null,
    features: extractFeatures(formData),
    monthly_price: monthlyPrice && String(monthlyPrice) !== '' ? Number(monthlyPrice) : null,
    administration_fee: adminFee && String(adminFee) !== '' ? Number(adminFee) : null,
    is_published: formData.get('is_published') === 'true',
  }
  const { error } = await supabase.from('properties').update(update).eq('id', id)
  if (error) throw new Error(error.message)
  if (before) {
    const changes = diffFields(before, update, ['name', 'address', 'type', 'description', 'features', 'monthly_price', 'administration_fee', 'is_published'])
    if (Object.keys(changes).length > 0) {
      await logAudit({ action: 'update', entity: 'property', entityId: id, entityName: update.name, changes: changes as unknown as Json })
    }
  }
  revalidatePath('/admin/propiedades')
  revalidatePath(`/admin/propiedades/${id}`)
  revalidatePath('/propiedades')
}

export async function deleteProperty(prevState: { error?: string } | undefined, id: string) {
  const supabase = await createClient()
  const { data: before } = await supabase.from('properties').select('name').eq('id', id).single()
  const { data: activeContracts } = await supabase
    .from('contracts')
    .select('id, status')
    .eq('property_id', id)
    .in('status', ['active', 'ending'])
    .limit(1)
  if (activeContracts && activeContracts.length > 0) {
    return { error: 'No se puede eliminar la propiedad porque tiene contratos activos. Finalice los contratos primero.' }
  }
  const { data: endedContracts } = await supabase
    .from('contracts')
    .select('id')
    .eq('property_id', id)
  if (endedContracts && endedContracts.length > 0) {
    for (const c of endedContracts) {
      await supabase.from('payments').delete().eq('contract_id', c.id)
      await supabase.from('documents').delete().eq('contract_id', c.id)
      await supabase.from('insurance_policies').delete().eq('contract_id', c.id)
    }
    await supabase.from('contracts').delete().eq('property_id', id)
  }
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAudit({ action: 'delete', entity: 'property', entityId: id, entityName: before?.name })
  revalidatePath('/admin/propiedades')
  redirect('/admin/propiedades')
}

export async function togglePublished(id: string, isPublished: boolean) {
  const supabase = await createClient()
  const { data: before } = await supabase.from('properties').select('name, is_published').eq('id', id).single()
  const { error } = await supabase.from('properties')
    .update({ is_published: isPublished })
    .eq('id', id)
  if (error) throw new Error(error.message)
  await logAudit({ action: 'update', entity: 'property', entityId: id, entityName: before?.name ?? null, changes: { is_published: { old: (before?.is_published ?? null) as Json, new: isPublished as Json } } as unknown as Json })
  revalidatePath('/admin/propiedades')
  revalidatePath('/propiedades')
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
