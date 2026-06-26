// ── AUTHORITY INTELLIGENCE ENGINE ──
// Finds external authoritative pages (the ones AI cites for this hotel) that carry
// information CONTRADICTING the hotel's confirmed Knowledge Graph. Focus is the
// external knowledge ECOSYSTEM that shapes AI — not AI itself.
//
// Fence: GPT EXTRACTS claims from a page's text only (cannot invent). The PLATFORM
// compares each claim against CONFIRMED KG values and decides contradictions.
// HONESTY: only CHECKABLE confirmed values produce findings (counts/addresses/
// hours/names/capacities/prices); descriptive prose is never checked; v1 checks
// confirmed VALUES only, never absence.

export interface ConfirmedFact {
  category: string
  key: string
  value: string
  page: string
  confidence: number
}

export interface ExternalClaim {
  key: string
  claim_text: string
  topic: string
}

export interface AuthorityFinding {
  incorrect_claim: string
  verified_reality: string
  source_url: string
  source_domain: string
  recommended_action: string
  fact_key: string
  topic: string
}

const CHECKABLE_KEY_PATTERNS: RegExp[] = [
  /count$/, /_count_/,
  /capacity/,
  /^address$/, /postcode/, /_address$/,
  /hours/, /_time$/, /opening/,
  /size$/, /_sqm/, /_size_/,
  /price/, /rate/, /_chf/,
  /^hotel_name$/, /restaurant_name/,
  /bed_type/, /max_occupancy/, /guest_capacity/, /_capacity$/,
  /neighbourhood/, /^star/, /michelin/,
]

const DESCRIPTIVE_CATEGORIES = new Set(['amenities', 'services', 'entities'])

export function isCheckable(fact: ConfirmedFact): boolean {
  if (DESCRIPTIVE_CATEGORIES.has(fact.category)) return false
  if (!fact.value || fact.value.length > 60) return false
  return CHECKABLE_KEY_PATTERNS.some(re => re.test(fact.key))
}

export function extractConfirmedFacts(knowledge: any): ConfirmedFact[] {
  const out: ConfirmedFact[] = []
  const byCat = knowledge?.byCategory || {}
  for (const category of Object.keys(byCat)) {
    const primary = byCat[category]?.primary || []
    for (const f of primary) {
      if (f?.key && f?.value) {
        out.push({
          category,
          key: String(f.key),
          value: String(f.value),
          page: String(f.page || ''),
          confidence: typeof f.confidence === 'number' ? f.confidence : 0,
        })
      }
    }
  }
  return out
}

export function checkableFacts(knowledge: any): ConfirmedFact[] {
  return extractConfirmedFacts(knowledge).filter(isCheckable)
}
// ── GPT EXTRACTION PROMPT ──
// GPT is shown the external page's text AND the hotel's checkable facts. It reports
// ONLY what the page actually says about those specific facts. It cannot invent,
// cannot judge truth, cannot infer. If the page doesn't mention a fact, it says so
// by simply not returning a claim for it.
export const AUTHORITY_EXTRACT_SYSTEM = `You compare what an external web page says about a hotel against a list of the hotel's CONFIRMED facts. You are given (a) the page's text and (b) a list of confirmed facts, each with a key and the confirmed value.

YOUR ONLY JOB: for each confirmed fact, find whether the PAGE makes a claim about that same fact, and if so, report the page's claim VERBATIM (or as close as possible).

STRICT RULES:
- Use ONLY the page text. NEVER use outside knowledge. NEVER invent a claim.
- Do NOT decide whether the page is right or wrong — that is decided later by the system, not you.
- Only return a claim for a fact if the page actually discusses that specific fact. If the page says nothing about a fact, omit it entirely.
- Report the page's exact wording for its claim (a short quote), not a paraphrase.
- Match a page claim to a fact only when they are clearly about the SAME thing (e.g. number of rooms, the address, opening hours, a named restaurant, a capacity). When unsure, omit it.

Return STRICTLY this JSON:
{
  "claims": [
    { "fact_key": string (the key from the supplied facts), "page_claim": string (verbatim from the page), "page_value": string (the specific value the page asserts, e.g. "45 rooms" or "open from 12pm") }
  ]
}`

