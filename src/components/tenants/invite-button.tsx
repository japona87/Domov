'use client'

import { useState, useTransition } from 'react'
import { inviteTenant } from '@/lib/actions/tenants-admin'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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

interface InviteButtonProps {
  tenantId: string
  email: string | null
  hasUserId: boolean
}

export function InviteButton({ tenantId, email, hasUserId }: InviteButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
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
    startTransition(async () => {
      try {
        await inviteTenant(tenantId, email!)
        toast.success('Invitación enviada por email')
        setConfirmOpen(false)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al enviar invitación'
        toast.error(msg)
      }
    })
  }

  return (
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogTrigger render={
        <Button disabled={isPending} size="sm">
          {isPending ? 'Enviando...' : 'Invitar al portal'}
        </Button>
      } />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <img src="/logo-domov.png" alt="Domov" className="h-7 w-auto" />
          </AlertDialogMedia>
          <AlertDialogTitle>¿Enviar invitación?</AlertDialogTitle>
          <AlertDialogDescription>
            Se enviará un email a <strong>{email}</strong> para que acceda al portal de arrendatarios.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleInvite} disabled={isPending}>
            {isPending ? 'Enviando...' : 'Enviar invitación'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
