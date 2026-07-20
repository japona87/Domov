'use client'

import { useState, useTransition, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import {
  addService, updateService, deleteService,
  setServiceFileUrl, deleteServiceFile,
} from '@/lib/actions/services'
import { SERVICE_TYPES, SERVICE_TYPE_LABELS, SERVICE_ICONS } from '@/lib/services-shared'
import type { PropertyServiceRow } from '@/lib/services-shared'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const FILE_ICONS: Record<string, string> = {
  pdf: '/file-pdf.svg',
  png: '/file-image.svg',
  jpg: '/file-image.svg',
  jpeg: '/file-image.svg',
  webp: '/file-image.svg',
}

function fileExt(name: string) {
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

export function ServicesManager({ services: initialServices, propertyId }: { services: PropertyServiceRow[]; propertyId: string }) {
  const router = useRouter()
  const [services, setServices] = useState<PropertyServiceRow[]>(initialServices)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<PropertyServiceRow | null>(null)
  const [deleteMode, setDeleteMode] = useState<'service' | 'file'>('service')

  const existingTypes = new Set(services.map(s => s.service_type))

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const type = fd.get('service_type') as string
    const acct = (fd.get('account_number') as string)?.trim()
    if (!acct) { setFormError('Número de cuenta requerido'); return }
    if (existingTypes.has(type)) { setFormError(`Ya existe un servicio de ${SERVICE_TYPE_LABELS[type] ?? type}`); return }
    setFormError('')

    const fileInput = e.currentTarget.querySelector<HTMLInputElement>('input[name="file"]')
    const file = fileInput?.files?.[0]

    startTransition(async () => {
      try {
        const result = await addService(propertyId, fd)
        let fileUrl: string | null = null
        let fileName: string | null = null
        if (result?.id && file) {
          const supabase = createClient()
          const ext = file.name.split('.').pop() ?? 'pdf'
          const path = `${propertyId}/${result.id}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('service-files')
            .upload(path, file, { upsert: true })
          if (uploadError) throw new Error(uploadError.message)
          const { data: { publicUrl } } = supabase.storage
            .from('service-files')
            .getPublicUrl(path)
          fileUrl = publicUrl
          fileName = file.name
          await setServiceFileUrl(result.id, propertyId, publicUrl, file.name)
        }
        if (result) {
          setServices(prev => [...prev, {
            id: result.id,
            property_id: propertyId,
            service_type: result.service_type,
            account_number: (fd.get('account_number') as string)?.trim() ?? '',
            contract_number: (fd.get('contract_number') as string)?.trim() || null,
            provider_name: (fd.get('provider_name') as string)?.trim() || null,
            client_number: (fd.get('client_number') as string)?.trim() || null,
            file_url: fileUrl,
            file_name: fileName,
          }])
        }
        setShowForm(false)
        router.refresh()
      } catch (err: unknown) {
        setFormError(err instanceof Error ? err.message : 'Error al crear servicio')
      }
    })
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const acct = (fd.get('account_number') as string)?.trim()
    if (!acct) { setFormError('Número de cuenta requerido'); return }
    setFormError('')

    const fileInput = e.currentTarget.querySelector<HTMLInputElement>('input[name="file"]')
    const file = fileInput?.files?.[0]

    startTransition(async () => {
      try {
        await updateService(editingId!, fd)
        let fileUrl: string | null = null
        let fileName: string | null = null
        if (file) {
          const supabase = createClient()
          const ext = file.name.split('.').pop() ?? 'pdf'
          const path = `${propertyId}/${editingId!}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('service-files')
            .upload(path, file, { upsert: true })
          if (uploadError) throw new Error(uploadError.message)
          const { data: { publicUrl } } = supabase.storage
            .from('service-files')
            .getPublicUrl(path)
          fileUrl = publicUrl
          fileName = file.name
          await setServiceFileUrl(editingId!, propertyId, publicUrl, file.name)
        }
        setServices(prev => prev.map(s =>
          s.id === editingId
            ? {
                ...s,
                account_number: (fd.get('account_number') as string)?.trim() ?? s.account_number,
                contract_number: (fd.get('contract_number') as string)?.trim() || s.contract_number,
                provider_name: (fd.get('provider_name') as string)?.trim() || s.provider_name,
                client_number: (fd.get('client_number') as string)?.trim() || s.client_number,
                file_url: file ? fileUrl : s.file_url,
                file_name: file ? fileName : s.file_name,
              }
            : s
        ))
        setShowForm(false)
        setEditingId(null)
        router.refresh()
      } catch (err: unknown) {
        setFormError(err instanceof Error ? err.message : 'Error al actualizar servicio')
      }
    })
  }

  function handleDelete(svc: PropertyServiceRow) {
    startTransition(async () => {
      try {
        await deleteService(svc.id)
        setServices(prev => prev.filter(s => s.id !== svc.id))
        setDeleteTarget(null)
        router.refresh()
      } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Error') }
    })
  }

  function handleFileUpload(svc: PropertyServiceRow, file: File) {
    startTransition(async () => {
      try {
        const supabase = createClient()
        const ext = file.name.split('.').pop() ?? 'pdf'
        const path = `${propertyId}/${svc.id}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('service-files')
          .upload(path, file, { upsert: true })
        if (uploadError) throw new Error(uploadError.message)
        const { data: { publicUrl } } = supabase.storage
          .from('service-files')
          .getPublicUrl(path)
        await setServiceFileUrl(svc.id, propertyId, publicUrl, file.name)
        setServices(prev => prev.map(s => s.id === svc.id ? { ...s, file_url: publicUrl, file_name: file.name } : s))
        router.refresh()
      } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Error') }
    })
  }

  function handleDeleteFile(svc: PropertyServiceRow) {
    setDeleteMode('file')
    setDeleteTarget(svc)
  }

  function confirmDeleteAction() {
    if (!deleteTarget) return
    if (deleteMode === 'file') {
      startTransition(async () => {
        try {
          await deleteServiceFile(deleteTarget.id, propertyId)
          setServices(prev => prev.map(s => s.id === deleteTarget.id ? { ...s, file_url: null, file_name: null } : s))
          setDeleteTarget(null)
          router.refresh()
        } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Error') }
      })
    } else {
      handleDelete(deleteTarget)
    }
  }

  function closeDeleteDialog() {
    setDeleteTarget(null)
  }

  function openCreateForm() {
    const firstAvailable = SERVICE_TYPES.find(t => !existingTypes.has(t))
    if (!firstAvailable) { alert('Todos los tipos de servicio ya están agregados'); return }
    setEditingId(null)
    setShowForm(true)
    setFormError('')
  }

  const editingSvc = showForm && editingId ? services.find(s => s.id === editingId) : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">Servicios Públicos</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{services.length}</span>
        </div>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={openCreateForm} disabled={isPending}>
            + Nuevo servicio
          </Button>
        )}
      </div>

      {/* Inline form for create/edit */}
      {showForm && (
        <ServiceForm
          key={editingId ?? 'new'}
          svc={editingSvc}
          existingTypes={existingTypes}
          onSubmit={editingSvc ? handleUpdate : handleCreate}
          onCancel={() => { setShowForm(false); setEditingId(null); setFormError('') }}
          error={formError}
          isPending={isPending}
        />
      )}

      {/* Table */}
      {services.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Sin servicios registrados.</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Tipo</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3"># Cuenta</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Recibo</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map((svc) => (
                <ServiceRow
                  key={svc.id}
                  svc={svc}
                  onEdit={() => { setEditingId(svc.id); setShowForm(true); setFormError('') }}
                  onDelete={() => { setDeleteMode('service'); setDeleteTarget(svc) }}
                  onFileUpload={(file) => handleFileUpload(svc, file)}
                  onDeleteFile={() => handleDeleteFile(svc)}
                  isPending={isPending}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Image src="/logo-domov.png" alt="Domov" width={28} height={28} />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {deleteMode === 'service' ? '¿Eliminar este servicio?' : '¿Eliminar este recibo?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteMode === 'service'
                ? 'El servicio y su recibo (si existe) se eliminarán permanentemente.'
                : 'El archivo del recibo se eliminará permanentemente.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} onClick={closeDeleteDialog}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDeleteAction} disabled={isPending}>
              {isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ServiceForm({ svc, existingTypes, onSubmit, onCancel, error, isPending }: {
  svc?: PropertyServiceRow | null
  existingTypes: Set<string>
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
  onCancel: () => void
  error: string
  isPending: boolean
}) {
  const isEdit = !!svc
  const availableTypes = isEdit
    ? SERVICE_TYPES
    : SERVICE_TYPES.filter(t => !existingTypes.has(t))

  return (
    <form onSubmit={onSubmit} className="border border-border rounded-xl p-4 space-y-3 bg-muted/20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Tipo *</label>
          <select
            name="service_type"
            defaultValue={svc?.service_type ?? availableTypes[0]}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            disabled={isEdit}
          >
            {availableTypes.map(t => (
              <option key={t} value={t}>{SERVICE_ICONS[t]} {SERVICE_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground"># Cuenta *</label>
          <input
            name="account_number"
            defaultValue={svc?.account_number ?? ''}
            required
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Contrato</label>
          <input
            name="contract_number"
            defaultValue={svc?.contract_number ?? ''}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Proveedor</label>
          <input
            name="provider_name"
            defaultValue={svc?.provider_name ?? ''}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Cliente</label>
          <input
            name="client_number"
            defaultValue={svc?.client_number ?? ''}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Recibo (PDF, imagen)</label>
          <input
            name="file"
            type="file"
            accept=".pdf,image/*"
            className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-accent file:text-accent-foreground hover:file:bg-accent/80"
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isPending}>Cancelar</Button>
        <Button type="submit" size="sm" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  )
}

function ServiceRow({ svc, onEdit, onDelete, onFileUpload, onDeleteFile, isPending }: {
  svc: PropertyServiceRow
  onEdit: () => void
  onDelete: () => void
  onFileUpload: (file: File) => void
  onDeleteFile: () => void
  isPending: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const ext = svc.file_name ? fileExt(svc.file_name) : ''
  const fileIcon = ext ? (FILE_ICONS[ext] ?? '/file-generic.svg') : null

  return (
    <tr className="bg-white hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{SERVICE_ICONS[svc.service_type] ?? '📋'}</span>
          <span className="text-sm font-medium text-foreground">{SERVICE_TYPE_LABELS[svc.service_type] ?? svc.service_type}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-mono text-foreground">{svc.account_number}</p>
        {svc.provider_name && <p className="text-xs text-muted-foreground">{svc.provider_name}</p>}
      </td>
      <td className="px-4 py-3">
        {svc.file_url ? (
          <div className="flex items-center gap-2">
            {fileIcon && (
              <Image src={fileIcon} alt={ext} width={16} height={16} className="shrink-0" />
            )}
            <a
              href={svc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:underline truncate max-w-[120px] inline-block"
            >
              {svc.file_name}
            </a>
            <Button variant="ghost" size="sm" onClick={onDeleteFile} disabled={isPending} className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </Button>
          </div>
        ) : (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { onFileUpload(f); e.target.value = '' } }}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={isPending} className="text-xs h-7">
              Subir recibo
            </Button>
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit} title="Editar" className="text-accent">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} disabled={isPending} title="Eliminar" className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </Button>
        </div>
      </td>
    </tr>
  )
}
