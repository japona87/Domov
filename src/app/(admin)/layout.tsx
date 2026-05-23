import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SidebarNav } from '@/components/admin/sidebar-nav'
import { LogoutButton } from '@/components/logout-button'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const displayName = (profile as any)?.full_name ?? user.email ?? 'Admin'
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'A'

  return (
    <div className="flex min-h-screen bg-cream">
      {/* ── Sidebar ── */}
      <aside className="fixed top-0 left-0 w-[260px] h-screen bg-navy-900 flex flex-col z-50">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-navy-700">
          <Link href="/admin/dashboard" className="font-heading text-[1.375rem] text-white tracking-tight">
            Dom<span className="text-lime-500">ov</span>
          </Link>
          <p className="text-[0.6875rem] text-navy-400 mt-0.5">Panel de administración</p>
        </div>

        {/* Nav links — client component for active state */}
        <SidebarNav />

        {/* User row */}
        <div className="px-3 py-4 border-t border-navy-700 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-lime-500 flex items-center justify-center text-[0.8125rem] font-semibold text-navy-900 flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-navy-400">Administrador</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="ml-[260px] flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
