'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit'

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

export async function addContractAmendment(contractId: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('No autorizado')

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, end_date, monthly_rent, administration_fee, status, termination_reason, termination_notice_date, ended_at')
    .eq('id', contractId)
    .single()
  if (!contract) throw new Error('Contrato no encontrado')

  const amendmentDate = String(formData.get('amendment_date'))
  const newEndDate = String(formData.get('period_end'))
  const newRent = Number(formData.get('monthly_rent'))
  const newAdminFee = Number(formData.get('administration_fee'))
  const ipcRaw = formData.get('ipc_rate')
  const adminPctRaw = formData.get('admin_fee_increase_pct')
  const notes = formData.get('notes') ? String(formData.get('notes')) : null

  if (!amendmentDate || !newEndDate) throw new Error('Fechas inválidas')
  if (!newRent || newRent <= 0) throw new Error('Canon inválido')

  const periodStart = contract.end_date

  const { data: existingAmendments } = await supabase
    .from('contract_amendments')
    .select('amendment_number')
    .eq('contract_id', contractId)
    .order('amendment_number', { ascending: false })
    .limit(1)

  const nextNumber = existingAmendments && existingAmendments.length > 0
    ? existingAmendments[0].amendment_number + 1
    : 1

  const { error: insertError } = await supabase.from('contract_amendments').insert({
    contract_id: contractId,
    amendment_number: nextNumber,
    amendment_date: amendmentDate,
    period_start: periodStart,
    period_end: newEndDate,
    monthly_rent: newRent,
    ipc_rate: ipcRaw && String(ipcRaw) !== '' ? Number(ipcRaw) : null,
    administration_fee: newAdminFee || 0,
    admin_fee_increase_pct: adminPctRaw && String(adminPctRaw) !== '' ? Number(adminPctRaw) : null,
    notes,
  })
  if (insertError) throw new Error(insertError.message)

  const contractUpdate: Record<string, unknown> = {
    end_date: newEndDate,
    monthly_rent: newRent,
    administration_fee: newAdminFee || 0,
    ipc_rate: ipcRaw && String(ipcRaw) !== '' ? Number(ipcRaw) : null,
  }

  if (contract.status === 'ended') {
    contractUpdate.status = 'active'
    contractUpdate.termination_reason = null
    contractUpdate.termination_notice_date = null
    contractUpdate.ended_at = null
  }

  const { error: updateError } = await supabase.from('contracts').update(contractUpdate as never).eq('id', contractId)
  if (updateError) throw new Error(updateError.message)

  const paymentRows = generatePaymentRows(
    contractId,
    new Date(periodStart + 'T00:00:00'),
    new Date(newEndDate + 'T00:00:00'),
    newRent
  )
  if (paymentRows.length > 0) {
    const { error: paymentsError } = await supabase.from('payments').insert(
      paymentRows.map(r => ({
        contract_id: r.contract_id,
        amount: r.amount,
        due_date: r.due_date,
        status: r.status as 'pending',
      }))
    )
    if (paymentsError) throw new Error(paymentsError.message)
  }

  await logAudit({
    action: 'create',
    entity: 'contract_amendment',
    entityId: contractId,
    entityName: `Enmienda #${nextNumber} - contrato ${contractId}`,
    changes: { amendment_number: nextNumber, monthly_rent: newRent, period_start: periodStart, period_end: newEndDate, administration_fee: newAdminFee },
  })

  revalidatePath(`/admin/contratos/${contractId}`)
  revalidatePath('/admin/contratos')
  revalidatePath('/admin/propiedades')
}

export async function getContractAmendments(contractId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('contract_amendments')
    .select('id, amendment_number, amendment_date, period_start, period_end, monthly_rent, ipc_rate, administration_fee, admin_fee_increase_pct, notes, created_at')
    .eq('contract_id', contractId)
    .order('amendment_number', { ascending: true })
  return data ?? []
}
