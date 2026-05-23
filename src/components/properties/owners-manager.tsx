// src/components/properties/owners-manager.tsx
'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addPropertyOwner, removePropertyOwner, updateOwner } from '@/lib/actions/properties'
import { toast } from 'sonner'

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

type FormState = { fullName: string; documentNumber: string; phone: string; email: string; ownershipPct: string }

const EMPTY_FORM: FormState = { fullName: '', documentNumber: '', phone: '', email: '', ownershipPct: '100' }

// ── Validaciones ──────────────────────────────────────────────────────────────

function emailError(val: string): string | null {
  if (!val) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? null : 'Formato inválido (ej: juan@correo.com)'
}

function documentError(val: string): string | null {
  if (!val) return null
  return /^\d+$/.test(val) ? null : 'Solo se permiten números'
}

function phoneError(val: string): string | null {
  if (!val) return null
  return /^\d+$/.test(val) ? null : 'Solo se permiten números'
}

function formHasErrors(form: FormState, pctMax: number): boolean {
  const pct = Number(form.ownershipPct)
  return (
    !form.fullName.trim() ||
    !!emailError(form.email) ||
    !!documentError(form.documentNumber) ||
    !!phoneError(form.phone) ||
    pct <= 0 ||
    pct > pctMax
  )
}

// ── Sub-componente de campo con error inline ──────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = 'text', error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  error?: string | null
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={error ? 'border-red-400 focus-visible:ring-red-400' : ''}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Formulario reutilizable (agregar / editar) ────────────────────────────────

function OwnerForm({
  title,
  form,
  onChange,
  onSubmit,
  onCancel,
  isPending,
  pctMax,
  submitLabel,
}: {
  title: string
  form: FormState
  onChange: (f: FormState) => void
  onSubmit: () => void
  onCancel: () => void
  isPending: boolean
  pctMax: number
  submitLabel: string
}) {
  const pct = Number(form.ownershipPct)
  const pctOver = pct > pctMax
  const hasErrors = formHasErrors(form, pctMax)

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-slate-50">
      <h4 className="font-medium text-slate-700 text-sm">{title}</h4>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Nombre completo *"
          value={form.fullName}
          onChange={(v) => onChange({ ...form, fullName: v })}
          placeholder="Juan Pérez"
          error={form.fullName.trim() === '' && form.fullName !== '' ? 'Requerido' : null}
        />
        <Field
          label="Cédula"
          value={form.documentNumber}
          onChange={(v) => onChange({ ...form, documentNumber: v })}
          placeholder="12345678"
          error={documentError(form.documentNumber)}
        />
        <Field
          label="Teléfono"
          value={form.phone}
          onChange={(v) => onChange({ ...form, phone: v })}
          placeholder="3001234567"
          error={phoneError(form.phone)}
        />
        <Field
          label="Email"
          value={form.email}
          onChange={(v) => onChange({ ...form, email: v })}
          placeholder="juan@ejemplo.com"
          error={emailError(form.email)}
        />
        <div className="space-y-1">
          <Label className="text-xs">% de propiedad *</Label>
          <Input
            type="number"
            min="1"
            max={pctMax}
            value={form.ownershipPct}
            onChange={(e) => onChange({ ...form, ownershipPct: e.target.value })}
            className={pctOver ? 'border-red-400 focus-visible:ring-red-400' : ''}
          />
          {pctOver && (
            <p className="text-xs text-red-500">
              Supera el límite — máximo disponible: {pctMax}%
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSubmit} disabled={isPending || hasErrors}>
          {isPending ? 'Guardando...' : submitLabel}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function OwnersManager({ propertyId, owners }: OwnersManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)

  const totalPct = owners.reduce((sum, o) => sum + o.ownership_pct, 0)

  function startEdit(o: PropertyOwner) {
    setEditingId(o.id)
    setEditForm({
      fullName: o.owners?.full_name ?? '',
      documentNumber: o.owners?.document_number ?? '',
      phone: o.owners?.phone ?? '',
      email: o.owners?.email ?? '',
      ownershipPct: String(o.ownership_pct),
    })
    setShowAddForm(false)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(EMPTY_FORM)
  }

  function handleAdd() {
    startTransition(async () => {
      try {
        await addPropertyOwner(
          propertyId,
          addForm.fullName,
          addForm.documentNumber,
          addForm.phone,
          addForm.email,
          Number(addForm.ownershipPct)
        )
        setAddForm(EMPTY_FORM)
        setShowAddForm(false)
        toast.success('Propietario agregado')
      } catch {
        toast.error('Error al agregar propietario')
      }
    })
  }

  function handleUpdate(o: PropertyOwner) {
    if (!o.owners) return
    startTransition(async () => {
      try {
        await updateOwner(
          o.owners!.id,
          o.id,
          propertyId,
          editForm.fullName,
          editForm.documentNumber,
          editForm.phone,
          editForm.email,
          Number(editForm.ownershipPct)
        )
        setEditingId(null)
        toast.success('Propietario actualizado')
      } catch {
        toast.error('Error al actualizar propietario')
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
          {owners.map((o) => {
            const isEditing = editingId === o.id
            // Al editar, el máximo disponible = 100 - total + lo que ya tenía este propietario
            const pctMax = isEditing
              ? 100 - totalPct + o.ownership_pct
              : 100 - totalPct

            return isEditing ? (
              <OwnerForm
                key={o.id}
                title="Editar propietario"
                form={editForm}
                onChange={setEditForm}
                onSubmit={() => handleUpdate(o)}
                onCancel={cancelEdit}
                isPending={isPending}
                pctMax={pctMax}
                submitLabel="Guardar cambios"
              />
            ) : (
              <div key={o.id} className="flex items-center justify-between bg-slate-50 rounded-md px-4 py-3">
                <div>
                  <p className="font-medium text-slate-800">{o.owners?.full_name}</p>
                  <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
                    {o.owners?.document_number && <span>CC: {o.owners.document_number}</span>}
                    {o.owners?.phone && <span>{o.owners.phone}</span>}
                    {o.owners?.email && <span>{o.owners.email}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700">{o.ownership_pct}%</span>
                  <button
                    onClick={() => startEdit(o)}
                    disabled={isPending || editingId !== null}
                    className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleRemove(o.id)}
                    disabled={isPending || editingId !== null}
                    className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                  >
                    Remover
                  </button>
                </div>
              </div>
            )
          })}
          <p className="text-xs text-slate-400 text-right">Total asignado: {totalPct}%</p>
        </div>
      ) : (
        <p className="text-slate-400 text-sm">Sin propietarios registrados.</p>
      )}

      {!showAddForm && editingId === null && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
          disabled={totalPct >= 100}
        >
          + Agregar propietario
        </Button>
      )}

      {showAddForm && (
        <OwnerForm
          title="Nuevo propietario"
          form={addForm}
          onChange={setAddForm}
          onSubmit={handleAdd}
          onCancel={() => { setShowAddForm(false); setAddForm(EMPTY_FORM) }}
          isPending={isPending}
          pctMax={100 - totalPct}
          submitLabel="Agregar"
        />
      )}
    </div>
  )
}
