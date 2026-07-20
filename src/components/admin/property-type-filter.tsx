'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'
import Image from 'next/image'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  apartment: <span className="text-lg">🏢</span>,
  house: <span className="text-lg">🏠</span>,
  office: <span className="text-lg">🏬</span>,
  local: <span className="text-lg">🏪</span>,
  garage: <Image src="/icons/parking.png" alt="Garaje" width={20} height={20} className="inline-block" />,
  other: <span className="text-lg">📦</span>,
}

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartamentos',
  house: 'Casas',
  office: 'Oficinas',
  local: 'Locales',
  garage: 'Garajes',
  other: 'Otros',
}

export function PropertyTypeFilter({
  counts,
}: {
  counts: Record<string, number>
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentType = searchParams.get('type')
  const currentQ = searchParams.get('q')

  const handleClick = useCallback((type: string | null) => {
    const params = new URLSearchParams()
    if (currentQ) params.set('q', currentQ)
    if (type) params.set('type', type)
    router.push(`/admin/propiedades${params.toString() ? '?' + params.toString() : ''}`)
  }, [currentQ, router])

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  const allEntries = Object.entries(counts).filter(([, c]) => c > 0)
  const entries = Object.entries(TYPE_LABELS).filter(([k]) => counts[k] !== undefined)

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleClick(null)}
        className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
          !currentType
            ? 'bg-accent/10 border-accent/30 text-accent'
            : 'bg-white border-border text-muted-foreground hover:border-accent/30 hover:text-accent'
        }`}
      >
        <span className="mr-1.5">📋</span>
        Todos <span className="font-semibold ml-1">{total}</span>
      </button>
      {entries.map(([type, label]) => (
        <button
          key={type}
          onClick={() => handleClick(currentType === type ? null : type)}
          className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
            currentType === type
              ? 'bg-accent/10 border-accent/30 text-accent'
              : 'bg-white border-border text-muted-foreground hover:border-accent/30 hover:text-accent'
          }`}
        >
          <span className="mr-1.5">{TYPE_ICONS[type] ?? '📋'}</span>
          {label} <span className="font-semibold ml-1">{counts[type] ?? 0}</span>
        </button>
      ))}
    </div>
  )
}
