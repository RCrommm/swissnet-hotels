import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'IndexNow endpoint active. Use POST to submit URLs.',
  })
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-indexnow-secret')

  if (secret !== process.env.INDEXNOW_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const key = process.env.INDEXNOW_KEY

  if (!key) {
    return NextResponse.json({ error: 'Missing INDEXNOW_KEY' }, { status: 500 })
  }

  const { data: hotels } = await supabase
    .from('hotels')
    .select('slug, id, is_partner')
    .eq('is_active', true)

  const base = 'https://swissnethotels.com'

  const staticUrls = [
    base,
    `${base}/hotels`,
    `${base}/pricing`,
  ]

  const hotelUrls = (hotels || []).flatMap((h: any) => {
    const slug = h.slug || h.id
    const hotelBase = `${base}/hotels/${slug}`

    if (!h.is_partner) return [hotelBase]

    return [
      hotelBase,
      `${hotelBase}/rooms`,
      `${hotelBase}/dining`,
      `${hotelBase}/spa`,
      `${hotelBase}/experiences`,
      `${hotelBase}/events`,
    ]
  })

  const destinationSlugs = [
    'zermatt',
    'geneva',
    'interlaken',
    'zurich',
    'davos',
    'crans-montana',
    'flims',
    'bern',
  ]

  const bestSlugs = [
    'luxury-hotels-switzerland',
    'luxury-hotels-geneva',
    'luxury-hotels-zermatt',
    'luxury-hotels-zurich',
    'luxury-hotels-interlaken',
    'luxury-hotels-bern',
    'ski-hotels-switzerland',
    'ski-hotels-zermatt',
    'ski-hotels-davos',
    'ski-hotels-crans-montana',
    'spa-hotels-switzerland',
    'wellness-hotels-flims',
    'romantic-hotels-switzerland',
    'business-city-hotels-switzerland',
    'family-hotels-switzerland',
  ]

  const destinationUrls = destinationSlugs.map(slug => `${base}/destinations/${slug}`)
  const bestUrls = bestSlugs.map(slug => `${base}/best/${slug}`)

  const urls = Array.from(new Set([
    ...staticUrls,
    ...hotelUrls,
    ...destinationUrls,
    ...bestUrls,
  ]))

  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      host: 'swissnethotels.com',
      key,
      keyLocation: `${base}/${key}.txt`,
      urlList: urls,
    }),
  })

  return NextResponse.json({
    submitted: urls.length,
    status: response.status,
  })
}