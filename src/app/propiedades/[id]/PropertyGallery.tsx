'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

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

  if (photos.length === 0) return null

  const visiblePhotos = photos.slice(0, 6)
  const moreCount = photos.length - 6

  return (
    <>
      <h2 className="font-heading text-2xl text-foreground mb-3">Galería</h2>
      <div className="w-10 h-0.5 bg-accent mb-5" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {visiblePhotos.map((photo, i) => {
          const isLast = i === visiblePhotos.length - 1
          const showMoreOverlay = isLast && moreCount > 0
          return (
            <button
              key={i}
              onClick={() => setLightboxIndex(i)}
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
      {moreCount > 0 && (
        <button
          onClick={() => setLightboxIndex(0)}
          className="mt-3 flex items-center gap-1.5 border border-border bg-background text-foreground text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-navy-50 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          Ver todas las fotos · {photos.length}
        </button>
      )}

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black">
          <div className="relative w-full h-full">
            <Image
              src={photos[lightboxIndex].photo_url}
              alt={`${propertyName} foto ${lightboxIndex + 1}`}
              fill
              className="object-cover"
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
