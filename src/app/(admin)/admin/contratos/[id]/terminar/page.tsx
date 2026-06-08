'use client'

import { useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setContractEnding } from '@/lib/actions/contracts'
import { toast } from 'sonner'
import { LoadingOverlay } from '@/components/admin/loading-overlay'
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

export default function TerminarContratoPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [reason, setReason] = useState<'non_renewal_admin' | 'non_renewal_tenant'>('non_renewal_admin')
  const [noticeDate, setNoticeDate] = useState(new Date().toISOString().split('T')[0])
  const [file, setFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const deliveryDate =
    reason === 'non_renewal_tenant'
      ? new Date(new Date(noticeDate).getTime() + 90 * 86400000).toISOString().split('T')[0]
      : null

  function handleSubmit() {
    startTransition(async () => {
      try {
        let documentPath: string | null = null
        if (file) {
          const ext = file.name.split('.').pop()
          const path = `contracts/${id}/termination-notice.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(path, file, { upsert: true })
          if (uploadError) throw new Error(uploadError.message)
          documentPath = path
        }
        await setContractEnding(id, reason, noticeDate, documentPath)
        toast.success('No renovación registrada')
        setConfirmOpen(false)
        router.push(`/admin/contratos/${id}`)
      } catch {
        toast.error('Error al registrar la no renovación')
      }
    })
  }

  return (
    <>
      <LoadingOverlay pending={isPending} message="Registrando no renovación..." />
      <div className="space-y-6 max-w-lg">
      <div>
        <p className="text-sm text-slate-500 mb-1">
          <Link href="/admin/contratos" className="hover:underline">Contratos</Link>
          {' / '}
          <Link href={`/admin/contratos/${id}`} className="hover:underline">Detalle</Link>
          {' / '}Registrar no renovación
        </p>
        <h2 className="text-2xl font-bold text-slate-800">Registrar no renovación</h2>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-5">
        <div className="space-y-2">
          <Label>¿Quién no renueva?</Label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="non_renewal_admin"
                checked={reason === 'non_renewal_admin'}
                onChange={() => setReason('non_renewal_admin')}
              />
              <span className="text-sm">El administrador</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="non_renewal_tenant"
                checked={reason === 'non_renewal_tenant'}
                onChange={() => setReason('non_renewal_tenant')}
              />
              <span className="text-sm">El arrendatario</span>
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="noticeDate">
            {reason === 'non_renewal_admin'
              ? 'Fecha de notificación al arrendatario'
              : 'Fecha de la carta del arrendatario'}
          </Label>
          <Input
            id="noticeDate"
            type="date"
            value={noticeDate}
            onChange={(e) => setNoticeDate(e.target.value)}
          />
        </div>

        {deliveryDate && (
          <div className="bg-amber-50 rounded-md p-3 text-sm text-amber-800">
            Fecha estimada de entrega: <strong>{deliveryDate}</strong>
            <span className="text-amber-600"> (fecha carta + 90 días — Ley 820 de 2003)</span>
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="doc">
            {reason === 'non_renewal_admin'
              ? 'Copia de carta enviada (opcional)'
              : 'Carta del arrendatario (opcional)'}
          </Label>
          <Input
            id="doc"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="flex gap-2">
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger render={
              <Button disabled={isPending}>
                {isPending ? 'Guardando...' : 'Registrar no renovación'}
              </Button>
            } />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia>
                  <img src="/logo-domov.png" alt="Domov" className="h-7 w-auto" />
                </AlertDialogMedia>
                <AlertDialogTitle>¿Registrar no renovación?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se registrará la no renovación del contrato. El contrato pasará a estado "por terminar".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Confirmar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" asChild>
            <Link href={`/admin/contratos/${id}`}>Cancelar</Link>
          </Button>
        </div>
      </div>
    </div>
    </>
  )
}
