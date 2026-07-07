// ─── CANONICAL INTENT CATALOGUE ───
// SwissNet OWNS the demand model. GPT only evaluates whether the website answers each
// intent — it never invents, removes, renames, or merges them. This is the source of
// the stability, comparability, and historical trends the platform depends on.
//
// GROUNDING RULE: every intent here is real — drawn from L'Oscar's actual audited
// questions and the shipped INTENT_CATALOGUE enum. Nothing is plausible-sounding filler.
//
// STABILITY CONTRACT: an intent_id, once shipped, NEVER changes wording or id. Changing
// an id breaks historical comparison. Add new intents; never mutate existing ones.

export type IntentStage = 'discovery' | 'recommendation' | 'evaluation' | 'booking'
// discovery = reference only, measured by AI Visibility, NEVER website-scored.
// recommendation / evaluation / booking = website-scored: does the site give AI enough
// evidence to confidently justify recommending, then accurately explain, the hotel.

export interface CanonicalIntent {
  intent_id: string            // stable forever; key is `query:${category}:${intent_id}`
  category: string             // one of the audit's existing categories (CAT_MAP keys)
  stage: IntentStage
  traveller_intent: string     // the real traveller goal, in plain words
  audit_question: string       // what GPT is actually asked to grade the site against
  variations: string[]         // conversational ways travellers phrase this to AI
  expected_evidence: string[]  // the concrete things the site must show for a confident YES
  priority: 'high' | 'medium'
}

export interface ArchetypeCatalogue {
  archetype: string
  intents: CanonicalIntent[]
}

