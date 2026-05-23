// src/app/(admin)/admin/propiedades/[id]/fotos/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { PhotoUploader } from '@/components/properties/photo-uploader'

export const dynamic = 'force-dynamic'

export default async function FotosPropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: property } = await supabase
    .from('properties')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!property) notFound()

  const { data: photos } = await supabase
    .from('property_photos')
    .select('id, photo_url, is_cover, sort_order')
    .eq('property_id', id)
    .order('sort_order')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/propiedades/${id}`}>← Volver</Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fotos</h2>
          <p className="text-slate-500">{property.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 max-w-3xl">
        <PhotoUploader propertyId={id} photos={photos ?? []} />
      </div>
    </div>
  )
}
