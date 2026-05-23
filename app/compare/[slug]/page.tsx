import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 3600

export async function generateStaticParams() {
  const { data: partners } = await supabase
    .from('hotels')
    .select('slug, name, region')
    .eq('is_active', true)
    .eq('is_partner', true)
    .not('slug', 'is', null)

  const { data: allHotels } = await supabase
    .from('hotels')
    .select('slug, name, region')
    .eq('is_active', true)
    .not('slug', 'is', null)

  if (!partners || !allHotels) return []

  const pairs = new Set<string>()

  for (const partner of partners) {
    const sameRegion = allHotels
      .filter(h => h.region === partner.region && h.slug !== partner.slug)
      .slice(0, 3)

    for (const other of sameRegion) {
      pairs.add(`${partner.slug}-vs-${other.slug}`)
    }
  }

  return Array.from(pairs).map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const parts = slug.split('-vs-')
  if (parts.length !== 2) return {}
  const { data: allHotels } = await supabase.from('hotels').select('name, location, slug').eq('is_active', true)
  if (!allHotels) return {}
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
  const hotelA = allHotels.find(h => (h as any).slug === parts[0]) || allHotels.find(h => normalize(h.name) === parts[0])
  const hotelB = allHotels.find(h => (h as any).slug === parts[1]) || allHotels.find(h => normalize(h.name) === parts[1])
  if (!hotelA || !hotelB) return {}
  return {
    title: `${hotelA.name} vs ${hotelB.name} — Which to Choose? | SwissNet Hotels`,
    description: `Detailed comparison of ${hotelA.name} and ${hotelB.name}. Rooms, spa, dining, pricing and expert verdict to help you choose the right luxury hotel in Switzerland.`,
    alternates: { canonical: `https://swissnethotels.com/compare/${slug}` },
    openGraph: {
      title: `${hotelA.name} vs ${hotelB.name} | SwissNet Hotels`,
      description: `Side-by-side comparison of two of Switzerland's finest luxury hotels — with expert verdict and direct booking links.`,
    }
  }
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const parts = slug.split('-vs-')
  if (parts.length !== 2) notFound()
  const [slugA, slugB] = parts

  const { data: allHotels } = await supabase.from('hotels').select('*').eq('is_active', true)
  if (!allHotels) notFound()

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
  const hotelA = allHotels.find(h => (h as any).slug === slugA) || allHotels.find(h => normalize(h.name) === slugA)
  const hotelB = allHotels.find(h => (h as any).slug === slugB) || allHotels.find(h => normalize(h.name) === slugB)
  if (!hotelA || !hotelB) notFound()

  // Fetch content for both hotels (FAQs, verdict)
  const [{ data: contentA }, { data: contentB }] = await Promise.all([
    supabase.from('hotel_content').select('verdict, faqs').eq('hotel_id', hotelA.id).single(),
    supabase.from('hotel_content').select('verdict, faqs').eq('hotel_id', hotelB.id).single(),
  ])

  const gold = '#C9A84C'
  const border = 'rgba(201,169,110,0.25)'
  const text = '#3D2B1F'
  const textMuted = 'rgba(61,43,31,0.5)'
  const bg = '#F8F5EF'
  const white = '#FFFFFF'

  const pageUrl = `https://swissnethotels.com/compare/${slug}`
  const regionSlug = hotelA.region?.toLowerCase().replace(/\s+/g, '-')

  const criteria = [
    { label: 'Location', a: hotelA.location, b: hotelB.location },
    { label: 'Category', a: hotelA.category, b: hotelB.category },
    { label: 'Stars', a: '★'.repeat(hotelA.star_classification || 5), b: '★'.repeat(hotelB.star_classification || 5) },
    { label: 'From', a: `CHF ${hotelA.nightly_rate_chf?.toLocaleString()}/night`, b: `CHF ${hotelB.nightly_rate_chf?.toLocaleString()}/night` },
    { label: 'Best For', a: hotelA.best_for?.join(', ') || '—', b: hotelB.best_for?.join(', ') || '—' },
    { label: 'Top Amenities', a: hotelA.amenities?.slice(0, 3).join(', ') || '—', b: hotelB.amenities?.slice(0, 3).join(', ') || '—' },
  ]

  const trackingUrlA = hotelA.is_partner && hotelA.direct_booking_url
    ? `/api/track?hotel_id=${hotelA.id}&hotel_name=${encodeURIComponent(hotelA.name)}&destination=${encodeURIComponent(hotelA.direct_booking_url)}&medium=website&campaign=compare`
    : hotelA.direct_booking_url
  const trackingUrlB = hotelB.is_partner && hotelB.direct_booking_url
    ? `/api/track?hotel_id=${hotelB.id}&hotel_name=${encodeURIComponent(hotelB.name)}&destination=${encodeURIComponent(hotelB.direct_booking_url)}&medium=website&campaign=compare`
    : hotelB.direct_booking_url

  // Related comparisons — same region hotels
  const relatedHotels = allHotels.filter(h => h.id !== hotelA.id && h.id !== hotelB.id && h.region === hotelA.region).slice(0, 4)

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${hotelA.name} vs ${hotelB.name} | SwissNet Hotels`,
        description: `Detailed comparison of ${hotelA.name} and ${hotelB.name}, two of Switzerland's finest luxury hotels.`,
        isPartOf: { '@id': 'https://swissnethotels.com#website' },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://swissnethotels.com' },
          { '@type': 'ListItem', position: 2, name: 'Hotels', item: 'https://swissnethotels.com/hotels' },
          { '@type': 'ListItem', position: 3, name: 'Compare', item: 'https://swissnethotels.com/compare' },
          { '@type': 'ListItem', position: 4, name: `${hotelA.name} vs ${hotelB.name}`, item: pageUrl },
        ]
      },
      {
        '@type': 'ItemList',
        name: `${hotelA.name} vs ${hotelB.name} — Comparison`,
        description: `Detailed comparison of ${hotelA.name} and ${hotelB.name}.`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, item: { '@type': 'Hotel', '@id': `https://swissnethotels.com/hotels/${hotelA.slug || hotelA.id}#hotel`, name: hotelA.name, url: `https://swissnethotels.com/hotels/${hotelA.slug || hotelA.id}`, priceRange: `CHF ${hotelA.nightly_rate_chf}+`, starRating: { '@type': 'Rating', ratingValue: hotelA.star_classification || 5 }, address: { '@type': 'PostalAddress', addressLocality: hotelA.location, addressCountry: 'CH' } } },
          { '@type': 'ListItem', position: 2, item: { '@type': 'Hotel', '@id': `https://swissnethotels.com/hotels/${hotelB.slug || hotelB.id}#hotel`, name: hotelB.name, url: `https://swissnethotels.com/hotels/${hotelB.slug || hotelB.id}`, priceRange: `CHF ${hotelB.nightly_rate_chf}+`, starRating: { '@type': 'Rating', ratingValue: hotelB.star_classification || 5 }, address: { '@type': 'PostalAddress', addressLocality: hotelB.location, addressCountry: 'CH' } } },
        ]
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: `What is the difference between ${hotelA.name} and ${hotelB.name}?`, acceptedAnswer: { '@type': 'Answer', text: `${hotelA.name} is a ${hotelA.star_classification || 5}-star hotel in ${hotelA.location} from CHF ${hotelA.nightly_rate_chf}/night, best for ${hotelA.best_for?.join(', ') || 'luxury travelers'}. ${hotelB.name} is a ${hotelB.star_classification || 5}-star hotel in ${hotelB.location} from CHF ${hotelB.nightly_rate_chf}/night, best for ${hotelB.best_for?.join(', ') || 'luxury travelers'}.` } },
          { '@type': 'Question', name: `Which is more expensive, ${hotelA.name} or ${hotelB.name}?`, acceptedAnswer: { '@type': 'Answer', text: `${hotelA.name} starts from CHF ${hotelA.nightly_rate_chf}/night. ${hotelB.name} starts from CHF ${hotelB.nightly_rate_chf}/night. Prices vary by season, room type and dates.` } },
          { '@type': 'Question', name: `Which hotel is better for couples — ${hotelA.name} or ${hotelB.name}?`, acceptedAnswer: { '@type': 'Answer', text: `Both are strong choices for couples. ${hotelA.name} offers ${hotelA.amenities?.slice(0, 2).join(' and ') || 'luxury amenities'} while ${hotelB.name} offers ${hotelB.amenities?.slice(0, 2).join(' and ') || 'luxury amenities'}. The best choice depends on your preferred setting and travel style.` } },
        ]
      }
    ]
  }

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Header */}
      <div style={{ background: '#492816', padding: '5rem 2rem 3rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <Link href="/hotels" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Hotels</Link>
            <span>›</span>
            <span style={{ color: gold }}>Compare</span>
          </div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, marginBottom: '1rem' }}>Hotel Comparison · {hotelA.region}</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 300, color: '#fff', margin: '0 0 0.75rem', lineHeight: 1.2 }}>
            {hotelA.name} <span style={{ color: gold }}>vs</span> {hotelB.name}
          </h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            {hotelA.location} · {hotelA.category} · CHF {hotelA.nightly_rate_chf?.toLocaleString()}/night &nbsp;|&nbsp; {hotelB.location} · {hotelB.category} · CHF {hotelB.nightly_rate_chf?.toLocaleString()}/night
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '3rem', alignItems: 'start' }}>
          <div>

            {/* Side by side cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
              {[hotelA, hotelB].map((hotel, i) => (
                <div key={hotel.id} style={{ background: white, border: hotel.is_partner ? `2px solid ${gold}` : `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                    <img src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700, background: i === 0 ? gold : '#3D2B1F', color: '#fff', padding: '3px 10px', borderRadius: 20 }}>
                        {i === 0 ? 'Hotel A' : 'Hotel B'}
                      </span>
                    </div>
                    {hotel.is_partner && (
                      <div style={{ position: 'absolute', top: 12, right: 12 }}>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700, background: gold, color: '#1a0e06', padding: '3px 10px', borderRadius: 20 }}>✦ Partner</span>
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
                      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 300, color: '#fff', margin: '0 0 0.25rem' }}>{hotel.name}</h2>
                      <div style={{ display: 'flex', gap: '0.15rem' }}>
                        {Array.from({ length: hotel.star_classification || 5 }).map((_, si) => (
                          <span key={si} style={{ color: gold, fontSize: '0.55rem' }}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, lineHeight: 1.7, margin: '0 0 0.75rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                      {i === 0 ? (contentA?.verdict || hotel.description) : (contentB?.verdict || hotel.description)}
                    </p>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: gold, margin: '0 0 1rem' }}>
                      From CHF {hotel.nightly_rate_chf?.toLocaleString()}<span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted }}>/night</span>
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link href={`/hotels/${hotel.slug || hotel.id}`} style={{ flex: 1, display: 'block', textAlign: 'center', border: `1px solid ${border}`, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: text, padding: '0.6rem', textDecoration: 'none', borderRadius: 4 }}>
                        View Profile
                      </Link>
                      {(i === 0 ? trackingUrlA : trackingUrlB) && (
                        <a href={(i === 0 ? trackingUrlA : trackingUrlB)!} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'block', textAlign: 'center', background: gold, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a0e06', padding: '0.6rem', textDecoration: 'none', borderRadius: 4 }}>
                          Official Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Comparison table */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, marginBottom: '1.5rem' }}>
                Side by Side Comparison
              </h2>
              <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F2EAE0' }}>
                      <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, width: '25%' }}>Criteria</th>
                      <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: gold }}>{hotelA.name}</th>
                      <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: text }}>{hotelB.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criteria.map((row, i) => (
                      <tr key={row.label} style={{ background: i % 2 === 0 ? white : bg, borderTop: `1px solid ${border}` }}>
                        <td style={{ padding: '1rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{row.label}</td>
                        <td style={{ padding: '1rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: text }}>{row.a}</td>
                        <td style={{ padding: '1rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: text }}>{row.b}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Who should choose which */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, marginBottom: '1.5rem' }}>
                Which Hotel is Right for You?
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {[hotelA, hotelB].map((hotel, i) => (
                  <div key={hotel.id} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '1.5rem' }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, margin: '0 0 0.75rem' }}>Choose {hotel.name} if…</p>
<div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
  {(hotel.best_for || []).slice(0, 3).map((b: string) => (
    <div key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
      <span style={{ color: gold, flexShrink: 0, marginTop: '0.1rem' }}>✦</span>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text, lineHeight: 1.5 }}>{b} is your priority</span>
    </div>
  ))}
  {hotel.has_spa && (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
      <span style={{ color: gold, flexShrink: 0, marginTop: '0.1rem' }}>✦</span>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text, lineHeight: 1.5 }}>An on-site spa is important to you</span>
    </div>
  )}
  {hotel.has_michelin_restaurant && (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
      <span style={{ color: gold, flexShrink: 0, marginTop: '0.1rem' }}>✦</span>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text, lineHeight: 1.5 }}>Michelin-starred dining is on your list</span>
    </div>
  )}
  {hotel.ski_in_ski_out && (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
      <span style={{ color: gold, flexShrink: 0, marginTop: '0.1rem' }}>✦</span>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text, lineHeight: 1.5 }}>Ski-in ski-out access is a requirement</span>
    </div>
  )}
  {hotel.is_partner && (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
      <span style={{ color: gold, flexShrink: 0, marginTop: '0.1rem' }}>✦</span>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text, lineHeight: 1.5 }}>You want to book direct with the best available rate</span>
    </div>
  )}
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
    <span style={{ color: gold, flexShrink: 0, marginTop: '0.1rem' }}>✦</span>
    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text, lineHeight: 1.5 }}>You prefer {hotel.category?.toLowerCase() || 'this style of hotel'} over the alternative</span>
  </div>
