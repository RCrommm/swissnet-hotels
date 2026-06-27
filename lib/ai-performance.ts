// lib/ai-performance.ts
// buildAiPerformance(rows, opts) — summary-level AI Performance Intelligence.
// PURE function. Aggregates already-fetched GA4 rows by AI platform. No network.
// Reuses the SAME isAiSource / aiPlatformOf helpers as the Case-level signal, so a
// session classified as "ChatGPT" in a Case is classified identically here.
//
// NO INVENTION: every metric is summed from real rows. Where the data can't support
// a metric (no source on rows, no previous period, no revenue field), the value is
// null — never guessed. An empty/disconnected property yields an empty signal.
//
// This REPORTS measurement only. No causal language, no ROI claims. Observations
// ("traffic increased since implementation") are a later layer built on history.

import { isAiSource, aiPlatformOf, type Ga4PageRow } from '@/lib/ga4-behavioral'

export interface AiPlatformBreakdown {
  platform: string              // "ChatGPT", "Perplexity", ...
  sessions: number
  conversions: number
  conversion_rate: number | null  // %, one decimal; null if no sessions
  revenue: number | null          // null until GA4 revenue metric is wired
}

export interface AiPerformanceSignal {
  // headline totals across all identifiable AI sources
  ai_sessions: number | null            // null if rows carry no source at all
  ai_conversions: number | null
  ai_conversion_rate: number | null     // %, one decimal
  ai_revenue: number | null             // null until revenue wired
  total_sessions: number                // all sessions in the pull (any source)
  ai_share_pct: number | null           // AI sessions / total sessions, %
  by_platform: AiPlatformBreakdown[]    // one row per identifiable platform, desc by sessions
  // before/after — only if previous period supplied
  previous_period: {
    ai_sessions: number | null
    ai_conversion_rate: number | null
  } | null
  ai_sessions_change_pct: number | null // vs previous period, % ; null if no prior data
  top_ai_landing_pages: { path: string; sessions: number }[]  // where AI visitors land
  period_days: number | null
  measured: boolean                     // false = no usable source data (disconnected/empty)
}

export interface BuildAiPerfOpts {
  periodDays?: number | null
  previousRows?: Ga4PageRow[] | null
}

function sum(rows: Ga4PageRow[], pick: (r: Ga4PageRow) => number): number {
  return rows.reduce((a, r) => a + (pick(r) || 0), 0)
}

function rate(conversions: number, sessions: number): number | null {
  return sessions > 0 ? Math.round((conversions / sessions) * 1000) / 10 : null
}

function aiTotals(rows: Ga4PageRow[]) {
  const aiRows = rows.filter(r => isAiSource(r.source))
  const sessions = sum(aiRows, r => r.sessions)
  const conversions = sum(aiRows, r => r.conversions)
  return { aiRows, sessions, conversions }
}

export function buildAiPerformance(
  rows: Ga4PageRow[],
  opts: BuildAiPerfOpts = {},
): AiPerformanceSignal {
  const safeRows = rows || []
  const haveSources = safeRows.some(r => typeof r.source === 'string')
  const total_sessions = sum(safeRows, r => r.sessions)

  // No source data at all → cannot measure AI traffic honestly. Empty signal.
  if (!haveSources) {
    return {
      ai_sessions: null, ai_conversions: null, ai_conversion_rate: null, ai_revenue: null,
      total_sessions, ai_share_pct: null, by_platform: [],
      previous_period: null, ai_sessions_change_pct: null,
      top_ai_landing_pages: [], period_days: opts.periodDays ?? null, measured: false,
    }
  }

  const { aiRows, sessions: ai_sessions, conversions: ai_conversions } = aiTotals(safeRows)

  // Per-platform aggregation via the shared classifier.
  const byPlat: Record<string, { sessions: number; conversions: number }> = {}
  for (const r of aiRows) {
    const plat = aiPlatformOf(r.source)
    if (!plat) continue  // identifiable-AI only; unknowns are not invented into a bucket
    if (!byPlat[plat]) byPlat[plat] = { sessions: 0, conversions: 0 }
    byPlat[plat].sessions += r.sessions || 0
    byPlat[plat].conversions += r.conversions || 0
  }
  const by_platform: AiPlatformBreakdown[] = Object.entries(byPlat)
    .map(([platform, v]) => ({
      platform, sessions: v.sessions, conversions: v.conversions,
      conversion_rate: rate(v.conversions, v.sessions), revenue: null,
    }))
    .sort((a, b) => b.sessions - a.sessions)

  // Top AI landing pages.
  const byPage: Record<string, number> = {}
  for (const r of aiRows) {
    const p = r.path || ''
    byPage[p] = (byPage[p] || 0) + (r.sessions || 0)
  }
  const top_ai_landing_pages = Object.entries(byPage)
    .map(([path, s]) => ({ path, sessions: s }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 5)

  // Previous period (before/after) — only if supplied.
  let previous_period: AiPerformanceSignal['previous_period'] = null
  let ai_sessions_change_pct: number | null = null
  if (opts.previousRows && opts.previousRows.length > 0) {
    const prevHaveSources = opts.previousRows.some(r => typeof r.source === 'string')
    if (prevHaveSources) {
      const prev = aiTotals(opts.previousRows)
      previous_period = {
        ai_sessions: prev.sessions,
        ai_conversion_rate: rate(prev.conversions, prev.sessions),
      }
      ai_sessions_change_pct = prev.sessions > 0
        ? Math.round(((ai_sessions - prev.sessions) / prev.sessions) * 1000) / 10
        : null
    }
  }

  return {
    ai_sessions,
    ai_conversions,
    ai_conversion_rate: rate(ai_conversions, ai_sessions),
    ai_revenue: null,  // wired when GA4 revenue metric is added to the fetch
    total_sessions,
    ai_share_pct: total_sessions > 0 ? Math.round((ai_sessions / total_sessions) * 1000) / 10 : null,
    by_platform,
    previous_period,
    ai_sessions_change_pct,
    top_ai_landing_pages,
    period_days: opts.periodDays ?? null,
    measured: true,
  }
}
