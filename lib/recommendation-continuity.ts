// lib/recommendation-continuity.ts
// Recommendation Continuity. Topic is the durable Case identity; posture is the chapter.
// Deterministic comparison of previous vs current advisory. Platform computes status; GPT only narrates.
// A Case never disappears because its posture changed — it evolves.

export type ContinuityStatus = 'new' | 'continuing' | 'improving' | 'regressed' | 'resolved' | 'evolved'

export interface CaseContinuity {
  topic: string
  label: string
  status: ContinuityStatus
  previous_posture: string | null
  current_posture: string | null
  first_seen: string | null
  last_seen: string | null
  summary: string
  changed_metrics: { failed_queries_delta?: number; coverage_delta?: number; posture_shift?: string }
}

export interface ContinuityResult {
  isFirstRun: boolean
  active: CaseContinuity[]
  resolved: CaseContinuity[]
}

const POSTURE_RANK: Record<string, number> = { 'Fix-foundation': 0, Confirm: 1, Convert: 2, Strengthen: 3, Commit: 4 }

const topicOf = (m: any): string | null => m?.topic || m?.canonicalRecommendation?.targeting?.topic || null
const labelOf = (m: any): string => m?.canonicalRecommendation?.targeting?.affected_entity || m?.topic || ''
const failedCount = (m: any): number | null =>
  m?.canonicalRecommendation?.audit?.failed_queries?.length
  ?? m?.questions_to_answer?.length
  ?? m?.recommendation?.questions_unanswered?.length
  ?? null
const coverageOf = (m: any): number | null => m?.canonicalRecommendation?.audit?.coverage_pct ?? null

export function computeContinuity(previousAdvisory: any, currentAdvisory: any, opts?: { prevDate?: string; nowDate?: string }): ContinuityResult {
  const nowDate = opts?.nowDate || new Date().toISOString()
  const prevDate = opts?.prevDate || null
  const currentMoves = currentAdvisory?.top_moves || []

  if (!previousAdvisory || !(previousAdvisory.top_moves || []).length) {
    return {
      isFirstRun: true,
      active: currentMoves.map((m: any) => {
        const topic = topicOf(m) || 'overall'
        return {
          topic, label: labelOf(m), status: 'new' as ContinuityStatus,
          previous_posture: null, current_posture: m.posture,
          first_seen: nowDate, last_seen: nowDate,
          summary: 'Tracking from this audit.', changed_metrics: {},
        }
      }),
      resolved: [],
    }
  }

  const prevMoves = previousAdvisory.top_moves || []
  const prevByTopic: Record<string, any> = {}
  for (const pm of prevMoves) { const t = topicOf(pm); if (t) prevByTopic[t] = pm }

  const active: CaseContinuity[] = []
  const currentTopics = new Set<string>()

  for (const m of currentMoves) {
    const topic = topicOf(m); if (!topic) continue
    currentTopics.add(topic)
    const label = labelOf(m)
    const prev = prevByTopic[topic]

    if (!prev) {
      active.push({ topic, label, status: 'new', previous_posture: null, current_posture: m.posture, first_seen: nowDate, last_seen: nowDate, summary: 'New priority this month.', changed_metrics: {} })
      continue
    }

    const fNow = failedCount(m), fPrev = failedCount(prev)
    const covNow = coverageOf(m), covPrev = coverageOf(prev)
    const postNow = POSTURE_RANK[m.posture] ?? 2, postPrev = POSTURE_RANK[prev.posture] ?? 2
    const fDelta = (fNow != null && fPrev != null) ? fPrev - fNow : undefined
    const covDelta = (covNow != null && covPrev != null) ? covNow - covPrev : undefined
    const postureShifted = m.posture !== prev.posture

    const metrics: CaseContinuity['changed_metrics'] = {}
    if (fDelta !== undefined && fDelta !== 0) metrics.failed_queries_delta = fDelta
    if (covDelta !== undefined && covDelta !== 0) metrics.coverage_delta = covDelta
    if (postureShifted) metrics.posture_shift = `${prev.posture} → ${m.posture}`

    let status: ContinuityStatus
    let summary: string
    const improvedByMetric = (fDelta !== undefined && fDelta > 0) || (covDelta !== undefined && covDelta > 3)
    const regressedByMetric = (fDelta !== undefined && fDelta < 0) || (covDelta !== undefined && covDelta < -3) || (postNow < postPrev)

    if (postNow > postPrev && improvedByMetric) {
      status = 'improving'
      summary = `Moved from ${prev.posture} to ${m.posture} — the work is paying off.`
    } else if (postureShifted && postNow > postPrev) {
      status = 'evolved'
      summary = `Evolved from ${prev.posture.toLowerCase()} to ${m.posture.toLowerCase()} — the next chapter of the same work.`
    } else if (improvedByMetric) {
      status = 'improving'
      summary = fDelta && fDelta > 0
        ? `AI now answers ${fDelta} more guest question${fDelta === 1 ? '' : 's'} here.`
        : `Coverage rose to ${covNow}%.`
    } else if (regressedByMetric) {
      status = 'regressed'
      summary = 'Slipped since last audit — worth attention.'
    } else {
      status = 'continuing'
      summary = 'Still a focus, continuing from last audit.'
    }

    active.push({ topic, label, status, previous_posture: prev.posture, current_posture: m.posture, first_seen: null, last_seen: nowDate, summary, changed_metrics: metrics })
  }

  const resolved: CaseContinuity[] = []
  for (const t of Object.keys(prevByTopic)) {
    if (currentTopics.has(t)) continue
    const pm = prevByTopic[t]
    if (['Convert', 'Commit', 'Strengthen', 'Fix-foundation'].includes(pm.posture)) {
      resolved.push({ topic: t, label: labelOf(pm), status: 'resolved', previous_posture: pm.posture, current_posture: null, first_seen: null, last_seen: prevDate, summary: 'No longer a priority — this is now considered complete.', changed_metrics: {} })
    }
  }

  return { isFirstRun: false, active, resolved }
}