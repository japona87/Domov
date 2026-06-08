import { getSystemConfig, getFeatureConfigs } from '@/lib/actions/config'
import { FeatureConfigManager } from '@/components/admin/feature-config-manager'
import { ConfigForm } from '@/components/admin/config-form'

export const dynamic = 'force-dynamic'

export default async function ConfiguracionPage() {
  const [config, featureConfigs] = await Promise.all([
    getSystemConfig(),
    getFeatureConfigs(),
  ])
  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-sans font-semibold text-3xl text-navy-800">Configuración</h1>
        <p className="text-slate-500 text-sm mt-1">Parámetros del sistema para el año {currentYear}</p>
      </div>

      <ConfigForm
        renewalNoticeDays={config?.renewal_notice_days ?? 120}
        auditRetentionDays={config?.audit_retention_days ?? 90}
        storageLimitGb={config?.storage_limit_gb ?? 1}
      />

      <FeatureConfigManager configs={featureConfigs as Array<{
        id: string; property_type: string; field_key: string; field_label: string
        placeholder: string; field_type: string; sort_order: number; is_active: boolean
      }>} />
    </div>
  )
}
