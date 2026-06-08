'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/actions/auth'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleLogout() {
    startTransition(async () => {
      await logout()
      router.refresh()
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-2"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {isPending ? 'Saliendo...' : 'Cerrar sesión'}
        </Button>
      } />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <img src="/logo-domov.png" alt="Domov" className="h-7 w-auto" />
          </AlertDialogMedia>
          <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a salir del panel de administración. Necesitarás iniciar sesión nuevamente para acceder.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout} variant="destructive">
            {isPending ? 'Saliendo...' : 'Cerrar sesión'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
