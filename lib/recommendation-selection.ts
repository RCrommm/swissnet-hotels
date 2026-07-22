// lib/recommendation-selection.ts
// ─── STRATEGIC DECISION LAYER (V4) ───
// Intelligence → Strategic Decision → Recommendation. PURE, DETERMINISTIC, no GPT.
// The decision is the top-level object; the recommendation explains how to execute it.
//
// Objective: choose the strategic decisions that most change how AI recommends the hotel,
// on one currency — value-of-change × certainty × demand. Declining is itself a decision.
//
// Root-cause guard: the audit's question generator MANUFACTURES questions for universal
// categories (family/romantic/parking) for every hotel. A question is real DEMAND for a
// topic only if that topic has real substance; otherwise it's the generator talking.

export type DecisionPosture = 'Commit' | 'Convert' | 'Fix-foundation' | 'Confirm' | 'Decline' | 'Defer'

export interface StrategicDecision {
  topic: string
  label: string
  posture: DecisionPosture
  headline: string
  action_intent: 'consolidate' | 'add_schema' | 'strengthen' | 'verify' | 'investigate' | 'fix_trust' | null
  value: number
  certainty: number
  demand: number
  rationale: string
}
export interface DecisionBoard {
  decisions: StrategicDecision[]
  declined: { topics: string[]; labels: string[]; rationale: string } | null
  deferred: StrategicDecision[]
}

const SEGMENT = new Set(['family', 'romantic', 'weddings', 'spa'])
const DEALBREAKER = new Set(['parking', 'accessibility'])
const SUBSTANCE_MIN = 8
const IMP: Record<string, number> = { High: 3, Medium: 2, Low: 1 }
const VALUE_FLOOR = 0.25
const CAT_TO_TOPIC: Record<string, string> = {
  business: 'meetings', dining: 'dining', spa: 'spa', family: 'family',
  romantic: 'weddings', luxury: 'rooms', location: 'location', offers: 'offers',
}

function certainty(state: string, facts: number): number {
  if (facts === 0) return 0.15
  if (state === 'contaminated' && facts <= 4) return 0.4
  if (state === 'contaminated') return 0.6
  if (state === 'scattered') return 0.85
  if (state === 'consolidated') return 1.0
  return 0.5
}
function valueOfChange(p: DecisionPosture, facts: number, state: string, coverage: number, missingSchema: boolean): number {
  const substance = Math.min(1, facts / 40), answGap = (100 - (coverage || 0)) / 100
  if (p === 'Convert') return +(substance * (state === 'scattered' ? 0.9 : 0.7) * (0.6 + 0.4 * answGap)).toFixed(3)
  if (p === 'Commit') return +(substance * (0.4 + (missingSchema ? 0.25 : 0) + 0.25 * answGap)).toFixed(3)
  if (p === 'Confirm') return +(0.15 + facts * 0.02).toFixed(3)
  return 0
}

