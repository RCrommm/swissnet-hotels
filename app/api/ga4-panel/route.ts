import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchGa4Rows, fetchGa4BySource, fetchGa4KeyEvents, fetchGa4PurchasesBySource } from '@/lib/ga4-fetch'
import { isAiSource, aiPlatformOf } from '@/lib/ga4-behavioral'
import { buildAiPerformance } from '@/lib/ai-performance'
import { buildSwissnetInfluence } from '@/lib/swissnet-influence'

export const maxDuration = 30

// ─── GA4 PANEL (live performance read) ───
// Cheap, client-callable endpoint that refreshes ONLY the AI Performance + SwissNet
// Influence panel for a chosen window — independent of the consultant (no GPT, no
// Case logic). The dashboard calls this when the hotel picks a date range.
//
// Auth: hotelId only. This returns the SAME performance data the dashboard already
// reads for this hotel; it is not admin-gated (the admin password must never reach
// the browser). No recommendation/advisory data is touched here.
//
// HONEST MEASUREMENT: every field is summed from real GA4 rows or owned click data.
// Where the data can't support a metric (no ecommerce, no swissnet source), the value
// is null and a capability flag says so — never a fabricated number.

const ALLOWED_DAYS = new Set([7, 28, 90])

export async function POST(req: Request) {
  try {
    const { hotelId, days, compare } = await req.json()
    if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 })

    const windowDays = ALLOWED_DAYS.has(Number(days)) ? Number(days) : 28
    const wantCompare = compare !== false  // default on

    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!sbUrl || !sbKey) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    const sb = createClient(sbUrl, sbKey)

    // Hotel's GA4 connection state.
    const { data: hotelRow } = await sb
      .from('hotels')
      .select('ga4_property_id, ga4_status, ga4_path_prefix')
      .eq('id', hotelId)
      .single()

    const ga4Connected = hotelRow?.ga4_status === 'connected' && !!hotelRow?.ga4_property_id
    const propertyId = hotelRow?.ga4_property_id || ''

    // ── AI PERFORMANCE ──
    // Reuses the same builder as the consultant; honest-null when revenue absent.
    let ai_performance: any = null
    let ga4SourceRows: any[] | null = null
    let keyEventRows: any[] | null = null
    let purchaseRows: any[] | null = null
    if (ga4Connected) {
      const ga4 = await fetchGa4Rows(propertyId, { days: windowDays, previous: wantCompare, pathPrefix: hotelRow?.ga4_path_prefix })
      if (ga4) {
        ai_performance = buildAiPerformance(ga4.rows, { periodDays: ga4.periodDays, previousRows: ga4.previousRows })
      }
      // pathPrefix was missing here: on a shared group property the source rows
      // included other hotels' traffic while the page rows did not.
      const src = await fetchGa4BySource(propertyId, { days: windowDays, pathPrefix: hotelRow?.ga4_path_prefix })
      if (src) ga4SourceRows = src.rows
      const ke = await fetchGa4KeyEvents(propertyId, { days: windowDays, pathPrefix: hotelRow?.ga4_path_prefix })
      if (ke) keyEventRows = ke.rows
      const pu = await fetchGa4PurchasesBySource(propertyId, { days: windowDays, pathPrefix: hotelRow?.ga4_path_prefix })
      if (pu) purchaseRows = pu.rows
    }

    // ── SWISSNET INFLUENCE ──
    // Clicks are owned data (always real, even with no GA4). Revenue is Path A —
    // only when GA4 attributes it to source=swissnet.
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()
    const { count: clickCount } = await sb
      .from('swissnet_clicks')
      .select('click_id', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .gte('created_at', since)

    const swissnet_influence = buildSwissnetInfluence(
      ga4SourceRows,
      clickCount || 0,
      { periodDays: windowDays, ga4Connected },
    )

    // ── CAPABILITY FLAGS — what is ACTUALLY measurable, stated honestly. ──
    // ecommerce_available: did any GA4 row carry positive revenue this window?
    const ecommerce_available = ai_performance?.total_revenue != null && ai_performance.total_revenue > 0
    // swissnet_attribution_available: did GA4 attribute revenue to the swissnet source?
    const swissnet_attribution_available = swissnet_influence?.capability === 'full'
    // AI-source detection is ALWAYS partial in GA4: Google AI Overviews are undetectable
    // (same google.com domain), and stripped-referrer AI shows as "direct". We never claim
    // 'full' — that would overstate completeness. 'unknown' only when GA4 isn't connected.
    const ai_source_detection_quality = ga4Connected
      ? (ai_performance?.measured ? 'partial' : 'partial')
      : 'unknown'

    return NextResponse.json({
      period_days: windowDays,
      compared: wantCompare,
      ai_performance,
      swissnet_influence,
      // BOOKINGS — `purchase` only, split by source. This is the number a hotel
      // should read. Revenue is null wherever GA4 returns no value on the event.
      bookings: purchaseRows ? (() => {
        const total = purchaseRows.reduce((a: number, r: any) => a + r.purchases, 0)
        const totalRev = purchaseRows.reduce((a: number, r: any) => a + (r.revenue || 0), 0)
        const aiRows = purchaseRows.filter((r: any) => isAiSource(r.source))
        const swissRows = purchaseRows.filter((r: any) => r.source.includes('swissnet'))
        const byPlat: Record<string, number> = {}
        for (const r of aiRows) {
          const p = aiPlatformOf(r.source)
          if (!p) continue
          byPlat[p] = (byPlat[p] || 0) + r.purchases
        }
        return {
          total,
          total_revenue: totalRev > 0 ? Math.round(totalRev) : null,
          from_ai: aiRows.reduce((a: number, r: any) => a + r.purchases, 0),
          from_swissnet: swissRows.reduce((a: number, r: any) => a + r.purchases, 0),
          by_ai_platform: Object.entries(byPlat)
            .map(([platform, purchases]) => ({ platform, purchases }))
            .sort((a, b) => b.purchases - a.purchases),
          // Every source the purchases actually came from. If these are dominated by
          // (direct) or the booking engine's own domain, attribution is broken at the
          // handoff and "0 from AI" means "not measurable", not "none".
          by_source: purchaseRows
            .map((r: any) => ({ source: r.source, purchases: r.purchases }))
            .sort((a: any, b: any) => b.purchases - a.purchases)
            .slice(0, 15),
        }
      })() : null,
      key_events: keyEventRows
        ? Object.entries(
            keyEventRows.reduce((acc: Record<string, number>, r: any) => {
              acc[r.eventName] = (acc[r.eventName] || 0) + r.keyEvents
              return acc
            }, {})
          ).map(([eventName, count]) => ({ eventName, count })).sort((a: any, b: any) => (b.count as number) - (a.count as number))
        : null,
      capability: {
        ga4_connected: ga4Connected,
        ecommerce_available,
        swissnet_attribution_available,
        ai_source_detection_quality,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'GA4 panel read failed' }, { status: 500 })
  }
}