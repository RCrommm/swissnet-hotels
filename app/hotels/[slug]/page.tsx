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
    email: hotel.contact_email || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: hotel.location,
      addressCountry: 'CH',
      addressRegion: hotel.region,
    },
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
    sameAs: [hotel.tripadvisor_url, hotel.booking_url, hotel.google_maps_url, hotel.wikipedia_url, hotel.direct_booking_url].filter(Boolean),
    dateModified: hotel.updated_at ? new Date(hotel.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    containsPlace: (roomTypes || []).map((rt: any) => ({
      '@type': 'HotelRoom',
      name: rt.name,
      description: rt.description,
      occupancy: { '@type': 'QuantitativeValue', maxValue: rt.max_occupancy || 2 },
      bed: rt.bed_type ? { '@type': 'BedDetails', typeOfBed: rt.bed_type } : undefined,
      floorSize: rt.size_sqm ? { '@type': 'QuantitativeValue', value: rt.size_sqm, unitCode: 'MTK' } : undefined,
      offers: rt.base_rate_chf ? { '@type': 'Offer', price: rt.base_rate_chf, priceCurrency: 'CHF', url: hotel.direct_booking_url } : undefined,
    })),
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

  // Colors — clean minimal luxury
  const gold = '#C9A84C'
  const border = 'rgba(0,0,0,0.08)'
  const text = '#1a1a1a'
  const textMuted = 'rgba(26,26,26,0.5)'
  const bg = '#FAFAF8'
  const white = '#FFFFFF'
  const green = '#16a34a'

  const trackingUrl = hotel.is_partner
    ? `/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=website&campaign=hotel_profile`
    : null

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <SchemaMarkup hotel={hotel} keywords={keywords || []} roomTypes={roomTypes || []} faqs={faqs} restaurants={restaurants || []} spaData={spaData || []} />
      <ViewTracker hotelId={hotel.id} hotelName={hotel.name} />

      {/* HERO — full screen */}
      <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        <HeroCarousel images={hotel.images || []} name={hotel.name} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)' }} />

        {/* Breadcrumb */}
        <div style={{ position: 'absolute', top: '5rem', left: 0, right: 0, maxWidth: '1200px', margin: '0 auto', padding: '0 2.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <Link href="/hotels" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Hotels</Link>
            <span>›</span>
            <Link href={`/destinations/${hotel.region?.toLowerCase().replace(/\s+/g, '-')}`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{hotel.region}</Link>
            <span>›</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>{hotel.name}</span>
          </div>
        </div>

        {/* Hotel info */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxWidth: '1200px', margin: '0 auto', padding: '0 2.5rem 3.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ maxWidth: 700 }}>
              {hotel.is_partner && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(201,169,76,0.2)', border: '1px solid rgba(201,169,76,0.4)', padding: '4px 12px', borderRadius: 20, marginBottom: '1rem' }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: gold }}>✦ SwissNet Partner</span>
                </div>
              )}
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 300, color: white, margin: '0 0 0.75rem', lineHeight: 1.05, letterSpacing: '-0.02em' }}>{hotel.name}</h1>
              {verdict && (
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', margin: '0 0 1.25rem', lineHeight: 1.6, fontWeight: 300, maxWidth: 560 }}>{verdict}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.2rem' }}>
                  {Array.from({ length: hotel.star_classification || 5 }).map((_, i) => (
                    <span key={i} style={{ color: gold, fontSize: '0.7rem' }}>★</span>
                  ))}
                </div>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>📍 {hotel.location}, Switzerland</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>★ {hotel.rating} / 5</span>
              </div>
            </div>
            {hotel.is_partner && trackingUrl && (
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 0.4rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>From</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', color: white, margin: '0 0 0.75rem', lineHeight: 1 }}>CHF {hotel.nightly_rate_chf?.toLocaleString()}<span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>/night</span></p>
                <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', textDecoration: 'none' }}>
                  Check Availability →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '5rem 2.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '5rem', alignItems: 'start' }}>

          {/* LEFT */}
          <div>

            {/* OVERVIEW */}
            <section style={{ marginBottom: '4rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1rem' }}>Overview</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: text, lineHeight: 1.6, margin: '0 0 1.5rem', maxWidth: 600 }}>{hotel.description}</p>

              {/* Why stay here */}
              {hotel.amenities?.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 600, color: text, margin: '0 0 0.75rem', letterSpacing: '0.05em' }}>Why stay here</p>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {hotel.amenities.slice(0, 5).map((a: string) => (
                      <li key={a} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: gold, flexShrink: 0, display: 'inline-block' }} />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Best for */}
              {bestForExtended.length > 0 && (
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: textMuted, margin: '1.25rem 0 0' }}>
                  <span style={{ color: text, fontWeight: 600 }}>Best for: </span>
                  {bestForExtended.slice(0, 4).join(' · ')}
                </p>
              )}
            </section>

            {/* DIVIDER */}
            <div style={{ height: 1, background: border, marginBottom: '4rem' }} />

            {/* EXCLUSIVE OFFER */}
            {hotel.exclusive_offer && (
              <>
                <section style={{ marginBottom: '4rem' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1rem' }}>Exclusive Offer</p>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 300, color: text, lineHeight: 1.6, margin: 0 }}>{hotel.exclusive_offer}</p>
                </section>
                <div style={{ height: 1, background: border, marginBottom: '4rem' }} />
              </>
            )}

            {/* SPECIAL OFFERS */}
            {showSchema && offers && offers.length > 0 && (
              <>
                <section style={{ marginBottom: '4rem' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1.5rem' }}>Current Offers</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {offers.map((offer: any) => (
                      <div key={offer.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '1.5rem', borderBottom: `1px solid ${border}` }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 400, color: text, margin: 0 }}>{offer.name}</h3>
                            {offer.discount_percent && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, color: gold }}>−{offer.discount_percent}%</span>}
                          </div>
                          {offer.description && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, margin: 0, lineHeight: 1.7 }}>{offer.description}</p>}
                        </div>
                        {offer.price_from && (
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '2rem' }}>
                            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: gold, margin: 0 }}>CHF {Number(offer.price_from).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
                <div style={{ height: 1, background: border, marginBottom: '4rem' }} />
              </>
            )}

            {/* ROOMS */}
            {showSchema && roomTypes && roomTypes.length > 0 && (
              <>
                <section style={{ marginBottom: '4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: 0 }}>Rooms & Suites</p>
                    <Link href={`/hotels/${hotelUrl}/rooms`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: textMuted, textDecoration: 'none' }}>View all →</Link>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {roomTypes.slice(0, 4).map((rt: any, i: number) => (
                      <div key={rt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0', borderBottom: `1px solid ${border}` }}>
                        <div>
                          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: text, margin: '0 0 0.25rem' }}>{rt.name}</p>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: textMuted, margin: 0 }}>
                            {[rt.size_sqm && `${rt.size_sqm} m²`, rt.bed_type, rt.view].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        {rt.base_rate_chf && (
                          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: text, margin: 0, flexShrink: 0, marginLeft: '1rem' }}>
                            CHF {rt.base_rate_chf.toLocaleString()}<span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: textMuted }}>/night</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
                <div style={{ height: 1, background: border, marginBottom: '4rem' }} />
              </>
            )}

            {/* SPA */}
            {showSchema && spaData && spaData.length > 0 && (
              <>
                <section style={{ marginBottom: '4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: 0 }}>Spa & Wellness</p>
                    <Link href={`/hotels/${hotelUrl}/spa`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: textMuted, textDecoration: 'none' }}>View details →</Link>
                  </div>
                  {spaData.map((spa: any) => (
                    <div key={spa.id}>
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: text, margin: '0 0 0.5rem' }}>{spa.name}</p>
                      {spa.description && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, lineHeight: 1.8, margin: '0 0 0.75rem' }}>{spa.description}</p>}
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {[
                          spa.size_sqm && `${spa.size_sqm} m² spa facility`,
                          spa.pool && 'Swimming pool',
                          spa.sauna && 'Sauna',
                          spa.hammam && 'Hammam',
                          spa.price_from && `Treatments from CHF ${spa.price_from}`,
                        ].filter(Boolean).map((item: any) => (
                          <li key={item} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: gold, flexShrink: 0, display: 'inline-block' }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
                <div style={{ height: 1, background: border, marginBottom: '4rem' }} />
              </>
            )}

            {/* DINING */}
            {showSchema && restaurants && restaurants.length > 0 && (
              <>
                <section style={{ marginBottom: '4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: 0 }}>Dining</p>
                    <Link href={`/hotels/${hotelUrl}/dining`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: textMuted, textDecoration: 'none' }}>View all →</Link>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {restaurants.map((r: any) => (
                      <div key={r.id} style={{ paddingBottom: '1.5rem', borderBottom: `1px solid ${border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 400, color: text, margin: 0 }}>{r.name}</h3>
                            {r.michelin_stars > 0 && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: gold }}>{'★'.repeat(r.michelin_stars)} Michelin</span>}
                          </div>
                          {r.cuisine_type && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted }}>{r.cuisine_type}</span>}
                        </div>
                        {r.description && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, lineHeight: 1.7, margin: 0 }}>{r.description}</p>}
                      </div>
                    ))}
                  </div>
                </section>
                <div style={{ height: 1, background: border, marginBottom: '4rem' }} />
              </>
            )}

            {/* EXPERIENCES LINKS */}
            {hotel.is_partner && (
              <>
                <section style={{ marginBottom: '4rem' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1.5rem' }}>Experiences</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {[
                      { label: 'Spa & Wellness', href: `/hotels/${hotelUrl}/spa` },
                      { label: 'Dining & Restaurants', href: `/hotels/${hotelUrl}/dining` },
                      { label: 'Rooms & Suites', href: `/hotels/${hotelUrl}/rooms` },
                      { label: 'Activities & Experiences', href: `/hotels/${hotelUrl}/experiences` },
                    ].map(exp => (
                      <Link key={exp.label} href={exp.href} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: `1px solid ${border}`, textDecoration: 'none' }}>
                        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: text }}>{exp.label}</span>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: gold }}>→</span>
                      </Link>
                    ))}
                  </div>
                </section>
                <div style={{ height: 1, background: border, marginBottom: '4rem' }} />
              </>
            )}

            {/* NEARBY & RELATED — AI internal linking */}
{hotel.is_partner && (
  <>
    <section style={{ marginBottom: '4rem' }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1.5rem' }}>Explore Further</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {[
          { label: `Best luxury hotels in ${hotel.region}`, href: `/destinations/${hotel.region?.toLowerCase().replace(/\s+/g, '-')}` },
          { label: `Best luxury hotels in Switzerland`, href: `/best/luxury-hotels-switzerland` },
          hotel.category === 'Ski Resort' && { label: `Best ski hotels in Switzerland`, href: `/best/ski-hotels-switzerland` },
          hotel.category === 'Wellness Retreat' && { label: `Best wellness hotels in Switzerland`, href: `/best/wellness-hotels-switzerland` },
          { label: `${hotel.name} for Honeymoon`, href: `/hotels/${hotelUrl}/honeymoon` },
          { label: `${hotel.name} for Wellness`, href: `/hotels/${hotelUrl}/wellness` },
          { label: `${hotel.name} for Business`, href: `/hotels/${hotelUrl}/business` },
        ].filter(Boolean).map((link: any) => (
          <Link key={link.label} href={link.href} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: `1px solid ${border}`, textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted }}>{link.label}</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: gold }}>→</span>
          </Link>
        ))}
      </div>
    </section>
    <div style={{ height: 1, background: border, marginBottom: '4rem' }} />
  </>
)}

            {/* LOCATION */}
            <section style={{ marginBottom: '4rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1.5rem' }}>Location</p>
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, margin: '0 0 0.5rem' }}>📍 {hotel.location}, {hotel.region}, Switzerland</p>
              </div>
              <div style={{ borderRadius: 4, overflow: 'hidden', marginBottom: '1rem' }}>
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(hotel.name + ', ' + hotel.location + ', Switzerland')}&output=embed`}
                  width="100%"
                  height="280"
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                />
              </div>
            </section>
            <div style={{ height: 1, background: border, marginBottom: '4rem' }} />

            {/* FAQS */}
            {faqs.length > 0 && (
              <>
                <section style={{ marginBottom: '4rem' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1.5rem' }}>Frequently Asked Questions</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {faqs.map((faq: any, i: number) => (
                      <div key={i} style={{ padding: '1.25rem 0', borderBottom: `1px solid ${border}` }}>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: text, margin: '0 0 0.4rem' }}>{faq.question}</p>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, lineHeight: 1.7, margin: 0 }}>{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <div style={{ height: 1, background: border, marginBottom: '4rem' }} />
              </>
            )}

            {/* NEARBY ALTERNATIVES */}
            {alternatives.length > 0 && (
              <section style={{ marginBottom: '4rem' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1.5rem' }}>You Might Also Consider</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {alternatives.map((alt: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: `1px solid ${border}` }}>
                      <div>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: text, margin: '0 0 0.2rem' }}>{alt.name}</p>
                        {alt.reason && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: 0 }}>{alt.reason}</p>}
                      </div>
                      {alt.url && <a href={alt.url} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: gold, textDecoration: 'none' }}>View →</a>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <Link href="/hotels" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, textDecoration: 'none' }}>← All hotels</Link>
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ position: 'sticky', top: '2rem' }}>

            {/* PRICING CARD */}
            <div style={{ background: white, borderRadius: 4, padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
              {hotel.is_partner && (
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, margin: '0 0 1.25rem', paddingBottom: '1rem', borderBottom: `1px solid ${border}` }}>✦ SwissNet Partner Hotel</p>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, margin: '0 0 0.4rem' }}>Pricing</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.75rem', fontWeight: 300, color: text, margin: '0 0 0.25rem', lineHeight: 1 }}>
                  CHF {hotel.nightly_rate_chf?.toLocaleString()}
                </p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: textMuted, margin: 0 }}>per night · best available direct rate</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, margin: '0.4rem 0 0' }}>Price varies by dates and room type</p>
              </div>

              {hotel.is_partner && trackingUrl ? (
                <>
                  <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: text, color: white, fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '1rem', textAlign: 'center', textDecoration: 'none', marginBottom: '0.75rem' }}>
                    Check Availability →
                  </a>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: textMuted, textAlign: 'center', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
                    Direct booking · No fees · Best rate guaranteed
                  </p>
                  <div style={{ paddingTop: '1.25rem', borderTop: `1px solid ${border}` }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, color: textMuted, margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Booking options</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: '0 0 0.25rem' }}>✓ Direct — from CHF {hotel.nightly_rate_chf?.toLocaleString()}</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: '0 0 0.5rem' }}>○ OTAs — typically CHF {Math.round(hotel.nightly_rate_chf * 1.1).toLocaleString()}–{Math.round(hotel.nightly_rate_chf * 1.15).toLocaleString()}</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: textMuted, margin: 0, fontStyle: 'italic' }}>OTA range is an estimate based on typical commission rates</p>
                  </div>
                </>
              ) : (
                <div style={{ paddingTop: '1rem', borderTop: `1px solid ${border}` }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: 0 }}>Direct booking available for SwissNet partner hotels.</p>
                </div>
              )}
            </div>

            {/* CONTACT */}
            {hotel.is_partner && hotel.contact_email && (
              <div style={{ background: white, borderRadius: 4, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, margin: '0 0 0.75rem' }}>Contact</p>
                <a href={`mailto:${hotel.contact_email}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: gold, textDecoration: 'none', display: 'block', marginBottom: '0.5rem' }}>{hotel.contact_email}</a>
              </div>
            )}

            
          </div>
        </div>
      </div>
    </div>
  )
}