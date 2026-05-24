import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import type { PropertyFeatures } from '@/types/database'

export const revalidate = 300

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartamento',
  house: 'Casa',
  office: 'Oficina',
  local: 'Local comercial',
  garage: 'Garaje',
  other: 'Inmueble',
}

type PropertyDetail = {
  id: string
  name: string
  address: string
  type: string
  description: string | null
  features: PropertyFeatures
  monthly_price: number | null
  administration_fee: number | null
  maps_url: string | null
  property_photos: { photo_url: string; is_cover: boolean; sort_order: number }[]
}

export default async function PropiedadDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('properties')
    .select('id, name, address, type, description, features, monthly_price, administration_fee, maps_url, property_photos(photo_url, is_cover, sort_order)')
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (!data) notFound()

  const property = data as unknown as PropertyDetail
  const photos = [...property.property_photos].sort((a, b) => {
    if (a.is_cover) return -1
    if (b.is_cover) return 1
    return a.sort_order - b.sort_order
  })
  const features = (property.features ?? {}) as PropertyFeatures

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="h-16 bg-primary border-b border-primary/20 flex items-center px-6 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
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

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Breadcrumb */}
        <p className="text-sm text-muted-foreground">
          <Link href="/propiedades" className="hover:text-foreground transition-colors">Propiedades disponibles</Link>
          {' / '}{property.name}
        </p>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl text-foreground">{property.name}</h1>
            <p className="text-muted-foreground flex items-center gap-1.5 mt-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {property.address}
            </p>
          </div>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {TYPE_LABELS[property.type] ?? property.type}
          </Badge>
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-2xl overflow-hidden">
            {photos[0] && (
              <div className="relative aspect-[4/3] md:row-span-2">
                <Image
                  src={photos[0].photo_url}
                  alt={property.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            )}
            {photos.slice(1, 3).map((photo, i) => (
              <div key={i} className="relative aspect-[4/3]">
                <Image
                  src={photo.photo_url}
                  alt={`${property.name} foto ${i + 2}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              </div>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main info */}
          <div className="md:col-span-2 space-y-8">
            {property.description && (
              <div>
                <h2 className="font-heading text-xl text-foreground mb-3">Descripción</h2>
                <p className="text-muted-foreground leading-relaxed">{property.description}</p>
              </div>
            )}

            {Object.keys(features).length > 0 && (
              <div>
                <h2 className="font-heading text-xl text-foreground mb-4">Características</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {features.bedrooms !== undefined && (
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{features.bedrooms}</p>
                      <p className="text-xs text-muted-foreground mt-1">Habitaciones</p>
                    </div>
                  )}
                  {features.bathrooms !== undefined && (
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{features.bathrooms}</p>
                      <p className="text-xs text-muted-foreground mt-1">Baños</p>
                    </div>
                  )}
                  {features.area_sqm !== undefined && (
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{features.area_sqm}</p>
                      <p className="text-xs text-muted-foreground mt-1">m²</p>
                    </div>
                  )}
                  {features.parking_spots !== undefined && (
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{features.parking_spots}</p>
                      <p className="text-xs text-muted-foreground mt-1">Estacionamientos</p>
                    </div>
                  )}
                  {features.floor !== undefined && (
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{features.floor}</p>
                      <p className="text-xs text-muted-foreground mt-1">Piso</p>
                    </div>
                  )}
                  {features.estrato !== undefined && (
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{features.estrato}</p>
                      <p className="text-xs text-muted-foreground mt-1">Estrato</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Map */}
            {property.maps_url && property.maps_url.startsWith('https://www.google.com/maps/embed') && (
              <div>
                <h2 className="font-heading text-xl text-foreground mb-4">Ubicación</h2>
                <div className="rounded-2xl overflow-hidden border border-border aspect-video">
                  <iframe
                    src={property.maps_url}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Ubicación de ${property.name}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: price + contact */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-24 space-y-4">
              {property.monthly_price ? (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Arriendo mensual</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${property.monthly_price.toLocaleString('es-CO')}
                  </p>
                  {property.administration_fee && (
                    <p className="text-sm text-muted-foreground mt-1">
                      + ${property.administration_fee.toLocaleString('es-CO')} administración
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Precio a convenir</p>
              )}

              <div className="border-t border-border pt-4 space-y-3">
                <p className="text-sm font-medium text-foreground">¿Te interesa este inmueble?</p>
                <a
                  href="mailto:japonte@domov.co"
                  className="flex items-center justify-center gap-2 w-full bg-accent text-accent-foreground font-medium text-sm rounded-xl py-3 hover:bg-accent/90 transition-colors"
                >
                  Contactar
                </a>
                <Link
                  href="/propiedades"
                  className="flex items-center justify-center gap-2 w-full border border-border text-foreground text-sm rounded-xl py-3 hover:bg-muted transition-colors"
                >
                  Ver más propiedades
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-primary border-t border-primary/20 py-12 mt-16">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-primary-foreground/60">
          <p>&copy; 2026 Domov. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
