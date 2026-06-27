// lib/gsc-fetch.ts
// ── Shared Search Console fetch core ── (mirrors lib/ga4-fetch.ts)
// Uses the SAME service-account credential (GA4_SERVICE_ACCOUNT_KEY) — a service
// account can call any Google API it's been granted, including Search Console.
// Importable by both the connect route and the consultant route, so the consultant
// never HTTP-requests its own server. Returns null if not configured (caller skips).

import { google } from 'googleapis'

// One GSC row: a (query, page) pair with its search metrics for the period.
export interface GscRow {
  query: string
  page: string          // full URL of the page that appeared
  impressions: number   // how often the page appeared in search results
  clicks: number
  ctr: number           // click-through rate, 0..1 as GSC returns it
  position: number      // average ranking position (lower = better)
}

export interface GscFetchResult {
  rows: GscRow[]
  previousRows: GscRow[] | null
  periodDays: number
}

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']

function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)  // YYYY-MM-DD
}

async function pullRows(
  webmasters: any,
  siteUrl: string,
  startDate: string,
  endDate: string,
): Promise<GscRow[]> {
  const res = await webmasters.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query', 'page'],
      rowLimit: 5000,
    },
  })
  const rows: GscRow[] = []
  for (const r of res?.data?.rows || []) {
    const keys = r.keys || []
    const query = keys[0] || ''
    const page = keys[1] || ''
    if (!page) continue
    rows.push({
      query,
      page,
      impressions: Math.round(r.impressions || 0),
      clicks: Math.round(r.clicks || 0),
      ctr: typeof r.ctr === 'number' ? r.ctr : 0,
      position: typeof r.position === 'number' ? r.position : 0,
    })
  }
  return rows
}

/**
 * Fetch Search Console rows for one property (siteUrl). Returns null if the server
 * has no credential configured (so callers degrade gracefully to gsc=null).
 * siteUrl is the GSC property string, e.g. "https://www.hotel.com/" or "sc-domain:hotel.com".
 */
export async function fetchGscRows(
  siteUrl: string,
  opts: { days?: number; previous?: boolean } = {},
): Promise<GscFetchResult | null> {
  const rawKey = process.env.GA4_SERVICE_ACCOUNT_KEY
  if (!rawKey) return null
  let credentials: any
  try { credentials = JSON.parse(rawKey) } catch { return null }
  const site = String(siteUrl || '').trim()
  if (!site) return null

  const windowDays = Math.max(1, Math.min(365, opts.days ?? 28))
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES })
  const client = await auth.getClient()
  const webmasters = google.webmasters({ version: 'v3', auth: client as any })

  // GSC data lags ~2-3 days, so end the window a few days back for complete data.
  const endLag = 3
  const rows = await pullRows(webmasters, site, isoDaysAgo(windowDays + endLag), isoDaysAgo(endLag))

  let previousRows: GscRow[] | null = null
  if (opts.previous) {
    previousRows = await pullRows(webmasters, site, isoDaysAgo(windowDays * 2 + endLag), isoDaysAgo(windowDays + endLag + 1))
  }

  return { rows, previousRows, periodDays: windowDays }
}
