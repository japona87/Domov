# Plan UI: Integración Design System Domov

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the Domov design mock into the Next.js app — fonts, color tokens, admin sidebar, public landing redesign, and propiedades page — without touching any business logic or server actions.

**Architecture:** Design tokens live in `tailwind.config.ts` (navy/lime color scales) and `src/app/globals.css` (CSS custom properties + shadcn variable overrides + font declarations). All existing shadcn components inherit the new palette automatically via CSS variable remapping. Admin layout switches from top-nav to fixed sidebar. Public pages get full redesign matching the mock.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS, shadcn/ui, `next/font/google` (DM Sans + DM Serif Display), design-mock at `design-mock/` folder.

**Reference:** Read `design-mock/css/style.css`, `design-mock/admin/index.html`, `design-mock/admin/propiedades.html`, `design-mock/index.html`, `design-mock/propiedades.html` for exact styles, class names, and component structure before implementing each task.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/globals.css` | Modify | CSS custom properties, shadcn variable overrides, font-face utilities |
| `tailwind.config.ts` | Modify | Extend with navy/lime color scales and font families |
| `src/app/layout.tsx` | Modify | Add next/font imports (DM Sans + DM Serif Display), apply to body |
| `src/app/(admin)/layout.tsx` | Rewrite | Sidebar nav with icons replacing top nav bar |
| `src/app/page.tsx` | Rewrite | Landing pública: hero, stats, value props, footer |
| `src/app/propiedades/page.tsx` | Modify | Property cards with new design, filter buttons |
| `src/app/(admin)/admin/dashboard/page.tsx` | Modify | Stat cards with new icon + color style |

---

### Task 1: Design Tokens — globals.css + Tailwind + Fonts

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Read current files before editing**

Read `src/app/globals.css`, `tailwind.config.ts`, and `src/app/layout.tsx` to understand current structure.

Also read `design-mock/css/style.css` lines 1–83 to capture all CSS custom properties.

- [ ] **Step 2: Update tailwind.config.ts**

Extend the theme with the navy and lime color scales from the design mock, plus the two font families:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#020D24',
          800: '#071F43',
          700: '#0D2D5A',
          600: '#1A3D72',
          500: '#2D528A',
          400: '#4A6FA3',
          300: '#7A96C0',
          200: '#AFC0DB',
          100: '#D6E0EF',
          50:  '#EDF1F7',
        },
        lime: {
          500: '#B6D436',
          400: '#C5DF5E',
          300: '#D4E986',
          200: '#E3F0AE',
          100: '#F0F6D4',
          50:  '#F8FBF0',
        },
        cream: {
          DEFAULT: '#F5F3EF',
          dark: '#E8E4DC',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

- [ ] **Step 3: Update globals.css**

Replace/extend `src/app/globals.css` with the design token CSS variables AND the shadcn variable overrides so shadcn components pick up the new palette. Keep the existing `@tailwind` directives at the top.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ── Domov Design Tokens ─────────────────────── */
    --color-navy-900: #020D24;
    --color-navy-800: #071F43;
    --color-navy-700: #0D2D5A;
    --color-navy-600: #1A3D72;
    --color-navy-500: #2D528A;
    --color-navy-400: #4A6FA3;
    --color-navy-300: #7A96C0;
    --color-navy-200: #AFC0DB;
    --color-navy-100: #D6E0EF;
    --color-navy-50:  #EDF1F7;

    --color-lime-500: #B6D436;
    --color-lime-400: #C5DF5E;
    --color-lime-100: #F0F6D4;

    --color-cream: #F5F3EF;
    --color-cream-dark: #E8E4DC;

    --color-success: #4A7C59;
    --color-success-light: #E8F5EC;
    --color-danger: #B4433C;
    --color-danger-light: #FDE8E7;
    --color-warning: #D4942B;
    --color-warning-light: #FEF3D6;

    --transition-fast: 150ms ease;
    --transition-base: 250ms ease;

    /* ── shadcn variable overrides ───────────────── */
    --background: 37 20% 95%;       /* cream */
    --foreground: 222 60% 12%;      /* navy-900 */
    --card: 0 0% 100%;
    --card-foreground: 222 60% 12%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 60% 12%;
    --primary: 217 73% 15%;         /* navy-800 */
    --primary-foreground: 0 0% 100%;
    --secondary: 213 43% 94%;       /* navy-50 */
    --secondary-foreground: 217 55% 27%;
    --muted: 37 15% 90%;
    --muted-foreground: 215 16% 47%;
    --accent: 74 63% 52%;           /* lime-500 */
    --accent-foreground: 222 60% 12%;
    --destructive: 3 51% 47%;       /* danger */
    --destructive-foreground: 0 0% 100%;
    --border: 37 15% 86%;
    --input: 37 15% 86%;
    --ring: 74 63% 52%;             /* lime-500 */
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-cream text-foreground;
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
  }
}
```

