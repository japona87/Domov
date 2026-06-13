'use client'

import Link from 'next/link'
import { useEffect } from 'react'

const links = [
  { label: 'Inicio', href: '/propiedades' },
  { label: 'Propiedades', href: '#propiedades' },
  { label: 'Respaldo SURA', href: '#sura' },
  { label: 'Nosotros', href: '#quienes-somos' },
  { label: 'Preguntas', href: '#faq' },
]

type Props = {
  open: boolean
  onClose: () => void
}

export function MobileMenu({ open, onClose }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleClick = () => {
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-white flex flex-col px-6 pt-8 transition-transform duration-350 ease-in-out"
      style={{
        transform: open ? 'translateY(0)' : 'translateY(-100%)',
      }}
    >
      <div className="flex items-center justify-between mb-8">
        <span className="font-heading text-xl text-[#0F172A]">Domov</span>
        <button onClick={onClose} aria-label="Cerrar menú" className="text-[#0F172A] p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={handleClick}
            className="font-heading text-2xl text-[#0F172A] py-4 border-b border-[#E2E8F0] hover:text-accent transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto pb-10">
        <a
          href="https://wa.me/573213300476?text=Hola%2C%20me%20interesan%20los%20inmuebles%20disponibles%20en%20Domov"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-sans font-semibold text-sm px-6 py-3.5 rounded-xl hover:bg-[#1faf54] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
          Escríbenos por WhatsApp
        </a>
      </div>
    </div>
  )
}
