// lib/recommendation.ts
// ─── RECOMMENDATION INTELLIGENCE: deterministic assembler ───
// PURE. No GPT. No invention. For each consultant move, CONVERGE the existing
// intelligence layers into one complete recommendation object, matched by topic.
// The LLM explains; this computes. The recommendation becomes the consultant.

export interface AssembledRecommendation {
  title: string
  summary: string
  evidence_state: string
  evidence_reason: string | null
  confidence: string
  decision: any
  bucket: 'Foundation' | 'Quick Win' | 'Strategic' | 'Future'
  ai_identity: { label: string; score: number; band: string }[]
  knowledge_graph: { cluster_state: string; cluster_health: number; explanation: string; canonical_page: string | null } | null
  technical: { layer: string; severity: string; fix: string; action: string }[]
  affected_pages: string[]
  questions_unanswered: string[]
  evidence: string[]
}

const TOPIC_MATCH: { topic: string; re: RegExp; vmKeys: RegExp; kgTopic: string; qRe: RegExp }[] = [
  { topic: 'meetings', re: /(meeting|business|conference|event|baptist|corporate|mice)/i, vmKeys: /(business)/i, kgTopic: 'meetings', qRe: /(business|meeting|corporate)/i },
  { topic: 'dining',   re: /(dining|restaurant|bar|brasserie|afternoon[- ]?tea|cuisine|culinary|food)/i, vmKeys: /(dining)/i, kgTopic: 'dining', qRe: /(dining|restaurant|vegan|menu)/i },
  { topic: 'spa',      re: /(spa|wellness|wellbeing|thermal)/i, vmKeys: /(wellness)/i, kgTopic: 'spa', qRe: /(spa|wellness)/i },
  { topic: 'weddings', re: /(wedding|romance|romantic|honeymoon|civil|ceremon|couple)/i, vmKeys: /(romantic)/i, kgTopic: 'weddings', qRe: /(romantic|wedding)/i },
  { topic: 'family',   re: /(family|kids|children)/i, vmKeys: /(family)/i, kgTopic: 'family', qRe: /(family)/i },
  { topic: 'rooms',    re: /(rooms?|suites?|accommodation)/i, vmKeys: /(luxury)/i, kgTopic: 'rooms', qRe: /(rooms?|suite)/i },
  { topic: 'location', re: /(location|neighbourhood|nearby|attractions?|transport|directions?)/i, vmKeys: /(location)/i, kgTopic: 'location', qRe: /(location|attraction|near)/i },
  { topic: 'homepage', re: /(homepage|home page|quick facts|ai summary|positioning|overview)/i, vmKeys: /(luxury)/i, kgTopic: 'rooms', qRe: /(overall|check-in|packages)/i },
]

function matchTopic(move: any): typeof TOPIC_MATCH[number] | null {
  const blob = `${move?.title || ''} ${move?.what_to_build || ''}`.toLowerCase()
  for (const t of TOPIC_MATCH) if (t.re.test(blob)) return t
  return null
}

function bucketOf(move: any): AssembledRecommendation['bucket'] {
  const es = move?.evidence_state
  if (es === 'unverified' || es === 'contradicted') return 'Foundation'
  const action = move?.decision?.action || ''
  const effort = (move?.effort || '').toLowerCase()
  if (['add_faq', 'add_schema', 'add_section'].includes(action) && effort !== 'high') return 'Quick Win'
  return 'Strategic'
}

export function assembleRecommendation(move: any, models: { visibilityModel: any; knowledgeGraph: any; technical: any; auditBrief: any }): AssembledRecommendation {
  const m = matchTopic(move)
  const { visibilityModel, knowledgeGraph, technical, auditBrief } = models

  const ai_identity: AssembledRecommendation['ai_identity'] = []
  if (m && visibilityModel?.dimensions) {
    for (const d of visibilityModel.dimensions) if (m.vmKeys.test(d.dimension)) ai_identity.push({ label: d.label, score: d.score, band: d.band })
  }

  let knowledge_graph: AssembledRecommendation['knowledge_graph'] = null
  if (m && knowledgeGraph?.clusters) {
    const c = knowledgeGraph.clusters.find((x: any) => x.topic === m.kgTopic)
    if (c) knowledge_graph = { cluster_state: c.cluster_state, cluster_health: c.cluster_health, explanation: c.explanation, canonical_page: c.canonical_page }
  }

  const technical_f: AssembledRecommendation['technical'] = []
  if (technical?.findings) {
    const moveAction = move?.decision?.action
    for (const f of technical.findings) {
      const actionMatch = (moveAction === 'add_schema' && f.action === 'add_schema') || (moveAction === 'add_section' && f.action === 'add_section')
      const topicMatch = m ? m.re.test(`${f.fix} ${f.issue || ''}`) : false
      const siteWide = f.severity === 'High' && /schema|retrieval|trust/i.test(f.layer) && move?.evidence_state === 'confirmed'
      if (actionMatch || topicMatch || siteWide) technical_f.push({ layer: f.layer, severity: f.severity, fix: f.fix, action: f.action })
    }
  }

  const pages = new Set<string>()
  if (move?.decision?.target) pages.add(move.decision.target)
  if (m && knowledgeGraph?.clusters) {
    const c = knowledgeGraph.clusters.find((x: any) => x.topic === m.kgTopic)
    for (const fp of (c?.fact_pages || [])) pages.add(fp.path)
  }
  if (m) for (const wp of (auditBrief?.weakPages || [])) if (m.re.test(wp)) pages.add(wp.split(' ')[0])

  const questions: string[] = []
  if (m) for (const q of (auditBrief?.unanswered || [])) if (m.qRe.test(q)) questions.push(q)

  return {
    title: move?.title || '',
    summary: move?.why_this_priority || '',
    evidence_state: move?.evidence_state || 'unverified',
    evidence_reason: move?.evidence_reason || null,
    confidence: move?.confidence || 'Low',
    decision: move?.decision || null,
    bucket: bucketOf(move),
    ai_identity,
    knowledge_graph,
    technical: technical_f.slice(0, 4),
    affected_pages: [...pages].slice(0, 6),
    questions_unanswered: questions.slice(0, 5),
    evidence: Array.isArray(move?.evidence) ? move.evidence.slice(0, 4) : [],
  }
}