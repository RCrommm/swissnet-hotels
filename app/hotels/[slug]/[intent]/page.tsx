import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const INTENTS: Record<string, {
  label: string
  description: (hotel: string, location: string) => string
  faqs: (hotel: string) => { q: string; a: string }[]
}> = {
  honeymoon: {
    label: 'Honeymoon',
    description: (h, l) => `Planning your honeymoon at ${h} in ${l}? Discover why this is one of Switzerland's most romantic hotels.`,
    faqs: (h) => [
      { q: `Is ${h} good for a honeymoon?`, a: `${h} is an exceptional honeymoon destination offering intimate luxury and stunning Swiss scenery.` },
      { q: `What romantic experiences does ${h} offer?`, a: `${h} offers private dining, couples spa treatments, champagne welcome and personalised butler service.` },
      { q: `What is the best room for a honeymoon at ${h}?`, a: `We recommend a suite with a view — many feature private balconies and soaking tubs with Alpine panoramas.` },
      { q: `When is the best time for a honeymoon at ${h}?`, a: `${h} is magical year-round. Winter offers cosy alpine romance, summer brings golden evenings and outdoor dining.` },
    ],
  },
  wellness: {
    label: 'Wellness & Spa',
    description: (h, l) => `Discover the wellness experience at ${h} in ${l} — Alpine spa rituals, thermal pools and expert treatments.`,
    faqs: (h) => [
      { q: `What spa facilities does ${h} have?`, a: `${h} features a full-service luxury spa with treatment rooms, pool and sauna, offering signature Alpine wellness treatments.` },
      { q: `Is ${h} good for a wellness retreat?`, a: `Yes — ${h} combines expert therapists, premium products and Alpine surroundings for a genuinely restorative experience.` },
      { q: `What treatments are available at ${h}?`, a: `${h} offers massages, facials, body wraps and signature Swiss Alpine treatments using local botanical ingredients.` },
      { q: `Can non-guests use the spa at ${h}?`, a: `Spa access is primarily for hotel guests. Contact ${h} directly to enquire about day spa availability.` },
    ],
  },
  skiing: {
    label: 'Skiing',
    description: (h, l) => `${h} in ${l} is one of Switzerland's finest ski hotels with expert concierge services and perfect alpine access.`,
    faqs: (h) => [
      { q: `Is ${h} a ski-in ski-out hotel?`, a: `${h} offers excellent ski access with dedicated storage, boot warming and ski concierge services.` },
      { q: `What ski services does ${h} offer?`, a: `${h} provides full ski concierge including equipment rental, lift passes, ski school bookings and après-ski recommendations.` },
      { q: `When is the best time to ski at ${h}?`, a: `The main season runs December to April, with peak conditions in January and February.` },
      { q: `Does ${h} have ski storage?`, a: `Yes — ${h} provides secure ski and boot storage with heated boot lockers and drying rooms.` },
    ],
  },
  families: {
    label: 'Families',
    description: (h, l) => `${h} in ${l} offers exceptional family facilities, spacious rooms and activities for all ages.`,
    faqs: (h) => [
      { q: `Is ${h} family friendly?`, a: `${h} warmly welcomes families with connecting rooms, family suites, children's menus and age-appropriate activities.` },
      { q: `What activities are there for children at ${h}?`, a: `${h} offers seasonal sports, guided excursions and dedicated children's programming.` },
      { q: `What family room options does ${h} have?`, a: `${h} offers connecting rooms and family suites with extra beds and cots available on request.` },
      { q: `Is ${h} good for a family ski holiday?`, a: `Yes — ${h} is an excellent base with easy ski school access and gentle beginner slopes.` },
    ],
  },
  business: {
    label: 'Business',
    description: (h, l) => `${h} in ${l} is one of Switzerland's premier business hotels with world-class meeting facilities.`,
    faqs: (h) => [
      { q: `Does ${h} have meeting rooms?`, a: `${h} offers professional meeting spaces with state-of-the-art technology and dedicated event coordination.` },
      { q: `Is ${h} convenient for business travel?`, a: `${h} has excellent transport connections, fast Wi-Fi and 24-hour concierge and room service.` },
      { q: `What business amenities does ${h} have?`, a: `${h} provides a business centre, high-speed internet, printing facilities and express laundry.` },
      { q: `Does ${h} offer corporate rates?`, a: `${h} offers corporate rates for regular business guests. Contact the hotel directly to discuss arrangements.` },
    ],
  },
}

export async function generateStaticParams() {
  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, slug')
    .eq('is_active', true)
    .eq('is_partner', true)

  const params = []
  for (const h of hotels || []) {
    for (const intent of Object.keys(INTENTS)) {
      params.push({ slug: (h as any).slug || h.id, intent })
    }
  }
  return params
}