- [ ] **Step 4: Update src/app/layout.tsx to load fonts**

```tsx
import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-heading',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Domov — Gestión Inmobiliaria',
  description: 'Portal de gestión inmobiliaria',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${dmSans.variable} ${dmSerifDisplay.variable}`}>
      <body>
        {children}
        <Toaster richColors />
      </body>
    </html>
  )
}
```

(Read the current layout.tsx first — preserve any existing metadata or Toaster configuration, just add the font imports and variables.)

- [ ] **Step 5: Verify TypeScript compilation**

Run: `cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css tailwind.config.ts src/app/layout.tsx
git commit -m "feat: add Domov design tokens, navy/lime palette, DM Sans + DM Serif fonts"
```

---

### Task 2: Admin Sidebar Layout

**Files:**
- Rewrite: `src/app/(admin)/layout.tsx`

- [ ] **Step 1: Read current admin layout**

Read `src/app/(admin)/layout.tsx` and `design-mock/admin/index.html` to understand both the current nav structure and the target sidebar design.

- [ ] **Step 2: Replace admin layout with sidebar**

The sidebar is fixed left (260px wide), navy-900 background. The main content has `margin-left: 260px`. Use `usePathname()` for active link detection — this requires a client component for the sidebar nav.

Create two files:

**`src/components/admin/sidebar-nav.tsx`** (client component for active state):

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: '/admin/propiedades',
    label: 'Propiedades',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      </svg>
    ),
  },
  {
    href: '/admin/arrendatarios',
    label: 'Arrendatarios',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/admin/contratos',
    label: 'Contratos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[0.9375rem] transition-all duration-150 ${
              isActive
                ? 'bg-lime-500 text-navy-900 font-semibold'
                : 'text-navy-300 hover:bg-navy-700 hover:text-white'
            }`}
          >
            <span className={isActive ? 'text-navy-900' : 'text-navy-400 group-hover:text-white'}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
```

**`src/app/(admin)/layout.tsx`** (server component — imports SidebarNav):

```tsx
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

  const initials = (profile?.full_name ?? user.email ?? 'A')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 w-[260px] h-screen bg-navy-900 flex flex-col z-50">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-navy-700">
          <Link href="/admin/dashboard" className="font-heading text-[1.375rem] text-white tracking-tight">
            Dom<span className="text-lime-500">ov</span>
          </Link>
          <p className="text-[0.6875rem] text-navy-400 mt-0.5">Panel de administración</p>
        </div>

        {/* Nav */}
        <SidebarNav />

        {/* User */}
        <div className="px-3 py-4 border-t border-navy-700 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-lime-500 flex items-center justify-center text-[0.8125rem] font-semibold text-navy-900 flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.full_name ?? user.email}</p>
            <p className="text-xs text-navy-400">Administrador</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <div className="ml-[260px] flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Check if LogoutButton needs updating**

Read `src/components/logout-button.tsx`. If it renders text like "Cerrar sesión", update it to render only a small icon (SVG door/exit icon) so it fits in the sidebar user row without overflowing:

```tsx
// If it needs updating, change the button content to an icon:
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-navy-400 hover:text-white transition-colors">
  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
  <polyline points="16 17 21 12 16 7"/>
  <line x1="21" y1="12" x2="9" y2="12"/>
</svg>
```

- [ ] **Step 4: Verify TypeScript compilation**

