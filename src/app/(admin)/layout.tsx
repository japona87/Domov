import { Sidebar } from '@/components/sidebar'
import { LogoutButton } from '@/components/logout-button'
import { NavigationOverlay } from '@/components/admin/navigation-overlay'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <NavigationOverlay />
      <Sidebar />
      <div className="ml-64">
        <header className="h-14 bg-white border-b border-border flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Panel de administración</div>
          <LogoutButton />
        </header>
        <main className="p-8 pt-7 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  )
}
