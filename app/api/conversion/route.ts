import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    const utmSource = (body.utm_source || '').toLowerCase()
    if (utmSource !== 'swissnet') {
      return NextResponse.json({ ignored: true, reason: 'not a swissnet booking' }, { status: 200, headers: CORS })
    }

    let hotelId = body.hotel_id || null
    const hotelName = body.hotel_name || body.utm_content || null
    if (!hotelId && hotelName) {
      const { data: h } = await supabase.from('hotels').select('id').ilike('name', hotelName).maybeSingle()
      if (h) hotelId = h.id
    }

    await supabase.from('conversions').insert([{
      hotel_id: hotelId,
      hotel_name: hotelName,
      utm_source: utmSource,
      utm_campaign: body.utm_campaign || null,
      booking_value: body.booking_value != null ? Number(body.booking_value) : null,
      currency: body.currency || 'CHF',
      booking_reference: body.booking_reference || null,
      raw_payload: body,
    }])

    return NextResponse.json({ recorded: true }, { status: 200, headers: CORS })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS })
  }
}
