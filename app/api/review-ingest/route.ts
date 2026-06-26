import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Review } from '@/lib/review-intelligence'

export const maxDuration = 30

// ── REVIEW INGEST ──
// The write-side of a Review Source. Accepts normalized reviews and stores them
// on hotel_reviews. Today the caller is manual validation data; tomorrow it's the
// Google Business Profile connector writing the SAME shape. The intelligence layer
// downstream never knows which source filled the table.
//
// Body: { hotelId, password, source?, reviews: Review[], replace? }
//   replace=true clears existing rows for this source first (re-sync semantics).

interface Body {
  hotelId?: string
  password?: string
  source?: string
  replace?: boolean
  reviews?: Review[]
}

export async function POST(req: Request) {
  try {
    const { hotelId, password, source, replace, reviews } = (await req.json()) as Body
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 })
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({ error: 'reviews[] required' }, { status: 400 })
    }

    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!sbUrl || !sbKey) return NextResponse.json({ error: 'Server not configured (Supabase).' }, { status: 500 })
    const sb = createClient(sbUrl, sbKey)

    const src = (source || 'manual').toString()

    // Re-sync semantics: a connector re-pulling its reviews replaces its own rows,
    // never another source's. Manual + Google can coexist on one hotel.
    if (replace) {
      await sb.from('hotel_reviews').delete().eq('hotel_id', hotelId).eq('source', src)
    }

    const rows = reviews
      .filter(r => r && typeof r.text === 'string' && r.text.trim())
      .map(r => ({
        hotel_id: hotelId,
        source: (r.source || src).toString(),
        rating: typeof r.rating === 'number' ? r.rating : null,
        review_date: r.date || null,
        language: r.language || null,
        text: r.text.trim(),
      }))

    if (rows.length === 0) return NextResponse.json({ error: 'No valid reviews to store.' }, { status: 400 })

    const { error } = await sb.from('hotel_reviews').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { count } = await sb.from('hotel_reviews').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId)

    return NextResponse.json({ stored: rows.length, total_for_hotel: count ?? null, source: src })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Review ingest failed' }, { status: 500 })
  }
}