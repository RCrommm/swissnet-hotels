import { supabase } from '@/lib/supabase'
import HotelCard from '@/components/HotelCard'
import SearchBar from '@/components/SearchBar'
import { Suspense } from 'react'

interface Props {
  searchParams: Promise<{ q?: string; region?: string; category?: string }>
}

export default async function HotelsPage({ searchParams }: Props) {
  const params = await searchParams
  
  let query = supabase
    .from('hotels')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false })

  if (params.region) query = query.eq('region', params.region)
  if (params.category) query = query.eq('category', params.category)
  if (params.q) query = query.or(`name.ilike.%${params.q}%,description.ilike.%${params.q}%`)

  const { data: hotels } = await query

  const activeFilters = [params.region, params.category, params.q].filter(Boolean)

  return (
    <div className="pt-20">
      <div className="bg-stone-900 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-amber-400 text-xs uppercase tracking-widest mb-3">Switzerland</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
            {params.region || params.category || 'All Luxury Hotels'}
          </h1>
          <Suspense fallback={<div className="h-16 bg-stone-800 animate-pulse" />}>
            <SearchBar />
          </Suspense>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className="text-stone-500 text-sm">Filters:</span>
            {activeFilters.map(f => (
              <span key={f} className="bg-amber-50 text-amber-800 text-xs px-3 py-1 border border-amber-200">{f}</span>
            ))}
            <a href="/hotels" className="text-xs text-stone-400 underline">Clear all</a>
          </div>
        )}
        
        <p className="text-stone-500 text-sm mb-8">
          {hotels?.length || 0} {hotels?.length === 1 ? 'property' : 'properties'} found
        </p>

        {hotels && hotels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hotels.map(hotel => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-stone-400 text-lg mb-4">No hotels found for your search.</p>
            <a href="/hotels" className="btn-outline">View all hotels</a>
          </div>
        )}
      </div>
    </div>
  )
}