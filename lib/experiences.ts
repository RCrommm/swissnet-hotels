// lib/experiences.ts
// ─── THE EXPERIENCE REGISTRY ───
// The single place that defines every experience the platform understands. Each entry
// declares: how the Knowledge Graph CONFIRMS it (kgTopics + minFacts gate), its visibility
// dimension, its audit intent, and seeds for question generation. The archetype/taxonomy
// detector reads `kgTopics`/`minFacts` to decide (from CONFIRMED facts only) whether a hotel
// genuinely offers an experience — GPT never promotes an experience the facts don't support.
//
// DISCIPLINE: luxury-city experiences are fully defined (validated against L'Oscar).
// mountain/beach/golf/ski are STUBS (status:'unverified') — structure only, no demand logic,
// until a REAL hotel of that type is crawled and validates them. Adding a hotel type later =
// promoting a stub to a real definition + crawl + owner-confirm, never a pipeline change.

export type ExperienceStatus = 'verified' | 'unverified'

export interface ExperienceDef {
  key: string
  label: string
  status: ExperienceStatus
  // KG topics whose confirmed facts establish this experience genuinely exists.
  kgTopics: string[]
  // Minimum confirmed facts (across kgTopics) for the detector to PROPOSE this as offered.
  minFacts: number
  // Visibility-dimension wiring (mirrors lib/visibility-model.ts dimension shape).
  dimension: { factCats: string; pageKey: string; qCat: string; hygiene?: boolean } | null
  // Audit intent key (mirrors hotel-audit PRIORITY/blueprint keys) — null if no intent page.
  intentKey: string | null
  // Seeds handed to the question generator so it asks the RIGHT questions for this experience.
  questionSeeds: string[]
  // Archetypes for which this experience is commonly PRIMARY (a hint, never a guarantee —
  // the KG fact gate is what actually decides; this only shapes ordering/expectations).
  commonFor: string[]
}

// ── LUXURY-CITY SET — fully defined, validated against L'Oscar ──
const VERIFIED: ExperienceDef[] = [
  {
    key: 'luxury', label: 'Luxury & positioning', status: 'verified',
    kgTopics: ['rooms', 'identity'], minFacts: 4,
    dimension: { factCats: '(identity|awards|trust|amenities|rooms)', pageKey: '(home|about|rooms?|suites?|accommodation)', qCat: '(luxury|overall)' },
    intentKey: 'luxury',
    questionSeeds: ['best luxury hotel in {area}', 'what makes {hotel} a luxury hotel', 'luxury boutique hotel near {landmark}'],
    commonFor: ['luxury_city', 'boutique', 'wellness_resort', 'mountain_resort', 'beach_resort', 'country_house'],
  },
  {
    key: 'dining', label: 'Dining', status: 'verified',
    kgTopics: ['dining'], minFacts: 3,
    dimension: { factCats: '(dining|restaurant|bar)', pageKey: '(restaurant|dining|bar|brasserie|afternoon)', qCat: '(dining)' },
    intentKey: 'dining',
    questionSeeds: ['best hotel restaurant in {area}', 'afternoon tea in {area}', 'fine dining at {hotel}', 'hotel bar in {area}'],
    commonFor: ['luxury_city', 'boutique', 'wellness_resort', 'mountain_resort', 'beach_resort', 'country_house', 'conference'],
  },
  {
    key: 'business', label: 'Business & meetings', status: 'verified',
    kgTopics: ['meetings'], minFacts: 3,
    dimension: { factCats: '(business|meeting)', pageKey: '(meeting|event|conference|baptist|business)', qCat: '(business)' },
    intentKey: 'business',
    questionSeeds: ['meeting venue in {area}', 'event space at {hotel}', 'business hotel near {landmark}', 'conference hotel {area}'],
    commonFor: ['luxury_city', 'conference', 'airport'],
  },
  {
    key: 'location', label: 'Location', status: 'verified',
    kgTopics: ['location'], minFacts: 3,
    dimension: { factCats: '(location|transport|entities)', pageKey: '(location|neighbourhood|directions)', qCat: '(location)' },
    intentKey: 'location',
    questionSeeds: ['hotel near {landmark}', 'how to get to {hotel}', 'hotel near {station} station', 'best area to stay in {area}'],
    commonFor: ['luxury_city', 'boutique', 'airport', 'conference'],
  },
  {
    key: 'romantic', label: 'Romantic & weddings', status: 'verified',
    kgTopics: ['weddings'], minFacts: 3,
    dimension: { factCats: '(romantic|wedding)', pageKey: '(wedding|romantic|honeymoon|civil)', qCat: '(romantic)' },
    intentKey: 'romantic',
    questionSeeds: ['romantic hotel in {area}', 'wedding venue at {hotel}', 'honeymoon hotel {area}', 'hotel for couples in {area}'],
    commonFor: ['luxury_city', 'boutique', 'country_house', 'beach_resort'],
  },
  {
    key: 'family', label: 'Family', status: 'verified',
    kgTopics: ['family'], minFacts: 3,
    dimension: { factCats: '(family)', pageKey: '(family|kids|children)', qCat: '(family)' },
    intentKey: 'family',
    questionSeeds: ['family hotel in {area}', 'family friendly hotel near {landmark}', 'connecting rooms at {hotel}', 'hotel for families with children {area}'],
    commonFor: ['mountain_resort', 'beach_resort', 'country_house'],
  },
  {
    key: 'wellness', label: 'Wellness & spa', status: 'verified',
    kgTopics: ['spa'], minFacts: 3,
    dimension: { factCats: '(spa|wellness)', pageKey: '(spa|wellness)', qCat: '(spa)' },
    intentKey: 'spa',
    questionSeeds: ['spa hotel in {area}', 'hotel with spa near {landmark}', 'wellness retreat {area}', 'hotel massage {area}'],
    commonFor: ['wellness_resort', 'mountain_resort', 'beach_resort'],
  },
  {
    key: 'trust', label: 'Practical & trust', status: 'verified',
    kgTopics: ['parking', 'accessibility', 'pets', 'policies'], minFacts: 1,
    dimension: { factCats: '(parking|accessibility|pets|policies)', pageKey: '(parking|accessib|contact|practical)', qCat: '(parking|accessibility|pets)', hygiene: true },
    intentKey: null,
    questionSeeds: ['does {hotel} have parking', 'is {hotel} accessible', 'are pets allowed at {hotel}'],
    commonFor: ['luxury_city', 'boutique', 'mountain_resort', 'beach_resort', 'wellness_resort', 'conference', 'airport', 'country_house'],
  },
]

