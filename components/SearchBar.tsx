'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

const REGIONS = ['All Regions', 'Zermatt', 'St. Moritz', 'Verbier', 'Davos', 'Interlaken', 'Lucerne', 'Geneva', 'Zurich', 'Gstaad', 'Lugano']
const CATEGORIES = ['All Types', 'Ski Resort', 'Wellness Retreat', 'City Luxury', 'Mountain Lodge', 'Lake Resort']

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [region, setRegion] = useState(searchParams.get('region') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [query, setQuery] = useState(searchParams.get('q') || '')

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (region && region !== 'All Regions') params.set('region', region)
    if (category && category !== 'All Types') params.set('category', category)
    router.push(`/hotels?${params.toString()}`)
  }

  return (
    <div className="bg-white shadow-lg border border-stone-200 p-4">
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Matterhorn view, private spa, ski-in/ski-out..."
          className="flex-1 border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:border-amber-700"
        />
        <select
          value={region}
          onChange={e => setRegion(e.target.value)}
          className="border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:border-amber-700 bg-white min-w-[150px]"
        >
          {REGIONS.map(r => <option key={r} value={r === 'All Regions' ? '' : r}>{r}</option>)}
        </select>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:border-amber-700 bg-white min-w-[150px]"
        >
          {CATEGORIES.map(c => <option key={c} value={c === 'All Types' ? '' : c}>{c}</option>)}
        </select>
        <button onClick={handleSearch} className="btn-primary px-8">
          Search
        </button>
      </div>
    </div>
  )
}