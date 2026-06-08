import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function StatCard({
  href,
  label,
  value,
  icon,
  accent = false,
  alert = false,
}: {
  href?: string
  label: string
  value: number
  icon: React.ReactNode
  accent?: boolean
  alert?: boolean
}) {
  const card = (
    <div
      className={`rounded-2xl border p-5 transition-all ${
        accent
          ? 'bg-accent/10 border-accent/30 hover:border-accent/60'
          : alert
          ? 'bg-destructive/5 border-destructive/20 hover:border-destructive/40'
          : 'bg-white border-border hover:border-navy-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            accent
              ? 'bg-accent/20 text-accent'
              : alert
              ? 'bg-destructive/10 text-destructive'
              : 'bg-navy-50 text-navy-600'
          }`}
        >
          {icon}
        </div>
      </div>
      <p
        className={`text-3xl font-sans font-bold tracking-tight mb-1 ${
          accent ? 'text-accent' : alert ? 'text-destructive' : 'text-foreground'
        }`}
      >
        {value}
      </p>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block group cursor-pointer">
        {card}
      </Link>
    )
  }
  return card
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { data: { user } },
    { count: totalProperties },
    { data: activeContractsList },
    { count: pendingPayments },
    { count: totalTenants },
    { count: totalOwners },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('properties').select('*', { count: 'exact', head: true }),
    supabase.from('contracts').select('property_id').in('status', ['active', 'ending']),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase.from('owners').select('*', { count: 'exact', head: true }),
  ])

  const occupiedSet = new Set(activeContractsList?.map((c) => c.property_id) ?? [])
  const availableCount = (totalProperties ?? 0) - occupiedSet.size

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-sans font-bold text-foreground tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bienvenido de nuevo, <span className="font-medium text-foreground">{user?.email}</span>
          </p>
        </div>
        <Link
          href="/propiedades"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors hover:border-navy-300"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Ver landing
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          href="/admin/propiedades"
          label="Inmuebles"
          value={totalProperties ?? 0}
          accent={false}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          }
        />

        <StatCard
          href="/admin/propiedades"
          label="Disponibles"
          value={availableCount}
          accent={true}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          }
        />

        <StatCard
          href="/admin/contratos"
          label="Contratos activos"
          value={occupiedSet.size}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          }
        />

        <StatCard
          href="/admin/propietarios"
          label="Propietarios"
          value={totalOwners ?? 0}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
          }
        />

        <StatCard
          href="/admin/arrendatarios"
          label="Arrendatarios"
          value={totalTenants ?? 0}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          }
        />

        <StatCard
          href="/admin/contratos"
          label="Pagos pendientes"
          value={pendingPayments ?? 0}
          alert={(pendingPayments ?? 0) > 0}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          }
        />
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans font-semibold text-base font-bold text-foreground">Acciones rápidas</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/admin/propiedades/nueva', label: 'Nueva propiedad', icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/> },
            { href: '/admin/propietarios/nuevo', label: 'Nuevo propietario', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></> },
            { href: '/admin/arrendatarios/nuevo', label: 'Nuevo arrendatario', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="21" x2="23" y2="19"/></> },
            { href: '/admin/contratos/nuevo', label: 'Nuevo contrato', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></> },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-border hover:border-accent/50 hover:bg-accent/5 transition-all text-center group"
            >
              <div className="w-9 h-9 rounded-xl bg-navy-50 text-navy-600 flex items-center justify-center group-hover:bg-accent/15 group-hover:text-accent transition-colors">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {action.icon}
                </svg>
              </div>
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
