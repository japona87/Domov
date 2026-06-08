import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getContractAmendments } from '@/lib/actions/contract-amendments'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  active:  { label: 'Activo',     variant: 'default' },
  ending:  { label: 'Terminando', variant: 'secondary' },
  ended:   { label: 'Terminado',  variant: 'outline' },
}

export default async function TenantContratoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, full_name, document_number, phone, email')
    .eq('user_id', user.id)
    .single()

  if (!tenant) redirect('/tenant/dashboard')

  const { data: contract } = await supabase
    .from('contracts')
    .select(`
      id, status, start_date, end_date, monthly_rent, administration_fee,
      ipc_rate, termination_reason, termination_notice_date, notes,
      properties(name, address, type)
    `)
    .eq('tenant_id', tenant.id)
    .in('status', ['active', 'ending', 'ended'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

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
    notes: string | null
    properties: { name: string; address: string; type: string } | null
  } | null

  if (!c) {
    return (
      <div className="text-center py-20">
        <p className="font-sans font-semibold text-xl text-foreground">Sin contrato disponible</p>
      </div>
    )
  }

  const badge = STATUS_LABEL[c.status] ?? { label: c.status, variant: 'outline' as const }
  const amendments = await getContractAmendments(c.id)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-sans font-semibold text-foreground">Mi contrato</h2>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Inmueble</p>
              <CardTitle className="font-sans font-semibold text-xl text-foreground">{c.properties?.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{c.properties?.address}</p>
            </div>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Inicio</p>
              <p className="text-sm font-medium text-foreground">{c.start_date}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fin</p>
              <p className="text-sm font-medium text-foreground">{c.end_date}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Canon mensual</p>
              <p className="font-sans font-semibold text-lg text-foreground">${c.monthly_rent.toLocaleString('es-CO')}</p>
            </div>
            {c.administration_fee != null && (
              <div>
                <p className="text-xs text-muted-foreground">Administración</p>
                <p className="text-sm font-medium text-foreground">${c.administration_fee.toLocaleString('es-CO')}</p>
              </div>
            )}
            {c.ipc_rate != null && (
              <div>
                <p className="text-xs text-muted-foreground">IPC aplicado</p>
                <p className="text-sm font-medium text-foreground">{c.ipc_rate}%</p>
              </div>
            )}
          </div>

          {c.termination_notice_date && (
            <div className="bg-muted rounded-lg p-4 border border-border">
              <p className="text-sm font-medium text-foreground mb-1">Aviso de no renovación</p>
              <p className="text-sm text-muted-foreground">
                Notificado el {c.termination_notice_date}.
                {c.termination_reason === 'non_renewal_tenant' && (
                  <> Entrega estimada: {new Date(new Date(c.termination_notice_date).getTime() + 90 * 86400000).toISOString().split('T')[0]}.</>
                )}
              </p>
            </div>
          )}

          {c.notes && (
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Observaciones</p>
              <p className="text-sm text-foreground">{c.notes}</p>
            </div>
          )}

          {amendments.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Historial de renta</p>
              {amendments.map((a, i) => (
                <div key={a.id} className="flex gap-3 mb-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i === 0 ? 'bg-green-500' : 'bg-blue-500'}`} />
                  <div>
                    <p className="text-xs text-foreground">
                      {i === 0 ? 'Contrato original' : `Enmienda #${a.amendment_number}`}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
