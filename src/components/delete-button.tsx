'use client'

import { useCallback, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { LoadingOverlay } from '@/components/admin/loading-overlay'

interface DeleteButtonProps {
  action: (prev: { error?: string } | undefined, id: string) => Promise<{ error?: string } | undefined>
  id: string
  label?: string
}

export function DeleteButton({ action, id, label = 'Eliminar' }: DeleteButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [errorOpen, setErrorOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [pending, setPending] = useState(false)

  const handleConfirm = useCallback(async () => {
    setPending(true)
    const result = await action(undefined, id)
    if (result?.error) {
      setConfirmOpen(false)
      setErrorMsg(result.error)
      setErrorOpen(true)
      setPending(false)
    }
  }, [action, id])

  return (
    <>
      <LoadingOverlay pending={pending} message="Eliminando..." />
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger render={
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </Button>
        } />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <img src="/logo-domov.png" alt="Domov" className="h-7 w-auto" />
            </AlertDialogMedia>
            <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirm} disabled={pending}>
              {pending ? 'Eliminando...' : label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={errorOpen} onOpenChange={setErrorOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <img src="/logo-domov.png" alt="Domov" className="h-7 w-auto" />
            </AlertDialogMedia>
            <AlertDialogTitle>No se puede eliminar</AlertDialogTitle>
            <AlertDialogDescription>{errorMsg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorOpen(false)}>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
