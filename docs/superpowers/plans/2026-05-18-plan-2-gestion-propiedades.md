# Plan 2: Gestión de Propiedades Implementation Plan

> **Para agentes:** REQUIRED SUB-SKILL: Usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar este plan tarea por tarea. Los pasos usan sintaxis checkbox (`- [ ]`) para seguimiento.

**Goal:** Construir el módulo completo de gestión de propiedades: CRUD de inmuebles con características dinámicas, propietarios con co-propiedad, subida de fotos a Supabase Storage, y landing pública para compartir con interesados.

**Architecture:** Server Actions de Next.js 14 para mutaciones (crear/editar/eliminar). Server Components para lectura de datos. Client Components solo donde se requiere interactividad (foto upload, formularios con validación). Supabase Storage para fotos con URLs públicas. Las rutas admin siguen el patrón establecido: `src/app/(admin)/admin/<ruta>/`.

**Tech Stack:** Next.js 14 App Router, Supabase JS v2, Supabase Storage, `next/image`, shadcn/ui, Tailwind CSS, TypeScript

---

## Estructura de archivos

```
src/
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx                                    ← MODIFY: agregar nav links
│   │   └── admin/
│   │       ├── dashboard/page.tsx                        ← MODIFY: conteos reales de BD
│   │       └── propiedades/
│   │           ├── page.tsx                              ← CREATE: lista con estado libre/ocupado
│   │           ├── nueva/
│   │           │   └── page.tsx                          ← CREATE: formulario crear inmueble
│   │           └── [id]/
│   │               ├── page.tsx                          ← CREATE: editar inmueble + propietarios
│   │               └── fotos/
│   │                   └── page.tsx                      ← CREATE: gestión de fotos
│   └── propiedades/
│       └── page.tsx                                      ← CREATE: landing pública sin login
├── components/
│   └── properties/
│       ├── property-form.tsx                             ← CREATE: formulario reutilizable (create/edit)
│       ├── owners-manager.tsx                            ← CREATE: UI agregar/quitar propietarios
│       └── photo-uploader.tsx                            ← CREATE: upload client-side a Supabase Storage
└── lib/
    └── actions/
        └── properties.ts                                 ← CREATE: server actions CRUD
```

**Convención de rutas del proyecto** (establecida en Plan 1):
- El route group `(admin)` no agrega segmento de URL. Para que la URL sea `/admin/propiedades`, el archivo debe estar en `src/app/(admin)/admin/propiedades/page.tsx`.
- Los `params` de páginas dinámicas son `Promise<{ id: string }>` en esta versión de Next.js — siempre usar `await params`.

---

## Task 1: Navegación admin

**Files:**
- Modify: `src/app/(admin)/layout.tsx`

- [ ] **Step 1: Actualizar el layout admin con navegación**

Reemplazar el contenido completo de `src/app/(admin)/layout.tsx`:

```tsx
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
```

- [ ] **Step 2: Verificar build**

```bash
cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npm run build
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/app/(admin)/layout.tsx
git commit -m "feat: agregar navegación al layout admin"
```

---

## Task 2: Server actions de propiedades

**Files:**
- Create: `src/lib/actions/properties.ts`

- [ ] **Step 1: Crear directorio y archivo de server actions**

```bash
mkdir -p "src/lib/actions"
```

Crear `src/lib/actions/properties.ts` con el siguiente contenido:

