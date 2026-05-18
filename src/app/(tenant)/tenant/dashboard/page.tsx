import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'

export default async function TenantDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Mi Portal</h2>
        <p className="text-slate-500">Bienvenido, {user?.email}</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <p className="text-slate-400 text-center">
            Tu portal está en construcción. Pronto podrás ver tus pagos, contrato y más.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
