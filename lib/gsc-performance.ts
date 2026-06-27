// lib/gsc-performance.ts
// buildGscSignal(rows, affectedPages, opts) — maps Search Console rows to ONE Case.
// PURE function. No network. Mirrors lib/ga4-behavioral's matching discipline.
//
// GSC = PRE-click search DEMAND (impressions, clicks, CTR, position, real queries),
// distinct from GA4's post-click behaviour. This answers "what are people searching
// that this Case's pages do/don't capture?"
//
// NO INVENTION: a Case gets a signal only for pages GSC actually measured. Empty
// affected_pages or no matching rows → an empty-but-valid signal (nulls), never faked.
// Queries are real GSC queries only.

import type { GscRow } from '@/lib/gsc-fetch'

export interface GscQuery {
  query: string
  impressions: number
  clicks: number
  ctr: number          // 0..1
  position: number
}

export interface GscSignal {
  impressions: number | null      // total impressions across this Case's pages
  clicks: number | null
  ctr: number | null               // %, one decimal (clicks/impressions)
  avg_position: number | null      // impression-weighted average position
  top_queries: GscQuery[]          // real queries driving this Case's pages, by impressions
  measured_pages: string[]
  previous_period: {
    impressions: number | null
    ctr: number | null
  } | null
  impressions_change_pct: number | null
  period_days: number | null
}

export interface BuildGscOpts {
  periodDays?: number | null
  previousRows?: GscRow[] | null
}

function normalisePath(p: string): string {
  if (!p) return ''
  let out = p.trim().toLowerCase()
  const m = out.match(/^https?:\/\/[^/]+(\/.*)?$/)
  if (m) out = m[1] || '/'
  out = out.split('?')[0].split('#')[0]
  if (out.length > 1 && out.endsWith('/')) out = out.slice(0, -1)
  if (!out.startsWith('/')) out = '/' + out
  return out
}

function rowMatchesCase(rowPage: string, affectedSet: Set<string>): boolean {
  const np = normalisePath(rowPage)
  if (affectedSet.has(np)) return true
  for (const a of affectedSet) {
    if (a.length > 1 && np.startsWith(a + '/')) return true
  }
  return false
}

function aggregate(rows: GscRow[]): { impressions: number; clicks: number; ctr: number | null; avg_position: number | null } {
  const impressions = rows.reduce((s, r) => s + (r.impressions || 0), 0)
  const clicks = rows.reduce((s, r) => s + (r.clicks || 0), 0)
  const ctr = impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : null
  // impression-weighted average position (lower is better)
  const avg_position = impressions > 0
    ? Math.round((rows.reduce((s, r) => s + (r.position || 0) * (r.impressions || 0), 0) / impressions) * 10) / 10
    : null
  return { impressions, clicks, ctr, avg_position }
}

export function buildGscSignal(
  rows: GscRow[],
  affectedPages: string[],
  opts: BuildGscOpts = {},
): GscSignal {
  const empty: GscSignal = {
    impressions: null, clicks: null, ctr: null, avg_position: null,
    top_queries: [], measured_pages: [], previous_period: null,
    impressions_change_pct: null, period_days: opts.periodDays ?? null,
  }

  const affectedSet = new Set((affectedPages || []).map(normalisePath).filter(Boolean))
  if (affectedSet.size === 0) return empty

  const matched = (rows || []).filter(r => rowMatchesCase(r.page, affectedSet))
  if (matched.length === 0) {
    return { ...empty, impressions: 0, clicks: 0 }  // measured, but no demand on these pages
  }

  const { impressions, clicks, ctr, avg_position } = aggregate(matched)

  // Top queries: aggregate by query across the matched pages, rank by impressions.
  const byQuery: Record<string, { impressions: number; clicks: number; posWeighted: number }> = {}
  for (const r of matched) {
    const q = r.query || ''
    if (!q) continue
    if (!byQuery[q]) byQuery[q] = { impressions: 0, clicks: 0, posWeighted: 0 }
    byQuery[q].impressions += r.impressions || 0
    byQuery[q].clicks += r.clicks || 0
    byQuery[q].posWeighted += (r.position || 0) * (r.impressions || 0)
  }
  const top_queries: GscQuery[] = Object.entries(byQuery)
    .map(([query, v]) => ({
      query,
      impressions: v.impressions,
      clicks: v.clicks,
      ctr: v.impressions > 0 ? Math.round((v.clicks / v.impressions) * 1000) / 10 : 0,
      position: v.impressions > 0 ? Math.round((v.posWeighted / v.impressions) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 6)

  const measured_pages = Array.from(new Set(matched.map(r => normalisePath(r.page))))

  // Previous period (before/after) — only if supplied.
  let previous_period: GscSignal['previous_period'] = null
  let impressions_change_pct: number | null = null
  if (opts.previousRows && opts.previousRows.length > 0) {
    const prevMatched = opts.previousRows.filter(r => rowMatchesCase(r.page, affectedSet))
    if (prevMatched.length > 0) {
      const prev = aggregate(prevMatched)
      previous_period = { impressions: prev.impressions, ctr: prev.ctr }
      impressions_change_pct = prev.impressions > 0
        ? Math.round(((impressions - prev.impressions) / prev.impressions) * 1000) / 10
        : null
    }
  }

  return {
    impressions, clicks, ctr, avg_position,
    top_queries, measured_pages, previous_period,
    impressions_change_pct, period_days: opts.periodDays ?? null,
  }
}
