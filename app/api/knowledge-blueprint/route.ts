import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildBlueprint } from '@/lib/knowledge-blueprint'
import { buildAllDrafts } from '@/lib/knowledge-blueprint-draft'

export const maxDuration = 120

// ─── AI KNOWLEDGE BLUEPRINT ───
// Loads the hotel's real facts + latest audit (same sources the consultant uses),
// assembles the per-section blueprint deterministically, then draft-writes each
// section STRICTLY from its own facts. Every draft is marked for human review.
export async function POST(req: Request) {
  try {
    const { hotelId, password, withDrafts } = await req.json()
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 })

    const openaiKey = process.env.OPENAI_API_KEY
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!sbUrl || !sbKey) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    const sb = createClient(sbUrl, sbKey)

    // hotel name + not_offered
    let hotelName = '', city = '', notOffered: string[] = [], blueprintFaqs: string[] = []
    try {
      const { data: h } = await sb.from('hotels').select('name, location, region, not_offered, blueprint_faqs').eq('id', hotelId).single()
      if (h) { hotelName = h.name || ''; city = h.location || h.region || ''; if (Array.isArray(h.not_offered)) notOffered = h.not_offered; if (Array.isArray(h.blueprint_faqs)) blueprintFaqs = h.blueprint_faqs.filter((x: any) => typeof x === 'string') }
    } catch {}

    // latest Brain + its facts
    const { data: brain } = await sb.from('hotel_brains').select('id, hotel_name, city').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1).single()
    if (!brain) return NextResponse.json({ error: 'No Hotel Brain found. Run /api/hotel-brain first.' }, { status: 404 })
    if (!hotelName) hotelName = brain.hotel_name || ''
    if (!city) city = brain.city || ''
    const { data: facts } = await sb.from('hotel_facts').select('category, fact_key, fact_value, evidence_quote, page_url, confidence').eq('brain_id', brain.id)

    // latest audit result
    let auditResult: any = null
    try {
      const { data: auditRow } = await sb.from('hotel_audits').select('result').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1).single()
      if (auditRow?.result) auditResult = auditRow.result
    } catch {}

    const blueprint = buildBlueprint((facts || []) as any, auditResult, { hotelName, city, notOffered, blueprintFaqs })

    // draft prose (optional — only when asked, since it costs GPT calls)
    let drafts: any = null
    if (withDrafts && openaiKey) {
      drafts = await buildAllDrafts(blueprint.sections, openaiKey, { hotelName, city })
    }

    return NextResponse.json({ blueprint, drafts })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Blueprint failed' }, { status: 500 })
  }
}