```typescript
// src/lib/actions/properties.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { PropertyFeatures } from '@/types/database'

function extractFeatures(formData: FormData): PropertyFeatures {
  const features: PropertyFeatures = {}
  const bedrooms = formData.get('bedrooms')
  const bathrooms = formData.get('bathrooms')
  const area_sqm = formData.get('area_sqm')
  const parking_spots = formData.get('parking_spots')
  const floor = formData.get('floor')
  if (bedrooms && String(bedrooms) !== '') features.bedrooms = Number(bedrooms)
  if (bathrooms && String(bathrooms) !== '') features.bathrooms = Number(bathrooms)
  if (area_sqm && String(area_sqm) !== '') features.area_sqm = Number(area_sqm)
  if (parking_spots && String(parking_spots) !== '') features.parking_spots = Number(parking_spots)
  if (floor && String(floor) !== '') features.floor = Number(floor)
  return features
}

export async function createProperty(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('properties').insert({
    name: String(formData.get('name')),
    address: String(formData.get('address')),
    type: String(formData.get('type')),
    description: formData.get('description') ? String(formData.get('description')) : null,
    features: extractFeatures(formData),
    is_published: formData.get('is_published') === 'true',
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/propiedades')
  redirect('/admin/propiedades')
}

export async function updateProperty(id: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('properties').update({
    name: String(formData.get('name')),
    address: String(formData.get('address')),
    type: String(formData.get('type')),
    description: formData.get('description') ? String(formData.get('description')) : null,
    features: extractFeatures(formData),
    is_published: formData.get('is_published') === 'true',
  }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/propiedades')
  revalidatePath(`/admin/propiedades/${id}`)
  revalidatePath('/propiedades')
}

export async function deleteProperty(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/propiedades')
  redirect('/admin/propiedades')
}

export async function togglePublished(id: string, isPublished: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('properties')
    .update({ is_published: isPublished })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/propiedades')
  revalidatePath('/propiedades')
}

export async function addPropertyOwner(
  propertyId: string,
  fullName: string,
  documentNumber: string,
  phone: string,
  email: string,
  ownershipPct: number
) {
  const supabase = await createClient()
  let ownerId: string

  const { data: existing } = await supabase
    .from('owners')
    .select('id')
    .eq('document_number', documentNumber)
    .single()

  if (existing) {
    ownerId = existing.id
  } else {
    const { data: newOwner, error } = await supabase
      .from('owners')
      .insert({ full_name: fullName, document_number: documentNumber || null, phone: phone || null, email: email || null })
      .select('id')
      .single()
    if (error || !newOwner) throw new Error(error?.message ?? 'Error creando propietario')
    ownerId = newOwner.id
  }

  const { error } = await supabase.from('property_owners').insert({
    property_id: propertyId,
    owner_id: ownerId,
    ownership_pct: ownershipPct,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/propiedades/${propertyId}`)
}

export async function removePropertyOwner(propertyOwnerId: string, propertyId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('property_owners').delete().eq('id', propertyOwnerId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/propiedades/${propertyId}`)
}

export async function addPropertyPhoto(propertyId: string, photoUrl: string, isCover: boolean) {
  const supabase = await createClient()
  if (isCover) {
    await supabase.from('property_photos')
      .update({ is_cover: false })
      .eq('property_id', propertyId)
  }
  const { error } = await supabase.from('property_photos').insert({
    property_id: propertyId,
    photo_url: photoUrl,
    is_cover: isCover,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/propiedades/${propertyId}/fotos`)
  revalidatePath('/propiedades')
}

