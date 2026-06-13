'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function NavigationOverlay() {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  const [show, setShow] = useState(false)
  const timerRef = useRef<any>(null)

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = undefined
      }
      setShow(false)
    }
  }, [pathname])

  useEffect(() => {
    function startTimer() {
      if (timerRef.current) clearTimeout(timerRef.current)
      setShow(false)
      timerRef.current = setTimeout(() => setShow(true), 1000)
    }

    function handleClick(e: MouseEvent) {
      const link = (e.target as Element).closest('a')
      if (!link) return
      const href = link.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return
      startTimer()
    }

    window.addEventListener('popstate', startTimer)
    document.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('popstate', startTimer)
      document.removeEventListener('click', handleClick)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl px-12 py-12 flex flex-col items-center gap-6 min-w-[240px]">
        <img src="/logo-domov.png" alt="Domov" className="h-14 w-auto" />
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-lime-500 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-700">Cargando...</p>
      </div>
    </div>
  )
}
