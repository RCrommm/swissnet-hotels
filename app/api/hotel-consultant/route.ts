import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { classifyGap, inferTopic } from '@/lib/evidence'
import { decideAction } from '@/lib/decision'
import { buildVisibilityModel } from '@/lib/visibility-model'
import { buildKnowledgeGraph } from '@/lib/knowledge-graph'
import { buildTechnicalReadiness } from '@/lib/technical-readiness'
import { buildFoundations } from '@/lib/foundations'
import { selectStrategicDecisions } from '@/lib/recommendation-selection'
import { assembleRecommendation } from '@/lib/recommendation'
import { PROSE_SYSTEM, proseSchema, buildProseInput, OPENING_SYSTEM, openingSchema, buildOpeningInput, attachSequence } from '@/lib/recommendation-prose'
import { toCanonicalRecommendation } from '@/lib/recommendation-assembler'
import { buildCase } from '@/lib/recommendation-case'
import { computeContinuity } from '@/lib/recommendation-continuity'
import { fetchGa4Rows, fetchGa4BySource } from '@/lib/ga4-fetch'
import { buildSwissnetInfluence } from '@/lib/swissnet-influence'
import type { Ga4SourceRow } from '@/lib/ga4-fetch'
import { buildBehavioralSignal } from '@/lib/ga4-behavioral'
import { deriveBehaviouralClaims } from '@/lib/ga4-insight'
import { buildAiPerformance } from '@/lib/ai-performance'
import { fetchGscRows } from '@/lib/gsc-fetch'
import { buildGscSignal } from '@/lib/gsc-performance'
import { analyzeAndMapReviews } from '@/lib/review-analyze'

export const maxDuration = 120

// ─── GROUNDED CONSULTANT ───
// Reasons ONLY over stored Brain facts + audit findings. Never invents metrics,
// traffic, rankings, competitor claims, or percentages. Every move cites stored data.

const CONSULTANT_SYSTEM = `You are a senior AI-visibility consultant for luxury hotels. You advise a non-technical hotel marketing director. You are given two things about ONE hotel, both produced by an automated system from the hotel's own website:
1) KNOWN FACTS — what the hotel's site actually states (each with an evidence quote). This is what AI assistants can currently retrieve and trust.
2) OPEN FINDINGS — gaps the audit found: missing pages, missing page sections, and guest questions the site cannot answer (each with the affected guest searches).

Your job is to REASON like a consultant, not to list tasks. Produce a strategic diagnosis grounded ONLY in the facts and findings provided.

ABSOLUTE RULES:
- Use ONLY the provided facts and findings. NEVER invent anything: no traffic numbers, no percentages, no rankings, no competitor names or claims, no "industry average", no made-up statistics. If you don't have a number, don't use one.
- Every strategic move MUST reference at least one specific stored fact OR finding, name the affected guest searches it would unlock, and explain the AI-retrieval reasoning (WHY an AI can or cannot recommend the hotel for it).
- Reason about CONNECTIONS the site fails to make, not just missing pages. Example pattern: "AI knows you have X (fact) and Y (fact) but nothing connects them for use-case Z, so the searches [affected] go unanswered."
- "confidence": High/Medium/Low — reflects EVIDENCE STRENGTH: High = multiple facts + a finding directly support it; Medium = one fact supports it; Low = thin/indirect signal.
- "effort": Low/Medium/High. "priority": 1 = do first.
- Be specific to THIS hotel. Never write a sentence that could apply to any hotel.

PRIORITIZE LIKE A HOTEL REVENUE CONSULTANT, not a content checklist:
1. RELEVANCE GATE — Only rank something a TOP MOVE if the hotel clearly HAS that offer (2+ supporting facts) OR there is a clear commercial finding for it. A single incidental mention (e.g. one yoga class) is NOT a wellness product — put it in what_not_to_do_yet or mark it Low confidence, never a top priority.
1a. EVIDENCE-STATE RULE (CRITICAL) — Some findings are marked "UNVERIFIED — NOT CRAWLED". This means the audit never read a page for that topic, so the system does NOT know whether the hotel offers it. You MUST NOT recommend CREATING a page for an unverified-not-crawled topic, and MUST NOT state or imply the hotel lacks it. Absence from the crawl is NOT absence from the hotel. For these, the correct move is to VERIFY: title it like "Confirm and surface your [topic] offering", build_type "Section on existing page" or "New page" ONLY if the hotel confirms they offer it, and phrase why_this_priority around "we could not verify this from your site — confirm whether you offer it; if you do, it needs a crawlable page so AI can find it." A finding marked "LIKELY GAP — CRAWLED, NOT FOUND" CAN justify creating a page (we looked where it would be and found nothing). Never treat NOT-CRAWLED and CRAWLED-NOT-FOUND the same way.
1b. EXISTING-PAGE AWARENESS — You are told which page topics already exist. If a page for THIS MOVE'S topic already exists, recommend strengthening it (build_type "Section on existing page") and name that page in what_to_build. If the topic has NO existing page of its own, recommend a New page — do NOT graft the topic onto an unrelated existing page just to avoid creating one (e.g. never put wedding/romantic content on the Meetings & Events page, or family content on a Dining page). Match the recommendation to the page whose subject actually fits: strengthen when the right page exists, create when it genuinely doesn't. Recommending creation of a page that already exists destroys trust; so does housing a topic on a page where a guest would never look for it.
2. COMMERCIAL INTENT — Rank by what drives bookings. Revenue-driving intents come first: rooms, dining, meetings, weddings, business, location, luxury, romantic. Then offers, family, wellness. Practical trust pages (accessibility, parking, pets) matter for completeness but are hygiene, NOT flagship strategic moves — only elevate one if it is a clear booking dealbreaker for this hotel.
3. PAGE vs SECTION — Do NOT default to "create a page". If the hotel already has related content, the right fix is often a homepage Quick-Facts block, an FAQ answer, or a section on an existing page. Recommend the SMALLEST fix that unlocks the searches, and say which (page / section / FAQ / Quick-Facts).
4. JUSTIFY THE RANK — Each top move's reasoning must answer "why this before the other findings?", referencing how many guest searches it unlocks AND its commercial importance.
5. Return the 3 (at most 4) highest-leverage moves only — never a long list.

EVIDENCE-STATE CONTRACT (MANDATORY — every move MUST set these three fields honestly):
- "evidence_state": one of "confirmed" | "unverified" | "contradicted".
    • "confirmed" = the KNOWN FACTS contain 2+ substantive, on-topic facts that establish the hotel genuinely offers this (e.g. multiple dining facts naming the restaurant). Only "confirmed" may build/strengthen/generate.
    • "unverified" = you CANNOT establish from the facts that the hotel offers this. Use this when the topic has zero facts, only 1 incidental mention, or facts that appear ONLY on utility pages (news, reservation, careers) — i.e. the Knowledge Graph marks it contaminated/absent. A single yoga mention = unverified, NOT confirmed.
    • "contradicted" = the facts actively conflict (the site says two incompatible things).
- "evidence_reason": one of "confirmed_facts" (for confirmed) | "unseen" (no page crawled) | "absent" (looked, found nothing) | "contaminated" (facts only on utility pages) | "insufficient_evidence" (too thin to confirm).
- "allowed_actions": the actions this evidence permits. If evidence_state is "confirmed": choose from ["strengthen_page","create_page","add_section","add_faq","add_schema"]. If "unverified": MUST be exactly ["verify"]. If "contradicted": MUST be exactly ["investigate","verify"].
- CRITICAL: a move's build_type and title may be phrased nicely, but evidence_state is the binding field. NEVER mark a topic "confirmed" to justify creating a page when the facts are thin or incidental. When in doubt, mark "unverified". The system will REFUSE to generate content for unverified/contradicted moves — so honesty here protects the hotel from fabricated content.

Return STRICTLY this JSON shape:
{
  "executive_diagnosis": string,
  "one_line_priority": string,
  "ai_understands": [string],
  "ai_cannot_connect": [string],
  "work_plan": {
    "quick_wins": [string],
    "strategic_projects": [string]
  },
  "top_moves": [
    {
      "title": string,
      "why_this_priority": string,
      "why_ai_cares": string,
      "what_to_build": string,
      "build_type": "New page"|"Section on existing page"|"Homepage block"|"FAQ only",
      "evidence_state": "confirmed"|"unverified"|"contradicted",
      "evidence_reason": "confirmed_facts"|"unseen"|"absent"|"contaminated"|"insufficient_evidence",
      "allowed_actions": [string],
      "sections_to_add": [string],
      "implementation_steps": [string],
      "questions_to_answer": [string],
      "affected_searches": [string],
      "expected_ai_effect": string,
      "success_criteria": string,
      "reasoning": string,
      "evidence": [string],
      "confidence": "High"|"Medium"|"Low",
      "effort": "Low"|"Medium"|"High",
      "priority": integer
    }
  ],
  "next_opportunities": [
    { "title": string, "why": string, "effort": "Low"|"Medium"|"High" }
  ],
  "what_not_to_do_yet": string
}

DEPTH REQUIREMENTS:
- one_line_priority is the headline a GM reads first — specific and decisive, naming the actual move (e.g. "Your fastest win is a romantic & weddings page — you already have the assets, AI just can't connect them").
- why_ai_cares must explain AI RETRIEVAL specifically: AI assistants avoid recommending what they cannot confirm. Name what's unconfirmed and why that blocks a confident recommendation.
- implementation_steps: 3-6 concrete ordered actions a hotel's web person follows — a real checklist, not "add content about X".
- success_criteria describes the observable result with NO invented numbers — what an AI assistant would be able to answer that it can't today.
- next_opportunities must be genuinely DIFFERENT findings from the top 3 — the next layer down, not restatements.
- work_plan.quick_wins are low-effort high-value fixes (an FAQ, a Quick-Facts block); strategic_projects are bigger builds (a new page).
- Depth does NOT mean inventing — it means fuller reasoning over the SAME facts and findings. Stay grounded.

RECOMMENDABILITY FRAMING (when a "RECOMMENDABILITY ANALYSIS" block is present in the input):
That block is the strategic spine — it grades, per real traveller intent, whether the WEBSITE gives AI enough evidence to RECOMMEND (justify choosing the hotel), EXPLAIN (describe it accurately), or CONFIRM (answer practical booking questions). Use it as follows:
- "executive_diagnosis" and "ai_understands" must ACKNOWLEDGE STRENGTHS FIRST using the COVERED intents — name what AI can already confidently do for this hotel (e.g. "AI can already recommend L'Oscar for its dining and explain its rooms") before naming gaps. A diagnosis that only lists problems is wrong; the hotel has real strengths and the GM must see them.
- "ai_cannot_connect" and the gap reasoning must draw from the NOT COVERED and PARTIAL intents, phrased as RECOMMENDABILITY, not facts: prefer "AI lacks the evidence to confidently recommend the hotel for [traveller intent]" over "the site is missing a [topic] page". The gap is about AI's ability to JUSTIFY a recommendation, not about a missing HTML element.
- For PARTIAL intents, the framing is "AI understands X but cannot yet explain WHY [intent]" — the evidence exists but is under-leveraged. Use the named "evidence needed" to say what would strengthen it.
- NEVER claim the website causes AI to not recommend the hotel. Say the site provides limited EVIDENCE for AI to JUSTIFY a recommendation — correlation and capability, never causation. Never promise more visibility or bookings.
- Discovery-stage intents are intentionally absent (measured separately by AI Visibility). Do not invent discovery judgements.`

