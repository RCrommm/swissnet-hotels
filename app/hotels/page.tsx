import { supabase } from '@/lib/supabase'
import HotelCard from '@/components/HotelCard'
import Navigation from '@/components/Navigation'
import { Suspense } from 'react'
import HotelsClient from '@/components/HotelsClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

interface Props {
  searchParams: Promise<{ q?: string; region?: string; category?: string }>
}
export const metadata = {
  title: 'Luxury Hotels — Book Direct | SwissNet Hotels',

  description: 'Browse all luxury partner hotels. Book direct for the best rate with no OTA fees.',
  alternates: {
    canonical: 'https://swissnethotels.com/hotels',
  },
}
export default async function HotelsPage({ searchParams }: Props) {
  const params = await searchParams

  let query = supabase
    .from('hotels')
    .select('*')
    .eq('is_active', true)
    .order('is_partner', { ascending: false })
    .order('nightly_rate_chf', { ascending: false })

  if (params.region) query = query.eq('region', params.region)
  if (params.category) query = query.eq('category', params.category)
  if (params.q) query = query.or(`name.ilike.%${params.q}%,description.ilike.%${params.q}%,location.ilike.%${params.q}%`)

  const { data: hotels } = await query

  return (
    <div style={{ background: '#492816', minHeight: '100vh' }}>
      <Navigation />
      <Suspense fallback={null}>
        <HotelsClient hotels={hotels || []} initialRegion={params.region || ''} initialCategory={params.category || ''} initialQ={params.q || ''} />
      </Suspense>
    </div>
  )
}