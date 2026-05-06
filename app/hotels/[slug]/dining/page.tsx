import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: hotel } = await supabase.from('hotels').select('name, location').or(`slug.eq.${slug},id.eq.${slug}`).single()
  if (!hotel) return {}
  return {
    title: `${hotel.name} Dining & Restaurants | SwissNet Hotels`,
    description: `Discover the dining experiences at ${hotel.name} in ${hotel.location} — from fine dining restaurants to casual bars and private dining options.`,
  }
}

export default async function DiningPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let { data: hotel } = await supabase.from('hotels').select('*').eq('slug', slug).single()
  if (!hotel) {
    const { data: hotelById } = await supabase.from('hotels').select('*').eq('id', slug).single()
    hotel = hotelById
  }
  if (!hotel || (!hotel.is_partner && !hotel.show_schema)) notFound()

  const { data: restaurants } = await supabase
    .from('hotel_restaurants')
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
  const trackingUrl = `/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=website&campaign=dining_page`

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: hotel.name,
    url: `https://swissnethotels.com/hotels/${hotelUrl}`,
    hasMap: `https://www.google.com/maps/search/${encodeURIComponent(hotel.name + ' ' + hotel.location)}`,
    containsPlace: (restaurants || []).map(r => ({
      '@type': 'Restaurant',
      name: r.name,
      description: r.description,
      servesCuisine: r.cuisine_type,
      priceRange: r.price_range,
      openingHours: r.opening_hours,
      starRating: r.michelin_stars ? { '@type': 'Rating', ratingValue: r.michelin_stars } : undefined,
    }))
  }

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div style={{ background: '#F8F5EF', padding: '6rem 2rem 3rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: textMuted, textDecoration: 'none' }}>Home</Link>
<span>›</span>
<Link href="/hotels" style={{ color: textMuted, textDecoration: 'none' }}>Hotels</Link>
<span>›</span>
<Link href={`/hotels/${hotelUrl}`} style={{ color: textMuted, textDecoration: 'none' }}>{hotel.name}</Link>
<span>›</span>
<span style={{ color: gold }}>Dining</span>
          </div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: '0 0 0.75rem' }}>{hotel.name} · {hotel.location}</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 300, color: text, margin: '0 0 0.5rem', lineHeight: 1.1 }}>Dining &amp; Restaurants</h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: textMuted, margin: '0 0 1rem' }}>
            Part of <Link href={`/hotels/${hotelUrl}`} style={{ color: gold, textDecoration: 'none', fontWeight: 600 }}>{hotel.name}</Link>
          </p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, margin: '0 0 2rem', fontWeight: 300 }}>
            {restaurants?.length || 0} dining venues · Fine dining, casual and private options
          </p>
          <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', textDecoration: 'none', borderRadius: 2 }}>
            Make a Reservation →
          </a>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Overview', href: `/hotels/${hotelUrl}` },
            { label: 'Rooms', href: `/hotels/${hotelUrl}/rooms` },
            { label: 'Dining', href: `/hotels/${hotelUrl}/dining`, active: true },
            { label: 'Spa', href: `/hotels/${hotelUrl}/spa` },
            { label: 'Experiences', href: `/hotels/${hotelUrl}/experiences` },
          ].map(nav => (
            <Link key={nav.label} href={nav.href} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.5rem 1.25rem', textDecoration: 'none', borderRadius: 2, background: nav.active ? gold : white, color: nav.active ? '#1a0e06' : textMuted, border: `1px solid ${nav.active ? gold : border}` }}>
              {nav.label}
            </Link>
          ))}
        </div>

        {restaurants && restaurants.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {restaurants.map((r: any) => (
              <div key={r.id} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: r.images?.[0] ? '320px 1fr' : '1fr', minHeight: 200 }}>
                  {r.images?.[0] && (
                    <div style={{ overflow: 'hidden' }}>
                      <img src={r.images[0]} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: text, margin: 0 }}>{r.name}</h2>
                          {r.michelin_stars > 0 && <span style={{ color: gold, fontSize: '0.85rem' }}>{'★'.repeat(r.michelin_stars)} Michelin</span>}
                          {r.cuisine_type && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: gold, border: `1px solid ${border}`, padding: '2px 8px', borderRadius: 2 }}>{r.cuisine_type}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                          {r.opening_hours && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🕐 {r.opening_hours}</span>}
                          {r.dress_code && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>👔 {r.dress_code}</span>}
                          {r.seats && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>👥 {r.seats} seats</span>}
                        </div>
                      </div>
                      {r.price_range && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, flexShrink: 0, marginLeft: '1rem' }}>{r.price_range}</span>}
                    </div>
                    {r.description && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, lineHeight: 1.8, margin: '0 0 1rem', fontWeight: 300 }}>{r.description}</p>}
                    {r.meal_types?.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                        {r.meal_types.map((m: string) => (
                          <span key={m} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, background: bg, border: `1px solid ${border}`, padding: '3px 10px', borderRadius: 2 }}>{m}</span>
                        ))}
                      </div>
                    )}
                    <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.6rem 1.5rem', textDecoration: 'none', borderRadius: 2 }}>
                      Reserve a Table →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '4rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: textMuted, margin: '0 0 1rem' }}>Dining details coming soon</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, margin: '0 0 1.5rem' }}>Contact the hotel directly for dining reservations.</p>
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', textDecoration: 'none', borderRadius: 2 }}>
              Contact Hotel →
            </a>
          </div>
        )}

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={`/hotels/${hotelUrl}/rooms`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, textDecoration: 'none' }}>← Rooms & Suites</Link>
          <Link href={`/hotels/${hotelUrl}/spa`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: gold, textDecoration: 'none' }}>Spa & Wellness →</Link>
        </div>
      </div>
    </div>
  )
}