function consultantSchema() {
  return {
    type: 'object', additionalProperties: false,
    required: ['executive_diagnosis','one_line_priority','ai_understands','ai_cannot_connect','work_plan','top_moves','next_opportunities','what_not_to_do_yet'],
    properties: {
      executive_diagnosis: { type: 'string' },
      one_line_priority: { type: 'string' },
      ai_understands: { type: 'array', items: { type: 'string' } },
      ai_cannot_connect: { type: 'array', items: { type: 'string' } },
      work_plan: {
        type: 'object', additionalProperties: false,
        required: ['quick_wins','strategic_projects'],
        properties: {
          quick_wins: { type: 'array', items: { type: 'string' } },
          strategic_projects: { type: 'array', items: { type: 'string' } },
        },
      },
      top_moves: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['title','why_this_priority','why_ai_cares','what_to_build','build_type','evidence_state','evidence_reason','allowed_actions','sections_to_add','implementation_steps','questions_to_answer','affected_searches','expected_ai_effect','success_criteria','reasoning','evidence','confidence','effort','priority'],
          properties: {
            title: { type: 'string' },
            why_this_priority: { type: 'string' },
            why_ai_cares: { type: 'string' },
            what_to_build: { type: 'string' },
            build_type: { type: 'string', enum: ['New page','Section on existing page','Homepage block','FAQ only'] },
            evidence_state: { type: 'string', enum: ['confirmed','unverified','contradicted'] },
            evidence_reason: { type: 'string', enum: ['confirmed_facts','unseen','absent','contaminated','insufficient_evidence'] },
            allowed_actions: { type: 'array', items: { type: 'string' } },
            sections_to_add: { type: 'array', items: { type: 'string' } },
            implementation_steps: { type: 'array', items: { type: 'string' } },
            questions_to_answer: { type: 'array', items: { type: 'string' } },
            affected_searches: { type: 'array', items: { type: 'string' } },
            expected_ai_effect: { type: 'string' },
            success_criteria: { type: 'string' },
            reasoning: { type: 'string' },
            evidence: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'string', enum: ['High','Medium','Low'] },
            effort: { type: 'string', enum: ['Low','Medium','High'] },
            priority: { type: 'integer' },
          },
        },
      },
      next_opportunities: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['title','why','effort'],
          properties: {
            title: { type: 'string' },
            why: { type: 'string' },
            effort: { type: 'string', enum: ['Low','Medium','High'] },
          },
        },
      },
      what_not_to_do_yet: { type: 'string' },
    },
  }
}

function pathOf(u: string): string {
  try { return new URL(u).pathname.replace(/\/$/, '') || '/' } catch { return u || '' }
}

