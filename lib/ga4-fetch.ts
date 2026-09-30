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
  pathPrefix?: string | null,
): Promise<Ga4PageRow[]> {
  const [report] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: pathPrefix ? 'pagePath' : 'landingPagePlusQueryString' },
      { name: 'sessionSource' },
    ],
    metrics: [{ name: 'sessions' }, { name: 'keyEvents' }, { name: 'bounceRate' }, { name: 'totalRevenue' }],
    ...(pathPrefix ? {
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: { matchType: 'BEGINS_WITH', value: pathPrefix, caseSensitive: false },
        },
      },
    } : {}),
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
  opts: { days?: number; previous?: boolean; pathPrefix?: string | null } = {},
): Promise<Ga4FetchResult | null> {
  const rawKey = process.env.GA4_SERVICE_ACCOUNT_KEY
  if (!rawKey) return null
  let credentials: any
  try { credentials = JSON.parse(rawKey) } catch { return null }

  const cleanId = String(propertyId || '').replace(/[^0-9]/g, '')
  if (!cleanId) return null
  const windowDays = Math.max(1, Math.min(365, opts.days ?? 28))

  const client = new BetaAnalyticsDataClient({ credentials })
  const rows = await pullRows(client, cleanId, `${windowDays}daysAgo`, 'today', opts.pathPrefix)

  let previousRows: Ga4PageRow[] | null = null
  if (opts.previous) {
    previousRows = await pullRows(client, cleanId, `${windowDays * 2}daysAgo`, `${windowDays + 1}daysAgo`, opts.pathPrefix)
  }
  return { rows, previousRows, periodDays: windowDays }
}
// ── SOURCE-LEVEL FETCH (Path A: SwissNet-influenced revenue) ──
// Groups sessions/conversions/revenue by sessionSource — so we can isolate the
// "swissnet" source and read what GA4 attributes to it. Separate from the page-level
// fetch above (different dimension). Returns null if GA4 isn't configured.

export interface Ga4SourceRow {
  source: string
  sessions: number
  conversions: number
  revenue: number
}

