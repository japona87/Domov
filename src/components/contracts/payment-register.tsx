'use client'

import { useState, useTransition } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { markPaymentPaid } from '@/lib/actions/contracts'
import { toast } from 'sonner'
import { LoadingOverlay } from '@/components/admin/loading-overlay'

interface PaymentRegisterProps {
  paymentId: string
  contractId: string
  dueDate: string
  amount: number
}

export function PaymentRegister({ paymentId, contractId, dueDate, amount }: PaymentRegisterProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit() {
    startTransition(async () => {
      try {
        let receiptPath: string | null = null
        if (file) {
          const ext = file.name.split('.').pop()
          const path = `contracts/${contractId}/payments/${paymentId}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(path, file, { upsert: true })
          if (uploadError) throw new Error(uploadError.message)
          receiptPath = path
        }
        await markPaymentPaid(paymentId, contractId, receiptPath, notes || null)
        toast.success('Pago registrado')
        setOpen(false)
      } catch {
        toast.error('Error al registrar el pago')
      }
    })
  }

  if (!open) {
    return (
      <>
        <LoadingOverlay pending={isPending} message="Registrando pago..." />
        <button
          onClick={() => setOpen(true)}
          className="text-green-600 hover:text-green-800 text-sm font-medium"
        >
          Registrar pago
        </button>
      </>
    )
  }

  return (
    <>
      <LoadingOverlay pending={isPending} message="Registrando pago..." />
      <div className="border rounded-lg p-4 bg-green-50 space-y-3 mt-2">
      <p className="text-sm font-medium text-slate-700">
        Registrar pago — Cuota {dueDate} (${amount.toLocaleString('es-CO')})
      </p>
      <div className="space-y-1">
        <Label className="text-xs">Comprobante (opcional)</Label>
        <Input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Notas</Label>
        <Textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observación..."
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Guardando...' : 'Confirmar pago'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
      </div>
    </>
  )
}
