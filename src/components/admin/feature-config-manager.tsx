'use client'

import { useState, useTransition } from 'react'
import { updateFeatureConfig, createFeatureConfig, deleteFeatureConfig } from '@/lib/actions/config'
import { LoadingOverlay } from '@/components/admin/loading-overlay'

interface FieldConfig {
  id: string
  property_type: string
  field_key: string
  field_label: string
  placeholder: string
  field_type: string
  sort_order: number
  is_active: boolean
}

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartamento' },
  { value: 'house', label: 'Casa' },
  { value: 'office', label: 'Oficina' },
  { value: 'local', label: 'Local comercial' },
  { value: 'garage', label: 'Garaje' },
  { value: 'other', label: 'Otro' },
]

export function FeatureConfigManager({ configs }: { configs: FieldConfig[] }) {
  const [isPending, startTransition] = useTransition()
  const [selectedType, setSelectedType] = useState('apartment')
  const [showAddForm, setShowAddForm] = useState(false)

  const filtered = configs.filter((c) => c.property_type === selectedType)

  function handleToggle(field: FieldConfig) {
    const fd = new FormData()
    fd.set('field_label', field.field_label)
    fd.set('placeholder', field.placeholder)
    fd.set('field_type', field.field_type)
    fd.set('sort_order', String(field.sort_order))
    fd.set('is_active', String(!field.is_active))
    startTransition(async () => {
      try {
        await updateFeatureConfig(field.id, fd)
      } catch { /* sonner not imported, ignore */ }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteFeatureConfig(id)
      } catch { /* ignore */ }
    })
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('property_type', selectedType)
    startTransition(async () => {
      try {
        await createFeatureConfig(fd)
        setShowAddForm(false)
        e.currentTarget.reset()
      } catch { /* ignore */ }
    })
  }

  return (
    <>
      <LoadingOverlay pending={isPending} message="Guardando configuración de campos..." />
      <div className="bg-white rounded-xl border p-6 space-y-6 max-w-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Campos por tipo de inmueble</h3>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Tipo de inmueble</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
        >
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400">No hay campos configurados para este tipo.</p>
        ) : (
          filtered.map((f) => (
            <div key={f.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={f.is_active}
                  onChange={() => handleToggle(f)}
                  disabled={isPending}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <p className="text-sm font-medium text-slate-700">{f.field_label}</p>
                  <p className="text-xs text-slate-400">key: {f.field_key} · orden: {f.sort_order}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(f.id)}
                disabled={isPending}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          ))
        )}
      </div>

      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="text-sm text-lime-600 hover:text-lime-700 font-medium"
        >
          + Agregar campo personalizado
        </button>
      ) : (
        <form onSubmit={handleCreate} className="space-y-3 border rounded-md p-4 bg-slate-50">
          <p className="text-sm font-medium text-slate-700">Nuevo campo</p>

          <div className="space-y-1">
            <label className="text-xs text-slate-500">Key (identificador único)</label>
            <input
              name="field_key"
              required
              placeholder="ej: pool"
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500">Label (nombre visible)</label>
            <input
              name="field_label"
              required
              placeholder="ej: Piscina"
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500">Placeholder</label>
            <input
              name="placeholder"
              placeholder="ej: Sí / No"
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Tipo</label>
              <select
                name="field_type"
                defaultValue="number"
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="number">Número</option>
                <option value="text">Texto</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-500">Orden</label>
              <input
                name="sort_order"
                type="number"
                defaultValue={filtered.length + 1}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="bg-navy-800 hover:bg-navy-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <p className="text-xs text-slate-400">
        Los cambios se reflejan automáticamente en el formulario de inmuebles.
      </p>
    </div>
    </>
  )
}
