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

export type IntentStage = 'evaluation' | 'booking'
// 'discovery' and 'comparison' are intentionally NOT in the audit catalogue: Discovery is
// measured from real AI-appearance data (Layer 1), Comparison stays unscored until real
// AI-comparison testing exists. The audit evaluates evaluation + booking only.

export interface CanonicalIntent {
  intent_id: string          // stable forever; key is `query:${category}:${intent_id}`
  category: string           // MUST be one of the audit's existing categories (CAT_MAP keys)
  stage: IntentStage
  canonical_question: string
  alt_phrasings: string[]
  priority: 'high' | 'medium'
}

export interface ArchetypeCatalogue {
  archetype: string
  intents: CanonicalIntent[]
}

// ─── LUXURY CITY HOTEL — seeded from L'Oscar's 30 real audited questions ───
const LUXURY_CITY: CanonicalIntent[] = [
  // EVALUATION: Luxury
  { intent_id: 'luxury-positioning', category: 'luxury', stage: 'evaluation', canonical_question: 'What makes this a luxury boutique hotel?', alt_phrasings: ['Why is this hotel luxurious?', 'What makes it boutique?', 'Is this a good luxury boutique hotel in the city?'], priority: 'high' },
  { intent_id: 'luxury-amenities', category: 'luxury', stage: 'evaluation', canonical_question: 'What luxury amenities does the hotel offer?', alt_phrasings: ['What high-end facilities are available?', 'What premium services does it provide?'], priority: 'medium' },
  { intent_id: 'what-makes-special', category: 'luxury', stage: 'evaluation', canonical_question: 'What makes this hotel distinctive?', alt_phrasings: ['Why choose this hotel over others?', 'What sets it apart?'], priority: 'medium' },

  // EVALUATION: Dining
  { intent_id: 'restaurants-overview', category: 'dining', stage: 'evaluation', canonical_question: 'What dining options are available at the hotel?', alt_phrasings: ['What restaurants are at the hotel?', 'Where can I eat at the hotel?'], priority: 'high' },
  { intent_id: 'afternoon-tea', category: 'dining', stage: 'evaluation', canonical_question: 'Does the hotel offer afternoon tea?', alt_phrasings: ['Is afternoon tea served here?', 'Can I have afternoon tea at the hotel?'], priority: 'medium' },
  { intent_id: 'bar-lounge', category: 'dining', stage: 'evaluation', canonical_question: 'Is there a bar or lounge at the hotel?', alt_phrasings: ['Is there a place to enjoy a drink?', 'Does the hotel have a cocktail bar?'], priority: 'medium' },
  { intent_id: 'fine-dining', category: 'dining', stage: 'evaluation', canonical_question: 'What is the fine dining experience like at the hotel?', alt_phrasings: ['Does the hotel have a notable restaurant?', 'Is there gourmet dining?'], priority: 'high' },

  // EVALUATION: Business & events
  { intent_id: 'meeting-rooms', category: 'business', stage: 'evaluation', canonical_question: 'Does the hotel have meeting and event spaces?', alt_phrasings: ['Can I host a business meeting here?', 'Are there conference facilities?'], priority: 'high' },
  { intent_id: 'event-spaces', category: 'business', stage: 'evaluation', canonical_question: 'Can the hotel host weddings or private events?', alt_phrasings: ['Can I book a wedding here?', 'Are there private event spaces?', 'Is this a good wedding venue?'], priority: 'medium' },

  // EVALUATION: Romantic
  { intent_id: 'couples-suitability', category: 'romantic', stage: 'evaluation', canonical_question: 'Is the hotel suitable for a romantic getaway?', alt_phrasings: ['Is this hotel good for couples?', 'Is it good for an anniversary?'], priority: 'medium' },
  { intent_id: 'romantic-packages', category: 'romantic', stage: 'evaluation', canonical_question: 'Does the hotel offer romantic packages for couples?', alt_phrasings: ['Are there honeymoon packages?', 'Are there couples experiences?'], priority: 'medium' },

  // EVALUATION: Family
  { intent_id: 'family-suitability', category: 'family', stage: 'evaluation', canonical_question: 'Is the hotel family-friendly?', alt_phrasings: ['Is this hotel good for families with children?', 'Does it welcome families?'], priority: 'medium' },
  { intent_id: 'family-rooms', category: 'family', stage: 'evaluation', canonical_question: 'Does the hotel have rooms suitable for families?', alt_phrasings: ['Are there family or connecting rooms?', 'Can families stay together?'], priority: 'medium' },
  { intent_id: 'family-packages', category: 'family', stage: 'evaluation', canonical_question: 'Does the hotel offer family packages or deals?', alt_phrasings: ['Are there family deals?', 'Are there packages for families?'], priority: 'medium' },

  // EVALUATION: Location
  { intent_id: 'nearby-attractions', category: 'location', stage: 'evaluation', canonical_question: 'What attractions are near the hotel?', alt_phrasings: ['How close is the hotel to major attractions?', 'What is nearby?'], priority: 'high' },
  { intent_id: 'public-transport', category: 'location', stage: 'evaluation', canonical_question: 'How well connected is the hotel to public transport?', alt_phrasings: ['How far is the hotel from public transport?', 'How do I get around from the hotel?'], priority: 'medium' },

  // EVALUATION: Rooms & overall
  { intent_id: 'rooms-overview', category: 'overall', stage: 'evaluation', canonical_question: 'What types of rooms are available at the hotel?', alt_phrasings: ['What room categories does the hotel have?', 'What accommodation is offered?'], priority: 'medium' },
  { intent_id: 'unique-experiences', category: 'overall', stage: 'evaluation', canonical_question: 'Does the hotel offer any unique experiences or packages?', alt_phrasings: ['Are there special experiences?', 'What makes a stay here memorable?'], priority: 'medium' },
  { intent_id: 'offers-packages', category: 'overall', stage: 'evaluation', canonical_question: 'What offers or packages are available at the hotel?', alt_phrasings: ['Are there current deals?', 'What special offers does the hotel have?'], priority: 'medium' },

  // BOOKING CONFIDENCE: practical facts
  { intent_id: 'accessibility', category: 'accessibility', stage: 'booking', canonical_question: 'Is the hotel accessible for guests with disabilities?', alt_phrasings: ['Are there accessible rooms?', 'Is there step-free access?', 'What accessibility features are there?'], priority: 'high' },
  { intent_id: 'parking-availability', category: 'parking', stage: 'booking', canonical_question: 'Does the hotel provide parking?', alt_phrasings: ['Is there parking available?', 'Does the hotel have parking facilities?'], priority: 'high' },
  { intent_id: 'pet-policy', category: 'pets', stage: 'booking', canonical_question: 'Are pets allowed at the hotel?', alt_phrasings: ['Is the hotel pet-friendly?', 'What is the pet policy?'], priority: 'high' },
  { intent_id: 'check-in-out', category: 'overall', stage: 'booking', canonical_question: 'What are the check-in and check-out times?', alt_phrasings: ['When can I check in?', 'What time is check-out?'], priority: 'medium' },
  { intent_id: 'cancellation', category: 'overall', stage: 'booking', canonical_question: 'What is the cancellation policy?', alt_phrasings: ['Can I cancel my booking?', 'Is the rate refundable?'], priority: 'medium' },
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

export function intentsToEvaluate(archetype: string | null | undefined, excludeCategories: string[] = []): CanonicalIntent[] {
  const cat = getCatalogueForArchetype(archetype)
  if (!cat) return []
  const ex = new Set(excludeCategories.map(s => s.toLowerCase()))
  return cat.intents.filter(i => !ex.has(i.category.toLowerCase()))
}