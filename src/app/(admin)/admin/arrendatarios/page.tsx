import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function ArrendatariosPage() {
  const supabase = await createClient()
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, full_name, document_number, phone, email')
    .order('full_name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Arrendatarios</h2>
        <Button asChild>
          <Link href="/admin/arrendatarios/nuevo">+ Nuevo arrendatario</Link>
        </Button>
      </div>

      {tenants && tenants.length > 0 ? (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Cédula</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Teléfono</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{t.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{t.document_number ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{t.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{t.email ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/arrendatarios/${t.id}`} className="text-blue-600 hover:underline text-sm">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-slate-400">Sin arrendatarios registrados.</p>
      )}
    </div>
  )
}
