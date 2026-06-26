// lib/recommendation-assembler.ts
// toCanonicalRecommendation(move, ctx) — converts a decision move into the canonical
// Recommendation object. DORMANT: attach as move.canonicalRecommendation, keep
// move.recommendation working. Deterministic fields from existing data only.

import type { Recommendation, Posture, ConfidenceTier } from './recommendation-model'

interface Ctx { knowledgeGraph: any; audit: any; technical: any; facts: any[] }

const CAT_OF: Record<string,string> = { rooms:'rooms', dining:'dining', meetings:'meetings', weddings:'weddings', spa:'spa', family:'family', location:'location', offers:'offers' }
const EFFORT_FACTOR: Record<string,number> = { low:1.0, medium:0.85, high:0.70 }
const POSTURE_WEIGHT: Record<string,number> = { Commit:1.55, Strengthen:1.30, Convert:1.00, 'Fix-foundation':0.70, Confirm:0.55, Decline:0.40, Defer:0.40 }
const CONF_FACTOR: any = { high:1.0, medium:0.8, low:0.6, needs_verification:0.4 }

function effortLabel(action: string, posture: string): 'low'|'medium'|'high' {
  if (posture === 'Convert') return 'medium'
  if (action === 'create_page') return 'high'
  if (action === 'strengthen_page') return 'medium'
  return 'low'
}

function computeConfidence(evidence_state: string, kg: any, auditCorroborates: boolean, techCorroborates: boolean, brainAgrees: boolean) {
  const st = (evidence_state || '').toLowerCase()
  const unverified = st === 'unverified' || st === 'verify' || st === 'missing' || st === ''
  let signals = 0
  if (brainAgrees) signals++
  if (auditCorroborates) signals++
  if (techCorroborates) signals++
  const kgState = kg?.cluster_state || 'absent'
  if (kgState === 'consolidated' || kgState === 'scattered') signals++
  let tier: ConfidenceTier; let score: number
  if (unverified) { tier = 'needs_verification'; score = 0.30 }
  else if (signals >= 4) { tier = 'high'; score = 0.85 }
  else if (signals >= 2) { tier = 'medium'; score = 0.60 }
  else { tier = 'low'; score = 0.45 }
  const reason = unverified
    ? 'Evidence unverified — the platform could not confirm this offering exists.'
    : `${signals} deterministic systems agree (knowledge-graph state: ${kgState}).`
  return { tier, score, signals, inputs: { brain_agrees: brainAgrees, kg_state: kgState, audit_corroborates: auditCorroborates, technical_corroborates: techCorroborates }, reason }
}

function computePriority(impact: number, confTier: string, coverage: number, effort: 'low'|'medium'|'high', posture: string) {
  const cf = CONF_FACTOR[confTier] ?? 0.6
  const ef = EFFORT_FACTOR[effort]
  const pw = POSTURE_WEIGHT[posture] ?? 1.0
  const cov = Math.round(coverage * 100) / 100
  const core = impact * (0.6 + 0.4 * cov) * cf * ef * pw
  const score = Math.round(Math.max(0, Math.min(100, core * 100)))
  const tier = score >= 67 ? 'High' : score >= 40 ? 'Medium' : 'Low'
  return { score, tier, inputs: { impact, coverage: cov, confidence_factor: cf, effort_factor: ef, posture_weight: pw, effort, posture },
    explanation: `impact ${(impact*100|0)}% · coverage ${(cov*100|0)}% · ${confTier} confidence · ${effort} effort · ${posture} posture` }
}

const toPath = (u: string) => { try { return new URL(u).pathname.replace(/\/$/,'') || '/' } catch { return u || '' } }

