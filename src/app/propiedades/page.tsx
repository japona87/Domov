// src/app/propiedades/page.tsx
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import type { PropertyFeatures } from '@/types/database'

export const revalidate = 300

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartamento',
  house: 'Casa',
  office: 'Oficina',
  local: 'Local',
  garage: 'Garaje',
  other: 'Inmueble',
}

type PropertyWithPhotos = {
  id: string
  name: string
  address: string
  type: string
  description: string | null
  features: PropertyFeatures
  property_photos: { photo_url: string; is_cover: boolean }[]
}

export default async function PropiedadesPublicasPage() {
  const supabase = await createClient()

  const [{ data: propertiesRaw }, { data: activeContracts }] = await Promise.all([
    supabase
      .from('properties')
      .select('id, name, address, type, description, features, property_photos(photo_url, is_cover)')
      .eq('is_published', true)
      .order('name'),
    supabase
      .from('contracts')
      .select('property_id')
      .in('status', ['active', 'ending']),
  ])

  const properties = (propertiesRaw ?? []) as unknown as PropertyWithPhotos[]
  const occupiedSet = new Set(activeContracts?.map((c) => c.property_id) ?? [])
  const available = properties.filter((p) => !occupiedSet.has(p.id))

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">Domov — Propiedades disponibles</h1>
          <a
            href="mailto:japonte@domov.co"
            className="text-sm text-blue-600 hover:underline"
          >
            Contactar
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {available.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg">No hay propiedades disponibles en este momento.</p>
            <p className="text-sm mt-2">
              Contáctanos en{' '}
              <a href="mailto:japonte@domov.co" className="text-blue-600 hover:underline">
                japonte@domov.co
              </a>
            </p>
          </div>
        ) : (
          <>
            <p className="text-slate-500 text-sm">{available.length} propiedad{available.length !== 1 ? 'es' : ''} disponible{available.length !== 1 ? 's' : ''}</p>
            <div className="grid gap-6 md:grid-cols-2">
              {available.map((property) => {
                const photos = property.property_photos
                const coverPhoto = photos.find((p) => p.is_cover) ?? photos[0]
                const features = (property.features ?? {}) as PropertyFeatures

                return (
                  <div
                    key={property.id}
                    className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {coverPhoto ? (
                      <div className="relative h-48 bg-slate-200">
                        <Image
                          src={coverPhoto.photo_url}
                          alt={property.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-slate-200 flex items-center justify-center">
                        <span className="text-slate-400 text-sm">Sin fotos</span>
                      </div>
                    )}

                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-semibold text-slate-800">{property.name}</h2>
                        <Badge variant="secondary" className="shrink-0">
                          {TYPE_LABELS[property.type] ?? property.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">{property.address}</p>
                      {property.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">{property.description}</p>
                      )}
                      {Object.keys(features).length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {features.bedrooms !== undefined && (
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">{features.bedrooms} hab.</span>
                          )}
                          {features.bathrooms !== undefined && (
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">{features.bathrooms} baños</span>
                          )}
                          {features.area_sqm !== undefined && (
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">{features.area_sqm} m²</span>
                          )}
                          {features.parking_spots !== undefined && (
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">{features.parking_spots} parq.</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
