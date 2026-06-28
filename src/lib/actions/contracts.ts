// src/lib/actions/contracts.ts
'use server'

import type { Json } from '@/types/database'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logAudit, diffFields } from '@/lib/audit'

// generatePaymentRows: iterates month-by-month from startDate to endDate
// Due day is clamped to last day of each month (e.g., Jan 31 → Feb 28)
function generatePaymentRows(
  contractId: string,
  startDate: Date,
  endDate: Date,
  monthlyRent: number
) {
  const rows: { contract_id: string; amount: number; due_date: string; status: string }[] = []
  const dueDay = startDate.getDate()
  let year = startDate.getFullYear()
  let month = startDate.getMonth()

  while (true) {
    const maxDay = new Date(year, month + 1, 0).getDate()
    const due = new Date(year, month, Math.min(dueDay, maxDay))
    if (due > endDate) break
    rows.push({
      contract_id: contractId,
      amount: monthlyRent,
      due_date: due.toISOString().split('T')[0],
      status: 'pending',
    })
    month += 1
    if (month > 11) { month = 0; year += 1 }
  }
  return rows
}

function validateTenantFields(fields: { full_name: string; document_number: string | null; phone: string | null; email: string | null }) {
  if (!fields.full_name.trim()) throw new Error('El nombre completo es obligatorio.')
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

export async function createTenant(formData: FormData) {
  const supabase = await createClient()
  const insert = {
    full_name: String(formData.get('full_name')),
    document_number: formData.get('document_number') ? String(formData.get('document_number')) : null,
    phone: formData.get('phone') ? String(formData.get('phone')) : null,
    email: formData.get('email') ? String(formData.get('email')) : null,
  }
  validateTenantFields(insert)
  const { data, error } = await supabase.from('tenants').insert(insert).select('id').single()
  if (error) throw new Error(error.message)
  await logAudit({ action: 'create', entity: 'tenant', entityId: data.id, entityName: insert.full_name, changes: insert as unknown as Json })
  revalidatePath('/admin/arrendatarios')
  redirect('/admin/arrendatarios')
}

export async function updateTenant(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: before } = await supabase.from('tenants').select('full_name, document_number, phone, email').eq('id', id).single()
  const update = {
    full_name: String(formData.get('full_name')),
    document_number: formData.get('document_number') ? String(formData.get('document_number')) : null,
    phone: formData.get('phone') ? String(formData.get('phone')) : null,
    email: formData.get('email') ? String(formData.get('email')) : null,
  }
  validateTenantFields(update)
  const { error } = await supabase.from('tenants').update(update).eq('id', id)
  if (error) throw new Error(error.message)
  if (before) {
    const changes = diffFields(before, update, ['full_name', 'document_number', 'phone', 'email'])
    if (Object.keys(changes).length > 0) {
      await logAudit({ action: 'update', entity: 'tenant', entityId: id, entityName: update.full_name, changes: changes as unknown as Json })
    }
  }
  revalidatePath('/admin/arrendatarios')
  revalidatePath(`/admin/arrendatarios/${id}`)
  redirect('/admin/arrendatarios')
}

export async function createContract(formData: FormData) {
  const supabase = await createClient()

  const startDate = new Date(String(formData.get('start_date')))
  const endDate = new Date(String(formData.get('end_date')))
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Fechas inválidas')
  }
  if (startDate >= endDate) {
    throw new Error('La fecha de inicio debe ser anterior a la fecha de fin')
  }
  const monthlyRent = Number(formData.get('monthly_rent'))
  if (!monthlyRent || monthlyRent <= 0) {
    throw new Error('Canon mensual inválido')
  }
  const administrationFeeRaw = formData.get('administration_fee')
  const ipcRateRaw = formData.get('ipc_rate')
  const minWageRaw = formData.get('min_wage_increase')

  const { data: contract, error } = await supabase.from('contracts').insert({
    property_id: String(formData.get('property_id')),
    tenant_id: String(formData.get('tenant_id')),
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    monthly_rent: monthlyRent,
    administration_fee: administrationFeeRaw && String(administrationFeeRaw) !== '' ? Number(administrationFeeRaw) : null,
    ipc_rate: ipcRateRaw && String(ipcRateRaw) !== '' ? Number(ipcRateRaw) : null,
    min_wage_increase: minWageRaw && String(minWageRaw) !== '' ? Number(minWageRaw) : null,
    status: 'active',
    notes: formData.get('notes') ? String(formData.get('notes')) : null,
  }).select('id').single()

  if (error || !contract) throw new Error(error?.message ?? 'Error creando contrato')

  const paymentRows = generatePaymentRows(contract.id, startDate, endDate, monthlyRent)
  if (paymentRows.length > 0) {
    const { error: paymentsError } = await supabase.from('payments').insert(
      paymentRows.map(row => ({
        contract_id: row.contract_id,
        amount: row.amount,
        due_date: row.due_date,
        status: row.status as 'pending',
      }))
    )
    if (paymentsError) throw new Error(paymentsError.message)
  }

  await logAudit({ action: 'create', entity: 'contract', entityId: contract.id, changes: { monthly_rent: { old: null, new: monthlyRent }, status: { old: null, new: 'active' } } })
  revalidatePath('/admin/contratos')
  revalidatePath('/admin/propiedades')
  redirect(`/admin/contratos/${contract.id}`)
}

