// src/components/properties/owners-manager.tsx
'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addPropertyOwner, removePropertyOwner } from '@/lib/actions/properties'
import { toast } from 'sonner'

interface PropertyOwner {
  id: string
  ownership_pct: number
  owners: { full_name: string; document_number: string | null } | null
}

interface OwnersManagerProps {
  propertyId: string
  owners: PropertyOwner[]
}

const EMPTY_FORM = { fullName: '', documentNumber: '', phone: '', email: '', ownershipPct: '100' }

export function OwnersManager({ propertyId, owners }: OwnersManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const totalPct = owners.reduce((sum, o) => sum + o.ownership_pct, 0)

  function handleAdd() {
    const pct = Number(form.ownershipPct)
    if (!form.fullName || pct <= 0 || pct > 100) {
      toast.error('Nombre y porcentaje válido son requeridos')
      return
    }
    if (totalPct + pct > 100) {
      toast.error(`El total superaría 100% (actual: ${totalPct}%)`)
      return
    }
    startTransition(async () => {
      try {
        await addPropertyOwner(propertyId, form.fullName, form.documentNumber, form.phone, form.email, pct)
        setForm(EMPTY_FORM)
        setShowForm(false)
        toast.success('Propietario agregado')
      } catch {
        toast.error('Error al agregar propietario')
      }
    })
  }

  function handleRemove(propertyOwnerId: string) {
    startTransition(async () => {
      try {
        await removePropertyOwner(propertyOwnerId, propertyId)
        toast.success('Propietario removido')
      } catch {
        toast.error('Error al remover propietario')
      }
    })
  }

  return (
    <div className="space-y-4">
      {owners.length > 0 ? (
        <div className="space-y-2">
          {owners.map((o) => (
            <div key={o.id} className="flex items-center justify-between bg-slate-50 rounded-md px-4 py-3">
              <div>
                <p className="font-medium text-slate-800">{o.owners?.full_name}</p>
                {o.owners?.document_number && (
                  <p className="text-xs text-slate-500">CC: {o.owners.document_number}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">{o.ownership_pct}%</span>
                <button
                  onClick={() => handleRemove(o.id)}
                  disabled={isPending}
                  className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-400 text-right">Total asignado: {totalPct}%</p>
        </div>
      ) : (
        <p className="text-slate-400 text-sm">Sin propietarios registrados.</p>
      )}

      {!showForm ? (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} disabled={totalPct >= 100}>
          + Agregar propietario
        </Button>
      ) : (
        <div className="border rounded-lg p-4 space-y-3 bg-slate-50">
          <h4 className="font-medium text-slate-700 text-sm">Nuevo propietario</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nombre completo *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cédula</Label>
              <Input
                value={form.documentNumber}
                onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                placeholder="12345678"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="3001234567"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="juan@ejemplo.com"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">% de propiedad *</Label>
              <Input
                type="number"
                min="1"
                max={100 - totalPct}
                value={form.ownershipPct}
                onChange={(e) => setForm({ ...form, ownershipPct: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={isPending}>
              {isPending ? 'Guardando...' : 'Agregar'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
