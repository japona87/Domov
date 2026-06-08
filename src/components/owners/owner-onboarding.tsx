'use client'

import { useState } from 'react'
import { sendOwnerOnboarding, resendOwnerOnboarding, getOwnerPassword, updateOwnerPassword } from '@/lib/actions/onboarding'

const SUBJECT = 'Domov — Bienvenido a tu portal de propietario'

export function OwnerOnboardingButton({ ownerId, hasAccess }: { ownerId: string; hasAccess: boolean }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ email: string; password: string; fullName: string } | null>(null)

  async function handleSend() {
    setLoading(true)
    setError(null)
    try {
      const data = hasAccess
        ? await resendOwnerOnboarding(ownerId)
        : await sendOwnerOnboarding(ownerId)
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al enviar onboarding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-4 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
      >
        {hasAccess ? 'Reenviar onboarding' : 'Enviar onboarding'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">
              {hasAccess ? 'Reenviar onboarding' : 'Onboarding propietario'}
            </h3>

            {!result && !error && (
              <>
                <p className="text-sm text-slate-600">
                  {hasAccess
                    ? 'Se reenviarán las credenciales al propietario.'
                    : 'Se creará un usuario, se asignará al propietario y se enviarán las credenciales.'}
                </p>
                {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 border border-input bg-background hover:bg-accent"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 bg-navy-800 text-white hover:bg-navy-700 disabled:opacity-50"
                  >
                    {loading ? 'Enviando...' : 'Enviar onboarding'}
                  </button>
                </div>
              </>
            )}

            {result && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-2 text-sm">
                  <p className="text-blue-800 font-medium">Datos de acceso generados</p>
                  <p className="text-blue-700">Email: <span className="font-mono">{result.email}</span></p>
                  <p className="text-blue-700">
                    Contraseña: <span className="font-mono">{result.password}</span>
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-2 text-sm font-mono text-xs">
                  <CopyField label="Para" value={result.email} />
                  <CopyField label="Asunto" value={SUBJECT} />
                  <div className="pt-1 border-t border-slate-200">
                    <CopyField label="Cuerpo" value={emailBody(result)} multiline />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      const text = `Asunto: ${SUBJECT}\n\n${emailBody(result)}`
                      navigator.clipboard.writeText(text)
                    }}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 border border-input bg-background hover:bg-accent"
                  >
                    Copiar todo
                  </button>
                  <button
                    onClick={() => {
                      const mailto = `mailto:${result.email}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(emailBody(result))}`
                      window.open(mailto)
                    }}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 bg-navy-800 text-white hover:bg-navy-700"
                  >
                    Abrir en Outlook
                  </button>
                </div>
                <button
                  onClick={() => { setOpen(false); setResult(null) }}
                  className="text-sm text-slate-500 hover:text-slate-700 w-full text-center pt-1"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function CopyField({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">{label}</span>
        <button
          onClick={() => navigator.clipboard.writeText(value)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          title={`Copiar ${label.toLowerCase()}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </div>
      <p className={`text-slate-700 ${multiline ? 'whitespace-pre-line' : 'truncate'}`}>{value}</p>
    </div>
  )
}

export function OwnerPasswordManager({ ownerId, hasAccess }: { ownerId: string; hasAccess: boolean }) {
  const [visible, setVisible] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function loadPassword() {
    setLoading(true)
    try {
      const pwd = await getOwnerPassword(ownerId)
      if (pwd) setPassword(pwd)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!password || password.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      await updateOwnerPassword(ownerId, password)
      setMessage('Contraseña actualizada')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  if (!hasAccess) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700">Contraseña</label>
        <button
          onClick={() => { setVisible(!visible); if (!visible) loadPassword() }}
          className="text-xs text-accent hover:text-accent/80"
        >
          {visible ? 'Ocultar' : 'Ver'}
        </button>
      </div>
      {visible && (
        <div className="flex gap-2">
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 border border-slate-200 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-lime-500"
            placeholder={loading ? 'Cargando...' : 'Contraseña'}
          />
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-3 py-2 text-sm bg-navy-800 text-white rounded-md hover:bg-navy-700 disabled:opacity-50"
          >
            {loading ? '...' : 'Guardar'}
          </button>
        </div>
      )}
      {message && <p className="text-xs text-green-600">{message}</p>}
    </div>
  )
}

function emailBody(data: { fullName: string; email: string; password: string }) {
  return [
    `¡Hola ${data.fullName}! 👋`,
    '',
    'Te damos la bienvenida a Domov, el sistema de gestión de tus inmuebles.',
    '',
    'Desde tu portal podrás consultar en tiempo real:',
    '  🏠 Tus propiedades registradas',
    '  📄 Los contratos activos de cada inmueble',
    '',
    '━━━ Tus datos de acceso ━━━',
    `  🔗 Portal:   https://domov.app/owner/dashboard`,
    `  📧 Email:    ${data.email}`,
    `  🔑 Contraseña: ${data.password}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    'Este es un portal de consulta. Si necesitas modificar algún dato,',
    'contacta a tu administrador.',
    '',
    '¡Saludos! 🏡',
    'Equipo Domov',
    'domov.co',
  ].join('\n')
}
