import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getContractAmendments } from '@/lib/actions/contract-amendments'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active:    { label: 'Activo',     className: 'bg-green-100 text-green-700' },
  ending:    { label: 'Terminando', className: 'bg-amber-100 text-amber-700' },
  ended:     { label: 'Terminado',  className: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Cancelado',  className: 'bg-red-100 text-red-600' },
}

export default async function OwnerPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (!property) notFound()

  type ContractRow = {
    id: string; status: string; start_date: string; end_date: string
    monthly_rent: number; administration_fee: number | null
    tenants: { full_name: string; phone: string | null; email: string | null } | null
  }

  const { data: rawContracts } = await supabase
    .from('contracts')
    .select('id, status, start_date, end_date, monthly_rent, administration_fee, tenants(full_name, phone, email)')
    .eq('property_id', id)
    .order('created_at', { ascending: false })

  const contracts = (rawContracts ?? []) as unknown as ContractRow[]

  // Fetch amendments for each contract
  const contractAmendments = await Promise.all(
    contracts.map(c => getContractAmendments(c.id))
  )

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          <Link href="/owner/propiedades" className="hover:underline">Mis inmuebles</Link> / Detalle
        </p>
        <h2 className="text-2xl font-sans font-semibold text-foreground">{property.name}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{property.address}</p>
      </div>

      {contracts.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Contratos</h3>
          {contracts.map((c, ci) => {
            const badge = STATUS_LABEL[c.status] ?? { label: c.status, className: 'bg-slate-100 text-slate-600' }
            const tenant = c.tenants
            const amendments = contractAmendments[ci]
            return (
              <div key={c.id} className="bg-card rounded-xl border border-border p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Contrato con {tenant?.full_name ?? 'N/A'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.start_date} → {c.end_date}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Canon mensual</p>
                    <p className="font-medium text-foreground">${c.monthly_rent.toLocaleString('es-CO')}</p>
                  </div>
                  {c.administration_fee != null && (
                    <div>
                      <p className="text-muted-foreground text-xs">Administración</p>
                      <p className="font-medium text-foreground">${c.administration_fee.toLocaleString('es-CO')}</p>
                    </div>
                  )}
                  {tenant?.phone && (
                    <div>
                      <p className="text-muted-foreground text-xs">Teléfono</p>
                      <p className="font-medium text-foreground">{tenant.phone}</p>
                    </div>
                  )}
                  {tenant?.email && (
                    <div>
                      <p className="text-muted-foreground text-xs">Email</p>
                      <p className="font-medium text-foreground">{tenant.email}</p>
                    </div>
                  )}
                </div>
                {amendments.length > 0 && (
                  <details className="border-t border-border pt-3 mt-3">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground font-medium">
                      Historial de renta ({amendments.length} enmienda{amendments.length !== 1 ? 's' : ''})
                    </summary>
                    <div className="mt-3 space-y-2">
                      {amendments.map((a, i) => (
                        <div key={a.id} className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          <div>
                            <p className="text-xs text-foreground">
                              {i === 0 ? 'Original' : `Enmienda #${a.amendment_number}`}
                              {' · '}${a.monthly_rent.toLocaleString('es-CO')}
                              {a.administration_fee > 0 && ` + $${a.administration_fee.toLocaleString('es-CO')}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {a.period_start} → {a.period_end}
                              {a.ipc_rate != null && ` · IPC ${a.ipc_rate}%`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Este inmueble no tiene contratos registrados.</p>
        </div>
      )}
    </div>
  )
}