export async function deletePropertyPhoto(photoId: string, photoPath: string, propertyId: string) {
  const supabase = await createClient()
  await supabase.storage.from('property-photos').remove([photoPath])
  const { error } = await supabase.from('property_photos').delete().eq('id', photoId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/propiedades/${propertyId}/fotos`)
  revalidatePath('/propiedades')
}

export async function setCoverPhoto(photoId: string, propertyId: string) {
  const supabase = await createClient()
  await supabase.from('property_photos')
    .update({ is_cover: false })
    .eq('property_id', propertyId)
  const { error } = await supabase.from('property_photos')
    .update({ is_cover: true })
    .eq('id', photoId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/propiedades/${propertyId}/fotos`)
  revalidatePath('/propiedades')
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npx tsc --noEmit
```

Esperado: sin errores de TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/
git commit -m "feat: server actions CRUD para propiedades"
```

---

## Task 3: Lista de propiedades admin

**Files:**
- Create: `src/app/(admin)/admin/propiedades/page.tsx`

- [ ] **Step 1: Crear la página de lista**

```bash
mkdir -p "src/app/(admin)/admin/propiedades"
```

Crear `src/app/(admin)/admin/propiedades/page.tsx`:

```tsx
// src/app/(admin)/admin/propiedades/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { togglePublished } from '@/lib/actions/properties'

export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartamento',
  house: 'Casa',
  office: 'Oficina',
  local: 'Local',
  garage: 'Garaje',
  other: 'Otro',
}

export default async function PropiedadesPage() {
  const supabase = await createClient()

  const { data: properties } = await supabase
    .from('properties')
    .select('id, name, address, type, is_published, contracts(id, status)')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Propiedades</h2>
          <p className="text-slate-500">{properties?.length ?? 0} inmuebles registrados</p>
        </div>
        <Button asChild>
          <Link href="/admin/propiedades/nueva">+ Nuevo inmueble</Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Inmueble</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Publicado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {properties?.map((p) => {
              const isOccupied = (p.contracts as { status: string }[] | null)?.some((c) =>
                ['active', 'ending'].includes(c.status)
              )
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{p.name}</p>
                    <p className="text-slate-400 text-xs">{p.address}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{TYPE_LABELS[p.type] ?? p.type}</td>
                  <td className="px-4 py-3">
                    <Badge variant={isOccupied ? 'default' : 'secondary'}>
                      {isOccupied ? 'Ocupado' : 'Libre'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <form action={togglePublished.bind(null, p.id, !p.is_published)}>
                      <button
                        type="submit"
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          p.is_published
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {p.is_published ? 'Publicado' : 'Oculto'}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/propiedades/${p.id}`}>Editar</Link>
                    </Button>
                  </td>
                </tr>
              )
            })}
            {(!properties || properties.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No hay propiedades.{' '}
                  <Link href="/admin/propiedades/nueva" className="text-blue-600 hover:underline">
                    Crear la primera
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npm run build
```

Esperado: sin errores, ruta `/admin/propiedades` aparece en el output.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(admin)/admin/propiedades/"
git commit -m "feat: lista de propiedades con estado de ocupación y toggle publicación"
```

---

## Task 4: Formulario de propiedades (crear)

**Files:**
- Create: `src/components/properties/property-form.tsx`
- Create: `src/app/(admin)/admin/propiedades/nueva/page.tsx`

- [ ] **Step 1: Crear el componente de formulario reutilizable**

```bash
mkdir -p src/components/properties
```

Crear `src/components/properties/property-form.tsx`:

```tsx
// src/components/properties/property-form.tsx
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Database, PropertyFeatures } from '@/types/database'

type Property = Database['public']['Tables']['properties']['Row']

interface PropertyFormProps {
  property?: Property
  onSubmit: (formData: FormData) => Promise<void>
}

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartamento' },
  { value: 'house', label: 'Casa' },
  { value: 'office', label: 'Oficina' },
  { value: 'local', label: 'Local comercial' },
  { value: 'garage', label: 'Garaje' },
  { value: 'other', label: 'Otro' },
]

const FEATURE_FIELDS = [
  { key: 'bedrooms', label: 'Habitaciones', placeholder: '3' },
  { key: 'bathrooms', label: 'Baños', placeholder: '2' },
  { key: 'area_sqm', label: 'Área (m²)', placeholder: '85' },
  { key: 'parking_spots', label: 'Parqueaderos', placeholder: '1' },
  { key: 'floor', label: 'Piso', placeholder: '4' },
]

export function PropertyForm({ property, onSubmit }: PropertyFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const features = (property?.features ?? {}) as PropertyFeatures

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await onSubmit(formData)
        toast.success(property ? 'Inmueble actualizado' : 'Inmueble creado')
      } catch {
        toast.error('Error al guardar el inmueble')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-semibold text-slate-800">Información básica</h3>

        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input id="name" name="name" defaultValue={property?.name} required placeholder="Apto 301 Torre A" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Dirección *</Label>
          <Input id="address" name="address" defaultValue={property?.address} required placeholder="Calle 45 # 12-34, Bogotá" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Tipo *</Label>
          <select
            id="type"
            name="type"
            defaultValue={property?.type ?? 'apartment'}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            name="description"
            defaultValue={property?.description ?? ''}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            placeholder="Descripción del inmueble..."
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_published_check"
            defaultChecked={property?.is_published ?? false}
            onChange={(e) => {
              const hidden = document.getElementById('is_published') as HTMLInputElement | null
              if (hidden) hidden.value = String(e.target.checked)
            }}
            className="h-4 w-4 rounded border-gray-300"
          />
          <input type="hidden" name="is_published" id="is_published" defaultValue={String(property?.is_published ?? false)} />
          <Label htmlFor="is_published_check" className="cursor-pointer font-normal">
            Publicar en la landing pública
          </Label>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-semibold text-slate-800">Características</h3>
        <div className="grid grid-cols-2 gap-4">
          {FEATURE_FIELDS.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label htmlFor={f.key}>{f.label}</Label>
              <Input
                id={f.key}
                name={f.key}
                type="number"
                min="0"
                step="0.01"
                defaultValue={features[f.key as keyof PropertyFeatures] as number | undefined}
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : property ? 'Guardar cambios' : 'Crear inmueble'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/propiedades')}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Crear la página de nuevo inmueble**

```bash
mkdir -p "src/app/(admin)/admin/propiedades/nueva"
```

Crear `src/app/(admin)/admin/propiedades/nueva/page.tsx`:

```tsx
// src/app/(admin)/admin/propiedades/nueva/page.tsx
import { createProperty } from '@/lib/actions/properties'
import { PropertyForm } from '@/components/properties/property-form'

export default function NuevaPropiedadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Nuevo inmueble</h2>
        <p className="text-slate-500">Completa la información del inmueble</p>
      </div>
      <PropertyForm onSubmit={createProperty} />
    </div>
  )
}
```

- [ ] **Step 3: Verificar build**

```bash
cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npm run build
```

Esperado: sin errores, ruta `/admin/propiedades/nueva` aparece.

- [ ] **Step 4: Commit**

```bash
git add src/components/properties/ "src/app/(admin)/admin/propiedades/nueva/"
git commit -m "feat: formulario de creación de inmueble"
```

---

## Task 5: Editar inmueble + gestión de propietarios

**Files:**
- Create: `src/components/properties/owners-manager.tsx`
- Create: `src/app/(admin)/admin/propiedades/[id]/page.tsx`

- [ ] **Step 1: Crear el componente de gestión de propietarios**

Crear `src/components/properties/owners-manager.tsx`:

```tsx
// src/components/properties/owners-manager.tsx
'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addPropertyOwner, removePropertyOwner } from '@/lib/actions/properties'
import { toast } from 'sonner'

