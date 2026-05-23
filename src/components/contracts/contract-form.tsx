'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Selectable { id: string; label: string }

interface ContractFormProps {
  properties: Selectable[]
  tenants: Selectable[]
  onSubmit: (formData: FormData) => Promise<void>
}

export function ContractForm({ properties, tenants, onSubmit }: ContractFormProps) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => onSubmit(formData))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="property_id">Inmueble *</Label>
          <select
            id="property_id"
            name="property_id"
            required
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">Seleccionar inmueble</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="tenant_id">Arrendatario *</Label>
          <select
            id="tenant_id"
            name="tenant_id"
            required
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">Seleccionar arrendatario</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="start_date">Fecha inicio *</Label>
          <Input id="start_date" name="start_date" type="date" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end_date">Fecha fin *</Label>
          <Input id="end_date" name="end_date" type="date" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="monthly_rent">Canon mensual (COP) *</Label>
          <Input id="monthly_rent" name="monthly_rent" type="number" min="0" required placeholder="1500000" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="administration_fee">Cuota administración (COP)</Label>
          <Input id="administration_fee" name="administration_fee" type="number" min="0" placeholder="150000" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ipc_rate">IPC % vigente</Label>
          <Input id="ipc_rate" name="ipc_rate" type="number" min="0" step="0.01" placeholder="7.24" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Observaciones adicionales..." />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Creando contrato...' : 'Crear contrato'}
      </Button>
    </form>
  )
}
