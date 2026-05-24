import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active:  { label: 'Activo',     variant: 'default' },
  ending:  { label: 'Terminando', variant: 'secondary' },
  ended:   { label: 'Terminado',  variant: 'outline' },
}

export default async function TenantDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single()

  if (!tenant) {
    return (
      <div className="text-center py-20">
        <p className="font-heading text-2xl text-foreground mb-2">Sin contrato asignado</p>
        <p className="text-muted-foreground text-sm">Contacta al administrador para más información.</p>
      </div>
    )
  }

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, status, start_date, end_date, monthly_rent, administration_fee, properties(name, address)')
    .eq('tenant_id', tenant.id)
    .in('status', ['active', 'ending'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const contractId = (contract as unknown as { id: string } | null)?.id ?? null

  const { data: nextPayment } = contractId
    ? await supabase
        .from('payments')
        .select('id, due_date, amount, status')
        .eq('contract_id', contractId)
        .eq('status', 'pending')
        .order('due_date')
        .limit(1)
        .single()
    : { data: null }

  const { count: pendingCount } = contractId
    ? await supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('contract_id', contractId)
        .eq('status', 'pending')
    : { count: 0 }

  const c = contract as unknown as {
    id: string
    status: string
    start_date: string
    end_date: string
    monthly_rent: number
    administration_fee: number | null
    properties: { name: string; address: string } | null
  } | null

  const badge = c ? (STATUS_LABEL[c.status] ?? { label: c.status, variant: 'outline' as const }) : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading text-foreground">
          Bienvenido, {tenant.full_name?.split(' ')[0]}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Resumen de tu arrendamiento</p>
      </div>

      {!c ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No tienes un contrato activo actualmente.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Inmueble</p>
                    <CardTitle className="font-heading text-xl text-foreground">{c.properties?.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">{c.properties?.address}</p>
                  </div>
                  {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Vigencia</p>
                    <p className="text-sm font-medium text-foreground">{c.start_date} → {c.end_date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Canon mensual</p>
                    <p className="font-heading text-lg text-foreground">${c.monthly_rent.toLocaleString('es-CO')}</p>
                  </div>
                  {c.administration_fee != null && (
                    <div>
                      <p className="text-xs text-muted-foreground">Administración</p>
                      <p className="text-sm font-medium text-foreground">${c.administration_fee.toLocaleString('es-CO')}</p>
                    </div>
                  )}
                </div>
                <div className="pt-4">
                  <Link href="/tenant/contrato" className="text-sm text-accent hover:text-accent/80 font-medium">
                    Ver detalles del contrato →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="flex flex-col justify-between">
            <CardHeader>
              <p className="text-xs text-muted-foreground">Próximo pago</p>
              {nextPayment ? (
                <>
                  <p className="font-heading text-2xl text-foreground">${nextPayment.amount.toLocaleString('es-CO')}</p>
                  <p className="text-sm text-muted-foreground">Vence: {nextPayment.due_date}</p>
                  {(pendingCount ?? 0) > 1 && (
                    <p className="text-xs text-destructive mt-1">{pendingCount} cuotas pendientes en total</p>
                  )}
                </>
              ) : (
                <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>¡Al día con tus pagos!</p>
              )}
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/tenant/pagos">Ver mis pagos</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
