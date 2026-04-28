import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const INTENTS: Record<string, {
  label: string
  title: (hotel: string) => string
  description: (hotel: string, location: string) => string
  faqs: (hotel: string) => { q: string; a: string }[]
  schema_type: string
}> = {
  'honeymoon': {
    label: 'Honeymoon',
    title: (h) => `${h} for Honeymoon — Romantic Luxury in Switzerland`,
    description: (h, l) => `Planning your honeymoon at ${h} in ${l}? Discover why this is one of Switzerland's most romantic hotels — from private dining to spa treatments for two and breathtaking views.`,
    faqs: (h) => [
      { q: `Is ${h} good for a honeymoon?`, a: `${h} is an exceptional honeymoon destination, offering intimate luxury, world-class spa facilities and stunning Swiss scenery that creates the perfect romantic backdrop for newlyweds.` },
      { q: `What romantic experiences does ${h} offer?`, a: `${h} offers private dining experiences, couples spa treatments, champagne welcome amenities and personalised butler service to make your honeymoon unforgettable.` },
      { q: `What is the best room for a honeymoon at ${h}?`, a: `We recommend booking a suite or superior room with a view for your honeymoon — many feature private balconies, soaking tubs and stunning Alpine or lake panoramas.` },
      { q: `When is the best time for a honeymoon at ${h}?`, a: `${h} is magical year-round. Winter offers cosy alpine romance with snow-capped views, while summer brings long golden evenings and outdoor dining.` },
    ],
    schema_type: 'honeymoon'
  },
  'wellness': {
    label: 'Wellness & Spa',
    title: (h) => `${h} for Wellness & Spa — Alpine Wellbeing in Switzerland`,
    description: (h, l) => `Discover the wellness experience at ${h} in ${l}. From Alpine spa rituals to thermal pools and expert treatments, find out why this is one of Switzerland's premier wellness destinations.`,
    faqs: (h) => [
      { q: `What spa facilities does ${h} have?`, a: `${h} features a full-service luxury spa with treatment rooms, relaxation areas, pool and sauna facilities, offering a range of signature Alpine wellness treatments.` },
      { q: `Is ${h} good for a wellness retreat?`, a: `Yes — ${h} is one of Switzerland's finest wellness hotels, combining expert therapists, premium products and Alpine surroundings for a genuinely restorative experience.` },
      { q: `What treatments are available at ${h}?`, a: `${h} offers a comprehensive treatment menu including massages, facials, body wraps and signature Swiss Alpine treatments using local botanical ingredients.` },
      { q: `Can non-guests use the spa at ${h}?`, a: `Spa access is primarily reserved for hotel guests. We recommend contacting ${h} directly to enquire about day spa availability.` },
    ],
    schema_type: 'wellness'
  },
  'skiing': {
    label: 'Skiing',
    title: (h) => `${h} for Skiing — Luxury Ski Hotel Switzerland`,
    description: (h, l) => `${h} in ${l} is one of Switzerland's finest ski hotels. Discover ski-in/ski-out access, expert ski concierge services and the perfect alpine base for world-class skiing.`,
    faqs: (h) => [
      { q: `Is ${h} a ski-in ski-out hotel?`, a: `${h} offers excellent ski access with dedicated ski storage, boot warming facilities and ski concierge services to make your skiing experience seamless.` },
      { q: `What ski services does ${h} offer?`, a: `${h} provides a full ski concierge service including equipment rental arrangements, lift pass assistance, ski school bookings and après-ski recommendations.` },
      { q: `When is the best time to ski at ${h}?`, a: `The main ski season runs from December to April, with peak conditions typically in January and February. ${h} offers the perfect luxury base throughout the season.` },
      { q: `Does ${h} have ski storage?`, a: `Yes — ${h} provides secure ski and boot storage facilities, heated boot lockers and equipment drying rooms for guests.` },
    ],
    schema_type: 'skiing'
  },
  'families': {
    label: 'Families',
    title: (h) => `${h} for Families — Luxury Family Hotel Switzerland`,
    description: (h, l) => `Travelling with children? ${h} in ${l} offers exceptional family facilities, spacious family rooms and a wealth of activities to keep all ages entertained in the Swiss Alps.`,
    faqs: (h) => [
      { q: `Is ${h} family friendly?`, a: `${h} warmly welcomes families, offering spacious connecting rooms, family suites, children's menus and a range of activities suitable for all ages.` },
      { q: `What activities are there for children at ${h}?`, a: `${h} offers a variety of family activities including seasonal sports, guided excursions and dedicated children's programming to keep younger guests entertained.` },
      { q: `What family room options does ${h} have?`, a: `${h} offers connecting rooms and family suites that comfortably accommodate families, with extra beds and cots available on request.` },
      { q: `Is ${h} good for a family ski holiday?`, a: `Yes — ${h} is an excellent base for family skiing, with easy access to ski school facilities and gentle beginner slopes alongside more challenging runs.` },
    ],
    schema_type: 'families'
  },
  'business': {
    label: 'Business',
    title: (h) => `${h} for Business Travel — Luxury Business Hotel Switzerland`,
    description: (h, l) => `${h} in ${l} is one of Switzerland's premier business hotels. Discover world-class meeting facilities, fast connectivity and the impeccable service that discerning business travellers demand.`,
    faqs: (h) => [
      { q: `Does ${h} have meeting rooms?`, a: `${h} offers professional meeting and event spaces equipped with state-of-the-art technology, natural light and dedicated event coordination services.` },
      { q: `Is ${h} convenient for business travel?`, a: `${h} is ideally located for business travellers, with excellent transport connections, fast Wi-Fi throughout and 24-hour concierge and room service.` },
      { q: `What business amenities does ${h} have?`, a: `${h} provides a fully equipped business centre, high-speed internet, printing facilities, private dining for business lunches and express laundry services.` },
      { q: `Does ${h} offer corporate rates?`, a: `${h} offers competitive corporate rates for regular business guests. Contact the hotel directly or via SwissNet Hotels to discuss corporate arrangements.` },
    ],
    schema_type: 'business'
  },
}

