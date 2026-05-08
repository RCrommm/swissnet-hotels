import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: hotelMeta } = await supabase.from('hotels').select('name, location, slug').or(`slug.eq.${slug},id.eq.${slug}`).single()
  if (!hotelMeta) return {}
  return {
    title: `${hotelMeta.name} Spa & Wellness in ${hotelMeta.location}, Switzerland | SwissNet Hotels`,
    description: `Discover the spa and wellness facilities at ${hotelMeta.name} in ${hotelMeta.location}, Switzerland — treatments, pools, saunas and Alpine wellness programmes.`,
    alternates: {
      canonical: `https://swissnethotels.com/hotels/${hotelMeta.slug || slug}/spa`,
    },
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
  const pageUrl = `https://swissnethotels.com/hotels/${hotelUrl}/spa`
  const hotelId = `https://swissnethotels.com/hotels/${hotelUrl}#hotel`
  const trackingUrl = `/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=website&campaign=spa_page`

  const primarySpa = spaData?.[0]

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${hotel.name} Spa & Wellness | SwissNet Hotels`,
        isPartOf: { '@id': 'https://swissnethotels.com#website' },
        about: { '@id': hotelId },
        mainEntity: primarySpa ? { '@id': `${pageUrl}#spa-${primarySpa.id}` } : { '@id': hotelId },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://swissnethotels.com' },
          { '@type': 'ListItem', position: 2, name: 'Hotels', item: 'https://swissnethotels.com/hotels' },
          { '@type': 'ListItem', position: 3, name: hotel.name, item: `https://swissnethotels.com/hotels/${hotelUrl}` },
          { '@type': 'ListItem', position: 4, name: 'Spa & Wellness', item: pageUrl },
        ]
      },
      ...(spaData || []).map((spa: any) => ({
        '@type': ['HealthAndBeautyBusiness', 'LocalBusiness'],
        '@id': `${pageUrl}#spa-${spa.id}`,
        name: spa.name || `Spa at ${hotel.name}`,
        description: spa.description || undefined,
        url: pageUrl,
        containedInPlace: { '@id': hotelId },
        amenityFeature: [
          spa.pool && { '@type': 'LocationFeatureSpecification', name: 'Swimming pool', value: true },
          spa.sauna && { '@type': 'LocationFeatureSpecification', name: 'Sauna', value: true },
          spa.hammam && { '@type': 'LocationFeatureSpecification', name: 'Hammam', value: true },
          spa.size_sqm && { '@type': 'LocationFeatureSpecification', name: `${spa.size_sqm} m² spa facility`, value: true },
        ].filter(Boolean),
      })),
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: `Does ${hotel.name} have a spa?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: primarySpa
                ? `Yes. ${hotel.name} features ${primarySpa.name || 'a luxury spa'} in ${hotel.location}, Switzerland${primarySpa.size_sqm ? ` spanning ${primarySpa.size_sqm} m²` : ''}${primarySpa.pool ? ' with indoor and outdoor pools' : ''}${primarySpa.sauna ? ', sauna' : ''}${primarySpa.hammam ? ', hammam' : ''} and a full range of wellness treatments.`
                : `Yes. ${hotel.name} in ${hotel.location}, Switzerland features a luxury spa with wellness treatments and facilities.`
            }
          },
          {
            '@type': 'Question',
            name: `Can non-hotel guests use the spa at ${hotel.name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Spa access at ${hotel.name} in ${hotel.location}, Switzerland is primarily reserved for hotel guests. Day spa access for non-residents may be available — contact the hotel directly to confirm availability and book treatments.`
            }
          },
          {
            '@type': 'Question',
            name: `Is ${hotel.name} good for a wellness retreat?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Yes. ${hotel.name} is a luxury wellness hotel in Switzerland${primarySpa?.size_sqm ? ` with a ${primarySpa.size_sqm} m² spa` : ''}, offering a full range of treatments, wellness programmes and Alpine relaxation facilities in ${hotel.location}.`
            }
          },
        ]
      },
    ]
  }

  const faqs = [
    {
      q: `Does ${hotel.name} have a spa?`,
      a: primarySpa
        ? `Yes. ${hotel.name} features ${primarySpa.name || 'a luxury spa'} in ${hotel.location}, Switzerland${primarySpa.size_sqm ? ` spanning ${primarySpa.size_sqm} m²` : ''}${primarySpa.pool ? ' with indoor and outdoor pools' : ''}${primarySpa.sauna ? ', sauna' : ''}${primarySpa.hammam ? ', hammam' : ''} and a full range of wellness treatments.`
        : `Yes. ${hotel.name} in ${hotel.location}, Switzerland features a luxury spa with wellness treatments and facilities.`
    },
    {
      q: `Can non-hotel guests use the spa at ${hotel.name}?`,
      a: `Spa access at ${hotel.name} in ${hotel.location}, Switzerland is primarily reserved for hotel guests. Day spa access for non-residents may be available — contact the hotel directly to confirm availability and book treatments.`
    },
    {
      q: `Is ${hotel.name} good for a wellness retreat?`,
      a: `Yes. ${hotel.name} is a luxury wellness hotel in Switzerland${primarySpa?.size_sqm ? ` with a ${primarySpa.size_sqm} m² spa` : ''}, offering a full range of treatments, wellness programmes and Alpine relaxation facilities in ${hotel.location}.`
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
            <span style={{ color: gold }}>Spa & Wellness</span>
          </div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: '0 0 0.75rem' }}>{hotel.name} · {hotel.location}</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 300, color: text, margin: '0 0 0.5rem', lineHeight: 1.1 }}>Spa &amp; Wellness</h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: textMuted, margin: '0 0 1rem' }}>
            Part of <Link href={`/hotels/${hotelUrl}`} style={{ color: gold, textDecoration: 'none', fontWeight: 600 }}>{hotel.name}</Link>
          </p>
          {primarySpa && (
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, margin: '0 0 2rem', fontWeight: 300 }}>
              {primarySpa.name || 'Luxury Spa'}{primarySpa.size_sqm ? ` · ${primarySpa.size_sqm} m²` : ''}{primarySpa.pool ? ' · Indoor & outdoor pools' : ''}{primarySpa.sauna ? ' · Sauna' : ''}{primarySpa.hammam ? ' · Hammam' : ''}{primarySpa.price_from ? ` · Treatments from CHF ${primarySpa.price_from}` : ''}
            </p>
          )}
          {!primarySpa && (
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, margin: '0 0 2rem', fontWeight: 300 }}>
              Alpine wellness traditions · Signature treatments · World-class facilities
            </p>
          )}
          <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', textDecoration: 'none', borderRadius: 2 }}>
            Book a Treatment →
          </a>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem' }}>

        {/* NAV */}
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

        {/* SPA CONTENT */}
        {spaData && spaData.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {spaData.map((spa: any) => (
              <div key={spa.id} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: spa.images?.[0] ? '320px 1fr' : '1fr', minHeight: 200 }}>
                  {spa.images?.[0] && (
                    <div style={{ overflow: 'hidden' }}>
                      <img src={spa.images[0]} alt={`${spa.name} at ${hotel.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                    {spa.treatments && (
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: textMuted, margin: '0 0 1rem' }}>
                        <span style={{ color: text, fontWeight: 600 }}>Treatments: </span>{spa.treatments}
                      </p>
                    )}
                    {spa.wellness_philosophy && (
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: textMuted, margin: '0 0 1rem', fontStyle: 'italic' }}>
                        {spa.wellness_philosophy}
                      </p>
                    )}
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
              { label: `${hotel.name} Rooms & Suites`, href: `/hotels/${hotelUrl}/rooms` },
              { label: `${hotel.name} Experiences`, href: `/hotels/${hotelUrl}/experiences` },
              { label: `Best Spa Hotels in Switzerland`, href: `/best/spa-hotels-switzerland` },
              { label: `Luxury Hotels in ${hotel.location}`, href: `/destinations/${hotel.region?.toLowerCase().replace(/\s+/g, '-')}` },
            ].map(link => (
              <Link key={link.label} href={link.href} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: textMuted, textDecoration: 'none', border: `1px solid ${border}`, padding: '0.4rem 0.875rem', background: white, borderRadius: 2 }}>
                {link.label} →
              </Link>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={`/hotels/${hotelUrl}/dining`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, textDecoration: 'none' }}>← Dining</Link>
          <Link href={`/hotels/${hotelUrl}/experiences`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: gold, textDecoration: 'none' }}>Experiences →</Link>
        </div>
      </div>
    </div>
  )
}