'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single() as { data: { role: UserRole } | null; error: unknown }

    if (profile?.role === 'admin') {
      router.push('/admin/dashboard')
    } else if (profile?.role === 'owner') {
      router.push('/owner/dashboard')
    } else {
      router.push('/tenant/dashboard')
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center gap-3 mb-4 lg:hidden">
        <span className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
          <img src="/logo-domov.png" alt="Domov" className="h-9 w-auto block brightness-0 invert" />
        </span>
        <span className="font-heading text-3xl text-foreground">Domov</span>
      </div>
      <h1 className="text-3xl font-heading text-foreground mt-8 lg:mt-0">Bienvenido de vuelta</h1>
      <p className="text-base text-muted-foreground mt-2 mb-10">Ingresa a tu portal de arrendamientos</p>

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            className="h-12"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••••"
            className="h-12"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <a href="mailto:japonte@domov.co" className="text-primary underline underline-offset-2">
            Contáctanos
          </a>
        </p>
      </form>
    </div>
  )
}