// ─── LUXURY CITY HOTEL — V3 recommendability model ───
// Intents grade RECOMMENDABILITY, not facts: does the site give AI enough evidence to
// justify recommending (Stage 2), then accurately explain (Stage 3), then confirm the
// practical pre-booking facts (Stage 4). Stage 1 (discovery) is reference-only — measured
// by AI Visibility, never website-scored (audit_question is empty by design).
const LUXURY_CITY: CanonicalIntent[] = [
  // ══ STAGE 1 — DISCOVERY (reference only; measured by AI Visibility, NEVER website-scored) ══
  { intent_id: 'disc-luxury-boutique', category: 'luxury', stage: 'discovery', traveller_intent: 'Find the best luxury boutique hotel in the city', audit_question: '', variations: ['best luxury boutique hotel London', 'top boutique hotel in London', 'best 5-star boutique hotel London'], expected_evidence: [], priority: 'high' },
  { intent_id: 'disc-romantic', category: 'romantic', stage: 'discovery', traveller_intent: 'Find the best romantic luxury hotel in the city', audit_question: '', variations: ['best romantic hotel London', 'luxury hotel for a romantic weekend London', 'best honeymoon hotel London'], expected_evidence: [], priority: 'high' },
  { intent_id: 'disc-food-lovers', category: 'dining', stage: 'discovery', traveller_intent: 'Find the best luxury hotel for food and dining', audit_question: '', variations: ['best hotel for food lovers London', 'luxury hotel with best restaurant London', 'best afternoon tea hotel London'], expected_evidence: [], priority: 'high' },
  { intent_id: 'disc-business', category: 'business', stage: 'discovery', traveller_intent: 'Find the best boutique hotel for business travellers', audit_question: '', variations: ['best boutique hotel for business London', 'luxury hotel for executive meetings London'], expected_evidence: [], priority: 'medium' },
  { intent_id: 'disc-near-landmark', category: 'location', stage: 'discovery', traveller_intent: 'Find a luxury hotel near a specific area or landmark', audit_question: '', variations: ['best luxury hotel near Covent Garden', 'boutique hotel near the British Museum', 'best hotel near Holborn'], expected_evidence: [], priority: 'high' },
  { intent_id: 'disc-character', category: 'luxury', stage: 'discovery', traveller_intent: 'Find a hotel with real character and atmosphere', audit_question: '', variations: ['boutique hotel with character London', 'historic luxury hotel London', 'most unique hotel in London'], expected_evidence: [], priority: 'medium' },
  { intent_id: 'disc-quiet-luxury', category: 'luxury', stage: 'discovery', traveller_intent: 'Find a quiet, refined luxury hotel in central London', audit_question: '', variations: ['quiet luxury hotel central London', 'peaceful luxury hotel London'], expected_evidence: [], priority: 'medium' },

  // ══ STAGE 2 — RECOMMENDATION EVIDENCE (website-scored: can the site JUSTIFY the recommendation?) ══
  { intent_id: 'rec-luxury-boutique', category: 'luxury', stage: 'recommendation', traveller_intent: 'Be recommended as a genuine luxury boutique hotel', audit_question: 'Does the website provide enough evidence for AI to confidently justify recommending this hotel as a luxury boutique hotel?', variations: ['Why is this a luxury boutique hotel?', 'Is this a real luxury boutique experience?'], expected_evidence: ['Specific design, heritage or architectural story (not just "luxury")', 'Concrete signature features that make it boutique', 'Named awards, recognition or distinctive credentials'], priority: 'high' },
  { intent_id: 'rec-differentiation', category: 'luxury', stage: 'recommendation', traveller_intent: 'Be chosen over other luxury hotels', audit_question: 'Does the website clearly explain why a traveller should choose this hotel over other luxury boutique hotels, with concrete reasons AI could cite?', variations: ['Why choose this over another luxury hotel?', 'What makes it different from competitors?'], expected_evidence: ['Explicit points of difference vs typical luxury hotels', 'Unique signature experiences only this hotel offers', 'Reasons stated as facts, not adjectives'], priority: 'high' },
  { intent_id: 'rec-atmosphere', category: 'luxury', stage: 'recommendation', traveller_intent: 'Be recommended for atmosphere and personality', audit_question: 'Does the website clearly demonstrate the hotel’s atmosphere, style and personality strongly enough for AI to describe the feel of a stay?', variations: ['What is the vibe of this hotel?', 'What is the atmosphere like?'], expected_evidence: ['Vivid, specific description of the design and mood', 'The kind of experience or feeling a stay delivers', 'Sensory or character detail beyond generic "elegant"'], priority: 'medium' },
  { intent_id: 'rec-romantic', category: 'romantic', stage: 'recommendation', traveller_intent: 'Be recommended for a romantic stay', audit_question: 'Does the website provide enough evidence for AI to confidently recommend this hotel for couples and romantic stays?', variations: ['Is this hotel good for couples?', 'Would AI suggest this for a romantic weekend?'], expected_evidence: ['Specific romantic experiences, packages or touches', 'Suites or rooms positioned for couples', 'Romantic dining or private experiences'], priority: 'medium' },
  { intent_id: 'rec-food-lovers', category: 'dining', stage: 'recommendation', traveller_intent: 'Be recommended for dining and food', audit_question: 'Does the website provide enough evidence for AI to recommend this hotel to someone choosing a hotel for its food and dining?', variations: ['Is this a good hotel for food lovers?', 'Would AI recommend it for the restaurant?'], expected_evidence: ['Each restaurant described with cuisine and character', 'What makes the dining distinctive or worth a visit', 'Signature experiences like afternoon tea or the bar'], priority: 'high' },
  { intent_id: 'rec-business', category: 'business', stage: 'recommendation', traveller_intent: 'Be recommended for business and meetings', audit_question: 'Does the website provide enough evidence for AI to confidently recommend this hotel for executive meetings and business stays?', variations: ['Is this a strong business hotel?', 'Would AI recommend it for a corporate meeting?'], expected_evidence: ['Meeting and event spaces with capacities', 'Why it suits business travellers specifically', 'Practical business signals (location, connectivity, services)'], priority: 'medium' },
  { intent_id: 'rec-location', category: 'location', stage: 'recommendation', traveller_intent: 'Be recommended for its location', audit_question: 'Does the website provide enough evidence for AI to recommend this hotel as exceptionally well-located, naming what makes the area and position desirable?', variations: ['Is the location good?', 'Why stay in this part of London?'], expected_evidence: ['Why the neighbourhood is desirable, named specifically', 'Named landmarks, attractions and distances', 'Transport connections stated concretely'], priority: 'high' },

  // ══ STAGE 3 — EVALUATION (website-scored: can AI accurately EXPLAIN the hotel?) ══
  { intent_id: 'eval-room-types', category: 'overall', stage: 'evaluation', traveller_intent: 'Understand the room options', audit_question: 'Does the website give AI enough to clearly explain the different room and suite types and who each suits?', variations: ['What room types are there?', 'Which room should I book?'], expected_evidence: ['Distinct room categories described', 'Size, view or occupancy detail', 'Who each room is best for'], priority: 'medium' },
  { intent_id: 'eval-premium-rooms', category: 'overall', stage: 'evaluation', traveller_intent: 'Understand the top suites', audit_question: 'Does the website let AI explain the hotel’s most premium accommodation and what makes it special?', variations: ['What is the best suite?', 'What is the top room?'], expected_evidence: ['Flagship suite(s) named and described', 'What distinguishes the premium rooms'], priority: 'medium' },
  { intent_id: 'eval-restaurants', category: 'dining', stage: 'evaluation', traveller_intent: 'Understand the dining venues', audit_question: 'Does the website let AI accurately explain the hotel’s restaurants and bar — cuisine, character and experience?', variations: ['What restaurants are there?', 'Where can I eat here?'], expected_evidence: ['Each venue named with cuisine type', 'The character or occasion each suits', 'Bar / lounge experience described'], priority: 'high' },
  { intent_id: 'eval-afternoon-tea', category: 'dining', stage: 'evaluation', traveller_intent: 'Understand the afternoon tea offering', audit_question: 'Does the website let AI explain the afternoon tea experience specifically?', variations: ['Is there afternoon tea?', 'What is the afternoon tea like?'], expected_evidence: ['Afternoon tea confirmed and described', 'What makes it distinctive'], priority: 'medium' },
  { intent_id: 'eval-meetings', category: 'business', stage: 'evaluation', traveller_intent: 'Understand meeting and event facilities', audit_question: 'Does the website let AI accurately explain the meeting and event facilities and capacities?', variations: ['What meeting spaces are there?', 'Can it host events?'], expected_evidence: ['Event spaces named', 'Capacities or configurations', 'Types of events supported'], priority: 'medium' },
  { intent_id: 'eval-weddings', category: 'business', stage: 'evaluation', traveller_intent: 'Understand wedding and private-event offerings', audit_question: 'Does the website let AI explain the hotel’s wedding and private-event capabilities?', variations: ['Can I get married here?', 'Does it host private events?'], expected_evidence: ['Wedding / private events confirmed', 'What the offering includes'], priority: 'medium' },
  { intent_id: 'eval-experiences', category: 'overall', stage: 'evaluation', traveller_intent: 'Understand unique experiences and packages', audit_question: 'Does the website let AI explain the unique experiences, packages or seasonal offerings that make a stay memorable?', variations: ['What experiences are offered?', 'Are there special packages?'], expected_evidence: ['Named signature experiences or packages', 'What makes them distinctive to this hotel'], priority: 'medium' },
  { intent_id: 'eval-location-detail', category: 'location', stage: 'evaluation', traveller_intent: 'Understand what is around the hotel', audit_question: 'Does the website let AI explain nearby attractions, what guests can do around the hotel, and transport connections?', variations: ['What is near the hotel?', 'What can I do nearby?', 'How do I get around?'], expected_evidence: ['Named nearby attractions', 'Transport options and distances', 'What guests can do in the area'], priority: 'high' },

  // ══ STAGE 4 — BOOKING CONFIDENCE (website-scored: practical pre-booking questions) ══
  { intent_id: 'book-accessibility', category: 'accessibility', stage: 'booking', traveller_intent: 'Confirm accessibility before booking', audit_question: 'Does the website let AI answer accessibility questions (accessible rooms, step-free access, lift)?', variations: ['Is it accessible?', 'Are there accessible rooms?'], expected_evidence: ['Accessibility provisions stated'], priority: 'high' },
  { intent_id: 'book-parking', category: 'parking', stage: 'booking', traveller_intent: 'Confirm parking before booking', audit_question: 'Does the website let AI answer parking questions (availability, valet, cost, EV charging)?', variations: ['Is there parking?', 'Can I park here?'], expected_evidence: ['Parking availability and type stated'], priority: 'high' },
  { intent_id: 'book-pets', category: 'pets', stage: 'booking', traveller_intent: 'Confirm pet policy before booking', audit_question: 'Does the website let AI answer whether pets are allowed and on what terms?', variations: ['Are pets allowed?', 'Is it pet-friendly?'], expected_evidence: ['Pet policy stated'], priority: 'high' },
  { intent_id: 'book-checkin', category: 'overall', stage: 'booking', traveller_intent: 'Confirm check-in/out and early/late options', audit_question: 'Does the website let AI answer check-in / check-out times and early/late options?', variations: ['What time is check-in?', 'Can I check in early?'], expected_evidence: ['Check-in and check-out times stated'], priority: 'medium' },
  { intent_id: 'book-cancellation', category: 'overall', stage: 'booking', traveller_intent: 'Understand cancellation and booking policy', audit_question: 'Does the website let AI answer cancellation and booking-policy questions?', variations: ['What is the cancellation policy?', 'Can I cancel?'], expected_evidence: ['Cancellation / booking policy stated'], priority: 'medium' },
  { intent_id: 'book-practical', category: 'overall', stage: 'booking', traveller_intent: 'Confirm everyday practical amenities', audit_question: 'Does the website let AI answer everyday practical questions — breakfast, Wi-Fi, concierge, luggage storage, airport transfers, room service?', variations: ['Is breakfast included?', 'Is there Wi-Fi?', 'Is there a concierge?', 'Is there an airport transfer?'], expected_evidence: ['Breakfast detail', 'Wi-Fi', 'Concierge / services', 'Airport transfer / luggage storage'], priority: 'medium' },
  { intent_id: 'rec-wellness', category: 'wellness', stage: 'recommendation', traveller_intent: 'Be recommended for a spa and wellness stay', audit_question: 'Does the website provide enough evidence for AI to confidently recommend this hotel for a spa or wellness-focused stay?', variations: ['Is this a good hotel for a spa stay?', 'Would AI recommend it for wellness?'], expected_evidence: ['Named spa or wellness facilities described', 'Signature treatments, programmes or wellness philosophy', 'What makes the wellness offering distinctive'], priority: 'high' },
  { intent_id: 'eval-spa-facilities', category: 'wellness', stage: 'evaluation', traveller_intent: 'Understand the spa and wellness facilities', audit_question: 'Does the website let AI accurately explain the spa and wellness facilities, treatments and programmes?', variations: ['What spa facilities are there?', 'What treatments are offered?'], expected_evidence: ['Facilities named (treatment rooms, pool, gym, thermal)', 'Treatment or programme types described', 'Size, setting or standout features stated'], priority: 'high' },
  { intent_id: 'book-spa-access', category: 'wellness', stage: 'booking', traveller_intent: 'Confirm spa access, hours and policy before booking', audit_question: 'Does the website let AI answer practical spa questions — opening hours, guest access, and whether non-residents can use it?', variations: ['What are the spa hours?', 'Is the spa open to non-residents?'], expected_evidence: ['Spa opening hours stated', 'Guest / non-resident access policy stated'], priority: 'medium' },
]

