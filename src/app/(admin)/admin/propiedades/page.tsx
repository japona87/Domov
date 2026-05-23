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
              const isOccupied = p.contracts?.some((c) =>
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
