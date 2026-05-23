// src/app/propiedades/page.tsx
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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
    <div className="min-h-screen flex flex-col bg-cream">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-800 border-b border-navy-700">
        <div className="max-w-[1280px] mx-auto px-6 h-[68px] flex items-center justify-between">
          <Link href="/propiedades" className="font-heading text-2xl text-white">
            Dom<span className="text-lime-500">ov</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm text-navy-200 hover:text-white transition-colors">Inicio</Link>
            <Link href="/propiedades" className="text-sm text-white font-medium">Propiedades</Link>
            <a href="/#nosotros" className="text-sm text-navy-200 hover:text-white transition-colors">Nosotros</a>
            <a href="/#contacto" className="text-sm text-navy-200 hover:text-white transition-colors">Contacto</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-lime-500 text-navy-900 hover:bg-lime-400 transition-colors"
            >
              Ingresar
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Page Header ── */}
      <section className="bg-navy-800 pt-[68px]">
        <div className="max-w-[1280px] mx-auto px-6 py-12">
          <h1 className="font-heading text-white text-[2.5rem] mb-2">Propiedades disponibles</h1>
          <p className="text-navy-200">Inmuebles listos para arrendar</p>
        </div>
      </section>

      {/* ── Main Content ── */}
      <main className="flex-1">
        <section className="bg-cream py-12">
          <div className="max-w-[1280px] mx-auto px-6">
            {available.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <p className="font-heading text-xl text-navy-300 mb-2">Sin propiedades disponibles</p>
                <p className="text-sm">Vuelve pronto, estamos actualizando nuestro inventario.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {available.map((property) => {
                  const photos = property.property_photos
                  const coverPhotoObj = photos.find((p) => p.is_cover) ?? photos[0]
                  const coverPhoto = coverPhotoObj?.photo_url ?? null
                  const features = (property.features ?? {}) as PropertyFeatures

                  return (
                    <div
                      key={property.id}
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-250 flex flex-col"
                    >
                      {/* Photo */}
                      <div className="relative h-[220px] overflow-hidden bg-navy-100">
                        {coverPhoto ? (
                          <Image
                            src={coverPhoto}
                            alt={property.name}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-400"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-navy-300">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            </svg>
                          </div>
                        )}
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-navy-800 text-white">
                          {TYPE_LABELS[property.type] ?? property.type}
                        </span>
                      </div>

                      {/* Body */}
                      <div className="p-5 flex-1">
                        <h3 className="font-heading text-[1.125rem] text-navy-800 mb-1">{property.name}</h3>
                        <p className="text-sm text-slate-500 mb-4">{property.address}</p>
                        {/* Feature chips */}
                        <div className="flex flex-wrap gap-1 pt-3 border-t border-cream-dark text-xs text-slate-500">
                          {features.bedrooms !== undefined && (
                            <span className="bg-cream px-2 py-1 rounded-full">{features.bedrooms} hab</span>
                          )}
                          {features.bathrooms !== undefined && (
                            <span className="bg-cream px-2 py-1 rounded-full">{features.bathrooms} baños</span>
                          )}
                          {features.area_sqm !== undefined && (
                            <span className="bg-cream px-2 py-1 rounded-full">{features.area_sqm} m²</span>
                          )}
                          {features.parking_spots !== undefined && (
                            <span className="bg-cream px-2 py-1 rounded-full">{features.parking_spots} parq.</span>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-5 py-4 border-t border-cream-dark flex items-center justify-between">
                        <p className="font-heading text-[1.125rem] text-lime-500">Disponible</p>
                        <span className="text-sm text-navy-600 font-medium">Ver más →</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-navy-900 text-navy-200">
        <div className="max-w-[1280px] mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div>
              <h3 className="font-heading text-2xl text-white mb-3">
                Dom<span className="text-lime-500">ov</span>
              </h3>
              <p className="text-sm leading-relaxed">
                Gestión inmobiliaria profesional. Más de 15 años construyendo confianza con propietarios e inquilinos en todo Chile.
              </p>
            </div>

            {/* Servicios */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Servicios</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Administración de propiedades</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Arriendo de inmuebles</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Asesoría legal</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gestión de mantenciones</a></li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:japonte@domov.co" className="hover:text-white transition-colors">japonte@domov.co</a></li>
                <li><a href="#" className="hover:text-white transition-colors">+56 9 1234 5678</a></li>
                <li><span>Santiago, Chile</span></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Términos y condiciones</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Trabaja con nosotros</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-navy-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-navy-400">
            <span>&copy; 2026 Domov. Todos los derechos reservados.</span>
            <span>Hecho con dedicación en Chile</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
