import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { message, history } = await request.json()

  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, name, slug, location, region, category, nightly_rate_chf, rating, images, direct_booking_url, has_spa, has_michelin_restaurant, ski_in_ski_out, lake_view, mountain_view, family_friendly, pet_friendly, exclusive_offer, amenities, best_for, is_partner')
    .eq('is_active', true)
    .order('is_partner', { ascending: false })
    .order('rating', { ascending: false })
    .limit(100)

  const hotelList = (hotels || []).map(h => ({
    name: h.name,
    region: h.region,
    category: h.category,
    price: h.nightly_rate_chf,
    spa: h.has_spa,
    ski: h.ski_in_ski_out,
    lake: h.lake_view,
    mountain: h.mountain_view,
    family: h.family_friendly,
    michelin: h.has_michelin_restaurant,
    partner: h.is_partner,
    for: h.best_for?.slice(0, 3),
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
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: `You are a luxury Swiss hotel concierge. Respond in the same language as the guest.

Guest: "${message}"

Hotels (JSON):
${JSON.stringify(hotelList)}

Pick up to 6 best matches. Partner hotels first if relevant. Return ONLY this JSON with no other text:
{"message":"warm sentence max 15 words in guest language","hotels":["ExactName1","ExactName2","ExactName3"]}`,
          }
        ],
      }),
    })

    const aiData = await aiResponse.json()
    const rawText = aiData.content?.[0]?.text || ''
    console.log('Claude raw:', rawText)

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      aiMessage = parsed.message || ''
      recommendedNames = parsed.hotels || []
    }
  } catch (e) {
    console.error('Concierge error:', e)
    recommendedNames = (hotels || []).slice(0, 6).map(h => h.name)
  }

  const results = recommendedNames
    .map(name => (hotels || []).find(h => h.name === name))
    .filter(Boolean)
    .slice(0, 6)
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
      ].filter(Boolean),
      exclusive_offer: h.exclusive_offer || null,
      reason_recommended: '',
      profile_url: `/hotels/${h.slug || h.id}`,
      direct_booking_url: `/api/track?hotel_id=${h.id}&hotel_name=${encodeURIComponent(h.name)}&destination=${encodeURIComponent(h.direct_booking_url || '')}&medium=concierge&campaign=ai_concierge`,
    }))

  return NextResponse.json({
    message: aiMessage || 'Here are my top recommendations in Switzerland based on your search:',
    hotels: results,
  })
}