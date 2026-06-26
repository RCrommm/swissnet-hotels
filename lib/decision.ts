// lib/decision.ts
// ─── THE DECISION LAYER ───
// PURE, DETERMINISTIC. Consumes the consultant's EXPLICIT evidence_state and OBEYS it.
// Wording/build_type are advisory; evidence_state is the binding contract.
//   confirmed   → strengthen/create/add_section/add_faq/add_schema (may generate)
//   unverified  → verify ONLY (never generates)
//   contradicted→ investigate/verify ONLY (never generates)
// This is the permanent Consultant → Decision → Execute contract.

export type EvidenceState = 'confirmed' | 'unverified' | 'contradicted'
export type EvidenceReason = 'confirmed_facts' | 'unseen' | 'absent' | 'contaminated' | 'insufficient_evidence'
export type ActionType =
  | 'create_page' | 'strengthen_page' | 'add_faq' | 'add_schema' | 'add_section'
  | 'verify' | 'investigate' | 'do_nothing'

export interface DecisionRecord {
  action: ActionType
  target: string | null
  priority: number
  evidence_state: EvidenceState
  evidence_reason: EvidenceReason | null
  reason: string
  generate: string[]
}

function pathOf(u: string): string {
  try { return new URL(u).pathname.replace(/\/$/, '').toLowerCase() || '/' } catch { return (u || '').toLowerCase() }
}

const TOPIC_URL_PATTERNS: { topic: string; re: RegExp }[] = [
  { topic: 'weddings', re: /(wedding|civil-partnership|ceremon)/i },
  { topic: 'romantic', re: /(romantic|romance|honeymoon|couples?)/i },
  { topic: 'spa', re: /(spa|wellness|thermal|wellbeing)/i },
  { topic: 'family', re: /(family|kids|children|child)/i },
  { topic: 'dining', re: /(restaurant|dining|bar|brasserie|afternoon-tea|cuisine)/i },
  { topic: 'meetings', re: /(meeting|event|conference|baptist|venue|private-event)/i },
  { topic: 'business', re: /(business|corporate|conference)/i },
  { topic: 'rooms', re: /(accommodation|rooms?|suites?)/i },
]

export function findExistingPage(topic: string, pagesScraped: string[], facts: any[]): string | null {
  const pat = TOPIC_URL_PATTERNS.find(t => t.topic === topic)
  if (!pat) return null
  for (const u of (pagesScraped || [])) { if (pat.re.test(pathOf(u))) return pathOf(u) }
  for (const f of (facts || [])) {
    const p = pathOf(f.page_url || ''); const cat = (f.category || '').toLowerCase()
    if (p && p !== '/' && (pat.re.test(p) || cat === topic)) return p
  }
  return null
}

function inferTopicLite(title: string): string | null {
  const t = (title || '').toLowerCase()
  for (const p of TOPIC_URL_PATTERNS) if (p.re.test(t)) return p.topic
  return null
}

function buildTypeToAction(bt: string): ActionType {
  const t = (bt || '').toLowerCase()
  if (t === 'faq only') return 'add_faq'
  if (t === 'homepage block') return 'add_section'
  if (t === 'section on existing page') return 'strengthen_page'
  if (t === 'new page') return 'create_page'
  return 'add_section'
}

// ─── THE CONTRACT ───
// evidence_state is EMITTED by the consultant. Decision OBEYS it, ignores wording.
export function decideAction(move: any, pagesScraped: string[], facts: any[]): DecisionRecord {
  const priority = Number.isFinite(move?.priority) ? move.priority : 99
  const reason = move?.why_this_priority || move?.reasoning || ''
  const state: EvidenceState = (move?.evidence_state === 'confirmed' || move?.evidence_state === 'contradicted') ? move.evidence_state : 'unverified'
  const evReason: EvidenceReason | null = move?.evidence_reason || null
  const wanted: string[] = Array.isArray(move?.sections_to_add) && move.sections_to_add.length
    ? move.sections_to_add
    : (Array.isArray(move?.questions_to_answer) ? move.questions_to_answer.slice(0, 5) : [])

  // CONTRADICTED → only investigate, never generate
  if (state === 'contradicted') {
    return { action: 'investigate', target: null, priority, evidence_state: 'contradicted', evidence_reason: evReason, reason, generate: [] }
  }
  // UNVERIFIED → only verify, never generate (regardless of wording/build_type)
  if (state === 'unverified') {
    return { action: 'verify', target: null, priority, evidence_state: 'unverified', evidence_reason: evReason, reason, generate: [] }
  }
  // CONFIRMED → may strengthen/create/add_section/add_faq/add_schema
  const topic = inferTopicLite(move?.title || '')
  const existingPage = topic ? findExistingPage(topic, pagesScraped, facts) : null
  let action = buildTypeToAction(move?.build_type || '')
  if (action === 'create_page' && existingPage) action = 'strengthen_page'
  const target = (action === 'strengthen_page' || action === 'add_section' || action === 'add_faq' || action === 'add_schema') ? existingPage : null
  return { action, target, priority, evidence_state: 'confirmed', evidence_reason: evReason || 'confirmed_facts', reason, generate: wanted }
}