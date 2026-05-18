import { LogoutButton } from '@/components/logout-button'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Domov — Administración</h1>
        <LogoutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
