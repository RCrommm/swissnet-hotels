import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: hotel } = await supabase.from('hotels').select('name, location').or(`slug.eq.${slug},id.eq.${slug}`).single()
  if (!hotel) return {}
  return {
    title: `${hotel.name} Experiences & Activities | SwissNet Hotels`,
    description: `Discover unique experiences and activities at ${hotel.name} in ${hotel.location} — from Alpine adventures to cultural immersions and private events.`,
  }
}

export default async function ExperiencesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let { data: hotel } = await supabase.from('hotels').select('*').eq('slug', slug).single()
  if (!hotel) {
    const { data: hotelById } = await supabase.from('hotels').select('*').eq('id', slug).single()
    hotel = hotelById
  }
  if (!hotel || (!hotel.is_partner && !hotel.show_schema)) notFound()

  const { data: experiences } = await supabase
    .from('hotel_experiences')
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
  const trackingUrl = `/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=website&campaign=experiences_page`

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: hotel.name,
    url: `https://swissnethotels.com/hotels/${hotelUrl}`,
    amenityFeature: (experiences || []).map(e => ({
      '@type': 'LocationFeatureSpecification',
      name: e.name,
      description: e.description,
      value: true,
    }))
  }

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div style={{ background: '#F8F5EF', padding: '6rem 2rem 3rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: textMuted, textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <Link href="/hotels" style={{ color: textMuted, textDecoration: 'none' }}>Hotels</Link>
            <span>›</span>
            <Link href={`/hotels/${hotelUrl}`} style={{ color: textMuted, textDecoration: 'none' }}>{hotel.name}</Link>
            <span>›</span>
            <span style={{ color: gold }}>Experiences</span>
          </div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: '0 0 0.75rem' }}>{hotel.name} · {hotel.location}</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 300, color: text, margin: '0 0 1rem', lineHeight: 1.1 }}>Experiences &amp; Activities</h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, margin: '0 0 2rem', fontWeight: 300 }}>
            Curated experiences · Alpine adventures · Cultural immersions
          </p>
          <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', textDecoration: 'none', borderRadius: 2 }}>
            Book an Experience →
          </a>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Overview', href: `/hotels/${hotelUrl}` },
            { label: 'Rooms', href: `/hotels/${hotelUrl}/rooms` },
            { label: 'Dining', href: `/hotels/${hotelUrl}/dining` },
            { label: 'Spa', href: `/hotels/${hotelUrl}/spa` },
            { label: 'Experiences', href: `/hotels/${hotelUrl}/experiences`, active: true },
          ].map(nav => (
            <Link key={nav.label} href={nav.href} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.5rem 1.25rem', textDecoration: 'none', borderRadius: 2, background: nav.active ? gold : white, color: nav.active ? '#1a0e06' : textMuted, border: `1px solid ${nav.active ? gold : border}` }}>
              {nav.label}
            </Link>
          ))}
        </div>

        {experiences && experiences.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {experiences.map((exp: any) => (
              <div key={exp.id} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                {exp.images?.[0] && (
                  <div style={{ height: 200, overflow: 'hidden' }}>
                    <img src={exp.images[0]} alt={exp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: text, margin: 0 }}>{exp.name}</h3>
                    {exp.price_from && (
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, margin: '0 0 0.1rem' }}>From</p>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: gold, margin: 0 }}>CHF {exp.price_from}</p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    {exp.duration && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted }}>⏱ {exp.duration}</span>}
                    {exp.category && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: gold, border: `1px solid ${border}`, padding: '2px 8px', borderRadius: 2 }}>{exp.category}</span>}
                  </div>
                  {exp.description && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, lineHeight: 1.7, margin: '0 0 1.25rem', fontWeight: 300 }}>{exp.description}</p>}
                  <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.6rem 1.5rem', textDecoration: 'none', borderRadius: 2 }}>
                    Book Now →
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '4rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: textMuted, margin: '0 0 1rem' }}>Experiences coming soon</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, margin: '0 0 1.5rem' }}>Contact the hotel to discover their exclusive experiences and activities.</p>
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', textDecoration: 'none', borderRadius: 2 }}>
              Contact Hotel →
            </a>
          </div>
        )}

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={`/hotels/${hotelUrl}/spa`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, textDecoration: 'none' }}>← Spa & Wellness</Link>
          <Link href={`/hotels/${hotelUrl}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: gold, textDecoration: 'none' }}>Back to Overview →</Link>
        </div>
      </div>
    </div>
  )
}