// lib/evidence.ts
// ─── THE EVIDENCE LAYER ───
// One shared vocabulary for "how sure are we, and why" — used by audit, consultant,
// and Ask SwissNet so uncertainty propagates honestly instead of being laundered
// into false confidence. Core rule: ABSENCE FROM CRAWL ≠ ABSENCE FROM HOTEL.

export type EvidenceState = 'confirmed' | 'unverified' | 'contradicted'
export type EvidenceReason = 'unseen' | 'absent' | null

export interface Evidence {
  evidence_state: EvidenceState
  reason: EvidenceReason
  why: string
  sources?: string[]
}

const TOPIC_PATTERNS: { topic: string; re: RegExp }[] = [
  { topic: 'weddings',   re: /(wedding|civil-partnership|civil_partnership|ceremon)/i },
  { topic: 'romantic',   re: /(romantic|romance|honeymoon|couples?)/i },
  { topic: 'spa',        re: /(spa|wellness|thermal|wellbeing)/i },
  { topic: 'family',     re: /(family|kids|children|child)/i },
  { topic: 'dining',     re: /(restaurant|dining|bar|brasserie|afternoon-tea|cuisine|menu)/i },
  { topic: 'meetings',   re: /(meeting|event|conference|baptist|venue|private-event)/i },
  { topic: 'rooms',      re: /(accommodation|rooms?|suites?)/i },
  { topic: 'business',   re: /(business|corporate|conference)/i },
  { topic: 'offers',     re: /(offers?|packages?|deals?)/i },
]

function pathOf(u: string): string {
  try { return new URL(u).pathname.replace(/\/$/, '').toLowerCase() || '/' } catch { return (u || '').toLowerCase() }
}

export function pageTypeCrawled(pagesScraped: string[], topic: string): boolean {
  const pat = TOPIC_PATTERNS.find(t => t.topic === topic)
  if (!pat) return false
  return (pagesScraped || []).some(u => pat.re.test(pathOf(u)))
}

export function factsSupport(facts: any[], topic: string): string[] {
  const pat = TOPIC_PATTERNS.find(t => t.topic === topic)
  const out: string[] = []
  for (const f of (facts || [])) {
    const cat = (f.category || '').toLowerCase()
    const blob = `${cat} ${f.fact_value || ''} ${f.evidence_quote || ''}`.toLowerCase()
    if (cat === topic || (pat && pat.re.test(blob))) {
      out.push(pathOf(f.page_url || '') || cat)
    }
  }
  return [...new Set(out)]
}

export function classifyGap(topic: string, pagesScraped: string[], facts: any[]): Evidence {
  const supporting = factsSupport(facts, topic)
  if (supporting.length > 0) {
    return {
      evidence_state: 'confirmed',
      reason: null,
      why: `Confirmed: ${supporting.length} stored fact(s) reference ${topic}.`,
      sources: supporting,
    }
  }
  const crawled = pageTypeCrawled(pagesScraped, topic)
  if (!crawled) {
    return {
      evidence_state: 'unverified',
      reason: 'unseen',
      why: `Unverified (unseen): no ${topic} page was among the pages crawled, so we cannot say whether the hotel offers it. Absence from the crawl is not absence from the hotel.`,
      sources: [],
    }
  }
  return {
    evidence_state: 'unverified',
    reason: 'absent',
    why: `Unverified (absent): pages where a ${topic} offering would appear were crawled, but none confirmed it.`,
    sources: [],
  }
}

export function honestFindingTitle(topic: string, ev: Evidence, originalTitle: string): string {
  if (ev.evidence_state === 'confirmed') return originalTitle
  if (ev.reason === 'unseen') return `Could not verify a ${topic} offering from the pages crawled`
  return `No dedicated ${topic} page found across the pages crawled`
}

// Infer a known topic from a finding candidate's key/label/categories.
export function inferTopic(key: string, label: string, cats: string[]): string | null {
  const blob = `${key || ''} ${label || ''} ${(cats || []).join(' ')}`.toLowerCase()
  const map: { topic: string; re: RegExp }[] = [
    { topic: 'weddings', re: /(wedding|civil|ceremon)/ },
    { topic: 'romantic', re: /(romantic|romance|honeymoon|couple)/ },
    { topic: 'spa', re: /(spa|wellness|thermal)/ },
    { topic: 'family', re: /(family|kids|children)/ },
    { topic: 'dining', re: /(dining|restaurant|food|cuisine)/ },
    { topic: 'meetings', re: /(meeting|event|conference|business)/ },
    { topic: 'rooms', re: /(room|suite|accommodation)/ },
  ]
  for (const m of map) if (m.re.test(blob)) return m.topic
  return null
}