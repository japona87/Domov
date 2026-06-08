'use client'

import Image from 'next/image'
import { useState } from 'react'

type Photo = {
  photo_url: string
  is_cover: boolean
  sort_order: number
}

type Props = {
  photos: Photo[]
  propertyName: string
}

export function PropertyGallery({ photos, propertyName }: Props) {
  const [showGrid, setShowGrid] = useState(false)

  if (photos.length === 0) return null

  const visiblePhotos = photos.slice(0, 6)
  const moreCount = photos.length - 6

  return (
    <>
      <div>
        <h2 className="font-heading text-2xl text-foreground mb-3">Galería</h2>
        <div className="w-10 h-0.5 bg-accent mb-5" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {visiblePhotos.map((photo, i) => {
            const isLast = i === visiblePhotos.length - 1
            const showMoreOverlay = isLast && moreCount > 0

            return (
              <button
                key={i}
                onClick={() => setShowGrid(true)}
                className="relative aspect-[4/3] group rounded-xl overflow-hidden bg-muted"
                aria-label={`Foto ${i + 1}`}
              >
                <Image
                  src={photo.photo_url}
                  alt={`${propertyName} foto ${i + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                {showMoreOverlay && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                    <p className="text-2xl font-bold">+{moreCount}</p>
                    <p className="text-xs text-white/70 mt-0.5">ver todas</p>
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setShowGrid(true)}
          className="mt-3 flex items-center gap-1.5 border border-border bg-background text-foreground text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-navy-50 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          Ver todas las fotos · {photos.length}
        </button>
      </div>

      {showGrid && (
        <div className="fixed inset-0 z-[100] bg-black overflow-y-auto">
          <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <div>
              <p className="font-heading text-lg text-white leading-none">{propertyName}</p>
              <p className="text-white/50 text-sm mt-0.5 font-sans">{photos.length} fotos</p>
            </div>
            <button
              onClick={() => setShowGrid(false)}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white"
              aria-label="Cerrar galería"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-6">
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setShowGrid(false)}
                className={`relative rounded-xl overflow-hidden group ${
                  photos.length >= 4 && i === 0 ? 'col-span-2 md:col-span-1 aspect-[16/9] md:aspect-[4/3]' : 'aspect-[4/3]'
                }`}
                aria-label={`Foto ${i + 1}`}
              >
                <Image
                  src={photo.photo_url}
                  alt={`${propertyName} foto ${i + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-lg font-sans opacity-0 group-hover:opacity-100 transition-opacity">
                  {i + 1} / {photos.length}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
