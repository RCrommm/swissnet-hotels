import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import LeadForm from '@/components/LeadForm'
import Link from 'next/link'
import ViewTracker from '@/components/ViewTracker'

function HotelSchema({ hotel, keywords, roomTypes, faqs }: { hotel: any; keywords: any[]; roomTypes: any[]; faqs: any[] }) {
  const allKeywords = [
    ...(hotel.amenities || []),
    ...(hotel.best_for || []),
    hotel.region, hotel.category, hotel.name,
    'luxury hotel Switzerland', 'direct booking Switzerland',
    ...keywords.map((k: any) => k.keyword),
    hotel.seo_keywords || '',
  ].filter(Boolean).join(', ')

  const hotelSchema = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: hotel.name,
    description: hotel.description,
    address: { '@type': 'PostalAddress', addressLocality: hotel.location, addressCountry: 'CH' },
    starRating: { '@type': 'Rating', ratingValue: hotel.rating },
    priceRange: `CHF ${hotel.nightly_rate_chf}+`,
    amenityFeature: hotel.amenities?.map((a: string) => ({ '@type': 'LocationFeatureSpecification', name: a, value: true })),
    url: `https://swissnethotels.com/hotels/${hotel.slug || hotel.id}`,
    image: hotel.images?.[0],
    keywords: allKeywords,
    offers: {
      '@type': 'Offer',
      price: hotel.nightly_rate_chf,
      priceCurrency: 'CHF',
      description: hotel.exclusive_offer || 'Direct booking rate',
      url: hotel.direct_booking_url,
    },
    containsPlace: roomTypes.filter(rt => rt.is_available).map(rt => ({
      '@type': 'HotelRoom',
      name: rt.name,
      description: rt.description || undefined,
      occupancy: { '@type': 'QuantitativeValue', minValue: 1, maxValue: rt.max_occupancy || 2 },
      bed: rt.bed_type ? { '@type': 'BedDetails', typeOfBed: rt.bed_type, numberOfBeds: 1 } : undefined,
      floorSize: rt.size_sqm ? { '@type': 'QuantitativeValue', value: rt.size_sqm, unitCode: 'MTK' } : undefined,
      amenityFeature: (rt.amenities || []).map((a: string) => ({ '@type': 'LocationFeatureSpecification', name: a, value: true })),
      offers: rt.base_rate_chf ? { '@type': 'Offer', price: rt.base_rate_chf, priceCurrency: 'CHF', url: hotel.direct_booking_url, availability: 'https://schema.org/InStock' } : undefined,
    })),
  }

  const faqSchema = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    }))
  } : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
    </>
  )
}

export default async function HotelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Try slug first, then id
let { data: hotel } = await supabase
  .from('hotels')
  .select('*')
  .eq('slug', slug)
  .single()

