# Plan 1: Infraestructura Base + Base de Datos + Autenticación

> **Para agentes:** REQUIRED SUB-SKILL: Usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar este plan tarea por tarea. Los pasos usan sintaxis checkbox (`- [ ]`) para seguimiento.

**Goal:** Inicializar el proyecto Next.js, crear el esquema completo de la base de datos en Supabase, e implementar autenticación con dos roles (admin y arrendatario) con protección de rutas.

**Architecture:** Next.js 14 App Router con grupos de rutas `(auth)`, `(admin)` y `(tenant)`. Supabase maneja autenticación y base de datos. Un `middleware.ts` central protege rutas según el rol del usuario almacenado en la tabla `profiles`.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase JS v2 (`@supabase/supabase-js`, `@supabase/ssr`), shadcn/ui

---

## Estructura de archivos

```
Domov/
├── .env.local                          ← variables privadas (NO commitear)
├── .env.example                        ← plantilla de variables
├── next.config.ts
├── tailwind.config.ts
├── components.json                     ← config shadcn/ui
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql      ← esquema completo de BD
├── src/
│   ├── middleware.ts                   ← protección de rutas por rol
│   ├── types/
│   │   └── database.ts                ← tipos TypeScript de todas las tablas
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts              ← cliente browser
│   │       └── server.ts             ← cliente server (SSR)
│   └── app/
│       ├── layout.tsx                 ← root layout
│       ├── page.tsx                   ← redirect a login
│       ├── (auth)/
│       │   ├── layout.tsx
│       │   └── login/
│       │       └── page.tsx           ← formulario de login
│       ├── (admin)/
│       │   ├── layout.tsx             ← verifica rol admin
│       │   └── dashboard/
│       │       └── page.tsx           ← dashboard placeholder admin
│       └── (tenant)/
│           ├── layout.tsx             ← verifica rol tenant
│           └── dashboard/
│               └── page.tsx           ← dashboard placeholder arrendatario
```

---

## Task 1: Inicializar proyecto Next.js

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Inicializar Next.js**

Ejecutar desde `/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov/`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

Cuando pregunte opciones, seleccionar:
- Would you like to use Turbopack? → **No**

- [ ] **Step 2: Instalar dependencias de Supabase y utilidades**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 3: Inicializar shadcn/ui**

```bash
npx shadcn@latest init
```

Seleccionar cuando pregunte:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

- [ ] **Step 4: Instalar componentes shadcn necesarios**

```bash
npx shadcn@latest add button card input label form toast badge separator
```

- [ ] **Step 5: Verificar que el servidor arranca**

```bash
npm run dev
```

Abrir http://localhost:3000. Esperado: página de bienvenida de Next.js.

- [ ] **Step 6: Commit inicial**

```bash
git init
echo ".env.local" >> .gitignore
git add .
git commit -m "feat: inicializar proyecto Next.js con Supabase y shadcn/ui"
```

---

## Task 2: Crear proyecto en Supabase y configurar variables de entorno

**Files:**
- Create: `.env.example`
- Create: `.env.local`

- [ ] **Step 1: Crear proyecto en Supabase**

1. Ir a https://supabase.com → Sign in → New project
2. Name: `domov-inmobiliaria`
3. Database password: guardar en lugar seguro
4. Region: **South America (São Paulo)**
5. Esperar que termine de provisionar (~2 minutos)

- [ ] **Step 2: Obtener credenciales**

En el dashboard de Supabase → Settings → API:
- Copiar `Project URL`
- Copiar `anon public` key
- Copiar `service_role` key (mantener privada)

- [ ] **Step 3: Crear `.env.example`**

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- [ ] **Step 4: Crear `.env.local` con valores reales**

```bash
# .env.local  (NO commitear — ya está en .gitignore)
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
```

- [ ] **Step 5: Commit**

```bash
git add .env.example
git commit -m "chore: agregar plantilla de variables de entorno"
```

---

