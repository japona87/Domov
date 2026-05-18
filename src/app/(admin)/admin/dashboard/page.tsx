import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500">Bienvenido, {user?.email}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-slate-500">Inmuebles</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">—</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-slate-500">Contratos activos</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">—</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-slate-500">Pagos pendientes</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">—</p></CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="pt-6">
          <p className="text-slate-400 text-center">
            Módulos en construcción — Plan 2: Propiedades → Plan 3: Contratos → Plan 4: Portal
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
