'use client'

import { useTransition } from 'react'
import { toggleManaged } from '@/lib/actions/properties'
import { LoadingOverlay } from '@/components/admin/loading-overlay'

export function ToggleManaged({ propertyId, managed, disabled }: { propertyId: string; managed: boolean; disabled?: boolean }) {
  const [isPending, startTransition] = useTransition()

  const locked = disabled && !managed

  function handleToggle() {
    if (locked) return
    startTransition(async () => {
      await toggleManaged(propertyId, !managed)
    })
  }

  return (
    <>
      <LoadingOverlay pending={isPending} message={managed ? 'Quitando gestión Domov...' : 'Asignando gestión Domov...'} />
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending || locked}
        title={locked ? 'Se requiere un contrato activo para activar la gestión de Domov' : managed ? 'Desactivar gestión Domov' : 'Activar gestión Domov'}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          managed ? 'bg-accent' : locked ? 'bg-muted-foreground/10' : 'bg-muted-foreground/20'
        } ${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          managed ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </>
  )
}