## Task 3: Crear clientes de Supabase

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`

- [ ] **Step 1: Crear cliente browser (`client.ts`)**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Crear cliente server (`server.ts`)**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3: Crear tipos base de la base de datos (`database.ts`)**

```typescript
// src/types/database.ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type PropertyFeatures = {
  bedrooms?: number
  bathrooms?: number
  area_sqm?: number
  parking_spots?: number
  floor?: number
  [key: string]: Json | undefined
}

export type ContractStatus = 'active' | 'ending' | 'ended' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'overdue'
export type UserRole = 'admin' | 'tenant'
export type TerminationReason = 'non_renewal_admin' | 'non_renewal_tenant' | 'renewed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; role: UserRole; created_at: string }
        Insert: { id: string; role?: UserRole }
        Update: { role?: UserRole }
      }
      owners: {
        Row: { id: string; full_name: string; document_number: string | null; phone: string | null; email: string | null; created_at: string }
        Insert: { id?: string; full_name: string; document_number?: string; phone?: string; email?: string }
        Update: { full_name?: string; document_number?: string; phone?: string; email?: string }
      }
      properties: {
        Row: { id: string; name: string; address: string; type: string; description: string | null; features: PropertyFeatures; is_published: boolean; created_at: string }
        Insert: { id?: string; name: string; address: string; type: string; description?: string; features?: PropertyFeatures; is_published?: boolean }
        Update: { name?: string; address?: string; type?: string; description?: string; features?: PropertyFeatures; is_published?: boolean }
      }
      property_owners: {
        Row: { id: string; property_id: string; owner_id: string; ownership_pct: number; created_at: string }
        Insert: { id?: string; property_id: string; owner_id: string; ownership_pct?: number }
        Update: { ownership_pct?: number }
      }
      property_photos: {
        Row: { id: string; property_id: string; photo_url: string; is_cover: boolean; sort_order: number; created_at: string }
        Insert: { id?: string; property_id: string; photo_url: string; is_cover?: boolean; sort_order?: number }
        Update: { photo_url?: string; is_cover?: boolean; sort_order?: number }
      }
      tenants: {
        Row: { id: string; user_id: string | null; full_name: string; document_number: string | null; phone: string | null; email: string; created_at: string }
        Insert: { id?: string; user_id?: string; full_name: string; document_number?: string; phone?: string; email: string }
        Update: { user_id?: string; full_name?: string; document_number?: string; phone?: string; email?: string }
      }
      insurers: {
        Row: { id: string; name: string; contact_name: string | null; phone: string | null; email: string | null; created_at: string }
        Insert: { id?: string; name: string; contact_name?: string; phone?: string; email?: string }
        Update: { name?: string; contact_name?: string; phone?: string; email?: string }
      }
      contracts: {
        Row: { id: string; property_id: string; tenant_id: string; start_date: string; end_date: string; monthly_rent: number; administration_fee: number; ipc_rate: number; status: ContractStatus; termination_reason: TerminationReason | null; termination_notice_date: string | null; ended_at: string | null; notes: string | null; created_at: string }
        Insert: { id?: string; property_id: string; tenant_id: string; start_date: string; end_date: string; monthly_rent: number; administration_fee?: number; ipc_rate?: number; status?: ContractStatus; termination_reason?: TerminationReason; termination_notice_date?: string; ended_at?: string; notes?: string }
        Update: { monthly_rent?: number; administration_fee?: number; ipc_rate?: number; status?: ContractStatus; termination_reason?: TerminationReason; termination_notice_date?: string; ended_at?: string; notes?: string }
      }
      payments: {
        Row: { id: string; contract_id: string; amount: number; due_date: string; paid_date: string | null; status: PaymentStatus; receipt_url: string | null; notes: string | null; created_at: string }
        Insert: { id?: string; contract_id: string; amount: number; due_date: string; paid_date?: string; status?: PaymentStatus; receipt_url?: string; notes?: string }
        Update: { amount?: number; due_date?: string; paid_date?: string; status?: PaymentStatus; receipt_url?: string; notes?: string }
      }
      documents: {
        Row: { id: string; contract_id: string; type: string; file_url: string; uploaded_by: string | null; created_at: string }
        Insert: { id?: string; contract_id: string; type: string; file_url: string; uploaded_by?: string }
        Update: { type?: string; file_url?: string; uploaded_by?: string }
      }
      insurance_policies: {
        Row: { id: string; contract_id: string; insurer_id: string; policy_number: string | null; monthly_cost: number; start_date: string; end_date: string; created_at: string }
        Insert: { id?: string; contract_id: string; insurer_id: string; policy_number?: string; monthly_cost?: number; start_date: string; end_date: string }
        Update: { policy_number?: string; monthly_cost?: number; start_date?: string; end_date?: string }
      }
      system_config: {
        Row: { id: string; year: number; ipc_rate: number; min_wage_increase: number; renewal_notice_days: number; updated_at: string }
        Insert: { id?: string; year: number; ipc_rate?: number; min_wage_increase?: number; renewal_notice_days?: number }
        Update: { ipc_rate?: number; min_wage_increase?: number; renewal_notice_days?: number }
      }
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/ src/types/
git commit -m "feat: configurar clientes Supabase y tipos TypeScript"
```

---

## Task 4: Crear esquema de base de datos

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Crear el archivo de migración**

```sql
-- supabase/migrations/001_initial_schema.sql

