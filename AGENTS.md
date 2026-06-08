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
