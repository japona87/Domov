'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/crypto'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit'

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
  let pwd = ''
  for (let i = 0; i < 12; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  return pwd
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('No autorizado')
  return supabase
}

// ---- OWNER ONBOARDING ----

export async function sendOwnerOnboarding(ownerId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { data: owner } = await adminClient.from('owners').select('*').eq('id', ownerId).single()
  if (!owner) throw new Error('Propietario no encontrado')
  if (owner.user_id) throw new Error('Este propietario ya tiene acceso al portal. Usa la opción de reenviar onboarding.')

  const email = owner.email
  if (!email) throw new Error('El propietario debe tener un email registrado')

  const password = generatePassword()

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError) throw new Error(authError.message)

  const userId = authData.user.id

  const { error: profileError } = await adminClient.from('profiles').upsert(
    { id: userId, role: 'owner' },
    { onConflict: 'id' },
  )
  if (profileError) throw new Error(profileError.message)

  const { error: ownerError } = await adminClient.from('owners').update({ user_id: userId }).eq('id', ownerId)
  if (ownerError) throw new Error(ownerError.message)

  const encrypted = encrypt(password)
  const { error: pwdError } = await adminClient.from('encrypted_passwords').upsert(
    { user_id: userId, encrypted_password: encrypted },
    { onConflict: 'user_id' },
  )
  if (pwdError) throw new Error(pwdError.message)

  await logAudit({
    action: 'create',
    entity: 'owner',
    entityId: ownerId,
    entityName: owner.full_name,
    changes: { onboarding: true, userId },
  })

  revalidatePath(`/admin/propietarios/${ownerId}`)

  return {
    email,
    password,
    fullName: owner.full_name,
  }
}

export async function resendOwnerOnboarding(ownerId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { data: owner } = await adminClient.from('owners').select('*').eq('id', ownerId).single()
  if (!owner) throw new Error('Propietario no encontrado')
  if (!owner.user_id) throw new Error('Este propietario no tiene acceso aún. Primero envía el onboarding.')

  const { data: pwdRecord } = await adminClient
    .from('encrypted_passwords')
    .select('encrypted_password')
    .eq('user_id', owner.user_id)
    .single()

  let password: string

  if (pwdRecord) {
    password = decrypt(pwdRecord.encrypted_password)
  } else {
    password = generatePassword()

    const { error: authError } = await adminClient.auth.admin.updateUserById(owner.user_id, { password })
    if (authError) throw new Error(authError.message)

    const encrypted = encrypt(password)
    const { error: pwdError } = await adminClient.from('encrypted_passwords').upsert(
      { user_id: owner.user_id, encrypted_password: encrypted },
      { onConflict: 'user_id' },
    )
    if (pwdError) throw new Error(pwdError.message)
  }

  return {
    email: owner.email ?? '',
    password,
    fullName: owner.full_name,
    userId: owner.user_id,
  }
}

// ---- TENANT ONBOARDING (desde contrato) ----

export async function sendTenantOnboarding(contractId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { data: rawContract } = await adminClient
    .from('contracts')
    .select('id, tenants(id, full_name, email, user_id), properties(name)')
    .eq('id', contractId)
    .single()
  if (!rawContract) throw new Error('Contrato no encontrado')

  const contract = rawContract as unknown as {
    id: string
    tenants: { id: string; full_name: string; email: string; user_id: string | null }
    properties: { name: string } | null
  }

  const tenant = contract.tenants
  const propertyName = contract.properties?.name ?? ''

  // Si ya tiene user_id, solo devolvemos datos para reenvío
  if (tenant.user_id) {
    const { data: pwdRecord } = await adminClient
      .from('encrypted_passwords')
      .select('encrypted_password')
      .eq('user_id', tenant.user_id)
      .single()

    const password = pwdRecord ? decrypt(pwdRecord.encrypted_password) : null

    return {
      email: tenant.email,
      password,
      fullName: tenant.full_name,
      propertyName,
      isNewUser: false,
      userId: tenant.user_id,
    }
  }

  // Primera vez — crear usuario
  const password = generatePassword()

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: tenant.email,
    password,
    email_confirm: true,
  })
  if (authError) throw new Error(authError.message)

  const userId = authData.user.id

  const { error: profileError } = await adminClient.from('profiles').upsert(
    { id: userId, role: 'tenant' },
    { onConflict: 'id' },
  )
  if (profileError) throw new Error(profileError.message)

  const { error: tenantError } = await adminClient.from('tenants').update({ user_id: userId }).eq('id', tenant.id)
  if (tenantError) throw new Error(tenantError.message)

  const encrypted = encrypt(password)
  const { error: pwdError } = await adminClient.from('encrypted_passwords').upsert(
    { user_id: userId, encrypted_password: encrypted },
    { onConflict: 'user_id' },
  )
  if (pwdError) throw new Error(pwdError.message)

  await logAudit({
    action: 'create',
    entity: 'tenant',
    entityId: tenant.id,
    entityName: tenant.full_name,
    changes: { onboarding: true, contractId, propertyName, userId },
  })

  revalidatePath(`/admin/contratos/${contractId}`)

  return {
    email: tenant.email,
    password,
    fullName: tenant.full_name,
    propertyName,
    isNewUser: true,
    userId,
  }
}

// ---- TENANT ONBOARDING (desde tenant) ----

