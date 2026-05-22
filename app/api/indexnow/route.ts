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

  const destinationSlugs = ['zermatt','geneva','st-moritz','interlaken','zurich','gstaad','lucerne','verbier','davos','crans-montana','flims','bern','basel','lugano','ascona','andermatt','montreux']
const bestSlugs = ['luxury-hotels-zermatt','ski-hotels-zermatt','luxury-hotels-geneva','luxury-hotels-zurich','luxury-hotels-interlaken','luxury-hotels-bern','ski-hotels-switzerland','lake-hotels-switzerland','romantic-hotels-switzerland','luxury-hotels-switzerland','business-hotels-switzerland','wellness-hotels-flims','ski-hotels-crans-montana','ski-hotels-davos','luxury-hotels-davos','luxury-hotels-gstaad','luxury-hotels-lugano','luxury-hotels-basel','luxury-hotels-lucerne','luxury-hotels-verbier','ski-hotels-verbier','family-hotels-switzerland','spa-hotels-switzerland','luxury-hotels-ascona','luxury-hotels-andermatt','luxury-hotels-crans-montana','luxury-hotels-flims','luxury-hotels-montreux','business-city-hotels-switzerland']
const destinationUrls = destinationSlugs.map(s => `${base}/destinations/${s}`)
const bestUrls = bestSlugs.map(s => `${base}/best/${s}`)
const partnerCategoryUrls = (hotels || []).filter((h: any) => h.is_partner).flatMap((h: any) => {
  const slug = h.slug || h.id
  return ['honeymoon','wellness','business','family'].map(c => `${base}/hotels/${slug}/${c}`)
})
const urls = [...staticUrls, ...hotelUrls, ...destinationUrls, ...bestUrls, ...partnerCategoryUrls]

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