if (!hotel) {
  const { data: hotelById } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', slug)
    .single()
  hotel = hotelById
}
  if (!hotel) notFound()

  const { data: keywords } = await supabase.from('hotel_keywords').select('keyword').eq('hotel_id', hotel.id)
  const { data: roomRates } = await supabase.from('room_rates').select('*').eq('hotel_id', hotel.id).eq('is_current', true).order('rate_chf', { ascending: true })

  const showSchema = hotel.is_partner || hotel.show_schema

  const { data: roomTypes } = showSchema ? await supabase.from('room_types').select('*').eq('hotel_id', hotel.id).eq('is_available', true).order('sort_order', { ascending: true }) : { data: [] }
  const { data: spaData } = showSchema ? await supabase.from('hotel_spa').select('*').eq('hotel_id', hotel.id).eq('is_available', true) : { data: [] }
  const { data: restaurants } = showSchema ? await supabase.from('hotel_restaurants').select('*').eq('hotel_id', hotel.id).eq('is_available', true).order('sort_order', { ascending: true }) : { data: [] }
  const { data: offers } = showSchema ? await supabase.from('hotel_offers').select('*').eq('hotel_id', hotel.id).eq('is_available', true).order('sort_order', { ascending: true }) : { data: [] }
  const { data: content } = await supabase.from('hotel_content').select('*').eq('hotel_id', hotel.id).single()

  const faqs = content?.faqs || []
  const verdict = content?.verdict || null
  const bestForExtended = content?.best_for_extended || []
  const alternatives = content?.nearby_alternatives || []

  const gold = '#C9A84C'
  const border = 'rgba(201,169,110,0.25)'
  const text = '#3D2B1F'
  const textMuted = 'rgba(61,43,31,0.5)'
  const bg = '#F8F5EF'

  const hotelUrl = hotel.slug || hotel.id
  const trackingUrl = `/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=website&campaign=hotel_profile`

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <HotelSchema hotel={hotel} keywords={keywords || []} roomTypes={roomTypes || []} faqs={faqs} />
      <ViewTracker hotelId={hotel.id} hotelName={hotel.name} />

      {/* Hero */}
      <div style={{ position: 'relative', height: '60vh', overflow: 'hidden' }}>
        <img src={hotel.images[0] || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600'} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(61,43,31,0.7) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, margin: 0 }}>{hotel.category} · {hotel.region}</p>
            {hotel.is_partner && (
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', background: gold, color: '#1a0e06', padding: '3px 10px', borderRadius: 20 }}>
                ✦ SwissNet Partner
              </span>
            )}
          </div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 300, color: '#fff', margin: '0 0 0.5rem' }}>{hotel.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.8)', fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem' }}>
            <span>📍 {hotel.location}</span>
            <span>·</span>
            <span>★ {hotel.rating} / 5.0</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem' }}>
        <div>
          {hotel.exclusive_offer && (
            <div style={{ background: 'rgba(201,169,110,0.1)', borderLeft: '3px solid ' + gold, padding: '1rem 1.25rem', marginBottom: '2rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: gold, marginBottom: '0.25rem' }}>Exclusive SwissNet Offer</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: text, margin: 0, fontWeight: 500 }}>{hotel.exclusive_offer}</p>
            </div>
          )}

          {verdict && (
            <div style={{ background: '#fff', border: '1px solid ' + border, padding: '1.5rem', marginBottom: '2.5rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: gold, marginBottom: '0.75rem' }}>Our Verdict</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 300, color: text, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{verdict}</p>
            </div>
          )}

          {bestForExtended.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>Perfect For</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {bestForExtended.map((b: string) => (
                  <span key={b} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: text, border: '1px solid ' + border, padding: '0.35rem 0.875rem', background: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: gold }}>✦</span> {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {showSchema && offers && offers.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>Special Offers</h2>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {offers.map((offer: any) => (
                  <div key={offer.id} style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid ' + gold + '55', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', fontWeight: 600, color: text, margin: 0 }}>{offer.name}</p>
                        {offer.discount_percent && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, background: gold, color: '#1a0e06', padding: '2px 8px', borderRadius: 20 }}>-{offer.discount_percent}%</span>}
                      </div>
                      {offer.description && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, margin: '0 0 0.5rem', lineHeight: 1.6 }}>{offer.description}</p>}
                      {offer.includes?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {offer.includes.map((inc: string) => <span key={inc} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, background: bg, border: '1px solid ' + border, padding: '2px 8px' }}>✓ {inc}</span>)}
                        </div>
                      )}
                    </div>
                    {offer.price_from && (
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, margin: '0 0 0.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>From</p>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: gold, margin: 0 }}>CHF {Number(offer.price_from).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showSchema && roomTypes && roomTypes.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>Rooms &amp; Suites</h2>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {roomTypes.map((rt: any) => (
                  <div key={rt.id} style={{ background: '#fff', border: '1px solid ' + border, padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: rt.description ? '0.75rem' : 0 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: text, margin: 0 }}>{rt.name}</p>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: gold, border: '1px solid ' + border, padding: '2px 8px' }}>{rt.type_category || 'Room'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          {rt.size_sqm && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>⬜ {rt.size_sqm} m²</span>}
                          {rt.bed_type && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🛏 {rt.bed_type}</span>}
                          {rt.view && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🏔 {rt.view}</span>}
                          {rt.max_occupancy && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>👤 Max {rt.max_occupancy}</span>}
                        </div>
                      </div>
                      {rt.base_rate_chf && (
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, margin: '0 0 0.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>From</p>
                          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: gold, margin: 0 }}>CHF {rt.base_rate_chf.toLocaleString()}</p>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, margin: '0.1rem 0 0' }}>per night</p>
                        </div>
                      )}
                    </div>
                    {rt.description && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, lineHeight: 1.7, margin: '0.75rem 0 0', fontWeight: 300 }}>{rt.description}</p>}
                    {rt.amenities && rt.amenities.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                        {rt.amenities.slice(0, 6).map((a: string) => <span key={a} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, background: bg, border: '1px solid ' + border, padding: '2px 8px' }}>{a}</span>)}
                        {rt.amenities.length > 6 && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: gold }}>+{rt.amenities.length - 6} more</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showSchema && roomRates && roomRates.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>Room Types &amp; Rates</h2>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {roomRates.map((rate: any) => (
                  <div key={rate.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid ' + border, padding: '1rem 1.25rem' }}>
                    <div>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', fontWeight: 500, color: text, margin: 0 }}>{rate.room_type}</p>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: '0.2rem 0 0' }}>Per night · Direct booking</p>
                    </div>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: gold, margin: 0 }}>CHF {rate.rate_chf.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, marginTop: '0.75rem' }}>
                Rates updated daily · Last updated: {new Date(roomRates[0].scraped_at).toLocaleDateString('en-GB')}
              </p>
            </div>
          )}

          {showSchema && spaData && spaData.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>Spa &amp; Wellness</h2>
              {spaData.map((spa: any) => (
                <div key={spa.id} style={{ background: '#fff', border: '1px solid ' + border, padding: '1.25rem 1.5rem', marginBottom: '0.75rem' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: text, margin: '0 0 0.5rem' }}>{spa.name}</p>
                  {spa.description && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, lineHeight: 1.7, margin: '0 0 0.75rem', fontWeight: 300 }}>{spa.description}</p>}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: spa.facilities?.length ? '0.75rem' : 0 }}>
                    {spa.size_sqm && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>⬜ {spa.size_sqm} m²</span>}
                    {spa.pool && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🏊 Pool</span>}
                    {spa.sauna && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🧖 Sauna</span>}
                    {spa.hammam && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>♨️ Hammam</span>}
                    {spa.opening_hours && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🕐 {spa.opening_hours}</span>}
                    {spa.price_from && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: gold }}>From CHF {spa.price_from}</span>}
                  </div>
                  {spa.facilities?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {spa.facilities.map((f: string) => <span key={f} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, background: bg, border: '1px solid ' + border, padding: '2px 8px' }}>{f}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {showSchema && restaurants && restaurants.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>Dining</h2>
              {restaurants.map((r: any) => (
                <div key={r.id} style={{ background: '#fff', border: '1px solid ' + border, padding: '1.25rem 1.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: text, margin: 0 }}>{r.name}</p>
                      {r.michelin_stars > 0 && <span style={{ color: gold, fontSize: '0.75rem' }}>{'★'.repeat(r.michelin_stars)}</span>}
                      {r.cuisine_type && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: gold, border: '1px solid ' + border, padding: '2px 8px' }}>{r.cuisine_type}</span>}
                    </div>
                    {r.price_range && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>{r.price_range}</span>}
                  </div>
                  {r.description && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, lineHeight: 1.7, margin: '0 0 0.5rem', fontWeight: 300 }}>{r.description}</p>}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {r.opening_hours && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>🕐 {r.opening_hours}</span>}
                    {r.dress_code && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>👔 {r.dress_code}</span>}
                    {r.meal_types?.length > 0 && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>{r.meal_types.join(' · ')}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>About the Hotel</h2>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: textMuted, lineHeight: 1.8, fontWeight: 300 }}>{hotel.description}</p>
          </div>

          {hotel.amenities?.length > 0 && (
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
          )}

          {faqs.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>Frequently Asked Questions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {faqs.map((faq: any, i: number) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid ' + border, padding: '1.25rem 1.5rem' }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', fontWeight: 600, color: text, margin: '0 0 0.5rem' }}>
                      <span style={{ color: gold, marginRight: '0.5rem' }}>Q.</span>{faq.question}
                    </p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, lineHeight: 1.7, margin: 0, fontWeight: 300 }}>
                      <span style={{ color: gold, marginRight: '0.5rem' }}>A.</span>{faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alternatives.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>You Might Also Consider</h2>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {alternatives.map((alt: any, i: number) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid ' + border, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', fontWeight: 600, color: text, margin: '0 0 0.25rem' }}>{alt.name}</p>
                      {alt.reason && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, margin: 0 }}>{alt.reason}</p>}
                    </div>
                    {alt.url && (
                      <a href={alt.url} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: gold, textDecoration: 'none', whiteSpace: 'nowrap', marginLeft: '1rem' }}>View →</a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showSchema && hotel.is_partner && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>Explore {hotel.name}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {[
                  { label: 'For Honeymoon', href: `/hotels/${hotelUrl}/honeymoon` },
                  { label: 'For Wellness', href: `/hotels/${hotelUrl}/wellness` },
                  { label: 'For Skiing', href: `/hotels/${hotelUrl}/skiing` },
                  { label: 'For Families', href: `/hotels/${hotelUrl}/families` },
                  { label: 'For Business', href: `/hotels/${hotelUrl}/business` },
                ].map(link => (
                  <Link key={link.label} href={link.href} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: text, border: '1px solid ' + border, padding: '0.35rem 0.875rem', background: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: gold }}>✦</span> {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ background: '#fff', border: '1px solid ' + border, padding: '1.5rem', marginBottom: '1.5rem', position: 'sticky', top: '2rem' }}>
            {hotel.is_partner && (
              <div style={{ textAlign: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid ' + border }}>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', background: gold, color: '#1a0e06', padding: '4px 14px', borderRadius: 20 }}>
                  ✦ SwissNet Partner
                </span>
              </div>
            )}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid ' + border }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, margin: '0 0 0.5rem' }}>From</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 400, color: text, margin: 0 }}>CHF {hotel.nightly_rate_chf.toLocaleString()}</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: '0.25rem 0 0' }}>per night</p>
            </div>
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1rem', textAlign: 'center', textDecoration: 'none', marginBottom: '0.75rem' }}>
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