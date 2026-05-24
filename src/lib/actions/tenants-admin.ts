'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function inviteTenant(tenantId: string, email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('No autorizado')

  const adminClient = createAdminClient()

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/tenant/dashboard`,
  })
  if (inviteError) {
    if (inviteError.message.toLowerCase().includes('already registered')) {
      throw new Error('Este email ya tiene una cuenta activa en el sistema.')
    }
    throw new Error(inviteError.message)
  }

  const { error: updateError } = await adminClient
    .from('tenants')
    .update({ user_id: inviteData.user.id })
    .eq('id', tenantId)
  if (updateError) throw new Error(updateError.message)

  const { error: profileError } = await adminClient.from('profiles').upsert(
    { id: inviteData.user.id, role: 'tenant' },
    { onConflict: 'id' }
  )
  if (profileError) throw new Error(profileError.message)

  revalidatePath(`/admin/arrendatarios/${tenantId}`)
}
