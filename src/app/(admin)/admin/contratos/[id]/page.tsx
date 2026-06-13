import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ContractActions } from '@/components/contracts/contract-actions'
import { getContractAmendments } from '@/lib/actions/contract-amendments'
import { AmendmentForm } from '@/components/contracts/amendment-form'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active:    { label: 'Activo',     className: 'bg-green-100 text-green-700' },
  ending:    { label: 'Terminando', className: 'bg-amber-100 text-amber-700' },
  ended:     { label: 'Terminado',  className: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Cancelado',  className: 'bg-red-100 text-red-600' },
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

  const amendments = await getContractAmendments(id)
  const badge = STATUS_LABEL[c.status] ?? { label: c.status, className: 'bg-slate-100 text-slate-600' }

  const totalAmendments = amendments.length
  const yearsTenure = (() => {
    if (amendments.length > 0) {
      const first = new Date(amendments[0].period_start + 'T00:00:00')
      const last = amendments[amendments.length - 1].period_end
      return Math.round((new Date(last + 'T00:00:00').getTime() - first.getTime()) / 365.25 / 86400000 * 10) / 10
    }
    const start = new Date(c.start_date + 'T00:00:00')
    const end = new Date(c.end_date + 'T00:00:00')
    return Math.round((end.getTime() - start.getTime()) / 365.25 / 86400000 * 10) / 10
  })()

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
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/contratos/${id}/editar`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-4 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Editar
          </Link>
          <ContractActions contractId={id} status={c.status} />
        </div>
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
            <p className="text-sm text-slate-700 whitespace-pre-line">{c.notes}</p>
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

      {/* Amendments timeline */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Trazabilidad de enmiendas</h3>
          <p className="text-xs text-slate-500">
            {totalAmendments} enmienda{totalAmendments !== 1 ? 's' : ''} · {yearsTenure} años de antigüedad
          </p>
        </div>
        <div className="space-y-0">
          {amendments.length > 0 ? (
            <>
              {amendments.map((a, i) => (
                <div key={a.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${i === 0 ? 'bg-green-600' : 'bg-blue-600'}`} />
                    {i < amendments.length - 1 && <div className="w-0.5 flex-1 bg-blue-200" />}
                  </div>
                  <div className="pb-6">
                    <p className="text-sm font-medium text-slate-800">
                      {i === 0 ? 'Contrato original' : `Enmienda #${a.amendment_number}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {a.amendment_date && i > 0 ? `${a.amendment_date} · ` : ''}
                      {a.period_start} → {a.period_end}
                    </p>
                    <p className="text-xs text-slate-600">
                      ${a.monthly_rent.toLocaleString('es-CO')} + $
                      {a.administration_fee?.toLocaleString('es-CO') ?? '0'} admón
                      {a.ipc_rate != null && ` · IPC ${a.ipc_rate}%`}
                      {a.admin_fee_increase_pct != null && ` · Admin +${a.admin_fee_increase_pct}%`}
                    </p>
                    {a.notes && <p className="text-xs text-slate-400 mt-0.5">{a.notes}</p>}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-600 mt-1.5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Contrato original</p>
                <p className="text-xs text-slate-500">{c.start_date} → {c.end_date}</p>
                <p className="text-xs text-slate-600">
                  ${c.monthly_rent.toLocaleString('es-CO')}{c.administration_fee != null ? ` + $${c.administration_fee.toLocaleString('es-CO')} admón` : ''}
                  {c.ipc_rate != null && ` · IPC ${c.ipc_rate}%`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Crear enmienda */}
      {c.status === 'active' || c.status === 'ending' ? (
        <details className="bg-white rounded-lg border p-6">
          <summary className="cursor-pointer font-semibold text-slate-800 hover:text-blue-600 text-sm">
            + Crear nueva enmienda
          </summary>
          <div className="mt-4">
            <AmendmentForm
              contractId={c.id}
              currentRent={c.monthly_rent}
              currentAdminFee={c.administration_fee ?? 0}
              currentEndDate={c.end_date}
            />
          </div>
        </details>
      ) : null}
    </div>
  )
}
