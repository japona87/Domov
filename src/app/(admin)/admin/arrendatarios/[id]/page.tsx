import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TenantForm } from '@/components/tenants/tenant-form'
import { updateTenant } from '@/lib/actions/contracts'
import { TenantOnboardingButton, TenantPasswordManager } from '@/components/tenants/tenant-onboarding'

export const dynamic = 'force-dynamic'

export default async function EditarArrendatarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, full_name, document_number, phone, email, user_id')
    .eq('id', id)
    .single() as unknown as { data: {
      id: string
      full_name: string
      document_number: string | null
      phone: string | null
      email: string | null
      user_id: string | null
    } | null }

  if (!tenant) notFound()

  const updateWithId = updateTenant.bind(null, id)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          <Link href="/admin/arrendatarios" className="hover:underline">Arrendatarios</Link> / Editar
        </p>
        <h2 className="text-2xl font-sans font-semibold text-foreground">{tenant.full_name}</h2>
      </div>
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <TenantForm tenant={tenant} onSubmit={updateWithId} />

        {tenant.email && (
          <>
            <hr className="border-border" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Acceso al portal</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tenant.user_id
                    ? `Ya tiene acceso al portal (${tenant.email})`
                    : 'El arrendatario aún no tiene acceso. Envíale un onboarding.'}
                </p>
              </div>
              <TenantOnboardingButton tenantId={id} hasAccess={!!tenant.user_id} />
            </div>
            <TenantPasswordManager tenantId={id} hasAccess={!!tenant.user_id} />
          </>
        )}
      </div>
    </div>
  )
}
