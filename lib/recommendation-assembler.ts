// lib/recommendation-assembler.ts
// toCanonicalRecommendation(move, ctx) — converts a decision move into the canonical
// Recommendation object. DORMANT: attach as move.canonicalRecommendation, keep
// move.recommendation working. Deterministic fields from existing data only.

import type { Recommendation, Posture, ConfidenceTier } from './recommendation-model'
import { guestQuestionForIntent } from './intent-catalogue'

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

  // Map a recommendation topic to the audit's OWN category vocabulary (the audit files
  // rooms questions under 'luxury', etc.). Without this, failed_queries never match and
  // the proof comes back empty while prose still describes failures (no-invention violation).
  const TOPIC_TO_AUDIT_CATS: Record<string,string[]> = {
    rooms: ['luxury', 'family', 'romantic', 'rooms'],
    dining: ['dining'],
    meetings: ['business', 'meetings'],
    weddings: ['romantic', 'weddings'],
    spa: ['spa', 'wellness'],
    family: ['family'],
    location: ['location'],
    offers: ['overall', 'offers'],
  }
  const auditResults = ctx.audit?.recommendation?.results || []
  const wantCats = new Set((TOPIC_TO_AUDIT_CATS[topic] || [topic, cat]).filter(Boolean))
  const topicResults = auditResults.filter((r: any) => wantCats.has((r.category || '').toLowerCase()))
  const failed = topicResults.filter((r: any) => r.readiness === 'NO').map((r: any) => r.question)
  const partial = topicResults.filter((r: any) => r.readiness === 'PARTIAL').map((r: any) => r.question)

  // ── RECOMMENDABILITY BREAKDOWN (V3) — what AI can already do for this Case's topic vs
  // what it can't, from the catalogue grades. Uses a ONE-TO-ONE category→topic map so each
  // catalogue intent surfaces under exactly ONE Case (no echo across Cases). This is
  // SEPARATE from TOPIC_TO_AUDIT_CATS (which stays broad for the old failed_queries proof).
  // Discovery intents are never here (the audit never scores them). Deterministic.
  const RECO_TOPIC_TO_CATS: Record<string, string[]> = {
    rooms:    ['luxury', 'overall'],   // luxury positioning, differentiation, atmosphere, room types
    dining:   ['dining'],
    meetings: ['business'],            // business + meetings + weddings intents are category 'business'
    weddings: ['romantic'],            // the couples/romantic story lives in the weddings Case
    family:   ['family'],
    location: ['location'],
    spa:      ['spa', 'wellness'],
    offers:   ['offers'],
  }
  const recoCats = new Set(RECO_TOPIC_TO_CATS[topic] || [])
  const recoResults = recoCats.size
    ? auditResults.filter((r: any) =>
        recoCats.has((r.category || '').toLowerCase()) &&
        r.intent_id && r.stage &&
        r.stage !== 'booking'   // booking-confidence (check-in, cancellation, parking, etc.)
                                // is practical hygiene, not a flagship topic-Case gap — it
                                // belongs on a separate booking surface, not in rooms/dining.
      )
    : []
  const recoIntent = (r: any) => r.traveller_intent || r.question || r.audit_question
  // The real guest-phrased question for this intent (catalogue variation), falling back to
  // the intent label so it never renders blank on older audit rows. No invention.
  const recoQuestion = (r: any) => guestQuestionForIntent(r.intent_id) || recoIntent(r)
  const recommendability = {
    // YES = AI can fully do this. PARTIAL surfaced separately as "partly" so the strength
    // list is never misleadingly empty when grading is strict (most rec-stage = PARTIAL).
    answerable: recoResults.filter((r: any) => r.readiness === 'YES').map(recoIntent),
    partially_answerable: recoResults.filter((r: any) => r.readiness === 'PARTIAL').map((r: any) => ({
      intent: recoIntent(r),
      question: recoQuestion(r),
      evidence_needed: Array.isArray(r.expected_evidence) ? r.expected_evidence.slice(0, 3) : [],
    })),
    not_answerable: recoResults.filter((r: any) => r.readiness === 'NO').map((r: any) => ({
      intent: recoIntent(r),
      question: recoQuestion(r),
      evidence_needed: Array.isArray(r.expected_evidence) ? r.expected_evidence.slice(0, 3) : [],
    })),
    has_catalogue: recoResults.some((r: any) => r.intent_id && r.stage),
  }
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
    recommendability,
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