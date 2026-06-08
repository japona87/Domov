export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-20 relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0d0d0d]">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="relative z-10">
          <span className="w-28 h-28 rounded-2xl bg-white flex items-center justify-center mb-10 shadow-lg shadow-black/15">
            <img src="/logo-domov.png" alt="Domov" className="h-20 w-auto block" />
          </span>
          <h1 className="font-heading text-5xl text-white leading-[1.1] mb-5">
            Gestiona tus<br />
            propiedades <span className="text-accent">con confianza</span>
          </h1>
          <p className="text-lg text-white/60 leading-relaxed max-w-md">
            Portal exclusivo para propietarios, arrendatarios y administradores. Todo lo que necesitas en un solo lugar.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        {children}
      </div>
    </div>
  )
}
