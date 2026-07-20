'use server'

import { createClient } from '@/lib/supabase/server'

export interface PropertyCheck {
  key: string
  label: string
  done: boolean
}

export interface PropertyReport {
  id: string
  name: string
  address: string
  type: string
  checks: PropertyCheck[]
  completed: number
  total: number
  percentage: number
}

export interface CompletenessReport {
  properties: PropertyReport[]
  overallPercentage: number
  averageCompleted: number
  totalPossible: number
  distribution: { range: string; count: number }[]
}

export async function getCompletenessReport(): Promise<CompletenessReport> {
  const supabase = await createClient()

  const { data: properties } = await supabase
    .from('properties')
    .select(`
      id, name, address, type, description, chip, matricula,
      monthly_price, administration_fee, maps_url, features,
      property_photos(count),
      property_owners(count),
      property_services(count)
    `)
    .order('name') as unknown as {
    data: Array<{
      id: string
      name: string
      address: string
      type: string
      description: string | null
      chip: string | null
      matricula: string | null
      monthly_price: number | null
      administration_fee: number | null
      maps_url: string | null
      features: Record<string, unknown> | null
      property_photos: { count: number }[]
      property_owners: { count: number }[]
      property_services: { count: number }[]
    }> | null
  }

  if (!properties) return { properties: [], overallPercentage: 0, averageCompleted: 0, totalPossible: 10, distribution: [] }

  const propertyReports: PropertyReport[] = properties.map((p) => {
    const checks: PropertyCheck[] = [
      { key: 'description', label: 'Descripción', done: !!p.description },
      { key: 'chip', label: 'Chip catastral', done: !!p.chip },
      { key: 'matricula', label: 'Matrícula inmobiliaria', done: !!p.matricula },
      { key: 'monthly_price', label: 'Precio de arriendo', done: p.monthly_price !== null },
      { key: 'administration_fee', label: 'Administración', done: p.administration_fee !== null },
      { key: 'maps_url', label: 'Ubicación en mapa', done: !!p.maps_url },
      { key: 'features', label: 'Características', done: p.features !== null && p.features !== undefined && Object.keys(p.features).length > 0 },
      { key: 'photos', label: 'Fotos', done: (p.property_photos?.[0]?.count ?? 0) > 0 },
      { key: 'owner', label: 'Propietario asignado', done: (p.property_owners?.[0]?.count ?? 0) > 0 },
      { key: 'services', label: 'Servicios públicos', done: (p.property_services?.[0]?.count ?? 0) > 0 },
    ]
    const completed = checks.filter((c) => c.done).length
    const total = checks.length
    const percentage = Math.round((completed / total) * 100)
    return { id: p.id, name: p.name, address: p.address, type: p.type, checks, completed, total, percentage }
  })

  const overallPercentage = propertyReports.length > 0
    ? Math.round(propertyReports.reduce((s, r) => s + r.percentage, 0) / propertyReports.length)
    : 0

  const averageCompleted = propertyReports.length > 0
    ? Math.round(propertyReports.reduce((s, r) => s + r.completed, 0) / propertyReports.length)
    : 0

  const ranges = ['0-24%', '25-49%', '50-74%', '75-100%']
  const distribution = ranges.map((range) => {
    const [lo, hi] = range.replace('%', '').split('-').map(Number)
    const count = propertyReports.filter((r) => r.percentage >= lo && r.percentage <= hi).length
    return { range, count }
  })

  return { properties: propertyReports, overallPercentage, averageCompleted, totalPossible: 10, distribution }
}
