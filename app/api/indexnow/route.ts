import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const key = process.env.INDEXNOW_KEY
  if (!key) return NextResponse.json({ error: 'No key' }, { status: 500 })

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
    const base_url = `${base}/hotels/${slug}`
    if (h.is_partner) {
      return [
        base_url,
        `${base_url}/rooms`,
        `${base_url}/dining`,
        `${base_url}/spa`,
        `${base_url}/experiences`,
        `${base_url}/events`,
      ]
    }
    return [base_url]
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