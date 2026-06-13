import type React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { PropertyFeatures } from '@/types/database'
import { PropertyGallery } from './PropertyGallery'
import { PropertyStats } from '@/components/properties/property-stats'
import { TrustStrip } from '@/components/landing/trust-strip'
import { ScrollReveal } from '@/components/ui/scroll-reveal'

export const revalidate = 300

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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('properties')
    .select('name, address')
    .eq('id', id)
    .single()
  return {
    title: data ? `${data.name} — Domov Soluciones Inmobiliarias` : 'Propiedad | Domov',
    description: data
      ? `Inmueble en ${data.address}. Gestión profesional con Domov Soluciones Inmobiliarias.`
      : '',
  }
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
  const KNOWN_FEATURE_KEYS = new Set(['bedrooms', 'bathrooms', 'area_sqm', 'parking_spots', 'floor', 'total_floors', 'estrato'])
  const extraFeatures = (Object.entries(features) as [string, unknown][])
    .filter(([k]) => !KNOWN_FEATURE_KEYS.has(k))
    .filter(([, v]) => Boolean(v))

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Nav */}
      <nav className="h-20 bg-white border-b border-[#E2E8F0] flex items-center sticky top-0 z-50">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-6">
          <Link href="/propiedades" className="flex items-center gap-3">
            <img src="/logo-domov.png" alt="Domov" className="h-12 w-auto block" />
            <div>
              <span className="font-heading text-xl text-[#0F172A] leading-none block">Domov</span>
              <span className="text-slate-400 text-xs font-sans">Soluciones Inmobiliarias</span>
            </div>
          </Link>
          <Link href="/login" className="text-sm font-semibold bg-[#0F172A] text-white px-5 py-2.5 rounded-xl hover:bg-[#1e293b] transition-colors">
            Ingresar al portal
          </Link>
        </div>
      </nav>

      <TrustStrip />

      {/* Breadcrumb */}
      <div className="bg-[#0F172A] mt-4">
        <div className="max-w-5xl mx-auto px-6 py-3.5">
          <p className="text-xs flex items-center gap-1.5">
            <Link href="/propiedades" className="text-accent hover:text-accent/80 transition-colors font-semibold">
              Propiedades disponibles
            </Link>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50">
              <path d="M9 18l6-6-6-6"/>
            </svg>
            <span className="text-white/80 font-medium">{property.name}</span>
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Main column */}
          <div className="md:col-span-2 space-y-12">

            {property.description && (
              <ScrollReveal>
                <div>
                  <h2 className="font-heading text-2xl text-[#0F172A] mb-3">Descripción</h2>
                  <div className="w-10 h-0.5 bg-accent mb-5" />
                  <p className="text-slate-500 leading-relaxed whitespace-pre-line">{property.description}</p>
                </div>
              </ScrollReveal>
            )}

            {(() => {
              const statsItems = [
                features.bedrooms !== undefined && { icon: <BedIcon />, label: 'Dormitorios', value: String(features.bedrooms) },
                features.bathrooms !== undefined && { icon: <BathIcon />, label: 'Baños', value: String(features.bathrooms) },
                features.area_sqm !== undefined && { icon: <AreaIcon />, label: 'Área', value: `${features.area_sqm} m²` },
                features.parking_spots !== undefined && { icon: <CarIcon />, label: 'Parqueadero', value: String(features.parking_spots) },
                features.floor !== undefined && { icon: <FloorIcon />, label: features.total_floors ? `Piso / ${features.total_floors}` : 'Piso', value: String(features.floor) },
                features.estrato !== undefined && { icon: <StarIcon />, label: 'Estrato', value: String(features.estrato) },
              ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[]

              if (statsItems.length === 0) return null
              return <PropertyStats items={statsItems} />
            })()}

            <ScrollReveal>
              <PropertyGallery photos={photos} propertyName={property.name} />
            </ScrollReveal>

            {extraFeatures.length > 0 && (
              <ScrollReveal>
              <div>
                <h2 className="font-heading text-2xl text-[#0F172A] mb-3">Comodidades</h2>
                <div className="w-10 h-0.5 bg-accent mb-5" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {extraFeatures.map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2.5 py-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent shrink-0">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span className="text-sm text-foreground capitalize">
                        {typeof value === 'boolean'
                          ? key.replace(/_/g, ' ')
                          : `${key.replace(/_/g, ' ')}: ${value}`
                        }
                      </span>
                    </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            )}

            {property.maps_url && property.maps_url.startsWith('https://www.google.com/maps/embed') && (
              <ScrollReveal>
              <div>
                <h2 className="font-heading text-2xl text-[#0F172A] mb-3">Ubicación</h2>
                <div className="w-10 h-0.5 bg-accent mb-5" />
                <div className="rounded-2xl overflow-hidden border border-[#E2E8F0] aspect-video shadow-sm">
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
              </ScrollReveal>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div className="rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-sm sticky top-24">
              {/* Price header */}
              <div className="bg-white px-6 pt-6 pb-5 border-b border-[#E2E8F0]">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Arriendo mensual</p>
                {property.monthly_price ? (
                  <>
                    <p className="text-[#0F172A] text-3xl font-bold leading-none">
                      ${property.monthly_price.toLocaleString('es-CO')}
                      <span className="text-sm font-normal text-slate-400 ml-1">/mes</span>
                    </p>
                    {property.administration_fee && (
                      <p className="text-slate-400 text-xs mt-1.5">
                        + ${property.administration_fee.toLocaleString('es-CO')} administración
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[#0F172A] text-lg">Precio a convenir</p>
                )}
              </div>

              {/* Body */}
              <div className="px-6 py-6 space-y-4 bg-white">

                <Link
                  href="/propiedades"
                  className="flex items-center justify-center gap-2 w-full bg-[#0F172A] text-white font-bold text-base rounded-xl py-4 hover:bg-[#1e293b] transition-colors shadow-sm"
                >
                  ← Ver más propiedades
                </Link>

                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  Domov Soluciones Inmobiliarias — gestión profesional en Colombia
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#0F172A] py-8 mt-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs text-white/50">&copy; 2026 Domov Soluciones Inmobiliarias. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Floating WhatsApp bubble */}
      <a
        href={`https://wa.me/573213300476?text=Hola%2C%20me%20interesa%20el%20inmueble%20${encodeURIComponent(property.name)}%20en%20Domov`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-200"
        aria-label="Contactar por WhatsApp"
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
      </a>
    </div>
  )
}

function BedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6h13a3 3 0 0 1 3 3v3" />
      <path d="M3 14V7" />
      <path d="M21 18v-2" />
      <path d="M7 11V9a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 13 9v2" />
    </svg>
  )
}

function BathIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Z" />
      <path d="M6 12V6a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2" />
      <path d="M7 19l-1 2M18 19l1 2" />
    </svg>
  )
}

function AreaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9V4h5" />
      <path d="M20 15v5h-5" />
      <path d="M15 4h5v5" />
      <path d="M9 20H4v-5" />
    </svg>
  )
}

function CarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13" />
      <path d="M4 13h16v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4Z" />
      <circle cx="7.5" cy="15.5" r="1" />
      <circle cx="16.5" cy="15.5" r="1" />
    </svg>
  )
}

function FloorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5Z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
