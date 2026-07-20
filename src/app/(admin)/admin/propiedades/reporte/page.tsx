import Link from 'next/link'
import { getCompletenessReport } from '@/lib/actions/report'

export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartamento', house: 'Casa', office: 'Oficina',
  local: 'Local', garage: 'Garaje', other: 'Otro',
}

function ProgressBar({ pct }: { pct: number }) {
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold w-10 text-right ${
        pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'
      }`}>
        {pct}%
      </span>
    </div>
  )
}

function MissingBadge({ label }: { label: string }) {
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-medium">{label}</span>
}

export default async function ReportePage() {
  const report = await getCompletenessReport()

  const maxCount = Math.max(...report.distribution.map((d) => d.count), 1)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/propiedades"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Volver al listado
        </Link>
        <h2 className="text-2xl font-sans font-semibold text-foreground">Reporte de Completitud</h2>
        <p className="text-muted-foreground">{report.properties.length} inmuebles evaluados</p>
      </div>

      {/* Overall card */}
      <div className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl border border-accent/20 p-6 flex items-center gap-6">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 border-2 border-accent/20 shrink-0">
          <span className="text-2xl font-bold text-accent">{report.overallPercentage}%</span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Completitud general</p>
          <p className="text-sm text-muted-foreground">
            {report.averageCompleted} de {report.totalPossible} campos completos en promedio
          </p>
          <p className="text-xs text-muted-foreground">
            {report.properties.filter((p) => p.percentage >= 75).length} inmuebles completos (&ge;75%)
            &middot; {report.properties.filter((p) => p.percentage < 50).length} por debajo del 50%
          </p>
        </div>
      </div>

      {/* Distribution */}
      <div className="bg-white rounded-xl border border-border p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Distribución</h3>
        <div className="space-y-1.5">
          {report.distribution.map((d) => (
            <div key={d.range} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16 shrink-0">{d.range}</span>
              <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent/60"
                  style={{ width: `${(d.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-foreground w-6 text-right">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Property list */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Inmueble</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Tipo</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 w-[200px]">Progreso</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Faltantes</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {report.properties.map((p) => {
                const missing = p.checks.filter((c) => !c.done)
                return (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[240px]">{p.address}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {TYPE_LABELS[p.type] ?? p.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <ProgressBar pct={p.percentage} />
                    </td>
                    <td className="px-5 py-3.5">
                      {missing.length === 0 ? (
                        <span className="text-xs text-emerald-600 font-medium">Completo</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {missing.map((c) => (
                            <MissingBadge key={c.key} label={c.label} />
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/propiedades/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium"
                      >
                        Editar
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {report.properties.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
          <p className="text-sm">No hay inmuebles registrados.</p>
        </div>
      )}
    </div>
  )
}
