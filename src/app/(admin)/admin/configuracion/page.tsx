import { getSystemConfig, updateSystemConfig } from '@/lib/actions/config'

export const dynamic = 'force-dynamic'

export default async function ConfiguracionPage() {
  const config = await getSystemConfig()
  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-navy-800">Configuración</h1>
        <p className="text-slate-500 text-sm mt-1">Parámetros del sistema para el año {currentYear}</p>
      </div>

      <form action={updateSystemConfig} className="bg-white rounded-xl border p-6 space-y-6 max-w-lg">
        <div className="space-y-1">
          <label htmlFor="ipc_rate" className="text-sm font-medium text-slate-700">
            IPC % vigente {currentYear}
          </label>
          <input
            id="ipc_rate"
            name="ipc_rate"
            type="number"
            step="0.01"
            min="0"
            defaultValue={config?.ipc_rate ?? ''}
            placeholder="Ej: 7.24"
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
          />
          <p className="text-xs text-slate-400">Usado para calcular el ajuste del canon en renovaciones.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="min_wage_increase" className="text-sm font-medium text-slate-700">
            % Aumento salario mínimo {currentYear}
          </label>
          <input
            id="min_wage_increase"
            name="min_wage_increase"
            type="number"
            step="0.01"
            min="0"
            defaultValue={config?.min_wage_increase ?? ''}
            placeholder="Ej: 12.00"
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
          />
          <p className="text-xs text-slate-400">Usado para ajustar la cuota de administración en renovaciones.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="renewal_notice_days" className="text-sm font-medium text-slate-700">
            Días de preaviso para alertas de vencimiento
          </label>
          <input
            id="renewal_notice_days"
            name="renewal_notice_days"
            type="number"
            min="1"
            defaultValue={config?.renewal_notice_days ?? 120}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
          />
          <p className="text-xs text-slate-400">
            El dashboard alertará contratos que venzan dentro de este plazo. Default: 120 días.
          </p>
        </div>

        <button
          type="submit"
          className="bg-navy-800 hover:bg-navy-700 text-white text-sm font-medium px-5 py-2.5 rounded-md transition-colors"
        >
          Guardar configuración
        </button>
      </form>
    </div>
  )
}
