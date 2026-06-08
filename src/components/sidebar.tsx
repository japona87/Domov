'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { href: '/admin/propiedades', label: 'Propiedades', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { href: '/admin/propietarios', label: 'Propietarios', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
  { href: '/admin/arrendatarios', label: 'Arrendatarios', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' },
  { href: '/admin/contratos', label: 'Contratos', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
  { href: '/admin/auditoria', label: 'Auditoría', icon: 'M12 8v4l3 3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  { href: '/admin/configuracion', label: 'Configuración', icon: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' },
  { href: '/admin/configuracion/storage', label: 'Almacenamiento', icon: 'M20.94 11A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19a7 7 0 1 1 0-14 7 7 0 0 1 0 14z' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed top-0 left-0 w-64 h-screen bg-[#151c2a] border-r border-white/[0.08] z-50 flex flex-col">
      <div className="px-5 py-5 border-b border-white/[0.08]">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <img src="/logo-domov.png" alt="Domov" className="h-7 w-auto block" />
          <div>
            <span className="font-heading text-base font-bold text-white tracking-tight">Domov</span>
            <p className="text-[0.65rem] text-white/30 leading-tight font-medium uppercase tracking-wider">Administración</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 pl-3 pr-0 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 pl-3 pr-3 py-2.5 text-sm transition-all duration-150',
                isActive
                  ? 'rounded-l-lg bg-accent/[0.12] text-white font-semibold border-r-[3px] border-accent'
                  : 'rounded-lg text-white/45 hover:bg-white/[0.06] hover:text-white/75'
              )}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn(isActive ? 'text-accent' : 'text-white/30')}
              >
                <path d={item.icon} />
                {item.href === '/admin/propiedades' && <polyline points="9 22 9 12 15 12 15 22" />}
                {item.href === '/admin/propietarios' && <circle cx="9" cy="7" r="4" />}
                {item.href === '/admin/arrendatarios' && <><circle cx="9" cy="7" r="4" /><circle cx="17" cy="7" r="4" /></>}
                {item.href === '/admin/contratos' && <polyline points="14 2 14 8 20 8" />}
                {item.href === '/admin/auditoria' && <polyline points="12 8 12 12 14 14" />}
                {item.href === '/admin/configuracion' && <circle cx="12" cy="12" r="3" />}
              </svg>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
