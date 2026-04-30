import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hotelId = searchParams.get('hotel_id')
    const value = searchParams.get('value')
    const ref = searchParams.get('ref')

    if (!hotelId) return new NextResponse('', { status: 400 })

    await supabase.from('bookings').insert({
      hotel_id: hotelId,
      booking_value: value ? parseFloat(value) : null,
      total_chf: value ? parseFloat(value) : null,
      source: 'swissnet',
      ref,
      currency: 'CHF',
      booked_at: new Date().toISOString(),
    })

    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (err: any) {
    return new NextResponse('', { status: 500 })
  }
}