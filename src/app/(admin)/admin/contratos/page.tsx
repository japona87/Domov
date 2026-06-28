import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { DeleteButton } from '@/components/delete-button'
import { SearchBar } from '@/components/admin/search-bar'
import { deleteContract } from '@/lib/actions/contracts'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  active:    { label: 'Activo',     className: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950' },
  ending:    { label: 'Terminando', className: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950' },
  ended:     { label: 'Terminado',  className: 'text-muted-foreground bg-muted' },
  cancelled: { label: 'Cancelado',  className: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950' },
}

const TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'ending', label: 'Por terminar' },
  { key: 'ended', label: 'Finalizados' },
]

export default async function ContratosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>
}) {
  const { tab, q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('contracts')
    .select(`
      id, status, start_date, end_date, monthly_rent,
      properties(name, address),
      tenants(full_name)
    `)
    .order('created_at', { ascending: false })

  if (tab && tab !== 'all') {
    if (tab === 'ending') {
      query = query.eq('status', 'ending')
    } else if (tab === 'ended') {
      query = query.eq('status', 'ended')
    } else if (tab === 'active') {
      query = query.eq('status', 'active')
    }
  }

  if (q?.trim()) {
    const search = `%${q.trim()}%`
    query = query.or(`properties.name.ilike.${search},tenants.full_name.ilike.${search}`)
  }

  const { data: contracts } = await query as unknown as { data: Array<{
    id: string; status: string; start_date: string; end_date: string
    monthly_rent: number
    properties: { name: string; address: string } | null
    tenants: { full_name: string } | null
  }> | null }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-sans font-semibold text-foreground">Contratos</h2>
          <p className="text-sm text-muted-foreground mt-1">{contracts?.length ?? 0} contratos registrados</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/contratos/nuevo">+ Nuevo contrato</Link>
        </Button>
      </div>

      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border border-border w-fit">
        {TABS.map(t => (
          <Link
            key={t.key}
            href={t.key === 'all' ? '/admin/contratos' : `/admin/contratos?tab=${t.key}`}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              (tab === t.key || (!tab && t.key === 'all'))
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <Suspense fallback={null}>
        <SearchBar placeholder="Buscar por inmueble o arrendatario..." />
      </Suspense>

      {contracts && contracts.length > 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs tracking-wider">Inmueble</th>
                <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs tracking-wider">Arrendatario</th>
                <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs tracking-wider">Vigencia</th>
                <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs tracking-wider">Canon</th>
                <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs tracking-wider">Estado</th>
                <th className="px-5 py-3.5"></th>
                <th className="w-14 px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(contracts as unknown as Array<{
                id: string
                status: string
                start_date: string
                end_date: string
                monthly_rent: number
                properties: { name: string; address: string } | null
                tenants: { full_name: string } | null
              }>).map((c) => {
                const badge = STATUS_STYLES[c.status] ?? { label: c.status, className: 'text-muted-foreground bg-muted' }
                return (
                  <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">{c.properties?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.properties?.address}</p>
                    </td>
                    <td className="px-5 py-4 text-foreground">{c.tenants?.full_name ?? '—'}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      {c.start_date} → {c.end_date}
                    </td>
                    <td className="px-5 py-4 text-foreground font-medium whitespace-nowrap">
                      ${c.monthly_rent.toLocaleString('es-CO')}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/contratos/${c.id}/editar`}
                        className="inline-flex items-center justify-center text-blue-600 hover:text-blue-700"
                        title="Editar"
                      >
                        <img src="/icons/edit.png" alt="Editar" width={20} height={20} className="shrink-0" />
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <DeleteButton action={deleteContract} id={c.id} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
          {q?.trim()
            ? 'No se encontraron contratos con ese criterio de búsqueda.'
            : tab && tab !== 'all'
              ? `No hay contratos ${TABS.find(t => t.key === tab)?.label.toLowerCase() ?? tab}.`
              : 'Sin contratos registrados.'
          }
        </div>
      )}
    </div>
  )
}
