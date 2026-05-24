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

// Related — same region, similar category, max 3
const relatedHotels = allHotels
  .filter(h =>
    h.id !== hotelA.id &&
    h.id !== hotelB.id &&
    h.region === hotelA.region &&
    (
      h.category === hotelA.category ||
h.category === hotelB.category
    )
  )
  .sort((a, b) => {
    // Prioritize same category as either hotel
    const aScore = (a.category === hotelA.category || a.category === hotelB.category) ? 1 : 0
    const bScore = (b.category === hotelA.category || b.category === hotelB.category) ? 1 : 0
    return bScore - aScore
  })
  .slice(0, 3)

  // ── EDITORIAL POSITIONING ENGINE ─────────────────────────────────────────

  type HotelPos = {
    identity: string
    setting: 'lakeside-resort' | 'city-centre' | 'mountain' | 'urban-lakefront' | 'swiss'
    energy: string
    privacy: 'very-private' | 'private' | 'social' | 'formal'
    scale: 'boutique' | 'mid' | 'grand'
    primaryDraw: string
  }

  const getPositioning = (h: any): HotelPos => {
    const cat = (h.category || '').toLowerCase()
    const isLakefront = h.lakefront === true
    const isLakeView = h.lake_view === true
    const isWellness = h.wellness_focus === true
    const isCentral = h.central_location === true
    const isBusiness = h.business_hotel === true
    const isSki = h.ski_in_ski_out === true || cat.includes('ski')
    const isBoutique = cat.includes('boutique')
    const hasSpa = h.has_spa === true
    const isRomantic = h.romantic === true
    const isWellnessRetreat = cat.includes('wellness')

    // Lakeside resort — secluded, not central
    if (isLakefront && isWellness && !isCentral) {
      return {
        identity: 'discreet lakeside retreat',
        setting: 'lakeside-resort',
        energy: 'private and unhurried',
        privacy: 'very-private',
        scale: 'grand',
        primaryDraw: 'lakeside seclusion and wellness',
      }
    }

    // Urban lakefront — on the lake but central
    if (isLakefront && isCentral) {
      return {
        identity: 'lakefront grand hotel',
        setting: 'urban-lakefront',
        energy: 'urban and prestigious',
        privacy: 'formal',
        scale: 'grand',
        primaryDraw: 'central lakefront position',
      }
    }

    // Lakefront without wellness or central — pure lakeside
    if (isLakefront) {
      return {
        identity: 'lakeside luxury hotel',
        setting: 'urban-lakefront',
        energy: 'relaxed and scenic',
        privacy: 'private',
        scale: 'grand',
        primaryDraw: 'lake setting',
      }
    }

    // Urban business grand hotel
    if (isBusiness && isCentral && !isWellness) {
      return {
        identity: 'urban grand hotel',
        setting: 'city-centre',
        energy: 'formal and central',
        privacy: 'formal',
        scale: 'grand',
        primaryDraw: 'central city position and business facilities',
      }
    }

    // Design boutique with wellness
    if (isBoutique && isWellness) {
      return {
        identity: 'boutique wellness lodge',
        setting: 'mountain',
        energy: 'intimate and restorative',
        privacy: 'very-private',
        scale: 'boutique',
        primaryDraw: 'intimate atmosphere and wellness',
      }
    }

    // Pure boutique
    if (isBoutique) {
      return {
        identity: 'boutique mountain hotel',
        setting: 'mountain',
        energy: 'intimate and design-led',
        privacy: 'private',
        scale: 'boutique',
        primaryDraw: 'intimate scale and design',
      }
    }

    // Wellness retreat
    if (isWellnessRetreat || (isWellness && !isSki && !isCentral)) {
      return {
        identity: 'wellness retreat',
        setting: 'mountain',
        energy: 'restorative and quiet',
        privacy: 'very-private',
        scale: 'mid',
        primaryDraw: 'wellness and nature',
      }
    }

    // Ski and wellness
    if (isSki && isWellness) {
      return {
        identity: 'ski and wellness alpine resort',
        setting: 'mountain',
        energy: 'active and restorative',
        privacy: 'private',
        scale: 'grand',
        primaryDraw: 'skiing and spa recovery',
      }
    }

    // Classic alpine grand hotel with spa
    if (isSki && hasSpa) {
      return {
        identity: 'classic alpine grand hotel',
        setting: 'mountain',
        energy: 'traditional and complete',
        privacy: 'formal',
        scale: 'grand',
        primaryDraw: 'grand alpine tradition and skiing',
      }
    }

    // Ski-first
    if (isSki) {
      return {
        identity: 'alpine ski resort',
        setting: 'mountain',
        energy: 'mountain-focused and active',
        privacy: 'social',
        scale: 'mid',
        primaryDraw: 'skiing and mountain access',
      }
    }

    // City luxury without business focus
    if (cat.includes('city') && !isBusiness) {
      return {
        identity: 'city luxury hotel',
        setting: 'city-centre',
        energy: 'urban and sophisticated',
        privacy: 'formal',
        scale: 'grand',
        primaryDraw: 'urban luxury and location',
      }
    }

    // Fallback
    return {
      identity: 'luxury hotel',
      setting: 'swiss',
      energy: 'refined',
      privacy: 'private',
      scale: 'grand',
      primaryDraw: 'luxury and quality',
    }
  }

  const getTravelerFit = (h: any): string[] => {
    // best_for from DB is most reliable — use it first
    if (h.best_for?.length > 0) return (h.best_for as string[]).slice(0, 3)
    const pos = getPositioning(h)
    const fits: string[] = []
    if (pos.setting === 'lakeside-resort') fits.push('Couples seeking privacy', 'Wellness travelers', 'Discerning guests avoiding the city')
    else if (pos.setting === 'urban-lakefront') fits.push('Business travelers', 'Couples on city breaks', 'Those wanting lakefront and city access')
    else if (pos.setting === 'city-centre') fits.push('Business travelers', 'Urban explorers', 'Diplomatic visitors')
    else if (pos.scale === 'boutique') fits.push('Couples', 'Design-conscious travelers', 'Those preferring intimacy over scale')
    else if (pos.identity.includes('wellness')) fits.push('Wellness seekers', 'Couples', 'Those prioritising restoration over activity')
    else if (pos.identity.includes('ski')) fits.push('Skiers', 'Families', 'Active mountain travelers')
    else fits.push('Luxury travelers', 'Couples', 'Special occasion stays')
    return fits.slice(0, 3)
  }

  const posA = getPositioning(hotelA)
  const posB = getPositioning(hotelB)
  const fitsA = getTravelerFit(hotelA)
  const fitsB = getTravelerFit(hotelB)

  const getAtmosphere = (h: any): string => getPositioning(h).identity

  // ── OPENING GENERATOR ─────────────────────────────────────────────────────

  const generateOpening = (): string => {
    const sA = posA.setting
    const sB = posB.setting

    // Resort vs city-centre — the most important distinction to get right
    if (sA === 'lakeside-resort' && (sB === 'city-centre' || sB === 'urban-lakefront')) {
      return `${hotelA.name} and ${hotelB.name} are both exceptional ${hotelA.region} addresses, but they offer fundamentally different experiences. ${hotelA.name} is a ${posA.identity} — set apart from the city, with a private lakeside setting and an atmosphere centred on calm and discretion rather than urban convenience. ${hotelB.name} is a ${posB.identity} positioned at the heart of ${hotelA.region}, within easy reach of the old town and the main lakefront — better suited to travelers who want the city immediately accessible. The choice comes down to whether you want ${hotelA.region} at your door or a private escape from it.`
    }

    if ((sA === 'city-centre' || sA === 'urban-lakefront') && sB === 'lakeside-resort') {
      return `${hotelA.name} and ${hotelB.name} occupy very different positions in ${hotelA.region}. ${hotelA.name} is a ${posA.identity} — central, prestigious, and oriented toward ${fitsA.slice(0, 2).join(' and ').toLowerCase()}. ${hotelB.name} takes a completely different approach: a ${posB.identity} removed from the urban centre, offering seclusion, a private lakeside setting, and an atmosphere more akin to a destination resort than a city hotel. The decision comes down to whether you want ${hotelA.region} at your door or a private retreat from it.`
    }

    // Both lakefront but different energy
    if (sA === 'urban-lakefront' && sB === 'urban-lakefront') {
      return `${hotelA.name} and ${hotelB.name} are both lakefront properties in ${hotelA.region}, but with different characters. ${hotelA.name} is a ${posA.identity} — ${posA.energy}, with ${posA.primaryDraw} at its core. ${hotelB.name} has a ${posB.energy} character, centred on ${posB.primaryDraw}. At this level the distinction is one of atmosphere and personal style rather than quality.`
    }

    // Both city
    if (sA === 'city-centre' && sB === 'city-centre') {
      const aMoreBusiness = hotelA.business_hotel && !hotelB.business_hotel
      const bMoreBusiness = hotelB.business_hotel && !hotelA.business_hotel
      if (aMoreBusiness) {
        return `${hotelA.name} and ${hotelB.name} are both at the top of the ${hotelA.region} luxury market, but they attract different guests. ${hotelA.name} is a ${posA.identity} with a strong business and diplomatic orientation — suited to travelers who want central positioning and professional infrastructure. ${hotelB.name} has a more residential and ${posB.energy} character, better suited to ${fitsB.slice(0, 2).join(' and ').toLowerCase()} who want a central base without the corporate atmosphere.`
      }
      if (bMoreBusiness) {
        return `${hotelA.name} and ${hotelB.name} both sit at the top of the ${hotelA.region} luxury market. ${hotelA.name} has a ${posA.energy} character suited to ${fitsA.slice(0, 2).join(' and ').toLowerCase()}. ${hotelB.name} is a more ${posB.identity} — better suited to business travelers and diplomatic visitors who want central positioning and professional infrastructure.`
      }
      return `Both ${hotelA.name} and ${hotelB.name} rank among the finest city hotels in ${hotelA.region}, but they have distinct characters. ${hotelA.name} is ${posA.energy} in atmosphere, drawing ${fitsA.slice(0, 2).join(' and ').toLowerCase()}. ${hotelB.name} is more ${posB.energy}, better suited to ${fitsB.slice(0, 2).join(' and ').toLowerCase()}. The decision at this level is one of atmosphere and fit rather than quality.`
    }

    // Mountain: wellness boutique vs grand alpine
    if (sA === 'mountain' && sB === 'mountain') {
      const aWellness = posA.identity.includes('wellness') || posA.identity.includes('boutique')
      const bWellness = posB.identity.includes('wellness') || posB.identity.includes('boutique')

      if (aWellness && !bWellness) {
        return `${hotelA.name} and ${hotelB.name} sit in the same ${hotelA.region} landscape but represent different expressions of alpine luxury. ${hotelA.name} is a ${posA.identity} — its ${posA.energy} atmosphere and focus on ${posA.primaryDraw} make it the stronger choice for travelers who want the mountain as a backdrop to a restorative stay. ${hotelB.name} is the more ${posB.identity} — larger in scale, more complete in facilities, and more formal in character. The choice comes down to whether you want a wellness-led escape or the full grand hotel experience.`
      }

      if (!aWellness && bWellness) {
        return `${hotelA.name} and ${hotelB.name} both sit in ${hotelA.region} but appeal to very different mountain travelers. ${hotelA.name} is the ${posA.identity} — the benchmark ${posA.energy} property in the area, with the scale, facilities, and tradition of a classic alpine grand hotel. ${hotelB.name} takes a more ${posB.energy} approach, better suited to travelers who want ${posB.primaryDraw} over grand hotel formality. If scale and completeness are the priority, ${hotelA.name} wins; if atmosphere and intimacy matter more, ${hotelB.name} is the stronger fit.`
      }

      // Both ski or both similar mountain
      if (posA.privacy === 'social' || posB.privacy === 'social') {
        return `${hotelA.name} and ${hotelB.name} are both strong mountain hotels in ${hotelA.region}, but they suit different types of skier. ${hotelA.name} is a ${posA.identity} — ${posA.energy} in character, with ${posA.primaryDraw} as its core appeal. ${hotelB.name} takes a ${posB.energy} approach, better suited to ${fitsB.slice(0, 2).join(' and ').toLowerCase()}. Both are well positioned for the slopes; the choice comes down to the kind of stay you want off the mountain.`
      }

      return `${hotelA.name} and ${hotelB.name} are both excellent choices in ${hotelA.region} but with different sensibilities. ${hotelA.name} is a ${posA.identity} — ${posA.energy}, drawing ${fitsA.slice(0, 2).join(' and ').toLowerCase()}. ${hotelB.name} has a ${posB.energy} character, better suited to ${fitsB.slice(0, 2).join(' and ').toLowerCase()}. Both are strong; the decision is one of personal fit.`
    }

    // Cross-setting default
    return `${hotelA.name} and ${hotelB.name} are both strong options in ${hotelA.region} but occupy different positions in the luxury market. ${hotelA.name} is a ${posA.identity} with ${posA.energy} atmosphere — oriented toward ${fitsA.slice(0, 2).join(' and ').toLowerCase()}. ${hotelB.name} is a ${posB.identity}, more ${posB.energy} in character, better suited to ${fitsB.slice(0, 2).join(' and ').toLowerCase()}.`
  }

  const opening = generateOpening()

  // ── DIFFERENTIATORS ───────────────────────────────────────────────────────

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
  if (hotelA.central_location === true && hotelB.central_location !== true) differentiators.push(`${hotelA.name} is centrally located; ${hotelB.name} is set apart from the city centre`)
  if (hotelB.central_location === true && hotelA.central_location !== true) differentiators.push(`${hotelB.name} is centrally located; ${hotelA.name} is set apart from the city centre`)

  const verdict = `${hotelA.name} is the right choice for travelers who want ${posA.energy} atmosphere and ${posA.primaryDraw}. ${hotelB.name} suits those who prefer ${posB.energy} character and ${posB.primaryDraw}. Both are among the finest options in ${hotelA.region}.`

  // ── FAQs ──────────────────────────────────────────────────────────────────

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
        const pricierPos = getPositioning(pricier)
        return diff > 150
          ? `${pricier.name} starts higher at CHF ${pricier.nightly_rate_chf.toLocaleString()}/night versus ${cheaper.name} from CHF ${cheaper.nightly_rate_chf.toLocaleString()}/night. The premium reflects ${pricierPos.primaryDraw} — for travelers who prioritise that, the difference is justified. For those whose priorities align more with ${getPositioning(cheaper).primaryDraw}, ${cheaper.name} represents the stronger value.`
          : `Both hotels are comparably priced at CHF ${hotelA.nightly_rate_chf.toLocaleString()} and CHF ${hotelB.nightly_rate_chf.toLocaleString()}/night respectively. At this price parity the decision is better guided by atmosphere and traveler fit than by budget.`
      })()
    }] : []),
    {
      q: (() => {
        if (posA.setting !== posB.setting) return `${hotelA.name} or ${hotelB.name} — which suits my trip to ${hotelA.region} better?`
        if (hotelA.ski_in_ski_out || hotelB.ski_in_ski_out) return `Which hotel has better ski access?`
        if (hotelA.romantic && hotelB.romantic) return `Which is better for a romantic stay — ${hotelA.name} or ${hotelB.name}?`
        return `Which is better for a first visit to ${hotelA.region}?`
      })(),
      a: (() => {
        if (posA.setting === 'lakeside-resort' && (posB.setting === 'city-centre' || posB.setting === 'urban-lakefront')) {
          return `If your trip is city-focused — meetings, the old town, exploring ${hotelA.region} on foot — ${hotelB.name} is the more practical base, with the city immediately accessible. If you want ${hotelA.region} as a backdrop to a more private, resort-style stay centred on wellness and the lake, ${hotelA.name} is the stronger fit. The two hotels serve genuinely different trip purposes.`
        }
        if ((posA.setting === 'city-centre' || posA.setting === 'urban-lakefront') && posB.setting === 'lakeside-resort') {
          return `If your trip is city-focused — business, the old town, dining across ${hotelA.region} — ${hotelA.name} is the more convenient base. If you want a more private, resort-style stay with seclusion and a serious wellness offering, ${hotelB.name} is the stronger choice. The two hotels are not really in competition — they suit different trip purposes entirely.`
        }
        if (hotelA.ski_in_ski_out === true && hotelB.ski_in_ski_out !== true) {
          return `${hotelA.name} offers ski-in ski-out access — the clearer choice for ski-first travelers who want to step directly onto the slopes. ${hotelB.name} is well positioned in the resort but requires a short walk or transfer to the lifts. If ski convenience is the priority, ${hotelA.name} is the stronger option.`
        }
        if (hotelB.ski_in_ski_out === true && hotelA.ski_in_ski_out !== true) {
          return `${hotelB.name} has ski-in ski-out access — the stronger choice for guests whose stay revolves around the mountain. ${hotelA.name} is an excellent hotel but does not offer direct slope access. For ski-first travelers, ${hotelB.name} is the clearer fit.`
        }
        if (hotelA.romantic && hotelB.romantic) {
          return `Both hotels suit couples well. ${hotelA.name} offers a ${posA.energy} atmosphere with ${posA.primaryDraw} — better for couples who want ${fitsA[0]?.toLowerCase() || 'privacy and calm'}. ${hotelB.name} has a ${posB.energy} character centred on ${posB.primaryDraw}, appealing to couples who want ${fitsB[0]?.toLowerCase() || 'a different kind of romantic stay'}. Neither is a wrong choice; the decision comes down to which atmosphere fits your trip.`
        }
        return `For a first visit to ${hotelA.region}, ${hotelA.name} offers a ${posA.identity} experience — ${posA.energy}, suited to ${fitsA[0]?.toLowerCase() || 'luxury travelers'}. ${hotelB.name} is the stronger fit for ${fitsB[0]?.toLowerCase() || 'travelers who want a different atmosphere'}. First-time visitors who want the most complete and traditional introduction to ${hotelA.region} tend to gravitate toward ${posA.scale === 'grand' && posA.privacy === 'formal' ? hotelA.name : posB.scale === 'grand' && posB.privacy === 'formal' ? hotelB.name : hotelA.name}.`
      })()
    }
  ]

  // ── COMPARISON TABLE ──────────────────────────────────────────────────────

  const criteria = [
    { label: 'Location', a: hotelA.location, b: hotelB.location },
    { label: 'Setting', a: posA.identity, b: posB.identity },
    { label: 'Style', a: hotelA.category, b: hotelB.category },
    { label: 'Stars', a: '★'.repeat(hotelA.star_classification || 5), b: '★'.repeat(hotelB.star_classification || 5) },
    { label: 'From', a: hotelA.nightly_rate_chf ? `CHF ${hotelA.nightly_rate_chf.toLocaleString()}/night` : null, b: hotelB.nightly_rate_chf ? `CHF ${hotelB.nightly_rate_chf.toLocaleString()}/night` : null },
    { label: 'Spa', a: hotelA.has_spa === true ? 'Yes' : hotelA.has_spa === false ? 'No' : null, b: hotelB.has_spa === true ? 'Yes' : hotelB.has_spa === false ? 'No' : null },
    { label: 'Michelin Dining', a: hotelA.has_michelin_restaurant === true ? 'Yes' : hotelA.has_michelin_restaurant === false ? 'No' : null, b: hotelB.has_michelin_restaurant === true ? 'Yes' : hotelB.has_michelin_restaurant === false ? 'No' : null },
    { label: 'Ski Access', a: hotelA.ski_in_ski_out === true ? 'Ski-in ski-out' : hotelA.near_ski_lifts === true ? 'Near lifts' : null, b: hotelB.ski_in_ski_out === true ? 'Ski-in ski-out' : hotelB.near_ski_lifts === true ? 'Near lifts' : null },
    { label: 'Lakefront', a: hotelA.lakefront === true ? 'Yes' : hotelA.lake_view === true ? 'Lake view' : null, b: hotelB.lakefront === true ? 'Yes' : hotelB.lake_view === true ? 'Lake view' : null },
    { label: 'Wellness', a: hotelA.wellness_focus === true ? 'Wellness focus' : hotelA.has_spa === true ? 'Spa' : null, b: hotelB.wellness_focus === true ? 'Wellness focus' : hotelB.has_spa === true ? 'Spa' : null },
    { label: 'Best For', a: (hotelA.best_for as string[])?.slice(0, 2).join(', ') || null, b: (hotelB.best_for as string[])?.slice(0, 2).join(', ') || null },
  ].filter((row: { label: string; a: any; b: any }) => row.a !== null || row.b !== null)

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

            {/* Related comparisons — same region, similar category only */}
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