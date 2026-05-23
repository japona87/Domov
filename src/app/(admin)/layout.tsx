import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6">
        <div className="flex items-center justify-between h-14">
          <span className="text-lg font-semibold text-slate-800">Domov</span>
          <nav className="flex items-center gap-1">
            <Link
              href="/admin/dashboard"
              className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/propiedades"
              className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Propiedades
            </Link>
          </nav>
          <LogoutButton />
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