export async function markPaymentPaid(
  paymentId: string,
  contractId: string,
  receiptPath: string | null,
  notes: string | null
) {
  const supabase = await createClient()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const receiptUrl = receiptPath
    ? `${supabaseUrl}/storage/v1/object/receipts/${receiptPath}`
    : null

  const { error } = await supabase.from('payments').update({
    status: 'paid',
    paid_date: new Date().toISOString().split('T')[0],
    receipt_url: receiptUrl ?? undefined,
    notes: notes ?? undefined,
  }).eq('id', paymentId)

  if (error) throw new Error(error.message)
  await logAudit({ action: 'update', entity: 'payment', entityId: paymentId, entityName: `pago contrato ${contractId}`, changes: { status: { old: 'pending', new: 'paid' } } })
  revalidatePath(`/admin/contratos/${contractId}`)
}

export async function setContractEnding(
  contractId: string,
  reason: 'non_renewal_admin' | 'non_renewal_tenant',
  noticeDate: string,
  documentPath: string | null
) {
  const supabase = await createClient()

  // Update contract FIRST
  const { error } = await supabase.from('contracts').update({
    status: 'ending',
    termination_reason: reason,
    termination_notice_date: noticeDate,
  }).eq('id', contractId)
  if (error) throw new Error(error.message)

  // Then insert document if provided
  if (documentPath) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const documentUrl = `${supabaseUrl}/storage/v1/object/documents/${documentPath}`
    await supabase.from('documents').insert({
      contract_id: contractId,
      type: 'termination_notice',
      file_url: documentUrl,
      uploaded_by: 'admin',
    })
  }

  await logAudit({ action: 'update', entity: 'contract', entityId: contractId, changes: { status: { old: 'active', new: 'ending' }, termination_reason: { old: null, new: reason } } })
  revalidatePath(`/admin/contratos/${contractId}`)
  revalidatePath('/admin/contratos')
  revalidatePath('/admin/propiedades')
  redirect(`/admin/contratos/${contractId}`)
}

export async function deleteTenant(prev: { error?: string } | undefined, id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('No autorizado')
  const { data: active } = await supabase
    .from('contracts')
    .select('id, status')
    .eq('tenant_id', id)
    .in('status', ['active', 'ending'])
    .limit(1)
  if (active && active.length > 0) {
    return { error: 'No se puede eliminar el arrendatario porque tiene contratos activos.' }
  }
  const { data: endedContracts } = await supabase
    .from('contracts')
    .select('id')
    .eq('tenant_id', id)
  if (endedContracts && endedContracts.length > 0) {
    for (const c of endedContracts) {
      const { data: docs } = await supabase.from('documents').select('file_url').eq('contract_id', c.id)
      const { data: payments } = await supabase.from('payments').select('receipt_url').eq('contract_id', c.id)
      const docPaths: string[] = (docs ?? []).map((d) => d.file_url.split('/storage/v1/object/documents/')[1]).filter(Boolean) as string[]
      const receiptPaths: string[] = (payments ?? []).map((p) => p.receipt_url?.split('/storage/v1/object/receipts/')[1]).filter(Boolean) as string[]
      if (docPaths.length > 0) await supabase.storage.from('documents').remove(docPaths)
      if (receiptPaths.length > 0) await supabase.storage.from('receipts').remove(receiptPaths)

      await supabase.from('payments').delete().eq('contract_id', c.id)
      await supabase.from('documents').delete().eq('contract_id', c.id)
      await supabase.from('insurance_policies').delete().eq('contract_id', c.id)
    }
    await supabase.from('contracts').delete().eq('tenant_id', id)
  }
  const { data: before } = await supabase.from('tenants').select('full_name').eq('id', id).single()
  const { error } = await supabase.from('tenants').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAudit({ action: 'delete', entity: 'tenant', entityId: id, entityName: before?.full_name })
  revalidatePath('/admin/arrendatarios')
  redirect('/admin/arrendatarios')
}

