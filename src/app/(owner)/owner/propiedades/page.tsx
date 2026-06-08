import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartamento', house: 'Casa', office: 'Oficina',
  local: 'Local', garage: 'Garaje', other: 'Inmueble',
}

export default async function OwnerPropertiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: owner } = await supabase
    .from('owners')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single()

  if (!owner) return <p className="text-center py-20 text-muted-foreground">Sin propiedades asignadas.</p>

  const { data: properties } = await supabase
    .from('property_owners')
    .select('ownership_pct, properties(id, name, address, type, monthly_price, description, is_published)')
    .eq('owner_id', owner.id) as unknown as {
    data: Array<{
      ownership_pct: number
      properties: {
        id: string; name: string; address: string; type: string
        monthly_price: number | null; description: string | null; is_published: boolean
      } | null
    }> | null
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-sans font-semibold text-foreground">Mis inmuebles</h2>
        <p className="text-sm text-muted-foreground mt-1">Propiedades donde eres propietario</p>
      </div>

      {properties && properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((po) => {
            const p = po.properties
            if (!p) return null
            return (
              <div key={p.id} className="bg-card rounded-xl border border-border p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {TYPE_LABELS[p.type] ?? p.type} · {p.address}
                    </p>
                  </div>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium text-muted-foreground">
                    {po.ownership_pct}%
                  </span>
                </div>
                {p.monthly_price != null && (
                  <p className="text-sm text-foreground">
                    Valor referencia: <span className="font-semibold">${p.monthly_price.toLocaleString('es-CO')}/mes</span>
                  </p>
                )}
                <Link
                  href={`/owner/propiedades/${p.id}`}
                  className="inline-block text-sm text-accent hover:text-accent/80 font-medium"
                >
                  Ver detalle →
                </Link>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No tienes inmuebles registrados en el sistema.</p>
      )}
    </div>
  )
}
