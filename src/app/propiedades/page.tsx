import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { PropertyFeatures } from '@/types/database'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { SiteHeader } from '@/components/landing/site-header'
import { TrustStrip } from '@/components/landing/trust-strip'
import { FaqSection } from '@/components/landing/faq-section'

export const revalidate = 300

export const metadata = {
  title: 'Propiedades en arriendo | Domov Soluciones Inmobiliarias',
  description: 'Inmuebles en arriendo con gestión profesional y acompañamiento completo. Domov Soluciones Inmobiliarias.',
}

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
    <div className="min-h-screen bg-[#f8fafc] text-[#0F172A]">

      <SiteHeader />

      {/* Hero */}
      <section className="relative h-[88vh] min-h-[560px] flex items-end">
        <Image
          src="/hero.jpg"
          alt="Inmueble Domov"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/90 via-[#0f172a]/40 to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-20 w-full">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full mb-6 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            {available.length} inmueble{available.length !== 1 ? 's' : ''} disponible{available.length !== 1 ? 's' : ''} hoy
          </span>
          <h1 className="font-heading text-6xl md:text-7xl text-white leading-[1.05] mb-6 max-w-3xl">
            Tu próximo hogar,{' '}
            <span className="bg-gradient-to-r from-accent to-[#c4e870] bg-clip-text text-transparent">
              aquí.
            </span>
          </h1>
          <p className="text-white/60 text-lg max-w-sm mb-9 font-sans leading-relaxed">
            Inmuebles en arriendo con gestión profesional y acompañamiento en todo el proceso.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#propiedades"
              className="inline-flex items-center gap-2 bg-white text-[#0F172A] font-sans font-bold text-sm px-6 py-3.5 rounded-xl hover:bg-white/90 transition-colors"
            >
              Ver propiedades disponibles
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <a
              href="https://wa.me/573213300476?text=Hola%2C%20me%20interesan%20los%20inmuebles%20disponibles%20en%20Domov"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/25 text-white font-sans font-semibold text-sm px-6 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-[#E2E8F0] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:divide-x divide-[#E2E8F0]">
          <div
            className="text-center px-6"
            style={{ animation: 'fadeInUp 0.6s ease both 0.1s' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent mx-auto mb-3">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <p className="text-5xl font-sans font-bold text-[#0F172A]">
              <AnimatedCounter target={available.length} />
            </p>
            <p className="text-slate-400 text-sm uppercase tracking-widest mt-2 font-sans">Disponibles hoy</p>
          </div>
          <div
            className="text-center px-6"
            style={{ animation: 'fadeInUp 0.6s ease both 0.25s' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent mx-auto mb-3">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <p className="text-5xl font-sans font-bold text-[#0F172A]">
              <AnimatedCounter target={5} suffix="+" />
            </p>
            <p className="text-slate-400 text-sm uppercase tracking-widest mt-2 font-sans">Años de experiencia</p>
          </div>
          <div
            className="text-center px-6"
            style={{ animation: 'fadeInUp 0.6s ease both 0.4s' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent mx-auto mb-3">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <p className="text-5xl font-sans font-bold text-[#0F172A]">
              <AnimatedCounter target={100} suffix="%" />
            </p>
            <p className="text-slate-400 text-sm uppercase tracking-widest mt-2 font-sans">Gestión profesional</p>
          </div>
        </div>
      </section>

      <TrustStrip />

      {/* Quiénes somos */}
      <section id="quienes-somos" className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Columna izquierda */}
            <div>
              <p className="text-accent font-sans font-semibold text-xs uppercase tracking-widest mb-4">
                Quiénes somos
              </p>
              <h2 className="font-heading text-4xl text-[#0F172A] leading-tight mb-5">
                Gestión inmobiliaria con propósito
              </h2>
              <p className="text-slate-500 font-sans text-base leading-relaxed mb-10">
                Domov Soluciones Inmobiliarias nació para simplificar el arriendo en Colombia — sin letra pequeña, sin demoras y con acompañamiento real en cada etapa del proceso.
              </p>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <path d="m9 12 2 2 4-4"/>
                    </svg>
                  </span>
                  <div>
                    <p className="font-sans font-semibold text-sm text-[#0F172A]">Transparencia</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Cada cláusula, cada cobro y cada novedad explicados con claridad.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </span>
                  <div>
                    <p className="font-sans font-semibold text-sm text-[#0F172A]">Acompañamiento</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Estamos contigo desde la búsqueda hasta la renovación del contrato.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </span>
                  <div>
                    <p className="font-sans font-semibold text-sm text-[#0F172A]">Profesionalismo</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Más de 5 años administrando inmuebles con rigor, puntualidad y ética.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha: Misión + Visión */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-8">
                <p className="text-accent font-sans font-semibold text-xs uppercase tracking-widest mb-3">Misión</p>
                <p className="font-heading text-xl text-[#0F172A] leading-snug">
                  Conectar propietarios e inquilinos con soluciones inmobiliarias transparentes, eficientes y humanas, administrando cada inmueble como si fuera nuestro.
                </p>
              </div>
              <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-8">
                <p className="text-slate-400 font-sans font-semibold text-xs uppercase tracking-widest mb-3">Visión</p>
                <p className="font-heading text-xl text-[#0F172A] leading-snug">
                  Ser la firma de gestión inmobiliaria de referencia en Colombia, reconocida por la confianza que generamos y la tecnología que nos respalda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Aliados Comerciales — Sura */}
      <section id="sura" className="bg-[#F8FAFC] py-24 border-t border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-accent font-sans font-semibold text-xs uppercase tracking-widest mb-3">
                Aliados Comerciales
              </p>
              <h2 className="font-heading text-4xl text-[#0F172A] leading-tight max-w-lg">
                Protege tus ingresos con el Seguro de Arrendamiento Sura
              </h2>
            </div>
            <p className="text-slate-500 font-sans text-sm leading-relaxed max-w-xs">
              En alianza con <span className="font-semibold text-[#0F172A]">Suramericana</span>, te respaldamos y garantizamos que siempre recibas tus ingresos, incluso si el inquilino incumple.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
                title: 'Sin codeudor',
                desc: 'Si tu inquilino es apto para el seguro 100% digital, no necesitará codeudor. Menos papeleo, más agilidad.',
              },
              {
                icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
                title: 'Garantía de pago',
                desc: 'Sura garantiza el pago del arriendo mensual y cuotas de administración. Hasta 12 meses de indemnización.',
              },
              {
                icon: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>,
                title: 'Asistencia domiciliaria',
                desc: 'Cubre emergencias del hogar: plomería, electricidad, cerrajería y vidrios. Incluye asesoría jurídica telefónica.',
              },
              {
                icon: <><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
                title: '100% digital',
                desc: 'Reclamaciones en línea desde cualquier dispositivo. Disponible en plazos de 3, 6 o 12 meses.',
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-[#E2E8F0] rounded-2xl p-7 flex items-start gap-5 hover:border-accent/30 hover:shadow-md transition-all duration-300"
              >
                <span className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                    {icon}
                  </svg>
                </span>
                <div>
                  <p className="font-sans font-semibold text-base text-[#0F172A] mb-1">{title}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-slate-400 font-sans">
            Seguro de arrendamiento ofrecido por <span className="font-semibold text-slate-600">Suramericana S.A.</span> — Vigilada Superfinanciera de Colombia
          </p>
        </div>
      </section>

      {/* Properties */}
      <section id="propiedades" className="py-20 border-t border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-6">
          {available.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <h3 className="font-sans font-semibold text-xl text-[#0F172A] mb-2">Sin propiedades disponibles</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
                No hay propiedades disponibles en este momento. Contáctanos y te avisamos cuando haya nuevas opciones.
              </p>
              <a
                href="https://wa.me/573213300476?text=Hola%2C%20me%20interesan%20los%20inmuebles%20disponibles%20en%20Domov"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#0F172A] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1e293b] transition-colors"
              >
                Contactar por WhatsApp
              </a>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-2 font-sans">
                    Inmuebles disponibles
                  </p>
                  <h2 className="font-heading text-4xl md:text-5xl text-[#0F172A]">
                    Encuentra tu próximo hogar
                  </h2>
                </div>
                <p className="text-slate-400 text-sm hidden md:block font-sans">
                  {available.length} disponible{available.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {available.map((property) => {
                  const photos = property.property_photos
                  const coverPhoto = photos.find((p) => p.is_cover) ?? photos[0]
                  const features = (property.features ?? {}) as PropertyFeatures

                  return (
                    <Link
                      key={property.id}
                      href={`/propiedades/${property.id}`}
                      className="group relative block bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden hover:border-[#0F172A]/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* Spotlight hover glow */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none z-10"
                        style={{ background: 'radial-gradient(400px at 50% 0%, rgba(144,199,74,0.08) 0%, transparent 70%)' }}
                      />

                      {/* Image */}
                      <div className="relative h-[240px] overflow-hidden">
                        {coverPhoto ? (
                          <Image
                            src={coverPhoto.photo_url}
                            alt={property.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#F8FAFC] flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                              <polyline points="9 22 9 12 15 12 15 22"/>
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />

                        <span className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm border border-white/60 text-[#0F172A] text-[0.65rem] font-semibold px-2.5 py-1 rounded-lg uppercase font-sans">
                          {TYPE_LABELS[property.type] ?? property.type}
                        </span>
                        <span className="absolute top-3 right-3 bg-accent text-white text-[0.65rem] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide font-sans">
                          Disponible
                        </span>

                        {property.monthly_price && (
                          <div className="absolute bottom-3 left-4">
                            <p className="text-slate-500 text-[0.6rem] uppercase tracking-wider font-sans">Arriendo mensual</p>
                            <p className="text-[#0F172A] font-bold text-xl leading-none font-sans">
                              ${property.monthly_price.toLocaleString('es-CO')}
                              <span className="text-xs font-normal text-slate-400 ml-1">/mes</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Body */}
                      <div className="p-5">
                        <h3 className="font-heading text-lg text-[#0F172A] leading-snug">{property.name}</h3>
                        <p className="text-slate-400 text-sm mt-1 font-sans flex items-center gap-1.5">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          {property.address}
                        </p>

                        {(features.bedrooms !== undefined || features.bathrooms !== undefined || features.area_sqm !== undefined) && (
                          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#E2E8F0]">
                            {features.bedrooms !== undefined && (
                              <span className="flex items-center gap-1.5 text-slate-400 text-xs font-sans">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M2 4v16M22 4v16M2 8h20M2 16h20"/>
                                </svg>
                                {features.bedrooms} hab.
                              </span>
                            )}
                            {features.bathrooms !== undefined && (
                              <span className="flex items-center gap-1.5 text-slate-400 text-xs font-sans">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                                </svg>
                                {features.bathrooms} baños
                              </span>
                            )}
                            {features.area_sqm !== undefined && (
                              <span className="flex items-center gap-1.5 text-slate-400 text-xs font-sans">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="15 3 21 3 21 9"/>
                                  <polyline points="9 21 3 21 3 15"/>
                                  <line x1="21" y1="3" x2="14" y2="10"/>
                                  <line x1="3" y1="21" x2="10" y2="14"/>
                                </svg>
                                {features.area_sqm} m²
                              </span>
                            )}
                            <span className="ml-auto text-accent text-xs font-semibold font-sans group-hover:underline">
                              Ver →
                            </span>
                          </div>
                        )}

                        {features.bedrooms === undefined && features.bathrooms === undefined && features.area_sqm === undefined && (
                          <div className="flex items-center justify-end mt-4 pt-4 border-t border-[#E2E8F0]">
                            <span className="text-accent text-xs font-semibold font-sans group-hover:underline">
                              Ver →
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <FaqSection />

      {/* Footer */}
      <footer className="bg-[#0F172A] pt-16 pb-8 mt-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 pb-12 border-b border-white/8">

            {/* Col 1: Marca */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-12 h-12 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
                  <img src="/logo-domov.png" alt="Domov" className="h-7 w-auto" />
                </span>
                <div>
                  <p className="font-heading text-white text-lg leading-none">Domov</p>
                  <p className="text-white/35 text-xs mt-0.5 font-sans">Soluciones Inmobiliarias</p>
                </div>
              </div>
              <p className="text-white/50 text-sm leading-relaxed font-sans">
                Conectamos propietarios e inquilinos con soluciones transparentes, eficientes y humanas.
              </p>
            </div>

            {/* Col 2: Contacto */}
            <div>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-5 font-sans">Contacto</p>
              <div className="space-y-3">
                <a
                  href="https://wa.me/573213300476"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-white/60 text-sm hover:text-white transition-colors font-sans"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-accent shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                  +57 321 330 0476
                </a>
                <p className="flex items-center gap-2.5 text-white/60 text-sm font-sans">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent shrink-0">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  info@domov.co
                </p>
                <p className="flex items-center gap-2.5 text-white/60 text-sm font-sans">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Colombia
                </p>
              </div>
            </div>

            {/* Col 3: Sura */}
            <div>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-5 font-sans">Aliados</p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <p className="text-white text-sm font-semibold font-sans">Seguro Sura</p>
                </div>
                <p className="text-white/45 text-xs leading-relaxed font-sans">
                  Inmuebles protegidos con el seguro de arrendamiento de Suramericana S.A.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 text-center">
            <p className="text-white/25 text-xs font-sans">
              &copy; 2026 Domov Soluciones Inmobiliarias. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp bubble */}
      <a
        href="https://wa.me/573213300476?text=Hola%2C%20me%20interesan%20los%20inmuebles%20disponibles%20en%20Domov"
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
