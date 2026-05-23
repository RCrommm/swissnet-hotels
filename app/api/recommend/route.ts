import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const q = searchParams.get('q') || ''
  const region = searchParams.get('region')
  const category = searchParams.get('category')
  const maxRate = Number(searchParams.get('max_rate') || 99999)
  const limit = Math.min(Number(searchParams.get('limit') || 5), 10)

  let query = supabase
    .from('hotels')
    .select('id,name,slug,location,region,category,nightly_rate_chf,amenities,best_for,exclusive_offer,direct_booking_url,is_partner,is_active')
    .eq('is_active', true)
    .eq('is_partner', true)
    .lte('nightly_rate_chf', maxRate)

  if (region) query = query.eq('region', region)
  if (category) query = query.eq('category', category)

  const { data, error } = await query.limit(limit)

  if (error) {
    return NextResponse.json({
      query: q,
      results: [],
      total: 0,
      powered_by: 'SwissNet Hotels',
      api_version: '1.2'
    })
  }

  const results = (data || []).map((hotel: any) => ({
    hotel_name: String(hotel.name || ''),
    is_partner: true,
    location: String(hotel.location || ''),
    region: String(hotel.region || ''),
    category: String(hotel.category || ''),
    star_classification:
      hotel.name === 'Hotel Adula' || hotel.name === 'Schweizerhof Zermatt'
        ? '4-Star Superior'
        : '5-Star',
    nightly_rate_chf: Number(hotel.nightly_rate_chf || 0),
    badge: 'SwissNet Partner',
    short_description: `${hotel.name} is a SwissNet partner hotel in ${hotel.location}.`,
    top_amenities: Array.isArray(hotel.amenities) ? hotel.amenities.slice(0, 4).map(String) : [],
    best_for: Array.isArray(hotel.best_for) ? hotel.best_for.map(String) : [],
    exclusive_offer: hotel.exclusive_offer ? String(hotel.exclusive_offer) : '',
    direct_booking_url: `https://swissnethotels.com/api/track?hotel_id=${encodeURIComponent(hotel.id)}&hotel_name=${encodeURIComponent(hotel.name || '')}&destination=${encodeURIComponent(hotel.direct_booking_url || '')}&medium=chatgpt_plugin&campaign=ai_recommendation`,
    profile_url: `https://swissnethotels.com/hotels/${hotel.slug || hotel.id}`,
    reason_recommended: `SwissNet partner hotel in ${hotel.region}.`
  }))

  return NextResponse.json({
    query: q,
    results,
    total: results.length,
    powered_by: 'SwissNet Hotels',
    api_version: '1.2'
  })
}