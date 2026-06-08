import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'
import { NavigationOverlay } from '@/components/admin/navigation-overlay'

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <NavigationOverlay />
      <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-10">
        <Link href="/owner/dashboard" className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <img src="/logo-domov.png" alt="Domov" className="h-4.5 w-auto block brightness-0 invert" />
          </span>
          <span className="font-sans font-semibold text-base text-foreground">Domov — Propietarios</span>
        </Link>
        <LogoutButton />
      </header>
      <main className="p-6 max-w-5xl mx-auto">{children}</main>
    </div>
  )
}
