import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ContractForm } from '@/components/contracts/contract-form'
import { ContractDocuments } from '@/components/contracts/contract-documents'
import { updateContract } from '@/lib/actions/contracts'

export const dynamic = 'force-dynamic'

export default async function EditarContratoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: contract }, { data: properties }, { data: tenants }] = await Promise.all([
    supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single(),
    supabase.from('properties').select('id, name, address').order('name') as unknown as { data: Array<{id: string; name: string; address: string}> | null },
    supabase.from('tenants').select('id, full_name, document_number').order('full_name') as unknown as { data: Array<{id: string; full_name: string; document_number: string | null}> | null },
  ])

  if (!contract) notFound()

  const propertyOptions = (properties ?? []).map((p) => ({
    id: p.id,
    label: `${p.name} — ${p.address}`,
  }))

  const tenantOptions = (tenants ?? []).map((t) => ({
    id: t.id,
    label: t.document_number
      ? `${t.full_name} (CC ${t.document_number})`
      : t.full_name,
  }))

  const updateWithId = updateContract.bind(null, id)

  const { data: documents } = await supabase
    .from('documents')
    .select('id, name, type, description, file_url, file_size, mime_type, created_at')
    .eq('contract_id', id)
    .order('created_at', { ascending: false }) as unknown as { data: Array<{
      id: string; name: string; type: string; description: string | null
      file_url: string; file_size: number | null; mime_type: string | null; created_at: string
    }> | null }

  const docsWithSignedUrls = await Promise.all(
    (documents ?? []).map(async (d) => {
      const urlPath = d.file_url.split('/storage/v1/object/documents/')[1]
      if (!urlPath) return { ...d, signedUrl: null }
      const { data } = await supabase.storage.from('documents').createSignedUrl(urlPath, 3600)
      return { ...d, signedUrl: data?.signedUrl ?? null }
    })
  )

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/admin/contratos/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Volver al detalle
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Editar contrato</h2>
        <p className="text-slate-500 text-sm mt-1">
          Actualiza la información del contrato y administra los documentos asociados.
        </p>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <ContractForm
          properties={propertyOptions}
          tenants={tenantOptions}
          onSubmit={updateWithId}
          contract={contract}
          cancelHref={`/admin/contratos/${id}`}
        />
      </div>
      <ContractDocuments contractId={id} initialDocuments={docsWithSignedUrls} />
    </div>
  )
}
