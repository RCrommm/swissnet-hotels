import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { computeLinkSignals } from '@/lib/link-intelligence'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { hotelId, password } = await req.json()
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!sbUrl || !sbKey) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    const sb = createClient(sbUrl, sbKey)

    // latest brain for this hotel
    const { data: brain } = await sb.from('hotel_brains').select('id, website_url, created_at').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (!brain) return NextResponse.json({ error: 'No brain found' }, { status: 404 })

    // real captured edges
    const { data: edges } = await sb.from('page_links').select('from_url, to_url').eq('brain_id', brain.id)

    // current KG clusters from latest consultant advisory
    const { data: adv } = await sb.from('hotel_consultant').select('advisory').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    const clusters = adv?.advisory?.knowledge_graph?.clusters || []

    const homepage = brain.website_url
    const signals = computeLinkSignals(homepage, edges || [], clusters)

    return NextResponse.json({
      brain_id: brain.id, created_at: brain.created_at, homepage,
      edgeCount: (edges || []).length, clusterCount: clusters.length,
      signals,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'debug-links failed' }, { status: 500 })
  }
}
