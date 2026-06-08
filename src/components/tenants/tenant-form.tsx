'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { LoadingOverlay } from '@/components/admin/loading-overlay'

interface TenantFormProps {
  tenant?: {
    full_name: string
    document_number: string | null
    phone: string | null
    email: string | null
  }
  onSubmit: (formData: FormData) => Promise<void>
}

function sanitizeDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function TenantForm({ tenant, onSubmit }: TenantFormProps) {
  const [isPending, startTransition] = useTransition()
  const [docError, setDocError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  function validate(): boolean {
    let valid = true

    const doc = (document.getElementById('document_number') as HTMLInputElement | null)?.value ?? ''
    if (doc && (doc.length < 7 || doc.length > 10)) {
      setDocError('La cédula debe tener entre 7 y 10 dígitos numéricos.')
      valid = false
    } else {
      setDocError('')
    }

    const phone = (document.getElementById('phone') as HTMLInputElement | null)?.value ?? ''
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
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <>
      <LoadingOverlay pending={isPending} message={tenant ? 'Actualizando arrendatario...' : 'Creando arrendatario...'} />
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-1">
        <Label htmlFor="full_name">Nombre completo *</Label>
        <Input id="full_name" name="full_name" required defaultValue={tenant?.full_name ?? ''} placeholder="Juan Pérez" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="document_number">Cédula</Label>
        <Input
          id="document_number"
          name="document_number"
          defaultValue={tenant?.document_number ?? ''}
          placeholder="1234567890"
          inputMode="numeric"
          maxLength={10}
          onInput={(e) => {
            e.currentTarget.value = sanitizeDigits(e.currentTarget.value)
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
          defaultValue={tenant?.phone ?? ''}
          placeholder="3001234567"
          inputMode="numeric"
          maxLength={10}
          onInput={(e) => {
            e.currentTarget.value = sanitizeDigits(e.currentTarget.value)
            setPhoneError('')
          }}
        />
        {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={tenant?.email ?? ''} placeholder="juan@ejemplo.com" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : (tenant ? 'Guardar cambios' : 'Crear arrendatario')}
      </Button>
      </form>
    </>
  )
}
