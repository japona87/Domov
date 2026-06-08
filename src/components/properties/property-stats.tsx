'use client'

type StatsItem = {
  icon: React.ReactNode
  label: string
  value: string
}

export function PropertyStats({
  items,
  className = '',
}: {
  items: StatsItem[]
  className?: string
}) {
  if (items.length === 0) return null

  return (
    <div className={className}>
      <h2 className="font-heading text-2xl text-foreground mb-3">Características</h2>
      <div className="w-10 h-0.5 bg-accent mb-5" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {items.map((item, i) => (
          <div
            key={item.label}
            className="bg-navy-50 rounded-xl px-4 py-4 flex items-start gap-3 border border-navy-100 hover:bg-accent/10 hover:border-accent/30 hover:shadow-sm hover:scale-[1.02] transition-all duration-200 cursor-default"
            style={{ animation: `fadeInUp 0.5s ease both ${i * 0.07}s` }}
          >
            <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center text-accent shrink-0">
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground leading-none">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-tight">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
