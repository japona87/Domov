'use client'

import { useState } from 'react'
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
import { deleteProperty } from '@/lib/actions/properties'

export function DeletePropertyButton({ propertyId }: { propertyId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [errorOpen, setErrorOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [pending, setPending] = useState(false)

  async function handleConfirm() {
    setPending(true)
    const result = await deleteProperty(undefined, propertyId)
    if (result?.error) {
      setConfirmOpen(false)
      setErrorMsg(result.error)
      setErrorOpen(true)
      setPending(false)
    }
  }

  return (
    <>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger render={<Button variant="destructive" size="sm">Eliminar</Button>} />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <img src="/logo-domov.png" alt="Domov" className="h-7 w-auto" />
            </AlertDialogMedia>
            <AlertDialogTitle>¿Eliminar propiedad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La propiedad se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirm} disabled={pending}>
              {pending ? 'Eliminando...' : 'Eliminar'}
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
