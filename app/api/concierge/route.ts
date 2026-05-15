import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { message, history } = await request.json()

  // Fetch all active hotels with relevant fields
  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, name, slug, location, region, category, description, nightly_rate_chf, rating, images, direct_booking_url, amenities, best_for, exclusive_offer, is_partner')
    .eq('is_active', true)
    .order('is_partner', { ascending: false })
    .order('rating', { ascending: false })
    .limit(30)

  const hotelList = (hotels || []).map(h => ({
    name: h.name,
    location: h.location,
    region: h.region,
    category: h.category,
    rating: h.rating,
    price: h.nightly_rate_chf,
    amenities: h.amenities,
    best_for: h.best_for,
    exclusive_offer: h.exclusive_offer,
    is_partner: h.is_partner,
    description: h.description?.slice(0, 200),
  }))

  // Build conversation history for Claude
  const conversationHistory = (history || []).map((m: any) => ({
    role: m.role,
    content: m.content,
  }))

  const systemPrompt = `You are a luxury Swiss hotel concierge for SwissNet Hotels. You help guests find their perfect hotel in Switzerland.

You have access to this list of hotels:
${JSON.stringify(hotelList, null, 2)}

Rules:
- Always recommend 2-3 hotels maximum that best match the guest's request
- Prioritise is_partner: true hotels when they match the request
- Write a short warm concierge-style intro (1-2 sentences max) before the hotel list
- Return your response as JSON in this exact format:
{
  "message": "Your warm intro sentence here",
  "hotel_names": ["Hotel Name 1", "Hotel Name 2", "Hotel Name 3"]
}
- Only include hotels from the list above — never invent hotels
- hotel_names must exactly match the name field from the list
- If nothing matches well, pick the closest 2-3 and explain why in the message`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        { role: 'user', content: message },
      ],
    }),
  })

  const aiData = await response.json()
  const rawText = aiData.content?.[0]?.text || '{}'

  let parsed: { message: string; hotel_names: string[] }
  try {
    const clean = rawText.replace(/```json|```/g, '').trim()
    parsed = JSON.parse(clean)
  } catch {
    return NextResponse.json({
      message: 'I apologise — something went wrong. Please try again.',
      hotels: [],
    })
  }

  // Look up full hotel data for recommended names
  const recommended = (parsed.hotel_names || []).map(name => {
    const h = (hotels || []).find(hotel => hotel.name === name)
    if (!h) return null
    return {
      hotel_name: h.name,
      location: `${h.location}, Switzerland`,
      category: h.category,
      rating: h.rating,
      nightly_rate_chf: h.nightly_rate_chf,
      image: h.images?.[0] || null,
      amenities: h.amenities?.slice(0, 4) || [],
      best_for: h.best_for || [],
      exclusive_offer: h.exclusive_offer || null,
      reason_recommended: h.description?.slice(0, 120) + '...' || '',
      profile_url: `/hotels/${h.slug || h.id}`,
      direct_booking_url: `/api/track?hotel_id=${h.id}&hotel_name=${encodeURIComponent(h.name)}&destination=${encodeURIComponent(h.direct_booking_url)}&medium=concierge&campaign=ai_concierge`,
    }
  }).filter(Boolean)

  return NextResponse.json({
    message: parsed.message,
    hotels: recommended,
  })
}