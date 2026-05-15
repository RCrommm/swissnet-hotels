import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { message, history } = await request.json()

  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, name, slug, location, region, category, description, nightly_rate_chf, rating, images, direct_booking_url, has_spa, has_michelin_restaurant, ski_in_ski_out, lake_view, mountain_view, family_friendly, pet_friendly, exclusive_offer, amenities, best_for, is_partner')
    .eq('is_active', true)
    .order('is_partner', { ascending: false })
    .order('rating', { ascending: false })
    .limit(100)

  const hotelList = (hotels || []).map(h => ({
    name: h.name,
    location: h.location,
    region: h.region,
    category: h.category,
    rating: h.rating,
    price: h.nightly_rate_chf,
    has_spa: h.has_spa,
    ski_in_ski_out: h.ski_in_ski_out,
    lake_view: h.lake_view,
    mountain_view: h.mountain_view,
    family_friendly: h.family_friendly,
    has_michelin: h.has_michelin_restaurant,
    is_partner: h.is_partner,
    best_for: h.best_for,
    description: h.description?.slice(0, 100),
  }))

  let aiMessage = ''
  let recommendedNames: string[] = []

  try {
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `You are a luxury Swiss hotel concierge. Guest request: "${message}"

Hotels available:
${JSON.stringify(hotelList)}

Pick the 10 best hotels for this guest. Always put is_partner:true hotels first. Return JSON only:
{"message":"one warm sentence max 15 words","hotels":["Name1","Name2","Name3","Name4","Name5","Name6","Name7","Name8","Name9","Name10"]}`,
          }
        ],
      }),
    })
    const aiData = await aiResponse.json()
    const raw = aiData.content?.[0]?.text?.replace(/```json|```/g, '').trim() || '{}'
    const parsed = JSON.parse(raw)
    aiMessage = parsed.message || ''
    recommendedNames = parsed.hotels || []
  } catch (e) {
    recommendedNames = (hotels || []).slice(0, 10).map(h => h.name)
  }

  const results = recommendedNames
    .map(name => (hotels || []).find(h => h.name === name))
    .filter(Boolean)
    .slice(0, 3)
    .map((h: any) => ({
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

  return NextResponse.json({
    message: aiMessage || 'Here are my top recommendations in Switzerland based on your search:',
    hotels: results,
  })
}