</div>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, marginBottom: '1.5rem' }}>
                Frequently Asked Questions
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  {
  q: `What is the difference between ${hotelA.name} and ${hotelB.name}?`,
  a: `${hotelA.name} is a ${hotelA.star_classification || 5}-star ${hotelA.category?.toLowerCase() || 'luxury hotel'} in ${hotelA.location}, from CHF ${hotelA.nightly_rate_chf?.toLocaleString()}/night. ${hotelB.name} is a ${hotelB.star_classification || 5}-star ${hotelB.category?.toLowerCase() || 'luxury hotel'} in ${hotelB.location}, from CHF ${hotelB.nightly_rate_chf?.toLocaleString()}/night. The key difference is in positioning: ${hotelA.name} is best suited for ${hotelA.best_for?.slice(0,2).join(' and ') || 'discerning luxury travelers'}, while ${hotelB.name} appeals more to ${hotelB.best_for?.slice(0,2).join(' and ') || 'luxury travelers seeking a different experience'}. Both are among the finest hotels in ${hotelA.region}.`
},
{
  q: `Which is more expensive — ${hotelA.name} or ${hotelB.name}?`,
  a: `${hotelA.name} starts from CHF ${hotelA.nightly_rate_chf?.toLocaleString()}/night and ${hotelB.name} from CHF ${hotelB.nightly_rate_chf?.toLocaleString()}/night. ${hotelA.nightly_rate_chf > hotelB.nightly_rate_chf ? `${hotelA.name} is the higher-priced option` : hotelB.nightly_rate_chf > hotelA.nightly_rate_chf ? `${hotelB.name} is the higher-priced option` : `Both hotels are similarly priced`} at the entry level, though rates vary significantly by season, room category, and booking dates. Direct booking through each hotel's official website typically offers the best available rate.`
},
{
  q: `Is ${hotelA.name} or ${hotelB.name} better for a honeymoon or romantic stay?`,
  a: `${hotelA.romantic ? `${hotelA.name} is specifically positioned for romantic stays` : `${hotelA.name} suits couples who prioritise ${hotelA.best_for?.slice(0,1).join('') || 'luxury and quality'}`}. ${hotelB.romantic ? `${hotelB.name} is also well suited to romantic travel` : `${hotelB.name} appeals to couples who prefer ${hotelB.best_for?.slice(0,1).join('') || 'a different atmosphere'}`}. The stronger romantic choice depends on whether you prefer ${hotelA.category?.toLowerCase() || 'the first hotel\'s style'} or ${hotelB.category?.toLowerCase() || 'the second hotel\'s approach'} — both are in ${hotelA.region}, one of Switzerland's most scenic destinations.`
},
                ].map((faq, i) => (
                  <div key={i} style={{ background: white, border: `1px solid ${border}`, padding: '1.25rem 1.5rem', borderRadius: 8 }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: text, margin: '0 0 0.5rem' }}>
                      <span style={{ color: gold, marginRight: '0.5rem' }}>Q.</span>{faq.q}
                    </p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, lineHeight: 1.8, margin: 0, fontWeight: 300 }}>
                      <span style={{ color: gold, marginRight: '0.5rem' }}>A.</span>{faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Other comparisons in same region */}
            {relatedHotels.length > 0 && (
              <section style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>
                  More {hotelA.region} Comparisons
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {relatedHotels.map(h => (
                    <Link key={h.id} href={`/compare/${normalize(hotelA.name)}-vs-${normalize(h.name)}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem', background: white, border: `1px solid ${border}`, borderRadius: 4, textDecoration: 'none' }}>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text }}>{hotelA.name} vs {h.name}</span>
                      <span style={{ color: gold }}>→</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <Link href="/hotels" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, textDecoration: 'none' }}>
              ← View all hotels
            </Link>
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: '2rem' }}>

            {/* Quick verdict */}
            <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, margin: '0 0 1rem' }}>Quick Verdict</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 600, color: text, margin: '0 0 0.3rem' }}>{hotelA.name}</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: '0 0 0.25rem', lineHeight: 1.5 }}>
                    {hotelA.star_classification || 5}★ · {hotelA.category} · {hotelA.location}
                  </p>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: gold, margin: 0 }}>CHF {hotelA.nightly_rate_chf?.toLocaleString()}<span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted }}>/night</span></p>
                </div>
                <div style={{ height: 1, background: border }} />
                <div>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 600, color: text, margin: '0 0 0.3rem' }}>{hotelB.name}</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: '0 0 0.25rem', lineHeight: 1.5 }}>
                    {hotelB.star_classification || 5}★ · {hotelB.category} · {hotelB.location}
                  </p>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: gold, margin: 0 }}>CHF {hotelB.nightly_rate_chf?.toLocaleString()}<span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted }}>/night</span></p>
                </div>
              </div>
            </div>

            {/* Book direct */}
            <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, margin: '0 0 1rem' }}>Book Direct</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {trackingUrlA && (
                  <a href={trackingUrlA} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.75rem', textDecoration: 'none', borderRadius: 4 }}>
                    {hotelA.name.split(' ').slice(0, 2).join(' ')} — Official Website →
                  </a>
                )}
                {trackingUrlB && (
                  <a href={trackingUrlB} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', background: text, color: white, fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.75rem', textDecoration: 'none', borderRadius: 4 }}>
                    {hotelB.name.split(' ').slice(0, 2).join(' ')} — Official Website →
                  </a>
                )}
              </div>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: textMuted, margin: '0.75rem 0 0', textAlign: 'center', lineHeight: 1.5 }}>Direct booking · No OTA fees · Best rate</p>
            </div>

            {/* Related links */}
            <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '1.5rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, margin: '0 0 1rem' }}>Explore</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {regionSlug && (
                  <Link href={`/destinations/${regionSlug}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: gold, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: `1px solid ${border}` }}>
                    <span>{hotelA.region} destination guide</span><span>→</span>
                  </Link>
                )}
                {regionSlug && (
                  <Link href={`/best/luxury-hotels-${regionSlug}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: gold, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: `1px solid ${border}` }}>
                    <span>Best luxury hotels in {hotelA.region}</span><span>→</span>
                  </Link>
                )}
                <Link href={`/hotels/${hotelA.slug || hotelA.id}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: gold, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: `1px solid ${border}` }}>
                  <span>{hotelA.name} full profile</span><span>→</span>
                </Link>
                <Link href={`/hotels/${hotelB.slug || hotelB.id}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: gold, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                  <span>{hotelB.name} full profile</span><span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
