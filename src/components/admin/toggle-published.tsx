'use client'

import { useTransition } from 'react'
import { togglePublished } from '@/lib/actions/properties'
import { LoadingOverlay } from '@/components/admin/loading-overlay'

export function TogglePublished({ propertyId, isPublished }: { propertyId: string; isPublished: boolean }) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      await togglePublished(propertyId, !isPublished)
    })
  }

  return (
    <>
      <LoadingOverlay pending={isPending} message={isPublished ? 'Ocultando inmueble...' : 'Publicando inmueble...'} />
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isPublished ? 'bg-accent' : 'bg-muted-foreground/20'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isPublished ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </>
  )
}
