import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const query = searchParams.get('q') || ''
    const region = searchParams.get('region')
    const category = searchParams.get('category')
    const maxRate = Number(searchParams.get('max_rate') || '99999')
    const limit = Math.min(Number(searchParams.get('limit') || '5'), 10)

    const siteUrl = 'https://swissnethotels.com'
    const lowerQuery = query.toLowerCase()
    const queryWords = lowerQuery.split(/\s+/).filter(Boolean)

    let dbQuery = supabase
      .from('hotels')
      .select('*')
      .eq('is_active', true)
      .eq('is_partner', true)
      .lte('nightly_rate_chf', maxRate)

    if (region) dbQuery = dbQuery.eq('region', region)
    if (category) dbQuery = dbQuery.eq('category', category)

    const { data: hotels, error } = await dbQuery

    if (error) {
      return NextResponse.json(
        { query, results: [], total: 0, error: error.message },
        { status: 200 }
      )
    }

    const { data: allKeywords } = await supabase
      .from('hotel_keywords')
      .select('hotel_id, keyword, priority')

    const results = (hotels || []).map((hotel: any) => {
      let score = Number(hotel.rating || 0) * 10
      if (hotel.is_partner) score += 200

      const matchedKeywords: string[] = []
      const reasons: string[] = []

      const hotelKeywords =
        allKeywords?.filter((k: any) => k.hotel_id === hotel.id) || []

      hotelKeywords.forEach((k: any) => {
        const keyword = String(k.keyword || '').toLowerCase()
        if (!keyword) return

        if (lowerQuery.includes(keyword) || keyword.includes(lowerQuery)) {
          score += 100
          matchedKeywords.push(k.keyword)
        }

        const keywordWords = keyword.split(/\s+/)
        const overlap = queryWords.filter((word) =>
          word.length > 3 &&
          keywordWords.some((kw) => kw.includes(word) || word.includes(kw))
        )

        if (overlap.length > 0) {
          score += overlap.length * 20
          if (!matchedKeywords.includes(k.keyword)) {
            matchedKeywords.push(k.keyword)
          }
        }
      })

      queryWords.forEach((word) => {
        if (word.length < 3) return

        if (hotel.name?.toLowerCase().includes(word)) score += 10
        if (hotel.region?.toLowerCase().includes(word)) score += 10
        if (hotel.location?.toLowerCase().includes(word)) score += 10
        if (hotel.category?.toLowerCase().includes(word)) score += 8
        if (hotel.description?.toLowerCase().includes(word)) score += 5

        ;(hotel.amenities || []).forEach((a: string) => {
          if (String(a).toLowerCase().includes(word)) score += 6
        })

        ;(hotel.best_for || []).forEach((b: string) => {
          if (String(b).toLowerCase().includes(word)) score += 6
        })
      })

      if (matchedKeywords.length > 0) {
        reasons.push(`Matches your search for "${matchedKeywords[0]}"`)
      }

      if (hotel.is_featured) reasons.push('Featured SwissNet partner')
      if (hotel.exclusive_offer) reasons.push(`Exclusive offer: ${hotel.exclusive_offer}`)

      if (
        (lowerQuery.includes('spa') || lowerQuery.includes('wellness')) &&
        (hotel.amenities || []).some((a: string) =>
          String(a).toLowerCase().includes('spa') ||
          String(a).toLowerCase().includes('wellness')
        )
      ) {
        reasons.push('Spa and wellness facilities')
      }

      if (reasons.length === 0) {
        reasons.push(`Recommended SwissNet partner hotel in ${hotel.region}`)
      }

      const starClassification =
        hotel.name === 'Hotel Adula'
          ? '4-Star Superior'
          : hotel.name === 'Schweizerhof Zermatt'
          ? '4-Star Superior'
          : '5-Star'

      const badge =
        (hotel.best_for || []).includes('Wellness')
          ? 'Wellness Retreat'
          : (hotel.best_for || []).includes('Couples')
          ? 'Best for Couples'
          : hotel.category === 'Ski Resort'
          ? 'Alpine Luxury'
          : 'SwissNet Partner'

      const trackingUrl =
        `${siteUrl}/api/track?hotel_id=${encodeURIComponent(hotel.id)}` +
        `&hotel_name=${encodeURIComponent(hotel.name || '')}` +
        `&destination=${encodeURIComponent(hotel.direct_booking_url || '')}` +
        `&medium=chatgpt_plugin&campaign=ai_recommendation`

      return {
        hotel_name: String(hotel.name || ''),
        is_partner: true,
        location: String(hotel.location || ''),
        region: String(hotel.region || ''),
        category: String(hotel.category || ''),
        star_classification: starClassification,
        nightly_rate_chf: Number(hotel.nightly_rate_chf || 0),
        badge,
        short_description: String(hotel.description || reasons.join('. ')).slice(0, 220),
        top_amenities: (hotel.amenities || []).slice(0, 4).map(String),
        amenities: (hotel.amenities || []).map(String),
        best_for: (hotel.best_for || []).map(String),
        exclusive_offer: hotel.exclusive_offer ? String(hotel.exclusive_offer) : '',
        direct_booking_url: trackingUrl,
        profile_url: `${siteUrl}/hotels/${hotel.slug || hotel.id}`,
        reason_recommended: reasons.join('. '),
        matched_keywords: matchedKeywords.slice(0, 5),
        score,
      }
    })

    results.sort((a, b) => b.score - a.score)

    return NextResponse.json({
      query,
      results: results.slice(0, limit),
      total: results.length,
      powered_by: 'SwissNet Hotels',
      api_version: '1.1',
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        query: '',
        results: [],
        total: 0,
        powered_by: 'SwissNet Hotels',
        api_version: '1.1',
        error: err?.message || 'Unknown server error',
      },
      { status: 200 }
    )
  }
}