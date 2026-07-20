<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Session State

## Project
Domov — Admin panel for property management (arrendamientos). Next.js 16.2.6, Tailwind CSS 4, shadcn/ui (base-nova), Supabase SSR. DM Sans + DM Serif Display.

## Auth
- Supabase SSR with middleware at `src/proxy.ts` (protects routes by role).
- Server client uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` (RLS applies).
- Server-side `logout()` action in `src/lib/actions/auth.ts`.
- Login page: split-screen brand left + form right.

## Schema (from `supabase/migrations/001_initial_schema.sql`)
- `contracts` FK to `properties(id)` and `tenants(id)` — **NO ON DELETE CASCADE**.
- `payments`, `documents`, `insurance_policies` FK to `contracts(id)` — **NO ON DELETE CASCADE**.
- `property_owners` FK to `properties(id)` and `owners(id)` — **ON DELETE CASCADE**.
- `property_photos` FK to `properties(id)` — **ON DELETE CASCADE**.

## Modules Built
- Propiedades (CRUD, photos, toggle published)
- Propietarios (standalone CRUD + property-owners association)
- Arrendatarios (CRUD)
- Contratos (CRUD, payments, termination flow)
- Auditoría (all 18 server actions instrumented; `/admin/auditoria` with filters, pagination, expandable row changes, CSV export)

## Delete Logic (current)
- `deleteContract`: deletes payments → documents → insurance_policies → contract. No status restriction (any state deletable).
- `deleteTenant`: blocks if active/ending contracts exist; auto-deletes ended contracts + cascade before deleting tenant.
- `deleteProperty`: blocks if active/ending contracts exist; auto-deletes ended contracts + cascade before deleting property.
- `deleteOwner`: blocks if linked to any property via property_owners.

## Last Session
- MCP vision server configured at `~/.opencode/mcp.json` (needs restart to activate).
- Login page: logo enlarged (112×112 container, 80px logo), heading text-5xl, inputs h-12, form max-w-md.
- Brand panel: px-20, heading text-5xl, subtitle text-lg max-w-md.

## Session — 13 Jun 2026

### Gallery — Lightbox full-bleed
- `PropertyGallery.tsx`: full-bleed lightbox (100vw×100vh bg-black, object-cover with gradients)
- Mobile fix: `max-md:object-scale-down md:object-cover` to prevent cropping on mobile
- Removed intermediate grid overlay (click photo → lightbox directly)
- "Ver todas las fotos" opens lightbox at index 0
- Keyboard navigation: Escape closes, arrows prev/next

### DNS Changes (cPanel Zone Editor)
- `domov.co` A record → `76.76.21.21` (Vercel)
- `www.domov.co` CNAME → `cname.vercel-dns.com`
- `mail.domov.co` CNAME → `domov.co` (BROKEN — still a CNAME)
- MX record changed from `mail.domov.co` → `webmail.domov.co` (so email delivers to old server)
- `webmail.domov.co` A → `174.34.132.112` (old server — has the mail server)

### Middleware — Redirect domov.co → www.domov.co
- `src/proxy.ts`: added host check at top, redirects 301 to www.domov.co
- Matcher now includes `/` and `/propiedades/:path*`

### Admin User Created
- `avaldel@domov.co` created via Supabase Admin API
- Profile updated to role `admin`
- Password: `Legend87*`

### Email Accounts Problem (CRITICAL)
- User deleted all files from **home directory root** (not just `public_html`) in cPanel File Manager while removing old WordPress site
- This removed: `mail/` directory (all stored emails lost), cPanel account cache for Email Accounts
- Affected accounts: `japonte@domov.co`, `avaldel@domov.co`
- Email accounts exist in server DB but don't appear in cPanel UI
- Password auth broken for webmail/Outlook
- Ticket must be opened at `extranet.e-nova.host` (e-nova.host = e-digitalhosting)
- Request: restore home directory from backup + reactivate email accounts in WHM

### Email Config (Outlook/Clients)
- Until DNS fixed: use server IP `174.34.132.112` for IMAP (port 993 SSL) and SMTP (port 465 SSL)
- Username: `japonte@domov.co` (or `avaldel@domov.co`)

### Pending
- Ticket con e-nova.host para restaurar cuentas de correo y home directory
- Cambiar `mail.domov.co` de CNAME a A record → `174.34.132.112` (después que el hosting resuelva)
- Re-configurar Outlook con IP directa
- Agregar filtro antispam en cPanel (Powered by: Elementor → Delete)
- DNS propagation for domov.co A record still in progress (some ISPs/mobile carriers still see old IP 174.34.132.112)

## Session — 28 Jun 2026

### Buttons — PNG icons for list table actions
- `public/icons/edit.png` and `public/icons/delete.png` (icons8 color PNGs).
- All 4 list tables (Propiedades, Arrendatarios, Propietarios, Contratos) now use PNG icons instead of "Editar" / "Eliminar" text.
- `DeleteButton`: replaced inline SVG with `<Image>` from `next/image`.
- All edit links: replaced text with `<Image>` wrapped in `<Link>`, added `title` attribute for tooltip.

### Buttons — Neutral outline style
- All `variant="default"` buttons changed to `variant="outline"` (same as Fotos/Cancelar).
- Affected: "+ Nuevo X" buttons in all 4 list pages, "Guardar" buttons in all 4 forms.

### Form card width consistency
- Removed `max-w-2xl` / `max-w-lg` from PropertyForm, OwnerForm, TenantForm, ContractForm so all cards fill container width uniformly.

### Fotos button moved into PropertyForm
- Fotos button moved from page header into PropertyForm header row (order: Fotos → Guardar → Cancelar).
- Added `fotosHref` prop to `PropertyFormProps`.

### Contracts tab filter fix
- Reverted `properties!inner(name, address)` → `properties(name, address)` (inner joins broke Supabase `.or()` filtering).
- Reverted `tenants!inner(full_name)` → `tenants(full_name)`.

### Header text style
- Removed `uppercase` class from `<th>` in all 4 list tables so headers show "Inmueble" instead of "INMUEBLE".

### NavigationOverlay — search param fix
- Added `useSearchParams()` alongside `usePathname()` so overlay detects changes when only search params change (e.g., `?tab=active`).
- Click handler now compares against full URL (`pathname + search`) for same-page detection.
- Wrapped in `<Suspense>` boundaries in all 3 layouts.

### Deploy
- Commit `7f3754b` — gallery mobile fix
- Current commit — UI polish (icons, buttons, cards, table headers, nav overlay fix)
- Vercel production: https://domov.co (aliased, may still show old site on some devices until DNS propagates)
- Vercel CLI authed as `japona87`, team `jhonattan-s-projects2`

## Session — 29 Jun 2026

### Parent-child properties (garage ↔ apartment/parking)
- `parent_property_id` FK added to `properties` (self-referencing) via migration `017_parent_property_id.sql`.
- Dropdown "Vincular a un inmueble" only visible when property type is `garage`; switching away from `garage` clears the value.
- Parent dropdown excludes garages and properties already linked as children (`.is('parent_property_id', null).neq('type', 'garage')`).
- Parent rows: `bg-muted/30`. Child rows: `bg-white`.
- `deleteProperty` blocks deletion of parents that have children.
- Contracts list shows "+ Parqueadero X" when property has children.
- Contract form shows included parking spots when parent property selected.

### Summary cards by type
- New `PropertyTypeFilter` client component (`src/components/admin/property-type-filter.tsx`).
- Cards: Todos, Apartamentos, Casas, Oficinas, Locales, Garajes, Otros — with icons and counts.
- Click filters by type (`?type=X`), same card removes filter.
- Counts computed from full dataset (unfiltered).
- Orphan children (nested garages) are shown even when parent doesn't match filter.

### Row numbering
- New `#` column as first `<th>`, sequential numbering 1, 2, 3...