-- Perfiles de usuario (roles)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'tenant' CHECK (role IN ('admin', 'tenant')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role) VALUES (NEW.id, 'tenant');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Propietarios
CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  document_number TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inmuebles
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('apartment', 'house', 'office', 'local', 'garage', 'other')),
  description TEXT,
  features JSONB DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Co-propiedad (N:M owners <-> properties)
CREATE TABLE property_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  ownership_pct NUMERIC(5,2) NOT NULL DEFAULT 100.00 CHECK (ownership_pct > 0 AND ownership_pct <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, owner_id)
);

-- Fotos de inmuebles
CREATE TABLE property_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_cover BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Arrendatarios
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  document_number TEXT,
  phone TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aseguradoras
CREATE TABLE insurers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contratos
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent NUMERIC(12,2) NOT NULL CHECK (monthly_rent > 0),
  administration_fee NUMERIC(12,2) DEFAULT 0 CHECK (administration_fee >= 0),
  ipc_rate NUMERIC(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ending', 'ended', 'cancelled')),
  termination_reason TEXT CHECK (termination_reason IN ('non_renewal_admin', 'non_renewal_tenant', 'renewed')),
  termination_notice_date DATE,
  ended_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pagos
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documentos del contrato
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pólizas de seguro
CREATE TABLE insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  insurer_id UUID NOT NULL REFERENCES insurers(id),
  policy_number TEXT,
  monthly_cost NUMERIC(12,2) DEFAULT 0 CHECK (monthly_cost >= 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración del sistema
CREATE TABLE system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE CHECK (year >= 2020),
  ipc_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  min_wage_increase NUMERIC(5,2) NOT NULL DEFAULT 0,
  renewal_notice_days INTEGER NOT NULL DEFAULT 120 CHECK (renewal_notice_days >= 30),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar config inicial para 2026
INSERT INTO system_config (year, ipc_rate, min_wage_increase, renewal_notice_days)
VALUES (2026, 5.20, 9.53, 120);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Helper: verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: obtener tenant_id del usuario actual
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
  SELECT id FROM tenants WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Admin: acceso total a todo
CREATE POLICY "admin_all_profiles" ON profiles FOR ALL USING (is_admin());
CREATE POLICY "admin_all_owners" ON owners FOR ALL USING (is_admin());
CREATE POLICY "admin_all_properties" ON properties FOR ALL USING (is_admin());
CREATE POLICY "admin_all_property_owners" ON property_owners FOR ALL USING (is_admin());
CREATE POLICY "admin_all_property_photos" ON property_photos FOR ALL USING (is_admin());
CREATE POLICY "admin_all_tenants" ON tenants FOR ALL USING (is_admin());
CREATE POLICY "admin_all_insurers" ON insurers FOR ALL USING (is_admin());
CREATE POLICY "admin_all_contracts" ON contracts FOR ALL USING (is_admin());
CREATE POLICY "admin_all_payments" ON payments FOR ALL USING (is_admin());
CREATE POLICY "admin_all_documents" ON documents FOR ALL USING (is_admin());
CREATE POLICY "admin_all_insurance_policies" ON insurance_policies FOR ALL USING (is_admin());
CREATE POLICY "admin_all_system_config" ON system_config FOR ALL USING (is_admin());

-- Tenant: solo puede leer su propio perfil
CREATE POLICY "tenant_own_profile" ON profiles FOR SELECT
  USING (id = auth.uid());

-- Tenant: solo puede leer sus contratos activos
CREATE POLICY "tenant_own_contracts" ON contracts FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Tenant: solo puede leer sus pagos
CREATE POLICY "tenant_own_payments" ON payments FOR SELECT
  USING (contract_id IN (SELECT id FROM contracts WHERE tenant_id = current_tenant_id()));

-- Tenant: solo puede leer sus documentos
CREATE POLICY "tenant_own_documents" ON documents FOR SELECT
  USING (contract_id IN (SELECT id FROM contracts WHERE tenant_id = current_tenant_id()));

-- Landing pública: inmuebles publicados visibles sin login
CREATE POLICY "public_published_properties" ON properties FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "public_property_photos" ON property_photos FOR SELECT
  USING (property_id IN (SELECT id FROM properties WHERE is_published = TRUE));

-- =============================================
-- STORAGE BUCKETS
-- =============================================

-- Bucket para documentos de contratos (privado)
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Bucket para comprobantes de pago (privado)
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

-- Bucket para fotos de inmuebles (público)
INSERT INTO storage.buckets (id, name, public) VALUES ('property-photos', 'property-photos', true);

-- Políticas de storage
CREATE POLICY "admin_documents" ON storage.objects FOR ALL
  USING (bucket_id = 'documents' AND is_admin());

CREATE POLICY "admin_receipts" ON storage.objects FOR ALL
  USING (bucket_id = 'receipts' AND is_admin());

CREATE POLICY "tenant_own_receipts" ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "admin_property_photos" ON storage.objects FOR ALL
  USING (bucket_id = 'property-photos' AND is_admin());

CREATE POLICY "public_property_photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');
```

- [ ] **Step 2: Ejecutar migración en Supabase**

1. Ir al dashboard de Supabase → SQL Editor
2. Copiar y pegar el contenido completo del archivo
3. Click en **Run**
4. Verificar que no haya errores
5. Ir a Table Editor → confirmar que las 12 tablas aparecen

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: crear esquema completo de base de datos con RLS y storage buckets"
```

---

## Task 5: Implementar middleware de autenticación

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Crear middleware**

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Rutas públicas: landing y login
  if (pathname === '/' || pathname.startsWith('/propiedades') || pathname.startsWith('/login')) {
    // Si ya está autenticado y va al login, redirigir a su dashboard
    if (user && pathname.startsWith('/login')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      const redirectTo = profile?.role === 'admin' ? '/admin/dashboard' : '/tenant/dashboard'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    return supabaseResponse
  }

  // Rutas protegidas: requieren autenticación
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Proteger rutas /admin — solo admins
  if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/tenant/dashboard', request.url))
  }

  // Proteger rutas /tenant — solo tenants (o admin que accede por error)
  if (pathname.startsWith('/tenant') && profile?.role !== 'tenant') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: middleware de autenticación con RBAC por rol"
```

---

## Task 6: Crear página de login

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Crear root redirect (`src/app/page.tsx`)**

```typescript
// src/app/page.tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/login')
}
```

- [ ] **Step 2: Crear layout del grupo auth**

```typescript
// src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Crear página de login**

```typescript
// src/app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    // Obtener rol para redirigir
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/tenant/dashboard')
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Domov</CardTitle>
        <CardDescription>Ingresa a tu portal de arrendamientos</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/
git commit -m "feat: página de login con autenticación Supabase"
```

---

## Task 7: Crear dashboards placeholder por rol

**Files:**
- Create: `src/app/(admin)/layout.tsx`
- Create: `src/app/(admin)/dashboard/page.tsx`
- Create: `src/app/(tenant)/layout.tsx`
- Create: `src/app/(tenant)/dashboard/page.tsx`
- Create: `src/components/logout-button.tsx`

- [ ] **Step 1: Crear componente de logout**

```typescript
// src/components/logout-button.tsx
'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      Cerrar sesión
    </Button>
  )
}
```

- [ ] **Step 2: Crear layout admin**

```typescript
// src/app/(admin)/layout.tsx
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
```

- [ ] **Step 3: Crear dashboard admin placeholder**

```typescript
// src/app/(admin)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500">Bienvenido, {user?.email}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-slate-500">Inmuebles</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">—</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-slate-500">Contratos activos</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">—</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-slate-500">Pagos pendientes</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">—</p></CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="pt-6">
          <p className="text-slate-400 text-center">
            Módulos en construcción — Plan 2: Propiedades → Plan 3: Contratos → Plan 4: Portal
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Crear layout tenant**

```typescript
// src/app/(tenant)/layout.tsx
import { LogoutButton } from '@/components/logout-button'

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Domov — Mi Portal</h1>
        <LogoutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 5: Crear dashboard tenant placeholder**

```typescript
// src/app/(tenant)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function TenantDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Mi Portal</h2>
        <p className="text-slate-500">Bienvenido, {user?.email}</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <p className="text-slate-400 text-center">
            Tu portal está en construcción. Pronto podrás ver tus pagos, contrato y más.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/(admin)/ src/app/(tenant)/ src/components/logout-button.tsx
git commit -m "feat: dashboards placeholder para admin y arrendatario"
```

---

## Task 8: Crear usuario admin en Supabase

**Files:** ninguno (acción en dashboard Supabase)

- [ ] **Step 1: Crear el usuario admin**

1. Ir a Supabase dashboard → Authentication → Users
2. Click **Add user** → **Create new user**
3. Email: el correo del administrador (ej. `admin@domov.co`)
4. Password: contraseña segura
5. Click **Create user**

- [ ] **Step 2: Asignar rol admin**

1. Ir a Supabase → SQL Editor
2. Ejecutar (reemplazar el email real):

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@domov.co');
```

3. Verificar con:

```sql
SELECT u.email, p.role
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE u.email = 'admin@domov.co';
```

Resultado esperado: `role = admin`

- [ ] **Step 3: Probar el login completo**

1. Ir a http://localhost:3000
2. Debería redirigir a `/login`
3. Ingresar con el email y password del admin
4. Debería redirigir a `/admin/dashboard`
5. Verificar que aparece "Domov — Administración" en el header

- [ ] **Step 4: Commit final del plan 1**

```bash
git add .
git commit -m "feat: plan 1 completo — infraestructura, BD, autenticación y RBAC"
```

---

## Verificación final del Plan 1

Antes de dar por terminado este plan, verificar:

- [ ] `npm run build` no produce errores de TypeScript
- [ ] La app en `http://localhost:3000` redirige a `/login`
- [ ] Un usuario admin puede loguearse y llegar a `/admin/dashboard`
- [ ] Una URL como `/admin/dashboard` sin login redirige a `/login`
- [ ] Las 12 tablas existen en Supabase Table Editor
- [ ] Los 3 storage buckets existen: `documents`, `receipts`, `property-photos`
