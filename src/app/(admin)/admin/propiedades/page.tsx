import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteButton } from '@/components/delete-button'
import { TogglePublished } from '@/components/admin/toggle-published'
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
  contracts: { id: string; status: string }[]
}

export default async function PropiedadesPage() {
  const supabase = await createClient()

  const { data: properties } = await supabase
    .from('properties')
    .select('id, name, address, type, is_published, contracts(id, status)')
    .order('name') as { data: PropertyRow[] | null }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-sans font-semibold text-foreground">Propiedades</h2>
          <p className="text-sm text-muted-foreground mt-1">{properties?.length ?? 0} inmuebles registrados</p>
        </div>
        <Button asChild>
          <Link href="/admin/propiedades/nueva">+ Nuevo inmueble</Link>
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Inmueble</th>
              <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Tipo</th>
              <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Estado</th>
              <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Publicado</th>
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
                  <td className="px-5 py-4 text-right">
                    <Button variant="ghost" size="sm" asChild className="text-accent hover:text-accent hover:bg-accent/10">
                      <Link href={`/admin/propiedades/${p.id}`}>Editar</Link>
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
                <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                  No hay propiedades.{' '}
                  <Link href="/admin/propiedades/nueva" className="text-accent hover:text-accent/80 font-medium">
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
