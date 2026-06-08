'use client'

import { useActionState } from 'react'
import { updateSystemConfig } from '@/lib/actions/config'
import { LoadingOverlay } from '@/components/admin/loading-overlay'

export function ConfigForm({
  renewalNoticeDays,
  auditRetentionDays,
  storageLimitGb,
}: {
  renewalNoticeDays: number
  auditRetentionDays: number
  storageLimitGb: number
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: null, fd: FormData) => {
      await updateSystemConfig(fd)
      return null
    },
    null,
  )

  return (
    <>
      <LoadingOverlay pending={pending} message="Guardando configuración..." />
      <form action={formAction} className="bg-white rounded-xl border p-6 space-y-6 max-w-lg">
        <div className="space-y-1">
          <label htmlFor="renewal_notice_days" className="text-sm font-medium text-slate-700">
            Días de preaviso para alertas de vencimiento
          </label>
          <input
            id="renewal_notice_days"
            name="renewal_notice_days"
            type="number"
            min="1"
            defaultValue={renewalNoticeDays}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
          />
          <p className="text-xs text-slate-400">
            El dashboard alertará contratos que venzan dentro de este plazo. Default: 120 días.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="audit_retention_days" className="text-sm font-medium text-slate-700">
            Días de retención de auditoría
          </label>
          <input
            id="audit_retention_days"
            name="audit_retention_days"
            type="number"
            min="30"
            max="365"
            defaultValue={auditRetentionDays}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
          />
          <p className="text-xs text-slate-400">
            Los registros de auditoría más antiguos que este número de días se eliminarán al limpiar. Default: 90 días.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="storage_limit_gb" className="text-sm font-medium text-slate-700">
            Límite de almacenamiento (GB)
          </label>
          <input
            id="storage_limit_gb"
            name="storage_limit_gb"
            type="number"
            min="1"
            defaultValue={storageLimitGb}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
          />
          <p className="text-xs text-slate-400">
            Plan gratuito: 1 GB · Pro: 100 GB. Se usa para la barra de progreso en Almacenamiento.
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="bg-navy-800 hover:bg-navy-700 text-white text-sm font-medium px-5 py-2.5 rounded-md transition-colors disabled:opacity-50"
        >
          Guardar configuración
        </button>
      </form>
    </>
  )
}
