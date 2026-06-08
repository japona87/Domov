'use server'

import type { Json } from '@/types/database'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit'

export async function addContractDocument(formData: FormData) {
  const supabase = await createClient()

  const contractId = String(formData.get('contract_id'))
  const name = String(formData.get('name'))
  const type = String(formData.get('type'))
  const description = formData.get('description') ? String(formData.get('description')) : null
  const filePath = formData.get('file_path')
  const fileSize = formData.get('file_size') ? Number(formData.get('file_size')) : null

  if (!contractId || !name || !type || !filePath) {
    throw new Error('Faltan campos obligatorios')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const fileUrl = `${supabaseUrl}/storage/v1/object/documents/${filePath}`

  const { data, error } = await supabase.from('documents').insert({
    contract_id: contractId,
    name,
    type,
    description,
    file_url: fileUrl,
    file_size: fileSize,
    mime_type: 'application/pdf',
    uploaded_by: 'admin',
  }).select('id').single()

  if (error) throw new Error(error.message)

  await logAudit({
    action: 'create',
    entity: 'document',
    entityId: data.id,
    entityName: name,
    changes: { contract_id: { old: null, new: contractId }, type: { old: null, new: type } } as unknown as Json,
  })

  revalidatePath(`/admin/contratos/${contractId}`)
}

export async function deleteContractDocument(documentId: string, storagePath: string, contractId: string) {
  const supabase = await createClient()

  const { data: doc } = await supabase.from('documents').select('name').eq('id', documentId).single()

  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([storagePath])

  if (storageError) throw new Error(storageError.message)

  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)

  if (dbError) throw new Error(dbError.message)

  await logAudit({
    action: 'delete',
    entity: 'document',
    entityId: documentId,
    entityName: doc?.name ?? 'documento',
  })

  revalidatePath(`/admin/contratos/${contractId}`)
}
