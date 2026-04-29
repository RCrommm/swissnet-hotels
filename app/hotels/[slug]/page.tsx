import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import LeadForm from '@/components/LeadForm'
import ViewTracker from '@/components/ViewTracker'
import HeroCarousel from '@/components/HeroCarousel'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: hotel } = await supabase.from('hotels').select('name, description, location, region, category, nightly_rate_chf').or(`slug.eq.${slug},id.eq.${slug}`).single()
  if (!hotel) return {}
  return {
    title: `${hotel.name} — Luxury Hotel in ${hotel.location} | SwissNet Hotels`,
    description: `${hotel.name} is a ${hotel.category} in ${hotel.location}, Switzerland. From CHF ${hotel.nightly_rate_chf}/night. Book direct for the best rate.`,
    openGraph: {
      title: `${hotel.name} | SwissNet Hotels`,
      description: hotel.description,
    }
  }
}

function SchemaMarkup({ hotel, keywords, roomTypes, faqs, restaurants, spaData }: any) {
  const hotelSchema = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    '@id': `https://swissnethotels.com/hotels/${hotel.slug || hotel.id}`,
    name: hotel.name,
    description: hotel.description,
    url: `https://swissnethotels.com/hotels/${hotel.slug || hotel.id}`,
    image: hotel.images?.[0],
    telephone: hotel.phone || undefined,
    email: hotel.contact_email || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: hotel.location,
      addressCountry: 'CH',
      addressRegion: hotel.region,
    },
    geo: hotel.latitude ? {
      '@type': 'GeoCoordinates',
      latitude: hotel.latitude,
      longitude: hotel.longitude,
    } : undefined,
    starRating: { '@type': 'Rating', ratingValue: hotel.star_classification || 5 },
    aggregateRating: hotel.rating ? {
      '@type': 'AggregateRating',
      ratingValue: hotel.rating,
      bestRating: 5,
      worstRating: 1,
      reviewCount: 50,
    } : undefined,
    priceRange: `CHF ${hotel.nightly_rate_chf}+`,
    amenityFeature: (hotel.amenities || []).map((a: string) => ({ '@type': 'LocationFeatureSpecification', name: a, value: true })),
    keywords: [...(hotel.amenities || []), ...(hotel.best_for || []), hotel.region, hotel.category, hotel.name, 'luxury hotel Switzerland', ...keywords.map((k: any) => k.keyword)].filter(Boolean).join(', '),
    containsPlace: (roomTypes || []).filter((rt: any) => rt.is_available).map((rt: any) => ({
      '@type': 'HotelRoom',
      name: rt.name,
      description: rt.description,
      occupancy: { '@type': 'QuantitativeValue', maxValue: rt.max_occupancy || 2 },
      bed: rt.bed_type ? { '@type': 'BedDetails', typeOfBed: rt.bed_type } : undefined,
      floorSize: rt.size_sqm ? { '@type': 'QuantitativeValue', value: rt.size_sqm, unitCode: 'MTK' } : undefined,
      offers: rt.base_rate_chf ? { '@type': 'Offer', price: rt.base_rate_chf, priceCurrency: 'CHF', url: hotel.direct_booking_url } : undefined,
    })),
    hasMap: `https://www.google.com/maps/search/${encodeURIComponent(hotel.name + ' ' + hotel.location)}`,
    sameAs: [
  hotel.tripadvisor_url,
  hotel.booking_url,
  hotel.google_maps_url,
  hotel.wikipedia_url,
  hotel.direct_booking_url,
  `https://www.google.com/search?q=${encodeURIComponent(hotel.name + ' ' + hotel.location)}`,
].filter(Boolean),
  }

  const faqSchema = faqs?.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f: any) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    }))
  } : null

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://swissnethotels.com' },
      { '@type': 'ListItem', position: 2, name: 'Hotels', item: 'https://swissnethotels.com/hotels' },
      { '@type': 'ListItem', position: 3, name: hotel.region, item: `https://swissnethotels.com/destinations/${hotel.region?.toLowerCase().replace(/\s+/g, '-')}` },
      { '@type': 'ListItem', position: 4, name: hotel.name, item: `https://swissnethotels.com/hotels/${hotel.slug || hotel.id}` },
    ]
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  )
}

