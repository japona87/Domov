import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteButton } from '@/components/delete-button'
import { TogglePublished } from '@/components/admin/toggle-published'
import { SearchBar } from '@/components/admin/search-bar'
import { MapPreviewButton } from '@/components/admin/map-preview'
import { ToggleManaged } from '@/components/admin/toggle-managed'
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
  contracts: { id: string; status: string }[]
}

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('properties')
    .select('id, name, address, type, is_published, managed_by_domov, maps_url, contracts(id, status)')

  if (q?.trim()) {
    const search = `%${q.trim()}%`
    query = query.or(`name.ilike.${search},address.ilike.${search}`)
  }

  const { data: properties } = await query.order('name') as { data: PropertyRow[] | null }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-sans font-semibold text-foreground">Propiedades</h2>
          <p className="text-sm text-muted-foreground mt-1">{properties?.length ?? 0} inmuebles registrados{properties ? <> · {properties.filter(p => p.managed_by_domov).length} administrados por Domov</> : ''}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/propiedades/nueva">+ Nuevo inmueble</Link>
        </Button>
      </div>

      <Suspense fallback={null}>
        <SearchBar placeholder="Buscar por nombre o dirección..." />
      </Suspense>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
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
            {properties?.map((p) => {
              const isOccupied = p.contracts?.some((c) =>
                ['active', 'ending'].includes(c.status)
              )
              return (
                <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.address}</p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{TYPE_LABELS[p.type] ?? p.type}</td>
                  <td className="px-5 py-4">
                    <Badge variant={isOccupied ? 'default' : 'secondary'}>
                      {isOccupied ? 'Ocupado' : 'Libre'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                      <TogglePublished propertyId={p.id} isPublished={p.is_published} />
                  </td>
                  <td className="px-5 py-4">
                    <ToggleManaged propertyId={p.id} managed={p.managed_by_domov} />
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
            })}
            {(!properties || properties.length === 0) && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                  {q?.trim()
                    ? 'No se encontraron propiedades con ese criterio de búsqueda.'
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
