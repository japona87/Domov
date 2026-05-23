import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active:    { label: 'Activo',     className: 'bg-green-100 text-green-700' },
  ending:    { label: 'Terminando', className: 'bg-amber-100 text-amber-700' },
  ended:     { label: 'Terminado',  className: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Cancelado',  className: 'bg-red-100 text-red-600' },
}

export default async function ContratosPage() {
  const supabase = await createClient()
  const { data: contracts } = await supabase
    .from('contracts')
    .select(`
      id, status, start_date, end_date, monthly_rent,
      properties(name, address),
      tenants(full_name)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Contratos</h2>
        <Button asChild>
          <Link href="/admin/contratos/nuevo">+ Nuevo contrato</Link>
        </Button>
      </div>

      {contracts && contracts.length > 0 ? (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Inmueble</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Arrendatario</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Vigencia</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Canon</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(contracts as unknown as Array<{
                id: string
                status: string
                start_date: string
                end_date: string
                monthly_rent: number
                properties: { name: string; address: string } | null
                tenants: { full_name: string } | null
              }>).map((c) => {
                const badge = STATUS_LABEL[c.status] ?? { label: c.status, className: 'bg-slate-100 text-slate-600' }
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{c.properties?.name}</p>
                      <p className="text-xs text-slate-500">{c.properties?.address}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{c.tenants?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                      {c.start_date} → {c.end_date}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      ${c.monthly_rent.toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/contratos/${c.id}`} className="text-blue-600 hover:underline text-sm">
                        Ver
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-slate-400">Sin contratos registrados.</p>
      )}
    </div>
  )
}
