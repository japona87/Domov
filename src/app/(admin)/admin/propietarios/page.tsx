import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { DeleteButton } from '@/components/delete-button'
import { deleteOwner } from '@/lib/actions/owners'

export const dynamic = 'force-dynamic'

export default async function PropietariosPage() {
  const supabase = await createClient()
  const { data: owners } = await supabase
    .from('owners')
    .select('id, full_name, document_number, phone, email')
    .order('full_name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-sans font-semibold text-foreground">Propietarios</h2>
          <p className="text-sm text-muted-foreground mt-1">{owners?.length ?? 0} propietarios registrados</p>
        </div>
        <Button asChild>
          <Link href="/admin/propietarios/nuevo">+ Nuevo propietario</Link>
        </Button>
      </div>

      {owners && owners.length > 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Nombre</th>
                <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Cédula</th>
                <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Teléfono</th>
                <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Email</th>
                <th className="px-5 py-3.5"></th>
                <th className="w-14 px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {owners.map((o) => (
                <tr key={o.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground">{o.full_name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{o.document_number ?? '—'}</td>
                  <td className="px-5 py-4 text-muted-foreground">{o.phone ?? '—'}</td>
                  <td className="px-5 py-4 text-muted-foreground">{o.email ?? '—'}</td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/propietarios/${o.id}`}
                      className="text-accent hover:text-accent/80 font-medium text-sm"
                    >
                      Editar
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <DeleteButton action={deleteOwner} id={o.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
          Sin propietarios registrados.
        </div>
      )}
    </div>
  )
}