// ─── STRUCTURAL DIAGNOSIS: pull the audit's page-structure + answerability findings ───
// Deterministic, no GPT. Feeds the consultant the audit's real analysis so recommendations
// cover structure and prompt-answerability, not just topic gaps. Reads hotel_audits.result.
function buildAuditBrief(result: any): { weakPages: string[]; unanswered: string[]; contentWeak: string[]; auditScore: number | null } {
  if (!result || typeof result !== 'object') return { weakPages: [], unanswered: [], contentWeak: [], auditScore: null }
  const weakPages: string[] = []
  for (const p of (result.importantPages || [])) {
    if (p.status !== 'Present') continue
    const missing = Array.isArray(p.missing) ? p.missing : []
    if (typeof p.score === 'number' && p.score < 75 && missing.length) {
      const aff = (p.affects || []).slice(0, 3).join('; ')
      weakPages.push(`${p.displayName || p.label} (${pathOf(p.url || '')}, score ${p.score}/100) is missing: ${missing.join(', ')}.${aff ? ` Blocks searches: ${aff}` : ''}`)
    }
  }
  const unanswered: string[] = []
  for (const r of (result.recommendation?.results || [])) {
    if (r.readiness === 'NO' || r.readiness === 'PARTIAL') {
      const why = (r.reasons || []).slice(0, 2).join('; ')
      unanswered.push(`[${r.readiness}] "${r.question}" (${r.category})${why ? ` — ${why}` : ''}`)
    }
  }
  const contentWeak: string[] = []
  const cq = result.contentQuality
  if (cq && Array.isArray(cq.categories)) {
    for (const c of cq.categories) {
      if (typeof c.score === 'number' && c.score < 70) contentWeak.push(`${c.name || c.label || c.category || 'content'}: ${c.score}/100${c.issue ? ` — ${c.issue}` : ''}`)
    }
  }
  const auditScore = typeof result.recommendation?.score === 'number' ? result.recommendation.score : (typeof result.architectureScore === 'number' ? result.architectureScore : null)
  return { weakPages: weakPages.slice(0, 12), unanswered: unanswered.slice(0, 18), contentWeak: contentWeak.slice(0, 8), auditScore }
}

// ─── RECOMMENDABILITY BRIEF (V3) ───
// Surfaces the new catalogue-based audit output: per traveller-intent recommendability,
// grouped by coverage (covered / partial / not covered) AND by journey stage
// (recommendation / evaluation / booking). Discovery stays reference-only — never
// website-scored, so it is excluded here. Deterministic, no GPT. Additive context only:
// this does NOT drive decision selection (step 1 is data wiring); the consultant simply
// now SEES what the site can and cannot justify, so future prose can say
// "AI can already explain X but lacks evidence for Y."
function buildRecommendabilityBrief(result: any): {
  hasCatalogue: boolean
  byStage: Record<string, { covered: string[]; partial: string[]; notCovered: string[] }>
} {
  const empty = { hasCatalogue: false, byStage: {} as Record<string, { covered: string[]; partial: string[]; notCovered: string[] }> }
  if (!result || typeof result !== 'object') return empty
  const results = result.recommendation?.results || []
  // Detect the V3 catalogue path: catalogue intents carry intent_id + stage + audit_question.
  const catalogueRows = results.filter((r: any) => r && r.intent_id && r.stage && r.stage !== 'discovery')
  if (!catalogueRows.length) return empty

  const STAGE_LABEL: Record<string, string> = {
    recommendation: 'Recommendation Evidence (can AI justify recommending the hotel?)',
    evaluation: 'Evaluation (can AI accurately explain the hotel?)',
    booking: 'Booking Confidence (can AI answer practical pre-booking questions?)',
  }
  const byStage: Record<string, { covered: string[]; partial: string[]; notCovered: string[] }> = {}

  const line = (r: any): string => {
    const intent = r.traveller_intent || r.audit_question || r.question || r.intent_id
    const reasons = Array.isArray(r.reasons) && r.reasons.length ? ` — gaps: ${r.reasons.slice(0, 3).join('; ')}` : ''
    const exp = Array.isArray(r.expected_evidence) && r.expected_evidence.length ? ` | evidence needed: ${r.expected_evidence.slice(0, 3).join('; ')}` : ''
    const quote = r.evidence ? ` | site states: "${String(r.evidence).slice(0, 90)}"` : ''
    return `[${r.category}/${r.intent_id}] ${intent}${quote}${reasons}${exp}`
  }

  for (const r of catalogueRows) {
    const stageKey = STAGE_LABEL[r.stage] ? r.stage : 'evaluation'
    const bucket = (byStage[stageKey] ||= { covered: [], partial: [], notCovered: [] })
    if (r.readiness === 'YES') bucket.covered.push(line(r))
    else if (r.readiness === 'PARTIAL') bucket.partial.push(line(r))
    else bucket.notCovered.push(line(r))
  }
  return { hasCatalogue: true, byStage }
}

// Render the recommendability brief into the consultant's reading block. Returns '' when
// the hotel is not on the V3 catalogue path (so non-luxury_city hotels see no change).
function renderRecommendabilityBrief(brief: ReturnType<typeof buildRecommendabilityBrief>): string {
  if (!brief.hasCatalogue) return ''
  const STAGE_LABEL: Record<string, string> = {
    recommendation: 'RECOMMENDATION EVIDENCE — can AI justify RECOMMENDING the hotel for this traveller intent?',
    evaluation: 'EVALUATION — can AI accurately EXPLAIN the hotel for this intent?',
    booking: 'BOOKING CONFIDENCE — can AI answer this practical pre-booking question?',
  }
  const order = ['recommendation', 'evaluation', 'booking']
  const parts: string[] = []
  for (const stage of order) {
    const b = brief.byStage[stage]
    if (!b) continue
    const seg: string[] = [`\n■ ${STAGE_LABEL[stage] || stage.toUpperCase()}`]
    seg.push(`  ✓ COVERED (AI can already do this — do NOT recommend work here): ${b.covered.length ? '\n    ' + b.covered.join('\n    ') : '(none)'}`)
    seg.push(`  ◐ PARTIAL (evidence exists but is thin — strengthen, don't recreate): ${b.partial.length ? '\n    ' + b.partial.join('\n    ') : '(none)'}`)
    seg.push(`  ✗ NOT COVERED (AI lacks evidence to do this — the real opportunities): ${b.notCovered.length ? '\n    ' + b.notCovered.join('\n    ') : '(none)'}`)
    parts.push(seg.join('\n'))
  }
  return parts.join('\n')
}

// ─── EVIDENCE-STATE RECONCILIATION ───
// The Knowledge Graph is the source of truth for evidence_state, NOT GPT.
// absent → unverified. contaminated + thin (<=2 facts) → unverified.
// Real offerings (enough facts) keep GPT's emitted state. GPT never overrides the graph.
const RECON_TOPIC_RE: { kgTopic: string; re: RegExp }[] = [
  { kgTopic: 'meetings', re: /(meeting|business|conference|event|baptist|corporate)/i },
  { kgTopic: 'dining',   re: /(dining|restaurant|bar|brasserie|afternoon[- ]?tea|cuisine|food)/i },
  { kgTopic: 'spa',      re: /(spa|wellness|wellbeing|thermal)/i },
  { kgTopic: 'weddings', re: /(wedding|romance|romantic|honeymoon|civil|ceremon|couple)/i },
  { kgTopic: 'family',   re: /(family|kids|children)/i },
  { kgTopic: 'rooms',    re: /(rooms?|suites?|accommodation)/i },
  { kgTopic: 'location', re: /(location|neighbourhood|attractions?|transport)/i },
]
function reconcileEvidenceState(move: any, knowledgeGraph: any): { evidence_state: string; evidence_reason: string } {
  const gptState = (move?.evidence_state === 'confirmed' || move?.evidence_state === 'contradicted') ? move.evidence_state : 'unverified'
  const blob = `${move?.title || ''} ${move?.what_to_build || ''}`.toLowerCase()
  const topic = RECON_TOPIC_RE.find(t => t.re.test(blob))?.kgTopic || null
  const cluster = topic && knowledgeGraph?.clusters ? knowledgeGraph.clusters.find((c: any) => c.topic === topic) : null
  if (!cluster) return { evidence_state: gptState, evidence_reason: move?.evidence_reason || (gptState === 'confirmed' ? 'confirmed_facts' : 'insufficient_evidence') }
  const factCount = cluster.facts || 0
  if (cluster.cluster_state === 'absent') return { evidence_state: 'unverified', evidence_reason: 'absent' }
  if (cluster.cluster_state === 'contaminated' && factCount <= 2) return { evidence_state: 'unverified', evidence_reason: 'contaminated' }
  return { evidence_state: gptState, evidence_reason: move?.evidence_reason || (gptState === 'confirmed' ? 'confirmed_facts' : 'insufficient_evidence') }
}