interface PropertyOwner {
  id: string
  ownership_pct: number
  owners: { full_name: string; document_number: string | null } | null
}

interface OwnersManagerProps {
  propertyId: string
  owners: PropertyOwner[]
}

const EMPTY_FORM = { fullName: '', documentNumber: '', phone: '', email: '', ownershipPct: '100' }

export function OwnersManager({ propertyId, owners }: OwnersManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const totalPct = owners.reduce((sum, o) => sum + o.ownership_pct, 0)

  function handleAdd() {
    const pct = Number(form.ownershipPct)
    if (!form.fullName || pct <= 0 || pct > 100) {
      toast.error('Nombre y porcentaje válido son requeridos')
      return
    }
    if (totalPct + pct > 100) {
      toast.error(`El total superaría 100% (actual: ${totalPct}%)`)
      return
    }
    startTransition(async () => {
      try {
        await addPropertyOwner(propertyId, form.fullName, form.documentNumber, form.phone, form.email, pct)
        setForm(EMPTY_FORM)
        setShowForm(false)
        toast.success('Propietario agregado')
      } catch {
        toast.error('Error al agregar propietario')
      }
    })
  }

  function handleRemove(propertyOwnerId: string) {
    startTransition(async () => {
      try {
        await removePropertyOwner(propertyOwnerId, propertyId)
        toast.success('Propietario removido')
      } catch {
        toast.error('Error al remover propietario')
      }
    })
  }

  return (
    <div className="space-y-4">
      {owners.length > 0 ? (
        <div className="space-y-2">
          {owners.map((o) => (
            <div key={o.id} className="flex items-center justify-between bg-slate-50 rounded-md px-4 py-3">
              <div>
                <p className="font-medium text-slate-800">{o.owners?.full_name}</p>
                {o.owners?.document_number && (
                  <p className="text-xs text-slate-500">CC: {o.owners.document_number}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">{o.ownership_pct}%</span>
                <button
                  onClick={() => handleRemove(o.id)}
                  disabled={isPending}
                  className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-400 text-right">Total asignado: {totalPct}%</p>
        </div>
      ) : (
        <p className="text-slate-400 text-sm">Sin propietarios registrados.</p>
      )}

      {!showForm ? (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} disabled={totalPct >= 100}>
          + Agregar propietario
        </Button>
      ) : (
        <div className="border rounded-lg p-4 space-y-3 bg-slate-50">
          <h4 className="font-medium text-slate-700 text-sm">Nuevo propietario</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nombre completo *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cédula</Label>
              <Input
                value={form.documentNumber}
                onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                placeholder="12345678"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="3001234567"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="juan@ejemplo.com"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">% de propiedad *</Label>
              <Input
                type="number"
                min="1"
                max={100 - totalPct}
                value={form.ownershipPct}
                onChange={(e) => setForm({ ...form, ownershipPct: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={isPending}>
              {isPending ? 'Guardando...' : 'Agregar'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Crear la página de edición**

```bash
mkdir -p "src/app/(admin)/admin/propiedades/[id]"
```

Crear `src/app/(admin)/admin/propiedades/[id]/page.tsx`:

```tsx
// src/app/(admin)/admin/propiedades/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { PropertyForm } from '@/components/properties/property-form'
import { OwnersManager } from '@/components/properties/owners-manager'
import { updateProperty, deleteProperty } from '@/lib/actions/properties'

export const dynamic = 'force-dynamic'

export default async function EditarPropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (!property) notFound()

  const { data: propertyOwners } = await supabase
    .from('property_owners')
    .select('id, ownership_pct, owners(full_name, document_number)')
    .eq('property_id', id)

  const updateWithId = updateProperty.bind(null, id)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">
            <Link href="/admin/propiedades" className="hover:underline">Propiedades</Link> / Editar
          </p>
          <h2 className="text-2xl font-bold text-slate-800">{property.name}</h2>
          <p className="text-slate-500">{property.address}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/propiedades/${id}/fotos`}>Fotos</Link>
          </Button>
          <form action={deleteProperty.bind(null, id)}>
            <Button variant="destructive" size="sm" type="submit">
              Eliminar
            </Button>
          </form>
        </div>
      </div>

      <PropertyForm property={property} onSubmit={updateWithId} />

      <div className="bg-white rounded-lg border p-6 space-y-4 max-w-2xl">
        <h3 className="font-semibold text-slate-800">Propietarios</h3>
        <OwnersManager
          propertyId={id}
          owners={(propertyOwners ?? []) as {
            id: string
            ownership_pct: number
            owners: { full_name: string; document_number: string | null } | null
          }[]}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar build**

```bash
cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npm run build
```

Esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/components/properties/owners-manager.tsx "src/app/(admin)/admin/propiedades/[id]/"
git commit -m "feat: edición de inmueble y gestión de propietarios con co-propiedad"
```

---

## Task 6: Subida de fotos

**Files:**
- Modify: `next.config.ts`
- Create: `src/components/properties/photo-uploader.tsx`
- Create: `src/app/(admin)/admin/propiedades/[id]/fotos/page.tsx`

- [ ] **Step 1: Configurar dominios de imagen en next.config.ts**

Leer y reemplazar `next.config.ts` con soporte para imágenes de Supabase Storage:

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'byipfqmnfbivdzsjemno.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 2: Crear el componente de subida de fotos**

Crear `src/components/properties/photo-uploader.tsx`:

```tsx
// src/components/properties/photo-uploader.tsx
'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { addPropertyPhoto, deletePropertyPhoto, setCoverPhoto } from '@/lib/actions/properties'
import { toast } from 'sonner'

interface Photo {
  id: string
  photo_url: string
  is_cover: boolean
  sort_order: number
}

interface PhotoUploaderProps {
  propertyId: string
  photos: Photo[]
}

export function PhotoUploader({ propertyId, photos }: PhotoUploaderProps) {
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${propertyId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('property-photos')
        .upload(path, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('property-photos')
        .getPublicUrl(path)

      const isCover = photos.length === 0
      await addPropertyPhoto(propertyId, publicUrl, isCover)
      toast.success('Foto subida')
    } catch {
      toast.error('Error al subir la foto')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function handleDelete(photoId: string, photoUrl: string) {
    const pathPart = photoUrl.split('/property-photos/')[1]
    const path = pathPart?.split('?')[0]
    if (!path) {
      toast.error('No se puede determinar la ruta de la foto')
      return
    }
    startTransition(async () => {
      try {
        await deletePropertyPhoto(photoId, path, propertyId)
        toast.success('Foto eliminada')
      } catch {
        toast.error('Error al eliminar la foto')
      }
    })
  }

  function handleSetCover(photoId: string) {
    startTransition(async () => {
      try {
        await setCoverPhoto(photoId, propertyId)
        toast.success('Portada actualizada')
      } catch {
        toast.error('Error al actualizar portada')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group rounded-lg overflow-hidden border bg-slate-100 aspect-video"
          >
            <Image
              src={photo.photo_url}
              alt="Foto del inmueble"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
            {photo.is_cover && (
              <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                Portada
              </span>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {!photo.is_cover && (
                <button
                  onClick={() => handleSetCover(photo.id)}
                  disabled={isPending}
                  className="text-white text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Portada
                </button>
              )}
              <button
                onClick={() => handleDelete(photo.id, photo.photo_url)}
                disabled={isPending}
                className="text-white text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}

        <label
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg aspect-video cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors ${
            uploading ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <span className="text-2xl text-slate-400">+</span>
          <span className="text-xs text-slate-400 mt-1">
            {uploading ? 'Subiendo...' : 'Subir foto'}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>
      <p className="text-xs text-slate-400">
        La primera foto subida queda como portada automáticamente. Formatos: JPG, PNG, WebP.
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Crear la página de gestión de fotos**

```bash
mkdir -p "src/app/(admin)/admin/propiedades/[id]/fotos"
```

Crear `src/app/(admin)/admin/propiedades/[id]/fotos/page.tsx`:

```tsx
// src/app/(admin)/admin/propiedades/[id]/fotos/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { PhotoUploader } from '@/components/properties/photo-uploader'

export const dynamic = 'force-dynamic'

export default async function FotosPropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: property } = await supabase
    .from('properties')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!property) notFound()

  const { data: photos } = await supabase
    .from('property_photos')
    .select('id, photo_url, is_cover, sort_order')
    .eq('property_id', id)
    .order('sort_order')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/propiedades/${id}`}>← Volver</Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fotos</h2>
          <p className="text-slate-500">{property.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 max-w-3xl">
        <PhotoUploader propertyId={id} photos={photos ?? []} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verificar build**

```bash
cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npm run build
```

Esperado: sin errores, rutas `/admin/propiedades/[id]/fotos` aparece.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts src/components/properties/photo-uploader.tsx "src/app/(admin)/admin/propiedades/[id]/fotos/"
git commit -m "feat: subida y gestión de fotos de inmuebles con Supabase Storage"
```

---

## Task 7: Landing pública de propiedades

**Files:**
- Create: `src/app/propiedades/page.tsx`

- [ ] **Step 1: Crear la página pública**

```bash
mkdir -p src/app/propiedades
```

Crear `src/app/propiedades/page.tsx`:

```tsx
// src/app/propiedades/page.tsx
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import type { PropertyFeatures } from '@/types/database'

export const revalidate = 300

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartamento',
  house: 'Casa',
  office: 'Oficina',
  local: 'Local',
  garage: 'Garaje',
  other: 'Inmueble',
}

export default async function PropiedadesPublicasPage() {
  const supabase = await createClient()

  const [{ data: properties }, { data: activeContracts }] = await Promise.all([
    supabase
      .from('properties')
      .select('id, name, address, type, description, features, property_photos(photo_url, is_cover)')
      .eq('is_published', true)
      .order('name'),
    supabase
      .from('contracts')
      .select('property_id')
      .in('status', ['active', 'ending']),
  ])

  const occupiedSet = new Set(activeContracts?.map((c) => c.property_id) ?? [])
  const available = (properties ?? []).filter((p) => !occupiedSet.has(p.id))

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">Domov — Propiedades disponibles</h1>
          <a
            href="mailto:japonte@domov.co"
            className="text-sm text-blue-600 hover:underline"
          >
            Contactar
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {available.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg">No hay propiedades disponibles en este momento.</p>
            <p className="text-sm mt-2">
              Contáctanos en{' '}
              <a href="mailto:japonte@domov.co" className="text-blue-600 hover:underline">
                japonte@domov.co
              </a>
            </p>
          </div>
        ) : (
          <>
            <p className="text-slate-500 text-sm">{available.length} propiedad{available.length !== 1 ? 'es' : ''} disponible{available.length !== 1 ? 's' : ''}</p>
            <div className="grid gap-6 md:grid-cols-2">
              {available.map((property) => {
                const photos = property.property_photos as { photo_url: string; is_cover: boolean }[] | null
                const coverPhoto = photos?.find((p) => p.is_cover) ?? photos?.[0]
                const features = (property.features ?? {}) as PropertyFeatures

                return (
                  <div
                    key={property.id}
                    className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {coverPhoto ? (
                      <div className="relative h-48 bg-slate-200">
                        <Image
                          src={coverPhoto.photo_url}
                          alt={property.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-slate-200 flex items-center justify-center">
                        <span className="text-slate-400 text-sm">Sin fotos</span>
                      </div>
                    )}

                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-semibold text-slate-800">{property.name}</h2>
                        <Badge variant="secondary" className="shrink-0">
                          {TYPE_LABELS[property.type] ?? property.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">{property.address}</p>
                      {property.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">{property.description}</p>
                      )}
                      {Object.keys(features).length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {features.bedrooms !== undefined && (
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">{features.bedrooms} hab.</span>
                          )}
                          {features.bathrooms !== undefined && (
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">{features.bathrooms} baños</span>
                          )}
                          {features.area_sqm !== undefined && (
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">{features.area_sqm} m²</span>
                          )}
                          {features.parking_spots !== undefined && (
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">{features.parking_spots} parq.</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npm run build
```

Esperado: ruta `/propiedades` aparece como ISR (revalidate 300s).

- [ ] **Step 3: Commit**

```bash
git add src/app/propiedades/
git commit -m "feat: landing pública de propiedades disponibles"
```

---

## Task 8: Actualizar dashboard con conteos reales

**Files:**
- Modify: `src/app/(admin)/admin/dashboard/page.tsx`

- [ ] **Step 1: Actualizar la página del dashboard**

Reemplazar el contenido completo de `src/app/(admin)/admin/dashboard/page.tsx`:

```tsx
// src/app/(admin)/admin/dashboard/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { data: { user } },
    { count: totalProperties },
    { count: activeContracts },
    { count: pendingPayments },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('properties').select('*', { count: 'exact', head: true }),
    supabase.from('contracts').select('*', { count: 'exact', head: true }).in('status', ['active', 'ending']),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500">Bienvenido, {user?.email}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/propiedades">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">Inmuebles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalProperties ?? 0}</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Contratos activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeContracts ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Pagos pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingPayments ?? 0}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
cd "/Users/jhonattanapontenavarrete/Documents/Claude Code/Domov" && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(admin)/admin/dashboard/"
git commit -m "feat: dashboard con conteos reales de propiedades, contratos y pagos"
```

---

## Verificación final del Plan 2

- [ ] `npm run build` sin errores TypeScript
- [ ] `/admin/propiedades` muestra tabla con badge libre/ocupado y toggle de publicación
- [ ] Se puede crear un inmueble desde `/admin/propiedades/nueva`
- [ ] Se puede editar un inmueble y cambiar características
- [ ] Se pueden agregar y remover propietarios con porcentaje
- [ ] Se pueden subir fotos, cambiar portada y eliminar desde `/admin/propiedades/[id]/fotos`
- [ ] `/propiedades` (sin login) muestra solo inmuebles publicados sin contrato activo
- [ ] Dashboard muestra conteos reales (0 si no hay datos)