export async function fetchGa4BySource(
  propertyId: string,
  opts: { days?: number; pathPrefix?: string | null } = {},
): Promise<{ rows: Ga4SourceRow[]; periodDays: number } | null> {
  const rawKey = process.env.GA4_SERVICE_ACCOUNT_KEY
  if (!rawKey) return null
  let credentials: any
  try { credentials = JSON.parse(rawKey) } catch { return null }

  const cleanId = String(propertyId || '').replace(/[^0-9]/g, '')
  if (!cleanId) return null
  const windowDays = Math.max(1, Math.min(365, opts.days ?? 28))

  const client = new BetaAnalyticsDataClient({ credentials })
  const [report] = await client.runReport({
    property: `properties/${cleanId}`,
    dateRanges: [{ startDate: `${windowDays}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'sessionSource' }],
    metrics: [{ name: 'sessions' }, { name: 'keyEvents' }, { name: 'totalRevenue' }],
    ...(opts.pathPrefix ? {
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: { matchType: 'BEGINS_WITH', value: opts.pathPrefix, caseSensitive: false },
        },
      },
    } : {}),
    limit: 1000,
  })

  const rows: Ga4SourceRow[] = []
  for (const r of report?.rows || []) {
    const dims = r.dimensionValues || []
    const mets = r.metricValues || []
    const source = (dims[0]?.value || '').toLowerCase()
    if (!source) continue
    rows.push({
      source,
      sessions: parseInt(mets[0]?.value || '0', 10) || 0,
      conversions: parseInt(mets[1]?.value || '0', 10) || 0,
      revenue: parseFloat(mets[2]?.value || '0') || 0,
    })
  }
  return { rows, periodDays: windowDays }
}
// ── MONTH-BOUNDED FETCH (for monthly snapshots) ──
// Pulls one CALENDAR month (real start/end dates, not relative days) grouped by
// sessionSource — enough to compute AI totals AND isolate the swissnet source for
// that month. Returns null if GA4 isn't configured.

export async function fetchGa4MonthBySource(
  propertyId: string,
  startDate: string,   // 'YYYY-MM-DD' inclusive
  endDate: string,     // 'YYYY-MM-DD' inclusive
  pathPrefix?: string | null,
): Promise<{ rows: Ga4SourceRow[] } | null> {
  const rawKey = process.env.GA4_SERVICE_ACCOUNT_KEY
  if (!rawKey) return null
  let credentials: any
  try { credentials = JSON.parse(rawKey) } catch { return null }

  const cleanId = String(propertyId || '').replace(/[^0-9]/g, '')
  if (!cleanId) return null

  const client = new BetaAnalyticsDataClient({ credentials })
  const [report] = await client.runReport({
    property: `properties/${cleanId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'sessionSource' }],
    metrics: [{ name: 'sessions' }, { name: 'keyEvents' }, { name: 'totalRevenue' }],
    ...(pathPrefix ? {
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: { matchType: 'BEGINS_WITH', value: pathPrefix, caseSensitive: false },
        },
      },
    } : {}),
    limit: 1000,
  })

  const rows: Ga4SourceRow[] = []
  for (const r of report?.rows || []) {
    const dims = r.dimensionValues || []
    const mets = r.metricValues || []
    const source = (dims[0]?.value || '').toLowerCase()
    if (!source) continue
    rows.push({
      source,
      sessions: parseInt(mets[0]?.value || '0', 10) || 0,
      conversions: parseInt(mets[1]?.value || '0', 10) || 0,
      revenue: parseFloat(mets[2]?.value || '0') || 0,
    })
  }
  return { rows }
}
// ── KEY EVENT BREAKDOWN ──
// GA4's `keyEvents` metric counts EVERY event the property marked as a key event —
// scroll, outbound click, form_start, purchase, all of it. Summing it and calling the
// result a "conversion rate" overstates bookings, sometimes wildly. This pull names
// each key event so the UI can label what it is actually counting.

export interface Ga4KeyEventRow {
  eventName: string
  source: string
  keyEvents: number
}

