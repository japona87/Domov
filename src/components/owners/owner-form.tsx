'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { LoadingOverlay } from '@/components/admin/loading-overlay'

interface OwnerFormProps {
  owner?: {
    full_name: string
    document_number: string | null
    phone: string | null
    email: string | null
  }
  onSubmit: (formData: FormData) => Promise<void>
  cancelHref?: string
}

function sanitizeDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function OwnerForm({ owner, onSubmit, cancelHref = '/admin/propietarios' }: OwnerFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [docError, setDocError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  function validate(): boolean {
    let valid = true

    const docInput = document.getElementById('documentNumber') as HTMLInputElement | null
    const doc = docInput?.value ?? ''

    if (doc && (doc.length < 7 || doc.length > 10)) {
      setDocError('La cédula debe tener entre 7 y 10 dígitos numéricos.')
      valid = false
    } else {
      setDocError('')
    }

    const phoneInput = document.getElementById('phone') as HTMLInputElement | null
    const phone = phoneInput?.value ?? ''

    if (phone && (phone.length < 7 || phone.length > 10)) {
      setPhoneError('El teléfono debe tener entre 7 y 10 dígitos numéricos.')
      valid = false
    } else {
      setPhoneError('')
    }

    return valid
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await onSubmit(formData)
      } catch (err) {
        if (err instanceof Error && 'digest' in err && typeof (err as Error & { digest: string }).digest === 'string' && (err as Error & { digest: string }).digest.startsWith('NEXT_REDIRECT')) return
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <>
      <LoadingOverlay pending={isPending} message={owner ? 'Actualizando propietario...' : 'Creando propietario...'} />
      <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-end gap-2 mb-6">
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? 'Guardando...' : (owner ? 'Guardar cambios' : 'Crear propietario')}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(cancelHref)}>
          Cancelar
        </Button>
      </div>
      <div className="space-y-1">
        <Label htmlFor="fullName">Nombre completo *</Label>
        <Input id="fullName" name="fullName" required defaultValue={owner?.full_name ?? ''} placeholder="Juan Pérez" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="documentNumber">Cédula</Label>
        <Input
          id="documentNumber"
          name="documentNumber"
          defaultValue={owner?.document_number ?? ''}
          placeholder="1234567890"
          inputMode="numeric"
          maxLength={10}
          onInput={(e) => {
            const el = e.currentTarget
            el.value = sanitizeDigits(el.value)
            setDocError('')
          }}
        />
        {docError && <p className="text-xs text-destructive">{docError}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          name="phone"
          defaultValue={owner?.phone ?? ''}
          placeholder="3001234567"
          inputMode="numeric"
          maxLength={10}
          onInput={(e) => {
            const el = e.currentTarget
            el.value = sanitizeDigits(el.value)
            setPhoneError('')
          }}
        />
        {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={owner?.email ?? ''} placeholder="juan@ejemplo.com" />
      </div>
      </form>
    </>
  )
}
