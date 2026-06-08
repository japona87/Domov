'use client'

import { useState } from 'react'
import { deleteOrphanFiles } from '@/lib/actions/storage-cleanup'
import { toast } from 'sonner'
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

export function StorageCleanupClient({ orphanCount }: { orphanCount: number }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cleaning, setCleaning] = useState(false)

  async function handleCleanup() {
    setCleaning(true)
    try {
      const result = await deleteOrphanFiles()
      toast.success(`${result.removedCount} archivos eliminados`)
      setConfirmOpen(false)
    } catch {
      toast.error('Error al limpiar archivos')
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
      <div>
        <p className="font-semibold text-amber-800">Archivos huérfanos detectados</p>
        <p className="text-sm text-amber-700 mt-0.5">
          {orphanCount} archivo{orphanCount !== 1 ? 's' : ''} perteneciente{orphanCount !== 1 ? 's' : ''} a
          entidades que ya no existen en la base de datos.
        </p>
      </div>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger render={
          <Button variant="destructive" disabled={cleaning}>
            {cleaning ? 'Limpiando...' : `Eliminar ${orphanCount} archivo${orphanCount !== 1 ? 's' : ''}`}
          </Button>
        } />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <img src="/logo-domov.png" alt="Domov" className="h-7 w-auto" />
            </AlertDialogMedia>
            <AlertDialogTitle>¿Eliminar archivos huérfanos?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán {orphanCount} archivo{orphanCount !== 1 ? 's' : ''} que no están vinculados a ninguna entidad. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cleaning}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleCleanup} disabled={cleaning}>
              {cleaning ? 'Limpiando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
