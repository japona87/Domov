'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addContractDocument, deleteContractDocument } from '@/lib/actions/contract-documents'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Document {
  id: string
  name: string
  type: string
  description: string | null
  file_url: string
  file_size: number | null
  created_at: string
  signedUrl: string | null
}

interface ContractDocumentsProps {
  contractId: string
  initialDocuments: Document[]
}

const DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: 'contract', label: 'Contrato' },
  { value: 'delivery_act', label: 'Acta de entrega' },
  { value: 'annex', label: 'Anexo' },
  { value: 'receipt', label: 'Recibo' },
  { value: 'invoice', label: 'Factura' },
  { value: 'other', label: 'Otro' },
]

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  DOCUMENT_TYPES.map((t) => [t.value, t.label])
)

function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function extractStoragePath(url: string): string | null {
  const marker = '/storage/v1/object/documents/'
  const idx = url.indexOf(marker)
  return idx !== -1 ? url.slice(idx + marker.length) : null
}

export function ContractDocuments({ contractId, initialDocuments }: ContractDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const file = fileInputRef.current?.files?.[0]

    if (!file) {
      toast.error('Selecciona un archivo PDF')
      return
    }

    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF')
      return
    }

    setUploading(true)

    try {
      const pdfBytes = await file.arrayBuffer()
      const { PDFDocument } = await import('pdf-lib')
      const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
      if (pdf.isEncrypted) {
        toast.error('El PDF está protegido con contraseña')
        setUploading(false)
        return
      }
    } catch {
      toast.error('El PDF está protegido con contraseña o es inválido')
      setUploading(false)
      return
    }

    const supabase = createClient()
    const description = String(formData.get('description'))
    const name = description.slice(0, 255)

    try {
      const ext = 'pdf'
      const slug = description.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'documento'
      const path = `contracts/${contractId}/${Date.now()}-${slug}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, file, { contentType: 'application/pdf' })

      if (uploadError) throw new Error(uploadError.message)

      formData.set('contract_id', contractId)
      formData.set('file_path', path)
      formData.set('file_size', String(file.size))
      formData.set('name', name)

      await addContractDocument(formData)

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(path)

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const fileUrl = `${supabaseUrl}/storage/v1/object/documents/${path}`
      const { data: signedData } = await supabase.storage
        .from('documents')
        .createSignedUrl(path, 3600)

      setDocuments((prev) => [
        {
          id: 'temp-' + Date.now(),
          name,
          type: String(formData.get('type')),
          description: formData.get('description') ? String(formData.get('description')) : null,
          file_url: fileUrl,
          file_size: file.size,
          created_at: new Date().toISOString(),
          signedUrl: signedData?.signedUrl ?? null,
        },
        ...prev,
      ])

      toast.success('Documento subido')
      setShowForm(false)
      form.reset()
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al subir documento'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(doc: Document) {
    setDeleting(doc.id)
    try {
      const storagePath = extractStoragePath(doc.file_url)
      if (!storagePath) throw new Error('No se pudo determinar la ruta del archivo')
      await deleteContractDocument(doc.id, storagePath, contractId)
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
      toast.success('Documento eliminado')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Documentos del contrato</h3>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            Subir PDF
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4 bg-slate-50">
          <div className="space-y-1">
            <Label htmlFor="doc-type">
              Tipo <span className="text-red-500">*</span>
            </Label>
            <select
              id="doc-type"
              name="type"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="doc-description">
              Descripción / Nombre del documento <span className="text-red-500">*</span>
            </Label>
            <Textarea id="doc-description" name="description" required placeholder="Ej: Contrato firmado el 15 de mayo" rows={2} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="doc-file">
              Archivo PDF <span className="text-red-500">*</span>
            </Label>
            <Input
              ref={fileInputRef}
              id="doc-file"
              type="file"
              accept=".pdf"
              required
            />
            <p className="text-xs text-slate-400">Solo PDF. Se valida que no tenga contraseña.</p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Subiendo...' : 'Subir documento'}
            </Button>
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); }}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {documents.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">Sin documentos aún.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-start justify-between border rounded-md px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{doc.description || doc.name}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">{TYPE_LABEL[doc.type] ?? doc.type}</span>
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>{doc.created_at}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                {doc.signedUrl && (
                  <a
                    href={doc.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Descargar
                  </a>
                )}
                <AlertDialog>
                  <AlertDialogTrigger render={
                    <button className="text-red-500 hover:text-red-700 text-xs">
                      Eliminar
                    </button>
                  } />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogMedia>
                        <img src="/logo-domov.png" alt="Domov" className="h-7 w-auto" />
                      </AlertDialogMedia>
                      <AlertDialogTitle>¿Eliminar este documento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => handleDelete(doc)}>
                        {deleting === doc.id ? 'Eliminando...' : 'Eliminar'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
