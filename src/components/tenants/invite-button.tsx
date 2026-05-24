'use client'

import { useTransition } from 'react'
import { inviteTenant } from '@/lib/actions/tenants-admin'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface InviteButtonProps {
  tenantId: string
  email: string | null
  hasUserId: boolean
}

export function InviteButton({ tenantId, email, hasUserId }: InviteButtonProps) {
  const [isPending, startTransition] = useTransition()

  if (!email) {
    return (
      <p className="text-sm text-muted-foreground">
        Agrega un email al arrendatario para poder invitarlo al portal.
      </p>
    )
  }

  if (hasUserId) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-accent rounded-full inline-block" />
        <p className="text-sm text-foreground">Ya tiene acceso al portal ({email})</p>
      </div>
    )
  }

  function handleInvite() {
    if (!confirm(`¿Enviar invitación al portal a ${email}?`)) return
    startTransition(async () => {
      try {
        await inviteTenant(tenantId, email!)
        toast.success('Invitación enviada por email')
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al enviar invitación'
        toast.error(msg)
      }
    })
  }

  return (
    <Button onClick={handleInvite} disabled={isPending} size="sm">
      {isPending ? 'Enviando...' : 'Invitar al portal'}
    </Button>
  )
}
