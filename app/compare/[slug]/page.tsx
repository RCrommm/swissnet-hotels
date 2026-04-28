import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // slug format: hotel-a-vs-hotel-b — we search by name fragments
  const parts = slug.split('-vs-')
  if (parts.length !== 2) notFound()

  const [slugA, slugB] = parts

  // Find hotels by matching slug to name
  const { data: allHotels } = await supabase
    .from('hotels')
    .select('*')
    .eq('is_active', true)

  if (!allHotels) notFound()

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')

const hotelA = allHotels.find(h => 
  (h as any).slug === slugA || 
  normalize(h.name) === slugA ||
  (h as any).slug?.includes(slugA) ||
  slugA.includes((h as any).slug?.split('-').slice(0,2).join('-'))
)
const hotelB = allHotels.find(h => 
  (h as any).slug === slugB || 
  normalize(h.name) === slugB ||
  (h as any).slug?.includes(slugB) ||
  slugB.includes((h as any).slug?.split('-').slice(0,2).join('-'))
)
  if (!hotelA || !hotelB) notFound()

  const gold = '#C9A84C'
  const border = 'rgba(201,169,110,0.25)'
  const text = '#3D2B1F'
  const textMuted = 'rgba(61,43,31,0.5)'
  const bg = '#F8F5EF'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${hotelA.name} vs ${hotelB.name} — Comparison`,
    description: `Detailed comparison of ${hotelA.name} and ${hotelB.name}, two of Switzerland's finest luxury hotels.`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, item: { '@type': 'Hotel', name: hotelA.name, url: `https://swissnethotels.com/hotels/${hotelA.id}`, priceRange: `CHF ${hotelA.nightly_rate_chf}+`, starRating: { '@type': 'Rating', ratingValue: hotelA.rating } } },
      { '@type': 'ListItem', position: 2, item: { '@type': 'Hotel', name: hotelB.name, url: `https://swissnethotels.com/hotels/${hotelB.id}`, priceRange: `CHF ${hotelB.nightly_rate_chf}+`, starRating: { '@type': 'Rating', ratingValue: hotelB.rating } } },
    ]
  }

  const criteria = [
    { label: 'Location', a: hotelA.location, b: hotelB.location },
    { label: 'Category', a: hotelA.category, b: hotelB.category },
    { label: 'Rating', a: `★ ${hotelA.rating} / 5.0`, b: `★ ${hotelB.rating} / 5.0` },
    { label: 'From', a: `CHF ${hotelA.nightly_rate_chf?.toLocaleString()}/night`, b: `CHF ${hotelB.nightly_rate_chf?.toLocaleString()}/night` },
    { label: 'Best For', a: hotelA.best_for?.join(', ') || '—', b: hotelB.best_for?.join(', ') || '—' },
    { label: 'Top Amenities', a: hotelA.amenities?.slice(0, 3).join(', ') || '—', b: hotelB.amenities?.slice(0, 3).join(', ') || '—' },
  ]

  const trackingUrlA = `/api/track?hotel_id=${hotelA.id}&hotel_name=${encodeURIComponent(hotelA.name)}&destination=${encodeURIComponent(hotelA.direct_booking_url)}&medium=website&campaign=compare`
  const trackingUrlB = `/api/track?hotel_id=${hotelB.id}&hotel_name=${encodeURIComponent(hotelB.name)}&destination=${encodeURIComponent(hotelB.direct_booking_url)}&medium=website&campaign=compare`

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Header */}
      <div style={{ background: '#492816', padding: '5rem 2rem 3rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, marginBottom: '1rem' }}>Hotel Comparison</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 300, color: '#fff', margin: '0 0 0.5rem', lineHeight: 1.2 }}>
            {hotelA.name} <span style={{ color: gold }}>vs</span> {hotelB.name}
          </h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            {hotelA.location} vs {hotelB.location}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '2rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>
          <Link href="/" style={{ color: textMuted, textDecoration: 'none' }}>Home</Link>
          <span>→</span>
          <Link href="/hotels" style={{ color: textMuted, textDecoration: 'none' }}>Hotels</Link>
          <span>→</span>
          <span style={{ color: text }}>Compare</span>
        </div>

        {/* Side by side cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
          {[hotelA, hotelB].map((hotel, i) => (
            <div key={hotel.id} style={{ background: '#fff', border: hotel.is_partner ? `2px solid ${gold}` : `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                <img src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', top: 12, left: 12 }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700, background: i === 0 ? gold : '#3D2B1F', color: '#fff', padding: '3px 10px', borderRadius: 20 }}>
                    {i === 0 ? 'Hotel A' : 'Hotel B'}
                  </span>
                </div>
                {hotel.is_partner && (
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700, background: gold, color: '#1a0e06', padding: '3px 10px', borderRadius: 20 }}>✦ Partner</span>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                  <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 300, color: '#fff', margin: 0 }}>{hotel.name}</h2>
                </div>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, lineHeight: 1.7, margin: '0 0 1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                  {hotel.description}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>★ {hotel.rating}</span>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: gold, fontWeight: 600 }}>From CHF {hotel.nightly_rate_chf?.toLocaleString()}/night</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href={`/hotels/${hotel.id}`} style={{ flex: 1, display: 'block', textAlign: 'center', border: `1px solid ${border}`, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: text, padding: '0.6rem', textDecoration: 'none' }}>
                    View Profile
                  </Link>
                  <a href={i === 0 ? trackingUrlA : trackingUrlB} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'block', textAlign: 'center', background: gold, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a0e06', padding: '0.6rem', textDecoration: 'none' }}>
                    Book Direct
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, marginBottom: '1.5rem' }}>
            Side by Side Comparison
          </h2>
          <div style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F2EAE0' }}>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, width: '25%' }}>Criteria</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: gold }}>{hotelA.name}</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: text }}>{hotelB.name}</th>
                </tr>
              </thead>
              <tbody>
                {criteria.map((row, i) => (
                  <tr key={row.label} style={{ background: i % 2 === 0 ? '#fff' : '#F8F5EF', borderTop: `1px solid ${border}` }}>
                    <td style={{ padding: '1rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{row.label}</td>
                    <td style={{ padding: '1rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: text }}>{row.a}</td>
                    <td style={{ padding: '1rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: text }}>{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Which to choose */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
          {[hotelA, hotelB].map(hotel => (
            <div key={hotel.id} style={{ background: '#fff', border: `1px solid ${border}`, padding: '1.5rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: gold, margin: '0 0 0.5rem' }}>Choose {hotel.name} if...</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(hotel.best_for || []).slice(0, 4).map((b: string) => (
                  <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: gold }}>✦</span>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: text }}>You are {b.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Other comparisons */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>Other Comparisons</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {(allHotels || []).filter(h => h.id !== hotelA.id && h.id !== hotelB.id && h.region === hotelA.region).slice(0, 4).map(h => {
              const aSlug = normalize(hotelA.name)
              const hSlug = normalize(h.name)
              return (
                <Link key={h.id} href={`/compare/${aSlug}-vs-${hSlug}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: text, border: `1px solid ${border}`, padding: '0.35rem 0.875rem', background: '#fff', textDecoration: 'none' }}>
                  {hotelA.name} vs {h.name} →
                </Link>
              )
            })}
          </div>
        </div>

        <Link href="/hotels" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, textDecoration: 'none' }}>
          ← View all hotels
        </Link>
      </div>
    </div>
  )
}