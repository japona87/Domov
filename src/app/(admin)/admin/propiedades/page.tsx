import Link from 'next/link'
import { Suspense, Fragment } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteButton } from '@/components/delete-button'
import { TogglePublished } from '@/components/admin/toggle-published'
import { SearchBar } from '@/components/admin/search-bar'
import { MapPreviewButton } from '@/components/admin/map-preview'
import { ToggleManaged } from '@/components/admin/toggle-managed'
import { PropertyTypeFilter } from '@/components/admin/property-type-filter'
import { deleteProperty } from '@/lib/actions/properties'

export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartamento',
  house: 'Casa',
  office: 'Oficina',
  local: 'Local',
  garage: 'Garaje',
  other: 'Otro',
}

type PropertyRow = {
  id: string
  name: string
  address: string
  type: string
  is_published: boolean
  managed_by_domov: boolean
  maps_url: string | null
  parent_property_id: string | null
  contracts: { id: string; status: string }[]
}

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>
}) {
  const { q, type } = await searchParams
  const supabase = await createClient()

  const [countResult, propertiesResult] = await Promise.all([
    supabase.from('properties').select('type'),
    supabase.from('properties').select('id, name, address, type, is_published, managed_by_domov, maps_url, parent_property_id, contracts(id, status)').order('name'),
  ])

  const countData = countResult.data as unknown as { type: string }[] | null
  const allProperties = propertiesResult.data as unknown as PropertyRow[] | null

  const typeCounts: Record<string, number> = {}
  for (const row of countData ?? []) {
    typeCounts[row.type] = (typeCounts[row.type] ?? 0) + 1
  }

  let filtered = allProperties ?? []

  if (q?.trim()) {
    const s = q.trim().toLowerCase()
    filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || p.address.toLowerCase().includes(s))
  }

  if (type?.trim()) {
    filtered = filtered.filter(p => p.type === type)
  }

  const properties = filtered
  const parentMap = new Map(properties.filter(p => !p.parent_property_id).map(p => [p.id, p]))
  const childrenMap = new Map<string, PropertyRow[]>()
  for (const p of properties) {
    if (p.parent_property_id) {
      const list = childrenMap.get(p.parent_property_id) ?? []
      list.push(p)
      childrenMap.set(p.parent_property_id, list)
    }
  }

  const domovCount = properties.filter(p => p.managed_by_domov).length

  function isOccupied(p: PropertyRow) {
    return p.contracts?.some((c) => ['active', 'ending'].includes(c.status))
  }

  function renderRow(p: PropertyRow, isChild = false, index: number | null) {
    const occupied = isOccupied(p)
    const parentName = p.parent_property_id ? parentMap.get(p.parent_property_id)?.name : null
    return (
      <tr key={p.id} className={`transition-colors ${!isChild ? 'bg-muted/30' : 'bg-white'} ${isChild ? 'border-t-0' : ''}`}>
        <td className="px-5 py-4 text-muted-foreground text-xs tabular-nums w-10">{index ?? ''}</td>
        <td className={`px-5 py-4 ${isChild ? 'pl-14' : ''}`}>
          <div className="flex items-center gap-2">
            {isChild && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground shrink-0 -ml-7">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
            )}
            <div>
              <p className={`font-medium ${isChild ? 'text-muted-foreground' : 'text-foreground'}`}>
                {isChild && <span className="text-muted-foreground/60 mr-1">🅿</span>}
                {p.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isChild && parentName ? `Incluido en ${parentName}` : p.address}
              </p>
            </div>
          </div>
        </td>
        <td className="px-5 py-4 text-muted-foreground">{TYPE_LABELS[p.type] ?? p.type}</td>
        <td className="px-5 py-4">
          <Badge variant={occupied ? 'default' : 'secondary'}>
            {occupied ? (isChild ? 'Ocupado (incluido)' : 'Ocupado') : 'Libre'}
          </Badge>
        </td>
        <td className="px-5 py-4">
            <TogglePublished propertyId={p.id} isPublished={p.is_published} />
        </td>
        <td className="px-5 py-4">
          {isChild ? (
            <span className="text-[11px] text-muted-foreground/60 italic">Heredado</span>
          ) : (
            <ToggleManaged propertyId={p.id} managed={p.managed_by_domov} disabled={!isOccupied(p)} />
          )}
        </td>
        <td className="px-5 py-4">
          <MapPreviewButton mapsUrl={p.maps_url} />
        </td>
        <td className="px-5 py-4 text-right">
          <Button variant="ghost" size="sm" asChild className="text-accent hover:text-accent hover:bg-accent/10">
            <Link href={`/admin/propiedades/${p.id}`} title="Editar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </Link>
          </Button>
        </td>
        <td className="px-5 py-4">
          <DeleteButton action={deleteProperty} id={p.id} />
        </td>
      </tr>
    )
  }

  const parents = properties.filter(p => !p.parent_property_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-sans font-semibold text-foreground">Propiedades</h2>
          <p className="text-sm text-muted-foreground mt-1">{properties.length} inmuebles registrados · {domovCount} administrados por Domov</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/propiedades/nueva">+ Nuevo inmueble</Link>
        </Button>
      </div>

      <Suspense fallback={null}>
        <PropertyTypeFilter counts={typeCounts} />
      </Suspense>

      <Suspense fallback={null}>
        <SearchBar placeholder="Buscar por nombre o dirección..." />
      </Suspense>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs tracking-wider w-10">#</th>
              <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs tracking-wider">Inmueble</th>
              <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs tracking-wider">Tipo</th>
              <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs tracking-wider">Estado</th>
              <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs tracking-wider">Publicado</th>
              <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs tracking-wider">Gestión</th>
              <th className="w-10 px-5 py-3.5"></th>
              <th className="px-5 py-3.5"></th>
              <th className="w-14 px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {parents.map((parent, idx) => (
              <Fragment key={parent.id}>
                {renderRow(parent, false, idx + 1)}
                {(childrenMap.get(parent.id) ?? []).map((child) => renderRow(child, true, null))}
              </Fragment>
            ))}
            {parents.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center text-muted-foreground">
                  {q?.trim() || type?.trim()
                    ? 'No se encontraron propiedades con esos criterios.'
                    : <>No hay propiedades.{' '}
                      <Link href="/admin/propiedades/nueva" className="text-accent hover:text-accent/80 font-medium">
                        Crear la primera
                      </Link>
                    </>
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
