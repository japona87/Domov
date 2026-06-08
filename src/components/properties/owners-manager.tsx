'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { linkOwnerToProperty, unlinkOwnerFromProperty, updateOwnershipPct } from '@/lib/actions/property-owners'
import { getOwners } from '@/lib/actions/owners'
import { toast } from 'sonner'
import { LoadingOverlay } from '@/components/admin/loading-overlay'

interface OwnerOption {
  id: string
  full_name: string
}

interface PropertyOwner {
  id: string
  ownership_pct: number
  owners: {
    id: string
    full_name: string
    document_number: string | null
    phone: string | null
    email: string | null
  } | null
}

interface OwnersManagerProps {
  propertyId: string
  owners: PropertyOwner[]
}

export function OwnersManager({ propertyId, owners }: OwnersManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [showAddForm, setShowAddForm] = useState(false)
  const [allOwners, setAllOwners] = useState<OwnerOption[]>([])
  const [loadingOwners, setLoadingOwners] = useState(false)
  const [selectedOwnerId, setSelectedOwnerId] = useState('')
  const [newPct, setNewPct] = useState('100')
  const [editingPct, setEditingPct] = useState<string | null>(null)
  const [editPctValue, setEditPctValue] = useState('')

  const totalPct = owners.reduce((sum, o) => sum + o.ownership_pct, 0)
  const linkedOwnerIds = new Set(owners.map((o) => o.owners?.id).filter(Boolean))

  useEffect(() => {
    if (showAddForm && allOwners.length === 0) {
      setLoadingOwners(true)
      getOwners().then((result) => {
        setAllOwners(result.filter((r) => !linkedOwnerIds.has(r.id)))
        setLoadingOwners(false)
      })
    }
  }, [showAddForm])

  function handleLink() {
    if (!selectedOwnerId) return
    startTransition(async () => {
      const result = await linkOwnerToProperty(propertyId, selectedOwnerId, Number(newPct) || 100)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Propietario vinculado')
        setShowAddForm(false)
        setSelectedOwnerId('')
        setNewPct('100')
      }
    })
  }

  function handleUnlink(propertyOwnerId: string) {
    startTransition(async () => {
      const result = await unlinkOwnerFromProperty(propertyOwnerId, propertyId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Propietario desvinculado')
      }
    })
  }

  function handleUpdatePct(propertyOwnerId: string) {
    startTransition(async () => {
      const result = await updateOwnershipPct(propertyOwnerId, propertyId, Number(editPctValue))
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Porcentaje actualizado')
        setEditingPct(null)
      }
    })
  }

  return (
    <>
      <LoadingOverlay pending={isPending} message="Actualizando propietarios..." />
      <div className="space-y-4">
      {owners.length > 0 ? (
        <div className="space-y-2">
          {owners.map((o) => (
            <div key={o.id} className="flex items-center justify-between bg-muted/50 rounded-md px-4 py-3">
              <div>
                {o.owners ? (
                  <Link href={`/admin/propietarios/${o.owners.id}`} className="font-medium text-foreground hover:text-accent transition-colors">
                    {o.owners.full_name}
                  </Link>
                ) : (
                  <p className="text-muted-foreground text-sm">Propietario eliminado</p>
                )}
                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                  {o.owners?.document_number && <span>CC: {o.owners.document_number}</span>}
                  {o.owners?.phone && <span>{o.owners.phone}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {editingPct === o.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={editPctValue}
                      onChange={(e) => setEditPctValue(e.target.value)}
                      className="w-20 h-8 text-sm"
                    />
                    <Button size="sm" variant="ghost" onClick={() => handleUpdatePct(o.id)} disabled={isPending}>
                      OK
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingPct(null)}>
                      X
                    </Button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => { setEditingPct(o.id); setEditPctValue(String(o.ownership_pct)) }}
                      className="text-sm font-semibold text-foreground hover:text-accent transition-colors"
                    >
                      {o.ownership_pct}%
                    </button>
                    <button
                      onClick={() => handleUnlink(o.id)}
                      disabled={isPending}
                      className="text-xs text-destructive hover:text-destructive/80 font-medium disabled:opacity-50"
                    >
                      Desvincular
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground text-right">Total asignado: {totalPct}%</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sin propietarios vinculados.</p>
      )}

      {!showAddForm && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
          disabled={totalPct >= 100}
        >
          + Vincular propietario
        </Button>
      )}

      {showAddForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <h4 className="font-medium text-foreground text-sm">Vincular propietario existente</h4>

          <div className="space-y-1">
            <Label className="text-xs">Seleccionar propietario</Label>
            <select
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">-- Seleccionar propietario --</option>
              {loadingOwners ? (
                <option value="" disabled>Cargando...</option>
              ) : (
                allOwners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.full_name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">% de propiedad</Label>
            <Input
              type="number"
              min="1"
              max={100 - totalPct}
              value={newPct}
              onChange={(e) => setNewPct(e.target.value)}
              className="w-24"
            />
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleLink} disabled={isPending || !selectedOwnerId}>
              {isPending ? 'Vinculando...' : 'Vincular'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowAddForm(false); setSelectedOwnerId(''); setNewPct('100') }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
