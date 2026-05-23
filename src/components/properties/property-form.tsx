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
