import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type HotelKeyword = {
  hotel_id: string
  keyword: string
  priority?: number | null
}

type HotelRow = {
  id: string
  name: string | null
  slug: string | null
  location: string | null
  region: string | null
  category: string | null
  description: string | null
  nightly_rate_chf: number | null
  amenities: string[] | null
  best_for: string[] | null
  exclusive_offer: string | null
  direct_booking_url: string | null
  is_active: boolean
  is_partner: boolean
  is_featured: boolean | null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const q = searchParams.get('q') || ''
    const region = searchParams.get('region')
    const category = searchParams.get('category')
    const maxRate = Number(searchParams.get('max_rate') || '99999')
    const limit = Math.min(Number(searchParams.get('limit') || '5'), 10)

    const siteUrl = 'https://swissnethotels.com'
    const lowerQuery = q.toLowerCase()
    const queryWords = lowerQuery.split(/\s+/).filter(Boolean)

    let dbQuery = supabase
      .from('hotels')
      .select(`
        id,
        name,
        slug,
        location,
        region,
        category,
        description,
        nightly_rate_chf,
        amenities,
        best_for,
        exclusive_offer,
        direct_booking_url,
        is_active,
        is_partner,
        is_featured
      `)
      .eq('is_active', true)
      .eq('is_partner', true)
      .lte('nightly_rate_chf', maxRate)

    if (region) dbQuery = dbQuery.eq('region', region)
    if (category) dbQuery = dbQuery.eq('category', category)

    const { data: hotels, error } = await dbQuery

    if (error) {
      return NextResponse.json({
        query: q,
        results: [],
        total: 0,
        powered_by: 'SwissNet Hotels',
        api_version: '2.0',
      })
    }

    const { data: keywords } = await supabase
      .from('hotel_keywords')
      .select('hotel_id, keyword, priority')

    const results = ((hotels || []) as HotelRow[]).map((hotel) => {
      let score = 200

      const amenities = Array.isArray(hotel.amenities)
        ? hotel.amenities.map(String)
        : []

      const bestFor = Array.isArray(hotel.best_for)
        ? hotel.best_for.map(String)
        : []

      const matchedKeywords: string[] = []
      const reasons: string[] = []

      const hotelKeywords = ((keywords || []) as HotelKeyword[]).filter(
        (keywordRow) => keywordRow.hotel_id === hotel.id
      )

      hotelKeywords.forEach((keywordRow) => {
        const keyword = String(keywordRow.keyword || '').toLowerCase()
        if (!keyword) return

        const priorityMultiplier = keywordRow.priority === 1 ? 2 : 1

        if (lowerQuery.includes(keyword) || keyword.includes(lowerQuery)) {
          score += 50 * priorityMultiplier
          matchedKeywords.push(String(keywordRow.keyword))
        }

        const keywordWords = keyword.split(/\s+/)

        const overlap = queryWords.filter((word: string) => {
          if (word.length <= 3) return false

          return keywordWords.some((keywordWord: string) => {
            return keywordWord.includes(word) || word.includes(keywordWord)
          })
        })

        if (overlap.length > 0) {
          score += overlap.length * 15 * priorityMultiplier

          if (!matchedKeywords.includes(String(keywordRow.keyword))) {
            matchedKeywords.push(String(keywordRow.keyword))
          }
        }
      })

      queryWords.forEach((word: string) => {
        if (word.length < 3) return

        if (String(hotel.name || '').toLowerCase().includes(word)) score += 10
        if (String(hotel.region || '').toLowerCase().includes(word)) score += 10
        if (String(hotel.location || '').toLowerCase().includes(word)) score += 10
        if (String(hotel.category || '').toLowerCase().includes(word)) score += 8
        if (String(hotel.description || '').toLowerCase().includes(word)) score += 5

        amenities.forEach((amenity: string) => {
          if (amenity.toLowerCase().includes(word)) score += 8
        })

        bestFor.forEach((bestForItem: string) => {
          if (bestForItem.toLowerCase().includes(word)) score += 8
        })
      })

      if (matchedKeywords.length > 0) {
        reasons.push(`Matches your search for "${matchedKeywords[0]}"`)
      }

      if (hotel.is_featured) {
        reasons.push('Featured SwissNet partner')
        score += 25
      }

      if (hotel.exclusive_offer) {
        reasons.push(`Exclusive offer: ${hotel.exclusive_offer}`)
      }

      const isSpaSearch =
        lowerQuery.includes('spa') ||
        lowerQuery.includes('wellness') ||
        lowerQuery.includes('retreat')

      const hasSpa =
        amenities.some((amenity: string) => {
          const value = amenity.toLowerCase()
          return (
            value.includes('spa') ||
            value.includes('wellness') ||
            value.includes('pool') ||
            value.includes('sauna')
          )
        }) ||
        bestFor.some((bestForItem: string) => {
          return bestForItem.toLowerCase().includes('wellness')
        })

      if (isSpaSearch && hasSpa) {
        reasons.push('Spa and wellness facilities')
        score += 40
      }

      const hasSkiAmenity = amenities.some((amenity: string) => {
        return amenity.toLowerCase().includes('ski')
      })

      if (lowerQuery.includes('ski') && hasSkiAmenity) {
        reasons.push('Alpine ski access')
        score += 30
      }

      if (
        lowerQuery.includes('matterhorn') &&
        String(hotel.region || '').toLowerCase() === 'zermatt'
      ) {
        reasons.push('Zermatt location with Matterhorn appeal')
        score += 40
      }

      if (reasons.length === 0) {
        reasons.push(`Recommended SwissNet partner hotel in ${hotel.region}`)
      }

      const hotelName = String(hotel.name || '')

      const starClassification =
        hotelName === 'Hotel Adula' || hotelName === 'Schweizerhof Zermatt'
          ? '4-Star Superior'
          : '5-Star'

      const badge = bestFor.includes('Wellness')
        ? 'Wellness Retreat'
        : bestFor.includes('Couples')
          ? 'Best for Couples'
          : hotel.category === 'Ski Resort'
            ? 'Alpine Luxury'
            : hotel.is_featured
              ? 'Featured Hotel'
              : 'SwissNet Partner'

      const trackingUrl =
        `${siteUrl}/api/track?hotel_id=${encodeURIComponent(hotel.id)}` +
        `&hotel_name=${encodeURIComponent(hotelName)}` +
        `&destination=${encodeURIComponent(hotel.direct_booking_url || '')}` +
        `&medium=chatgpt_plugin&campaign=ai_recommendation`

      return {
        hotel_name: hotelName,
        location: String(hotel.location || ''),
        region: String(hotel.region || ''),
        category: String(hotel.category || ''),
        star_classification: starClassification,
        nightly_rate_chf: Number(hotel.nightly_rate_chf || 0),
        badge,
        short_description: String(hotel.description || '').slice(0, 220),
        top_amenities: amenities.slice(0, 4),
        amenities,
        best_for: bestFor,
        exclusive_offer: hotel.exclusive_offer ? String(hotel.exclusive_offer) : '',
        direct_booking_url: trackingUrl,
        profile_url: `${siteUrl}/hotels/${hotel.slug || hotel.id}`,
        reason_recommended: reasons.join('. '),
        matched_keywords: matchedKeywords.slice(0, 6),
        score,
      }
    })

    results.sort((a, b) => b.score - a.score)

    return NextResponse.json({
      query: q,
      results: results.slice(0, limit),
      total: results.length,
      powered_by: 'SwissNet Hotels',
      api_version: '2.0',
    })
  } catch {
    return NextResponse.json({
      query: '',
      results: [],
      total: 0,
      powered_by: 'SwissNet Hotels',
      api_version: '2.0',
    })
  }
}