// src/components/properties/photo-uploader.tsx
'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { addPropertyPhoto, deletePropertyPhoto, setCoverPhoto } from '@/lib/actions/properties'
import { toast } from 'sonner'

interface Photo {
  id: string
  photo_url: string
  is_cover: boolean
  sort_order: number
}

interface PhotoUploaderProps {
  propertyId: string
  photos: Photo[]
}

export function PhotoUploader({ propertyId, photos }: PhotoUploaderProps) {
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${propertyId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('property-photos')
        .upload(path, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('property-photos')
        .getPublicUrl(path)

      const isCover = photos.length === 0
      await addPropertyPhoto(propertyId, publicUrl, isCover)
      toast.success('Foto subida')
    } catch {
      toast.error('Error al subir la foto')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function handleDelete(photoId: string, photoUrl: string) {
    const pathPart = photoUrl.split('/property-photos/')[1]
    const path = pathPart?.split('?')[0]
    if (!path) {
      toast.error('No se puede determinar la ruta de la foto')
      return
    }
    startTransition(async () => {
      try {
        await deletePropertyPhoto(photoId, path, propertyId)
        toast.success('Foto eliminada')
      } catch {
        toast.error('Error al eliminar la foto')
      }
    })
  }

  function handleSetCover(photoId: string) {
    startTransition(async () => {
      try {
        await setCoverPhoto(photoId, propertyId)
        toast.success('Portada actualizada')
      } catch {
        toast.error('Error al actualizar portada')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group rounded-lg overflow-hidden border bg-slate-100 aspect-video"
          >
            <Image
              src={photo.photo_url}
              alt="Foto del inmueble"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
            {photo.is_cover && (
              <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                Portada
              </span>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {!photo.is_cover && (
                <button
                  onClick={() => handleSetCover(photo.id)}
                  disabled={isPending}
                  className="text-white text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Portada
                </button>
              )}
              <button
                onClick={() => handleDelete(photo.id, photo.photo_url)}
                disabled={isPending}
                className="text-white text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}

        <label
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg aspect-video cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors ${
            uploading ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <span className="text-2xl text-slate-400">+</span>
          <span className="text-xs text-slate-400 mt-1">
            {uploading ? 'Subiendo...' : 'Subir foto'}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>
      <p className="text-xs text-slate-400">
        La primera foto subida queda como portada automáticamente. Formatos: JPG, PNG, WebP.
      </p>
    </div>
  )
}
