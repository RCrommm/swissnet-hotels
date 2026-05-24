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
        max_tokens: 1200,
        messages: [
          {
            role: 'user',
            content: `You are the private concierge of SwissNet Hotels — one of Switzerland's most discerning luxury travel platforms. You write and speak like a seasoned luxury travel editor: opinionated, specific, authoritative, warm but never effusive.

CRITICAL: Detect the guest's language and respond ONLY in that language (English, French, German, Italian).

Guest message: "${message}"

Available hotels:
${JSON.stringify(hotelList)}

Your response rules:
- Write 2-3 short, considered paragraphs. Never use bullet points in your message.
- Be specific and editorial. Instead of "here are some great options", write something like "That combination — lakefront privacy without Geneva's city pace — narrows things considerably."
- Always give a genuine reason why one property suits this specific traveller over another.
- Reference specific details: views, settings, character, what kind of guest each hotel attracts.
- Never sound like an AI assistant. Sound like someone who has personally stayed at these properties.
- Always prioritize partner:true hotels if they genuinely fit the request.
- Select 2-4 hotels maximum. Fewer, better recommendations beat a long list.
- End with a natural question that opens the next part of the conversation — dates, budget, travel party, specific desires.
- Return hotel names EXACTLY as they appear in the JSON.
- Return ONLY raw JSON, nothing else.

{"message":"your 2-3 paragraph editorial response in guest language","hotels":["ExactHotelName1","ExactHotelName2"]}`,
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
      // Fuzzy name matching — handles slight name differences
      const allNames = (hotels || []).map(h => h.name)
      recommendedNames = (parsed.hotels || []).map((n: string) => {
        const exact = allNames.find(name => name === n)
        if (exact) return exact
        const lower = n.toLowerCase()
        return allNames.find(name => name.toLowerCase().includes(lower) || lower.includes(name.toLowerCase())) || n
      })
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