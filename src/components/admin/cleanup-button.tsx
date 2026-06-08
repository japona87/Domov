'use client'

import { useState, useTransition } from 'react'
import { cleanupAuditLogs } from '@/lib/actions/config'
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

export function CleanupButton({ retentionDays }: { retentionDays: number }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await cleanupAuditLogs()
      setConfirmOpen(false)
    })
  }

  return (
    <>
      <LoadingOverlay pending={isPending} message="Limpiando auditoría..." />
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger render={
          <button
            type="button"
            disabled={isPending}
            className="text-xs text-destructive hover:text-destructive/80 font-medium border border-destructive/30 rounded-md px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Limpiando...' : 'Limpiar historial'}
          </button>
        } />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <img src="/logo-domov.png" alt="Domov" className="h-7 w-auto" />
            </AlertDialogMedia>
            <AlertDialogTitle>¿Limpiar historial?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán los registros de auditoría anteriores a {retentionDays} días. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleClick} disabled={isPending}>
              {isPending ? 'Limpiando...' : 'Limpiar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
