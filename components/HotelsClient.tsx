'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const REGIONS = ['All Destinations', 'Zermatt', 'St. Moritz', 'Verbier', 'Davos', 'Interlaken', 'Lucerne', 'Geneva', 'Zurich', 'Gstaad', 'Lugano']
const CATEGORIES = ['All Types', 'Ski Resort', 'Wellness Retreat', 'City Luxury', 'Mountain Lodge', 'Lake Resort']

interface Hotel {
  id: string
  slug?: string
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
  is_partner: boolean
  show_schema: boolean
  star_rating?: number
}

interface Props {
  hotels: Hotel[]
  initialRegion: string
  initialCategory: string
  initialQ: string
}

function StarRating({ stars }: { stars: number }) {
  const gold = '#C9A84C'
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i < stars ? gold : 'rgba(201,169,110,0.25)'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

export default function HotelsClient({ hotels, initialRegion, initialCategory, initialQ }: Props) {
  const router = useRouter()
  const [region, setRegion] = useState(initialRegion)
  const [category, setCategory] = useState(initialCategory)
  const [q, setQ] = useState(initialQ)
  const [hovered, setHovered] = useState<string | null>(null)

  const gold = '#C9A84C'
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
      <div style={{ background: bgLight, paddingTop: '6rem', paddingBottom: '3rem', borderBottom: '1px solid ' + border }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: 0 }}>Switzerland</p>
            <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
          </div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 300, color: text, textAlign: 'center', margin: '0 0 2.5rem' }}>Luxury Hotels</h1>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid ' + border, borderRadius: 12, padding: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: textMuted, marginBottom: '0.4rem' }}>Destination</label>
              <select value={region} onChange={e => setRegion(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid ' + border, borderRadius: 8, color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', padding: '0.6rem 0.75rem', outline: 'none' }}>
                {REGIONS.map(r => <option key={r} value={r === 'All Destinations' ? '' : r} style={{ background: '#492816' }}>{r}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: textMuted, marginBottom: '0.4rem' }}>Hotel Type</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid ' + border, borderRadius: 8, color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', padding: '0.6rem 0.75rem', outline: 'none' }}>
                {CATEGORIES.map(c => <option key={c} value={c === 'All Types' ? '' : c} style={{ background: '#492816' }}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <label style={{ display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: textMuted, marginBottom: '0.4rem' }}>Search</label>
              <input type="text" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Hotel name, amenity..." style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid ' + border, borderRadius: 8, color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', padding: '0.6rem 0.75rem', outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
            <button onClick={handleSearch} style={{ background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' as const, padding: '0.65rem 1.5rem', border: 'none', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>Search</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '2rem' }}>
          {hotels.length} {hotels.length === 1 ? 'property' : 'properties'} found
        </p>
        {hotels.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {hotels.map(hotel => {
              const isHovered = hovered === hotel.id
              const starCount = hotel.star_rating || Math.round(hotel.rating)
              const websiteUrl = '/api/track?hotel_id=' + hotel.id + '&hotel_name=' + encodeURIComponent(hotel.name) + '&destination=' + encodeURIComponent(hotel.direct_booking_url.replace('/book', '').replace('/reservations', '')) + '&medium=website&campaign=hotels_page_website'
              const bookUrl = '/api/track?hotel_id=' + hotel.id + '&hotel_name=' + encodeURIComponent(hotel.name) + '&destination=' + encodeURIComponent(hotel.direct_booking_url) + '&medium=website&campaign=hotels_page_book'
              return (
                <div
                  key={hotel.id}
                  onMouseEnter={() => setHovered(hotel.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ background: '#FFFFFF', border: hotel.is_partner ? '1px solid ' + gold + '99' : '1px solid rgba(201,169,110,0.2)', borderRadius: 20, overflow: 'hidden', transition: 'all 0.35s ease', transform: isHovered ? 'translateY(-6px)' : 'translateY(0)', boxShadow: isHovered ? '0 20px 56px rgba(0,0,0,0.22)' : '0 2px 16px rgba(0,0,0,0.08)', position: 'relative' }}
                >
                  <Link href={'/hotels/' + (hotel.slug || hotel.id)} style={{ position: 'absolute', inset: 0, zIndex: 1 }} aria-label={'View ' + hotel.name} />
                  <div style={{ position: 'relative', height: '230px', overflow: 'hidden' }}>
                    <img src={hotel.images[0] || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', transform: isHovered ? 'scale(1.05)' : 'scale(1)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' }} />
                    {hotel.is_partner && (
                      <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, padding: '0.3rem 0.875rem', borderRadius: 20, zIndex: 2 }}>✦ Partner</div>
                    )}
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 2, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', borderRadius: 20, padding: '0.3rem 0.625rem' }}>
                      <StarRating stars={starCount} />
                    </div>
                    <div style={{ position: 'absolute', bottom: '1rem', left: '1.25rem', right: '1.25rem' }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: gold, margin: '0 0 0.3rem' }}>{hotel.category} · {hotel.region}</p>
                      <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: '#fff', margin: 0, lineHeight: 1.2 }}>{hotel.name}</h3>
                    </div>
                  </div>
                  <div style={{ padding: '1.25rem 1.375rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <svg width="11" height="11" fill="none" stroke={gold} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: 'rgba(61,43,31,0.5)' }}>{hotel.location}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 20, padding: '0.2rem 0.625rem' }}>
                        <span style={{ color: gold, fontSize: '0.65rem' }}>★</span>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: '#3D2B1F', fontWeight: 600 }}>{hotel.rating}</span>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: 'rgba(61,43,31,0.4)' }}>/ 5</span>
                      </div>
                    </div>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: 'rgba(61,43,31,0.55)', lineHeight: 1.7, marginBottom: '1rem', overflow: 'hidden', display: '-webkit-box' as const, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{hotel.description}</p>
                    {hotel.exclusive_offer && (
                      <div style={{ background: 'rgba(201,169,110,0.07)', borderLeft: '2px solid ' + gold, borderRadius: '0 6px 6px 0', padding: '0.5rem 0.75rem', marginBottom: '1rem' }}>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: gold, margin: 0 }}>✦ {hotel.exclusive_offer}</p>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid rgba(201,169,110,0.15)' }}>
                      <div>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', color: 'rgba(61,43,31,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, margin: '0 0 0.15rem' }}>From</p>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.45rem', fontWeight: 400, color: '#3D2B1F', margin: 0 }}>CHF {hotel.nightly_rate_chf.toLocaleString()}<span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: 'rgba(61,43,31,0.4)', fontWeight: 300 }}> /night</span></p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', position: 'relative', zIndex: 2 }}>
                        {hotel.is_partner && (
                          <>
                            <a href={websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#3D2B1F', border: '1px solid rgba(201,169,110,0.35)', borderRadius: 8, padding: '0.6rem 0.875rem', textDecoration: 'none' }}>Website</a>
                            <a href={bookUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#1a0e06', background: gold, borderRadius: 8, padding: '0.6rem 0.875rem', textDecoration: 'none' }}>Book Direct</a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: textMuted, marginBottom: '1rem' }}>No hotels found</p>
            <a href="/hotels" style={{ color: gold, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em' }}>Clear filters →</a>
          </div>
        )}
      </div>

      <footer style={{ background: '#2A1208', borderTop: '1px solid rgba(201,169,110,0.2)', padding: '2rem 0', marginTop: '4rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', textAlign: 'center' as const }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>© {new Date().getFullYear()} SwissNet Hotels. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}