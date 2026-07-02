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
  steps: { instruction: string; hint: string; example: string }[]
  tier: 'core' | 'recommended' | 'optional'
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
  steps: { instruction: string; hint: string; example: string }[]
  tier: 'core' | 'recommended' | 'optional'
  faqs: (h: string, c: string) => string[]
  factCats: string[]; notOfferedKey?: string
}

const SECTION_DEFS: SectionDef[] = [
  { key: 'snapshot', title: 'Hotel snapshot', purpose: 'The essential facts, scannable in ten seconds.', tier: 'core',
    includes: ['Official hotel name, used consistently', 'Category and size, e.g. 40-room boutique hotel', 'Neighbourhood and city', 'Price band', 'Check-in and check-out times', 'Nearest station or airport with travel time', 'One line on accessibility'],
    steps: [
      { instruction: 'Lead with the essential facts, not a welcome message.', hint: 'Category, size, city and price band in the first lines. No storytelling here.', example: 'A 40-room luxury boutique hotel in central Lisbon, from EUR 320 per night.' },
      { instruction: 'State the arrival basics.', hint: 'Nearest station or airport with a real travel time.', example: 'Ten minutes from Rossio station; 25 minutes from the airport by car.' },
      { instruction: 'Use your exact official name every time.', hint: 'Pick one spelling of the hotel name and never vary it across the page.', example: "Always The Lumen Lisbon, never Lumen Hotel or Hotel Lumen." },
      { instruction: 'Add a one-line accessibility note.', hint: 'State it plainly, even if provision is limited.', example: 'Step-free entrance and two wheelchair-accessible rooms.' }
    ],
    faqs: (h, c) => [`How many rooms does ${h} have?`, `Where is ${h}?`, `How much does it cost to stay at ${h}?`, `What time is check-in at ${h}?`], factCats: ['identity', 'location', 'policies'] },

  { key: 'overview', title: 'Overview', purpose: 'What the hotel is, in one clear paragraph.', tier: 'core',
    includes: ['What kind of hotel it is: style, size and category', 'Where it is, in one line', 'Its distinctive design or heritage story', 'The signature features that define it', 'Who it is best for, in one line'],
    steps: [
      { instruction: 'Open by saying exactly what kind of hotel it is.', hint: 'Style, size and category, in the first sentence.', example: 'A 40-room boutique hotel set in a converted 1920s townhouse.' },
      { instruction: 'Place it in one line.', hint: 'Name the neighbourhood, not the city centre.', example: 'It sits in the Chiado district, a short walk from the waterfront.' },
      { instruction: 'Give it one distinctive fact.', hint: 'The design or heritage detail only your hotel can claim.', example: "The building was the city's first department store, now restored with its original ironwork." },
      { instruction: 'Close by saying who it is best for.', hint: 'One line. This is how AI decides which guest to recommend you to.', example: 'It suits couples and design-minded travellers who want character over a chain hotel.' }
    ],
    faqs: (h, c) => [`What kind of hotel is ${h}?`, `Is ${h} a boutique hotel?`, `What makes ${h} unique?`, `Is ${h} worth it?`], factCats: ['identity', 'awards', 'trust'] },

  { key: 'best_for', title: 'Who it is for', purpose: 'The guest types the hotel genuinely suits.', tier: 'core',
    includes: ['Each guest type you truly serve', 'One specific feature as the reason, not an adjective', 'Honesty about who it is not for'],
    steps: [
      { instruction: 'Name each guest type you genuinely serve.', hint: 'Couples, families, business, food lovers, culture seekers. Only the real ones.', example: 'Best for couples, food lovers and design enthusiasts.' },
      { instruction: 'Give each type one concrete reason.', hint: 'A specific feature, never an adjective. Not romantic, but why.', example: 'Ideal for couples thanks to the private rooftop suites with a plunge pool.' },
      { instruction: 'Be honest about who it is not for.', hint: 'Saying you are not right for a group builds more trust than claiming everyone.', example: 'Less suited to families with young children, as there are no connecting rooms.' }
    ],
    faqs: (h, c) => [`Who is ${h} best suited for?`, `Is ${h} good for couples?`, `Is ${h} good for business travellers?`, `Why choose ${h} over other hotels in ${c}?`], factCats: [] },

  { key: 'location', title: 'Location & getting here', purpose: 'Where it is and what is nearby.', tier: 'core',
    includes: ['Neighbourhood name, not the city centre', 'Nearest stations and walking times', 'Distance to the main airports', 'Named landmarks and attractions nearby', 'What the area is known for'],
    steps: [
      { instruction: 'Name the neighbourhood and street.', hint: 'A real place name is what AI matches a search to.', example: 'The hotel is in Chiado, on Rua Garrett.' },
      { instruction: 'Give real distances to real places.', hint: 'Name the nearest station, landmarks, and the airport, each with a time.', example: 'Two minutes from Baixa-Chiado metro; the Time Out Market is a five-minute walk.' },
      { instruction: 'Say what the area suits.', hint: 'Connect the location to a guest type.', example: 'A strong base for walkers and culture-focused travellers who want to skip taxis.' }
    ],
    faqs: (h, c) => [`Where is ${h} located?`, `What is near ${h}?`, `How do I get to ${h} from the airport?`, `Is the area around ${h} a good place to stay in ${c}?`], factCats: ['location', 'transport', 'entities'] },

  { key: 'accommodation', title: 'Accommodation', purpose: 'Room, suite or unit types, sizes and who each suits.', tier: 'core',
    includes: ['Total number of units', 'Each category with its size', 'What each type is best suited to', 'Standout in-room features', 'The signature or top unit'],
    steps: [
      { instruction: 'State the total and the categories.', hint: 'How many units in total, then each category by name.', example: 'Forty rooms across three types: Classic, Deluxe and the Rooftop Suite.' },
      { instruction: 'Give every category a real size.', hint: 'A size in square metres, and make sure it matches everywhere else you publish it.', example: 'Classic rooms are 24 square metres; the Rooftop Suite is 65.' },
      { instruction: 'Say who each type suits and one standout feature.', hint: 'Match rooms to guests, and name the feature that makes each special.', example: 'The Rooftop Suite suits couples, with a private terrace over the old town.' }
    ],
    faqs: (h, c) => [`What are the room types at ${h}?`, `How big are the rooms at ${h}?`, `What is the best suite at ${h}?`, `Which room at ${h} is best for couples?`], factCats: ['rooms'] },

  { key: 'good_to_know', title: 'Good to know', purpose: 'The practical answers guests need before booking.', tier: 'core',
    includes: ['Check-in and check-out times', 'Cancellation policy', 'Parking options', 'Pet policy', 'A clear, honest accessibility statement'],
    steps: [
      { instruction: 'Answer the practical questions plainly.', hint: 'Check-in, check-out, cancellation, parking and pets, each in one line.', example: 'Check-in from 3pm, check-out by noon. Free cancellation up to 48 hours before arrival.' },
      { instruction: 'Give a specific accessibility statement.', hint: 'Be concrete, even if provision is limited. Vague helps no one.', example: 'Step-free lobby, a lift to all floors, and two rooms with roll-in showers.' },
      { instruction: 'Avoid contact-us dead-ends.', hint: 'If a guest has to email to learn a policy, AI cannot answer it either.', example: 'State the pet policy outright: dogs under 10kg welcome, EUR 30 per night.' }
    ],
    faqs: (h, c) => [`What time is check-in at ${h}?`, `What is the cancellation policy at ${h}?`, `Does ${h} have parking?`, `Is ${h} wheelchair accessible?`], factCats: ['policies', 'parking', 'pets', 'accessibility'] },

  { key: 'dining', title: 'Dining & bars', purpose: 'The venues, cuisine and who can eat there.', tier: 'recommended',
    includes: ['Each venue by name', 'The cuisine and style', 'Meal times served', 'Price range or signature dishes', 'Whether it is open to non-guests'],
    steps: [
      { instruction: 'Name every venue.', hint: 'Each restaurant and bar by name, never multiple dining options.', example: 'Two venues: Sal restaurant and the rooftop Lume bar.' },
      { instruction: 'State cuisine, hours and price.', hint: 'What kind of food, when it is served, and roughly what it costs.', example: 'Sal serves Portuguese seafood, dinner only, mains around EUR 28.' },
      { instruction: 'Say whether non-guests can book.', hint: 'This is a common, high-intent question. Answer it directly.', example: 'Both venues are open to the public with a reservation.' }
    ],
    faqs: (h, c) => [`Does ${h} have a restaurant?`, `What kind of food does ${h} serve?`, `Is the restaurant at ${h} open to non-guests?`, `Does ${h} serve afternoon tea?`], factCats: ['dining'] },

  { key: 'awards', title: 'Awards & recognition', purpose: 'The credentials that prove the hotel is what it claims.', tier: 'recommended',
    includes: ['Awards and the year received', 'Official star or quality rating', 'Notable press features', 'Memberships and affiliations'],
    steps: [
      { instruction: 'List real awards with the year.', hint: 'Name the award and when it was received. No vague award-winning.', example: 'Named in the Conde Nast Traveller Gold List, 2025.' },
      { instruction: 'State your rating and memberships.', hint: 'Official star rating and any collection or association you belong to.', example: 'A member of Design Hotels and a certified five-star property.' },
      { instruction: 'Keep it verifiable and current.', hint: 'Only list what can be checked, and remove anything expired.', example: 'Drop a 2019 award that is no longer relevant rather than padding the list.' }
    ],
    faqs: (h, c) => [`Is ${h} a 5-star hotel?`, `Has ${h} won awards?`, `Is ${h} well regarded?`], factCats: ['awards', 'trust'] },

  { key: 'guest_reviews', title: 'What guests say', purpose: 'An honest summary of what guests consistently praise.', tier: 'recommended',
    includes: ['The three or four things guests reliably mention', 'Written as themes, in your own words', 'No invented ratings or numbers'],
    steps: [
      { instruction: 'Summarise the recurring themes.', hint: 'The three or four things guests genuinely and repeatedly mention.', example: 'Guests consistently praise the service, the rooftop views and the breakfast.' },
      { instruction: 'Write it in your own words.', hint: 'Themes, not a single cherry-picked quote.', example: 'Frame it as what guests value, rather than pasting one five-star review.' },
      { instruction: 'Never invent a score.', hint: 'Do not state a rating or number you have not earned and cannot back.', example: 'Say guests rate the location highly, not a made-up 9.4 out of 10.' }
    ],
    faqs: (h, c) => [`What do people say about ${h}?`, `Is ${h} a good hotel?`, `What is ${h} known for?`], factCats: ['trust'] },

  { key: 'sustainability', title: 'Sustainability', purpose: 'The hotel real environmental and social practices.', tier: 'recommended',
    includes: ['Recognised certifications', 'Concrete practices in energy, water and sourcing', 'What is genuinely in place, nothing aspirational'],
    steps: [
      { instruction: 'Name real certifications.', hint: 'Only recognised, current certifications. No self-awarded green badges.', example: 'Certified by Green Key since 2023.' },
      { instruction: 'Give concrete practices.', hint: 'Specific actions in energy, water, sourcing or community.', example: 'Solar hot water, refillable amenities, and produce from a farm 20km away.' },
      { instruction: 'Avoid greenwashing.', hint: 'If there is nothing real to say, leave the section out rather than pad it.', example: 'Skip we care about the planet if no practice sits behind it.' }
    ],
    faqs: (h, c) => [`Is ${h} eco-friendly?`, `Does ${h} have sustainability certifications?`, `Is ${h} a green hotel?`], factCats: ['sustainability'] },

  { key: 'experiences', title: 'Experiences & activities', purpose: 'Signature experiences and anything without its own section.', tier: 'recommended',
    includes: ['Named signature experiences', 'What each one includes', 'Who they are best for', 'How to book or arrange them'],
    steps: [
      { instruction: 'Name each signature experience.', hint: 'Real, named experiences, not activities available.', example: 'A guided old-town food walk and a private port-tasting evening.' },
      { instruction: 'Say what each includes and who it suits.', hint: 'What the guest gets, and the guest type it is for.', example: 'The food walk runs three hours, best for first-time visitors.' },
      { instruction: 'Explain how to book.', hint: 'Tell the guest how to arrange it.', example: 'Arranged through the concierge, 24 hours ahead.' }
    ],
    faqs: (h, c) => [`What experiences does ${h} offer?`, `What is there to do at ${h}?`, `Does ${h} offer packages?`], factCats: ['amenities', 'offers', 'experiences'] },

  { key: 'wellness', title: 'Spa & wellness', purpose: 'Spa facilities, treatments and access.', tier: 'optional',
    includes: ['The spa and wellness facilities', 'Signature treatments', 'Opening hours', 'Whether day passes are available', 'Pool, sauna or thermal features'],
    steps: [
      { instruction: 'Describe the facilities.', hint: 'Treatment rooms, pool, thermal areas, gym.', example: 'A spa with four treatment rooms, an indoor pool and a hammam.' },
      { instruction: 'Name signature treatments and hours.', hint: 'A few named treatments and when the spa is open.', example: 'Open 9am to 8pm; the signature 90-minute ritual uses local sea salt.' },
      { instruction: 'Say who can use it.', hint: 'Guests only, or day passes for non-guests?', example: 'Day passes available for non-guests, subject to availability.' }
    ],
    faqs: (h, c) => [`Does ${h} have a spa?`, `What treatments does the spa at ${h} offer?`, `Can I use the spa at ${h} without staying?`], factCats: ['spa', 'wellness'], notOfferedKey: 'wellness' },

  { key: 'business', title: 'Meetings & events', purpose: 'Meeting and event spaces and capacities.', tier: 'optional',
    includes: ['Each space with capacity', 'Equipment and services provided', 'Corporate rates or benefits', 'Transport links'],
    steps: [
      { instruction: 'List each space with a capacity.', hint: 'Name the room and how many it seats. Numbers matter.', example: 'The Garrett room seats 60 theatre-style or 40 for dinner.' },
      { instruction: 'State what is provided.', hint: 'Equipment, catering and services included.', example: 'AV, high-speed wifi and a dedicated events coordinator.' },
      { instruction: 'Add the practical draws.', hint: 'Corporate benefits and transport links for organisers.', example: 'Ten minutes from the business district and 25 from the airport.' }
    ],
    faqs: (h, c) => [`Does ${h} have meeting rooms?`, `Can ${h} host events?`, `Is ${h} good for business travel?`], factCats: ['business', 'meetings'], notOfferedKey: 'business' },

  { key: 'family', title: 'Families & kids', purpose: 'Family rooms and facilities for children.', tier: 'optional',
    includes: ['Family and connecting rooms', 'Facilities for children', 'Activities and services for families', 'Age suitability'],
    steps: [
      { instruction: 'State the family accommodation.', hint: 'Family rooms, connecting options, cots.', example: 'Six connecting rooms and family suites sleeping up to four.' },
      { instruction: 'List real facilities for children.', hint: 'Specific facilities, not just family-friendly.', example: 'A kids pool, high chairs, and a children menu at breakfast.' },
      { instruction: 'Give age guidance.', hint: 'Who it genuinely suits by age.', example: 'Best for families with children aged 4 and up.' }
    ],
    faqs: (h, c) => [`Is ${h} family friendly?`, `Does ${h} have family rooms?`, `Is ${h} suitable for children?`], factCats: ['family'], notOfferedKey: 'family' },

  { key: 'romance', title: 'Romance & honeymoons', purpose: 'Couples positioning and packages.', tier: 'optional',
    includes: ['Suites and rooms suited to couples', 'Romantic packages or inclusions', 'Private dining options', 'Why the setting suits a romantic stay'],
    steps: [
      { instruction: 'Point to the couples accommodation.', hint: 'The rooms and suites that suit a romantic stay.', example: 'The Rooftop Suite has a private terrace and a freestanding bath.' },
      { instruction: 'Describe real packages.', hint: 'What a romantic or honeymoon package actually includes.', example: 'The honeymoon package adds champagne on arrival and a private dinner.' },
      { instruction: 'Say why the setting fits.', hint: 'The concrete reason, not the word romantic.', example: 'Adults-focused and quiet, with candlelit dining on the terrace.' }
    ],
    faqs: (h, c) => [`Is ${h} good for a romantic getaway?`, `Is ${h} good for honeymoons?`, `Does ${h} have romantic packages?`], factCats: ['romantic', 'weddings'], notOfferedKey: 'romantic' },

  { key: 'beach', title: 'Beach & water', purpose: 'Beach access, pool club and water sports.', tier: 'optional',
    includes: ['The beach: private or public, and distance', 'Pool or beach club', 'Water activities offered', 'Seasons'],
    steps: [
      { instruction: 'Describe the beach honestly.', hint: 'Private or public, and how far. Do not imply beachfront if it is a drive.', example: 'A private beach directly in front of the resort, 100 metres from the rooms.' },
      { instruction: 'Cover the pool or beach club.', hint: 'What the club offers and its hours.', example: 'A beach club with loungers, a bar and daytime DJ sets in summer.' },
      { instruction: 'List water activities and seasons.', hint: 'Named activities and when they run.', example: 'Kayaking and paddleboarding from May to October.' }
    ],
    faqs: (h, c) => [`Is ${h} on the beach?`, `Does ${h} have a beach club?`, `What water sports are available at ${h}?`], factCats: ['beach', 'water', 'pool'], notOfferedKey: 'beach' },

  { key: 'ski', title: 'Ski & mountain', purpose: 'Ski access and mountain activities.', tier: 'optional',
    includes: ['Ski-in ski-out or distance to lifts', 'Equipment and storage', 'The resort and its runs', 'Seasons'],
    steps: [
      { instruction: 'State the ski access precisely.', hint: 'Ski-in ski-out, or the real distance to the nearest lift.', example: 'Ski-in ski-out, with a piste running past the terrace.' },
      { instruction: 'Cover equipment and storage.', hint: 'Rental, a ski room, boot warmers.', example: 'A heated ski room with boot warmers and on-site rental.' },
      { instruction: 'Name the resort and season.', hint: 'The ski area, its runs, and when it operates.', example: 'Access to 200km of runs in the Portes du Soleil, December to April.' }
    ],
    faqs: (h, c) => [`Is ${h} ski-in ski-out?`, `How far are the lifts from ${h}?`, `Is ${h} good for a ski holiday?`], factCats: ['ski', 'mountain'], notOfferedKey: 'ski' },

  { key: 'golf', title: 'Golf', purpose: 'On-site or affiliated golf.', tier: 'optional',
    includes: ['The course: holes, designer, par', 'Green fees or packages', 'Practice facilities', 'Guest access'],
    steps: [
      { instruction: 'Describe the course.', hint: 'Holes, par, and the designer if notable.', example: 'An 18-hole championship course, par 72, designed by a well-known architect.' },
      { instruction: 'State fees and packages.', hint: 'Green fees or stay-and-play packages.', example: 'Guests receive discounted green fees and a stay-and-play rate.' },
      { instruction: 'Cover practice and access.', hint: 'Driving range, pro shop, and how guests book.', example: 'A driving range and pro shop, with tee times bookable at reception.' }
    ],
    faqs: (h, c) => [`Does ${h} have a golf course?`, `What is the golf course at ${h} like?`, `Are there golf packages at ${h}?`], factCats: ['golf'], notOfferedKey: 'golf' },

  { key: 'safari', title: 'Safari & wildlife', purpose: 'Game viewing and the surrounding reserve.', tier: 'optional',
    includes: ['The reserve', 'Wildlife present', 'Game drives and guides', 'Seasons and what is included'],
    steps: [
      { instruction: 'Name the reserve and wildlife.', hint: 'The specific reserve and the species guests can expect.', example: 'Set in a private reserve with lion, elephant and leopard.' },
      { instruction: 'Describe the game drives.', hint: 'How often they run and who guides them.', example: 'Two daily drives with expert trackers in open vehicles.' },
      { instruction: 'Cover seasons and inclusions.', hint: 'Best time to visit and what the rate includes.', example: 'Drives, meals and park fees included; best wildlife viewing June to October.' }
    ],
    faqs: (h, c) => [`What animals can I see at ${h}?`, `Are game drives included at ${h}?`, `When is the best time to visit ${h}?`], factCats: ['safari', 'wildlife'], notOfferedKey: 'safari' }
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
    if (def.tier === 'optional' && secFacts.length === 0) continue
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
      steps: def.steps, tier: def.tier,
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
