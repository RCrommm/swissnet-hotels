import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: hotel } = await supabase.from('hotels').select('name, location').or(`slug.eq.${slug},id.eq.${slug}`).single()
  if (!hotel) return {}
  return {
    title: `${hotel.name} Rooms & Suites — ${hotel.location} | SwissNet Hotels`,
    description: `Explore all rooms and suites at ${hotel.name} in ${hotel.location}. View sizes, amenities, views and rates. Book direct for the best rate.`,
  }
}

export default async function RoomsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let { data: hotel } = await supabase.from('hotels').select('*').eq('slug', slug).single()
  if (!hotel) {
    const { data: hotelById } = await supabase.from('hotels').select('*').eq('id', slug).single()
    hotel = hotelById
  }
  if (!hotel || (!hotel.is_partner && !hotel.show_schema)) notFound()

  const { data: roomTypes } = await supabase
    .from('room_types')
    .select('*')
    .eq('hotel_id', hotel.id)
    .eq('is_available', true)
    .order('sort_order', { ascending: true })

  const gold = '#C9A84C'
  const border = 'rgba(201,169,76,0.2)'
  const text = '#1a0e06'
  const textMuted = 'rgba(26,14,6,0.5)'
  const bg = '#F8F5EF'
  const white = '#FFFFFF'
  const hotelUrl = hotel.slug || hotel.id
  const trackingUrl = `/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=website&campaign=rooms_page`

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: hotel.name,
    url: `https://swissnethotels.com/hotels/${hotelUrl}`,
    containsPlace: (roomTypes || []).map(rt => ({
      '@type': 'HotelRoom',
      name: rt.name,
      description: rt.description,
      occupancy: { '@type': 'QuantitativeValue', maxValue: rt.max_occupancy || 2 },
      bed: rt.bed_type ? { '@type': 'BedDetails', typeOfBed: rt.bed_type } : undefined,
      floorSize: rt.size_sqm ? { '@type': 'QuantitativeValue', value: rt.size_sqm, unitCode: 'MTK' } : undefined,
      offers: rt.base_rate_chf ? { '@type': 'Offer', price: rt.base_rate_chf, priceCurrency: 'CHF', url: hotel.direct_booking_url } : undefined,
    }))
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://swissnethotels.com' },
      { '@type': 'ListItem', position: 2, name: 'Hotels', item: 'https://swissnethotels.com/hotels' },
      { '@type': 'ListItem', position: 3, name: hotel.name, item: `https://swissnethotels.com/hotels/${hotelUrl}` },
      { '@type': 'ListItem', position: 4, name: 'Rooms & Suites', item: `https://swissnethotels.com/hotels/${hotelUrl}/rooms` },
    ]
  }

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Hero */}
      <div style={{ background: '#F8F5EF', padding: '6rem 2rem 3rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: textMuted, textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <Link href="/hotels" style={{ color: textMuted, textDecoration: 'none' }}>Hotels</Link>
            <span>›</span>
            <Link href={`/hotels/${hotelUrl}`} style={{ color: textMuted, textDecoration: 'none' }}>{hotel.name}</Link>
            <span>›</span>
            <span style={{ color: gold }}>Rooms & Suites</span>
          </div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: '0 0 0.75rem' }}>
            {hotel.name} · {hotel.location}
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 300, color: text, margin: '0 0 1rem', lineHeight: 1.1 }}>
            Rooms &amp; Suites
          </h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, margin: '0 0 2rem', fontWeight: 300 }}>
            {roomTypes?.length || 0} room types available · From CHF {Math.min(...(roomTypes || []).filter(r => r.base_rate_chf).map(r => r.base_rate_chf) || [hotel.nightly_rate_chf])?.toLocaleString()}/night
          </p>
          <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', textDecoration: 'none', borderRadius: 2 }}>
            Book Direct →
          </a>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem' }}>

        {/* Sub navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Overview', href: `/hotels/${hotelUrl}` },
            { label: 'Rooms', href: `/hotels/${hotelUrl}/rooms`, active: true },
            { label: 'Dining', href: `/hotels/${hotelUrl}/dining` },
            { label: 'Spa', href: `/hotels/${hotelUrl}/spa` },
            { label: 'Experiences', href: `/hotels/${hotelUrl}/experiences` },
          ].map(nav => (
            <Link key={nav.label} href={nav.href} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.5rem 1.25rem', textDecoration: 'none', borderRadius: 2, background: nav.active ? gold : white, color: nav.active ? '#1a0e06' : textMuted, border: `1px solid ${nav.active ? gold : border}` }}>
              {nav.label}
            </Link>
          ))}
        </div>

        {roomTypes && roomTypes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {roomTypes.map((rt, i) => (
              <div key={rt.id} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: rt.images?.[0] ? '320px 1fr' : '1fr', minHeight: 220 }}>
                  {rt.images?.[0] && (
                    <div style={{ overflow: 'hidden' }}>
                      <img src={rt.images[0]} alt={rt.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: text, margin: 0 }}>{rt.name}</h2>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: gold, border: `1px solid ${border}`, padding: '2px 8px', borderRadius: 2 }}>{rt.type_category || 'Room'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                          {rt.size_sqm && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>⬜ {rt.size_sqm} m²</span>}
                          {rt.bed_type && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🛏 {rt.bed_type}</span>}
                          {rt.view && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🏔 {rt.view}</span>}
                          {rt.max_occupancy && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>👤 Up to {rt.max_occupancy} guests</span>}
                          {rt.floor && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🏢 Floor {rt.floor}</span>}
                        </div>
                      </div>
                      {rt.base_rate_chf && (
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1.5rem' }}>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, margin: '0 0 0.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>From</p>
                          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, color: gold, margin: 0, lineHeight: 1 }}>CHF {rt.base_rate_chf.toLocaleString()}</p>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, margin: '0.2rem 0 0' }}>per night</p>
                        </div>
                      )}
                    </div>
                    {rt.description && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, lineHeight: 1.8, margin: '0 0 1rem', fontWeight: 300 }}>{rt.description}</p>}
                    {rt.amenities?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                        {rt.amenities.map((a: string) => (
                          <span key={a} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, background: bg, border: `1px solid ${border}`, padding: '3px 10px', borderRadius: 2 }}>{a}</span>
                        ))}
                      </div>
                    )}
                    <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.6rem 1.5rem', textDecoration: 'none', borderRadius: 2 }}>
                      Book This Room →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '4rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: textMuted, margin: '0 0 1rem' }}>Room details coming soon</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, margin: '0 0 1.5rem' }}>Contact the hotel directly for room information and availability.</p>
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', textDecoration: 'none', borderRadius: 2 }}>
              Enquire Direct →
            </a>
          </div>
        )}

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={`/hotels/${hotelUrl}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, textDecoration: 'none' }}>← Back to {hotel.name}</Link>
          <Link href={`/hotels/${hotelUrl}/dining`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: gold, textDecoration: 'none' }}>Dining →</Link>
        </div>
      </div>
    </div>
  )
}