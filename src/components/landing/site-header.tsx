'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MobileMenu } from '@/components/landing/mobile-menu'

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav className="h-28 bg-white border-b border-[#E2E8F0] flex items-center sticky top-0 z-50">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between px-6">
          <Link href="/propiedades" className="flex items-center gap-3">
            <img src="/logo-domov.png" alt="Domov" className="h-16 w-auto block" />
            <div>
              <span className="font-heading text-xl text-[#0F172A] leading-none block">Domov</span>
              <span className="text-slate-400 text-[0.65rem] font-sans">Soluciones Inmobiliarias</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/propiedades" className="text-[0.9375rem] text-slate-500 hover:text-[#0F172A] transition-colors">Inicio</Link>
            <Link href="#propiedades" className="text-[0.9375rem] text-slate-500 hover:text-[#0F172A] transition-colors">Propiedades</Link>
            <Link href="#sura" className="text-[0.9375rem] text-slate-500 hover:text-[#0F172A] transition-colors">Respaldo SURA</Link>
            <Link href="#faq" className="text-[0.9375rem] text-slate-500 hover:text-[#0F172A] transition-colors">Preguntas</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[0.9375rem] text-slate-500 hover:text-[#0F172A] transition-colors px-3 py-2 hidden md:block">
              Ingresar
            </Link>
            <Link
              href="#propiedades"
              className="bg-[#0F172A] hover:bg-[#1e293b] text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors hidden md:inline-flex"
            >
              Ver propiedades
            </Link>
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden text-[#0F172A] p-2"
              aria-label="Abrir menú"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
