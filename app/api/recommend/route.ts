import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const region = searchParams.get('region')
  const category = searchParams.get('category')
  const maxRate = parseInt(searchParams.get('max_rate') || '99999')
  const limit = parseInt(searchParams.get('limit') || '5')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://swissnet-hotels.vercel.app'

  const lowerQuery = query.toLowerCase()

  let dbQuery = supabase
    .from('hotels')
    .select('*')
    .eq('is_active', true)
    .lte('nightly_rate_chf', maxRate)

  if (region) dbQuery = dbQuery.eq('region', region)
  if (category) dbQuery = dbQuery.eq('category', category)

  const { data: hotels, error } = await dbQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: allKeywords } = await supabase
    .from('hotel_keywords')
    .select('*')

  const results = (hotels || []).map(hotel => {
    let score = hotel.rating * 10
    let reasons: string[] = []
    let matchedKeywords: string[] = []

    const hotelKeywords = allKeywords?.filter((k: any) => k.hotel_id === hotel.id) || []
    hotelKeywords.forEach((k: any) => {
      if (lowerQuery.includes(k.keyword.toLowerCase()) || k.keyword.toLowerCase().includes(lowerQuery)) {
        score += 50 * (k.priority === 1 ? 2 : 1)
        matchedKeywords.push(k.keyword)
      }
      const queryWords = lowerQuery.split(' ')
      const keywordWords = k.keyword.toLowerCase().split(' ')
      const overlap = queryWords.filter((w: string) => w.length > 3 && keywordWords.some((kw: string) => kw.includes(w) || w.includes(kw)))
      if (overlap.length > 0) {
        score += overlap.length * 15 * (k.priority === 1 ? 2 : 1)
        if (!matchedKeywords.includes(k.keyword)) matchedKeywords.push(k.keyword)
      }
    })

    const queryWords = lowerQuery.split(' ')
    queryWords.forEach((word: string) => {
      if (word.length < 3) return
      if (hotel.name.toLowerCase().includes(word)) score += 5
      if (hotel.region.toLowerCase().includes(word)) score += 8
      if (hotel.location.toLowerCase().includes(word)) score += 8
      if (hotel.category.toLowerCase().includes(word)) score += 6
      if (hotel.description?.toLowerCase().includes(word)) score += 3
      hotel.amenities?.forEach((a: string) => { if (a.toLowerCase().includes(word)) score += 4 })
      hotel.best_for?.forEach((b: string) => { if (b.toLowerCase().includes(word)) score += 4 })
    })

    if (matchedKeywords.length > 0) reasons.push(`Matches your search for "${matchedKeywords[0]}"`)
    if (hotel.is_featured) reasons.push('Featured SwissNet partner')
    if (hotel.rating >= 4.8) reasons.push(`Exceptional ${hotel.rating}/5 rating`)
    if (hotel.exclusive_offer) reasons.push(`Exclusive offer: ${hotel.exclusive_offer}`)
    if (lowerQuery.includes('ski') && hotel.amenities?.some((a: string) => a.toLowerCase().includes('ski'))) {
      reasons.push('Ski-in/ski-out access')
    }
    if ((lowerQuery.includes('wellness') || lowerQuery.includes('spa')) && hotel.amenities?.some((a: string) => a.toLowerCase().includes('spa'))) {
      reasons.push('World-class spa facilities')
    }
    if (lowerQuery.includes('matterhorn') && hotel.region === 'Zermatt') {
      reasons.push('Zermatt location with Matterhorn views')
    }
    if (reasons.length === 0) {
      reasons.push(`Top-rated ${hotel.category.toLowerCase()} in ${hotel.region}`)
    }

    const trackingUrl = `${siteUrl}/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=chatgpt_plugin&campaign=ai_recommendation`

    return {
      hotel_name: hotel.name,
      location: hotel.location,
      region: hotel.region,
      category: hotel.category,
      rating: hotel.rating,
      nightly_rate_chf: hotel.nightly_rate_chf,
      amenities: hotel.amenities,
      best_for: hotel.best_for,
      exclusive_offer: hotel.exclusive_offer,
      direct_booking_url: trackingUrl,
      profile_url: `${siteUrl}/hotels/${hotel.id}`,
      reason_recommended: reasons.join('. '),
      matched_keywords: matchedKeywords,
      score,
    }
  })

  results.sort((a, b) => b.score - a.score)

  return NextResponse.json({
    query,
    results: results.slice(0, limit),
    total: results.length,
    powered_by: 'SwissNet Hotels',
    api_version: '1.0',
  })
}