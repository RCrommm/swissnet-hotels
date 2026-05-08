import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: hotelMeta } = await supabase.from('hotels').select('name, location, slug, nightly_rate_chf').or(`slug.eq.${slug},id.eq.${slug}`).single()
  if (!hotelMeta) return {}
  return {
    title: `${hotelMeta.name} Rooms & Suites in ${hotelMeta.location}, Switzerland | SwissNet Hotels`,
    description: `Explore all rooms and suites at ${hotelMeta.name} in ${hotelMeta.location}, Switzerland. View sizes, bed types, views and rates from CHF ${hotelMeta.nightly_rate_chf}/night. Book direct for the best rate.`,
    alternates: {
      canonical: `https://swissnethotels.com/hotels/${hotelMeta.slug || slug}/rooms`,
    },
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
  const slugify = (value: string) =>
    value?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ''
  const hotelUrl = hotel.slug || hotel.id
  const pageUrl = `https://swissnethotels.com/hotels/${hotelUrl}/rooms`
  const hotelId = `https://swissnethotels.com/hotels/${hotelUrl}#hotel`
  const trackingUrl = `/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=website&campaign=rooms_page`

  const rates = (roomTypes || [])
  .map((r: any) => r.base_rate_chf)
  .filter((rate: any) => typeof rate === 'number' && rate > 0)
const minRate = rates.length > 0 ? Math.min(...rates) : hotel.nightly_rate_chf || null
  const suites = (roomTypes || []).filter((r: any) => r.type_category === 'Suite' || r.name?.toLowerCase().includes('suite'))
  const hasLakeView = (roomTypes || []).some((r: any) => r.view?.toLowerCase().includes('lake'))
  const hasMountainView = (roomTypes || []).some((r: any) => r.view?.toLowerCase().includes('mountain') || r.view?.toLowerCase().includes('matterhorn') || r.view?.toLowerCase().includes('jungfrau') || r.view?.toLowerCase().includes('alps'))

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${hotel.name} Rooms & Suites | SwissNet Hotels`,
        isPartOf: { '@id': 'https://swissnethotels.com#website' },
        about: { '@id': hotelId },
        mainEntity: { '@id': hotelId },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://swissnethotels.com' },
          { '@type': 'ListItem', position: 2, name: 'Hotels', item: 'https://swissnethotels.com/hotels' },
          { '@type': 'ListItem', position: 3, name: hotel.name, item: `https://swissnethotels.com/hotels/${hotelUrl}` },
          { '@type': 'ListItem', position: 4, name: 'Rooms & Suites', item: pageUrl },
        ]
      },
      ...(roomTypes || []).map((rt: any) => ({
        '@type': 'HotelRoom',
        '@id': `${pageUrl}#room-${slugify(rt.name || rt.id)}`,
        name: rt.name,
        description: rt.description || undefined,
        containedInPlace: { '@id': hotelId },
        occupancy: { '@type': 'QuantitativeValue', maxValue: rt.max_occupancy || 2 },
        bed: rt.bed_type ? { '@type': 'BedDetails', typeOfBed: rt.bed_type } : undefined,
        floorSize: rt.size_sqm ? { '@type': 'QuantitativeValue', value: rt.size_sqm, unitCode: 'MTK' } : undefined,
      })),
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: `How many rooms does ${hotel.name} have?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${hotel.name} in ${hotel.location}, Switzerland offers ${roomTypes?.length || 'multiple'} room types${minRate ? `, with rates from CHF ${minRate.toLocaleString()} per night` : ''}.${suites.length > 0 ? ` The hotel features ${suites.length} suite categories.` : ''}`
            }
          },
          {
            '@type': 'Question',
            name: `Does ${hotel.name} have suites?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: suites.length > 0
                ? `Yes. ${hotel.name} in ${hotel.location}, Switzerland offers ${suites.length} suite categories including ${suites.slice(0, 3).map((s: any) => s.name).join(', ')}.`
                : `Yes. ${hotel.name} in ${hotel.location}, Switzerland offers a range of luxury accommodation categories. Contact the hotel directly for suite availability.`
            }
          },
          ...(hasLakeView ? [{
            '@type': 'Question',
            name: `Does ${hotel.name} have rooms with lake views?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Yes. ${hotel.name} in ${hotel.location}, Switzerland offers rooms and suites with lake views. ${(roomTypes || []).filter((r: any) => r.view?.toLowerCase().includes('lake')).map((r: any) => r.name).join(', ')} all feature lake views.`
            }
          }] : []),
          ...(hasMountainView ? [{
            '@type': 'Question',
            name: `Does ${hotel.name} have rooms with mountain views?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Yes. ${hotel.name} in ${hotel.location}, Switzerland offers rooms and suites with Alpine mountain views. ${(roomTypes || []).filter((r: any) => r.view?.toLowerCase().includes('mountain') || r.view?.toLowerCase().includes('matterhorn') || r.view?.toLowerCase().includes('jungfrau') || r.view?.toLowerCase().includes('alps')).map((r: any) => r.name).join(', ')} all feature mountain views.`
            }
          }] : []),
        ]
      },
    ]
  }

  const faqs = [
    {
      q: `What room types does ${hotel.name} offer?`,
    },
    {
      q: `Does ${hotel.name} have suites?`,
      a: suites.length > 0
        ? `Yes. ${hotel.name} offers ${suites.length} suite categories including ${suites.slice(0, 3).map((s: any) => s.name).join(', ')}.`
        : `Yes. ${hotel.name} in ${hotel.location}, Switzerland offers luxury accommodation. Contact the hotel directly for suite availability.`
    },
    {
      q: `What is the most spacious room at ${hotel.name}?`,
      a: (() => {
        const largest = (roomTypes || []).filter((r: any) => r.size_sqm).sort((a: any, b: any) => b.size_sqm - a.size_sqm)[0]
        return largest
          ? `The most spacious accommodation at ${hotel.name} is the ${largest.name} at ${largest.size_sqm} m²${largest.view ? ` with ${largest.view}` : ''}.`
          : `${hotel.name} in ${hotel.location}, Switzerland offers a range of luxury rooms and suites. Contact the hotel directly for recommendations.`
      })()
    },
  ]

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* HEADER */}
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
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 300, color: text, margin: '0 0 0.5rem', lineHeight: 1.1 }}>
            Rooms &amp; Suites
          </h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: textMuted, margin: '0 0 1rem' }}>
            Part of <Link href={`/hotels/${hotelUrl}`} style={{ color: gold, textDecoration: 'none', fontWeight: 600 }}>{hotel.name}</Link>
          </p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, margin: '0 0 0.5rem', fontWeight: 300 }}>
            {roomTypes?.length || 0} room types · {minRate ? `From CHF ${minRate.toLocaleString()}/night` : ''}
            {suites.length > 0 ? ` · ${suites.length} suite categories` : ''}
            {hasLakeView ? ' · Lake view rooms available' : ''}
            {hasMountainView ? ' · Mountain view rooms available' : ''}
          </p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text, margin: '0 0 2rem', fontWeight: 500 }}>
            All rooms at {hotel.name} in {hotel.location}, Switzerland are bookable direct at the best available rate.
          </p>
          <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', textDecoration: 'none', borderRadius: 2 }}>
            Book Direct →
          </a>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem' }}>

        {/* NAV */}
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

        {/* ROOMS */}
        {roomTypes && roomTypes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {roomTypes.map((rt: any) => (
              <div key={rt.id} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: rt.images?.[0] ? '320px 1fr' : '1fr', minHeight: 220 }}>
                  {rt.images?.[0] && (
                    <div style={{ overflow: 'hidden' }}>
                      <img src={rt.images[0]} alt={`${rt.name} at ${hotel.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

        {/* FAQ */}
        <div style={{ marginTop: '4rem', paddingTop: '3rem', borderTop: `1px solid ${border}` }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 2rem' }}>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ padding: '1.25rem 0', borderBottom: `1px solid ${border}` }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: text, margin: '0 0 0.4rem' }}>{faq.q}</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* INTERNAL LINKS */}
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: `1px solid ${border}` }}>
          <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1rem' }}>Explore {hotel.name}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
            {[
              { label: `${hotel.name} Dining & Restaurants`, href: `/hotels/${hotelUrl}/dining` },
              { label: `${hotel.name} Spa & Wellness`, href: `/hotels/${hotelUrl}/spa` },
              { label: `${hotel.name} Experiences`, href: `/hotels/${hotelUrl}/experiences` },
              { label: `Luxury Hotels in ${hotel.location}`, href: `/destinations/${hotel.region?.toLowerCase().replace(/\s+/g, '-')}` },
              { label: `Best Luxury Hotels in Switzerland`, href: `/best/luxury-hotels-switzerland` },
            ].map(link => (
              <Link key={link.label} href={link.href} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: textMuted, textDecoration: 'none', border: `1px solid ${border}`, padding: '0.4rem 0.875rem', background: white, borderRadius: 2 }}>
                {link.label} →
              </Link>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={`/hotels/${hotelUrl}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, textDecoration: 'none' }}>← Back to {hotel.name}</Link>
          <Link href={`/hotels/${hotelUrl}/dining`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: gold, textDecoration: 'none' }}>Dining →</Link>
        </div>
      </div>
    </div>
  )
}