export function selectStrategicDecisions(knowledgeGraph: any, technical: any, auditResult: any): DecisionBoard {
  const clusters = knowledgeGraph?.clusters || []

  const rawDemand: Record<string, number> = {}
  for (const r of (auditResult?.recommendation?.results || [])) {
    const topic = CAT_TO_TOPIC[(r.category || '').toLowerCase()]
    if (!topic) continue
    if (r.readiness === 'NO') rawDemand[topic] = (rawDemand[topic] || 0) + 1
    else if (r.readiness === 'PARTIAL') rawDemand[topic] = (rawDemand[topic] || 0) + 0.5
  }
  const hasSchemaGap = (technical?.findings || []).some((f: any) => f.action === 'add_schema')

  const cand: StrategicDecision[] = []
  for (const c of clusters) {
    const topic = c.topic, facts = c.facts || 0, state = c.cluster_state
    const imp = c.commercial_importance || 'Medium', coverage = c.coverage || 0
    const hasSubstance = facts > 0 || state !== 'absent'
    // Demand is real even when the topic is absent — guests asking questions the site
    // can't answer IS the finding. Don't zero it out just because there are no facts;
    // an absent-but-demanded topic becomes a "create the page" opportunity below.
    const demandCount = rawDemand[topic] || 0
    const ms = hasSchemaGap && facts >= SUBSTANCE_MIN && state !== 'absent'

    let posture: DecisionPosture, action: StrategicDecision['action_intent'] = null, reason = ''
    if (facts >= SUBSTANCE_MIN && state !== 'absent') {
      if (state === 'consolidated') {
        if (ms || coverage < 85) { posture = 'Commit'; action = ms ? 'add_schema' : 'strengthen'; reason = `${facts} confirmed facts, consolidated${ms ? ', missing schema' : ''}, ${coverage}% answerability — near-won; invest so AI recommends it first.` }
        else { posture = 'Defer'; action = 'strengthen'; reason = `${facts} facts, consolidated and complete — no actionable upside this cycle.` }
      } else { posture = 'Convert'; action = 'consolidate'; reason = `${facts} real facts but ${state} — value exists, AI can't form the concept; reorganise to capture it.` }
    } else if (DEALBREAKER.has(topic)) {
      posture = 'Confirm'; action = 'verify'; reason = `Universal guest dealbreaker with no confirmed answer — verify and state the policy.`
    } else if (facts > 0 && imp === 'High') {
      posture = 'Confirm'; action = 'investigate'; reason = `${facts} facts, ${state}, high importance — confirm the real position before investing.`
    } else if (SEGMENT.has(topic) && demandCount > 0) {
      // Absent, but guests are actively asking — surface it as an opportunity to create
      // the page, not a decline. Accurate: the absence against real demand is the finding.
      posture = 'Confirm'; action = 'verify'; reason = `Guests are asking about ${c.label.toLowerCase()} but your site has no ${c.label.toLowerCase()} content — create a dedicated page to answer them.`
    } else if (SEGMENT.has(topic)) {
      posture = 'Decline'; reason = `Absent (${facts} facts), segment-specific, no guest demand.`
    } else {
      posture = 'Decline'; reason = `${facts} facts, ${state}, ${imp} importance — insufficient substance or demand.`
    }

    const demand = (IMP[imp] || 2) * (1 + demandCount * 0.15)
    const voc = valueOfChange(posture, facts, state, coverage, ms)
    const cert = certainty(state, facts)
    const value = +(voc * cert * demand).toFixed(3)
    const headline = ({
      Commit: `Commit to winning ${c.label}`, Convert: `Convert latent value in ${c.label}`,
      Confirm: `Confirm before investing in ${c.label}`, Decline: `Deliberately not pursuing ${c.label}`,
      Defer: `Defer ${c.label}`, 'Fix-foundation': '',
    } as Record<DecisionPosture, string>)[posture]
    cand.push({ topic, label: c.label, posture, headline, action_intent: action, value, certainty: +cert.toFixed(2), demand: +demand.toFixed(2), rationale: reason })
  }

  const strong = clusters.filter((c: any) => (c.facts || 0) >= SUBSTANCE_MIN && c.cluster_state !== 'absent').length
  const trustGap = (technical?.findings || []).some((f: any) => /trust|schema|review/i.test(f.layer || '') || f.action === 'add_schema')
  if (trustGap && strong >= 2) {
    const value = +(0.5 * Math.min(1, strong / 3) * 3).toFixed(3)
    cand.push({ topic: '__site__', label: 'AI trust & schema foundation', posture: 'Fix-foundation', headline: 'Fix the AI-trust foundation before adding content', action_intent: 'fix_trust', value, certainty: 1.0, demand: strong, rationale: `No review/structured-data trust signals — currently suppressing ${strong} strong categories. One fix lifts all of them.` })
  }

  const ACTIVE = new Set(['Commit', 'Convert', 'Fix-foundation', 'Confirm'])
  // A "create the page" opportunity — guests actively asking about a topic the site has no page for — is a top priority, not a low-value afterthought. Force it to the front regardless of its computed value.
  const isCreatePage = (c: StrategicDecision) => c.posture === 'Confirm' && c.demand > 0 && SEGMENT.has(c.topic)
  const headlines = cand
    .filter(c => ACTIVE.has(c.posture) && (c.value >= VALUE_FLOOR || isCreatePage(c)))
    .sort((a, b) => (isCreatePage(b) ? 1 : 0) - (isCreatePage(a) ? 1 : 0) || b.value - a.value)
  const chosen = new Set(headlines)
  const declineCands = cand.filter(c => c.posture === 'Decline')
  const declined = declineCands.length ? { topics: declineCands.map(c => c.topic), labels: declineCands.map(c => c.label), rationale: `Absent, segment-specific, no real guest demand — declined deliberately so focus isn't diluted chasing gaps that aren't your market.` } : null
  const deferred = cand.filter(c => !chosen.has(c) && c.posture !== 'Decline')
  return { decisions: headlines, declined, deferred }
}