// ─── DECISION → MOVE (Step 2): board decisions drive the moves, GPT only explains ───
const DM_CONFIRMED = new Set(['Commit', 'Convert', 'Fix-foundation'])
const DM_BUILD_TYPE: Record<string, string> = { consolidate: 'Section on existing page', add_schema: 'FAQ only', strengthen: 'Section on existing page', verify: 'Section on existing page', investigate: 'Section on existing page', fix_trust: 'FAQ only' }
const DM_EFFORT: Record<string, string> = { consolidate: 'Medium', add_schema: 'Low', strengthen: 'Medium', verify: 'Low', investigate: 'Low', fix_trust: 'Low' }
const DM_QRE: Record<string, RegExp> = { rooms: /(rooms?|suite|luxury)/i, dining: /(dining|restaurant|vegan|menu|tea)/i, meetings: /(business|meeting|corporate|event)/i, location: /(location|attraction|near|transport)/i, weddings: /(romantic|wedding)/i, spa: /(spa|wellness)/i, family: /(family)/i }
function decisionToMove(decision: any, knowledgeGraph: any, auditBrief: any, technical: any): any {
  const cluster = (knowledgeGraph?.clusters || []).find((c: any) => c.topic === decision.topic) || null
  const evidence_state = DM_CONFIRMED.has(decision.posture) ? 'confirmed' : 'unverified'
  const evidence_reason = evidence_state === 'confirmed' ? 'confirmed_facts' : (cluster?.cluster_state === 'absent' ? 'absent' : 'contaminated')
  let sections: string[] = [], questions: string[] = []
  if (evidence_state === 'confirmed') {
    if (decision.posture === 'Fix-foundation') {
      sections = (technical?.findings || []).filter((f: any) => f.action === 'add_schema').map((f: any) => f.fix).slice(0, 3)
    } else {
      const qre = DM_QRE[decision.topic]
      questions = (auditBrief?.unanswered || []).filter((q: string) => qre && qre.test(q)).slice(0, 5)
      if (decision.action_intent === 'consolidate') sections = [`Consolidate all ${decision.label.toLowerCase()} content onto one canonical page`]
      else if (decision.action_intent === 'add_schema') sections = ['Add structured schema', ...questions.slice(0, 2)]
      else sections = questions.slice(0, 3)
    }
  }
  return {
    title: decision.headline,
    what_to_build: decision.rationale,
    why_this_priority: decision.rationale,
    evidence_state, evidence_reason,
    build_type: DM_BUILD_TYPE[decision.action_intent] || 'Section on existing page',
    effort: DM_EFFORT[decision.action_intent] || 'Medium',
    confidence: decision.certainty >= 0.85 ? 'High' : decision.certainty >= 0.5 ? 'Medium' : 'Low',
    sections_to_add: sections,
    questions_to_answer: questions,
    evidence: [],
    posture: decision.posture,
    topic: decision.topic,
  }
}

// Phase 1 Fix 2: real evidence for Commit/Convert decisions, from canonical-page facts (confidence-ranked).
// Foundation/Confirm stay empty — no confirming evidence to honestly show.
const DM_EV_CAT: Record<string, string> = { rooms: 'rooms', dining: 'dining', meetings: 'meetings', weddings: 'weddings', spa: 'spa', family: 'family', location: 'location', offers: 'offers' }
function evidenceForDecision(decision: any, knowledgeGraph: any, facts: any[]): string[] {
  if (decision?.posture !== 'Commit' && decision?.posture !== 'Convert') return []
  const cluster = (knowledgeGraph?.clusters || []).find((c: any) => c.topic === decision.topic)
  if (!cluster) return []
  const cat = DM_EV_CAT[decision.topic]
  const topicFacts = (facts || []).filter((f: any) => (f.category || '').toLowerCase() === cat)
  const toPath = (u: string) => { try { return new URL(u).pathname.replace(/\/$/, '').toLowerCase() } catch { return (u || '').toLowerCase() } }
  const canonical = cluster.canonical_page ? cluster.canonical_page.toLowerCase() : null
  const onCanonical = canonical ? topicFacts.filter((f: any) => toPath(f.page_url || '') === canonical) : []
  const pool = onCanonical.length ? onCanonical : topicFacts
  return pool
    .sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0))
    .slice(0, 3)
    .map((f: any) => f.evidence_quote ? `${f.fact_value} — "${String(f.evidence_quote).slice(0, 90)}"` : f.fact_value)
}

// Which page "topics" the site already has, derived from the URLs the Brain crawled.
const PAGE_TOPICS: { topic: string; re: RegExp }[] = [
  { topic: 'meetings & events', re: /(meeting|event|conference|baptist)/i },
  { topic: 'dining', re: /(restaurant|dining|bar|brasserie|afternoon-tea)/i },
  { topic: 'rooms & suites', re: /(accommodation|rooms?|suites?)/i },
  { topic: 'spa / wellness', re: /(spa|wellness)/i },
  { topic: 'weddings', re: /(wedding|civil)/i },
  { topic: 'about / story', re: /(about|story|heritage)/i },
  { topic: 'location', re: /(location|neighbourhood|directions)/i },
  { topic: 'offers', re: /(offers?|packages?)/i },
  { topic: "what's on / experiences", re: /(whats-on|experience|things-to-do)/i },
  { topic: 'contact', re: /(contact)/i },
]
function existingPages(facts: any[]): { topics: string[]; paths: string[] } {
  const paths = Array.from(new Set((facts || []).map(f => pathOf(f.page_url || '')).filter(p => p && p !== '/')))
  const topics = new Set<string>()
  for (const p of paths) for (const t of PAGE_TOPICS) if (t.re.test(p)) topics.add(t.topic)
  return { topics: [...topics], paths }
}

