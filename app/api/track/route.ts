import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// Short, URL-safe click id. No dependency — crypto is built into the runtime.
function makeClickId(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').slice(0, 16)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const hotel_id = searchParams.get('hotel_id')
  const hotel_name = searchParams.get('hotel_name')
  const destination = searchParams.get('destination')
  const medium = searchParams.get('medium') || 'website'
  const campaign = searchParams.get('campaign') || 'direct_booking'
  if (!destination) {
    return NextResponse.json({ error: 'destination required' }, { status: 400 })
  }

  const source_page = request.headers.get('referer') || ''
  const visitor_ip = request.headers.get('x-forwarded-for') || ''
  const user_agent = request.headers.get('user-agent') || ''

  // Generate the SwissNet click id — what we later reconcile bookings against.
  const click_id = makeClickId()

  // Existing analytics row (unchanged behaviour).
  await supabase.from('referral_clicks').insert([{
    hotel_id: hotel_id || null,
    hotel_name: hotel_name || null,
    source_page,
    utm_source: 'swissnet',
    utm_medium: medium,
    utm_campaign: campaign,
    visitor_ip,
    user_agent,
  }])

  // New: the click-ID store. SwissNet now owns this journey. ai_source left null for now
  // (resolved later by joining to the originating session). Best-effort — a failure here
  // must never block the redirect.
  const { error: cidError } = await supabase.from('swissnet_clicks').insert([{
    click_id,
    hotel_id: hotel_id || null,
    hotel_name: hotel_name || null,
    ai_source: null,
    source_page,
    utm_campaign: campaign,
    destination_url: destination,
    visitor_ip,
    user_agent,
  }])
  if (cidError) {
    return NextResponse.json({ debug_swissnet_clicks_error: cidError }, { status: 200 })
  }

  // Build the destination URL with UTMs + the SwissNet click id.
  const url = new URL(destination)
  url.searchParams.set('utm_source', 'swissnet')
  url.searchParams.set('utm_medium', medium)
  url.searchParams.set('utm_campaign', campaign)
  url.searchParams.set('utm_content', hotel_name || '')
  url.searchParams.set('swissnet_cid', click_id)

  return NextResponse.redirect(url.toString())
}