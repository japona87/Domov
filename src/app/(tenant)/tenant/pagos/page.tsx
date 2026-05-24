import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

const PAYMENT_STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  paid:    { label: 'Pagado',    variant: 'default' },
  overdue: { label: 'Vencido',   variant: 'destructive' },
}

export default async function TenantPagosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!tenant) redirect('/tenant/dashboard')

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, status')
    .eq('tenant_id', tenant.id)
    .in('status', ['active', 'ending', 'ended'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const contractId = (contract as unknown as { id: string } | null)?.id ?? null

  const { data: payments } = contractId
    ? await supabase
        .from('payments')
        .select('id, amount, due_date, paid_date, status, receipt_url, notes')
        .eq('contract_id', contractId)
        .order('due_date')
    : { data: [] }

  // Generate signed URLs for paid receipts
  const paymentsWithUrls = await Promise.all(
    (payments ?? []).map(async (p) => {
      if (!p.receipt_url) return { ...p, signedUrl: null }
      const urlPath = p.receipt_url.split('/storage/v1/object/receipts/')[1]
      if (!urlPath) return { ...p, signedUrl: null }
      const { data } = await supabase.storage.from('receipts').createSignedUrl(urlPath, 3600)
      return { ...p, signedUrl: data?.signedUrl ?? null }
    })
  )

  const paid = paymentsWithUrls.filter(p => p.status === 'paid').length
  const pending = paymentsWithUrls.filter(p => p.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading text-foreground">Mis pagos</h2>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span><strong className="text-foreground">{paid}</strong> pagados</span>
          <span><strong className="text-destructive">{pending}</strong> pendientes</span>
        </div>
      </div>

      {paymentsWithUrls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Sin pagos registrados.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {paymentsWithUrls.map((p) => {
            const badge = PAYMENT_STATUS[p.status] ?? { label: p.status, variant: 'outline' as const }
            return (
              <div key={p.id} className="bg-card rounded-xl border border-border px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.due_date}</p>
                  <p className="text-xs text-muted-foreground">${p.amount.toLocaleString('es-CO')}</p>
                  {p.paid_date && <p className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>Pagado el {p.paid_date}</p>}
                  {p.notes && <p className="text-xs text-muted-foreground mt-0.5">{p.notes}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  {p.signedUrl && (
                    <a
                      href={p.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-accent hover:text-accent/80 font-medium underline underline-offset-2"
                    >
                      Ver comprobante
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