// ── STUBS — structure only. NO real demand logic. Activated + validated when a REAL
// hotel of the matching archetype is crawled. Detector will not PROPOSE these as primary
// unless the KG genuinely holds the facts (and even then, owner confirms). ──
const STUBS: ExperienceDef[] = [
  { key: 'ski', label: 'Ski & mountain', status: 'unverified', kgTopics: ['ski'], minFacts: 3, dimension: null, intentKey: null, questionSeeds: [], commonFor: ['mountain_resort'] },
  { key: 'hiking', label: 'Hiking & outdoors', status: 'unverified', kgTopics: ['hiking'], minFacts: 3, dimension: null, intentKey: null, questionSeeds: [], commonFor: ['mountain_resort', 'country_house'] },
  { key: 'beach', label: 'Beach', status: 'unverified', kgTopics: ['beach'], minFacts: 3, dimension: null, intentKey: null, questionSeeds: [], commonFor: ['beach_resort'] },
  { key: 'watersports', label: 'Watersports', status: 'unverified', kgTopics: ['watersports'], minFacts: 3, dimension: null, intentKey: null, questionSeeds: [], commonFor: ['beach_resort'] },
  { key: 'golf', label: 'Golf', status: 'unverified', kgTopics: ['golf'], minFacts: 3, dimension: null, intentKey: null, questionSeeds: [], commonFor: ['country_house', 'beach_resort'] },
]

export const EXPERIENCES: ExperienceDef[] = [...VERIFIED, ...STUBS]

export const EXPERIENCE_BY_KEY: Record<string, ExperienceDef> =
  Object.fromEntries(EXPERIENCES.map(e => [e.key, e]))

// ── ARCHETYPES — the hotel types the platform recognises. Mountain/beach/etc. are listed
// so the detector can PROPOSE them, but their experiences stay stubbed until validated. ──
export interface ArchetypeDef {
  key: string
  label: string
  status: ExperienceStatus
  // Experiences typically primary for this archetype (expectation hint; KG facts still gate).
  typicalPrimary: string[]
}

export const ARCHETYPES: ArchetypeDef[] = [
  { key: 'luxury_city', label: 'Luxury City Hotel', status: 'verified', typicalPrimary: ['luxury', 'dining', 'business', 'location'] },
  { key: 'boutique', label: 'Boutique Hotel', status: 'verified', typicalPrimary: ['luxury', 'dining', 'location', 'romantic'] },
  { key: 'mountain_resort', label: 'Mountain Resort', status: 'unverified', typicalPrimary: ['ski', 'wellness', 'dining', 'family'] },
  { key: 'beach_resort', label: 'Beach Resort', status: 'unverified', typicalPrimary: ['beach', 'watersports', 'dining', 'wellness'] },
  { key: 'wellness_resort', label: 'Wellness Resort', status: 'unverified', typicalPrimary: ['wellness', 'dining', 'luxury'] },
  { key: 'conference', label: 'Conference Hotel', status: 'unverified', typicalPrimary: ['business', 'dining', 'location'] },
  { key: 'airport', label: 'Airport Hotel', status: 'unverified', typicalPrimary: ['business', 'location'] },
  { key: 'country_house', label: 'Country House', status: 'unverified', typicalPrimary: ['luxury', 'dining', 'romantic', 'family'] },
]

export const ARCHETYPE_BY_KEY: Record<string, ArchetypeDef> =
  Object.fromEntries(ARCHETYPES.map(a => [a.key, a]))
