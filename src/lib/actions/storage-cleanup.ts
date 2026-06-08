'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface StorageStats {
  buckets: {
    name: string
    files: number
    sizeBytes: number
    orphans: number
    orphanSizeBytes: number
  }[]
  totalFiles: number
  totalSizeBytes: number
  orphanCount: number
  orphanSizeBytes: number
}

export async function getStorageStats(): Promise<StorageStats> {
  const supabase = await createClient()

  const [existingPropertyIds, existingContractIds] = await Promise.all([
    supabase.from('properties').select('id').then((r) => new Set(r.data?.map((p) => p.id) ?? [])),
    supabase.from('contracts').select('id').then((r) => new Set(r.data?.map((c) => c.id) ?? [])),
  ])

  const buckets = [
    { name: 'property-photos', prefix: '', idMap: existingPropertyIds },
    { name: 'documents', prefix: 'contracts', idMap: existingContractIds },
    { name: 'receipts', prefix: 'contracts', idMap: existingContractIds },
  ]

  const bucketResults: StorageStats['buckets'] = []

  for (const b of buckets) {
    const { data: dirs } = await supabase.storage.from(b.name).list(b.prefix)
    const files: { size: number; entityId: string }[] = []

    if (dirs) {
      for (const dir of dirs) {
        const prefixPath = b.prefix ? `${b.prefix}/${dir.name}` : dir.name
        const { data: items } = await supabase.storage.from(b.name).list(prefixPath)
        if (items) {
          for (const item of items.filter((i) => i.metadata?.mimetype)) {
            files.push({
              size: item.metadata?.size ?? 0,
              entityId: dir.name,
            })
          }
        }
      }
    }

    const totalSize = files.reduce((s, f) => s + f.size, 0)
    const orphans = files.filter((f) => !b.idMap.has(f.entityId))
    const orphanSize = orphans.reduce((s, f) => s + f.size, 0)

    bucketResults.push({
      name: b.name,
      files: files.length,
      sizeBytes: totalSize,
      orphans: orphans.length,
      orphanSizeBytes: orphanSize,
    })
  }

  return {
    buckets: bucketResults,
    totalFiles: bucketResults.reduce((s, b) => s + b.files, 0),
    totalSizeBytes: bucketResults.reduce((s, b) => s + b.sizeBytes, 0),
    orphanCount: bucketResults.reduce((s, b) => s + b.orphans, 0),
    orphanSizeBytes: bucketResults.reduce((s, b) => s + b.orphanSizeBytes, 0),
  }
}

export async function deleteOrphanFiles() {
  const supabase = await createClient()

  const [existingPropertyIds, existingContractIds] = await Promise.all([
    supabase.from('properties').select('id').then((r) => new Set(r.data?.map((p) => p.id) ?? [])),
    supabase.from('contracts').select('id').then((r) => new Set(r.data?.map((c) => c.id) ?? [])),
  ])

  const configs: { bucket: string; prefix: string; idMap: Set<string> }[] = [
    { bucket: 'property-photos', prefix: '', idMap: existingPropertyIds },
    { bucket: 'documents', prefix: 'contracts', idMap: existingContractIds },
    { bucket: 'receipts', prefix: 'contracts', idMap: existingContractIds },
  ]

  let removedCount = 0

  for (const cfg of configs) {
    const { data: dirs } = await supabase.storage.from(cfg.bucket).list(cfg.prefix)
    if (!dirs) continue
    for (const dir of dirs) {
      if (cfg.idMap.has(dir.name)) continue
      const prefixPath = cfg.prefix ? `${cfg.prefix}/${dir.name}` : dir.name
      const { data: items } = await supabase.storage.from(cfg.bucket).list(prefixPath)
      if (items) {
        const paths = items
          .filter((i) => i.metadata?.mimetype)
          .map((i) => `${prefixPath}/${i.name}`)
        if (paths.length > 0) {
          await supabase.storage.from(cfg.bucket).remove(paths)
          removedCount += paths.length
        }
      }
    }
  }

  revalidatePath('/admin/configuracion/storage')
  return { removedCount }
}
