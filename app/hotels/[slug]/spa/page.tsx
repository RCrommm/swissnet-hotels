import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: hotel } = await supabase.from('hotels').select('name, location').or(`slug.eq.${slug},id.eq.${slug}`).single()
  if (!hotel) return {}
  return {
    title: `${hotel.name} Spa & Wellness | SwissNet Hotels`,
    description: `Discover the spa and wellness facilities at ${hotel.name} in ${hotel.location}. Treatments, pools, saunas and Alpine wellness rituals.`,
  }
}

export default async function SpaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let { data: hotel } = await supabase.from('hotels').select('*').eq('slug', slug).single()
  if (!hotel) {
    const { data: hotelById } = await supabase.from('hotels').select('*').eq('id', slug).single()
    hotel = hotelById
  }
  if (!hotel || (!hotel.is_partner && !hotel.show_schema)) notFound()

  const { data: spaData } = await supabase
    .from('hotel_spa')
    .select('*')
    .eq('hotel_id', hotel.id)
    .eq('is_available', true)

  const gold = '#C9A84C'
  const border = 'rgba(201,169,76,0.2)'
  const text = '#1a0e06'
  const textMuted = 'rgba(26,14,6,0.5)'
  const bg = '#F8F5EF'
  const white = '#FFFFFF'
  const hotelUrl = hotel.slug || hotel.id
  const trackingUrl = `/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=website&campaign=spa_page`

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <div style={{ background: '#F8F5EF', padding: '6rem 2rem 3rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <Link href="/hotels" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Hotels</Link>
            <span>›</span>
            <Link href={`/hotels/${hotelUrl}`} style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>{hotel.name}</Link>
            <span>›</span>
            <span style={{ color: gold }}>Spa & Wellness</span>
          </div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: '0 0 0.75rem' }}>{hotel.name} · {hotel.location}</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 300, color: white, margin: '0 0 1rem', lineHeight: 1.1 }}>Spa &amp; Wellness</h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 2rem', fontWeight: 300 }}>
            Alpine wellness traditions · Signature treatments · World-class facilities
          </p>
          <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', textDecoration: 'none', borderRadius: 2 }}>
            Book a Treatment →
          </a>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Overview', href: `/hotels/${hotelUrl}` },
            { label: 'Rooms', href: `/hotels/${hotelUrl}/rooms` },
            { label: 'Dining', href: `/hotels/${hotelUrl}/dining` },
            { label: 'Spa', href: `/hotels/${hotelUrl}/spa`, active: true },
            { label: 'Experiences', href: `/hotels/${hotelUrl}/experiences` },
          ].map(nav => (
            <Link key={nav.label} href={nav.href} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.5rem 1.25rem', textDecoration: 'none', borderRadius: 2, background: nav.active ? gold : white, color: nav.active ? '#1a0e06' : textMuted, border: `1px solid ${nav.active ? gold : border}` }}>
              {nav.label}
            </Link>
          ))}
        </div>

        {spaData && spaData.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {spaData.map((spa: any) => (
              <div key={spa.id} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: spa.images?.[0] ? '320px 1fr' : '1fr', minHeight: 200 }}>
                  {spa.images?.[0] && (
                    <div style={{ overflow: 'hidden' }}>
                      <img src={spa.images[0]} alt={spa.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: '2rem' }}>
                    <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: text, margin: '0 0 0.75rem' }}>{spa.name}</h2>
                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      {spa.size_sqm && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>⬜ {spa.size_sqm} m²</span>}
                      {spa.pool && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🏊 Pool</span>}
                      {spa.sauna && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🧖 Sauna</span>}
                      {spa.hammam && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>♨️ Hammam</span>}
                      {spa.opening_hours && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🕐 {spa.opening_hours}</span>}
                      {spa.price_from && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: gold, fontWeight: 600 }}>From CHF {spa.price_from}</span>}
                    </div>
                    {spa.description && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, lineHeight: 1.8, margin: '0 0 1rem', fontWeight: 300 }}>{spa.description}</p>}
                    {spa.facilities?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                        {spa.facilities.map((f: string) => (
                          <span key={f} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, background: bg, border: `1px solid ${border}`, padding: '3px 10px', borderRadius: 2 }}>{f}</span>
                        ))}
                      </div>
                    )}
                    <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.6rem 1.5rem', textDecoration: 'none', borderRadius: 2 }}>
                      Book a Treatment →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '4rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: textMuted, margin: '0 0 1rem' }}>Spa details coming soon</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, margin: '0 0 1.5rem' }}>Contact the hotel directly for spa bookings and treatment information.</p>
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', textDecoration: 'none', borderRadius: 2 }}>
              Contact Hotel →
            </a>
          </div>
        )}

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={`/hotels/${hotelUrl}/dining`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, textDecoration: 'none' }}>← Dining</Link>
          <Link href={`/hotels/${hotelUrl}/experiences`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: gold, textDecoration: 'none' }}>Experiences →</Link>
        </div>
      </div>
    </div>
  )
}