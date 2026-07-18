export const SERVICE_TYPES = ['water', 'electricity', 'gas', 'administration', 'internet', 'other'] as const
export type ServiceType = typeof SERVICE_TYPES[number]

export type PropertyServiceRow = {
  id: string
  property_id: string
  service_type: string
  account_number: string
  contract_number: string | null
  provider_name: string | null
  client_number: string | null
  file_url: string | null
  file_name: string | null
}

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  water: 'Agua',
  electricity: 'Luz',
  gas: 'Gas',
  administration: 'Administración',
  internet: 'Internet',
  other: 'Otro',
}

export const SERVICE_ICONS: Record<string, string> = {
  water: '💧',
  electricity: '⚡',
  gas: '🔥',
  administration: '🏢',
  internet: '🌐',
  other: '📋',
}
