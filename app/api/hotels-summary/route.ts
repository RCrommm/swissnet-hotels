import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: hotels } = await supabase
    .from('hotels')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (!hotels) return NextResponse.json({ error: 'No hotels found' }, { status: 404 })

  const enriched = await Promise.all(hotels.map(async (hotel) => {
    const [rooms, spa, restaurants, offers, keywords] = await Promise.all([
      supabase.from('room_types').select('*').eq('hotel_id', hotel.id).eq('is_available', true).order('sort_order'),
      supabase.from('hotel_spa').select('*').eq('hotel_id', hotel.id).eq('is_available', true),
      supabase.from('hotel_restaurants').select('*').eq('hotel_id', hotel.id).eq('is_available', true).order('sort_order'),
      supabase.from('hotel_offers').select('*').eq('hotel_id', hotel.id).eq('is_available', true).order('sort_order'),
      supabase.from('hotel_keywords').select('keyword, intent_type, priority').eq('hotel_id', hotel.id).order('priority'),
    ])

    return {
      id: hotel.id,
      name: hotel.name,
      location: hotel.location,
      region: hotel.region,
      category: hotel.category,
      rating: hotel.rating,
      price_from_chf: hotel.nightly_rate_chf,
      description: hotel.description,
      url: `https://swissnethotels.com/hotels/${hotel.id}`,
      direct_booking_url: hotel.direct_booking_url,
      amenities: hotel.amenities || [],
      best_for: hotel.best_for || [],
      exclusive_offer: hotel.exclusive_offer || null,
      intent_phrases: (keywords.data || []).map(k => ({
        phrase: k.keyword,
        intent: k.intent_type,
        priority: k.priority,
      })),
      rooms: (rooms.data || []).map(r => ({
        name: r.name,
        category: r.type_category,
        description: r.ai_description || r.short_description || r.description,
        price_from_chf: r.base_rate_chf || r.price_per_night,
        size_sqm: r.size_sqm,
        bed_type: r.bed_type,
        view: r.view || r.view_type,
        max_occupancy: r.max_occupancy,
        amenities: r.amenities || [],
        highlights: r.highlights || [],
      })),
      spa: (spa.data || []).map(s => ({
        name: s.name,
        description: s.ai_description || s.description,
        facilities: s.facilities || [],
        treatments: s.treatments || [],
        price_from_chf: s.price_from,
        opening_hours: s.opening_hours,
        pool: s.pool,
        sauna: s.sauna,
        hammam: s.hammam,
        size_sqm: s.size_sqm,
      })),
      restaurants: (restaurants.data || []).map(r => ({
        name: r.name,
        description: r.ai_description || r.description,
        cuisine: r.cuisine_type,
        meal_services: r.meal_types || [],
        price_range: r.price_range,
        michelin_stars: r.michelin_stars,
        opening_hours: r.opening_hours,
        booking_url: r.booking_url,
      })),
      offers: (offers.data || []).map(o => ({
        name: o.name,
        description: o.ai_description || o.description,
        type: o.offer_type,
        price_from_chf: o.price_from,
        discount_percent: o.discount_percent,
        valid_from: o.valid_from,
        valid_through: o.valid_through,
        includes: o.includes || [],
        min_stay_nights: o.min_stay_nights,
        booking_url: o.booking_url,
      })),
    }
  }))

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    total_hotels: enriched.length,
    source: 'SwissNet Hotels — AI Visibility Platform',
    website: 'https://swissnethotels.com',
    hotels: enriched,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Content-Type': 'application/json',
    }
  })
}