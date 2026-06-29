'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { LoadingOverlay } from '@/components/admin/loading-overlay'

interface Selectable { id: string; label: string }

interface ContractData {
  id: string
  property_id: string
  tenant_id: string
  start_date: string
  end_date: string
  monthly_rent: number
  administration_fee: number | null
  ipc_rate: number | null
  min_wage_increase: number | null
  notes: string | null
  status: string
}

interface ContractFormProps {
  properties: Selectable[]
  tenants: Selectable[]
  onSubmit: (formData: FormData) => Promise<void>
  contract?: ContractData
  cancelHref?: string
}

function formatPrice(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('es-CO')
}

function parsePrice(formatted: string): number {
  return Number(formatted.replace(/\./g, ''))
}

function computeEndDate(startDate: string, durationMonths: number): string {
  if (!startDate || !durationMonths) return ''
  const d = new Date(startDate)
  d.setMonth(d.getMonth() + durationMonths)
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

function monthsBetween(d1: string, d2: string): number {
  const a = new Date(d1)
  const b = new Date(d2)
  return Math.round((b.getTime() - a.getTime()) / (30.44 * 86400000))
}

export function ContractForm({ properties, tenants, onSubmit, contract, cancelHref = '/admin/contratos', childrenMap = {} }: ContractFormProps & { childrenMap?: Record<string, { id: string; name: string }[]> }) {
  const isEditing = !!contract
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [errors, setErrors] = useState<string[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState(contract?.property_id ?? '')
  const [monthlyRentDisplay, setMonthlyRentDisplay] = useState(
    contract ? formatPrice(String(contract.monthly_rent)) : ''
  )
  const [adminFeeDisplay, setAdminFeeDisplay] = useState(
    contract?.administration_fee ? formatPrice(String(contract.administration_fee)) : ''
  )
  const [startDate, setStartDate] = useState(contract?.start_date ?? '')
  const [durationMonths, setDurationMonths] = useState(
    contract ? String(monthsBetween(contract.start_date, contract.end_date)) : ''
  )

  const endDate = useMemo(
    () => computeEndDate(startDate, Number(durationMonths)),
    [startDate, durationMonths]
  )

  function validate(formData: FormData): boolean {
    const errs: string[] = []

    const start = String(formData.get('start_date'))
    const duration = formData.get('duration_months')
    const rent = Number(formData.get('monthly_rent'))

    if (!start) errs.push('La fecha de inicio es obligatoria.')
    if (!duration) errs.push('La duración es obligatoria.')
    if (!rent || rent <= 0) errs.push('El canon mensual debe ser mayor a 0.')

    setErrors(errs)
    return errs.length === 0
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    formData.set('monthly_rent', String(parsePrice(monthlyRentDisplay)))
    if (adminFeeDisplay) {
      formData.set('administration_fee', String(parsePrice(adminFeeDisplay)))
    } else {
      formData.set('administration_fee', '')
    }

    if (endDate) {
      formData.set('end_date', endDate)
    }

    if (!validate(formData)) return
    startTransition(async () => {
      try {
        await onSubmit(formData)
      } catch (err) {
        if (err instanceof Error && 'digest' in err && typeof (err as Error & { digest: string }).digest === 'string' && (err as Error & { digest: string }).digest.startsWith('NEXT_REDIRECT')) return
        toast.error(err instanceof Error ? err.message : 'Error al guardar contrato')
      }
    })
  }

  return (
    <>
      <LoadingOverlay pending={isPending} message={isEditing ? 'Actualizando contrato...' : 'Creando contrato...'} />
      <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-end gap-2 mb-2">
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? 'Guardando...' : (isEditing ? 'Guardar cambios' : 'Crear contrato')}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(cancelHref)}>
          Cancelar
        </Button>
      </div>
      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 space-y-1">
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-destructive">{e}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="property_id">Inmueble *</Label>
          <select
            id="property_id"
            name="property_id"
            required
            defaultValue={contract?.property_id ?? ''}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">Seleccionar inmueble</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          {selectedPropertyId && childrenMap[selectedPropertyId] && childrenMap[selectedPropertyId].length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground bg-accent/5 border border-accent/20 rounded-md px-3 py-2">
              Incluye: {childrenMap[selectedPropertyId].map(c => c.name.replace(/^🅿 /, '')).join(', ')}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="tenant_id">Arrendatario *</Label>
          <select
            id="tenant_id"
            name="tenant_id"
            required
            defaultValue={contract?.tenant_id ?? ''}
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
          <Input
            id="start_date"
            name="start_date"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="duration_months">Duración *</Label>
          <select
            id="duration_months"
            name="duration_months"
            required
            value={durationMonths}
            onChange={(e) => setDurationMonths(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">Seleccionar</option>
            <option value="6">6 meses</option>
            <option value="12">12 meses</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="end_date">Fecha fin</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            readOnly
            value={endDate}
            className="bg-slate-50 text-slate-500 cursor-default"
            tabIndex={-1}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="monthly_rent">Canon mensual (COP) *</Label>
          <Input
            id="monthly_rent"
            name="monthly_rent"
            type="text"
            inputMode="numeric"
            required
            placeholder="1.500.000"
            value={monthlyRentDisplay}
            onChange={(e) => setMonthlyRentDisplay(formatPrice(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="administration_fee">Cuota administración (COP)</Label>
          <Input
            id="administration_fee"
            name="administration_fee"
            type="text"
            inputMode="numeric"
            placeholder="150.000"
            value={adminFeeDisplay}
            onChange={(e) => setAdminFeeDisplay(formatPrice(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ipc_rate">IPC %</Label>
          <Input
            id="ipc_rate"
            name="ipc_rate"
            type="number"
            min="0"
            step="0.01"
            placeholder="7.24"
            defaultValue={contract?.ipc_rate ?? ''}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="min_wage_increase">% Aumento salario mínimo</Label>
          <Input
            id="min_wage_increase"
            name="min_wage_increase"
            type="number"
            min="0"
            step="0.01"
            placeholder="9.53"
            defaultValue={contract?.min_wage_increase ?? ''}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Observaciones adicionales..."
          defaultValue={contract?.notes ?? ''}
        />
      </div>
      </form>
    </>
  )
}