export async function fetchGa4KeyEvents(
  propertyId: string,
  opts: { days?: number; pathPrefix?: string | null } = {},
): Promise<{ rows: Ga4KeyEventRow[] } | null> {
  const rawKey = process.env.GA4_SERVICE_ACCOUNT_KEY
  if (!rawKey) return null
  let credentials: any
  try { credentials = JSON.parse(rawKey) } catch { return null }

  const cleanId = String(propertyId || '').replace(/[^0-9]/g, '')
  if (!cleanId) return null
  const windowDays = Math.max(1, Math.min(365, opts.days ?? 28))

  const client = new BetaAnalyticsDataClient({ credentials })
  const [report] = await client.runReport({
    property: `properties/${cleanId}`,
    dateRanges: [{ startDate: `${windowDays}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'eventName' }, { name: 'sessionSource' }],
    metrics: [{ name: 'keyEvents' }],
    ...(opts.pathPrefix ? {
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: { matchType: 'BEGINS_WITH', value: opts.pathPrefix, caseSensitive: false },
        },
      },
    } : {}),
    limit: 1000,
  })

  const rows: Ga4KeyEventRow[] = []
  for (const r of report?.rows || []) {
    const dims = r.dimensionValues || []
    const mets = r.metricValues || []
    const keyEvents = parseInt(mets[0]?.value || '0', 10) || 0
    if (keyEvents <= 0) continue
    rows.push({
      eventName: dims[0]?.value || '',
      source: (dims[1]?.value || '').toLowerCase(),
      keyEvents,
    })
  }
  return { rows }
}
// ── PURCHASES BY SOURCE ──
// The only event that is actually a booking. GA4's `keyEvents` metric lumps every
// flagged event together — on La Réserve that is 98% button clicks — so a "conversion
// rate" built on it is meaningless. This isolates `purchase` and splits it by source,
// giving three honest numbers: total bookings, bookings from AI, bookings from SwissNet.

export interface Ga4PurchaseRow {
  source: string
  purchases: number
  revenue: number
}

export async function fetchGa4PurchasesBySource(
  propertyId: string,
  opts: { days?: number; pathPrefix?: string | null } = {},
): Promise<{ rows: Ga4PurchaseRow[] } | null> {
  const rawKey = process.env.GA4_SERVICE_ACCOUNT_KEY
  if (!rawKey) return null
  let credentials: any
  try { credentials = JSON.parse(rawKey) } catch { return null }

  const cleanId = String(propertyId || '').replace(/[^0-9]/g, '')
  if (!cleanId) return null
  const windowDays = Math.max(1, Math.min(365, opts.days ?? 28))

  const pathFilter = opts.pathPrefix ? [{
    filter: {
      fieldName: 'pagePath',
      stringFilter: { matchType: 'BEGINS_WITH' as const, value: opts.pathPrefix, caseSensitive: false },
    },
  }] : []

  const client = new BetaAnalyticsDataClient({ credentials })
  const [report] = await client.runReport({
    property: `properties/${cleanId}`,
    dateRanges: [{ startDate: `${windowDays}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'sessionSource' }],
    metrics: [{ name: 'eventCount' }, { name: 'totalRevenue' }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          {
            filter: {
              fieldName: 'eventName',
              stringFilter: { matchType: 'EXACT' as const, value: 'purchase', caseSensitive: false },
            },
          },
          ...pathFilter,
        ],
      },
    },
    limit: 1000,
  })

  const rows: Ga4PurchaseRow[] = []
  for (const r of report?.rows || []) {
    const dims = r.dimensionValues || []
    const mets = r.metricValues || []
    const purchases = parseInt(mets[0]?.value || '0', 10) || 0
    if (purchases <= 0) continue
    rows.push({
      source: (dims[0]?.value || '').toLowerCase(),
      purchases,
      revenue: parseFloat(mets[1]?.value || '0') || 0,
    })
  }
  return { rows }
}
// ── MONTHLY AI SESSIONS ──
// Month-by-month AI traffic for the trend chart. Grouped by yearMonth + source so the
// AI classifier can run over it.

export interface Ga4MonthlySourceRow {
  yearMonth: string   // 'YYYYMM'
  source: string
  sessions: number
}

export async function fetchGa4MonthlyBySource(
  propertyId: string,
  opts: { months?: number; pathPrefix?: string | null } = {},
): Promise<{ rows: Ga4MonthlySourceRow[] } | null> {
  const rawKey = process.env.GA4_SERVICE_ACCOUNT_KEY
  if (!rawKey) return null
  let credentials: any
  try { credentials = JSON.parse(rawKey) } catch { return null }

  const cleanId = String(propertyId || '').replace(/[^0-9]/g, '')
  if (!cleanId) return null
  const months = Math.max(2, Math.min(24, opts.months ?? 12))

  const client = new BetaAnalyticsDataClient({ credentials })
  const [report] = await client.runReport({
    property: `properties/${cleanId}`,
    dateRanges: [{ startDate: `${months * 31}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'yearMonth' }, { name: 'sessionSource' }],
    metrics: [{ name: 'sessions' }],
    ...(opts.pathPrefix ? {
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: { matchType: 'BEGINS_WITH' as const, value: opts.pathPrefix, caseSensitive: false },
        },
      },
    } : {}),
    limit: 5000,
  })

  const rows: Ga4MonthlySourceRow[] = []
  for (const r of report?.rows || []) {
    const dims = r.dimensionValues || []
    const sessions = parseInt(r.metricValues?.[0]?.value || '0', 10) || 0
    if (sessions <= 0) continue
    rows.push({
      yearMonth: dims[0]?.value || '',
      source: (dims[1]?.value || '').toLowerCase(),
      sessions,
    })
  }
  return { rows }
}