export default async function HotelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let { data: hotel } = await supabase.from('hotels').select('*').eq('slug', slug).single()
  if (!hotel) {
    const { data: hotelById } = await supabase.from('hotels').select('*').eq('id', slug).single()
    hotel = hotelById
  }
  if (!hotel) notFound()

  const showSchema = hotel.is_partner || hotel.show_schema
  const hotelUrl = hotel.slug || hotel.id

  const [
    { data: keywords },
    { data: roomTypes },
    { data: spaData },
    { data: restaurants },
    { data: offers },
    { data: content },
  ] = await Promise.all([
    supabase.from('hotel_keywords').select('keyword').eq('hotel_id', hotel.id),
    showSchema ? supabase.from('room_types').select('*').eq('hotel_id', hotel.id).eq('is_available', true).order('sort_order', { ascending: true }) : { data: [] },
    showSchema ? supabase.from('hotel_spa').select('*').eq('hotel_id', hotel.id).eq('is_available', true) : { data: [] },
    showSchema ? supabase.from('hotel_restaurants').select('*').eq('hotel_id', hotel.id).eq('is_available', true).order('sort_order', { ascending: true }) : { data: [] },
    showSchema ? supabase.from('hotel_offers').select('*').eq('hotel_id', hotel.id).eq('is_available', true).order('sort_order', { ascending: true }) : { data: [] },
    supabase.from('hotel_content').select('*').eq('hotel_id', hotel.id).single(),
  ])

  const faqs = content?.faqs || []
  const verdict = content?.verdict || null
  const bestForExtended = content?.best_for_extended || []
  const alternatives = content?.nearby_alternatives || []

  const gold = '#C9A84C'
  const goldLight = 'rgba(201,169,76,0.1)'
  const border = 'rgba(201,169,76,0.2)'
  const text = '#1a0e06'
  const textMuted = 'rgba(26,14,6,0.5)'
  const bg = '#F8F5EF'
  const white = '#FFFFFF'
  const green = '#16a34a'

  const trackingUrl = hotel.is_partner
    ? `/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=website&campaign=hotel_profile`
    : null

  const HIGHLIGHTS = [
    hotel.amenities?.includes('Spa') && { icon: '✦', label: 'World-Class Spa', desc: 'Signature treatments and wellness rituals' },
    hotel.amenities?.includes('Fine Dining') && { icon: '◈', label: 'Fine Dining', desc: 'Exceptional cuisine and curated wine lists' },
    hotel.amenities?.includes('Ski Storage') && { icon: '▲', label: 'Ski Access', desc: 'Direct access to world-class slopes' },
    hotel.amenities?.includes('Pool') && { icon: '◇', label: 'Pool & Aqua', desc: 'Indoor and outdoor swimming facilities' },
    hotel.amenities?.includes('Fitness') && { icon: '◉', label: 'Fitness', desc: 'State-of-the-art fitness facilities' },
    hotel.amenities?.includes('Concierge') && { icon: '⊕', label: 'Concierge', desc: '24/7 dedicated concierge service' },
  ].filter(Boolean).slice(0, 4)

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <SchemaMarkup hotel={hotel} keywords={keywords || []} roomTypes={roomTypes || []} faqs={faqs} restaurants={restaurants || []} spaData={spaData || []} />
      <ViewTracker hotelId={hotel.id} hotelName={hotel.name} />

      {/* HERO */}
      <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        <HeroCarousel images={hotel.images || []} name={hotel.name} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,14,6,0.85) 0%, rgba(26,14,6,0.2) 50%, transparent 100%)' }} />

        {/* Breadcrumb */}
        <div style={{ position: 'absolute', top: '5rem', left: 0, right: 0, maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <Link href="/hotels" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Hotels</Link>
            <span>›</span>
            <Link href={`/destinations/${hotel.region?.toLowerCase().replace(/\s+/g, '-')}`} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>{hotel.region}</Link>
            <span>›</span>
            <span style={{ color: gold }}>{hotel.name}</span>
          </div>
        </div>

        {/* Hotel info overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              {/* Tags */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: gold }}>{hotel.category}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>{hotel.region}, Switzerland</span>
                {hotel.is_partner && (
                  <>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', background: gold, color: '#1a0e06', padding: '3px 10px', borderRadius: 20 }}>✦ SwissNet Partner</span>
                  </>
                )}
              </div>

              {/* Hotel name */}
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 300, color: white, margin: '0 0 1rem', lineHeight: 1.05, letterSpacing: '-0.02em' }}>{hotel.name}</h1>

              {/* Rating + location */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {Array.from({ length: hotel.star_classification || 5 }).map((_, i) => (
                    <span key={i} style={{ color: gold, fontSize: '0.75rem' }}>★</span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ color: gold, fontSize: '0.7rem' }}>★</span>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{hotel.rating}</span>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>/ 5.0</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>📍</span>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>{hotel.location}</span>
                </div>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>
                  From <span style={{ color: white, fontWeight: 600 }}>CHF {hotel.nightly_rate_chf?.toLocaleString()}</span>/night
                </div>
              </div>
            </div>

            {/* Hero CTA */}
            {hotel.is_partner && trackingUrl && (
              <div style={{ flexShrink: 0, marginLeft: '2rem' }}>
                <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1rem 2rem', textDecoration: 'none', borderRadius: 2, whiteSpace: 'nowrap' }}>
                  Book Direct →
                </a>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '0.5rem' }}>No fees · Best rate guaranteed</p>
              </div>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '1.5rem', right: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Scroll</span>
          <div style={{ width: '1px', height: '40px', background: `linear-gradient(to bottom, ${gold}, transparent)` }} />
        </div>
      </div>

      {/* STICKY BOOK DIRECT BAR */}
      {hotel.is_partner && trackingUrl && (
        <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(26,14,6,0.97)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${border}`, padding: '0.875rem 2rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: white, margin: 0, fontWeight: 300 }}>{hotel.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {Array.from({ length: hotel.star_classification || 5 }).map((_, i) => (
                  <span key={i} style={{ color: gold, fontSize: '0.6rem' }}>★</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 0.1rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>From</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: white, margin: 0 }}>CHF {hotel.nightly_rate_chf?.toLocaleString()}<span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>/night</span></p>
              </div>
              <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.75rem 1.75rem', textDecoration: 'none', borderRadius: 2, whiteSpace: 'nowrap' }}>
                Book Direct →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '4rem', alignItems: 'start' }}>

          {/* LEFT COLUMN */}
          <div>

            {/* VERDICT */}
            {verdict && (
              <div style={{ marginBottom: '3.5rem', paddingBottom: '3.5rem', borderBottom: `1px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: 0 }}>SwissNet Verdict</p>
                  <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
                </div>
                <blockquote style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: text, lineHeight: 1.6, margin: 0, fontStyle: 'italic', borderLeft: `3px solid ${gold}`, paddingLeft: '1.5rem' }}>
                  "{verdict}"
                </blockquote>
              </div>
            )}

            {/* HIGHLIGHTS */}
            {HIGHLIGHTS.length > 0 && (
              <div style={{ marginBottom: '3.5rem', paddingBottom: '3.5rem', borderBottom: `1px solid ${border}` }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 1.5rem' }}>Why Stay Here</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {HIGHLIGHTS.map((h: any, i: number) => (
                    <div key={i} style={{ background: white, border: `1px solid ${border}`, padding: '1.25rem 1.5rem', borderRadius: 8, display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <span style={{ color: gold, fontSize: '1rem', flexShrink: 0, marginTop: '0.1rem' }}>{h.icon}</span>
                      <div>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: text, margin: '0 0 0.25rem' }}>{h.label}</p>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: 0, lineHeight: 1.5 }}>{h.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EXCLUSIVE OFFER */}
            {hotel.exclusive_offer && (
              <div style={{ marginBottom: '3.5rem', paddingBottom: '3.5rem', borderBottom: `1px solid ${border}` }}>
                <div style={{ background: `linear-gradient(135deg, ${goldLight} 0%, rgba(201,169,76,0.05) 100%)`, border: `1px solid ${gold}55`, padding: '1.5rem 2rem', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{ color: gold }}>✦</span>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, margin: 0 }}>Exclusive SwissNet Offer</p>
                  </div>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 300, color: text, margin: 0, lineHeight: 1.5 }}>{hotel.exclusive_offer}</p>
                </div>
              </div>
            )}

            {/* ABOUT */}
            <div style={{ marginBottom: '3.5rem', paddingBottom: '3.5rem', borderBottom: `1px solid ${border}` }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 1.25rem' }}>About {hotel.name}</h2>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: textMuted, lineHeight: 1.9, fontWeight: 300, margin: 0 }}>{hotel.description}</p>
            </div>

            {/* PERFECT FOR */}
            {bestForExtended.length > 0 && (
              <div style={{ marginBottom: '3.5rem', paddingBottom: '3.5rem', borderBottom: `1px solid ${border}` }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 1.25rem' }}>Perfect For</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {bestForExtended.map((b: string) => (
                    <span key={b} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: text, border: `1px solid ${border}`, padding: '0.4rem 1rem', background: white, borderRadius: 2, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: gold }}>✦</span> {b}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* SPECIAL OFFERS */}
            {showSchema && offers && offers.length > 0 && (
              <div style={{ marginBottom: '3.5rem', paddingBottom: '3.5rem', borderBottom: `1px solid ${border}` }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 1.25rem' }}>Special Offers</h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {offers.map((offer: any) => (
                    <div key={offer.id} style={{ background: white, border: `1px solid ${border}`, padding: '1.25rem 1.5rem', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 600, color: text, margin: 0 }}>{offer.name}</p>
                          {offer.discount_percent && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, background: gold, color: '#1a0e06', padding: '2px 8px', borderRadius: 20 }}>-{offer.discount_percent}%</span>}
                        </div>
                        {offer.description && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, margin: 0, lineHeight: 1.6 }}>{offer.description}</p>}
                      </div>
                      {offer.price_from && (
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1.5rem' }}>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, margin: '0 0 0.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>From</p>
                          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: gold, margin: 0 }}>CHF {Number(offer.price_from).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ROOMS */}
            {showSchema && roomTypes && roomTypes.length > 0 && (
              <div style={{ marginBottom: '3.5rem', paddingBottom: '3.5rem', borderBottom: `1px solid ${border}` }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 1.25rem' }}>Rooms &amp; Suites</h2>
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  {roomTypes.map((rt: any) => (
                    <div key={rt.id} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: text, margin: 0 }}>{rt.name}</h3>
                              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: gold, border: `1px solid ${border}`, padding: '2px 8px', borderRadius: 2 }}>{rt.type_category || 'Room'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                              {rt.size_sqm && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>⬜ {rt.size_sqm} m²</span>}
                              {rt.bed_type && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🛏 {rt.bed_type}</span>}
                              {rt.view && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🏔 {rt.view}</span>}
                              {rt.max_occupancy && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>👤 Up to {rt.max_occupancy} guests</span>}
                            </div>
                          </div>
                          {rt.base_rate_chf && (
                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, margin: '0 0 0.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>From</p>
                              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', fontWeight: 400, color: gold, margin: 0, lineHeight: 1 }}>CHF {rt.base_rate_chf.toLocaleString()}</p>
                              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, margin: '0.2rem 0 0' }}>per night</p>
                            </div>
                          )}
                        </div>
                        {rt.description && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, lineHeight: 1.8, margin: '0.75rem 0 0', fontWeight: 300 }}>{rt.description}</p>}
                        {rt.amenities?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.875rem' }}>
                            {rt.amenities.slice(0, 6).map((a: string) => (
                              <span key={a} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, background: bg, border: `1px solid ${border}`, padding: '3px 10px', borderRadius: 2 }}>{a}</span>
                            ))}
                            {rt.amenities.length > 6 && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: gold }}>+{rt.amenities.length - 6} more</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SPA */}
            {showSchema && spaData && spaData.length > 0 && (
              <div style={{ marginBottom: '3.5rem', paddingBottom: '3.5rem', borderBottom: `1px solid ${border}` }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 1.25rem' }}>Spa &amp; Wellness</h2>
                {spaData.map((spa: any) => (
                  <div key={spa.id} style={{ background: white, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: 8, marginBottom: '1rem' }}>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: text, margin: '0 0 0.75rem' }}>{spa.name}</h3>
                    {spa.description && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, lineHeight: 1.8, margin: '0 0 1rem', fontWeight: 300 }}>{spa.description}</p>}
                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: spa.facilities?.length ? '0.875rem' : 0 }}>
                      {spa.size_sqm && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>⬜ {spa.size_sqm} m²</span>}
                      {spa.pool && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🏊 Pool</span>}
                      {spa.sauna && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🧖 Sauna</span>}
                      {spa.hammam && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>♨️ Hammam</span>}
                      {spa.opening_hours && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🕐 {spa.opening_hours}</span>}
                      {spa.price_from && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: gold, fontWeight: 600 }}>From CHF {spa.price_from}</span>}
                    </div>
                    {spa.facilities?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {spa.facilities.map((f: string) => <span key={f} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, background: bg, border: `1px solid ${border}`, padding: '3px 10px', borderRadius: 2 }}>{f}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* DINING */}
            {showSchema && restaurants && restaurants.length > 0 && (
              <div style={{ marginBottom: '3.5rem', paddingBottom: '3.5rem', borderBottom: `1px solid ${border}` }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 1.25rem' }}>Dining</h2>
                {restaurants.map((r: any) => (
                  <div key={r.id} style={{ background: white, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: 8, marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: text, margin: 0 }}>{r.name}</h3>
                        {r.michelin_stars > 0 && <span style={{ color: gold, fontSize: '0.8rem' }}>{'★'.repeat(r.michelin_stars)}</span>}
                        {r.cuisine_type && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: gold, border: `1px solid ${border}`, padding: '2px 8px', borderRadius: 2 }}>{r.cuisine_type}</span>}
                      </div>
                      {r.price_range && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>{r.price_range}</span>}
                    </div>
                    {r.description && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, lineHeight: 1.8, margin: '0 0 0.75rem', fontWeight: 300 }}>{r.description}</p>}
                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                      {r.opening_hours && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🕐 {r.opening_hours}</span>}
                      {r.dress_code && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>👔 {r.dress_code}</span>}
                      {r.meal_types?.length > 0 && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>{r.meal_types.join(' · ')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AMENITIES */}
            {hotel.amenities?.length > 0 && (
              <div style={{ marginBottom: '3.5rem', paddingBottom: '3.5rem', borderBottom: `1px solid ${border}` }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 1.25rem' }}>Amenities</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {hotel.amenities.map((a: string) => (
                    <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: text, padding: '0.4rem 0' }}>
                      <span style={{ color: gold, fontSize: '0.6rem' }}>✓</span> {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQS */}
            {faqs.length > 0 && (
              <div style={{ marginBottom: '3.5rem', paddingBottom: '3.5rem', borderBottom: `1px solid ${border}` }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 1.25rem' }}>Frequently Asked Questions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {faqs.map((faq: any, i: number) => (
                    <div key={i} style={{ background: white, border: `1px solid ${border}`, padding: '1.25rem 1.5rem', borderRadius: 8 }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', fontWeight: 600, color: text, margin: '0 0 0.5rem', display: 'flex', gap: '0.5rem' }}>
                        <span style={{ color: gold }}>Q.</span>{faq.question}
                      </p>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, lineHeight: 1.8, margin: 0, fontWeight: 300, display: 'flex', gap: '0.5rem' }}>
                        <span style={{ color: gold }}>A.</span>{faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* INTENT LINKS */}
            {hotel.is_partner && (
              <div style={{ marginBottom: '3.5rem', paddingBottom: '3.5rem', borderBottom: `1px solid ${border}` }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 1.25rem' }}>Explore {hotel.name}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {[
                    { label: 'For Honeymoon', href: `/hotels/${hotelUrl}/honeymoon`, icon: '♡' },
                    { label: 'For Wellness', href: `/hotels/${hotelUrl}/wellness`, icon: '✦' },
                    { label: 'For Skiing', href: `/hotels/${hotelUrl}/skiing`, icon: '▲' },
                    { label: 'For Families', href: `/hotels/${hotelUrl}/families`, icon: '◎' },
                    { label: 'For Business', href: `/hotels/${hotelUrl}/business`, icon: '◈' },
                  ].map(link => (
                    <Link key={link.label} href={link.href} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: text, border: `1px solid ${border}`, padding: '0.6rem 1rem', background: white, textDecoration: 'none', borderRadius: 4, transition: 'border-color 0.2s' }}>
                      <span style={{ color: gold }}>{link.icon}</span> {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* NEARBY ALTERNATIVES */}
            {alternatives.length > 0 && (
              <div style={{ marginBottom: '3.5rem', paddingBottom: '3.5rem', borderBottom: `1px solid ${border}` }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 1.25rem' }}>You Might Also Consider</h2>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {alternatives.map((alt: any, i: number) => (
                    <div key={i} style={{ background: white, border: `1px solid ${border}`, padding: '1rem 1.25rem', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', fontWeight: 600, color: text, margin: '0 0 0.25rem' }}>{alt.name}</p>
                        {alt.reason && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: textMuted, margin: 0 }}>{alt.reason}</p>}
                      </div>
                      {alt.url && (
                        <a href={alt.url} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: gold, textDecoration: 'none', whiteSpace: 'nowrap', marginLeft: '1rem', fontWeight: 600 }}>View →</a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LOCATION */}
            <div style={{ marginBottom: '3.5rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 1.25rem' }}>Location</h2>
              <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(hotel.name + ', ' + hotel.location + ', Switzerland')}&output=embed`}
                  width="100%"
                  height="300"
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                />
                <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${border}` }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, margin: 0 }}>
                    📍 {hotel.location}, {hotel.region}, Switzerland
                  </p>
                </div>
              </div>
            </div>

            <Link href="/hotels" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, textDecoration: 'none' }}>← Back to all hotels</Link>
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ position: 'sticky', top: '5rem' }}>

            {/* Booking card */}
            <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 8px 40px rgba(201,169,76,0.1)' }}>
              {hotel.is_partner && (
                <div style={{ background: gold, padding: '0.75rem 1.5rem', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1a0e06', margin: 0 }}>✦ SwissNet Partner Hotel</p>
                </div>
              )}
              <div style={{ padding: '1.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: `1px solid ${border}` }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, margin: '0 0 0.5rem' }}>Nightly Rate From</p>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 300, color: text, margin: '0 0 0.25rem', lineHeight: 1 }}>CHF {hotel.nightly_rate_chf?.toLocaleString()}</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, margin: 0 }}>per night · best rate guaranteed</p>
   {/* OTA Price Comparison */}
{hotel.is_partner && (
  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${border}` }}>
    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, margin: '0 0 0.75rem' }}>Price Comparison</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {[
        { name: 'Booking.com', color: '#003580', markup: 0.08 },
        { name: 'Expedia', color: '#FFC72C', textColor: '#000', markup: 0.05 },
        { name: 'Hotels.com', color: '#D8002E', markup: 0.10 },
      ].map(ota => {
        const otaPrice = Math.round((hotel.nightly_rate_chf * (1 + ota.markup)) / 5) * 5
        return (
          <div key={ota.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', background: bg, borderRadius: 4 }}>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 700, color: ota.color }}>{ota.name}</span>
          </div>
        )
      })}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(201,169,76,0.1)', border: `1px solid ${gold}55`, borderRadius: 4, marginTop: '0.25rem' }}>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 700, color: gold }}>✦ Direct</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: gold }}>CHF {hotel.nightly_rate_chf?.toLocaleString()}</span>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, background: green, color: white, padding: '2px 6px', borderRadius: 20 }}>BEST</span>
        </div>
      </div>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', color: textMuted, margin: '0.25rem 0 0', textAlign: 'center' }}>*Prices are estimates based on typical OTA commission rates</p>
    </div>
  </div>
)}
                </div>

                {hotel.is_partner && trackingUrl ? (
                  <>
                    <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1rem', textAlign: 'center', textDecoration: 'none', borderRadius: 2, marginBottom: '0.75rem' }}>
                      Book Direct →
                    </a>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: textMuted, textAlign: 'center', margin: '0 0 1.5rem' }}>No booking fees · Direct with the hotel</p>
                  </>
                ) : (
                  <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 4, padding: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, margin: '0 0 0.25rem' }}>Direct booking available</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: gold, margin: 0 }}>for SwissNet Partner hotels</p>
                  </div>
                )}

                {/* Trust signals */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {[
                    { icon: '✓', text: 'No fees' },
                    { icon: '✓', text: 'Best rate' },
                    { icon: '✓', text: 'Direct booking' },
                    { icon: '✓', text: 'Instant confirm' },
                  ].map(t => (
                    <div key={t.text} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: gold, fontSize: '0.65rem' }}>{t.icon}</span>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted }}>{t.text}</span>
                    </div>
                  ))}
                </div>

                {hotel.is_partner && hotel.contact_email && (
                  <div style={{ borderTop: `1px solid ${border}`, paddingTop: '1rem', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, margin: '0 0 0.25rem' }}>Questions? Contact directly:</p>
                    <a href={`mailto:${hotel.contact_email}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: gold, textDecoration: 'none' }}>{hotel.contact_email}</a>
                  </div>
                )}
              </div>
            </div>

            {/* Enquiry form */}
            <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ background: bg, padding: '1rem 1.5rem', borderBottom: `1px solid ${border}` }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: text, margin: 0 }}>Send an Enquiry</h3>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, margin: '0.25rem 0 0' }}>We'll connect you directly with {hotel.name}</p>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <LeadForm hotel={hotel} />
              </div>
            </div>

            {/* Star rating display */}
            <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '1.25rem 1.5rem', marginTop: '1.5rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
                {Array.from({ length: hotel.star_classification || 5 }).map((_, i) => (
                  <span key={i} style={{ color: gold, fontSize: '1rem' }}>★</span>
                ))}
              </div>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: text, margin: '0 0 0.25rem' }}>{hotel.rating} / 5.0</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, margin: 0 }}>Guest Rating</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}