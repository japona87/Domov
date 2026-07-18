'use client'

import { Button } from '@/components/ui/button'
import { SERVICE_TYPE_LABELS, SERVICE_ICONS } from '@/lib/services-shared'
import type { PropertyServiceRow } from '@/lib/services-shared'

export function OwnerServicesView({ services }: { services: PropertyServiceRow[] }) {
  if (services.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
        <p className="text-sm">No hay servicios públicos registrados para esta propiedad.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Información de servicios públicos de referencia para el inquilino.</p>
      {services.map((svc) => (
        <div key={svc.id} className="bg-card rounded-xl border border-border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{SERVICE_ICONS[svc.service_type] ?? '📋'}</span>
            <span className="font-medium text-foreground">{SERVICE_TYPE_LABELS[svc.service_type] ?? svc.service_type}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pl-7">
            <div>
              <span className="text-xs text-muted-foreground block">Cuenta</span>
              <span className="font-mono">{svc.account_number}</span>
            </div>
            {svc.contract_number && (
              <div>
                <span className="text-xs text-muted-foreground block">Contrato</span>
                <span className="font-mono">{svc.contract_number}</span>
              </div>
            )}
            {svc.client_number && (
              <div>
                <span className="text-xs text-muted-foreground block">Cliente</span>
                <span className="font-mono">{svc.client_number}</span>
              </div>
            )}
            {svc.provider_name && (
              <div>
                <span className="text-xs text-muted-foreground block">Proveedor</span>
                <span>{svc.provider_name}</span>
              </div>
            )}
          </div>
          {svc.file_url && (
            <div className="pl-7 pt-2 border-t border-border">
              <Button variant="outline" size="sm" asChild>
                <a href={svc.file_url} target="_blank" rel="noopener noreferrer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  {svc.file_name ?? 'Descargar recibo'}
                </a>
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