function buildBrief(facts: any[], findings: any[]) {
  // Human-readable evidence: the actual quote + the page it came from (not internal keys)
  const factLines = facts.slice(0, 120).map(f => {
    const q = (f.evidence_quote || '').slice(0, 120)
    const p = pathOf(f.page_url || '')
    return `[${f.category}] ${f.fact_value}${q ? `  — "${q}"` : ''}${p ? ` (${p})` : ''}`
  })
  // The crawled-page list = the pages the Brain actually read (from fact URLs).
  const pagesScraped = Array.from(new Set((facts || []).map(f => f.page_url || '').filter(Boolean)))
  // ── EVIDENCE GUARD: a "missing_page" finding is only a real gap if the page-type
  // was actually crawled. If we never crawled it, we CANNOT say the hotel lacks it —
  // so frame it as VERIFY, not CREATE. Absence from crawl ≠ absence from hotel.
  const missingPages = findings.filter(f => f.type === 'missing_page').map(f => {
    // prefer a stored evidence_state if the audit already computed one; else derive it
    let state = f.evidence_state as string | undefined
    let reason = f.evidence_reason as string | undefined
    const topic = inferTopic('', f.title, [])
    if (!state && topic) { const ev = classifyGap(topic, pagesScraped, facts); state = ev.evidence_state; reason = ev.reason || undefined }
    const aff = (f.affected_queries || []).join('; ')
    if (state === 'unverified' && reason === 'unseen') {
      return `UNVERIFIED — NOT CRAWLED: No ${topic || 'such'} page was among the pages we read, so we CANNOT confirm whether the hotel offers ${topic || 'this'}. Recommend VERIFYING the offering (a "confirm whether you offer X" move), NOT creating a page as if it is absent. Affected searches: ${aff}`
    }
    if (state === 'unverified' && reason === 'absent') {
      return `LIKELY GAP — CRAWLED, NOT FOUND: pages where ${topic || 'this'} would appear were crawled but none confirmed it; a new page may be justified. Affects: ${aff}`
    }
    return `MISSING PAGE: ${f.title} → affects: ${aff}`
  })
  const weakElements = findings.filter(f => f.type === 'missing_element').map(f => `WEAK: ${f.title}`)
  const unanswered = findings.filter(f => f.type === 'unanswered_query').map(f => `UNANSWERED: ${f.title}`)
  const factCountByCat: Record<string, number> = {}
  for (const f of facts) factCountByCat[f.category] = (factCountByCat[f.category] || 0) + 1
  return { factLines, missingPages, weakElements, unanswered, factCountByCat }
}

export async function POST(req: Request) {
  try {
    const { hotelId, password } = await req.json()
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 })
    const openaiKey = process.env.OPENAI_API_KEY
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!openaiKey || !sbUrl || !sbKey) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    const sb = createClient(sbUrl, sbKey)

    const { data: brain } = await sb.from('hotel_brains').select('id, hotel_name, city, knowledge').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1).single()
    if (!brain) return NextResponse.json({ error: 'No Hotel Brain found. Run /api/hotel-brain first.' }, { status: 404 })

    // Owner-confirmed list of dimensions this hotel genuinely does not offer (e.g. no spa).
    // Excluded from the AI Visibility score, shown as "Not offered" — never scored as weak.
    // EXCLUSION authority = hotels.not_offered ONLY (never the profile's not_offered_experiences).
    let notOffered: string[] = []
    try {
      const { data: hotelRow } = await sb.from('hotels').select('not_offered').eq('id', hotelId).single()
      if (Array.isArray(hotelRow?.not_offered)) notOffered = hotelRow.not_offered
    } catch {}

    // Confirmed hotel profile: SELECTS which visibility dimensions are relevant for this hotel
    // (adaptive per archetype). Only a CONFIRMED profile is used; otherwise the visibility model
    // falls back to its full fixed dimension set (every un-profiled hotel unchanged).
    let hotelProfile: any = null
    try {
      const { data: prof } = await sb.from('hotel_profile').select('*').eq('hotel_id', hotelId).maybeSingle()
      if (prof?.taxonomy_status === 'confirmed') hotelProfile = prof
    } catch {}
    const { data: facts } = await sb.from('hotel_facts').select('category, fact_key, fact_value, evidence_quote, page_url, confidence').eq('brain_id', brain.id)

    let findings: any[] = []
    const { data: fRows } = await sb.from('audit_findings').select('finding_key, type, title, affected_queries, audit_run_id, created_at').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(400)
    if (fRows && fRows.length) { const lastRun = fRows[0].audit_run_id; findings = fRows.filter((r: any) => r.audit_run_id === lastRun) }

    // Load the latest audit's STRUCTURAL diagnosis (page structure + answerability) and integrate it.
    let auditBrief = { weakPages: [] as string[], unanswered: [] as string[], contentWeak: [] as string[], auditScore: null as number | null }
    let recommendabilityBrief = { hasCatalogue: false, byStage: {} as Record<string, { covered: string[]; partial: string[]; notCovered: string[] }> }
    let latestAuditResult: any = null
    try {
      const { data: auditRow } = await sb.from('hotel_audits').select('result').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1).single()
      if (auditRow?.result) { latestAuditResult = auditRow.result; auditBrief = buildAuditBrief(auditRow.result); recommendabilityBrief = buildRecommendabilityBrief(auditRow.result) }
    } catch {}

    // CONTINUITY: load the most recent PRIOR advisory so this run can compare against it.
    let previousAdvisory: any = null
    let previousAdvisoryDate: string | null = null
    try {
      const { data: prevRows } = await sb.from('hotel_consultant').select('advisory, created_at').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1)
      if (prevRows && prevRows.length) { previousAdvisory = prevRows[0].advisory; previousAdvisoryDate = prevRows[0].created_at }
    } catch {}

    // ── AI VISIBILITY MODEL: compute how AI currently "sees" the hotel (deterministic) ──
    // notOffered (hotels.not_offered) = EXCLUSION authority; hotelProfile = dimension SELECTION.
    const visibilityModel = buildVisibilityModel(facts || [], latestAuditResult, notOffered, hotelProfile)

    // ── KNOWLEDGE GRAPH: the site's information architecture (deterministic) ──
    // The consultant CONSUMES this instead of re-inferring website structure.
    const knowledgeGraph = buildKnowledgeGraph(facts || [], latestAuditResult)

    // ── TECHNICAL AI-READINESS: schema, retrieval blocks, trust signals (from architecture block) ──
    const technical = buildTechnicalReadiness(latestAuditResult)
    const techLines = technical.findings.map(f => `[${f.severity}] ${f.layer} → ${f.action}: ${f.fix} (${f.evidence})`)
    // Compact lines the consultant reasons over: only clusters that need action.
    const graphLines = knowledgeGraph.clusters
      .filter(c => c.cluster_state !== 'consolidated' && c.cluster_state !== 'absent')
      .sort((a, b) => (a.commercial_importance === 'High' ? 0 : 1) - (b.commercial_importance === 'High' ? 0 : 1))
      .map(c => `${c.label} [${c.cluster_state.toUpperCase()}, health ${c.cluster_health}/100, ${c.commercial_importance} importance] → ${c.recommendation}: ${c.explanation}`)

    if ((!facts || !facts.length) && !findings.length) return NextResponse.json({ error: 'No stored facts or findings for this hotel yet.' }, { status: 404 })

    const brief = buildBrief(facts || [], findings)
    const existing = existingPages(facts || [])
    const catCounts = Object.entries(brief.factCountByCat).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}: ${n}`).join(', ')
    const user = `HOTEL: ${brain.hotel_name || ''} (${brain.city || ''})

PAGES THAT ALREADY EXIST ON THE SITE (crawled): ${existing.paths.length ? existing.paths.join(', ') : '(none detected)'}
PAGE TOPICS ALREADY COVERED: ${existing.topics.length ? existing.topics.join(', ') : '(none detected)'}
→ If a topic above already has a page, NEVER say "create a [topic] page". Say "strengthen" / "add a section to" the existing page, and set build_type to "Section on existing page".

SUPPORTING FACTS PER CATEGORY: ${catCounts || '(none)'}
→ A category with only 1 incidental fact (e.g. a single yoga mention) must NOT be a top move — put it in what_not_to_do_yet or mark it Low confidence. A category may be a top move only if it has 2+ supporting facts OR a clear commercial finding (a missing/weak page tied to revenue intent).

KNOWN FACTS (what the site states, with evidence quote + page):
${brief.factLines.join('\n')}

