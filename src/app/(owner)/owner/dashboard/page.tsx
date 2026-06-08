import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function OwnerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: owner } = await supabase
    .from('owners')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single()

  if (!owner) {
    return (
      <div className="text-center py-20">
        <p className="font-sans font-semibold text-2xl text-foreground mb-2">Sin propiedades asignadas</p>
        <p className="text-muted-foreground text-sm">Contacta al administrador para más información.</p>
      </div>
    )
  }

  const { data: properties } = await supabase
    .from('property_owners')
    .select('property_id, properties(id, name, address, type)')
    .eq('owner_id', owner.id) as unknown as {
    data: Array<{
      property_id: string
      properties: { id: string; name: string; address: string; type: string } | null
    }> | null
  }

  const propertyIds = properties?.map((p) => p.property_id) ?? []

  type ContractRow = {
    id: string; status: string; start_date: string; end_date: string
    monthly_rent: number; property_id: string
    tenants: { full_name: string } | null
  }

  const { data: rawContracts } = propertyIds.length > 0
    ? await supabase
        .from('contracts')
        .select('id, status, start_date, end_date, monthly_rent, property_id, tenants!inner(full_name)')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
    : { data: null }

  const contracts = (rawContracts ?? []) as unknown as ContractRow[]
  const activeContracts = contracts.filter((c) => c.status === 'active' || c.status === 'ending')
  const totalProperties = properties?.length ?? 0

  const TYPE_LABELS: Record<string, string> = {
    apartment: 'Apartamento', house: 'Casa', office: 'Oficina',
    local: 'Local', garage: 'Garaje', other: 'Inmueble',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-sans font-semibold text-foreground">
          Bienvenido, {owner.full_name?.split(' ')[0]}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Resumen de tus inmuebles</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Inmuebles</p>
          <p className="text-2xl font-bold text-foreground mt-1">{totalProperties}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Contratos activos</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeContracts.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total contratos</p>
          <p className="text-2xl font-bold text-foreground mt-1">{contracts.length}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Tus inmuebles</h3>
          <Link href="/owner/propiedades" className="text-sm text-accent hover:text-accent/80 font-medium">
            Ver todos
          </Link>
        </div>
        {properties && properties.length > 0 ? (
          <div className="space-y-2">
            {properties.slice(0, 5).map((po) => {
              const prop = po.properties
              if (!prop) return null
              return (
                <div key={po.property_id} className="flex items-center justify-between bg-muted/50 rounded-md px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">{prop.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {TYPE_LABELS[prop.type] ?? prop.type} · {prop.address}
                    </p>
                  </div>
                  <Link
                    href={`/owner/propiedades/${prop.id}`}
                    className="text-sm text-accent hover:text-accent/80 font-medium"
                  >
                    Ver contrato
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No tienes inmuebles registrados.</p>
        )}
      </div>

      {activeContracts.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Contratos activos</h3>
          <div className="space-y-2">
            {activeContracts.map((c) => {
              const prop = properties?.find((p) => p.property_id === c.property_id)?.properties
              return (
                <div key={c.id} className="bg-muted/50 rounded-md px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{prop?.name ?? 'Inmueble'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.tenants?.full_name}
                      {' · '}${c.monthly_rent.toLocaleString('es-CO')}/mes
                      {' · '}{c.start_date} → {c.end_date}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
