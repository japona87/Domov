'use client'

import { useRef, useState, useTransition, useEffect } from 'react'
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (lightboxIndex === null) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft') setLightboxIndex(i => i !== null && i > 0 ? i - 1 : i)
      if (e.key === 'ArrowRight') setLightboxIndex(i => i !== null && i < photos.length - 1 ? i + 1 : i)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxIndex, photos.length])

  useEffect(() => {
    if (lightboxIndex !== null) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex])

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
              <div
                key={photo.id}
                className="group relative rounded-xl overflow-hidden border border-border bg-muted aspect-[4/3] cursor-pointer"
                onClick={() => setLightboxIndex(photos.indexOf(photo))}
              >
                <Image
                  src={photo.photo_url}
                  alt="Foto del inmueble"
                  fill
                  className="object-cover pointer-events-none"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />

                {/* Cover badge */}
                {photo.is_cover && (
                  <div className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full pointer-events-none">
                    Portada
                  </div>
                )}

                {/* Hover overlay background */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {/* Hover action buttons — pointer-events-none so clicks reach container */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 pointer-events-none">
                  {!photo.is_cover && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full text-xs h-7 pointer-events-auto"
                      onClick={(e) => { e.stopPropagation(); handleSetCover(photo) }}
                      disabled={isPending}
                    >
                      Hacer portada
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full text-xs h-7 pointer-events-auto"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(photo) }}
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

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black">
          <div className="relative w-full h-full">
            <Image
              src={photos[lightboxIndex].photo_url}
              alt={`Foto ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-l from-black/20 via-transparent to-black/20 pointer-events-none" />

            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
              <div className="bg-black/30 backdrop-blur-sm text-white/80 text-sm font-sans px-3 py-1 rounded-full">
                {lightboxIndex + 1} / {photos.length}
              </div>
              <button
                onClick={() => setLightboxIndex(null)}
                className="w-11 h-11 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-colors flex items-center justify-center text-white"
                aria-label="Cerrar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {lightboxIndex > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => i! - 1) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-colors flex items-center justify-center text-white"
                aria-label="Anterior"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18 9 12l6-6"/>
                </svg>
              </button>
            )}

            {lightboxIndex < photos.length - 1 && (
              <button
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => i! + 1) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-colors flex items-center justify-center text-white"
                aria-label="Siguiente"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
