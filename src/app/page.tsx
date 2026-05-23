import Link from 'next/link'

export const revalidate = 3600

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-800 h-[68px] flex items-center px-6">
        <div className="w-full max-w-[1280px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-heading text-2xl text-white tracking-tight">
            Dom<span className="text-lime-500">ov</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {([['/', 'Inicio'], ['/propiedades', 'Propiedades'], ['#nosotros', 'Nosotros'], ['#contacto', 'Contacto']] as [string, string][]).map(([href, label]) => (
              <Link key={href} href={href} className="text-[0.9375rem] text-navy-200 hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[0.9375rem] text-navy-200 hover:text-white transition-colors px-4 py-2">
              Ingresar
            </Link>
            <Link href="/propiedades" className="bg-lime-500 hover:bg-lime-400 text-navy-900 text-sm font-semibold px-4 py-2 rounded-md transition-all duration-150">
              Ver propiedades
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="min-h-screen bg-navy-900 flex items-center relative overflow-hidden" style={{background: 'linear-gradient(135deg, #020D24 0%, #0D2D5A 50%, #071F43 100%)'}}>
        <div className="absolute inset-0 opacity-40" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}} />
        <div className="relative z-10 w-full max-w-[720px] mx-auto text-center px-6">
          <h1 className="font-heading text-white leading-[1.05] tracking-tight mb-6" style={{fontSize: 'clamp(2.5rem, 6vw, 4rem)'}}>
            Encuentra el hogar que mereces
          </h1>
          <p className="text-[1.125rem] text-navy-200 leading-relaxed mb-10 max-w-[520px] mx-auto">
            Gestión profesional de arriendos en Colombia. Confianza, transparencia y acompañamiento en cada etapa.
          </p>
          <Link href="/propiedades" className="inline-block bg-lime-500 hover:bg-lime-400 text-navy-900 font-semibold px-8 py-4 rounded-md transition-all duration-150 text-[1rem]">
            Ver propiedades disponibles
          </Link>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white border-b border-cream-dark py-12">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {([['49+', 'Propiedades gestionadas'], ['100%', 'Transparencia garantizada'], ['15+', 'Años de experiencia']] as [string, string][]).map(([num, label], i) => (
              <div key={i}>
                <p className="font-heading text-[2.75rem] text-navy-800 leading-none mb-2">{num}</p>
                <p className="text-[0.9375rem] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value Props ── */}
      <section id="nosotros" className="py-20 bg-cream">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center max-w-[640px] mx-auto mb-12">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-lime-500 mb-3">
              — Por qué elegirnos —
            </p>
            <h2 className="font-heading text-navy-800 mb-4" style={{fontSize: 'clamp(1.75rem, 3vw, 2.5rem)'}}>
              Gestión que genera confianza
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Pagos al día', desc: 'Registro digital de cada cuota con comprobante. Sin papeles perdidos ni confusiones.' },
              { title: 'Contratos claros', desc: 'Seguimiento completo del ciclo de vida del contrato, renovaciones y terminaciones.' },
              { title: 'Propiedades actualizadas', desc: 'Inmuebles disponibles publicados en tiempo real con fotos y características.' },
            ].map((v, i) => (
              <div key={i} className="bg-white rounded-xl p-8 shadow-sm text-center">
                <div className="w-16 h-16 mx-auto mb-5 bg-navy-50 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-navy-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-heading text-[1.125rem] text-navy-800 mb-2">{v.title}</h3>
                <p className="text-[0.9375rem] text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contacto" className="bg-navy-900 text-navy-200 pt-16 pb-8">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="font-heading text-2xl text-white mb-4">Dom<span className="text-lime-500">ov</span></h3>
              <p className="text-[0.9375rem] leading-relaxed max-w-[320px]">
                Gestión inmobiliaria profesional en Colombia. Administramos tu propiedad con transparencia y tecnología.
              </p>
            </div>
            <div>
              <h4 className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-white mb-5">Navegación</h4>
              <ul className="space-y-3">
                {([['/propiedades', 'Propiedades disponibles'], ['/login', 'Portal arrendatarios']] as [string, string][]).map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-[0.9375rem] text-navy-300 hover:text-lime-400 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-white mb-5">Contacto</h4>
              <ul className="space-y-3 text-[0.9375rem] text-navy-300">
                <li>Colombia</li>
                <li>info@domov.co</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-navy-700 pt-8 flex items-center justify-between text-sm text-navy-400">
            <p>© 2026 Domov. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
