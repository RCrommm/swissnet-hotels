import type { BehavioralSignal } from '@/lib/recommendation-model'

// ── GA4 → behavioural CLAIM (deterministic) ──
// The platform decides the behavioural insight from real numbers. GPT never sees
// these numbers — it only rewrites the finished claim into consultant language.
// Each claim is a plain sentence grounded in a threshold the data actually crossed.
// If the data doesn't support a claim, we emit nothing (never force a sentence).

export interface BehaviouralClaim {
  // The plain platform-decided sentence (what GPT will later smooth).
  claim: string
  // Which numbers justified it — kept for provenance / debugging, NOT shown raw to guests.
  basis: string
  // A stable kind so the UI/GPT can order or de-dupe.
  kind: 'discovery_gap' | 'ai_demand' | 'movement' | 'strong_entry' | 'low_traffic'
}

// Thresholds — deliberately conservative so a claim only fires when it's clearly true.
const HIGH_EXIT = 60          // % — guests mostly leaving from these pages
const LOW_CONVERSION = 2      // % — landing traffic that rarely books
const STRONG_CONVERSION = 4   // % — these pages convert well
const MEANINGFUL_SESSIONS = 50 // below this, traffic is too thin to claim anything
const AI_SHARE_NOTABLE = 0.10 // ≥10% of sessions from AI assistants = worth saying

function pct(n: number | null): number | null {
  return typeof n === 'number' ? n : null
}

/**
 * Decide the behavioural claims for ONE Case from its signal.
 * Returns 0–2 claims, most important first. Empty array = data supports nothing.
 */
export function deriveBehaviouralClaims(
  signal: BehavioralSignal | null,
  ctx: { topicLabel: string; posture?: string },
): BehaviouralClaim[] {
  if (!signal) return []
  const sessions = signal.landing_sessions ?? 0
  const claims: BehaviouralClaim[] = []
  const topic = ctx.topicLabel || 'these pages'

  // Guard: too little traffic to say anything honest.
  if (sessions < MEANINGFUL_SESSIONS) {
    if (sessions === 0) return []
    claims.push({
      kind: 'low_traffic',
      claim: `Few guests currently reach your ${topic} pages, so there isn't yet enough visitor behaviour to draw on.`,
      basis: `landing_sessions=${sessions} (<${MEANINGFUL_SESSIONS})`,
    })
    return claims
  }

  const exit = pct(signal.exit_rate)
  const conv = pct(signal.conversion_rate)

  // 1) DISCOVERY / BOOKING GAP — lots of guests arrive but leave without booking.
  if (exit !== null && exit >= HIGH_EXIT && conv !== null && conv < LOW_CONVERSION) {
    claims.push({
      kind: 'discovery_gap',
      claim: `Most guests who reach your ${topic} pages leave without going further, which points to a discovery or booking gap rather than a content problem.`,
      basis: `exit_rate=${exit}% (≥${HIGH_EXIT}), conversion_rate=${conv}% (<${LOW_CONVERSION})`,
    })
  } else if (conv !== null && conv < LOW_CONVERSION && sessions >= MEANINGFUL_SESSIONS) {
    claims.push({
      kind: 'discovery_gap',
      claim: `Your ${topic} pages attract real visitors, but very few continue to a booking — the traffic is there, the conversion isn't.`,
      basis: `conversion_rate=${conv}% (<${LOW_CONVERSION}), landing_sessions=${sessions}`,
    })
  }

  // 2) AI DEMAND — a notable share of these visitors came from AI assistants.
  const ai = signal.ai_referred_sessions
  if (typeof ai === 'number' && sessions > 0 && ai / sessions >= AI_SHARE_NOTABLE) {
    claims.push({
      kind: 'ai_demand',
      claim: `AI assistants are already sending guests to your ${topic} pages, so improving how these pages read to AI directly affects visitors you're getting right now — not hypothetical ones.`,
      basis: `ai_referred=${ai}/${sessions} (≥${Math.round(AI_SHARE_NOTABLE * 100)}%)`,
    })
  }

  // 3) STRONG ENTRY — these pages convert well; protect/extend rather than fix.
  if (conv !== null && conv >= STRONG_CONVERSION && claims.length === 0) {
    claims.push({
      kind: 'strong_entry',
      claim: `Your ${topic} pages already turn visitors into bookings at a healthy rate — this is a strength to build on, not a leak to fix.`,
      basis: `conversion_rate=${conv}% (≥${STRONG_CONVERSION})`,
    })
  }

  // 4) MOVEMENT — compare to the previous period when we have it.
  const prev = signal.previous_period
  if (prev && typeof prev.landing_sessions === 'number' && prev.landing_sessions > 0) {
    const growth = (sessions - prev.landing_sessions) / prev.landing_sessions
    if (growth >= 0.15) {
      claims.push({
        kind: 'movement',
        claim: `Visits to your ${topic} pages have grown noticeably since the last review, so momentum is already moving in the right direction here.`,
        basis: `landing_sessions ${prev.landing_sessions}→${sessions} (+${Math.round(growth * 100)}%)`,
      })
    } else if (growth <= -0.15) {
      claims.push({
        kind: 'movement',
        claim: `Visits to your ${topic} pages have slipped since the last review, which makes acting on this more time-sensitive.`,
        basis: `landing_sessions ${prev.landing_sessions}→${sessions} (${Math.round(growth * 100)}%)`,
      })
    }
  }

  // Keep it tight: at most the two strongest claims, in priority order.
  return claims.slice(0, 2)
}
