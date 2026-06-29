'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} title="Ver mapa" className="text-accent hover:text-accent hover:bg-accent/10">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-5xl h-[85vh] flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle>Vista previa del mapa</AlertDialogTitle>
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
