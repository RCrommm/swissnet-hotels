'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const REGIONS = ['All Destinations', 'Zermatt', 'St. Moritz', 'Verbier', 'Davos', 'Interlaken', 'Lucerne', 'Geneva', 'Zurich', 'Gstaad', 'Lugano']
const CATEGORIES = ['All Types', 'Ski Resort', 'Wellness Retreat', 'City Luxury', 'Mountain Lodge', 'Lake Resort']

interface Hotel {
  id: string
  name: string
  location: string
  region: string
  category: string
  rating: number
  nightly_rate_chf: number
  images: string[]
  amenities: string[]
  best_for: string[]
  description: string
  direct_booking_url: string
  exclusive_offer: string
  contact_email: string
  is_featured: boolean
}

interface Props {
  hotels: Hotel[]
  initialRegion: string
  initialCategory: string
  initialQ: string
}

export default function HotelsClient({ hotels, initialRegion, initialCategory, initialQ }: Props) {
  const router = useRouter()
  const [region, setRegion] = useState(initialRegion)
  const [category, setCategory] = useState(initialCategory)
  const [q, setQ] = useState(initialQ)
  const [hovered, setHovered] = useState<string | null>(null)

  const gold = '#C9A84C'
  const bg = '#492816'
  const bgLight = '#3D2010'
  const border = 'rgba(201,169,110,0.3)'
  const text = '#FFFFFF'
  const textMuted = 'rgba(255,255,255,0.6)'

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (region && region !== 'All Destinations') params.set('region', region)
    if (category && category !== 'All Types') params.set('category', category)
    router.push('/hotels?' + params.toString())
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background: bgLight, paddingTop: '6rem', paddingBottom: '3rem', borderBottom: '1px solid ' + border }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: 0 }}>Switzerland</p>
            <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
          </div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 300, color: text, textAlign: 'center', margin: '0 0 2.5rem' }}>
            Partner Luxury Hotels
          </h1>

          {/* Search bar */}
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid ' + border, padding: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Destination */}
            <div style={{ flex: '1', minWidth: '180px' }}>
              <label style={{ display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, marginBottom: '0.4rem' }}>Destination</label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid ' + border, color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', padding: '0.6rem 0.75rem', outline: 'none' }}
              >
                {REGIONS.map(r => <option key={r} value={r === 'All Destinations' ? '' : r} style={{ background: '#492816' }}>{r}</option>)}
              </select>
            </div>

            {/* Hotel type */}
            <div style={{ flex: '1', minWidth: '180px' }}>
              <label style={{ display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, marginBottom: '0.4rem' }}>Hotel Type</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid ' + border, color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', padding: '0.6rem 0.75rem', outline: 'none' }}
              >
                {CATEGORIES.map(c => <option key={c} value={c === 'All Types' ? '' : c} style={{ background: '#492816' }}>{c}</option>)}
              </select>
            </div>

            {/* Search input */}
            <div style={{ flex: '2', minWidth: '200px' }}>
              <label style={{ display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, marginBottom: '0.4rem' }}>Search</label>
              <input
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Hotel name, amenity, location..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid ' + border, color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', padding: '0.6rem 0.75rem', outline: 'none', boxSizing: 'border-box' as const }}
              />
            </div>

            <div style={{ alignSelf: 'flex-end' }}>
              <button
                onClick={handleSearch}
                style={{ background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.65rem 1.5rem', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' as const }}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2rem' }}>
          {hotels.length} {hotels.length === 1 ? 'property' : 'properties'} found
        </p>

        {hotels.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {hotels.map(hotel => (
              <div
                key={hotel.id}
                onMouseEnter={() => setHovered(hotel.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(201,169,110,0.25)',
                  overflow: 'hidden',
                  transition: 'all 0.4s ease',
                  transform: hovered === hotel.id ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: hovered === hotel.id ? '0 16px 48px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.1)',
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                  <img
                    src={hotel.images[0] || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'}
                    alt={hotel.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', transform: hovered === hotel.id ? 'scale(1.04)' : 'scale(1)' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(61,43,31,0.5) 0%, transparent 60%)' }} />
                  {hotel.is_featured && (
                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.25rem 0.6rem' }}>
                      Featured
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: '1rem', left: '1.25rem' }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, margin: '0 0 0.25rem' }}>{hotel.category}</p>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: '#fff', margin: 0 }}>{hotel.name}</h3>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.25rem' }}>
                  {/* Location */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem' }}>📍</span>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: 'rgba(61,43,31,0.5)' }}>{hotel.location}</span>
                  </div>

                  {/* Description */}
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: 'rgba(61,43,31,0.6)', lineHeight: 1.7, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                    {hotel.description}
                  </p>

                  {/* Exclusive offer */}
                  {hotel.exclusive_offer && (
                    <div style={{ background: 'rgba(201,169,110,0.08)', borderLeft: '2px solid ' + gold, padding: '0.5rem 0.75rem', marginBottom: '1rem' }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: gold, margin: 0, lineHeight: 1.5 }}>✦ {hotel.exclusive_offer}</p>
                    </div>
                  )}

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(201,169,110,0.15)' }}>
                    
                      href={`/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url.replace('/book', '').replace('/reservations', ''))}&medium=website&campaign=hotels_page_website`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ flex: 1, display: 'block', textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3D2B1F', border: '1px solid rgba(201,169,110,0.3)', padding: '0.65rem', textDecoration: 'none', transition: 'all 0.2s' }}
                    >
                      Website
                    </a>
                    
                      href={`/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=website&campaign=hotels_page_book`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ flex: 1, display: 'block', textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fff', background: gold, padding: '0.65rem', textDecoration: 'none', transition: 'all 0.2s' }}
                    >
                      Book Direct
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: textMuted, marginBottom: '1rem' }}>No hotels found</p>
            <a href="/hotels" style={{ color: gold, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em' }}>Clear filters →</a>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background: '#2A1208', borderTop: '1px solid rgba(201,169,110,0.2)', padding: '2rem 0', marginTop: '4rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>© {new Date().getFullYear()} SwissNet Hotels. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}