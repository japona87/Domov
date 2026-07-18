'use client'

import { useState, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  addService, updateService, deleteService,
  uploadServiceFile, deleteServiceFile,
} from '@/lib/actions/services'
import { SERVICE_TYPES, SERVICE_TYPE_LABELS, SERVICE_ICONS } from '@/lib/services-shared'
import type { PropertyServiceRow } from '@/lib/services-shared'

function ServiceCard({ svc, propertyId, onEdit }: { svc: PropertyServiceRow; propertyId: string; onEdit: () => void }) {
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileUpload(file: File) {
    startTransition(async () => {
      try { await uploadServiceFile(svc.id, propertyId, file) } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error') }
    })
  }

  function handleDeleteFile() {
    if (!confirm('¿Eliminar archivo?')) return
    startTransition(async () => {
      try { await deleteServiceFile(svc.id, propertyId) } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error') }
    })
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar servicio ${SERVICE_TYPE_LABELS[svc.service_type] ?? svc.service_type}?`)) return
    startTransition(async () => {
      try { await deleteService(svc.id) } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error') }
    })
  }

  return (
    <div className="border border-border rounded-xl p-4 space-y-3 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{SERVICE_ICONS[svc.service_type] ?? '📋'}</span>
          <div>
            <p className="font-medium text-foreground">{SERVICE_TYPE_LABELS[svc.service_type] ?? svc.service_type}</p>
            {svc.provider_name && <p className="text-xs text-muted-foreground">{svc.provider_name}</p>}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit} title="Editar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending} title="Eliminar" className="text-destructive hover:text-destructive">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><span className="text-muted-foreground text-xs">Cuenta:</span><p className="font-mono text-xs">{svc.account_number}</p></div>
        {svc.contract_number && <div><span className="text-muted-foreground text-xs">Contrato:</span><p className="font-mono text-xs">{svc.contract_number}</p></div>}
        {svc.client_number && <div><span className="text-muted-foreground text-xs">Cliente:</span><p className="font-mono text-xs">{svc.client_number}</p></div>}
      </div>

      <div className="border-t border-border pt-3">
        {svc.file_url ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span className="text-muted-foreground truncate max-w-[200px]">{svc.file_name}</span>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" asChild>
                <a href={svc.file_url} target="_blank" rel="noopener noreferrer" title="Ver">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </a>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDeleteFile} disabled={isPending} title="Eliminar archivo" className="text-destructive hover:text-destructive">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = '' }}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={isPending}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Subir recibo
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function ServicesManager({ services, propertyId }: { services: PropertyServiceRow[]; propertyId: string }) {
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)

  function handleAdd(type: string) {
    const fd = new FormData()
    fd.set('service_type', type)
    fd.set('account_number', '')
    startTransition(async () => {
      try { await addService(propertyId, fd) } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error') }
    })
  }

  if (editingId) {
    const svc = services.find(s => s.id === editingId)
    if (!svc) { setEditingId(null); return null }
    return (
      <EditServiceForm
        svc={svc}
        onSave={async (fd) => {
          await updateService(editingId, fd)
          setEditingId(null)
        }}
        onCancel={() => setEditingId(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">Servicios Públicos</span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{services.length}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {SERVICE_TYPES.map((t) => {
          const exists = services.some(s => s.service_type === t)
          return (
            <Button
              key={t}
              variant="outline"
              size="sm"
              disabled={isPending || exists}
              onClick={() => handleAdd(t)}
              className={exists ? 'opacity-40 cursor-not-allowed' : ''}
            >
              {SERVICE_ICONS[t] ?? '📋'} {SERVICE_TYPE_LABELS[t] ?? t}
              {exists ? ' ✓' : ''}
            </Button>
          )
        })}
      </div>

      {services.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">Agrega servicios públicos usando los botones de arriba.</p>
      )}

      <div className="grid gap-4">
        {services.map((svc) => (
          <ServiceCard key={svc.id} svc={svc} propertyId={propertyId} onEdit={() => setEditingId(svc.id)} />
        ))}
      </div>
    </div>
  )
}

function EditServiceForm({ svc, onSave, onCancel }: { svc: PropertyServiceRow; onSave: (fd: FormData) => Promise<void>; onCancel: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const acct = (fd.get('account_number') as string)?.trim()
    if (!acct) { setError('Número de cuenta requerido'); return }
    setError('')
    startTransition(async () => {
      try { await onSave(fd) } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 space-y-4">
      <h3 className="font-medium text-foreground">{SERVICE_TYPE_LABELS[svc.service_type] ?? svc.service_type}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Número de cuenta *</label>
          <input name="account_number" defaultValue={svc.account_number} required className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Número de contrato</label>
          <input name="contract_number" defaultValue={svc.contract_number ?? ''} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Empresa/proveedor</label>
          <input name="provider_name" defaultValue={svc.provider_name ?? ''} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Número de cliente</label>
          <input name="client_number" defaultValue={svc.client_number ?? ''} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm" disabled={isPending}>Guardar</Button>
      </div>
    </form>
  )
}