export default async function IntentPage({ params }: { params: Promise<{ slug: string; intent: string }> }) {
  const { slug, intent } = await params
  const intentData = INTENTS[intent]
  if (!intentData) notFound()

  const { data: hotelData } = await supabase
    .from('hotels')
    .select('*')
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single()

  if (!hotelData || (!hotelData.is_partner && !hotelData.show_schema)) notFound()

  const { data: contentData } = await supabase
    .from('hotel_content')
    .select('verdict')
    .eq('hotel_id', hotelData.id)
    .single()

  const gold = '#C9A84C'
  const border = 'rgba(201,169,110,0.25)'
  const text = '#3D2B1F'
  const textMuted = 'rgba(61,43,31,0.5)'
  const bg = '#F8F5EF'
  const faqs = intentData.faqs(hotelData.name)
  const hotelUrl = (hotelData as any).slug || hotelData.id
  const trackingUrl = `/api/track?hotel_id=${hotelData.id}&hotel_name=${encodeURIComponent(hotelData.name)}&destination=${encodeURIComponent(hotelData.direct_booking_url)}&medium=website&campaign=intent_${intent}`

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
  }

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div style={{ position: 'relative', height: '45vh', overflow: 'hidden' }}>
        <img src={hotelData.images?.[0] || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600'} alt={hotelData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(61,43,31,0.8) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'inline-block', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 20, marginBottom: '0.75rem' }}>{intentData.label}</div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: '#fff', margin: '0 0 0.5rem', lineHeight: 1.2 }}>{hotelData.name}</h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', margin: 0 }}>{hotelData.location} · ★ {hotelData.rating} · From CHF {hotelData.nightly_rate_chf?.toLocaleString()}/night</p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem' }}>
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '2rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: textMuted, textDecoration: 'none' }}>Home</Link>
            <span>→</span>
            <Link href="/hotels" style={{ color: textMuted, textDecoration: 'none' }}>Hotels</Link>
            <span>→</span>
            <Link href={`/hotels/${hotelUrl}`} style={{ color: textMuted, textDecoration: 'none' }}>{hotelData.name}</Link>
            <span>→</span>
            <span style={{ color: text }}>{intentData.label}</span>
          </div>

          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', color: textMuted, lineHeight: 1.9, fontWeight: 300, marginBottom: '2rem' }}>
            {intentData.description(hotelData.name, hotelData.location)}
          </p>

          {contentData?.verdict && (
            <div style={{ background: '#fff', border: '1px solid ' + border, padding: '1.5rem', marginBottom: '2rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: gold, marginBottom: '0.75rem' }}>Our Verdict</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 300, color: text, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{contentData.verdict}</p>
            </div>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>About {hotelData.name}</h2>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: textMuted, lineHeight: 1.8, fontWeight: 300 }}>{hotelData.description}</p>
          </div>

          {hotelData.amenities?.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>Amenities</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {hotelData.amenities.map((a: string) => (
                  <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: text }}>
                    <span style={{ color: gold }}>✓</span> {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>{hotelData.name} for {intentData.label} — FAQs</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {faqs.map((faq, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid ' + border, padding: '1.25rem 1.5rem' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', fontWeight: 600, color: text, margin: '0 0 0.5rem' }}><span style={{ color: gold, marginRight: '0.5rem' }}>Q.</span>{faq.q}</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, lineHeight: 1.7, margin: 0, fontWeight: 300 }}><span style={{ color: gold, marginRight: '0.5rem' }}>A.</span>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>More About {hotelData.name}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {Object.entries(INTENTS).filter(([k]) => k !== intent).map(([k, v]) => (
                <Link key={k} href={`/hotels/${hotelUrl}/${k}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: text, border: '1px solid ' + border, padding: '0.35rem 0.875rem', background: '#fff', textDecoration: 'none' }}>
                  ✦ {hotelData.name} for {v.label}
                </Link>
              ))}
            </div>
          </div>

          <Link href={`/hotels/${hotelUrl}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, textDecoration: 'none' }}>← Back to {hotelData.name}</Link>
        </div>

        <div>
          <div style={{ background: '#fff', border: `1px solid ${gold}88`, padding: '1.5rem', position: 'sticky', top: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid ' + border }}>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', background: gold, color: '#1a0e06', padding: '4px 14px', borderRadius: 20 }}>✦ SwissNet Partner</span>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid ' + border }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, margin: '0 0 0.5rem' }}>From</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 400, color: text, margin: 0 }}>CHF {hotelData.nightly_rate_chf?.toLocaleString()}</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: '0.25rem 0 0' }}>per night</p>
            </div>
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1rem', textAlign: 'center', textDecoration: 'none', marginBottom: '0.75rem' }}>Book Direct →</a>
            <div style={{ textAlign: 'center' }}>
              <Link href={`/hotels/${hotelUrl}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: gold, textDecoration: 'none' }}>View full profile →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}