// lib/decision.ts
// ─── THE DECISION LAYER ───
// A PURE, DETERMINISTIC function that turns a consultant "move" into a concrete
// action Execute can consume mechanically. The action type is COMPUTED from
// evidence + crawled pages — never chosen by an LLM — so create-vs-strengthen is
// consistent with the audit and advisor BY CONSTRUCTION.

import { classifyGap, inferTopic, type EvidenceState } from '@/lib/evidence'

export type ActionType =
  | 'create_page' | 'strengthen_page' | 'add_faq'
  | 'add_schema' | 'add_section' | 'verify' | 'do_nothing'

export interface DecisionRecord {
  action: ActionType
  target: string | null
  priority: number
  evidence_state: EvidenceState
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
  { topic: 'dining', re: /(restaurant|dining|bar|brasserie|afternoon-tea|cuisine|baptist)/i },
  { topic: 'meetings', re: /(meeting|event|conference|baptist|venue|private-event)/i },
  { topic: 'business', re: /(business|corporate|conference|meeting|baptist|venue|event)/i },
  { topic: 'rooms', re: /(accommodation|rooms?|suites?)/i },
]

export function findExistingPage(topic: string, pagesScraped: string[], facts: any[]): string | null {
  const pat = TOPIC_URL_PATTERNS.find(t => t.topic === topic)
  if (!pat) return null
  for (const u of (pagesScraped || [])) { if (pat.re.test(pathOf(u))) return pathOf(u) }
  for (const f of (facts || [])) {
    const p = pathOf(f.page_url || '')
    const cat = (f.category || '').toLowerCase()
    if (p && p !== '/' && (pat.re.test(p) || cat === topic)) return p
  }
  return null
}

function buildTypeToAction(bt: string): ActionType | null {
  const t = (bt || '').toLowerCase()
  if (t === 'faq only') return 'add_faq'
  if (t === 'homepage block') return 'add_section'
  return null
}

export function decideAction(move: any, pagesScraped: string[], facts: any[]): DecisionRecord {
  const priority = Number.isFinite(move?.priority) ? move.priority : 99
  const reason = move?.why_this_priority || move?.reasoning || ''
  const generateFromMove: string[] = Array.isArray(move?.sections_to_add) && move.sections_to_add.length
    ? move.sections_to_add
    : (Array.isArray(move?.questions_to_answer) ? move.questions_to_answer.slice(0, 5) : [])

  const topic = inferTopic('', move?.title || '', [])
  if (!topic) {
    const bt = buildTypeToAction(move?.build_type || '') || 'add_section'
    return { action: bt, target: null, priority, evidence_state: 'unverified', reason, generate: generateFromMove }
  }

  const ev = classifyGap(topic, pagesScraped, facts)

  if (ev.evidence_state === 'unverified' && ev.reason === 'unseen') {
    return { action: 'verify', target: null, priority, evidence_state: 'unverified', reason, generate: [] }
  }

  const existingPage = findExistingPage(topic, pagesScraped, facts)

  if (ev.evidence_state === 'confirmed') {
    if (existingPage) return { action: 'strengthen_page', target: existingPage, priority, evidence_state: 'confirmed', reason, generate: generateFromMove }
    return { action: 'create_page', target: null, priority, evidence_state: 'confirmed', reason, generate: generateFromMove }
  }

  if (ev.evidence_state === 'unverified' && ev.reason === 'absent') {
    if (existingPage) return { action: 'strengthen_page', target: existingPage, priority, evidence_state: 'unverified', reason, generate: generateFromMove }
    return { action: 'create_page', target: null, priority, evidence_state: 'unverified', reason, generate: generateFromMove }
  }

  return { action: 'add_section', target: existingPage, priority, evidence_state: ev.evidence_state, reason, generate: generateFromMove }
}