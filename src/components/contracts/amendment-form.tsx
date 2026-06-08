'use client'

import { addContractAmendment } from '@/lib/actions/contract-amendments'
import { Button } from '@/components/ui/button'

export function AmendmentForm({
  contractId,
  currentRent,
  currentAdminFee,
  currentEndDate,
}: {
  contractId: string
  currentRent: number
  currentAdminFee: number
  currentEndDate: string
}) {
  async function action(formData: FormData) {
    try {
      await addContractAmendment(contractId, formData)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const nextEnd = new Date(currentEndDate + 'T00:00:00')
  nextEnd.setFullYear(nextEnd.getFullYear() + 1)
  const suggestedEnd = nextEnd.toISOString().split('T')[0]

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Fecha de enmienda</label>
          <input name="amendment_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nuevo canon mensual</label>
          <input name="monthly_rent" type="number" defaultValue={currentRent} required min={1}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">IPC aplicado (%)</label>
          <input name="ipc_rate" type="number" step="0.01" placeholder="ej: 5.2"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nueva administración</label>
          <input name="administration_fee" type="number" defaultValue={currentAdminFee || 0} required min={0}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Aumento admin (%)</label>
          <input name="admin_fee_increase_pct" type="number" step="0.01" placeholder="ej: 5"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nueva fecha fin</label>
          <input name="period_end" type="date" defaultValue={suggestedEnd} required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Notas</label>
        <input name="notes" placeholder="Opcional"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit">Crear enmienda</Button>
      </div>
    </form>
  )
}