export function toCanonicalRecommendation(move: any, ctx: Ctx): Recommendation {
  const topic = move.topic || move.decision?.topic || 'overall'
  const posture: Posture = move.posture
  const evidence_state = move.evidence_state || move.decision?.evidence_state || 'unverified'
  const kg = (ctx.knowledgeGraph?.clusters || []).find((c: any) => c.topic === topic) || {}
  const cat = CAT_OF[topic]

  const auditResults = ctx.audit?.recommendation?.results || []
  const topicResults = auditResults.filter((r: any) => { const c = (r.category || '').toLowerCase(); return c === topic || c === cat })
  const failed = topicResults.filter((r: any) => r.readiness === 'NO').map((r: any) => r.question)
  const partial = topicResults.filter((r: any) => r.readiness === 'PARTIAL').map((r: any) => r.question)
  const totalQ = auditResults.length || 1
  const topicDemand = topicResults.length
  const coverage = Math.min(1, topicDemand / Math.max(4, totalQ * 0.35))
  const importantPage = (ctx.audit?.importantPages || []).find((p: any) => p.key === topic || (p.cats || []).includes(cat))
  const missingInfo = importantPage?.missing || []
  const auditCorroborates = !!(importantPage && importantPage.status === 'Present')

  const techFindings = (ctx.technical?.findings || []).filter((f: any) => /schema|linking|retrieval|canonical|faq/i.test((f.layer || '') + ' ' + (f.fix || '')))
  const techCorroborates = techFindings.length > 0

  let supporting: any[] = []
  if (posture === 'Commit' || posture === 'Convert') {
    const topicFacts = (ctx.facts || []).filter((f: any) => (f.category || '').toLowerCase() === cat)
    const canon = kg.canonical_page ? kg.canonical_page.toLowerCase() : null
    const onCanon = canon ? topicFacts.filter((f: any) => toPath(f.page_url || '').toLowerCase() === canon) : []
    supporting = (onCanon.length ? onCanon : topicFacts).sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0)).slice(0, 3)
  }
  const brainAgrees = (ctx.facts || []).some((f: any) => (f.category || '').toLowerCase() === cat)

  const conf = computeConfidence(evidence_state, kg, auditCorroborates, techCorroborates, brainAgrees)
  const impact = typeof move.impact === 'number' ? move.impact : (move.value_of_change ?? (posture === 'Convert' ? 0.82 : posture === 'Commit' ? 0.78 : 0.60))
  const effort = effortLabel(move.decision?.action || '', posture)
  const isFoundation = posture === 'Fix-foundation'
  const pri = computePriority(impact, conf.tier, coverage, effort, posture)

  const factPaths = (kg.fact_pages || []).map((fp: any) => typeof fp === 'string' ? fp : fp.path).filter(Boolean)

  return {
    identity: { id: `${topic}:${posture.toLowerCase()}`, posture, action: move.decision?.action || 'do_nothing', title: move.title || `${posture} ${topic}` },
    targeting: { topic, affected_entity: kg.label || (topic.charAt(0).toUpperCase()+topic.slice(1)), canonical_page: kg.canonical_page || null, affected_pages: factPaths },
    priority: { score: pri.score, tier: pri.tier, inputs: pri.inputs, rank: move.rank ?? 0, explanation: pri.explanation, ...(isFoundation ? { foundational: true } : {}) },
    confidence: { tier: conf.tier, score: conf.score, evidence_state: (evidence_state === 'confirmed' ? 'confirmed' : 'unverified'), inputs: conf.inputs, reason: conf.reason },
    evidence: { facts: supporting.map((f: any) => ({ value: f.fact_value, quote: (f.evidence_quote || '').slice(0,120), page: toPath(f.page_url || ''), confidence: f.confidence || 0 })) },
    audit: { failed_queries: failed, partial_queries: partial, missing_information: missingInfo, coverage_pct: importantPage?.score ?? null },
    knowledge_graph: { cluster_state: kg.cluster_state || 'absent', cluster_health: kg.cluster_health ?? null, fact_pages: factPaths, explanation: kg.explanation || '' },
    technical: { causes: techFindings.slice(0,4).map((f: any) => ({ layer: f.layer, severity: f.severity, fix: f.fix })) },
    prose: {
      ai_reasoning: move.recommendation?.prose?.why_improves_ai || move.prose?.why_improves_ai || '',
      business_reasoning: move.recommendation?.prose?.strategic_explanation || move.prose?.strategic_explanation || '',
      expected_outcome: move.recommendation?.prose?.expected_outcome || move.prose?.expected_outcome || '',
      why_now: '', success_measure: '',
    },
    case: null,
    future: { external: null, behavioral: null, search: null },
    history: null,
  }
}