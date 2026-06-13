import type { Json, PropertyFeatures } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

type AuditAction = 'create' | 'update' | 'delete'
type AuditEntity = 'property' | 'owner' | 'tenant' | 'contract' | 'contract_amendment' | 'property_owner' | 'payment' | 'feature_config' | 'property_photo' | 'system_config' | 'document'

export async function logAudit(params: {
  action: AuditAction
  entity: AuditEntity
  entityId: string
  entityName?: string | null
  changes?: Json | null
  metadata?: Json | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    user_email: user.email ?? 'unknown',
    action: params.action,
    entity: params.entity,
    entity_id: params.entityId,
    entity_name: params.entityName ?? null,
    changes: params.changes ?? null,
    metadata: params.metadata ?? null,
  })
}

export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: T,
  keys: (keyof T)[]
): Record<string, { old: Json; new: Json }> {
  const diff: Record<string, { old: Json; new: Json }> = {}
  for (const key of keys) {
    const a = before[key]
    const b = after[key]
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      diff[key as string] = { old: a as Json, new: b as Json }
    }
  }
  return diff
}
