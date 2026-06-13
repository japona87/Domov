import type { Metadata } from 'next'
import { Marcellus, Jost } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const jost = Jost({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const marcellus = Marcellus({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400'],
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
        className={`${jost.variable} ${marcellus.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}
