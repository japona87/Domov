'use server'

import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { SERVICE_TYPES, SERVICE_TYPE_LABELS } from '@/lib/services-shared'
import type { PropertyServiceRow } from '@/lib/services-shared'

function sanitizeType(t: string) { return SERVICE_TYPES.includes(t as never) ? t : 'other' }

export async function addService(propertyId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const serviceType = sanitizeType(formData.get('service_type') as string)
  const accountNumber = (formData.get('account_number') as string)?.trim()
  if (!accountNumber) throw new Error('Número de cuenta requerido')

  const { data, error } = await supabase.from('property_services').insert({
    property_id: propertyId,
    service_type: serviceType,
    account_number: accountNumber,
    contract_number: (formData.get('contract_number') as string)?.trim() || null,
    provider_name: (formData.get('provider_name') as string)?.trim() || null,
    client_number: (formData.get('client_number') as string)?.trim() || null,
  }).select('id, service_type').single()

  if (error) throw new Error(error.message)

  await logAudit({
    action: 'create', entity: 'property_service', entityId: data.id,
    entityName: `${SERVICE_TYPE_LABELS[serviceType] ?? serviceType} — ${propertyId}`,
  })

  revalidatePath(`/admin/propiedades/${propertyId}/servicios`)
  revalidatePath(`/owner/propiedades/${propertyId}/servicios`)

  return data
}

export async function updateService(serviceId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const updates: Record<string, string | null> = {
    service_type: sanitizeType(formData.get('service_type') as string),
    account_number: (formData.get('account_number') as string)?.trim(),
    contract_number: (formData.get('contract_number') as string)?.trim() || null,
    provider_name: (formData.get('provider_name') as string)?.trim() || null,
    client_number: (formData.get('client_number') as string)?.trim() || null,
  }

  const { data, error } = await supabase.from('property_services').update(updates as never).eq('id', serviceId).select('property_id').single()
  if (error) throw new Error(error.message)

  await logAudit({
    action: 'update', entity: 'property_service', entityId: serviceId,
  })

  revalidatePath(`/admin/propiedades/${data.property_id}/servicios`)
  revalidatePath(`/owner/propiedades/${data.property_id}/servicios`)
}

export async function deleteService(serviceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: svc } = await supabase.from('property_services').select('property_id, file_url').eq('id', serviceId).single()
  if (!svc) throw new Error('No encontrado')

  if (svc.file_url) {
    const path = extractStoragePath(svc.file_url)
    if (path) await supabase.storage.from('service-files').remove([path])
  }

  await supabase.from('property_services').delete().eq('id', serviceId)

  await logAudit({
    action: 'delete', entity: 'property_service', entityId: serviceId,
  })

  revalidatePath(`/admin/propiedades/${svc.property_id}/servicios`)
  revalidatePath(`/owner/propiedades/${svc.property_id}/servicios`)
}

export async function setServiceFileUrl(serviceId: string, propertyId: string, publicUrl: string, fileName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('property_services')
    .update({ file_url: publicUrl, file_name: fileName })
    .eq('id', serviceId)
  if (error) throw new Error(error.message)

  await logAudit({
    action: 'update', entity: 'property_service', entityId: serviceId,
  })

  revalidatePath(`/admin/propiedades/${propertyId}/servicios`)
  revalidatePath(`/owner/propiedades/${propertyId}/servicios`)
}

export async function deleteServiceFile(serviceId: string, propertyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: svc } = await supabase.from('property_services').select('file_url').eq('id', serviceId).single()
  if (!svc?.file_url) return

  const path = extractStoragePath(svc.file_url)
  if (path) await supabase.storage.from('service-files').remove([path])

  await supabase.from('property_services').update({ file_url: null, file_name: null }).eq('id', serviceId)

  await logAudit({
    action: 'update', entity: 'property_service', entityId: serviceId,
  })

  revalidatePath(`/admin/propiedades/${propertyId}/servicios`)
  revalidatePath(`/owner/propiedades/${propertyId}/servicios`)
}

export async function getServicesForProperty(propertyId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('property_services')
    .select('*')
    .eq('property_id', propertyId)
    .order('service_type') as { data: PropertyServiceRow[] | null }
  return data ?? []
}

function extractStoragePath(url: string): string {
  const marker = '/storage/v1/object/public/service-files/'
  const idx = url.indexOf(marker)
  return idx !== -1 ? url.slice(idx + marker.length) : ''
}
