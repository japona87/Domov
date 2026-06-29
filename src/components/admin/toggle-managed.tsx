'use client'

import { useTransition } from 'react'
import { toggleManaged } from '@/lib/actions/properties'
import { LoadingOverlay } from '@/components/admin/loading-overlay'

export function ToggleManaged({ propertyId, managed }: { propertyId: string; managed: boolean }) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
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
        disabled={isPending}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          managed ? 'bg-accent' : 'bg-muted-foreground/20'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          managed ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </>
  )
}