Run: `cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 5: Commit**

```bash
git add src/app/(admin)/layout.tsx src/components/admin/sidebar-nav.tsx src/components/logout-button.tsx
git commit -m "feat: replace admin top-nav with navy sidebar with active link detection"
```

---

### Task 3: Landing Pública (página raíz)

**Files:**
- Rewrite: `src/app/page.tsx`

- [ ] **Step 1: Read design reference**

Read `design-mock/index.html` in full to capture all sections: navbar, hero, stats-bar, value-grid, properties section, footer.

Also read current `src/app/page.tsx` to understand what's there.

- [ ] **Step 2: Rewrite src/app/page.tsx**

This is a public server component. Replace with the full landing:

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 300

export default async function HomePage() {
  const supabase = await createClient()
  const { data: properties } = await supabase
    .from('properties')
    .select('id, name, address, type, features, property_photos(photo_url, is_cover)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="min-h-screen" style={{ fontFamily: 'var(--font-body)' }}>
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-800 h-[68px] flex items-center px-6">
        <div className="w-full max-w-[1280px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-heading text-2xl text-white tracking-tight">
            Dom<span className="text-lime-500">ov</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {[['/', 'Inicio'], ['/propiedades', 'Propiedades'], ['#nosotros', 'Nosotros'], ['#contacto', 'Contacto']].map(([href, label]) => (
              <Link key={href} href={href} className="text-[0.9375rem] text-navy-200 hover:text-white transition-colors relative group">
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-lime-500 transition-all duration-250 group-hover:w-full" />
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[0.9375rem] text-navy-200 hover:text-white transition-colors px-4 py-2">
              Ingresar
            </Link>
            <Link href="/propiedades" className="bg-navy-700 hover:bg-lime-500 hover:text-navy-900 text-white text-sm font-medium px-4 py-2 rounded-md transition-all duration-150">
              Ver propiedades
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-700 to-navy-800 flex items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-50" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}} />
        <div className="relative z-10 w-full max-w-[720px] mx-auto text-center px-6 py-8">
          <h1 className="font-heading text-[clamp(2.5rem,6vw,4rem)] text-white leading-[1.05] tracking-tight mb-6">
            Encuentra el hogar que mereces
          </h1>
          <p className="text-[1.125rem] text-navy-200 leading-relaxed mb-10 max-w-[520px] mx-auto">
            Gestión profesional de arriendos en Colombia. Confianza, transparencia y acompañamiento en cada etapa.
          </p>
          <div className="flex gap-3 max-w-[480px] mx-auto">
            <Link href="/propiedades" className="flex-1 bg-lime-500 hover:bg-lime-400 text-navy-900 font-semibold px-6 py-3.5 rounded-md transition-all duration-150 text-center">
              Ver propiedades disponibles
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white border-b border-cream-dark py-12">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              ['49+', 'Propiedades gestionadas'],
              ['100%', 'Transparencia en cada proceso'],
              ['15+', 'Años de experiencia'],
            ].map(([num, label], i) => (
              <div key={i} className="flex flex-col items-center">
                <p className="font-heading text-[2.75rem] text-navy-800 leading-none mb-2">{num}</p>
                <p className="text-[0.9375rem] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value Props ── */}
      <section className="py-20 bg-cream">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center max-w-[640px] mx-auto mb-12">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-lime-500 mb-3 flex items-center justify-center gap-2">
              <span className="w-6 h-[1.5px] bg-lime-500 inline-block" />
              Por qué elegirnos
              <span className="w-6 h-[1.5px] bg-lime-500 inline-block" />
            </p>
            <h2 className="font-heading text-[clamp(1.75rem,3vw,2.5rem)] text-navy-800 mb-4">Gestión que genera confianza</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Pagos al día', desc: 'Registro digital de cada cuota con comprobante. Sin papeles perdidos ni confusiones.' },
              { title: 'Contratos claros', desc: 'Seguimiento completo del ciclo de vida del contrato, renovaciones y terminaciones.' },
              { title: 'Propiedades actualizadas', desc: 'Inmuebles disponibles publicados en tiempo real con fotos y características.' },
            ].map((v, i) => (
              <div key={i} className="bg-white rounded-xl p-8 shadow-sm text-center">
                <div className="w-16 h-16 mx-auto mb-5 bg-navy-50 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-navy-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-heading text-[1.125rem] text-navy-800 mb-2">{v.title}</h3>
                <p className="text-[0.9375rem] text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-navy-900 text-navy-200 pt-16 pb-8">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="font-heading text-2xl text-white mb-4">Dom<span className="text-lime-500">ov</span></h3>
              <p className="text-[0.9375rem] leading-relaxed max-w-[320px]">
                Gestión inmobiliaria profesional. Administramos tu propiedad con transparencia y tecnología.
              </p>
            </div>
            <div>
              <h4 className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-white mb-5">Navegación</h4>
              <ul className="space-y-3">
                {[['/propiedades', 'Propiedades disponibles'], ['/login', 'Portal arrendatarios'], ['#contacto', 'Contacto']].map(([href, label]) => (
                  <li key={href}><Link href={href} className="text-[0.9375rem] text-navy-300 hover:text-lime-400 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div id="contacto">
              <h4 className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-white mb-5">Contacto</h4>
              <ul className="space-y-3 text-[0.9375rem] text-navy-300">
                <li>Colombia</li>
                <li>info@domov.co</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-navy-700 pt-8 flex items-center justify-between text-sm text-navy-400">
            <p>© 2026 Domov. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redesign public landing with navy/lime hero, stats, value props, footer"
```

