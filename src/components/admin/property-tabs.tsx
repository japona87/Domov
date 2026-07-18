'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ADMIN_TABS = [
  { href: '/admin/propiedades', label: 'Volver', back: true },
  { href: '', label: 'Datos' },
  { href: '/propietarios', label: 'Propietarios' },
  { href: '/fotos', label: 'Fotos' },
  { href: '/servicios', label: 'Servicios' },
]

const OWNER_TABS = [
  { href: '/owner/propiedades', label: 'Volver', back: true },
  { href: '', label: 'Contrato' },
  { href: '/servicios', label: 'Servicios' },
]

export function PropertyTabs({ baseUrl, role = 'admin' }: { baseUrl: string; role?: 'admin' | 'owner' }) {
  const pathname = usePathname()
  const currentHref = pathname.replace(baseUrl, '') || ''
  const tabs = role === 'admin' ? ADMIN_TABS : OWNER_TABS

  return (
    <div className="flex gap-1 border-b border-border mb-6">
      {tabs.map((tab) => {
        const href = tab.back ? tab.href : `${baseUrl}${tab.href}`
        const isActive = tab.back ? false : currentHref === tab.href
        if (tab.back) {
          return (
            <Link
              key={tab.label}
              href={href}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors mr-3"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              {tab.label}
            </Link>
          )
        }
        return (
          <Link
            key={tab.label}
            href={href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              isActive
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
