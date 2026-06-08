'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { addPropertyPhoto, deletePropertyPhoto, setCoverPhoto } from '@/lib/actions/property-photos'
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
} from '@/components/ui/alert-dialog'

interface Photo {
  id: string
  photo_url: string
  is_cover: boolean
  sort_order: number
}

interface PhotoManagerProps {
  propertyId: string
  photos: Photo[]
}

function extractStoragePath(url: string): string {
  const marker = '/storage/v1/object/public/property-photos/'
  const idx = url.indexOf(marker)
  return idx !== -1 ? url.slice(idx + marker.length) : url
}

async function compressImage(file: File, maxWidth = 1920, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img

      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width))
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Error al comprimir la imagen'))
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => reject(new Error('Error al cargar la imagen'))
    img.src = URL.createObjectURL(file)
  })
}

export function PhotoManager({ propertyId, photos: initialPhotos }: PhotoManagerProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)

    const supabase = createClient()

    for (const file of files) {
      try {
        const compressed = await compressImage(file)
        const path = `${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

        const { error: uploadError } = await supabase.storage
          .from('property-photos')
          .upload(path, compressed, { contentType: 'image/jpeg' })
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('property-photos')
          .getPublicUrl(path)

        const { id: photoId, is_cover } = await addPropertyPhoto(propertyId, publicUrl)

        setPhotos((prev) => [
          ...prev,
          {
            id: photoId,
            photo_url: publicUrl,
            is_cover,
            sort_order: prev.length,
          },
        ])
        toast.success('Foto subida')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al subir foto'
        toast.error(msg)
      }
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleDelete(photo: Photo) {
    startTransition(async () => {
      try {
        const storagePath = extractStoragePath(photo.photo_url)
        await deletePropertyPhoto(photo.id, storagePath, propertyId)
        setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
        toast.success('Foto eliminada')
        setDeleteTarget(null)
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Error al eliminar')
      }
    })
  }

  function handleSetCover(photo: Photo) {
    startTransition(async () => {
      try {
        await setCoverPhoto(propertyId, photo.id)
        setPhotos((prev) => prev.map((p) => ({ ...p, is_cover: p.id === photo.id })))
        toast.success('Foto de portada actualizada')
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Error al actualizar portada')
      }
    })
  }

  return (
    <>
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <img src="/logo-domov.png" alt="Domov" className="h-7 w-auto" />
            </AlertDialogMedia>
            <AlertDialogTitle>¿Eliminar esta foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)} disabled={isPending}>
              {isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        {/* Upload zone */}
        <div
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg className="w-8 h-8 mx-auto mb-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm font-medium text-foreground">
            {uploading ? 'Subiendo...' : 'Subir fotos'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP — múltiples archivos</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </div>

        {/* Photo grid */}
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin fotos aún.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative rounded-xl overflow-hidden border border-border bg-muted aspect-[4/3]">
                <Image
                  src={photo.photo_url}
                  alt="Foto del inmueble"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />

                {/* Cover badge */}
                {photo.is_cover && (
                  <div className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    Portada
                  </div>
                )}

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                  {!photo.is_cover && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full text-xs h-7"
                      onClick={() => handleSetCover(photo)}
                      disabled={isPending}
                    >
                      Hacer portada
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full text-xs h-7"
                    onClick={() => setDeleteTarget(photo)}
                    disabled={isPending}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