### Real-time search
- `SearchBar` now filters with 300ms debounce on keystroke (no need to press Enter).

### Deploy
- Commits: `c1a4cf2` (parent selector only for garage) → `24bcca4` (exclude garages from dropdown).
- Also: `297d68d` (summary cards + numbering + realtime search) → `c4db7d5` (orphan children fix).
- All pushed to GitHub and deployed to Vercel production.

## Session — 19 Jul 2026

### Property services — file upload fix
- RLS deshabilitado en `property_services` (SQL ejecutado manualmente).
- Subida de archivos migrada de server action a **client-side** (como contratos): `createClient()` de `@/lib/supabase/client` sube directo a Storage, luego `setServiceFileUrl` actualiza DB.
- Creado bucket `service-files` (`public: true`) + storage policies (admin ALL, owner SELECT).
- `uploadServiceFile` reemplazado por `setServiceFileUrl` (solo actualiza DB).
- `handleCreate`/`handleUpdate` ahora actualizan estado local inmediatamente (no dependen de `router.refresh()`).

### Fotos button removed from PropertyForm
- Eliminada prop `fotosHref`, botón y bloque `<Link>` de `property-form.tsx`.
- Ya hay tab Fotos en la navegación por tabs.

### Icon standardization — inline SVGs
- Arrendatarios, Propietarios, Contratos: edit buttons cambiados de `<Link>` a `<Button variant="ghost" size="sm" asChild>` con `text-accent hover:bg-accent/10` (idéntico a Propiedades).
- Contratos: color corregido de `text-blue-600` → `text-accent`.
- Servicios: edit button recibe `className="text-accent"`.
- Todos los SVG edit/delete: `width=20 height=20`, mismos paths.
- Creados `public/file-pdf.svg`, `public/file-image.svg`, `public/file-generic.svg` (iconos de archivo para servicios).
- Agregados PNGs: `public/icons/parking.png` (usado en PropertyTypeFilter Garajes), `public/icons/address.png`, `public/icons/edit.png`, `public/icons/delete.png`.

### Completeness report
- Nueva ruta `/admin/propiedades/reporte` — dashboard de completitud.
- Server action `getCompletenessReport()` en `src/lib/actions/report.ts`.
- Evalúa 10 campos por propiedad: Descripción, Chip, Matrícula, Precio, Administración, Mapa, Características, Fotos, Propietario, Servicios.
- Overall %, distribución por rango, tabla con barra de progreso y badges de faltantes.
- Botón "Reporte" en el header de la lista de propiedades.

### Supabase storage
- Plan: Gratuito (1 GB storage), usado 71.28 MB (7%).
- Bucket `service-files` creado con `public: true`.
- Storage policies creadas para admin y owner.
