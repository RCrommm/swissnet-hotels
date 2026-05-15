import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const key = process.env.INDEXNOW_KEY
  if (!key) return NextResponse.json({ error: 'No key' }, { status: 500 })

  const { data: hotels } = await supabase
    .from('hotels')
    .select('slug, id')
    .eq('is_active', true)

  const base = 'https://swissnethotels.com'
  const staticUrls = [
    base,
    `${base}/hotels`,
    `${base}/pricing`,
  ]

  const hotelUrls = (hotels || []).flatMap((h: any) => {
    const slug = h.slug || h.id
    return [
      `${base}/hotels/${slug}`,
      `${base}/hotels/${slug}/rooms`,
      `${base}/hotels/${slug}/dining`,
      `${base}/hotels/${slug}/spa`,
      `${base}/hotels/${slug}/experiences`,
      `${base}/hotels/${slug}/events`,
    ]
  })

  const urls = [...staticUrls, ...hotelUrls]

  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: 'swissnethotels.com',
      key,
      keyLocation: `${base}/${key}.txt`,
      urlList: urls,
    }),
  })

  return NextResponse.json({ submitted: urls.length, status: response.status })
}