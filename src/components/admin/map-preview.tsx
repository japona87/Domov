'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog'

interface MapPreviewButtonProps {
  mapsUrl: string | null
}

export function MapPreviewButton({ mapsUrl }: MapPreviewButtonProps) {
  const [open, setOpen] = useState(false)
  if (!mapsUrl) return null

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Ver mapa">
        <img src="/icons/direccion.png" alt="Mapa" width={20} height={20} className="shrink-0" />
      </button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-5xl h-[85vh] flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle>Vista del mapa</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="flex-1 w-full min-h-0 rounded-lg overflow-hidden border">
            <iframe src={mapsUrl} className="w-full h-full border-0" allowFullScreen loading="lazy" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
