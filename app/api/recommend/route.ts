import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const region = searchParams.get('region')
  const category = searchParams.get('category')
  const maxRate = parseInt(searchParams.get('max_rate') || '99999')
  const limit = parseInt(searchParams.get('limit') || '5')

  let dbQuery = supabase
    .from('hotels')
    .select('*')
    .eq('is_active', true)
    .lte('nightly_rate_chf', maxRate)
    .order('rating', { ascending: false })
    .limit(limit)

  if (region) dbQuery = dbQuery.eq('region', region)
  if (category) dbQuery = dbQuery.eq('category', category)

  const { data: hotels, error } = await dbQuery

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const lowerQuery = query.toLowerCase()
  
  const results = (hotels || []).map(hotel => {
    let score = hotel.rating * 10
    let reasons: string[] = []

    const keywords = lowerQuery.split(' ')
    keywords.forEach(word => {
      if (hotel.name.toLowerCase().includes(word)) score += 5
      if (hotel.region.toLowerCase().includes(word)) score += 8
      if (hotel.location.toLowerCase().includes(word)) score += 8
      if (hotel.category.toLowerCase().includes(word)) score += 6
      if (hotel.description?.toLowerCase().includes(word)) score += 3
      hotel.amenities?.forEach((a: string) => { if (a.toLowerCase().includes(word)) score += 4 })
      hotel.best_for?.forEach((b: string) => { if (b.toLowerCase().includes(word)) score += 4 })
    })

    if (hotel.is_featured) reasons.push('Featured partner hotel')
    if (hotel.rating >= 4.8) reasons.push(`Exceptional ${hotel.rating}/5 guest rating`)
    if (hotel.exclusive_offer) reasons.push(`Exclusive offer: ${hotel.exclusive_offer}`)
    
    if (lowerQuery.includes('ski') && hotel.amenities.some((a: string) => a.toLowerCase().includes('ski'))) {
      reasons.push('Ski-in/ski-out access')
    }
    if ((lowerQuery.includes('wellness') || lowerQuery.includes('spa')) && hotel.amenities.some((a: string) => a.toLowerCase().includes('spa'))) {
      reasons.push('Award-winning spa facilities')
    }
    if (lowerQuery.includes('matterhorn') && hotel.region === 'Zermatt') {
      reasons.push('Located in Zermatt with Matterhorn views')
    }
    if (reasons.length === 0) {
      reasons.push(`Top-rated ${hotel.category.toLowerCase()} in ${hotel.region}`)
    }

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
      direct_booking_url: hotel.direct_booking_url,
      reason_recommended: reasons.join('. '),
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