OPEN FINDINGS:
${brief.missingPages.join('\n')}
${brief.weakElements.join('\n')}
${brief.unanswered.join('\n')}

STRUCTURAL DIAGNOSIS FROM THE WEBSITE AUDIT${auditBrief.auditScore != null ? ` (overall AI-readiness ${auditBrief.auditScore}/100)` : ''}:
These are the audit's measured findings about HOW the existing pages are built and which guest questions the site cannot answer. Use them: a recommendation to "strengthen" a page should name the SPECIFIC missing sections below, and a top move should unlock the unanswered questions below.

WEAK EXISTING PAGES (already crawled — strengthen these, don't recreate them):
${auditBrief.weakPages.length ? auditBrief.weakPages.join('\n') : '(none flagged)'}

GUEST QUESTIONS THE SITE CANNOT CONFIDENTLY ANSWER (AI-answerability gaps):
${auditBrief.unanswered.length ? auditBrief.unanswered.join('\n') : '(none flagged)'}

CONTENT-QUALITY WEAK SPOTS:
${auditBrief.contentWeak.length ? auditBrief.contentWeak.join('\n') : '(none flagged)'}

WEBSITE KNOWLEDGE GRAPH — how the site's information is ARCHITECTURALLY organised:
This is the deterministic analysis of where each topic's facts live and whether AI can form a clean concept. Use it to choose between CONSOLIDATE (facts exist but are scattered — move them onto the canonical page, don't create a new one) vs CREATE (no canonical page exists at all) vs STRENGTHEN (canonical page exists but answerability is weak). A "scattered" topic that already has a canonical page must be CONSOLIDATED, never recreated. A "contaminated" topic (facts only on utility pages like /news or /reservation) needs a real canonical page. When you recommend a move, NAME the architectural problem from below.
${graphLines.length ? graphLines.join('\n') : '(all commercial clusters are well-consolidated)'}

