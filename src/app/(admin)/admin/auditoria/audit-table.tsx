'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ENTITY_LABELS: Record<string, string> = {
  property: 'Propiedad',
  owner: 'Propietario',
  tenant: 'Arrendatario',
  contract: 'Contrato',
  property_owner: 'Asociación Prop.',
  payment: 'Pago',
  feature_config: 'Característica',
  property_photo: 'Foto',
  system_config: 'Configuración',
}

const ACTION_STYLES: Record<string, { label: string; className: string }> = {
  create: { label: 'Creación', className: 'text-emerald-600 bg-emerald-50' },
  update: { label: 'Actualización', className: 'text-blue-600 bg-blue-50' },
  delete: { label: 'Eliminación', className: 'text-red-600 bg-red-50' },
}

interface Log {
  id: string
  user_email: string
  action: string
  entity: string
  entity_name: string | null
  changes: unknown
  created_at: string
}

interface Props {
  logs: Log[]
  currentPage: number
  totalPages: number
  totalCount: number
  selectedEntity: string | null
  selectedAction: string | null
  searchQuery: string | null
}

function formatChanges(changes: unknown): string {
  if (!changes || typeof changes !== 'object') return '—'
  const obj = changes as Record<string, { old: unknown; new: unknown }>
  const parts: string[] = []
  for (const [key, val] of Object.entries(obj)) {
    parts.push(`${key}: ${JSON.stringify(val.old)} → ${JSON.stringify(val.new)}`)
  }
  return parts.join('\n')
}

export function AuditTable({ logs, currentPage, totalPages, totalCount, selectedEntity, selectedAction, searchQuery }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState(searchQuery ?? '')

  const toggleRow = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  function applyFilter(params: Record<string, string | null>) {
    const sp = new URLSearchParams()
    const entity = params.entity ?? selectedEntity
    const action = params.action ?? selectedAction
    const q = params.q ?? search
    if (entity) sp.set('entity', entity)
    if (action) sp.set('action', action)
    if (q) sp.set('q', q)
    sp.set('page', '1')
    router.push(`/admin/auditoria?${sp.toString()}`)
  }

  function goToPage(p: number) {
    const sp = new URLSearchParams()
    if (selectedEntity) sp.set('entity', selectedEntity)
    if (selectedAction) sp.set('action', selectedAction)
    if (searchQuery) sp.set('q', searchQuery)
    sp.set('page', String(p))
    router.push(`/admin/auditoria?${sp.toString()}`)
  }

  function exportCSV() {
    const headers = ['Fecha', 'Usuario', 'Acción', 'Entidad', 'Nombre', 'Cambios']
    const rows = logs.map((l) => [
      new Date(l.created_at).toLocaleString('es-CO'),
      l.user_email,
      ACTION_STYLES[l.action]?.label ?? l.action,
      ENTITY_LABELS[l.entity] ?? l.entity,
      l.entity_name ?? '—',
      `"${formatChanges(l.changes).replace(/"/g, '""')}"`,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditoria-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Entidad</label>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={selectedEntity ?? ''}
              onChange={(e) => applyFilter({ entity: e.target.value || null, action: null, q: null })}
            >
              <option value="">Todas</option>
              {Object.entries(ENTITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Acción</label>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={selectedAction ?? ''}
              onChange={(e) => applyFilter({ entity: null, action: e.target.value || null, q: null })}
            >
              <option value="">Todas</option>
              {Object.entries(ACTION_STYLES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground">Buscar por nombre</label>
            <div className="flex gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applyFilter({ entity: null, action: null, q: search }) }}
                placeholder="Nombre del registro..."
              />
              <Button variant="secondary" size="sm" onClick={() => applyFilter({ entity: null, action: null, q: search })}>
                Buscar
              </Button>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setSearch(''); router.push('/admin/auditoria') }}>
            Limpiar
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="w-8 px-3 py-3.5"></th>
              <th className="text-left px-3 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Fecha</th>
              <th className="text-left px-3 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Usuario</th>
              <th className="text-left px-3 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Acción</th>
              <th className="text-left px-3 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Entidad</th>
              <th className="text-left px-3 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Nombre</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((l) => {
              const isExpanded = expanded.has(l.id)
              const badge = ACTION_STYLES[l.action] ?? { label: l.action, className: 'text-muted-foreground bg-muted' }
              return (
                <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-3">
                    <button
                      onClick={() => toggleRow(l.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString('es-CO')}
                  </td>
                  <td className="px-3 py-3 text-xs text-foreground">{l.user_email}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-foreground">{ENTITY_LABELS[l.entity] ?? l.entity}</td>
                  <td className="px-3 py-3 text-sm text-foreground">{l.entity_name ?? '—'}</td>
                </tr>
              )
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-12 text-center text-muted-foreground text-sm">
                  No se encontraron eventos de auditoría.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Expanded changes */}
        {logs.filter((l) => expanded.has(l.id)).map((l) => (
          <div key={`changes-${l.id}`} className="border-t border-border bg-muted/30 px-6 py-4">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {formatChanges(l.changes)}
            </pre>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Página {currentPage} de {totalPages} ({totalCount} registros)</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
