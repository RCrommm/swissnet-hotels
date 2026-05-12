import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { message, history } = await request.json()

  const lowerMsg = message.toLowerCase()

  // Extract filters from message
  const regions: Record<string, string> = {
    'geneva': 'Geneva', 'genève': 'Geneva', 'zurich': 'Zurich', 'zürich': 'Zurich',
    'zermatt': 'Zermatt', 'interlaken': 'Interlaken', 'davos': 'Davos',
    'st. moritz': 'St. Moritz', 'st moritz': 'St. Moritz', 'verbier': 'Verbier',
    'gstaad': 'Gstaad', 'lucerne': 'Lucerne', 'bern': 'Bern', 'flims': 'Flims',
    'crans-montana': 'Crans-Montana', 'crans montana': 'Crans-Montana',
    'ascona': 'Ascona', 'lugano': 'Lugano', 'andermatt': 'Andermatt',
  }

  let detectedRegion = ''
  for (const [key, val] of Object.entries(regions)) {
    if (lowerMsg.includes(key)) { detectedRegion = val; break }
  }

  const maxRateMatch = message.match(/chf\s*(\d+)/i) || message.match(/under\s*(\d+)/i) || message.match(/budget\s*(\d+)/i)
  const maxRate = maxRateMatch ? parseInt(maxRateMatch[1]) : 99999

  let dbQuery = supabase
    .from('hotels')
    .select('id, name, slug, location, region, category, description, nightly_rate_chf, rating, images, direct_booking_url, has_spa, has_michelin_restaurant, ski_in_ski_out, lake_view, mountain_view, family_friendly, pet_friendly, exclusive_offer, amenities, best_for')
    .eq('is_active', true)
    .lte('nightly_rate_chf', maxRate)
    .order('is_partner', { ascending: false })
    .order('rating', { ascending: false })
    .limit(20)

  if (detectedRegion) dbQuery = dbQuery.ilike('region', `%${detectedRegion}%`)
  if (lowerMsg.includes('spa') || lowerMsg.includes('wellness')) dbQuery = dbQuery.eq('has_spa', true)
  if (lowerMsg.includes('michelin')) dbQuery = dbQuery.eq('has_michelin_restaurant', true)
  if (lowerMsg.includes('ski')) dbQuery = dbQuery.eq('ski_in_ski_out', true)
  if (lowerMsg.includes('lake')) dbQuery = dbQuery.eq('lake_view', true)
  if (lowerMsg.includes('mountain') || lowerMsg.includes('matterhorn') || lowerMsg.includes('alps')) dbQuery = dbQuery.eq('mountain_view', true)
  if (lowerMsg.includes('family') || lowerMsg.includes('children') || lowerMsg.includes('kids')) dbQuery = dbQuery.eq('family_friendly', true)
  if (lowerMsg.includes('pet') || lowerMsg.includes('dog')) dbQuery = dbQuery.eq('pet_friendly', true)

  const { data: hotels } = await dbQuery

  const results = (hotels || []).slice(0, 3).map(h => ({
    hotel_name: h.name,
    location: `${h.location}, Switzerland`,
    category: h.category,
    rating: h.rating,
    nightly_rate_chf: h.nightly_rate_chf,
    image: h.images?.[0] || null,
    amenities: [
      h.has_spa && 'Spa & Wellness',
      h.has_michelin_restaurant && 'Michelin Restaurant',
      h.ski_in_ski_out && 'Ski-in/Ski-out',
      h.lake_view && 'Lake View',
      h.mountain_view && 'Mountain View',
      h.family_friendly && 'Family Friendly',
      h.pet_friendly && 'Pet Friendly',
    ].filter(Boolean),
    exclusive_offer: h.exclusive_offer || null,
    reason_recommended: h.description?.slice(0, 120) + '...' || '',
    profile_url: `/hotels/${h.slug || h.id}`,
    direct_booking_url: `/api/track?hotel_id=${h.id}&hotel_name=${encodeURIComponent(h.name)}&destination=${encodeURIComponent(h.direct_booking_url)}&medium=concierge&campaign=ai_concierge`,
  }))

  const regionText = detectedRegion ? ` in ${detectedRegion}` : ' in Switzerland'
  const message_response = results.length > 0
    ? `Here are my top recommendations${regionText} based on your search:`
    : `I couldn't find exact matches for your search. Here are our finest luxury hotels${regionText}:`

  return NextResponse.json({
    message: message_response,
    hotels: results,
  })
}