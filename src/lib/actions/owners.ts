'use server'

import type { Json } from '@/types/database'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logAudit, diffFields } from '@/lib/audit'

function validateOwnerFields(fields: { full_name: string; document_number: string | null; phone: string | null; email: string | null }) {
  if (!fields.full_name.trim()) {
    throw new Error('El nombre completo es obligatorio.')
  }
  if (fields.document_number && !/^\d{7,10}$/.test(fields.document_number)) {
    throw new Error('La cédula debe contener solo números (7 a 10 dígitos).')
  }
  if (fields.phone && !/^\d{7,10}$/.test(fields.phone)) {
    throw new Error('El teléfono debe contener solo números (7 a 10 dígitos).')
  }
  if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    throw new Error('El email no tiene un formato válido.')
  }
}

export async function createOwner(formData: FormData) {
  const supabase = await createClient()
  const insert = {
    full_name: String(formData.get('fullName')),
    document_number: String(formData.get('documentNumber')) || null,
    phone: String(formData.get('phone')) || null,
    email: String(formData.get('email')) || null,
  }
  validateOwnerFields(insert)
  const { data, error } = await supabase.from('owners').insert(insert).select('id').single()
  if (error) throw new Error(error.message)
  await logAudit({ action: 'create', entity: 'owner', entityId: data.id, entityName: insert.full_name, changes: insert as unknown as Json })
  revalidatePath('/admin/propietarios')
  redirect('/admin/propietarios')
}

export async function updateOwner(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: before } = await supabase.from('owners').select('full_name, document_number, phone, email').eq('id', id).single()
  const update = {
    full_name: String(formData.get('fullName')),
    document_number: String(formData.get('documentNumber')) || null,
    phone: String(formData.get('phone')) || null,
    email: String(formData.get('email')) || null,
  }
  validateOwnerFields(update)
  const { error } = await supabase.from('owners').update(update).eq('id', id)
  if (error) throw new Error(error.message)
  if (before) {
    const changes = diffFields(before, update, ['full_name', 'document_number', 'phone', 'email'])
    if (Object.keys(changes).length > 0) {
      await logAudit({ action: 'update', entity: 'owner', entityId: id, entityName: update.full_name, changes: changes as unknown as Json })
    }
  }
  revalidatePath('/admin/propietarios')
  revalidatePath(`/admin/propietarios/${id}`)
}

export async function deleteOwner(prev: { error?: string } | undefined, id: string) {
  const supabase = await createClient()
  const { data: links } = await supabase
    .from('property_owners')
    .select('id')
    .eq('owner_id', id)

  if (links && links.length > 0) {
    return { error: 'No se puede eliminar el propietario porque está asociado a una o más propiedades.' }
  }

  const { data: before } = await supabase.from('owners').select('full_name').eq('id', id).single()
  const { error } = await supabase.from('owners').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      return { error: 'No se puede eliminar el propietario porque está asociado a una o más propiedades.' }
    }
    return { error: error.message }
  }
  await logAudit({ action: 'delete', entity: 'owner', entityId: id, entityName: before?.full_name })
  revalidatePath('/admin/propietarios')
  redirect('/admin/propietarios')
}

export async function getOwners(search?: string) {
  const supabase = await createClient()
  let query = supabase.from('owners').select('*').order('full_name')
  if (search) query = query.ilike('full_name', `%${search}%`)
  const { data } = await query
  return data ?? []
}

export async function getOwner(id: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('owners').select('*').eq('id', id).single()
  return data
}


