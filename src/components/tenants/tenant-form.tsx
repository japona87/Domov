'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TenantFormProps {
  tenant?: {
    full_name: string
    document_number: string | null
    phone: string | null
    email: string | null
  }
  onSubmit: (formData: FormData) => Promise<void>
}

export function TenantForm({ tenant, onSubmit }: TenantFormProps) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => onSubmit(formData))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-1">
        <Label htmlFor="full_name">Nombre completo *</Label>
        <Input id="full_name" name="full_name" required defaultValue={tenant?.full_name ?? ''} placeholder="Juan Pérez" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="document_number">Cédula</Label>
        <Input id="document_number" name="document_number" defaultValue={tenant?.document_number ?? ''} placeholder="12345678" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" name="phone" defaultValue={tenant?.phone ?? ''} placeholder="3001234567" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={tenant?.email ?? ''} placeholder="juan@ejemplo.com" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : (tenant ? 'Guardar cambios' : 'Crear arrendatario')}
      </Button>
    </form>
  )
}
