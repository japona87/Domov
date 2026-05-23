// src/lib/actions/contracts.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

export async function createTenant(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email')
  const { error } = await supabase.from('tenants').insert({
    full_name: String(formData.get('full_name')),
    document_number: formData.get('document_number') ? String(formData.get('document_number')) : undefined,
    phone: formData.get('phone') ? String(formData.get('phone')) : undefined,
    email: email ? String(email) : '',
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/arrendatarios')
  redirect('/admin/arrendatarios')
}

export async function updateTenant(id: string, formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email')
  const { error } = await supabase.from('tenants').update({
    full_name: String(formData.get('full_name')),
    document_number: formData.get('document_number') ? String(formData.get('document_number')) : undefined,
    phone: formData.get('phone') ? String(formData.get('phone')) : undefined,
    email: email ? String(email) : undefined,
  }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/arrendatarios')
  revalidatePath(`/admin/arrendatarios/${id}`)
  redirect('/admin/arrendatarios')
}

export async function createContract(formData: FormData) {
  const supabase = await createClient()

  const startDate = new Date(String(formData.get('start_date')))
  const endDate = new Date(String(formData.get('end_date')))
  const monthlyRent = Number(formData.get('monthly_rent'))
  const administrationFeeRaw = formData.get('administration_fee')
  const ipcRateRaw = formData.get('ipc_rate')

  const { data: contract, error } = await supabase.from('contracts').insert({
    property_id: String(formData.get('property_id')),
    tenant_id: String(formData.get('tenant_id')),
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    monthly_rent: monthlyRent,
    administration_fee: administrationFeeRaw && String(administrationFeeRaw) !== '' ? Number(administrationFeeRaw) : undefined,
    ipc_rate: ipcRateRaw && String(ipcRateRaw) !== '' ? Number(ipcRateRaw) : undefined,
    status: 'active',
    notes: formData.get('notes') ? String(formData.get('notes')) : undefined,
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
  revalidatePath(`/admin/contratos/${contractId}`)
}

export async function setContractEnding(
  contractId: string,
  reason: 'non_renewal_admin' | 'non_renewal_tenant',
  noticeDate: string,
  documentPath: string | null
) {
  const supabase = await createClient()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (documentPath !== null) {
    const { error: docError } = await supabase.from('documents').insert({
      contract_id: contractId,
      type: 'termination_notice',
      file_url: `${supabaseUrl}/storage/v1/object/documents/${documentPath}`,
      uploaded_by: 'admin',
    })
    if (docError) throw new Error(docError.message)
  }

  const { error } = await supabase.from('contracts').update({
    status: 'ending',
    termination_reason: reason,
    termination_notice_date: noticeDate,
  }).eq('id', contractId)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/contratos/${contractId}`)
  revalidatePath('/admin/contratos')
  revalidatePath('/admin/propiedades')
  redirect(`/admin/contratos/${contractId}`)
}

export async function setContractEnded(contractId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('contracts').update({
    status: 'ended',
    ended_at: new Date().toISOString(),
  }).eq('id', contractId)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/contratos/${contractId}`)
  revalidatePath('/admin/contratos')
  revalidatePath('/admin/propiedades')
}
