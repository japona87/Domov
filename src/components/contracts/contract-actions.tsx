'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { setContractEnded } from '@/lib/actions/contracts'
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

interface ContractActionsProps {
  contractId: string
  status: string
}

export function ContractActions({ contractId, status }: ContractActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirmEnded() {
    startTransition(async () => {
      try {
        await setContractEnded(contractId)
        toast.success('Contrato cerrado')
        setConfirmOpen(false)
      } catch {
        toast.error('Error al cerrar el contrato')
      }
    })
  }

  if (status !== 'active' && status !== 'ending') return null

  return (
    <>
      <LoadingOverlay pending={isPending} message="Cerrando contrato..." />
      <div className="flex gap-2">
      {status === 'active' && (
        <Button variant="outline" asChild>
          <Link href={`/admin/contratos/${contractId}/terminar`}>Iniciar no renovación</Link>
        </Button>
      )}
      {status === 'ending' && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger render={
            <Button variant="destructive" disabled={isPending}>
              {isPending ? 'Cerrando...' : 'Confirmar entrega'}
            </Button>
          } />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <img src="/logo-domov.png" alt="Domov" className="h-7 w-auto" />
              </AlertDialogMedia>
              <AlertDialogTitle>¿Confirmar entrega?</AlertDialogTitle>
              <AlertDialogDescription>
                El inmueble fue entregado. Esto cerrará el contrato definitivamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleConfirmEnded} disabled={isPending}>
                {isPending ? 'Cerrando...' : 'Confirmar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
    </>
  )
}
