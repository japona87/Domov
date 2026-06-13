'use server'

import type { Json } from '@/types/database'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit'

export async function getSystemConfig() {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()
  const { data, error } = await supabase
    .from('system_config')
    .select('*')
    .eq('year', currentYear)
    .single() as unknown as { data: {
      renewal_notice_days: number
      audit_retention_days: number
      storage_limit_gb: number
    } | null; error: any }
  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  return data
}

export async function updateSystemConfig(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('No autorizado')

  const currentYear = new Date().getFullYear()

  const auditDays = formData.get('audit_retention_days')
  const hasAuditDays = auditDays && String(auditDays) !== ''

  const storageLimit = formData.get('storage_limit_gb')
  const hasStorageLimit = storageLimit && String(storageLimit) !== ''

  const values = {
    year: currentYear,
    renewal_notice_days: formData.get('renewal_notice_days') ? Number(formData.get('renewal_notice_days')) : 120,
    ...(hasAuditDays ? { audit_retention_days: Number(auditDays) } : {}),
    ...(hasStorageLimit ? { storage_limit_gb: Number(storageLimit) } : {}),
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('system_config').upsert(values, { onConflict: 'year' })
  if (error) throw new Error(error.message)
  await logAudit({ action: 'update', entity: 'system_config', entityId: String(currentYear), entityName: `Configuración ${currentYear}`, changes: values as unknown as Json })
  revalidatePath('/admin/configuracion')
}

export async function cleanupAuditLogs() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('No autorizado')

  const currentYear = new Date().getFullYear()
  const { data: config } = await supabase
    .from('system_config')
    .select('audit_retention_days')
    .eq('year', currentYear)
    .single()

  const retentionDays = config?.audit_retention_days ?? 90
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - retentionDays)

  const { error } = await supabase
    .from('audit_logs')
    .delete()
    .lt('created_at', cutoff.toISOString())

  if (error) throw new Error(error.message)
  revalidatePath('/admin/auditoria')
}

// ---- Feature configs ----

export async function getFeatureConfigs() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('property_feature_configs')
    .select('*')
    .order('property_type')
    .order('sort_order')
  return data ?? []
}

export async function getFeatureConfigsByType(propertyType: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('property_feature_configs')
    .select('*')
    .eq('property_type', propertyType)
    .eq('is_active', true)
    .order('sort_order')
  return data ?? []
}

export async function updateFeatureConfig(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const values = {
    field_label: String(formData.get('field_label')),
    placeholder: String(formData.get('placeholder')),
    field_type: String(formData.get('field_type')),
    sort_order: Number(formData.get('sort_order')),
    is_active: formData.get('is_active') === 'true',
  }

  const { error } = await supabase
    .from('property_feature_configs')
    .update(values)
    .eq('id', id)
  if (error) throw new Error(error.message)
  await logAudit({ action: 'update', entity: 'feature_config', entityId: id, entityName: values.field_label, changes: values as unknown as Json })
  revalidatePath('/admin/configuracion')
}

export async function createFeatureConfig(formData: FormData) {
  const supabase = await createClient()
  const values = {
    property_type: String(formData.get('property_type')),
    field_key: String(formData.get('field_key')),
    field_label: String(formData.get('field_label')),
    placeholder: String(formData.get('placeholder')) || '',
    field_type: String(formData.get('field_type')) || 'number',
    sort_order: Number(formData.get('sort_order')) || 0,
    is_active: true,
  }

  const { error } = await supabase.from('property_feature_configs').insert(values)
  if (error) throw new Error(error.message)
  await logAudit({ action: 'create', entity: 'feature_config', entityId: values.field_key, entityName: values.field_label })
  revalidatePath('/admin/configuracion')
}

export async function deleteFeatureConfig(id: string) {
  const supabase = await createClient()
  const { data: before } = await supabase.from('property_feature_configs').select('field_label').eq('id', id).single()
  const { error } = await supabase.from('property_feature_configs').delete().eq('id', id)
  if (error) throw new Error(error.message)
  await logAudit({ action: 'delete', entity: 'feature_config', entityId: id, entityName: before?.field_label })
  revalidatePath('/admin/configuracion')
}
