import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PhotoManager } from '@/components/properties/photo-manager'

export const dynamic = 'force-dynamic'

export default async function FotosPropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: property }, { data: photos }] = await Promise.all([
    supabase.from('properties').select('id, name').eq('id', id).single(),
    supabase
      .from('property_photos')
      .select('id, photo_url, is_cover, sort_order')
      .eq('property_id', id)
      .order('sort_order'),
  ])

  if (!property) notFound()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          <Link href="/admin/propiedades" className="hover:underline">Propiedades</Link>
          {' / '}
          <Link href={`/admin/propiedades/${id}`} className="hover:underline">{property.name}</Link>
          {' / '}Fotos
        </p>
        <h2 className="text-2xl font-sans font-semibold text-foreground">Fotos del inmueble</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {photos?.length ?? 0} foto{(photos?.length ?? 0) !== 1 ? 's' : ''} · La foto de portada aparece en la página pública
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <PhotoManager propertyId={id} photos={photos ?? []} />
      </div>
    </div>
  )
}
