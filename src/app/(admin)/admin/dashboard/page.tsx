import Link from 'next/link'
import React from 'react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// ── Icon components ──────────────────────────────────────────────────────────

const HouseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  </svg>
)

const ContractIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

// ── StatCard component ────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  iconBg,
  iconColor,
  href,
}: {
  label: string
  value: number
  sub?: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  href?: string
}) {
  const content = (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-500 font-medium">{label}</span>
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
      </div>
      <p className="font-heading text-4xl text-navy-800">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
  if (href) return <Link href={href}>{content}</Link>
  return content
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Compute cutoff date for "ending soon" (contracts ending within 90 days)
  const today = new Date()
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() + 90)
  const cutoffStr = cutoff.toISOString().split('T')[0]
  const todayStr = today.toISOString().split('T')[0]

  const [
    { count: totalProperties },
    { count: activeContracts },
    { count: totalTenants },
    { count: endingSoon },
  ] = await Promise.all([
    supabase.from('properties').select('*', { count: 'exact', head: true }),
    supabase.from('contracts').select('*', { count: 'exact', head: true }).in('status', ['active', 'ending']),
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('end_date', todayStr)
      .lte('end_date', cutoffStr),
  ])

  const total = totalProperties ?? 0
  // Properties with an active/ending contract are considered occupied
  const occupied = Math.min(activeContracts ?? 0, total)

  return (
    <div className="space-y-8">
      {/* Topbar */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-navy-800">Dashboard</h1>
        <p className="text-sm text-slate-400">
          {new Date().toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Inmuebles */}
        <StatCard
          label="Inmuebles"
          value={total}
          sub={`${occupied} ocupados · ${total - occupied} libres`}
          icon={<HouseIcon />}
          iconBg="bg-navy-50"
          iconColor="text-navy-600"
          href="/admin/propiedades"
        />

        {/* Contratos activos */}
        <StatCard
          label="Contratos activos"
          value={activeContracts ?? 0}
          icon={<ContractIcon />}
          iconBg="bg-lime-100"
          iconColor="text-navy-700"
          href="/admin/contratos"
        />

        {/* Arrendatarios */}
        <StatCard
          label="Arrendatarios"
          value={totalTenants ?? 0}
          icon={<UsersIcon />}
          iconBg="bg-navy-50"
          iconColor="text-navy-600"
          href="/admin/arrendatarios"
        />

        {/* Contratos por vencer */}
        <StatCard
          label="Por vencer (90 días)"
          value={endingSoon ?? 0}
          icon={<AlertIcon />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>
    </div>
  )
}
