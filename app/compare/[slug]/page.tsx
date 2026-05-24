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
    .select('slug, name, region, category')
    .eq('is_active', true)
    .not('slug', 'is', null)

  if (!partners || !allHotels) return []

  const pairs = new Set<string>()

  for (const partner of partners) {
    const comparable = allHotels.filter(h =>
      h.slug !== partner.slug &&
      h.region === partner.region 
      
    ).slice(0, 3)

    for (const other of comparable) {
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
    description: `Expert comparison of ${hotelA.name} and ${hotelB.name}. Atmosphere, traveler fit, dining, spa and verdict to help you choose the right luxury hotel in Switzerland.`,
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

  const trackingUrlA = hotelA.is_partner && hotelA.direct_booking_url
    ? `/api/track?hotel_id=${hotelA.id}&hotel_name=${encodeURIComponent(hotelA.name)}&destination=${encodeURIComponent(hotelA.direct_booking_url)}&medium=website&campaign=compare`
    : hotelA.direct_booking_url
  const trackingUrlB = hotelB.is_partner && hotelB.direct_booking_url
    ? `/api/track?hotel_id=${hotelB.id}&hotel_name=${encodeURIComponent(hotelB.name)}&destination=${encodeURIComponent(hotelB.direct_booking_url)}&medium=website&campaign=compare`
    : hotelB.direct_booking_url

  // Related — same region, same luxury tier, not these two hotels, max 3
  // Prefer same category or overlapping best_for, same region and tier
const relatedHotels = allHotels
  .filter(h =>
    h.id !== hotelA.id &&
    h.id !== hotelB.id &&
    h.region === hotelA.region &&
    h.luxury_tier === hotelA.luxury_tier
  )
  .sort((a, b) => {
    // Prioritize same category as either hotel
    const aScore = (a.category === hotelA.category || a.category === hotelB.category) ? 1 : 0
    const bScore = (b.category === hotelA.category || b.category === hotelB.category) ? 1 : 0
    return bScore - aScore
  })
  .slice(0, 3)

  // ── EDITORIAL LOGIC ───────────────────────────────────────────────────────

  const getAtmosphere = (h: any): string => {
    const cat = (h.category || '').toLowerCase()
    if (cat.includes('wellness')) return 'wellness retreat'
    if (cat.includes('boutique')) return 'boutique mountain lodge'
    if (cat.includes('grand')) return 'classic grand hotel'
    if (cat.includes('city')) return h.business_hotel ? 'city business hotel' : 'city luxury hotel'
    if (cat.includes('ski')) return h.wellness_focus ? 'ski and wellness resort' : 'ski resort'
    return h.category || 'luxury hotel'
  }

  const getTravelerFit = (h: any): string[] => {
    if (h.best_for?.length > 0) return (h.best_for as string[]).slice(0, 3)
    const fits: string[] = []
    if (h.romantic) fits.push('Couples')
    if (h.family_friendly) fits.push('Families')
    if (h.business_hotel) fits.push('Business travelers')
    if (h.wellness_focus) fits.push('Wellness seekers')
    if (h.ski_in_ski_out) fits.push('Ski lovers')
    return fits.length ? fits.slice(0, 3) : ['Discerning luxury travelers']
  }

  const atmA = getAtmosphere(hotelA)
  const atmB = getAtmosphere(hotelB)
  const fitsA = getTravelerFit(hotelA)
  const fitsB = getTravelerFit(hotelB)

  // Vary opening based on hotel type combination
  const getBothCat = () => {
    const a = (hotelA.category || '').toLowerCase()
    const b = (hotelB.category || '').toLowerCase()
    if (a.includes('boutique') && b.includes('grand')) return 'boutique_vs_grand'
    if (a.includes('grand') && b.includes('boutique')) return 'grand_vs_boutique'
    if (a.includes('wellness') && b.includes('ski')) return 'wellness_vs_ski'
    if (a.includes('ski') && b.includes('wellness')) return 'ski_vs_wellness'
    if (a.includes('city') && b.includes('city')) return 'city_vs_city'
    if ((a.includes('ski') || a.includes('boutique')) && b.includes('city')) return 'mountain_vs_city'
    return 'default'
  }

  const openingVariants: Record<string, string> = {
    boutique_vs_grand: `${hotelA.name} and ${hotelB.name} represent two distinct interpretations of luxury in ${hotelA.region}. ${hotelA.name} operates at boutique scale — private, design-led, and oriented toward ${fitsA.slice(0, 2).join(' and ').toLowerCase()}. ${hotelB.name} brings the full grand hotel experience: larger facilities, a broader guest profile, and a more traditional Alpine luxury atmosphere. The choice is less about quality than about what kind of stay you want.`,
    grand_vs_boutique: `${hotelA.name} and ${hotelB.name} offer contrasting takes on ${hotelA.region} luxury. ${hotelA.name} is a classic grand hotel — expansive, traditionally elegant, suited to ${fitsA.slice(0, 2).join(' and ').toLowerCase()}. ${hotelB.name} takes a more intimate approach: smaller in scale, more design-forward, and better suited to travelers who prefer ${fitsB.slice(0, 2).join(' and ').toLowerCase()}.`,
    wellness_vs_ski: `In ${hotelA.region}, ${hotelA.name} and ${hotelB.name} serve different sides of the mountain experience. ${hotelA.name} leads with wellness — the spa, the treatments, and the recovery ritual are the core of what it offers. ${hotelB.name} is more ski-first, with the mountain and slopes at the center of its appeal. Travelers who want to come off the mountain and disappear into a spa will find ${hotelA.name} the stronger fit; those who want to ski hard and stay close to the action will prefer ${hotelB.name}.`,
    ski_vs_wellness: `${hotelA.name} and ${hotelB.name} both sit in ${hotelA.region} but appeal to different types of mountain traveler. ${hotelA.name} is ski-first — the slopes, the access, and the alpine energy are its primary draw. ${hotelB.name} prioritises wellness, with the spa and recovery experience taking center stage. The better choice depends on whether you're coming to ski or to restore.`,
    ski_vs_ski: `${hotelA.name} and ${hotelB.name} are both ski hotels in ${hotelA.region}, but they appeal to different types of mountain traveler. ${hotelA.name} is a ${atmA} — ${fitsA.slice(0,2).join(' and ').toLowerCase()} tend to choose it for its ${hotelA.wellness_focus ? 'wellness offering and' : ''} atmosphere. ${hotelB.name} has a more ${atmB} character, with stronger appeal for ${fitsB.slice(0,2).join(' and ').toLowerCase()}. Both are strong — the decision comes down to scale and style.`,
    city_vs_city: `Both ${hotelA.name} and ${hotelB.name} operate at the top of the ${hotelA.region} luxury market, but they position themselves differently. ${hotelA.name} is the more ${atmA} option, drawing ${fitsA.slice(0, 2).join(' and ').toLowerCase()}. ${hotelB.name} has a more ${atmB} character, better suited to ${fitsB.slice(0, 2).join(' and ').toLowerCase()}. At this level, the decision comes down to atmosphere and personal fit rather than quality.`,
    default: `${hotelA.name} and ${hotelB.name} are both strong options in ${hotelA.region}, but they occupy different positions in the market. ${hotelA.name} is a ${atmA}, oriented toward ${fitsA.slice(0, 2).join(' and ').toLowerCase()}. ${hotelB.name} takes a ${atmB} approach, appealing more to ${fitsB.slice(0, 2).join(' and ').toLowerCase()}.`,
  }

  const opening = openingVariants[getBothCat()] || openingVariants.default

  // Key differentiators — only when explicitly true
  const differentiators: string[] = []
  if (hotelA.has_spa === true && hotelB.has_spa !== true) differentiators.push(`${hotelA.name} has an on-site spa; ${hotelB.name} does not`)
  if (hotelB.has_spa === true && hotelA.has_spa !== true) differentiators.push(`${hotelB.name} has an on-site spa; ${hotelA.name} does not`)
  if (hotelA.has_michelin_restaurant === true && hotelB.has_michelin_restaurant !== true) differentiators.push(`${hotelA.name} has Michelin-recognised dining`)
  if (hotelB.has_michelin_restaurant === true && hotelA.has_michelin_restaurant !== true) differentiators.push(`${hotelB.name} has Michelin-recognised dining`)
  if (hotelA.ski_in_ski_out === true && hotelB.ski_in_ski_out !== true) differentiators.push(`${hotelA.name} has ski-in ski-out access`)
  if (hotelB.ski_in_ski_out === true && hotelA.ski_in_ski_out !== true) differentiators.push(`${hotelB.name} has ski-in ski-out access`)
  if (hotelA.lakefront === true && hotelB.lakefront !== true) differentiators.push(`${hotelA.name} sits directly on the lake`)
  if (hotelB.lakefront === true && hotelA.lakefront !== true) differentiators.push(`${hotelB.name} sits directly on the lake`)
  if (hotelA.wellness_focus === true && hotelB.wellness_focus !== true) differentiators.push(`${hotelA.name} has a dedicated wellness programme`)
  if (hotelB.wellness_focus === true && hotelA.wellness_focus !== true) differentiators.push(`${hotelB.name} has a dedicated wellness programme`)

  const verdict = `${hotelA.name} suits travelers who prioritise ${fitsA[0]?.toLowerCase() || 'the grand hotel experience'}. ${hotelB.name} is the stronger choice for those wanting ${fitsB[0]?.toLowerCase() || 'a different atmosphere'}. Both are among the finest options in ${hotelA.region}.`

  // FAQs — opinionated, varied by hotel type
  const faqs = [
    {
      q: `What is the main difference between ${hotelA.name} and ${hotelB.name}?`,
      a: `${opening} ${verdict}`
    },
    ...(hotelA.nightly_rate_chf && hotelB.nightly_rate_chf ? [{
      q: `Is ${hotelA.name} or ${hotelB.name} better value?`,
      a: (() => {
        const diff = Math.abs(hotelA.nightly_rate_chf - hotelB.nightly_rate_chf)
        const pricier = hotelA.nightly_rate_chf > hotelB.nightly_rate_chf ? hotelA : hotelB
        const cheaper = hotelA.nightly_rate_chf > hotelB.nightly_rate_chf ? hotelB : hotelA
        return diff > 150
          ? `${pricier.name} carries a higher entry price at CHF ${pricier.nightly_rate_chf.toLocaleString()}/night versus ${cheaper.name} from CHF ${cheaper.nightly_rate_chf.toLocaleString()}/night. Whether the premium is justified depends on your priorities — ${pricier.name} offers ${getTravelerFit(pricier)[0]?.toLowerCase() || 'a more complete experience'} that may make the difference meaningful for the right traveler.`
          : `Both hotels are comparably priced at this level. The choice between them is better guided by atmosphere and traveler fit than by budget.`
      })()
    }] : []),
    {
      q: hotelA.romantic && hotelB.romantic
        ? `Which is better for a romantic stay — ${hotelA.name} or ${hotelB.name}?`
        : hotelA.ski_in_ski_out || hotelB.ski_in_ski_out
        ? `Which hotel has better ski access?`
        : `Which is better for a first visit to ${hotelA.region}?`,
      a: (() => {
        if (hotelA.romantic && hotelB.romantic) {
          return `Both hotels suit couples well. ${hotelA.name} offers a more ${atmA} atmosphere — better for ${fitsA[0]?.toLowerCase() || 'couples seeking privacy'}. ${hotelB.name} takes a more ${atmB} approach, appealing to couples who want ${fitsB[0]?.toLowerCase() || 'a different setting'}. Neither is a wrong choice; the decision comes down to which atmosphere fits your travel style.`
        }
        if (hotelA.ski_in_ski_out === true && hotelB.ski_in_ski_out !== true) {
          return `${hotelA.name} offers ski-in ski-out access — the clearer choice for ski-first travelers who want to step directly onto the slopes. ${hotelB.name} is well positioned in the resort but requires a short walk or transfer to the lifts. If ski convenience is the priority, ${hotelA.name} is the stronger option.`
        }
        if (hotelB.ski_in_ski_out === true && hotelA.ski_in_ski_out !== true) {
          return `${hotelB.name} has ski-in ski-out access — the stronger choice for guests whose stay revolves around the mountain. ${hotelA.name} is an excellent hotel but does not offer direct slope access. For ski-first travelers, ${hotelB.name} is the clearer fit.`
        }
        return `For a first visit to ${hotelA.region}, ${hotelA.name} offers ${atmA} atmosphere with strong appeal for ${fitsA[0]?.toLowerCase() || 'luxury travelers'}. ${hotelB.name} suits ${fitsB[0]?.toLowerCase() || 'a more specific traveler profile'} better. First-time visitors wanting a comprehensive introduction to the destination tend to find ${hotelA.category?.toLowerCase().includes('grand') ? hotelA.name : hotelB.category?.toLowerCase().includes('grand') ? hotelB.name : hotelA.name} the more complete starting point.`
      })()
    }
  ]

  // Comparison table — only rows with real data
  const criteria = [
    { label: 'Location', a: hotelA.location, b: hotelB.location },
    { label: 'Style', a: hotelA.category, b: hotelB.category },
    { label: 'Stars', a: '★'.repeat(hotelA.star_classification || 5), b: '★'.repeat(hotelB.star_classification || 5) },
    { label: 'From', a: hotelA.nightly_rate_chf ? `CHF ${hotelA.nightly_rate_chf.toLocaleString()}/night` : null, b: hotelB.nightly_rate_chf ? `CHF ${hotelB.nightly_rate_chf.toLocaleString()}/night` : null },
    { label: 'Spa', a: hotelA.has_spa === true ? 'Yes' : hotelA.has_spa === false ? 'No' : null, b: hotelB.has_spa === true ? 'Yes' : hotelB.has_spa === false ? 'No' : null },
    { label: 'Michelin Dining', a: hotelA.has_michelin_restaurant === true ? 'Yes' : hotelA.has_michelin_restaurant === false ? 'No' : null, b: hotelB.has_michelin_restaurant === true ? 'Yes' : hotelB.has_michelin_restaurant === false ? 'No' : null },
    { label: 'Ski Access', a: hotelA.ski_in_ski_out === true ? 'Ski-in ski-out' : hotelA.near_ski_lifts === true ? 'Near lifts' : null, b: hotelB.ski_in_ski_out === true ? 'Ski-in ski-out' : hotelB.near_ski_lifts === true ? 'Near lifts' : null },
    { label: 'Lakefront', a: hotelA.lakefront === true ? 'Yes' : hotelA.lake_view === true ? 'Lake view' : null, b: hotelB.lakefront === true ? 'Yes' : hotelB.lake_view === true ? 'Lake view' : null },
    { label: 'Wellness', a: hotelA.wellness_focus === true ? 'Wellness focus' : hotelA.has_spa === true ? 'Spa' : null, b: hotelB.wellness_focus === true ? 'Wellness focus' : hotelB.has_spa === true ? 'Spa' : null },
    { label: 'Best For', a: (hotelA.best_for as string[])?.slice(0, 2).join(', ') || null, b: (hotelB.best_for as string[])?.slice(0, 2).join(', ') || null },
  ].filter(row => row.a !== null || row.b !== null)

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${hotelA.name} vs ${hotelB.name} | SwissNet Hotels`,
        description: opening,
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
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a }
        }))
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
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 300, color: '#fff', margin: '0 0 1rem', lineHeight: 1.2 }}>
            {hotelA.name} <span style={{ color: gold }}>vs</span> {hotelB.name}
          </h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', margin: 0, maxWidth: 680, lineHeight: 1.8 }}>
            {opening}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '3rem', alignItems: 'start' }}>
          <div>

            {/* Hotel cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
              {[hotelA, hotelB].map((hotel, i) => (
                <div key={hotel.id} style={{ background: white, border: hotel.is_partner ? `2px solid ${gold}` : `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                    <img src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
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
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: textMuted, lineHeight: 1.7, margin: '0 0 1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                      {i === 0 ? (contentA?.verdict || hotel.description) : (contentB?.verdict || hotel.description)}
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

            {/* Editorial comparison */}
            <section style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '2rem', marginBottom: '3rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, margin: '0 0 0.75rem' }}>Editorial Comparison</p>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: text, margin: '0 0 1.25rem' }}>Atmosphere & Traveler Fit</h2>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: text, lineHeight: 1.85, margin: '0 0 1.25rem', fontWeight: 300 }}>
                {opening}
              </p>
              {differentiators.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: '1.25rem 0', padding: '1rem 1.25rem', background: bg, borderRadius: 6 }}>
                  {differentiators.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                      <span style={{ color: gold, flexShrink: 0, fontSize: '0.65rem', marginTop: '0.1rem' }}>✦</span>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: textMuted, lineHeight: 1.6 }}>{d}</span>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: text, lineHeight: 1.85, margin: 0, fontWeight: 300 }}>
                {verdict}
              </p>
            </section>

            {/* Comparison table */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', fontWeight: 300, color: text, marginBottom: '1.5rem' }}>Side by Side</h2>
              <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F2EAE0' }}>
                      <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, width: '22%' }}></th>
                      <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: gold }}>{hotelA.name}</th>
                      <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: text }}>{hotelB.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criteria.map((row, i) => (
                      <tr key={row.label} style={{ background: i % 2 === 0 ? white : bg, borderTop: `1px solid ${border}` }}>
                        <td style={{ padding: '0.875rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{row.label}</td>
                        <td style={{ padding: '0.875rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: text }}>{row.a || '—'}</td>
                        <td style={{ padding: '0.875rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: text }}>{row.b || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Who should choose which */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', fontWeight: 300, color: text, marginBottom: '1.5rem' }}>Who Should Choose Which</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {[hotelA, hotelB].map((hotel) => {
                  const fits = getTravelerFit(hotel)
                  const atm = getAtmosphere(hotel)
                  return (
                    <div key={hotel.id} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '1.5rem' }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, margin: '0 0 0.5rem' }}>Choose {hotel.name}</p>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: textMuted, margin: '0 0 1rem', lineHeight: 1.6 }}>
                        The {atm} option in {hotel.region} — suited to {fits.slice(0, 2).map((f: string) => f.toLowerCase()).join(' and ')}.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {fits.map((f: string) => (
                          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                            <span style={{ color: gold, flexShrink: 0, marginTop: '0.15rem' }}>✦</span>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: text, lineHeight: 1.5 }}>{f}</span>
                          </div>
                        ))}
                        {hotel.has_michelin_restaurant === true && !(hotel.best_for as string[])?.some((b: string) => b.toLowerCase().includes('dining') || b.toLowerCase().includes('michelin')) && (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
    <span style={{ color: gold, flexShrink: 0, marginTop: '0.15rem' }}>✦</span>
    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: text, lineHeight: 1.5 }}>Michelin-starred dining on-site</span>
  </div>
)}
                        {hotel.ski_in_ski_out === true && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                            <span style={{ color: gold, flexShrink: 0, marginTop: '0.15rem' }}>✦</span>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: text, lineHeight: 1.5 }}>Ski-in ski-out access</span>
                          </div>
                        )}
                        {hotel.lakefront === true && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                            <span style={{ color: gold, flexShrink: 0, marginTop: '0.15rem' }}>✦</span>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: text, lineHeight: 1.5 }}>Direct lakefront position</span>
                          </div>
                        )}
                        {hotel.wellness_focus === true && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                            <span style={{ color: gold, flexShrink: 0, marginTop: '0.15rem' }}>✦</span>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: text, lineHeight: 1.5 }}>Dedicated wellness programme</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* FAQs */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', fontWeight: 300, color: text, marginBottom: '1.5rem' }}>Frequently Asked Questions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {faqs.map((faq, i) => (
                  <div key={i} style={{ background: white, border: `1px solid ${border}`, padding: '1.25rem 1.5rem', borderRadius: 8 }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.73rem', fontWeight: 600, color: text, margin: '0 0 0.5rem' }}>
                      <span style={{ color: gold, marginRight: '0.5rem' }}>Q.</span>{faq.q}
                    </p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: textMuted, lineHeight: 1.85, margin: 0, fontWeight: 300 }}>
                      <span style={{ color: gold, marginRight: '0.5rem' }}>A.</span>{faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Related comparisons — same region, same tier only */}
            {relatedHotels.length > 0 && (
              <section style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.35rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>
                  More {hotelA.region} Comparisons
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {relatedHotels.map(h => {
                    const compareSlug = `${hotelA.slug || normalize(hotelA.name)}-vs-${h.slug || normalize(h.name)}`
                    return (
                      <Link key={h.id} href={`/compare/${compareSlug}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem', background: white, border: `1px solid ${border}`, borderRadius: 4, textDecoration: 'none' }}>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text }}>{hotelA.name} vs {h.name}</span>
                        <span style={{ color: gold }}>→</span>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            <Link href="/hotels" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, textDecoration: 'none' }}>
              ← View all hotels
            </Link>
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: '2rem' }}>
            <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, margin: '0 0 1rem' }}>Quick Verdict</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[hotelA, hotelB].map((hotel, i) => (
                  <div key={hotel.id}>
                    {i === 1 && <div style={{ height: 1, background: border, marginBottom: '1rem' }} />}
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 600, color: text, margin: '0 0 0.2rem' }}>{hotel.name}</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, margin: '0 0 0.25rem', lineHeight: 1.5 }}>{getAtmosphere(hotel)} · {hotel.location}</p>
                    {hotel.nightly_rate_chf && <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: gold, margin: 0 }}>CHF {hotel.nightly_rate_chf.toLocaleString()}<span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: textMuted }}>/night</span></p>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, margin: '0 0 1rem' }}>Book Direct</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {trackingUrlA && (
                  <a href={trackingUrlA} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.75rem', textDecoration: 'none', borderRadius: 4 }}>
                    {hotelA.name.split(' ').slice(0, 2).join(' ')} →
                  </a>
                )}
                {trackingUrlB && (
                  <a href={trackingUrlB} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', background: text, color: white, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.75rem', textDecoration: 'none', borderRadius: 4 }}>
                    {hotelB.name.split(' ').slice(0, 2).join(' ')} →
                  </a>
                )}
              </div>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, margin: '0.75rem 0 0', textAlign: 'center' }}>Direct · No OTA fees · Best rate</p>
            </div>

            <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '1.5rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, margin: '0 0 1rem' }}>Explore</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {regionSlug && (
                  <Link href={`/destinations/${regionSlug}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.66rem', color: gold, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: `1px solid ${border}` }}>
                    <span>{hotelA.region} guide</span><span>→</span>
                  </Link>
                )}
                {regionSlug && (
                  <Link href={`/best/luxury-hotels-${regionSlug}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.66rem', color: gold, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: `1px solid ${border}` }}>
                    <span>Best hotels in {hotelA.region}</span><span>→</span>
                  </Link>
                )}
                <Link href={`/hotels/${hotelA.slug || hotelA.id}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.66rem', color: gold, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: `1px solid ${border}` }}>
                  <span>{hotelA.name} profile</span><span>→</span>
                </Link>
                <Link href={`/hotels/${hotelB.slug || hotelB.id}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.66rem', color: gold, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                  <span>{hotelB.name} profile</span><span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}