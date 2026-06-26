// ── REVIEW INTELLIGENCE ENGINE ──
// Turns normalized guest reviews into CONSULTING EVIDENCE for existing Cases.
// Never a dashboard. Never averages/sentiment%/word-clouds. Connector-agnostic:
// it takes Review[] from anywhere (Google Business, TripAdvisor, CRM, surveys).
//
// Architecture fence (same as the rest of SwissNet):
//   GPT reads + clusters themes from the SUPPLIED reviews only (it cannot invent
//   a theme not present in the text). The PLATFORM applies the sufficiency gate
//   and decides what becomes evidence. GPT never decides "this is consistent
//   enough" — that threshold is deterministic and lives here.

export interface Review {
  source: string          // 'google' | 'tripadvisor' | 'survey' | ...
  rating: number | null   // 1..5 if available
  date: string | null     // ISO if available
  language: string | null
  text: string
}

// A finding the engine produces. Topic-tagged so it maps to a Case.
export type ReviewFindingKind = 'recurring_strength' | 'recurring_complaint' | 'expectation_gap' | 'emerging_reputation'

export interface ReviewFinding {
  kind: ReviewFindingKind
  topic: string           // 'dining' | 'rooms' | 'spa' | 'location' | 'service' | ...
  theme: string           // the specific thing, e.g. "afternoon tea"
  claim: string           // platform-phrased consulting sentence (gated, honest)
  support_count: number   // how many distinct reviews mention it (the gate input)
  representative_quotes: { text: string; source: string }[] // ≤2, verbatim from reviews
}

// ── SUFFICIENCY GATE ──
// A theme only becomes evidence if enough reviews independently support it.
// Below threshold → silent (never "consistently" on thin data). This is what
// makes the engine trustworthy regardless of connector, and why a 5-review
// sample can't honestly drive it.
const MIN_SUPPORT = 3            // ≥3 distinct reviews to claim a recurring theme
const MIN_SUPPORT_EMERGING = 2  // emerging reputation can fire at 2 IF recent + rising

// Words the platform uses by support strength — keeps the claim honestly scaled.
function strengthWord(n: number): string {
  if (n >= 8) return 'overwhelmingly'
  if (n >= 5) return 'consistently'
  return 'repeatedly'
}

// One GPT pass: read all reviews, return grouped themes with the raw quotes that
// support each. GPT is told explicitly: extract only what's present, never invent,
// attach the verbatim quotes, do NOT judge sufficiency.
export const REVIEW_EXTRACT_SYSTEM = `You analyze hotel guest reviews to extract RECURRING THEMES that a consultant could act on. You are given a set of real guest reviews for ONE hotel.

STRICT RULES:
- Use ONLY what the reviews actually say. NEVER invent a theme, a quote, or a detail not present in the supplied text. If guests don't mention something, it does not exist for you.
- Group reviews into themes. A theme is a specific recurring subject (e.g. "afternoon tea", "noise from the street", "the building's beauty", "slow check-in"), NOT a vague category.
- For each theme, classify it as one of:
  • "recurring_strength" — guests repeatedly praise it
  • "recurring_complaint" — guests repeatedly struggle with / criticize it
  • "expectation_gap" — guests express surprise that reality differed from what they expected (better OR worse than the hotel's own positioning)
  • "emerging_reputation" — a specific experience guests increasingly single out as remarkable / signature
- Assign each theme a single topic from: rooms, dining, spa, location, service, value, family, romantic, business, facilities, cleanliness, other.
- For each theme, attach the EXACT verbatim quotes from the reviews that support it (do not paraphrase the quotes), and count how many DISTINCT reviews support it.
- Do NOT decide whether a theme is "significant" or "consistent" — just report the theme, its supporting quotes, and the honest support count. Significance is decided downstream.

Return STRICTLY this JSON:
{
  "themes": [
    {
      "kind": "recurring_strength"|"recurring_complaint"|"expectation_gap"|"emerging_reputation",
      "topic": string,
      "theme": string,
      "support_count": integer,
      "quotes": [ { "text": string (verbatim), "source": string } ],
      "is_recent_and_rising": boolean
    }
  ]
}`

