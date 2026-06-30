import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchGa4Rows } from '@/lib/ga4-fetch'

export const maxDuration = 60

// ── GA4 FETCH (thin wrapper) ──
// Looks up a connected hotel's property, delegates the actual GA4 pull to the
// shared lib/ga4-fetch helper, returns Ga4PageRow[] for the mapper.

export async function POST(req: Request) {
  try {
    const { hotelId, password, days, previous } = await req.json()
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 })

    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!sbUrl || !sbKey) return NextResponse.json({ error: 'Server not configured (Supabase).' }, { status: 500 })

    const sb = createClient(sbUrl, sbKey)
    const { data: hotel, error: hErr } = await sb
      .from('hotels')
      .select('id, ga4_property_id, ga4_status, ga4_path_prefix')
      .eq('id', hotelId)
      .single()
    if (hErr || !hotel) return NextResponse.json({ error: 'Hotel not found.' }, { status: 404 })
    if (!hotel.ga4_property_id || hotel.ga4_status !== 'connected') {
      return NextResponse.json({ error: 'This hotel has no connected GA4 property.' }, { status: 400 })
    }

    const result = await fetchGa4Rows(hotel.ga4_property_id, { days, previous, pathPrefix: hotel.ga4_path_prefix })
    if (!result) return NextResponse.json({ error: 'GA4 is not configured on the server yet.' }, { status: 500 })

    return NextResponse.json({
      hotelId,
      propertyId: String(hotel.ga4_property_id).replace(/[^0-9]/g, ''),
      periodDays: result.periodDays,
      rows: result.rows,
      previousRows: result.previousRows,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'GA4 fetch failed' }, { status: 500 })
  }
}