import type { BehavioralSignal } from '@/lib/recommendation-model'

// ── GA4 → BehavioralSignal mapper ──
// Pure function. No network, no GA4 client. Takes already-fetched GA4 rows plus a
// Case's affected_pages, returns the BehavioralSignal slot for that Case.
// The GA4 route does the fetching; this does only the math — so it can be tested
// against a hand-written synthetic payload with zero GA4 access.

// One GA4 row as we'll request it: a page path with its metrics, optionally
// carrying a traffic source (for AI-referrer segmentation).
export interface Ga4PageRow {
  path: string            // e.g. "/restaurants-and-bars"
  sessions: number        // sessions that landed on this page
  conversions: number     // booking / key events on sessions landing here
  exits?: number          // exits from this page (optional; powers exit_rate)
  source?: string         // traffic source host, e.g. "chatgpt.com" (optional)
}

export interface BuildBehavioralOpts {
  periodDays?: number | null          // window length of the current pull
  previousRows?: Ga4PageRow[] | null  // same pages, prior period (for before/after)
}

// Hosts we count as "an AI assistant sent this visitor."
const AI_REFERRERS = [
  'chatgpt.com', 'chat.openai.com', 'openai.com',
  'perplexity.ai',
  'gemini.google.com', 'bard.google.com',
  'copilot.microsoft.com', 'bing.com',
  'claude.ai', 'anthropic.com',
]

function isAiSource(source?: string): boolean {
  if (!source) return false
  const s = source.toLowerCase()
  return AI_REFERRERS.some(host => s.includes(host))
}

// Normalise a path so "/spa/", "/spa", "https://h.com/spa?x=1" all compare equal.
function normalisePath(p: string): string {
  if (!p) return ''
  let out = p.trim().toLowerCase()
  // strip protocol + host if a full URL slipped in
  const m = out.match(/^https?:\/\/[^/]+(\/.*)?$/)
  if (m) out = m[1] || '/'
  out = out.split('?')[0].split('#')[0]      // drop query + fragment
  if (out.length > 1 && out.endsWith('/')) out = out.slice(0, -1)  // drop trailing slash
  if (!out.startsWith('/')) out = '/' + out
  return out
}

// Does a GA4 row's path belong to this Case's affected pages?
function rowMatchesCase(rowPath: string, affectedSet: Set<string>): boolean {
  const np = normalisePath(rowPath)
  if (affectedSet.has(np)) return true
  // also match sub-paths: affected "/restaurants-and-bars" should catch
  // "/restaurants-and-bars/the-bar"
  for (const a of affectedSet) {
    if (a.length > 1 && np.startsWith(a + '/')) return true
  }
  return false
}

function sum(rows: Ga4PageRow[], pick: (r: Ga4PageRow) => number): number {
  return rows.reduce((acc, r) => acc + (pick(r) || 0), 0)
}

// Compute current landing_sessions + conversion_rate for a set of matched rows.
function periodMetrics(rows: Ga4PageRow[]): { landing_sessions: number; conversion_rate: number | null } {
  const landing_sessions = sum(rows, r => r.sessions)
  const conversions = sum(rows, r => r.conversions)
  const conversion_rate = landing_sessions > 0
    ? Math.round((conversions / landing_sessions) * 1000) / 10  // one decimal, e.g. 2.4 (%)
    : null
  return { landing_sessions, conversion_rate }
}

/**
 * Build the BehavioralSignal for ONE Case.
 * Fills only what the supplied data can compute; everything else stays null.
 */
export function buildBehavioralSignal(
  rows: Ga4PageRow[],
  affectedPages: string[],
  opts: BuildBehavioralOpts = {},
): BehavioralSignal {
  const affectedSet = new Set((affectedPages || []).map(normalisePath).filter(Boolean))

  // No pages to measure → an empty-but-valid signal (all null), never invented.
  if (affectedSet.size === 0) {
    return {
      landing_sessions: null, exit_rate: null, conversion_rate: null,
      ai_referred_sessions: null, previous_period: null,
      measured_pages: [], period_days: opts.periodDays ?? null,
    }
  }

  const matched = (rows || []).filter(r => rowMatchesCase(r.path, affectedSet))

  // Nothing matched this Case's pages in the data → valid signal, zero traffic.
  if (matched.length === 0) {
    return {
      landing_sessions: 0, exit_rate: null, conversion_rate: null,
      ai_referred_sessions: 0, previous_period: null,
      measured_pages: [], period_days: opts.periodDays ?? null,
    }
  }

  const { landing_sessions, conversion_rate } = periodMetrics(matched)

  // exit_rate only if at least one matched row carried exits.
  const haveExits = matched.some(r => typeof r.exits === 'number')
  const exit_rate = haveExits && landing_sessions > 0
    ? Math.round((sum(matched, r => r.exits ?? 0) / landing_sessions) * 1000) / 10
    : null

  // #1 — AI-referred sessions among the matched rows.
  const aiRows = matched.filter(r => isAiSource(r.source))
  // If no row carries a source at all, we can't claim 0 honestly → null.
  const haveSources = matched.some(r => typeof r.source === 'string')
  const ai_referred_sessions = haveSources ? sum(aiRows, r => r.sessions) : null

  // #3 — previous period, only if prior rows supplied.
  let previous_period: BehavioralSignal['previous_period'] = null
  if (opts.previousRows && opts.previousRows.length > 0) {
    const prevMatched = opts.previousRows.filter(r => rowMatchesCase(r.path, affectedSet))
    const prev = periodMetrics(prevMatched)
    previous_period = {
      landing_sessions: prevMatched.length > 0 ? prev.landing_sessions : null,
      conversion_rate: prev.conversion_rate,
    }
  }

  // Provenance — the actual paths we measured (deduped, normalised).
  const measured_pages = Array.from(new Set(matched.map(r => normalisePath(r.path))))

  return {
    landing_sessions,
    exit_rate,
    conversion_rate,
    ai_referred_sessions,
    previous_period,
    measured_pages,
    period_days: opts.periodDays ?? null,
  }
}