// ─── REGISTRY ───
// Un-profiled hotel or archetype with no catalogue → null → caller falls back to the
// existing GPT generator (current behaviour preserved; other hotels unaffected).
const CATALOGUES: Record<string, ArchetypeCatalogue> = {
  luxury_city: { archetype: 'luxury_city', intents: LUXURY_CITY },
}

export function getCatalogueForArchetype(archetype: string | null | undefined): ArchetypeCatalogue | null {
  if (!archetype) return null
  return CATALOGUES[archetype] || null
}

// Universal categories every hotel is scored on regardless of taxonomy (practical booking
// filters + overall). Experience-specific categories (wellness, romantic, business, ...) are
// only scored when the hotel's confirmed taxonomy actually offers them.
const UNIVERSAL_CATEGORIES = new Set(['overall', 'location', 'accessibility', 'parking', 'pets'])
export function intentsToEvaluate(archetype: string | null | undefined, excludeCategories: string[] = [], offeredExperiences?: string[]): CanonicalIntent[] {
  const cat = getCatalogueForArchetype(archetype)
  if (!cat) return []
  const ex = new Set(excludeCategories.map(s => s.toLowerCase()))
  const offered = offeredExperiences ? new Set(offeredExperiences.map(s => s.toLowerCase())) : null
  // Discovery intents are reference-only (measured by AI Visibility); never website-scored.
  return cat.intents.filter(i => {
    if (i.stage === 'discovery') return false
    const c = i.category.toLowerCase()
    if (ex.has(c)) return false
    // Taxonomy filter: when the hotel's offered experiences are known, keep an intent only if
    // it's a universal category or an experience this hotel actually offers. Omitted -> keep all.
    if (offered && !UNIVERSAL_CATEGORIES.has(c) && !offered.has(c)) return false
    return true
  })
}
// ─── GUEST-QUESTION LOOKUP ───
// Returns the first conversational variation (the real guest-phrased question) for an
// intent_id, across all catalogues. Used to surface "Why choose this over another luxury
// hotel?" instead of the internal intent label. Deterministic; never invents a question —
// returns null if the intent_id isn't found or has no variations.
const _QUESTION_BY_ID: Record<string, string> = (() => {
  const m: Record<string, string> = {}
  for (const cat of Object.values(CATALOGUES)) {
    for (const i of cat.intents) {
      if (i.intent_id && Array.isArray(i.variations) && i.variations.length) m[i.intent_id] = i.variations[0]
    }
  }
  return m
})()

export function guestQuestionForIntent(intentId: string | null | undefined): string | null {
  if (!intentId) return null
  return _QUESTION_BY_ID[intentId] || null
}