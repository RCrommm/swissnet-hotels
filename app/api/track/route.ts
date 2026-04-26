import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

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

  // Record the click
  await supabase.from('referral_clicks').insert([{
    hotel_id: hotel_id || null,
    hotel_name: hotel_name || null,
    source_page: request.headers.get('referer') || '',
    utm_source: 'swissnet',
    utm_medium: medium,
    utm_campaign: campaign,
    visitor_ip: request.headers.get('x-forwarded-for') || '',
    user_agent: request.headers.get('user-agent') || '',
  }])

  // Build the destination URL with UTM parameters
  const url = new URL(destination)
  url.searchParams.set('utm_source', 'swissnet')
  url.searchParams.set('utm_medium', medium)
  url.searchParams.set('utm_campaign', campaign)
  url.searchParams.set('utm_content', hotel_name || '')

  // Redirect to hotel website with tracking
  return NextResponse.redirect(url.toString())
}