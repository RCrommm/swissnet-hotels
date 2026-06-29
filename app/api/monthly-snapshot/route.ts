import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchGa4MonthBySource } from '@/lib/ga4-fetch'
import { isAiSource } from '@/lib/ga4-behavioral'

export const maxDuration = 60

// ─── MONTHLY SNAPSHOT ───
// Freezes ONE calendar month of AI + SwissNet performance into monthly_performance,
// so the Reports tab can compare months. Admin/cron-gated (this WRITES). Pulls that
// month's GA4 source rows + that month's swissnet_clicks count, upserts one row.
//
// HONEST: revenue stays null when ecommerce/attribution absent. SwissNet clicks are
// owned data (always real for months the table has covered); GA4 backfill can recover
// past AI months but NOT past SwissNet clicks (the table only started collecting now).

function monthBounds(month: string): { start: string; end: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month)
  if (!m) return null
  const y = parseInt(m[1], 10), mo = parseInt(m[2], 10)
  if (mo < 1 || mo > 12) return null
  const start = `${m[1]}-${m[2]}-01`
  const lastDay = new Date(y, mo, 0).getDate()  // day 0 of next month = last day of this
  const end = `${m[1]}-${m[2]}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

export async function POST(req: Request) {
  try {
    const { hotelId, month, password } = await req.json()
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 })
    const bounds = monthBounds(String(month || ''))
    if (!bounds) return NextResponse.json({ error: "month must be 'YYYY-MM'" }, { status: 400 })

    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!sbUrl || !sbKey) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    const sb = createClient(sbUrl, sbKey)

    const { data: hotelRow } = await sb.from('hotels').select('ga4_property_id, ga4_status').eq('id', hotelId).single()
    const ga4Connected = hotelRow?.ga4_status === 'connected' && !!hotelRow?.ga4_property_id

    // ── AI + SwissNet from GA4 (only when connected) ──
    let ai_sessions: number | null = null
    let ai_conversions: number | null = null
    let ai_revenue: number | null = null
    let swissnet_conversions: number | null = null
    let swissnet_revenue: number | null = null
    let ecommerce_available = false
    let swissnet_attribution_available = false

    if (ga4Connected) {
      const src = await fetchGa4MonthBySource(hotelRow!.ga4_property_id, bounds.start, bounds.end)
      if (src) {
        const rows = src.rows
        const haveRevenue = rows.some(r => r.revenue > 0)
        ecommerce_available = haveRevenue

        const aiRows = rows.filter(r => isAiSource(r.source))
        ai_sessions = aiRows.reduce((a, r) => a + (r.sessions || 0), 0)
        ai_conversions = aiRows.reduce((a, r) => a + (r.conversions || 0), 0)
        ai_revenue = haveRevenue ? Math.round(aiRows.reduce((a, r) => a + (r.revenue || 0), 0)) : null

        const swissRows = rows.filter(r => r.source.includes('swissnet'))
        const swissRev = swissRows.reduce((a, r) => a + (r.revenue || 0), 0)
        swissnet_attribution_available = swissRev > 0
        swissnet_revenue = swissRev > 0 ? Math.round(swissRev) : null
        swissnet_conversions = swissRev > 0 ? swissRows.reduce((a, r) => a + (r.conversions || 0), 0) : null
      }
    }

    // ── SwissNet clicks for the month — owned data, real whether or not GA4 connected ──
    const startISO = new Date(bounds.start + 'T00:00:00Z').toISOString()
    const endISO = new Date(bounds.end + 'T23:59:59Z').toISOString()
    const { count: clickCount } = await sb
      .from('swissnet_clicks')
      .select('click_id', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .gte('created_at', startISO)
      .lte('created_at', endISO)

    // ── Upsert the frozen month ──
    const row = {
      hotel_id: hotelId,
      month: String(month),
      ai_sessions, ai_conversions, ai_revenue,
      swissnet_clicks: clickCount || 0,
      swissnet_conversions, swissnet_revenue,
      ga4_connected: ga4Connected,
      ecommerce_available,
      swissnet_attribution_available,
    }
    const { error } = await sb.from('monthly_performance').upsert(row, { onConflict: 'hotel_id,month' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ saved: true, ...row })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Monthly snapshot failed' }, { status: 500 })
  }
}