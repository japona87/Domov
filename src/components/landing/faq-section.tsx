'use client'

import { useState } from 'react'

const FAQ = [
  {
    q: '¿Cómo funciona la póliza de arrendamiento con SURA?',
    a: 'Gestionamos una póliza respaldada por SURA que garantiza el pago del canon y los servicios públicos ante el propietario, incluso si el inquilino presenta moras o dificultades temporales. El propietario tiene tranquilidad total y el arrendatario un proceso claro y protegido.',
  },
  {
    q: '¿Qué necesito para postularme a un inmueble?',
    a: 'El estudio de postulación se realiza a través de los productos de SURA, lo que permite un proceso transparente y verídico. Solo necesitas tu documento de identidad y los soportes de ingresos; te acompañamos paso a paso y confirmamos el resultado en el menor tiempo posible.',
  },
  {
    q: '¿Atienden tanto arriendo como venta?',
    a: 'Sí. Gestionamos arriendo y venta de apartamentos, casas, apartaestudios y locales comerciales. Cuéntanos qué buscas y filtramos las mejores opciones disponibles según tu presupuesto y zona de interés.',
  },
  {
    q: '¿En qué ciudades y zonas tienen inmuebles?',
    a: 'Trabajamos principalmente en el Valle de Aburrá y el Oriente antioqueño: Medellín, Envigado, Sabaneta, Bello, Rionegro y alrededores. Nuestro portafolio se actualiza constantemente, así que escríbenos si no ves la zona que buscas.',
  },
  {
    q: '¿Tiene algún costo recibir asesoría?',
    a: 'No. La asesoría inicial es completamente gratuita y sin compromiso. Te ayudamos a entender el proceso, los costos asociados y las garantías antes de que tomes cualquier decisión.',
  },
]

export function FaqSection() {
  const [open, setOpen] = useState(-1)

  return (
    <section id="faq" className="py-20 border-t border-[#E2E8F0]">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-2 font-sans text-center">
          Preguntas frecuentes
        </p>
        <h2 className="font-heading text-4xl md:text-5xl text-[#0F172A] text-center mb-12">
          Resolvemos tus dudas
        </h2>

        <div className="max-w-3xl mx-auto">
          {FAQ.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={i} className="border-b border-[#E2E8F0]">
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left font-sans text-[#0F172A] font-medium text-base hover:text-accent transition-colors"
                >
                  <span>{item.q}</span>
                  <span
                    className="w-5 h-5 shrink-0 relative transition-transform duration-300"
                    style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: isOpen ? '300px' : '0' }}
                >
                  <p className="text-slate-500 text-sm font-sans pb-5 leading-relaxed pr-8">
                    {item.a}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
