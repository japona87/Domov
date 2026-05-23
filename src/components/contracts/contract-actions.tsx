'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { setContractEnded } from '@/lib/actions/contracts'
import { toast } from 'sonner'

interface ContractActionsProps {
  contractId: string
  status: string
}

export function ContractActions({ contractId, status }: ContractActionsProps) {
  const [isPending, startTransition] = useTransition()

  function handleConfirmEnded() {
    if (!confirm('¿Confirmar que el inmueble fue entregado? Esto cerrará el contrato definitivamente.')) return
    startTransition(async () => {
      try {
        await setContractEnded(contractId)
        toast.success('Contrato cerrado')
      } catch {
        toast.error('Error al cerrar el contrato')
      }
    })
  }

  if (status !== 'active' && status !== 'ending') return null

  return (
    <div className="flex gap-2">
      {status === 'active' && (
        <Button variant="outline" asChild>
          <Link href={`/admin/contratos/${contractId}/terminar`}>Iniciar no renovación</Link>
        </Button>
      )}
      {status === 'ending' && (
        <Button variant="destructive" onClick={handleConfirmEnded} disabled={isPending}>
          {isPending ? 'Cerrando...' : 'Confirmar entrega'}
        </Button>
      )}
    </div>
  )
}
