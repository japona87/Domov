import { getStorageStats } from '@/lib/actions/storage-cleanup'
import { getSystemConfig } from '@/lib/actions/config'
import { formatBytes } from '@/lib/utils'
import { StorageCleanupClient } from './storage-client'

export const dynamic = 'force-dynamic'

export default async function StoragePage() {
  const [stats, config] = await Promise.all([
    getStorageStats(),
    getSystemConfig(),
  ])

  const storageLimitGb = config?.storage_limit_gb ?? 1
  const totalSizeGb = stats.totalSizeBytes / (1024 ** 3)
  const usagePercent = Math.min(Math.round((totalSizeGb / storageLimitGb) * 100), 100)
  const progressColor = usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-sans font-semibold text-foreground">Almacenamiento</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Archivos guardados en Supabase Storage
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Uso del plan</p>
        <div className="flex items-end justify-between mb-1">
          <p className="text-sm text-foreground">
            {formatBytes(stats.totalSizeBytes)} de {storageLimitGb} GB usados
          </p>
          <p className="text-sm font-semibold text-foreground">{usagePercent}%</p>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${progressColor} rounded-full transition-all`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
            {storageLimitGb >= 100 ? 'Plan Pro' : 'Plan Gratuito'} · Límite configurable en Configuración
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total archivos</p>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.totalFiles}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatBytes(stats.totalSizeBytes)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Archivos huérfanos</p>
          <p className={`text-2xl font-bold mt-1 ${stats.orphanCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {stats.orphanCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.orphanCount > 0 ? formatBytes(stats.orphanSizeBytes) : 'Sin huérfanos'}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Espacio recuperable</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {formatBytes(stats.orphanSizeBytes)}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Bucket</th>
              <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Archivos</th>
              <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Tamaño</th>
              <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Huérfanos</th>
              <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Espacio perdido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stats.buckets.map((b) => (
              <tr key={b.name} className="hover:bg-muted/50 transition-colors">
                <td className="px-5 py-4 font-medium text-foreground">{b.name}</td>
                <td className="px-5 py-4 text-muted-foreground">{b.files}</td>
                <td className="px-5 py-4 text-muted-foreground">{formatBytes(b.sizeBytes)}</td>
                <td className="px-5 py-4">
                  <span className={b.orphans > 0 ? 'text-amber-600 font-medium' : 'text-green-600'}>
                    {b.orphans}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{formatBytes(b.orphanSizeBytes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stats.orphanCount > 0 && <StorageCleanupClient orphanCount={stats.orphanCount} />}
    </div>
  )
}
