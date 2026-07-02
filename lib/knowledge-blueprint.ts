export type Fact = {
  category: string
  fact_key: string
  fact_value: string
  evidence_quote: string
  page_url: string
  confidence: number
}

export type ReadinessRow = {
  question: string
  category: string
  intent_id?: string
  readiness: 'YES' | 'PARTIAL' | 'NO'
  evidence?: string
  reasons?: string[]
  expected_evidence?: string[]
  priority?: string
}

export type BlueprintSection = {
  key: string
  title: string
  purpose: string
  targetWords: string
  facts: { value: string; quote: string; page: string }[]
  answered: string[]
  toAnswer: string[]
  addThis: string[]
  status: 'built' | 'partial' | 'gap'
  factCount: number
}

export type Blueprint = {
  hotelName: string
  city: string
  recommendedUrl: string
  sections: BlueprintSection[]
  schema: { present: string[]; recommended: string[] }
  faqSeeds: string[]
  counts: { sectionsBuilt: number; sectionsPartial: number; sectionsGap: number; factsUsed: number }
}

type SectionDef = {
  key: string; title: string; purpose: string; targetWords: string
  factCats: string[]; readinessCats: string[]; kw?: RegExp; notOfferedKey?: string
}

const SECTION_DEFS: SectionDef[] = [
  { key: 'overview', title: 'Hotel overview', purpose: 'What the hotel is, in one clear factual paragraph.', targetWords: '150', factCats: ['identity', 'awards', 'trust'], readinessCats: ['overall', 'luxury'], kw: /(overall|why-stay|what-makes|positioning|luxury-positioning|boutique)/i },
  { key: 'best_for', title: 'Best for', purpose: 'Which guest types the hotel suits — the intent matcher.', targetWords: '200', factCats: [], readinessCats: [], kw: /(best-for|suitability|overall-fit)/i },
  { key: 'location', title: 'Location & getting here', purpose: 'Distances, transfers and what is nearby — a top AI filter.', targetWords: '200', factCats: ['location', 'transport', 'entities'], readinessCats: ['location'], kw: /(location|airport|transfer|transport|nearby|attraction|neighbourhood|distance)/i },
  { key: 'rooms', title: 'Rooms & suites', purpose: 'Types, size, occupancy and who each room suits.', targetWords: '300', factCats: ['rooms'], readinessCats: [], kw: /(room|suite|accommodation|villa|occupancy|bed)/i },
  { key: 'dining', title: 'Dining', purpose: 'Named venues, cuisine and who each is for — with pricing.', targetWords: '300', factCats: ['dining'], readinessCats: ['dining'], kw: /(dining|restaurant|bar|brasserie|tea|cuisine|breakfast|menu)/i },
  { key: 'wellness', title: 'Wellness & spa', purpose: 'Spa facilities, treatments, hours and access.', targetWords: '250', factCats: ['spa', 'wellness'], readinessCats: ['spa'], kw: /(spa|wellness|treatment|thermal|massage|pool)/i, notOfferedKey: 'wellness' },
  { key: 'experiences', title: 'Experiences', purpose: 'Signature experiences and activities.', targetWords: '250', factCats: ['amenities', 'offers'], readinessCats: [], kw: /(experience|activit|offer|package|unique)/i },
  { key: 'family', title: 'Family travel', purpose: 'Family rooms, facilities and activities for children.', targetWords: '200', factCats: ['family'], readinessCats: ['family'], kw: /(family|kids|children|connecting)/i, notOfferedKey: 'family' },
  { key: 'romance', title: 'Romance & honeymoon', purpose: 'Couples positioning, suites, packages.', targetWords: '200', factCats: ['romantic', 'weddings'], readinessCats: ['romantic'], kw: /(romant|honeymoon|couple|wedding|anniversary)/i, notOfferedKey: 'romantic' },
  { key: 'business', title: 'Business, meetings & events', purpose: 'Meeting facilities, capacities, corporate services.', targetWords: '200', factCats: ['business', 'meetings'], readinessCats: ['business'], kw: /(business|meeting|conference|event|corporate|capacit)/i, notOfferedKey: 'business' },
  { key: 'policies', title: 'Policies & practical details', purpose: 'Cancellation, check-in, parking, pets, accessibility.', targetWords: '150', factCats: ['policies', 'parking', 'pets', 'accessibility'], readinessCats: ['parking', 'pets', 'accessibility'], kw: /(parking|pet|accessib|check-in|check-out|cancellation|policy)/i },
]

