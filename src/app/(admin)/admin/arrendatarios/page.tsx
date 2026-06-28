import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { DeleteButton } from '@/components/delete-button'
import { SearchBar } from '@/components/admin/search-bar'
import { deleteTenant } from '@/lib/actions/contracts'

export const dynamic = 'force-dynamic'

export default async function ArrendatariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('tenants')
    .select('id, full_name, document_number, phone, email')

  if (q?.trim()) {
    const search = `%${q.trim()}%`
    query = query.or(`full_name.ilike.${search},document_number.ilike.${search}`)
  }

  const { data: tenants } = await query.order('full_name') as unknown as { data: Array<{
    id: string
    full_name: string
    document_number: string | null
    phone: string | null
    email: string | null
  }> | null }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-sans font-semibold text-foreground">Arrendatarios</h2>
          <p className="text-sm text-muted-foreground mt-1">{tenants?.length ?? 0} arrendatarios registrados</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/arrendatarios/nuevo">+ Nuevo arrendatario</Link>
        </Button>
      </div>

      <Suspense fallback={null}>
        <SearchBar placeholder="Buscar por nombre o cédula..." />
      </Suspense>

      {tenants && tenants.length > 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs tracking-wider">Nombre</th>
                <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs tracking-wider">Cédula</th>
                <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs tracking-wider">Teléfono</th>
                <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs tracking-wider">Email</th>
                <th className="px-5 py-3.5"></th>
                <th className="w-14 px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground">{t.full_name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{t.document_number ?? '—'}</td>
                  <td className="px-5 py-4 text-muted-foreground">{t.phone ?? '—'}</td>
                  <td className="px-5 py-4 text-muted-foreground">{t.email ?? '—'}</td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/arrendatarios/${t.id}`}
                      className="inline-flex items-center justify-center text-accent hover:text-accent/80"
                      title="Editar"
                    >
                      <img src="/icons/edit.png" alt="Editar" width={20} height={20} className="shrink-0" />
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <DeleteButton action={deleteTenant} id={t.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
          {q?.trim() ? 'No se encontraron arrendatarios con ese criterio de búsqueda.' : 'Sin arrendatarios registrados.'}
        </div>
      )}
    </div>
  )
}
