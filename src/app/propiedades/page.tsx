import Image from 'next/image'
import Link from 'next/link'
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
  monthly_price: number | null
  administration_fee: number | null
  property_photos: { photo_url: string; is_cover: boolean }[]
}

export default async function PropiedadesPublicasPage() {
  const supabase = await createClient()

  const [{ data: propertiesRaw }, { data: activeContracts }] = await Promise.all([
    supabase
      .from('properties')
      .select('id, name, address, type, description, features, monthly_price, administration_fee, property_photos(photo_url, is_cover)')
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
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="h-16 bg-primary border-b border-primary/20 flex items-center px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link href="/propiedades" className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <img src="/logo-domov.png" alt="Domov" className="h-[1.2rem] w-auto block" />
            </span>
            <span className="font-heading text-xl text-primary-foreground">Domov</span>
          </Link>
          <Link href="/login" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Ingresar al portal
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#151C2A] via-[#2A344E] to-[#1A2538] py-20 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="font-heading text-4xl md:text-5xl text-white leading-tight mb-4">
            Propiedades disponibles
          </h1>
          <p className="text-white/60 text-lg max-w-lg mx-auto mb-8">
            Inmuebles libres para arriendo con gestión profesional. Encuentra el hogar que estás buscando.
          </p>
        </div>
      </section>

      {/* Properties */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {available.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">No hay propiedades disponibles en este momento.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Contáctanos en{' '}
              <a href="mailto:japonte@domov.co" className="text-accent hover:text-accent/80 font-medium">
                japonte@domov.co
              </a>
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-8">
              <span className="font-medium text-foreground">{available.length}</span> propiedad{available.length !== 1 ? 'es' : ''} disponible{available.length !== 1 ? 's' : ''}
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {available.map((property) => {
                const photos = property.property_photos
                const coverPhoto = photos.find((p) => p.is_cover) ?? photos[0]
                const features = (property.features ?? {}) as PropertyFeatures

                return (
                  <Link
                    key={property.id}
                    href={`/propiedades/${property.id}`}
                    className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all block"
                  >
                    {coverPhoto ? (
                      <div className="relative h-48 bg-muted overflow-hidden">
                        <Image
                          src={coverPhoto.photo_url}
                          alt={property.name}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">Sin fotos</span>
                      </div>
                    )}

                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-heading text-lg text-foreground">{property.name}</h2>
                        <Badge variant="secondary" className="shrink-0">
                          {TYPE_LABELS[property.type] ?? property.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {property.address}
                      </p>
                      {property.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{property.description}</p>
                      )}
                      {Object.keys(features).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {features.estrato !== undefined && (
                            <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">Estrato {features.estrato}</span>
                          )}
                          {features.bedrooms !== undefined && (
                            <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">{features.bedrooms} hab.</span>
                          )}
                          {features.bathrooms !== undefined && (
                            <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">{features.bathrooms} baños</span>
                          )}
                          {features.area_sqm !== undefined && (
                            <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">{features.area_sqm} m²</span>
                          )}
                          {features.parking_spots !== undefined && (
                            <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">{features.parking_spots} estac.</span>
                          )}
                          {features.floor !== undefined && (
                            <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">Piso {features.floor}</span>
                          )}
                          {features.total_floors !== undefined && (
                            <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">{features.total_floors} pisos</span>
                          )}
                        </div>
                      )}
                      {property.monthly_price && (
                        <div className="pt-2">
                          <span className="text-lg font-bold text-foreground">
                            ${property.monthly_price.toLocaleString('es-CO')}
                          </span>
                          <span className="text-sm text-muted-foreground">/mes</span>
                          {property.administration_fee ? (
                            <span className="text-xs text-muted-foreground ml-2">
                              + ${property.administration_fee.toLocaleString('es-CO')} admón
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-primary border-t border-primary/20 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-primary-foreground/60">
          <p>&copy; 2026 Domov. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
