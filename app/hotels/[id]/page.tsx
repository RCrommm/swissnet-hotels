import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import LeadForm from '@/components/LeadForm'
import Link from 'next/link'
import { MapPin, Star, Check } from 'lucide-react'

function HotelSchema({ hotel, keywords }: { hotel: any; keywords: any[] }) {
  const allKeywords = [
    ...(hotel.amenities || []),
    ...(hotel.best_for || []),
    hotel.region,
    hotel.category,
    hotel.name,
    'luxury hotel Switzerland',
    'direct booking Switzerland',
    ...keywords.map((k: any) => k.keyword),
    hotel.seo_keywords || '',
  ].filter(Boolean).join(', ')

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: hotel.name,
    description: hotel.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: hotel.location,
      addressCountry: 'CH',
    },
    starRating: { '@type': 'Rating', ratingValue: hotel.rating },
    priceRange: `CHF ${hotel.nightly_rate_chf}+`,
    amenityFeature: hotel.amenities?.map((a: string) => ({
      '@type': 'LocationFeatureSpecification',
      name: a,
      value: true,
    })),
    url: hotel.direct_booking_url,
    image: hotel.images?.[0],
    keywords: allKeywords,
    offers: {
      '@type': 'Offer',
      price: hotel.nightly_rate_chf,
      priceCurrency: 'CHF',
      description: hotel.exclusive_offer || 'Direct booking rate',
      url: hotel.direct_booking_url,
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default async function HotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: hotel } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', id)
    .single()

  if (!hotel) notFound()

  const { data: keywords } = await supabase
    .from('hotel_keywords')
    .select('keyword')
    .eq('hotel_id', id)

  const { data: roomRates } = await supabase
    .from('room_rates')
    .select('*')
    .eq('hotel_id', id)
    .eq('is_current', true)
    .order('rate_chf', { ascending: true })

  const gold = '#C9A84C'
  const border = 'rgba(201,169,110,0.25)'
  const text = '#3D2B1F'
  const textMuted = 'rgba(61,43,31,0.5)'

  return (
    <div style={{ background: '#F8F5EF', minHeight: '100vh' }}>
      <HotelSchema hotel={hotel} keywords={keywords || []} />

      {/* Hero image */}
      <div style={{ position: 'relative', height: '60vh', overflow: 'hidden' }}>
        <img
          src={hotel.images[0] || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600'}
          alt={hotel.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(61,43,31,0.7) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, marginBottom: '0.5rem' }}>{hotel.category} · {hotel.region}</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 300, color: '#fff', margin: '0 0 0.5rem' }}>{hotel.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
            <span>📍 {hotel.location}</span>
            <span>·</span>
            <span>★ {hotel.rating} / 5.0</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem' }}>

        {/* Main content */}
        <div>
          {hotel.exclusive_offer && (
            <div style={{ background: 'rgba(201,169,110,0.1)', borderLeft: '3px solid ' + gold, padding: '1rem 1.25rem', marginBottom: '2rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: gold, marginBottom: '0.25rem' }}>Exclusive SwissNet Offer</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: text, margin: 0, fontWeight: 500 }}>{hotel.exclusive_offer}</p>
            </div>
          )}

          {/* Room rates */}
          {roomRates && roomRates.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>Room Types & Rates</h2>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {roomRates.map((rate: any) => (
                  <div key={rate.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid ' + border, padding: '1rem 1.25rem' }}>
                    <div>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', fontWeight: 500, color: text, margin: 0 }}>{rate.room_type}</p>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: '0.2rem 0 0' }}>Per night · Direct booking</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: gold, margin: 0 }}>CHF {rate.rate_chf.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, marginTop: '0.75rem' }}>
                Rates updated daily · Last updated: {new Date(roomRates[0].scraped_at).toLocaleDateString('en-GB')}
              </p>
            </div>
          )}

          {/* Description */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>About the Hotel</h2>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: textMuted, lineHeight: 1.8, fontWeight: 300 }}>{hotel.description}</p>
          </div>

          {/* Amenities */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>Amenities</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {hotel.amenities.map((a: string) => (
                <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: text }}>
                  <span style={{ color: gold }}>✓</span> {a}
                </div>
              ))}
            </div>
          </div>

          {/* Best for */}
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>Perfect For</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {hotel.best_for.map((b: string) => (
                <span key={b} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: text, border: '1px solid ' + border, padding: '0.35rem 0.75rem', background: '#fff' }}>{b}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ background: '#fff', border: '1px solid ' + border, padding: '1.5rem', marginBottom: '1.5rem', position: 'sticky', top: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid ' + border }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, margin: '0 0 0.5rem' }}>From</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 400, color: text, margin: 0 }}>
                CHF {hotel.nightly_rate_chf.toLocaleString()}
              </p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: '0.25rem 0 0' }}>per night</p>
            </div>

            <a href={hotel.direct_booking_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1rem', textAlign: 'center', textDecoration: 'none', marginBottom: '0.75rem' }}>
              Book Direct →
            </a>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, textAlign: 'center', margin: '0 0 1.5rem' }}>No booking fees · Best rate guarantee</p>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: '0 0 0.25rem' }}>Questions? Contact the hotel:</p>
              <a href={'mailto:' + hotel.contact_email} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: gold, textDecoration: 'none' }}>{hotel.contact_email}</a>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid ' + border, padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 400, color: text, marginBottom: '1rem' }}>Send an Enquiry</h3>
            <LeadForm hotel={hotel} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 3rem' }}>
        <Link href="/hotels" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, textDecoration: 'none' }}>
          ← Back to all hotels
        </Link>
      </div>
    </div>
  )
}