export function reviewExtractSchema() {
  return {
    type: 'object', additionalProperties: false, required: ['themes'],
    properties: {
      themes: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['kind', 'topic', 'theme', 'support_count', 'quotes', 'is_recent_and_rising'],
          properties: {
            kind: { type: 'string', enum: ['recurring_strength', 'recurring_complaint', 'expectation_gap', 'emerging_reputation'] },
            topic: { type: 'string' },
            theme: { type: 'string' },
            support_count: { type: 'integer' },
            quotes: {
              type: 'array',
              items: { type: 'object', additionalProperties: false, required: ['text', 'source'], properties: { text: { type: 'string' }, source: { type: 'string' } } },
            },
            is_recent_and_rising: { type: 'boolean' },
          },
        },
      },
    },
  }
}

// ── THE GATE + CLAIM (deterministic, platform-decided) ──
// Takes GPT's grouped themes, applies the sufficiency threshold, and phrases the
// honest consulting claim. Themes that don't clear the gate are dropped silently.
export function gateAndPhrase(themes: any[]): ReviewFinding[] {
  const out: ReviewFinding[] = []
  for (const t of themes || []) {
    const n = typeof t.support_count === 'number' ? t.support_count : (t.quotes?.length || 0)
    const kind = t.kind as ReviewFindingKind
    const topic = (t.topic || 'other').toString().toLowerCase()
    const theme = (t.theme || '').toString()
    if (!theme) continue

    // Gate: emerging reputation may fire at 2 IF recent+rising; everything else needs MIN_SUPPORT.
    const threshold = kind === 'emerging_reputation' && t.is_recent_and_rising ? MIN_SUPPORT_EMERGING : MIN_SUPPORT
    if (n < threshold) continue

    const word = strengthWord(n)
    let claim = ''
    if (kind === 'recurring_strength') claim = `Guests ${word} praise ${theme}, yet this rarely surfaces as a headline strength on the site.`
    else if (kind === 'recurring_complaint') claim = `Guests ${word} raise ${theme} — the site should address this directly to set the right expectation.`
    else if (kind === 'expectation_gap') claim = `Guests ${word} note that ${theme} differed from what they expected, suggesting the site sets the wrong expectation here.`
    else if (kind === 'emerging_reputation') claim = `${theme.charAt(0).toUpperCase() + theme.slice(1)} is becoming something guests single out — a candidate signature experience the site under-plays.`

    out.push({
      kind, topic, theme, claim,
      support_count: n,
      representative_quotes: (t.quotes || []).slice(0, 2).map((q: any) => ({ text: String(q.text || ''), source: String(q.source || '') })),
    })
  }
  // Strongest evidence first (most-supported themes lead).
  return out.sort((a, b) => b.support_count - a.support_count)
}
// ── CASE MAPPING ──
// Routes gated findings to either (a) an existing Case (by topic) as enrichment,
// or (b) Emerging Opportunities (observational, no recommendation). Review
// Intelligence NEVER creates a Case — the Decision Layer owns those exclusively.

// Review-engine topics → Decision-Layer Case topics. Only listed mappings can
// attach to a Case; anything else (or no matching Case present) → Emerging.
const REVIEW_TOPIC_TO_CASE: Record<string, string[]> = {
  dining: ['dining'],
  rooms: ['rooms'],
  spa: ['spa'],
  family: ['family'],
  romantic: ['weddings'],
  business: ['meetings'],
  location: ['location'],
  // facilities / service / value / cleanliness / other have no clean Case topic
  // → these route to Emerging Opportunities, never force-attached.
}

export interface ReviewMappingResult {
  // findingsByCaseTopic: Case topic → findings that enrich it
  attached: Record<string, ReviewFinding[]>
  // emerging: strong findings with no matching Case (observational only)
  emerging: ReviewFinding[]
}

/**
 * Map gated findings onto the Cases present in this advisory.
 * @param findings  output of gateAndPhrase
 * @param caseTopics the topics of the Cases that actually exist this run
 */
export function mapFindingsToCases(findings: ReviewFinding[], caseTopics: string[]): ReviewMappingResult {
  const present = new Set((caseTopics || []).map(t => (t || '').toLowerCase()))
  const attached: Record<string, ReviewFinding[]> = {}
  const emerging: ReviewFinding[] = []

  for (const f of findings || []) {
    const candidates = REVIEW_TOPIC_TO_CASE[f.topic] || []
    const match = candidates.find(c => present.has(c))
    if (match) {
      if (!attached[match]) attached[match] = []
      attached[match].push(f)
    } else {
      // No matching Case → observational context. Decision Layer may promote later.
      emerging.push(f)
    }
  }
  return { attached, emerging }
}