import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ViewTracker from '@/components/ViewTracker'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: hotel } = await supabase.from('hotels').select('name, location, slug').or(`slug.eq.${slug},id.eq.${slug}`).single()
  if (!hotel) return {}
  return {
    title: `${hotel.name} Events & Offers in ${hotel.location}, Switzerland | SwissNet Hotels`,
    description: `Discover current events, special offers and exclusive packages at ${hotel.name} in ${hotel.location}, Switzerland.`,
    alternates: {
      canonical: `https://swissnethotels.com/hotels/${hotel.slug || slug}/events`,
    },
  }
}

export default async function EventsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let { data: hotel } = await supabase.from('hotels').select('*').eq('slug', slug).single()
  if (!hotel) {
    const { data: hotelById } = await supabase.from('hotels').select('*').eq('id', slug).single()
    hotel = hotelById
  }
  if (!hotel || (!hotel.is_partner && !hotel.show_schema)) notFound()

  const today = new Date().toISOString().split('T')[0]

  const { data: eventsData } = await supabase
    .from('hotel_offers')
    .select('*')
    .eq('hotel_id', hotel.id)
    .eq('is_available', true)
    .eq('offer_type', 'temporary')
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('start_date', { ascending: true })

  const { data: dbFaqs } = await supabase
    .from('hotel_faq_suggestions')
    .select('question, answer')
    .eq('hotel_id', hotel.id)
    .eq('page_type', 'events')
    .eq('status', 'approved')
    .order('created_at')

  const events = eventsData || []
  const gold = '#C9A84C'
  const border = 'rgba(201,169,76,0.2)'
  const text = '#1a0e06'
  const textMuted = 'rgba(26,14,6,0.5)'
  const bg = '#F8F5EF'
  const white = '#FFFFFF'
  const hotelUrl = hotel.slug || hotel.id
  const pageUrl = `https://swissnethotels.com/hotels/${hotelUrl}/events`
  const hotelId = `https://swissnethotels.com/hotels/${hotelUrl}#hotel`
  const trackingUrl = `/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=website&campaign=events_page`

  const faqs = (dbFaqs || []).map((f: any) => ({ q: f.question, a: f.answer }))
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${hotel.name} Events & Offers | SwissNet Hotels`,
        inLanguage: ['en', 'fr', 'de'],
        isPartOf: { '@id': 'https://swissnethotels.com#website' },
        about: { '@id': hotelId },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://swissnethotels.com' },
          { '@type': 'ListItem', position: 2, name: 'Hotels', item: 'https://swissnethotels.com/hotels' },
          { '@type': 'ListItem', position: 3, name: hotel.name, item: `https://swissnethotels.com/hotels/${hotelUrl}` },
          { '@type': 'ListItem', position: 4, name: 'Events & Offers', item: pageUrl },
        ]
      },
      ...events.map((e: any) => ({
        '@type': e.start_date ? 'Event' : 'Offer',
        '@id': `${pageUrl}#event-${e.id}`,
        name: e.name,
        description: e.description || undefined,
        ...(e.start_date ? {
          startDate: e.start_date,
          endDate: e.end_date || undefined,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: hotel.name,
            address: { '@type': 'PostalAddress', addressLocality: hotel.location, addressCountry: 'CH' }
          },
          organizer: { '@id': hotelId },
          offers: e.price_from ? {
            '@type': 'Offer',
            price: e.price_from,
            priceCurrency: e.price_currency || 'CHF',
            availability: 'https://schema.org/InStock',
            validFrom: e.start_date,
            validThrough: e.end_date || undefined,
            url: e.cta_url || e.booking_url || hotel.direct_booking_url || undefined,
          } : undefined,
        } : {
          price: e.price_from || undefined,
          priceCurrency: e.price_currency || 'CHF',
          availability: 'https://schema.org/InStock',
          validFrom: e.valid_from || e.start_date || undefined,
          validThrough: e.valid_through || e.end_date || undefined,
          seller: { '@id': hotelId },
          url: e.cta_url || e.booking_url || hotel.direct_booking_url || undefined,
        }),
      })),
      ...(faqs.length > 0 ? [{
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }] : []),
    ]
  }

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <ViewTracker hotelId={hotel.id} hotelName={hotel.name} />

      {/* HEADER */}
      <div style={{ background: bg, padding: '6rem 2rem 3rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: textMuted, textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <Link href="/hotels" style={{ color: textMuted, textDecoration: 'none' }}>Hotels</Link>
            <span>›</span>
            <Link href={`/hotels/${hotelUrl}`} style={{ color: textMuted, textDecoration: 'none' }}>{hotel.name}</Link>
            <span>›</span>
            <span style={{ color: gold }}>Events & Offers</span>
          </div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: '0 0 0.75rem' }}>{hotel.name} · {hotel.location}</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 300, color: text, margin: '0 0 0.5rem', lineHeight: 1.1 }}>Events &amp; Offers</h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: textMuted, margin: '0 0 1rem' }}>
            Part of <Link href={`/hotels/${hotelUrl}`} style={{ color: gold, textDecoration: 'none', fontWeight: 600 }}>{hotel.name}</Link>
          </p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, margin: '0 0 2rem', fontWeight: 300 }}>
            {events.length > 0 ? `${events.length} active ${events.length === 1 ? 'event' : 'events & offers'}` : 'No current events'} · {hotel.location}, Switzerland
          </p>
          <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', textDecoration: 'none', borderRadius: 2 }}>
            Enquire Now →
          </a>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 2rem 4rem' }}>

        {/* NAV */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Overview', href: `/hotels/${hotelUrl}`, active: false },
            { label: 'Rooms', href: `/hotels/${hotelUrl}/rooms`, active: false },
            { label: 'Dining', href: `/hotels/${hotelUrl}/dining`, active: false },
            { label: 'Spa', href: `/hotels/${hotelUrl}/spa`, active: false },
            { label: 'Experiences', href: `/hotels/${hotelUrl}/experiences`, active: false },
            { label: 'Events', href: `/hotels/${hotelUrl}/events`, active: true },
          ].map(nav => (
            <Link key={nav.label} href={nav.href} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.5rem 1.25rem', textDecoration: 'none', borderRadius: 2, background: nav.active ? gold : white, color: nav.active ? '#1a0e06' : textMuted, border: `1px solid ${nav.active ? gold : border}` }}>
              {nav.label}
            </Link>
          ))}
        </div>

        {/* EVENTS */}
        {events.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '4rem' }}>
            {events.map((event: any) => {
              const hasImage = event.image_url
              const bookingLink = event.cta_url || event.booking_url || trackingUrl
              return (
                <div key={event.id} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: hasImage ? '340px 1fr' : '1fr', minHeight: 200 }}>
                    {hasImage && (
                      <div style={{ overflow: 'hidden' }}>
                        <img src={event.image_url} alt={`${event.name} at ${hotel.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ padding: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: text, margin: 0 }}>{event.name}</h2>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#16a34a', background: '#16a34a12', padding: '2px 8px', borderRadius: 10 }}>Live</span>
                          </div>
                          {(event.start_date || event.end_date) && (
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: gold, margin: '0 0 0.75rem', fontWeight: 600 }}>
                              {event.start_date && formatDate(event.start_date)}
                              {event.start_date && event.end_date && ' — '}
                              {event.end_date && formatDate(event.end_date)}
                            </p>
                          )}
                        </div>
                        {event.price_from && (
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1.5rem' }}>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, margin: '0 0 0.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>From</p>
                            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: gold, margin: 0, lineHeight: 1 }}>
                              {event.price_currency || 'CHF'} {Number(event.price_from).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, lineHeight: 1.8, margin: '0 0 1rem', fontWeight: 300 }}>{event.description}</p>
                      )}
                      {event.includes && event.includes.length > 0 && (
                        <div style={{ marginBottom: '1.25rem' }}>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, color: text, margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Includes</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {event.includes.map((item: string) => (
                              <span key={item} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, background: bg, border: `1px solid ${border}`, padding: '3px 10px', borderRadius: 2 }}>{item}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {event.conditions && (
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: textMuted, margin: '0 0 1.25rem', fontStyle: 'italic' }}>{event.conditions}</p>
                      )}
                      <a href={bookingLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.6rem 1.5rem', textDecoration: 'none', borderRadius: 2 }}>
                        Book Now →
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '4rem', textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: textMuted, margin: '0 0 1rem' }}>No current events or offers</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, margin: '0 0 1.5rem' }}>Check back soon for upcoming events, seasonal packages and exclusive offers.</p>
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', textDecoration: 'none', borderRadius: 2 }}>
              Contact Hotel →
            </a>
          </div>
        )}

        {/* FAQ */}
        {faqs.length > 0 && (
          <div style={{ paddingTop: '3rem', borderTop: `1px solid ${border}`, marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 2rem' }}>Frequently Asked Questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {faqs.map((faq, i) => (
                <div key={i} style={{ padding: '1.25rem 0', borderBottom: `1px solid ${border}` }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: text, margin: '0 0 0.4rem' }}>{faq.q}</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INTERNAL LINKS */}
        <div style={{ paddingTop: '2rem', borderTop: `1px solid ${border}` }}>
          <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1rem' }}>Explore {hotel.name}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
            {[
              { label: `${hotel.name} Rooms & Suites`, href: `/hotels/${hotelUrl}/rooms` },
              { label: `${hotel.name} Dining & Restaurants`, href: `/hotels/${hotelUrl}/dining` },
              { label: `${hotel.name} Spa & Wellness`, href: `/hotels/${hotelUrl}/spa` },
              { label: `${hotel.name} Experiences`, href: `/hotels/${hotelUrl}/experiences` },
              { label: `Luxury Hotels in ${hotel.location}`, href: `/destinations/${hotel.region?.toLowerCase().replace(/\s+/g, '-')}` },
            ].map(link => (
              <Link key={link.label} href={link.href} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: textMuted, textDecoration: 'none', border: `1px solid ${border}`, padding: '0.4rem 0.875rem', background: white, borderRadius: 2 }}>
                {link.label} →
              </Link>
            ))}
          </div>
        </div>

        <Link href={`/hotels/${hotelUrl}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, textDecoration: 'none' }}>← Back to {hotel.name}</Link>
      </div>
    </div>
  )
}