TECHNICAL AI-READINESS GAPS${technical.techScore != null ? ` (technical AI-readiness ${technical.techScore}/100)` : ''}:
These are MACHINE-READABILITY gaps — how well AI systems can parse, trust, and retrieve the site, separate from content. They include missing schema (FAQPage, Review, Restaurant, Event), missing structured retrieval blocks (Quick Facts, AI summary), and missing trust signals. Where relevant, fold these into your moves: a content move to strengthen a page should ALSO note the schema/structured-block it needs (e.g. "add FAQPage schema"). High-severity technical gaps that stand alone (like missing Review schema) can be their own quick-win move with build_type "FAQ only" or a schema note. Do not invent technical detail beyond what's listed.
${techLines.length ? techLines.join('\n') : '(no technical gaps flagged)'}${recommendabilityBrief.hasCatalogue ? `

────────
RECOMMENDABILITY ANALYSIS (how AI reasons about this hotel for real traveller intents):
This is the most important strategic input. For each traveller intent, the audit graded whether the WEBSITE gives AI enough evidence to recommend, explain, or confirm — grouped by what AI can already do (COVERED), what is thin (PARTIAL), and what AI cannot do (NOT COVERED). Use this to understand BOTH the hotel's real strengths AND its gaps: never recommend work on a COVERED intent; strengthen PARTIAL intents using the named "evidence needed"; the NOT COVERED intents are the genuine opportunities. (Discovery-stage intents are measured separately by AI Visibility and are intentionally absent here.)
${renderRecommendabilityBrief(recommendabilityBrief)}` : ''}`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0.2, max_tokens: 2800,
        response_format: { type: 'json_schema', json_schema: { name: 'consultant', strict: true, schema: consultantSchema() } },
        messages: [{ role: 'system', content: CONSULTANT_SYSTEM }, { role: 'user', content: user }],
      }),
    })
    const data = await res.json()
    const c = data?.choices?.[0]?.message?.content
    if (!c) return NextResponse.json({ error: 'Consultant produced no output' }, { status: 502 })
    const advisory = JSON.parse(c)
    // ─── STRATEGIC DECISION LAYER (V4): the board's decisions DRIVE the moves. ───
    // GPT no longer SELECTS recommendations — it only explains the ones the platform chose.
    try { advisory.decision_board = selectStrategicDecisions(knowledgeGraph, technical, latestAuditResult) } catch { advisory.decision_board = null }
    // Promote at most ONE genuinely high-value deferred Case to a 4th priority.
    // Earned-only: never pads — promotes solely when a deferred Commit/Convert clears a
    // real value + certainty bar, so a hotel with only 3 strong moves still shows 3.
    if (advisory.decision_board?.decisions && Array.isArray(advisory.decision_board.deferred)) {
      const dec = advisory.decision_board.decisions
      const def = advisory.decision_board.deferred
      if (dec.length < 4 && def.length) {
        const candidate = def
          .filter((d: any) => (d.posture === 'Commit' || d.posture === 'Convert') && (d.certainty ?? 0) >= 0.8 && (d.value ?? 0) >= 1.0)
          .sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0))[0]
        if (candidate) {
          advisory.decision_board.decisions = [...dec, candidate]
          advisory.decision_board.deferred = def.filter((d: any) => d.topic !== candidate.topic)
        }
      }
    }
    if (advisory.decision_board?.decisions?.length) {
      advisory.top_moves = advisory.decision_board.decisions.map((dec: any) => decisionToMove(dec, knowledgeGraph, auditBrief, technical))
      advisory.declined = advisory.decision_board.declined || null
      advisory.deferred = advisory.decision_board.deferred || []
    }

    // ─── ADDITIONAL OPPORTUNITIES + AI FOUNDATIONS ───
    // The deferred ACTIVE decisions are already ranked by value and already above the floor;
    // they were hidden only because the top slice filled up, not because they lack value.
    // Surface them as real Cases by appending to top_moves so they pass through the SAME
    // enrichment pipeline (evidence, recommendability, Case), then split them back out below.
    // Decline + Defer + no-substance stay hidden — that guard is deliberate. The __site__
    // Fix-foundation decision becomes its own dedicated Foundation Case (all technical lives here).
    const ADDITIONAL_FLOOR = 0.25 // = VALUE_FLOOR; the same bar that defines "a real opportunity"
    let priorityCount = Array.isArray(advisory.top_moves) ? advisory.top_moves.length : 0
    let opportunityCount = 0
    let hasFoundation = false
    if (advisory.decision_board?.decisions?.length && Array.isArray(advisory.deferred)) {
      const OPP_ACTIVE = new Set(['Commit', 'Convert', 'Confirm'])
      const opportunityDecisions = advisory.deferred
        .filter((d: any) => d.topic !== '__site__' && OPP_ACTIVE.has(d.posture) && (d.value ?? 0) >= ADDITIONAL_FLOOR)
        .sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0))
      const foundationDecision = advisory.deferred.find((d: any) => d.topic === '__site__' && d.posture === 'Fix-foundation')
      const oppMoves = opportunityDecisions.map((dec: any) => decisionToMove(dec, knowledgeGraph, auditBrief, technical))
      opportunityCount = oppMoves.length
      const foundationMoves = foundationDecision ? [decisionToMove(foundationDecision, knowledgeGraph, auditBrief, technical)] : []
      hasFoundation = foundationMoves.length > 0
      advisory.top_moves = [...advisory.top_moves, ...oppMoves, ...foundationMoves]
    }
    // ─── DECISION LAYER: deterministically attach a concrete action to each move ───
    // Execute consumes move.decision.action / .target / .generate mechanically.
    const pagesScraped = Array.from(new Set((facts || []).map((f: any) => f.page_url || '').filter(Boolean)))
    if (Array.isArray(advisory?.top_moves)) {
      for (const m of advisory.top_moves) {
        // 1) GRAPH OVERRIDES GPT: compute the TRUE evidence_state before anything consumes it
        try {
          const rec = reconcileEvidenceState(m, knowledgeGraph)
          m.evidence_state = rec.evidence_state
          m.evidence_reason = rec.evidence_reason
        } catch {}
        // 1b) Phase 1 Fix 2: populate real evidence (canonical-page facts) for Commit/Convert
        try { m.evidence = evidenceForDecision(m, knowledgeGraph, facts || []) } catch {}
        // 2) decision obeys the reconciled evidence_state
        try { m.decision = decideAction(m, pagesScraped, facts || []) } catch { m.decision = null }
        // 2b) Phase 1 Fix 1: a Fix-foundation move is a schema action, not an FAQ
        if (m.posture === 'Fix-foundation' && m.decision && m.decision.action === 'add_faq') m.decision.action = 'add_schema'
        // 3) assemble the complete recommendation from the (now honest) state
        try { m.recommendation = assembleRecommendation(m, { visibilityModel, knowledgeGraph, technical, auditBrief }) } catch { m.recommendation = null }
        // 3b) DORMANT: attach the canonical recommendation object (alongside m.recommendation, nothing reads it yet)
        try { m.canonicalRecommendation = toCanonicalRecommendation(m, { knowledgeGraph, audit: latestAuditResult, technical, facts: facts || [] }) } catch { m.canonicalRecommendation = null }
      }

      // 3c) GA4 BEHAVIOURAL ENRICHMENT (DORMANT) — fill future.behavioral per Case.
      // ONE pull for the hotel, reused across every move. Only runs if the hotel's
      // GA4 is connected; otherwise every behavioral slot stays null (today's behaviour).
      let ga4SourceRows: Ga4SourceRow[] | null = null  // SwissNet influence (Path A) reads this; stays null when GA4 absent
      let ga4Connected = false
      let ga4PeriodDays: number | null = null
      try {
        const { data: ga4Hotel } = await sb.from('hotels').select('ga4_property_id, ga4_status').eq('id', hotelId).single()
        if (ga4Hotel?.ga4_status === 'connected' && ga4Hotel?.ga4_property_id) {
          ga4Connected = true
          const ga4 = await fetchGa4Rows(ga4Hotel.ga4_property_id, { days: 28, previous: true })
          if (ga4) {
            for (const m of advisory.top_moves) {
              const affected = m.canonicalRecommendation?.targeting?.affected_pages || []
              const signal = buildBehavioralSignal(ga4.rows, affected, { periodDays: ga4.periodDays, previousRows: ga4.previousRows })
              if (m.canonicalRecommendation?.future) m.canonicalRecommendation.future.behavioral = signal
              // Platform-decided behavioural claims (deterministic, no GPT) for the Advisor.
              const topicLabel = (m.canonicalRecommendation?.targeting?.topic || m.topic || 'these').toString().toLowerCase()
              m.behavioural_claims = deriveBehaviouralClaims(signal, { topicLabel, posture: m.posture })
            }
            // AI PERFORMANCE INTELLIGENCE (summary) — reuses the SAME GA4 pull. Aggregates
            // by AI platform across the whole property. Measurement only, no causal claims.
            advisory.ai_performance = buildAiPerformance(ga4.rows, { periodDays: ga4.periodDays, previousRows: ga4.previousRows })
            ga4PeriodDays = ga4.periodDays
          }
          // SOURCE-LEVEL pull (Path A): isolates revenue GA4 attributes to source=swissnet.
          try {
            const src = await fetchGa4BySource(ga4Hotel.ga4_property_id, { days: 28 })
            if (src) { ga4SourceRows = src.rows; if (ga4PeriodDays == null) ga4PeriodDays = src.periodDays }
          } catch {}
        }
      } catch {}

      // 3c-swissnet) SWISSNET INFLUENCE — clicks are owned data (always real), revenue is
      // Path A (only when GA4 attributes it to source=swissnet). Runs REGARDLESS of GA4 so a
      // hotel with clicks but no GA4 still sees clicks-only; honest-null revenue otherwise.
      try {
        const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
        const { count: clickCount } = await sb
          .from('swissnet_clicks')
          .select('click_id', { count: 'exact', head: true })
          .eq('hotel_id', hotelId)
          .gte('created_at', since)
        advisory.swissnet_influence = buildSwissnetInfluence(
          ga4SourceRows,
          clickCount || 0,
          { periodDays: ga4PeriodDays ?? 28, ga4Connected },
        )
      } catch {}

      // 3c-ii) SEARCH CONSOLE ENRICHMENT (DORMANT) — fill future.search per Case.
      // GSC = pre-click search DEMAND (impressions, clicks, CTR, position, real queries),
      // distinct from GA4's post-click behaviour. One pull, reused across every move.
      // Only runs if the hotel's GSC is connected; otherwise future.search stays null.
      try {
        const { data: gscHotel } = await sb.from('hotels').select('gsc_property, gsc_status').eq('id', hotelId).single()
        if (gscHotel?.gsc_status === 'connected' && gscHotel?.gsc_property) {
          const gsc = await fetchGscRows(gscHotel.gsc_property, { days: 28, previous: true })
          if (gsc) {
            for (const m of advisory.top_moves) {
              const affected = m.canonicalRecommendation?.targeting?.affected_pages || []
              const signal = buildGscSignal(gsc.rows, affected, { periodDays: gsc.periodDays, previousRows: gsc.previousRows })
              if (m.canonicalRecommendation?.future) m.canonicalRecommendation.future.search = signal
            }
          }
        }
      } catch {}

      // 3d) REVIEW INTELLIGENCE ENRICHMENT (DORMANT until a Review Source exists).
      // Loads stored reviews, runs the engine ONCE, maps findings to the Cases
      // present this run. No reviews → skipped, run is unchanged. Reviews NEVER
      // create a Case — matched findings enrich existing Cases; unmatched strong
      // findings become Emerging Opportunities (observational).
      try {
        const { data: reviewRows } = await sb
          .from('hotel_reviews')
          .select('source, rating, review_date, language, text')
          .eq('hotel_id', hotelId)
          .limit(200)
        if (reviewRows && reviewRows.length > 0) {
          const reviews = reviewRows.map((r: any) => ({
            source: r.source || 'unknown',
            rating: typeof r.rating === 'number' ? r.rating : (r.rating != null ? Number(r.rating) : null),
            date: r.review_date || null,
            language: r.language || null,
            text: r.text || '',
          }))
          // Topics of the Cases present this run (canonical topic, fallback m.topic).
          const caseTopics = advisory.top_moves
            .map((m: any) => (m.canonicalRecommendation?.targeting?.topic || m.topic || '').toString().toLowerCase())
            .filter(Boolean)
          const result = await analyzeAndMapReviews(reviews, caseTopics, brain.hotel_name)
          if (result) {
            // Attach matched findings to each Case's review evidence.
            for (const m of advisory.top_moves) {
              const topic = (m.canonicalRecommendation?.targeting?.topic || m.topic || '').toString().toLowerCase()
              const attached = result.mapping.attached[topic]
              if (attached && attached.length && m.canonicalRecommendation) {
                m.canonicalRecommendation.review_evidence = attached
              }
            }
            // Emerging Opportunities — observational, advisory-level, never a Case.
            advisory.emerging_opportunities = result.mapping.emerging
          }
        }
      } catch {}

      // 4) STAGE 2 — prose: GPT explains each ASSEMBLED object (never raw facts), gated by evidence_state
      await Promise.all(advisory.top_moves.map(async (m: any) => {
        if (!m.recommendation) return
        try {
          const pr = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
            body: JSON.stringify({
              model: 'gpt-4o', temperature: 0.3, max_tokens: 700,
              response_format: { type: 'json_schema', json_schema: { name: 'prose', strict: true, schema: proseSchema() } },
              messages: [
                { role: 'system', content: PROSE_SYSTEM },
                { role: 'user', content: 'Recommendation object:\n' + buildProseInput(m.recommendation) + '\n\nReturn only the JSON.' },
              ],
            }),
          })
          const pd = await pr.json()
          const pc = pd?.choices?.[0]?.message?.content
          if (pc) m.recommendation.prose = JSON.parse(pc)
        } catch { m.recommendation.prose = null }
        // DORMANT: build the 5-section consulting Case on the canonical object (runs concurrently with prose)
        try { if (m.canonicalRecommendation) m.canonicalRecommendation.case = await buildCase(m.canonicalRecommendation, openaiKey) } catch {}
      }))

      // ─── SPLIT: partition the enriched list into display layers ───
      // Everything above enriched the combined list identically (Case, recommendability,
      // evidence). From here down — continuity, implementation tracking, sequence, opening —
      // only the PRIORITY moves drive the briefing. Opportunities + Foundation render quietly.
      if (opportunityCount > 0 || hasFoundation) {
        const all = advisory.top_moves
        advisory.top_moves = all.slice(0, priorityCount)
        advisory.next_opportunities = all.slice(priorityCount, priorityCount + opportunityCount)
        advisory.foundation = hasFoundation ? (all[priorityCount + opportunityCount] || null) : null
      } else {
        advisory.next_opportunities = []
        advisory.foundation = null
      }

      // 4b) CONTINUITY — compute BEFORE the opening so the briefing can acknowledge progress.
      // Topic = durable Case identity; posture = chapter. Compares this advisory vs the previous.
      try {
        const continuity = computeContinuity(previousAdvisory, advisory, { prevDate: previousAdvisoryDate || undefined })
        advisory.continuity = continuity
        for (const m of advisory.top_moves) {
          const topic = m.topic || m.canonicalRecommendation?.targeting?.topic
          const cc = continuity.active.find((x: any) => x.topic === topic)
          if (cc && m.canonicalRecommendation) {
            m.canonicalRecommendation.history = {
              status: cc.status, previous_posture: cc.previous_posture, current_posture: cc.current_posture,
              first_seen: cc.first_seen, last_seen: cc.last_seen, summary: cc.summary, changed_metrics: cc.changed_metrics,
            }
          }
        }
      } catch {}

      // 4c) IMPLEMENTATION TRACKING — map the audit memory's item-level diff onto each Case.
      // memory.fixed / memory.stillOpen carry page:/query: keys; we attach the ones whose
      // topic matches the Case. Resolved items = real ✓ (audit confirmed them gone);
      // still-open = ○. No fabrication: a key that matches no Case topic is simply not shown.
      try {
        const mem = latestAuditResult?.memory
        if (mem && !mem.isFirstRun) {
          const keyTopic = (k: string): string => {
            const s = (k || '').toLowerCase()
            if (/(dining|restaurant|bar|brasserie|tea|cuisine|food)/.test(s)) return 'dining'
            if (/(spa|wellness|thermal)/.test(s)) return 'spa'
            if (/(meeting|business|conference|event|corporate)/.test(s)) return 'meetings'
            if (/(wedding|romantic|honeymoon|couple|ceremon)/.test(s)) return 'weddings'
            if (/(family|kids|children)/.test(s)) return 'family'
            if (/(rooms?|suite|accommodation)/.test(s)) return 'rooms'
            if (/(location|neighbourhood|attraction|transport)/.test(s)) return 'location'
            return 'foundation'
          }
          const humanize = (k: string): string => {
            const parts = (k || '').split(':')
            if (parts[0] === 'page') return parts[1].replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) + ' page'
            if (parts[0] === 'query') return parts.slice(2).join(' ').replace(/-/g, ' ').replace(/^./, (c: string) => c.toUpperCase())
            return (k || '').replace(/[:-]/g, ' ')
          }
          const fixedByTopic: Record<string, string[]> = {}
          for (const k of (mem.fixed || [])) {
            // ONLY page-element findings are deterministic across runs. query: keys are
            // GPT-worded and churn every audit (a reworded question looks "fixed" when
            // nothing changed), so they must never produce a ✓ detection. Validation on
            // L'Oscar proved 12/12 query: "fixes" were wording drift, not real changes.
            if (!k.startsWith('page:')) continue
            const t = keyTopic(k)
            const items = (fixedByTopic[t] ||= [])
            const label = humanize(k)
            if (!items.includes(label)) items.push(label)  // dedup: kills the Meetings ×3
          }
          const openByTopic: Record<string, string[]> = {}
          for (const f of (mem.stillOpen || [])) { const key = f.key || f.title || ''; const t = keyTopic(key); (openByTopic[t] ||= []).push(f.title || humanize(key)) }
          for (const m of advisory.top_moves) {
            const topic = (m.canonicalRecommendation?.targeting?.topic || m.topic || '').toString().toLowerCase()
            if (!topic || !m.canonicalRecommendation) continue
            const detected = fixedByTopic[topic] || []
            const stillOpen = openByTopic[topic] || []
            if (detected.length || stillOpen.length) {
              m.canonicalRecommendation.implementation = { detected, stillOpen }
            }
          }
        }
      } catch {}

      // 5) STAGE 3 — sequence labels/transitions (deterministic) + one grounded opening paragraph
      attachSequence(advisory.top_moves)
      try {
        const or = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o', temperature: 0.3, max_tokens: 300,
            response_format: { type: 'json_schema', json_schema: { name: 'opening', strict: true, schema: openingSchema() } },
            messages: [
              { role: 'system', content: OPENING_SYSTEM },
              { role: 'user', content: 'Computed briefing inputs:\n' + buildOpeningInput(visibilityModel, advisory.top_moves, advisory.continuity, brain.hotel_name) + '\n\nReturn only the JSON.' },
            ],
          }),
        })
        const od = await or.json()
        const oc = od?.choices?.[0]?.message?.content
        if (oc) advisory.briefing_opening = JSON.parse(oc).opening
      } catch { advisory.briefing_opening = null }
    }
    const basedOn = { facts: (facts || []).length, findings: findings.length }
    // attach the visibility model + knowledge graph onto the advisory so it stores with it
    advisory.visibility_model = visibilityModel
    advisory.knowledge_graph = knowledgeGraph
    advisory.technical_readiness = technical
    advisory.foundations = buildFoundations(latestAuditResult, knowledgeGraph)

    
    

    // Persist so the AI Advisor tab can read the latest instantly (no GPT on open)
    await sb.from('hotel_consultant').insert({
      hotel_id: hotelId,
      hotel_name: brain.hotel_name,
      city: brain.city,
      based_on: basedOn,
      advisory,
    })

    return NextResponse.json({
      hotel: brain.hotel_name, city: brain.city,
      basedOn,
      advisory,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Consultant failed' }, { status: 500 })
  }
}
