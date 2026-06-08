'use client'

export function LoadingOverlay({ pending, message }: { pending: boolean; message?: string }) {
  if (!pending) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl px-12 py-12 flex flex-col items-center gap-6 min-w-[240px]">
        <img src="/logo-domov.png" alt="Domov" className="h-14 w-auto" />
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-lime-500 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-700">{message ?? 'Guardando...'}</p>
      </div>
    </div>
  )
}
