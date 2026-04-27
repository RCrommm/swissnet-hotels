import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { hotel_id, url } = await request.json()

  if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

  try {
    // Fetch the hotel website HTML
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SwissNetBot/1.0)',
      },
      signal: AbortSignal.timeout(8000),
    })

    const html = await res.text()

    // Extract og:image
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)

    if (!ogMatch) {
      // Fallback: try twitter:image
      const twitterMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i)

      if (!twitterMatch) {
        return NextResponse.json({ error: 'No image found' }, { status: 404 })
      }

      const imageUrl = twitterMatch[1].startsWith('http')
        ? twitterMatch[1]
        : new URL(twitterMatch[1], url).href

      if (hotel_id) {
        await supabase.from('hotels').update({ images: [imageUrl] }).eq('id', hotel_id)
      }

      return NextResponse.json({ success: true, image_url: imageUrl })
    }

    const imageUrl = ogMatch[1].startsWith('http')
      ? ogMatch[1]
      : new URL(ogMatch[1], url).href

    if (hotel_id) {
      await supabase.from('hotels').update({ images: [imageUrl] }).eq('id', hotel_id)
    }

    return NextResponse.json({ success: true, image_url: imageUrl })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}