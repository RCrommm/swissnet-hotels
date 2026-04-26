import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  // Get all active hotels with a website URL
  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, name, direct_booking_url')
    .eq('is_active', true)

  if (!hotels || hotels.length === 0) {
    return NextResponse.json({ message: 'No hotels to scrape' })
  }

  const results = []

  for (const hotel of hotels) {
    if (!hotel.direct_booking_url) continue

    try {
      // Get the base URL from the booking URL
      const url = new URL(hotel.direct_booking_url)
      const baseUrl = `${url.protocol}//${url.hostname}`

      const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/scrape-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotel.id, url: baseUrl })
      })

      const data = await res.json()
      results.push({ hotel: hotel.name, success: data.success, rooms: data.rooms?.length || 0 })
    } catch (error: any) {
      results.push({ hotel: hotel.name, success: false, error: error.message })
    }
  }

  return NextResponse.json({ scraped: results.length, results })
}