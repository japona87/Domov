'use client'

const items = [
  {
    icon: (
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    ),
    label: 'Respaldados por SURA',
  },
  {
    icon: (
      <path d="M3 12l3-3 4 2 2-2 2 2 4-2 3 3M7 13l3 3a1.5 1.5 0 0 0 2 0l.5-.5 1.5 1.4a1.4 1.4 0 0 0 2-2L17 13" />
    ),
    label: 'Proceso transparente',
  },
  {
    icon: (
      <circle cx="8" cy="8" r="4" />
    ),
    label: 'Especialistas en arriendo',
  },
  {
    icon: (
      <circle cx="12" cy="12" r="8" />
    ),
    label: 'Asesoría gratis y sin compromiso',
  },
]

export function TrustStrip() {
  return (
    <div className="border-y border-[#E2E8F0] bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6 flex-wrap">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 text-navy-600 text-sm font-sans"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="text-accent shrink-0"
            >
              {item.icon}
            </svg>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
