import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import type { Ga4PageRow } from '@/lib/ga4-behavioral'

export const maxDuration = 60

// ── GA4 FETCH ───
// Pulls page-level behavioural rows for ONE connected hotel and returns them as
// Ga4PageRow[] (the shape buildBehavioralSignal expects). Does NOT do the math —
// it only fetches and reshapes, so the mapper stays pure and testable.
//
// Body: { hotelId, password, days? , previous? }
//   days     → current window length (default 28)
//   previous → if true, also return the prior window of equal length (for before/after)

interface Ga4FetchBody {
  hotelId?: string
  password?: string
  days?: number
  previous?: boolean
}

// Run one GA4 report → Ga4PageRow[]. dateRange is [start, end] in GA4 syntax.
async function pullRows(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  startDate: string,
  endDate: string,
): Promise<Ga4PageRow[]> {
  const [report] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    // pagePath + the session source, so we can segment AI referrers.
    dimensions: [{ name: 'landingPagePlusQueryString' }, { name: 'sessionSource' }],
    // sessions, key events (conversions), and exits.
    metrics: [{ name: 'sessions' }, { name: 'keyEvents' }, { name: 'bounceRate' }],
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
    const bounceRate = parseFloat(mets[2]?.value || '0') || 0 // 0..1
    if (!rawPath) continue
    rows.push({
      path: rawPath,
      sessions,
      conversions,
      // GA4 has no direct "exits" in the Data API; approximate from bounceRate.
      // This is a stand-in until we confirm the right metric against live data.
      exits: Math.round(sessions * bounceRate),
      source,
    })
  }
  return rows
}

export async function POST(req: Request) {
  try {
    const { hotelId, password, days, previous } = (await req.json()) as Ga4FetchBody
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 })

    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const rawKey = process.env.GA4_SERVICE_ACCOUNT_KEY
    if (!sbUrl || !sbKey) return NextResponse.json({ error: 'Server not configured (Supabase).' }, { status: 500 })
    if (!rawKey) return NextResponse.json({ error: 'GA4 is not configured on the server yet.' }, { status: 500 })

    let credentials: any
    try { credentials = JSON.parse(rawKey) } catch { return NextResponse.json({ error: 'GA4 server credential is malformed.' }, { status: 500 }) }

    const sb = createClient(sbUrl, sbKey)

    // Look up the hotel's connected property.
    const { data: hotel, error: hErr } = await sb
      .from('hotels')
      .select('id, ga4_property_id, ga4_status')
      .eq('id', hotelId)
      .single()
    if (hErr || !hotel) return NextResponse.json({ error: 'Hotel not found.' }, { status: 404 })
    if (!hotel.ga4_property_id || hotel.ga4_status !== 'connected') {
      return NextResponse.json({ error: 'This hotel has no connected GA4 property.' }, { status: 400 })
    }

    const propertyId = String(hotel.ga4_property_id).replace(/[^0-9]/g, '')
    const windowDays = Math.max(1, Math.min(365, days ?? 28))

    const client = new BetaAnalyticsDataClient({ credentials })

    // Current window: last N days.
    const current = await pullRows(client, propertyId, `${windowDays}daysAgo`, 'today')

    // Optional previous window of equal length, immediately preceding.
    let previousRows: Ga4PageRow[] | null = null
    if (previous) {
      const start = `${windowDays * 2}daysAgo`
      const end = `${windowDays + 1}daysAgo`
      previousRows = await pullRows(client, propertyId, start, end)
    }

    return NextResponse.json({
      hotelId,
      propertyId,
      periodDays: windowDays,
      rows: current,
      previousRows,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'GA4 fetch failed' }, { status: 500 })
  }
}