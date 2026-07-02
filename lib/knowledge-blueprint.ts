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
  includes: string[]
  sectionFaqs: string[]
  facts: { value: string; quote: string; page: string }[]
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
  key: string; title: string; purpose: string
  includes: string[]
  faqs: (h: string, c: string) => string[]
  factCats: string[]; notOfferedKey?: string
}

const SECTION_DEFS: SectionDef[] = [
  { key: 'overview', title: 'Hotel overview', purpose: 'What the hotel is, in one clear paragraph.', includes: ['What kind of hotel it is: style, size and category', 'Where it is, in one line', 'Its distinctive design or heritage story', 'The signature features that define it', 'Who it is best for, in one line'], faqs: (h, c) => [`What kind of hotel is ${h}?`, `Is ${h} a boutique hotel?`, `What makes ${h} unique?`, `Is ${h} worth it?`], factCats: ['identity', 'awards', 'trust'] },
  { key: 'best_for', title: 'Best for', purpose: 'The guest types the hotel genuinely suits.', includes: ['Couples and romantic stays', 'Food and dining lovers', 'Culture, museum and theatre guests', 'Business and meeting travellers', 'Design and architecture enthusiasts', 'For each type, give one real reason: a specific feature, not an adjective'], faqs: (h, c) => [`Who is ${h} best suited for?`, `Is ${h} good for couples?`, `Is ${h} good for business travellers?`, `Why choose ${h} over other luxury hotels in ${c}?`], factCats: [] },
  { key: 'location', title: 'Location & getting here', purpose: 'Where it is and what is nearby.', includes: ['Exact address and neighbourhood', 'Nearest stations and walking times', 'Distance to the main airports', 'Named landmarks and attractions nearby', 'What the area is known for'], faqs: (h, c) => [`Where is ${h} located?`, `What is near ${h}?`, `How do I get to ${h} from the airport?`, `Is the area around ${h} a good place to stay in ${c}?`], factCats: ['location', 'transport', 'entities'] },
  { key: 'rooms', title: 'Rooms & suites', purpose: 'Room types, sizes and who each suits.', includes: ['How many rooms and suites in total', 'Each room category with its size', 'What each type is best suited to', 'Standout in-room features', 'The signature or top suite'], faqs: (h, c) => [`What are the room types at ${h}?`, `How big are the rooms at ${h}?`, `What is the best suite at ${h}?`, `Which room at ${h} is best for couples?`], factCats: ['rooms'] },
  { key: 'dining', title: 'Dining', purpose: 'The venues, cuisine and pricing.', includes: ['Each venue by name', 'The cuisine and style', 'Meal times served', 'Price range or signature dishes', 'Whether it is open to non-guests'], faqs: (h, c) => [`Does ${h} have a restaurant?`, `What kind of food does ${h} serve?`, `Is the restaurant at ${h} open to non-guests?`, `Does ${h} serve afternoon tea?`], factCats: ['dining'] },
  { key: 'wellness', title: 'Wellness & spa', purpose: 'Spa facilities, treatments and access.', includes: ['The spa and wellness facilities', 'Treatments and services offered', 'Opening hours', 'Whether day passes are available', 'Pool, sauna or thermal features'], faqs: (h, c) => [`Does ${h} have a spa?`, `What treatments does the spa at ${h} offer?`, `Can I use the spa at ${h} without staying?`], factCats: ['spa', 'wellness'], notOfferedKey: 'wellness' },
  { key: 'experiences', title: 'Experiences', purpose: 'Signature experiences and activities.', includes: ['Named signature experiences', 'What each one includes', 'Who they are best for', 'How to book or arrange them'], faqs: (h, c) => [`What experiences does ${h} offer?`, `What is there to do at ${h}?`, `Does ${h} offer packages?`], factCats: ['amenities', 'offers'] },
  { key: 'family', title: 'Family travel', purpose: 'Family rooms and facilities for children.', includes: ['Family rooms and connecting options', 'Facilities for children', 'Activities and services for families', 'Age suitability'], faqs: (h, c) => [`Is ${h} family friendly?`, `Does ${h} have family rooms?`, `Is ${h} suitable for children?`], factCats: ['family'], notOfferedKey: 'family' },
  { key: 'romance', title: 'Romance & honeymoon', purpose: 'Couples positioning and packages.', includes: ['Suites and rooms suited to couples', 'Romantic packages or inclusions', 'Private dining options', 'Why the setting suits a romantic stay'], faqs: (h, c) => [`Is ${h} good for a romantic getaway?`, `Is ${h} good for honeymoons?`, `Does ${h} have romantic packages?`], factCats: ['romantic', 'weddings'], notOfferedKey: 'romantic' },
  { key: 'business', title: 'Business, meetings & events', purpose: 'Meeting facilities and capacities.', includes: ['Meeting and event spaces with capacities', 'Equipment and services provided', 'Corporate rates or benefits', 'Distance to airports and transport'], faqs: (h, c) => [`Does ${h} have meeting rooms?`, `Can ${h} host events?`, `Is ${h} good for business travel?`], factCats: ['business', 'meetings'], notOfferedKey: 'business' },
  { key: 'policies', title: 'Policies & practical details', purpose: 'The practical answers guests need.', includes: ['Check-in and check-out times', 'Cancellation policy', 'Parking options', 'Pet policy', 'Accessibility features'], faqs: (h, c) => [`What time is check-in at ${h}?`, `What is the cancellation policy at ${h}?`, `Does ${h} have parking?`, `Is ${h} wheelchair accessible?`], factCats: ['policies', 'parking', 'pets', 'accessibility'] },
]

const SCHEMA_RECOMMENDED = ['Hotel', 'FAQPage', 'Place', 'Restaurant', 'Review', 'AggregateRating', 'BreadcrumbList']

function slugify(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)
}

function factMatches(f: Fact, def: SectionDef): boolean {
  const cat = (f.category || '').toLowerCase()
  return def.factCats.includes(cat)
}

export function buildBlueprint(
  facts: Fact[],
  auditResult: any,
  opts: { hotelName?: string; city?: string; notOffered?: string[]; blueprintFaqs?: string[] } = {}
): Blueprint {
  const hotelName = opts.hotelName || ''
  const city = opts.city || ''
  const H = hotelName || 'this hotel'
  const C = city || 'the city'
  const notOffered = (opts.notOffered || []).map(s => String(s).toLowerCase())

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

    let status: BlueprintSection['status']
    if (def.key === 'best_for') {
      status = 'partial'
    } else if (secFacts.length === 0) {
      status = 'gap'
    } else if (secFacts.length < 4) {
      status = 'partial'
    } else {
      status = 'built'
    }

    sections.push({
      key: def.key, title: def.title, purpose: def.purpose, includes: def.includes,
      sectionFaqs: def.faqs(H, C),
      facts: secFacts, status, factCount: secFacts.length,
    })
  }

  let schemaPresent: string[] = []
  try {
    const layers = auditResult?.architecture?.layers || auditResult?.pillars?.architecture?.layers || []
    const schemaLayer = layers.find((l: any) => l && (l.n === 12 || /schema/i.test(l.layer || '')))
    if (schemaLayer) schemaPresent = (schemaLayer.present || schemaLayer.evidence || []).filter((x: any) => typeof x === 'string')
  } catch {}
  const schemaRecommended = SCHEMA_RECOMMENDED.filter(s => !schemaPresent.includes(s))

  const faqSeeds = Array.isArray(opts.blueprintFaqs) ? opts.blueprintFaqs : []

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
