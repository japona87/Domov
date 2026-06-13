import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AuditTable } from './audit-table'
import { cleanupAuditLogs } from '@/lib/actions/config'
import { CleanupButton } from '@/components/admin/cleanup-button'

export const dynamic = 'force-dynamic'

const ENTITIES = ['property', 'owner', 'tenant', 'contract', 'property_owner', 'payment', 'feature_config', 'property_photo', 'system_config'] as const
const ACTIONS = ['create', 'update', 'delete'] as const

interface PageProps {
  searchParams: Promise<{ page?: string; entity?: string; action?: string; q?: string }>
}

export default async function AuditoriaPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const limit = 50
  const offset = (page - 1) * limit
  const entity = sp.entity && ENTITIES.includes(sp.entity as typeof ENTITIES[number]) ? (sp.entity as string) : null
  const action = sp.action && ACTIONS.includes(sp.action as typeof ACTIONS[number]) ? (sp.action as string) : null
  const q = sp.q?.trim() || null

  const supabase = await createClient()

  let countQuery = supabase.from('audit_logs').select('*', { count: 'exact', head: true })
  let dataQuery = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  if (entity) { countQuery = countQuery.eq('entity', entity); dataQuery = dataQuery.eq('entity', entity) }
  if (action) { countQuery = countQuery.eq('action', action); dataQuery = dataQuery.eq('action', action) }
  if (q) { countQuery = countQuery.ilike('entity_name', `%${q}%`); dataQuery = dataQuery.ilike('entity_name', `%${q}%`) }

  const currentYear = new Date().getFullYear()
  const [{ count }, { data: logs }, { data: sysConfig }] = await Promise.all([
    countQuery,
    dataQuery,
    supabase.from('system_config').select('audit_retention_days').eq('year', currentYear).single() as unknown as { data: { audit_retention_days: number } | null },
  ])
  const totalPages = Math.ceil((count ?? 0) / limit)
  const retentionDays = sysConfig?.audit_retention_days ?? 90

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-sans font-semibold text-foreground">Auditoría</h2>
          <p className="text-sm text-muted-foreground mt-1">{count ?? 0} eventos registrados</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">Retención: {retentionDays} días</p>
            <CleanupButton retentionDays={retentionDays} />
        </div>
      </div>

      <Suspense fallback={<div className="text-sm text-muted-foreground py-8 text-center">Cargando...</div>}>
        <AuditTable
          logs={(logs ?? []) as Array<{
            id: string; user_email: string; action: string; entity: string; entity_name: string | null
            changes: unknown; created_at: string
          }>}
          currentPage={page}
          totalPages={totalPages}
          totalCount={count ?? 0}
          selectedEntity={entity}
          selectedAction={action}
          searchQuery={q}
        />
      </Suspense>
    </div>
  )
}
