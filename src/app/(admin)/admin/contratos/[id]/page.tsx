import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PaymentRegister } from '@/components/contracts/payment-register'
import { ContractActions } from '@/components/contracts/contract-actions'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active:    { label: 'Activo',     className: 'bg-green-100 text-green-700' },
  ending:    { label: 'Terminando', className: 'bg-amber-100 text-amber-700' },
  ended:     { label: 'Terminado',  className: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Cancelado',  className: 'bg-red-100 text-red-600' },
}

const PAYMENT_STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-amber-100 text-amber-700' },
  paid:    { label: 'Pagado',    className: 'bg-green-100 text-green-700' },
  overdue: { label: 'Vencido',   className: 'bg-red-100 text-red-600' },
}

export default async function ContratoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select(`
      id, status, start_date, end_date, monthly_rent, administration_fee,
      ipc_rate, termination_reason, termination_notice_date, ended_at, notes,
      properties(id, name, address),
      tenants(id, full_name, document_number, phone, email)
    `)
    .eq('id', id)
    .single()

  if (!contract) notFound()

  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, due_date, paid_date, status, receipt_url, notes')
    .eq('contract_id', id)
    .order('due_date')

  const paymentsWithSignedUrls = await Promise.all(
    (payments ?? []).map(async (p) => {
      if (!p.receipt_url) return { ...p, signedReceiptUrl: null }
      const urlPath = p.receipt_url.split('/storage/v1/object/receipts/')[1]
      if (!urlPath) return { ...p, signedReceiptUrl: null }
      const { data } = await supabase.storage.from('receipts').createSignedUrl(urlPath, 3600)
      return { ...p, signedReceiptUrl: data?.signedUrl ?? null }
    })
  )

  const c = contract as unknown as {
    id: string
    status: string
    start_date: string
    end_date: string
    monthly_rent: number
    administration_fee: number | null
    ipc_rate: number | null
    termination_reason: string | null
    termination_notice_date: string | null
    ended_at: string | null
    notes: string | null
    properties: { id: string; name: string; address: string } | null
    tenants: {
      id: string
      full_name: string
      document_number: string | null
      phone: string | null
      email: string | null
    } | null
  }

  const badge = STATUS_LABEL[c.status] ?? { label: c.status, className: 'bg-slate-100 text-slate-600' }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">
            <Link href="/admin/contratos" className="hover:underline">Contratos</Link> / Detalle
          </p>
          <h2 className="text-2xl font-bold text-slate-800">{c.properties?.name}</h2>
          <p className="text-slate-500">{c.properties?.address}</p>
          <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <ContractActions contractId={id} status={c.status} />
      </div>

      <div className="grid grid-cols-2 gap-6 bg-white rounded-lg border p-6">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Arrendatario</p>
          <p className="font-medium text-slate-800">{c.tenants?.full_name}</p>
          {c.tenants?.document_number && (
            <p className="text-sm text-slate-500">CC: {c.tenants.document_number}</p>
          )}
          {c.tenants?.phone && <p className="text-sm text-slate-500">{c.tenants.phone}</p>}
          {c.tenants?.email && <p className="text-sm text-slate-500">{c.tenants.email}</p>}
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-slate-500">Vigencia</p>
            <p className="text-sm font-medium">{c.start_date} → {c.end_date}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Canon mensual</p>
            <p className="text-sm font-medium">${c.monthly_rent.toLocaleString('es-CO')}</p>
          </div>
          {c.administration_fee != null && (
            <div>
              <p className="text-xs text-slate-500">Administración</p>
              <p className="text-sm font-medium">${c.administration_fee.toLocaleString('es-CO')}</p>
            </div>
          )}
          {c.ipc_rate != null && (
            <div>
              <p className="text-xs text-slate-500">IPC</p>
              <p className="text-sm font-medium">{c.ipc_rate}%</p>
            </div>
          )}
        </div>
        {c.notes && (
          <div className="col-span-2">
            <p className="text-xs text-slate-500 mb-0.5">Notas</p>
            <p className="text-sm text-slate-700">{c.notes}</p>
          </div>
        )}
        {c.termination_notice_date && (
          <div className="col-span-2 bg-amber-50 rounded-md p-3">
            <p className="text-xs font-medium text-amber-700 mb-0.5">No renovación registrada</p>
            <p className="text-sm text-amber-800">
              Motivo:{' '}
              {c.termination_reason === 'non_renewal_admin'
                ? 'Por el administrador'
                : 'Por el arrendatario'}
              {' · '}Notificación: {c.termination_notice_date}
              {c.termination_reason === 'non_renewal_tenant' && (
                <>
                  {' · '}Entrega estimada:{' '}
                  {new Date(
                    new Date(c.termination_notice_date).getTime() + 90 * 86400000
                  )
                    .toISOString()
                    .split('T')[0]}
                </>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-semibold text-slate-800">Calendario de pagos</h3>
        {paymentsWithSignedUrls.length > 0 ? (
          <div className="space-y-2">
            {paymentsWithSignedUrls.map((p) => {
              const pb =
                PAYMENT_STATUS_LABEL[p.status] ?? {
                  label: p.status,
                  className: 'bg-slate-100 text-slate-600',
                }
              return (
                <div key={p.id} className="border rounded-md px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.due_date}</p>
                      <p className="text-xs text-slate-500">${p.amount.toLocaleString('es-CO')}</p>
                      {p.paid_date && (
                        <p className="text-xs text-green-600">Pagado: {p.paid_date}</p>
                      )}
                      {p.notes && <p className="text-xs text-slate-400">{p.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${pb.className}`}
                      >
                        {pb.label}
                      </span>
                      {p.signedReceiptUrl && (
                        <a
                          href={p.signedReceiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Ver comprobante
                        </a>
                      )}
                      {p.status !== 'paid' && c.status === 'active' && (
                        <PaymentRegister
                          paymentId={p.id}
                          contractId={id}
                          dueDate={p.due_date}
                          amount={p.amount}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Sin pagos registrados.</p>
        )}
      </div>
    </div>
  )
}
