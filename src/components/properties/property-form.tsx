// src/components/properties/property-form.tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { LoadingOverlay } from '@/components/admin/loading-overlay'
import type { Database, PropertyFeatures } from '@/types/database'

function formatPrice(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('es-CO')
}

function parsePrice(formatted: string): number {
  return Number(formatted.replace(/\./g, ''))
}

type Property = Database['public']['Tables']['properties']['Row']

interface FieldConfig {
  id: string
  property_type: string
  field_key: string
  field_label: string
  placeholder: string
  field_type: string
  sort_order: number
  is_active: boolean
}

interface PropertyFormProps {
  property?: Property
  onSubmit: (formData: FormData) => Promise<void>
  featureConfigs: FieldConfig[]
  cancelHref?: string
  fotosHref?: string
}

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartamento' },
  { value: 'house', label: 'Casa' },
  { value: 'office', label: 'Oficina' },
  { value: 'local', label: 'Local comercial' },
  { value: 'garage', label: 'Garaje' },
  { value: 'other', label: 'Otro' },
]

export function PropertyForm({ property, onSubmit, featureConfigs, cancelHref = '/admin/propiedades', fotosHref }: PropertyFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [currentType, setCurrentType] = useState(property?.type ?? 'apartment')
  const [showMapHelp, setShowMapHelp] = useState(false)
  const [mapsUrl, setMapsUrl] = useState((property as (typeof property & { maps_url?: string | null }))?.maps_url ?? '')
  const features = (property?.features ?? {}) as PropertyFeatures
  const [monthlyPrice, setMonthlyPrice] = useState(
    property?.monthly_price ? property.monthly_price.toLocaleString('es-CO') : ''
  )
  const [adminFee, setAdminFee] = useState(
    property?.administration_fee ? property.administration_fee.toLocaleString('es-CO') : ''
  )

  const mapsUrlValid = !mapsUrl || mapsUrl.startsWith('https://www.google.com/maps/embed')

  const visibleFields = featureConfigs.filter((f) => f.property_type === currentType && f.is_active)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('monthly_price', monthlyPrice ? String(parsePrice(monthlyPrice)) : '')
    formData.set('administration_fee', adminFee ? String(parsePrice(adminFee)) : '')
    startTransition(async () => {
      try {
        await onSubmit(formData)
        toast.success(property ? 'Inmueble actualizado' : 'Inmueble creado')
      } catch (e) {
        if (e instanceof Error && 'digest' in e && typeof e.digest === 'string' && e.digest.startsWith('NEXT_REDIRECT')) return
        toast.error('Error al guardar el inmueble')
      }
    })
  }

  return (
    <>
      <LoadingOverlay pending={isPending} message={property ? 'Actualizando inmueble...' : 'Creando inmueble...'} />
      <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Información básica</h3>
          <div className="flex items-center gap-2">
            {fotosHref && (
              <Link href={fotosHref}>
                <Button type="button" variant="outline">Fotos</Button>
              </Link>
            )}
            <Button type="submit" variant="outline" disabled={isPending}>
              {isPending ? 'Guardando...' : (property ? 'Guardar cambios' : 'Crear inmueble')}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push(cancelHref)}>
              Cancelar
            </Button>
          </div>
        </div>

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
            value={currentType}
            onChange={(e) => setCurrentType(e.target.value)}
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
        <h3 className="font-semibold text-slate-800">Datos Catastrales</h3>
        <p className="text-xs text-muted-foreground">Estos datos son internos y no se muestran en la landing pública.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="chip">Chip</Label>
            <Input id="chip" name="chip" defaultValue={(property as Record<string, unknown>)?.chip as string | undefined} placeholder="AAAA-0000-0000-000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="matricula">Matrícula inmobiliaria</Label>
            <Input id="matricula" name="matricula" defaultValue={(property as Record<string, unknown>)?.matricula as string | undefined} placeholder="350-123456" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-semibold text-slate-800">Características</h3>
        {visibleFields.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay características configuradas para este tipo.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {visibleFields.map((f) => (
              <div key={f.field_key} className="space-y-2">
                <Label htmlFor={f.field_key}>{f.field_label}</Label>
                {f.field_key === 'estrato' ? (
                  <Input
                    id={f.field_key}
                    name={f.field_key}
                    type="number"
                    min="1"
                    max="6"
                    defaultValue={features[f.field_key as keyof PropertyFeatures] as number | undefined}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <Input
                    id={f.field_key}
                    name={f.field_key}
                    type={f.field_type}
                    min={f.field_type === 'number' ? '0' : undefined}
                    step={f.field_type === 'number' ? '0.01' : undefined}
                    defaultValue={features[f.field_key as keyof PropertyFeatures] as number | undefined}
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent shrink-0">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <h3 className="font-semibold text-slate-800">Ubicación en mapa</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowMapHelp((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
            </svg>
            ¿Cómo obtengo esta URL?
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className={`transition-transform duration-200 ${showMapHelp ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>

        {showMapHelp && (
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-3">
            <p className="text-xs font-semibold text-foreground">Cómo obtener el mapa de Google Maps:</p>
            <div className="space-y-2.5">
              {[
                'Busca la dirección del inmueble en Google Maps',
                'Click en "Compartir" → pestaña "Insertar un mapa"',
                'Click en "Copiar HTML" — copia todo el código que aparece',
                'Pégalo en el campo de abajo — el sistema extrae el URL solo',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border bg-background px-3 py-2.5 space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground">Puedes pegar el iframe completo o solo el URL:</p>
              <p className="text-[10px] font-mono leading-relaxed break-all">
                <span className="text-muted-foreground/50">{'<iframe src="'}</span>
                <span className="text-accent font-semibold">https://www.google.com/maps/embed?pb=!1m18…</span>
                <span className="text-muted-foreground/50">{'" …></iframe>'}</span>
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="maps_url">URL del mapa embebido</Label>
          <textarea
            id="maps_url"
            name="maps_url"
            value={mapsUrl}
            onChange={(e) => {
              const val = e.target.value.trim()
              const srcMatch = val.match(/src="([^"]+)"/)
              setMapsUrl(srcMatch ? srcMatch[1] : val)
            }}
            rows={3}
            className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono text-xs transition-colors ${
              mapsUrlValid ? 'border-input' : 'border-destructive focus-visible:ring-destructive'
            }`}
            placeholder="https://www.google.com/maps/embed?pb=!1m18!..."
          />
          {!mapsUrlValid && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-destructive shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
              </svg>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-destructive">URL inválida</p>
                <p className="text-xs text-muted-foreground">
                  Pega solo el valor del atributo <code className="bg-muted px-1 rounded">src</code>, no el iframe completo. Debe comenzar con{' '}
                  <span className="font-mono text-[10px]">https://www.google.com/maps/embed</span>
                </p>
              </div>
            </div>
          )}
          {mapsUrl && mapsUrlValid && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              URL válida — el mapa se mostrará en la landing
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-semibold text-slate-800">Precio de referencia</h3>
        <p className="text-xs text-muted-foreground">Estos valores se muestran en la landing pública.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthly_price">Precio de arriendo mensual</Label>
            <Input
              id="monthly_price"
              name="monthly_price"
              type="text"
              inputMode="numeric"
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(formatPrice(e.target.value))}
              placeholder="Ej: 1.500.000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="administration_fee">Administración</Label>
            <Input
              id="administration_fee"
              name="administration_fee"
              type="text"
              inputMode="numeric"
              value={adminFee}
              onChange={(e) => setAdminFee(formatPrice(e.target.value))}
              placeholder="Ej: 250.000"
            />
          </div>
        </div>
      </div>

      </form>
    </>
  )
}