export async function deleteContract(prev: { error?: string } | undefined, id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('No autorizado')

  const { data: docs } = await supabase.from('documents').select('file_url').eq('contract_id', id)
  const { data: payments } = await supabase.from('payments').select('receipt_url').eq('contract_id', id)

  const docPaths: string[] = (docs ?? []).map((d) => d.file_url.split('/storage/v1/object/documents/')[1]).filter(Boolean) as string[]
  const receiptPaths: string[] = (payments ?? []).map((p) => p.receipt_url?.split('/storage/v1/object/receipts/')[1]).filter(Boolean) as string[]
  if (docPaths.length > 0) await supabase.storage.from('documents').remove(docPaths)
  if (receiptPaths.length > 0) await supabase.storage.from('receipts').remove(receiptPaths)

  const { error: errPayments } = await supabase.from('payments').delete().eq('contract_id', id)
  if (errPayments) return { error: errPayments.message }
  const { error: errDocs } = await supabase.from('documents').delete().eq('contract_id', id)
  if (errDocs) return { error: errDocs.message }
  const { error: errPolicies } = await supabase.from('insurance_policies').delete().eq('contract_id', id)
  if (errPolicies) return { error: errPolicies.message }
  const { error } = await supabase.from('contracts').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAudit({ action: 'delete', entity: 'contract', entityId: id })
  revalidatePath('/admin/contratos')
  redirect('/admin/contratos')
}

export async function updateContract(id: string, formData: FormData) {
  const supabase = await createClient()

  const { data: before } = await supabase
    .from('contracts')
    .select('property_id, tenant_id, start_date, end_date, monthly_rent, administration_fee, ipc_rate, min_wage_increase, notes')
    .eq('id', id)
    .single()

  if (!before) throw new Error('Contrato no encontrado')

  const startDate = String(formData.get('start_date'))
  const endDate = String(formData.get('end_date'))
  const monthlyRent = Number(formData.get('monthly_rent'))
  const administrationFeeRaw = formData.get('administration_fee')
  const ipcRateRaw = formData.get('ipc_rate')
  const minWageRaw = formData.get('min_wage_increase')

  if (!startDate || !endDate) throw new Error('Fechas inválidas')
  if (!monthlyRent || monthlyRent <= 0) throw new Error('Canon mensual inválido')

  const update: Record<string, unknown> = {
    property_id: String(formData.get('property_id')),
    tenant_id: String(formData.get('tenant_id')),
    start_date: startDate,
    end_date: endDate,
    monthly_rent: monthlyRent,
    administration_fee: administrationFeeRaw && String(administrationFeeRaw) !== '' ? Number(administrationFeeRaw) : null,
    ipc_rate: ipcRateRaw && String(ipcRateRaw) !== '' ? Number(ipcRateRaw) : null,
    min_wage_increase: minWageRaw && String(minWageRaw) !== '' ? Number(minWageRaw) : null,
    notes: formData.get('notes') ? String(formData.get('notes')) : null,
  }

  const { error } = await supabase.from('contracts').update(update as never).eq('id', id)
  if (error) throw new Error(error.message)

  const changes = diffFields(before, update, [
    'property_id', 'tenant_id', 'start_date', 'end_date',
    'monthly_rent', 'administration_fee', 'ipc_rate',
    'min_wage_increase', 'notes',
  ])

  if (Object.keys(changes).length > 0) {
    await logAudit({ action: 'update', entity: 'contract', entityId: id, changes: changes as unknown as Json })
  }

  revalidatePath('/admin/contratos')
  revalidatePath(`/admin/contratos/${id}`)
  revalidatePath('/admin/propiedades')
  redirect('/admin/contratos')
}

export async function setContractEnded(contractId: string) {
  const supabase = await createClient()
  const { data: before } = await supabase.from('contracts').select('status').eq('id', contractId).single()

  const { error } = await supabase.from('contracts').update({
    status: 'ended',
    ended_at: new Date().toISOString(),
  }).eq('id', contractId)

  if (error) throw new Error(error.message)

  await logAudit({ action: 'update', entity: 'contract', entityId: contractId, changes: { status: { old: before?.status ?? 'ending', new: 'ended' } } })
  revalidatePath(`/admin/contratos/${contractId}`)
  revalidatePath('/admin/contratos')
  revalidatePath('/admin/propiedades')
}