---

### Task 4: Página Pública /propiedades

**Files:**
- Modify: `src/app/propiedades/page.tsx`

- [ ] **Step 1: Read current file and design reference**

Read `src/app/propiedades/page.tsx` and `design-mock/propiedades.html` to understand the current query logic (keep it intact) and the target card design.

- [ ] **Step 2: Apply new design to propiedades page**

Keep the existing Supabase query logic. Replace the page markup with the design system version — navbar matching landing, property cards grid, filter bar, footer. The card should show: cover photo, type badge, property name, address, features chips, and price in lime.

Key card structure:
```tsx
<div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-250">
  {/* photo */}
  <div className="relative h-[220px] overflow-hidden">
    {/* cover image or placeholder */}
    <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-navy-800 text-white">
      {property.type}
    </span>
  </div>
  {/* body */}
  <div className="p-5">
    <h3 className="font-heading text-[1.125rem] text-navy-800 mb-1">{property.name}</h3>
    <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
      {/* pin icon */} {property.address}
    </p>
    {/* features chips */}
    <div className="flex flex-wrap gap-1 pt-3 border-t border-cream-dark">
      {features.map(...)}
    </div>
  </div>
  <div className="px-5 py-4 border-t border-cream-dark flex items-center justify-between">
    <p className="font-heading text-[1.25rem] text-lime-500">
      ${monthly_rent?.toLocaleString('es-CO')} <span className="text-sm font-sans text-slate-400">/mes</span>
    </p>
    <Link href={`/propiedades/${property.id}`} className="text-sm text-navy-600 hover:text-navy-800 font-medium">
      Ver más →
    </Link>
  </div>
</div>
```

Include the same navbar and footer as the landing page.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/propiedades/page.tsx
git commit -m "feat: apply design system to public propiedades page — navy navbar, property cards"
```

---

### Task 5: Admin Dashboard — Stat Cards

**Files:**
- Modify: `src/app/(admin)/admin/dashboard/page.tsx`

- [ ] **Step 1: Read current file and design reference**

Read `src/app/(admin)/admin/dashboard/page.tsx` and `design-mock/admin/index.html` to understand the current stat data and the target card design.

- [ ] **Step 2: Apply stat card design**

Keep all existing Supabase count queries. Replace the card markup with the design system version:

```tsx
{/* Example stat card */}
<div className="bg-white rounded-xl p-6 shadow-sm">
  <div className="flex items-center justify-between mb-3">
    <span className="text-sm text-slate-500 font-medium">Inmuebles</span>
    <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center text-navy-600">
      {/* house icon */}
    </div>
  </div>
  <p className="font-heading text-4xl text-navy-800">{totalProperties}</p>
  <p className="text-xs text-slate-400 mt-1">{occupiedProperties} ocupados · {totalProperties - occupiedProperties} libres</p>
</div>
```

Use `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6` for the stat cards grid.

Add a topbar section at the top of the page (title + today's date):
```tsx
<div className="flex items-center justify-between mb-8">
  <h1 className="font-heading text-3xl text-navy-800">Dashboard</h1>
  <p className="text-sm text-slate-400">
    {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
  </p>
</div>
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/(admin)/admin/dashboard/page.tsx
git commit -m "feat: apply design system to admin dashboard — stat cards with icons and topbar"
```