export function authorityExtractSchema() {
  return {
    type: 'object', additionalProperties: false, required: ['claims'],
    properties: {
      claims: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['fact_key', 'page_claim', 'page_value'],
          properties: {
            fact_key: { type: 'string' },
            page_claim: { type: 'string' },
            page_value: { type: 'string' },
          },
        },
      },
    },
  }
}

// ── NORMALISATION + COMPARISON (platform decides contradiction) ──
// GPT returned page_value for each fact it found. The PLATFORM now compares it to
// the confirmed value and decides if it's a genuine contradiction. We normalise
// both sides to avoid false flags from formatting (case, punctuation, spacing).

function normaliseValue(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[.,;:'"`’]/g, ' ')   // strip punctuation
    .replace(/\s+/g, ' ')           // collapse whitespace
    .trim()
}

// Pull the comparable numbers from a value (e.g. "39 bedrooms" -> [39], "21 m² / 226 SQF" -> [21,226]).
function numbersIn(s: string): number[] {
  return (s.match(/\d+(?:\.\d+)?/g) || []).map(Number)
}

// Decide whether a page value genuinely contradicts a confirmed value.
// Returns true ONLY when we're confident they disagree — never on mere difference
// of wording. Conservative by design: when unsure, NOT a contradiction.
export function isContradiction(confirmedValue: string, pageValue: string): boolean {
  const a = normaliseValue(confirmedValue)
  const b = normaliseValue(pageValue)
  if (!a || !b) return false
  if (a === b) return false
  // If one contains the other as a phrase, treat as agreement (e.g. "39 bedrooms" vs "39 rooms" share 39).
  // Numeric check first — the strongest signal for counts/hours/capacities/sizes.
  const na = numbersIn(a), nb = numbersIn(b)
  if (na.length && nb.length) {
    // If they share no numbers in common, and both assert numbers, that's a real contradiction.
    const shared = na.some(x => nb.includes(x))
    if (!shared) return true
    return false // share at least one number → treat as agreement, not contradiction
  }
  // Non-numeric (names, neighbourhoods): contradiction only if neither contains the other.
  if (a.includes(b) || b.includes(a)) return false
  // Token overlap — if they share any significant word, don't flag (too risky).
  const at = new Set(a.split(' ').filter(w => w.length > 2))
  const bt = b.split(' ').filter(w => w.length > 2)
  if (bt.some(w => at.has(w))) return false
  // No shared numbers, no containment, no shared words → genuine disagreement.
  return true
}

// Build the final findings from GPT's claims + the confirmed facts.
export function buildFindings(
  claims: { fact_key: string; page_claim: string; page_value: string }[],
  facts: ConfirmedFact[],
  sourceUrl: string,
  sourceDomain: string,
): AuthorityFinding[] {
  const byKey = new Map(facts.map(f => [f.key, f]))
  const out: AuthorityFinding[] = []
  for (const c of claims || []) {
    const fact = byKey.get(c.fact_key)
    if (!fact) continue                      // claim about a fact we don't have confirmed → ignore
    if (!isContradiction(fact.value, c.page_value)) continue  // not a genuine disagreement → ignore
    out.push({
      incorrect_claim: `This page states: "${c.page_claim}"`,
      verified_reality: `Your confirmed data shows ${fact.value}.`,
      source_url: sourceUrl,
      source_domain: sourceDomain,
      recommended_action: `Contact the publisher to correct this, and make sure your official site states the correct ${fact.key.replace(/_/g, ' ')} clearly.`,
      fact_key: fact.key,
      topic: fact.category,
    })
  }
  return out
}