export async function generateStaticParams() {
  const { data: hotels } = await supabase
    .from('hotels')
    .select('id')
    .eq('is_active', true)
    .eq('is_partner', true)

  const params = []
  for (const hotel of hotels || []) {
    for (const intent of Object.keys(INTENTS)) {
      params.push({ id: hotel.id, intent })
    }
  }
  return params
}

export default async function IntentPage({ params }: { params: Promise<{ id: string; intent: string }> }) {
  const { id, intent } = await params
  const intentData = INTENTS[intent]
  if (!intentData) notFound()

  const { data: hotel } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', id)
    .single()

  if (!hotel || (!hotel.is_partner && !hotel.show_schema)) notFound()

  const { data: content } = await supabase
    .from('hotel_content')
    .select('*')
    .eq('hotel_id', id)
    .single()

  const gold = '#C9A84C'
  const border = 'rgba(201,169,110,0.25)'
  const text = '#3D2B1F'
  const textMuted = 'rgba(61,43,31,0.5)'
  const bg = '#F8F5EF'

  const faqs = intentData.faqs(hotel.name)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://swissnethotels.com' },
      { '@type': 'ListItem', position: 2, name: 'Hotels', item: 'https://swissnethotels.com/hotels' },
      { '@type': 'ListItem', position: 3, name: hotel.name, item: `https://swissnethotels.com/hotels/${hotel.id}` },
      { '@type': 'ListItem', position: 4, name: intentData.label, item: `https://swissnethotels.com/hotels/${hotel.id}/${intent}` },
    ]
  }

  const trackingUrl = `/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=website&campaign=intent_${intent}`

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Hero */}
      <div style={{ position: 'relative', height: '45vh', overflow: 'hidden' }}>
        <img src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600'} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(61,43,31,0.8) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 20, marginBottom: '0.75rem' }}>
            {intentData.label}
          </div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: '#fff', margin: '0 0 0.5rem', lineHeight: 1.2 }}>
            {hotel.name}
          </h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
            {hotel.location} · ★ {hotel.rating} · From CHF {hotel.nightly_rate_chf?.toLocaleString()}/night
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem' }}>
        <div>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '2rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: textMuted, textDecoration: 'none' }}>Home</Link>
            <span>→</span>
            <Link href="/hotels" style={{ color: textMuted, textDecoration: 'none' }}>Hotels</Link>
            <span>→</span>
            <Link href={`/hotels/${hotel.id}`} style={{ color: textMuted, textDecoration: 'none' }}>{hotel.name}</Link>
            <span>→</span>
            <span style={{ color: text }}>{intentData.label}</span>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '2.5rem' }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', color: textMuted, lineHeight: 1.9, fontWeight: 300 }}>
              {intentData.description(hotel.name, hotel.location)}
            </p>
          </div>

          {/* Verdict if available */}
          {content?.verdict && (
            <div style={{ background: '#fff', border: '1px solid ' + border, padding: '1.5rem', marginBottom: '2.5rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: gold, marginBottom: '0.75rem' }}>Our Verdict</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 300, color: text, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{content.verdict}</p>
            </div>
          )}

          {/* About */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>About {hotel.name}</h2>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: textMuted, lineHeight: 1.8, fontWeight: 300 }}>{hotel.description}</p>
          </div>

          {/* Amenities */}
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

          {/* FAQs */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>
              {hotel.name} for {intentData.label} — FAQs
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {faqs.map((faq, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid ' + border, padding: '1.25rem 1.5rem' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', fontWeight: 600, color: text, margin: '0 0 0.5rem' }}>
                    <span style={{ color: gold, marginRight: '0.5rem' }}>Q.</span>{faq.q}
                  </p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, lineHeight: 1.7, margin: 0, fontWeight: 300 }}>
                    <span style={{ color: gold, marginRight: '0.5rem' }}>A.</span>{faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Other intents */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>
              More About {hotel.name}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {Object.entries(INTENTS).filter(([k]) => k !== intent).map(([k, v]) => (
                <Link key={k} href={`/hotels/${hotel.id}/${k}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: text, border: '1px solid ' + border, padding: '0.35rem 0.875rem', background: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ color: gold }}>✦</span> {hotel.name} for {v.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <Link href={`/hotels/${hotel.id}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, textDecoration: 'none' }}>
              ← Back to {hotel.name}
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ background: '#fff', border: `1px solid ${gold}88`, padding: '1.5rem', marginBottom: '1.5rem', position: 'sticky', top: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid ' + border }}>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', background: gold, color: '#1a0e06', padding: '4px 14px', borderRadius: 20 }}>
                ✦ SwissNet Partner
              </span>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid ' + border }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, margin: '0 0 0.5rem' }}>From</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 400, color: text, margin: 0 }}>CHF {hotel.nightly_rate_chf?.toLocaleString()}</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: '0.25rem 0 0' }}>per night</p>
            </div>
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1rem', textAlign: 'center', textDecoration: 'none', marginBottom: '0.75rem' }}>
              Book Direct →
            </a>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, textAlign: 'center', margin: '0 0 1.5rem' }}>No booking fees · Best rate guarantee</p>
            <div style={{ textAlign: 'center' }}>
              <Link href={`/hotels/${hotel.id}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: gold, textDecoration: 'none' }}>
                View full profile →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}