export async function sendTenantAccessOnboarding(tenantId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { data: tenant } = await adminClient.from('tenants').select('*').eq('id', tenantId).single()
  if (!tenant) throw new Error('Arrendatario no encontrado')
  if (tenant.user_id) throw new Error('Este arrendatario ya tiene acceso al portal. Usa la opción de reenviar onboarding.')

  if (!tenant.email) throw new Error('El arrendatario debe tener un email registrado')

  const password = generatePassword()

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: tenant.email,
    password,
    email_confirm: true,
  })
  if (authError) throw new Error(authError.message)

  const userId = authData.user.id

  const { error: profileError } = await adminClient.from('profiles').upsert(
    { id: userId, role: 'tenant' },
    { onConflict: 'id' },
  )
  if (profileError) throw new Error(profileError.message)

  const { error: tenantError } = await adminClient.from('tenants').update({ user_id: userId }).eq('id', tenantId)
  if (tenantError) throw new Error(tenantError.message)

  const encrypted = encrypt(password)
  const { error: pwdError } = await adminClient.from('encrypted_passwords').upsert(
    { user_id: userId, encrypted_password: encrypted },
    { onConflict: 'user_id' },
  )
  if (pwdError) throw new Error(pwdError.message)

  await logAudit({
    action: 'create',
    entity: 'tenant',
    entityId: tenantId,
    entityName: tenant.full_name,
    changes: { onboarding: true, userId },
  })

  revalidatePath(`/admin/arrendatarios/${tenantId}`)

  return {
    email: tenant.email,
    password,
    fullName: tenant.full_name,
  }
}

export async function resendTenantAccessOnboarding(tenantId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { data: tenant } = await adminClient.from('tenants').select('*').eq('id', tenantId).single()
  if (!tenant) throw new Error('Arrendatario no encontrado')
  if (!tenant.user_id) throw new Error('Este arrendatario no tiene acceso aún. Primero envía el onboarding.')

  const { data: pwdRecord } = await adminClient
    .from('encrypted_passwords')
    .select('encrypted_password')
    .eq('user_id', tenant.user_id)
    .single()

  let password: string

  if (pwdRecord) {
    password = decrypt(pwdRecord.encrypted_password)
  } else {
    // Tenant existente sin contraseña guardada (invitación anterior) — generar una nueva
    password = generatePassword()

    const { error: authError } = await adminClient.auth.admin.updateUserById(tenant.user_id, { password })
    if (authError) throw new Error(authError.message)

    const encrypted = encrypt(password)
    const { error: pwdError } = await adminClient.from('encrypted_passwords').upsert(
      { user_id: tenant.user_id, encrypted_password: encrypted },
      { onConflict: 'user_id' },
    )
    if (pwdError) throw new Error(pwdError.message)
  }

  return {
    email: tenant.email ?? '',
    password,
    fullName: tenant.full_name,
    userId: tenant.user_id,
  }
}

// ---- GESTIÓN DE CONTRASEÑAS (admin) ----

export async function getOwnerPassword(ownerId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { data: owner } = await adminClient.from('owners').select('user_id, full_name').eq('id', ownerId).single()
  if (!owner?.user_id) return null

  const { data: pwdRecord } = await adminClient
    .from('encrypted_passwords')
    .select('encrypted_password')
    .eq('user_id', owner.user_id)
    .single()

  if (!pwdRecord) return null

  return decrypt(pwdRecord.encrypted_password)
}

export async function getTenantPassword(tenantId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { data: tenant } = await adminClient.from('tenants').select('user_id, full_name').eq('id', tenantId).single()
  if (!tenant?.user_id) return null

  const { data: pwdRecord } = await adminClient
    .from('encrypted_passwords')
    .select('encrypted_password')
    .eq('user_id', tenant.user_id)
    .single()

  if (!pwdRecord) return null

  return decrypt(pwdRecord.encrypted_password)
}

export async function updateOwnerPassword(ownerId: string, newPassword: string) {
  await requireAdmin()
  if (newPassword.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres')

  const adminClient = createAdminClient()

  const { data: owner } = await adminClient.from('owners').select('user_id, full_name').eq('id', ownerId).single()
  if (!owner?.user_id) throw new Error('El propietario no tiene acceso al portal')

  const { error: authError } = await adminClient.auth.admin.updateUserById(owner.user_id, { password: newPassword })
  if (authError) throw new Error(authError.message)

  const encrypted = encrypt(newPassword)
  const { error: pwdError } = await adminClient.from('encrypted_passwords').upsert(
    { user_id: owner.user_id, encrypted_password: encrypted },
    { onConflict: 'user_id' },
  )
  if (pwdError) throw new Error(pwdError.message)

  await logAudit({
    action: 'update',
    entity: 'owner',
    entityId: ownerId,
    entityName: owner.full_name,
    changes: { passwordChanged: true },
  })

  revalidatePath(`/admin/propietarios/${ownerId}`)
}

export async function updateTenantPassword(tenantId: string, newPassword: string) {
  await requireAdmin()
  if (newPassword.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres')

  const adminClient = createAdminClient()

  const { data: tenant } = await adminClient.from('tenants').select('user_id, full_name').eq('id', tenantId).single()
  if (!tenant?.user_id) throw new Error('El arrendatario no tiene acceso al portal')

  const { error: authError } = await adminClient.auth.admin.updateUserById(tenant.user_id, { password: newPassword })
  if (authError) throw new Error(authError.message)

  const encrypted = encrypt(newPassword)
  const { error: pwdError } = await adminClient.from('encrypted_passwords').upsert(
    { user_id: tenant.user_id, encrypted_password: encrypted },
    { onConflict: 'user_id' },
  )
  if (pwdError) throw new Error(pwdError.message)

  await logAudit({
    action: 'update',
    entity: 'tenant',
    entityId: tenantId,
    entityName: tenant.full_name,
    changes: { passwordChanged: true },
  })

  revalidatePath(`/admin/arrendatarios/${tenantId}`)
}