const SCHEMA_RECOMMENDED = ['Hotel', 'FAQPage', 'Place', 'Restaurant', 'Review', 'AggregateRating', 'BreadcrumbList']

function slugify(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)
}

function factMatches(f: Fact, def: SectionDef): boolean {
  const cat = (f.category || '').toLowerCase()
  return def.factCats.includes(cat)
}

function readinessMatches(r: ReadinessRow, def: SectionDef): boolean {
  const cat = (r.category || '').toLowerCase()
  if (def.readinessCats.includes(cat)) return true
  if (def.kw) {
    const blob = `${r.intent_id || ''} ${r.question || ''}`.toLowerCase()
    if (def.kw.test(blob)) return true
  }
  return false
}

export function buildBlueprint(
  facts: Fact[],
  auditResult: any,
  opts: { hotelName?: string; city?: string; notOffered?: string[] } = {}
): Blueprint {
  const hotelName = opts.hotelName || ''
  const city = opts.city || ''
  const notOffered = (opts.notOffered || []).map(s => String(s).toLowerCase())
  const readiness: ReadinessRow[] = (auditResult?.recommendation?.results || []) as ReadinessRow[]

  const sections: BlueprintSection[] = []
  let factsUsed = 0

  for (const def of SECTION_DEFS) {
    if (def.notOfferedKey && notOffered.includes(def.notOfferedKey)) continue

    const secFacts = facts
      .filter(f => factMatches(f, def))
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, 12)
      .map(f => ({ value: f.fact_value, quote: (f.evidence_quote || '').slice(0, 120), page: f.page_url || '' }))
    factsUsed += secFacts.length

    const secReadiness = readiness.filter(r => readinessMatches(r, def))
    const answered = secReadiness.filter(r => r.readiness === 'YES').map(r => r.question)
    const gaps = secReadiness.filter(r => r.readiness === 'NO' || r.readiness === 'PARTIAL')
    const toAnswer = gaps.map(r => r.question)

    const addSet = new Set<string>()
    for (const r of gaps) {
      for (const e of (r.expected_evidence || [])) addSet.add(e)
      for (const rz of (r.reasons || [])) addSet.add(rz)
    }
    const addThis = [...addSet].slice(0, 8)

    let status: BlueprintSection['status']
    if (def.key === 'best_for') {
      status = answered.length >= 2 ? 'built' : answered.length ? 'partial' : 'gap'
    } else if (secFacts.length === 0) {
      status = 'gap'
    } else if (gaps.length) {
      status = 'partial'
    } else {
      status = 'built'
    }

    sections.push({
      key: def.key, title: def.title, purpose: def.purpose, targetWords: def.targetWords,
      facts: secFacts, answered, toAnswer, addThis, status, factCount: secFacts.length,
    })
  }

  let schemaPresent: string[] = []
  try {
    const layers = auditResult?.architecture?.layers || auditResult?.pillars?.architecture?.layers || []
    const schemaLayer = layers.find((l: any) => l && (l.n === 12 || /schema/i.test(l.layer || '')))
    if (schemaLayer) schemaPresent = (schemaLayer.present || schemaLayer.evidence || []).filter((x: any) => typeof x === 'string')
  } catch {}
  const schemaRecommended = SCHEMA_RECOMMENDED.filter(s => !schemaPresent.includes(s))

  const failedQ = readiness.filter(r => r.readiness !== 'YES').map(r => r.question)
  const okQ = readiness.filter(r => r.readiness === 'YES').map(r => r.question)
  const faqSeeds = [...failedQ, ...okQ]

  const counts = {
    sectionsBuilt: sections.filter(s => s.status === 'built').length,
    sectionsPartial: sections.filter(s => s.status === 'partial').length,
    sectionsGap: sections.filter(s => s.status === 'gap').length,
    factsUsed,
  }

  return {
    hotelName, city,
    recommendedUrl: `/discover/${slugify(hotelName) || 'hotel-name'}`,
    sections, schema: { present: schemaPresent, recommended: schemaRecommended },
    faqSeeds, counts,
  }
}
