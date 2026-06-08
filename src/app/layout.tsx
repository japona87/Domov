import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, DM_Serif_Display } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

const dmSerif = DM_Serif_Display({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Domov — Gestión Inmobiliaria',
  description: 'Sistema de gestión de arrendamientos',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${dmSerif.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}
