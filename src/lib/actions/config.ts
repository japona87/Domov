'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSystemConfig() {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()
  const { data, error } = await supabase
    .from('system_config')
    .select('*')
    .eq('year', currentYear)
    .single()
  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  return data
}

export async function updateSystemConfig(formData: FormData) {
  const supabase = await createClient()

  // Verify session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('No autorizado')

  const currentYear = new Date().getFullYear()

  const values = {
    year: currentYear,
    ipc_rate: formData.get('ipc_rate') ? Number(formData.get('ipc_rate')) : null,
    min_wage_increase: formData.get('min_wage_increase') ? Number(formData.get('min_wage_increase')) : null,
    renewal_notice_days: formData.get('renewal_notice_days') ? Number(formData.get('renewal_notice_days')) : 120,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('system_config')
    .upsert(values, { onConflict: 'year' })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/configuracion')
}
