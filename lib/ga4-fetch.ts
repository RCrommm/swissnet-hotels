import { BetaAnalyticsDataClient } from '@google-analytics/data'
import type { Ga4PageRow } from '@/lib/ga4-behavioral'

// ── Shared GA4 fetch core ──
// Importable by both the /api/ga4-fetch route and the consultant route, so the
// consultant never HTTP-requests its own server. Pure-ish: does the GA4 network
// call, returns reshaped rows. Returns null if GA4 isn't configured (caller skips).

export interface Ga4FetchResult {
  rows: Ga4PageRow[]
  previousRows: Ga4PageRow[] | null
  periodDays: number
}

async function pullRows(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  startDate: string,
  endDate: string,
): Promise<Ga4PageRow[]> {
  const [report] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'landingPagePlusQueryString' }, { name: 'sessionSource' }],
    metrics: [{ name: 'sessions' }, { name: 'keyEvents' }, { name: 'bounceRate' }, { name: 'totalRevenue' }],
    limit: 10000,
  })
  const rows: Ga4PageRow[] = []
  for (const r of report?.rows || []) {
    const dims = r.dimensionValues || []
    const mets = r.metricValues || []
    const rawPath = dims[0]?.value || ''
    const source = dims[1]?.value || undefined
    const sessions = parseInt(mets[0]?.value || '0', 10) || 0
    const conversions = parseInt(mets[1]?.value || '0', 10) || 0
    const bounceRate = parseFloat(mets[2]?.value || '0') || 0
    const revenue = parseFloat(mets[3]?.value || '0') || 0
    if (!rawPath) continue
    rows.push({ path: rawPath, sessions, conversions, exits: Math.round(sessions * bounceRate), source, revenue })
  }
  return rows
}

/**
 * Fetch GA4 behavioural rows for one property. Returns null if the server has no
 * GA4 credential configured (so callers degrade gracefully to behavioral=null).
 */
export async function fetchGa4Rows(
  propertyId: string,
  opts: { days?: number; previous?: boolean } = {},
): Promise<Ga4FetchResult | null> {
  const rawKey = process.env.GA4_SERVICE_ACCOUNT_KEY
  if (!rawKey) return null
  let credentials: any
  try { credentials = JSON.parse(rawKey) } catch { return null }

  const cleanId = String(propertyId || '').replace(/[^0-9]/g, '')
  if (!cleanId) return null
  const windowDays = Math.max(1, Math.min(365, opts.days ?? 28))

  const client = new BetaAnalyticsDataClient({ credentials })
  const rows = await pullRows(client, cleanId, `${windowDays}daysAgo`, 'today')

  let previousRows: Ga4PageRow[] | null = null
  if (opts.previous) {
    previousRows = await pullRows(client, cleanId, `${windowDays * 2}daysAgo`, `${windowDays + 1}daysAgo`)
  }
  return { rows, previousRows, periodDays: windowDays }
}