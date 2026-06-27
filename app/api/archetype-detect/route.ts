import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildKnowledgeGraph } from '@/lib/knowledge-graph'
import { buildArchetypeProposal } from '@/lib/archetype'

// Runs the deterministic archetype/taxonomy detector against a hotel's stored Brain facts +
// latest audit, and UPSERTS the proposal into hotel_profile as status 'proposed'.
// PROPOSE-ONLY: nothing downstream consumes this until the owner confirms. No GPT.
export async function POST(req: Request) {
  try {
    const { hotelId, password } = await req.json()
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 })
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!sbUrl || !sbKey) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    const sb = createClient(sbUrl, sbKey)

    const { data: brain } = await sb.from('hotel_brains').select('id').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1).single()
    if (!brain) return NextResponse.json({ error: 'No Hotel Brain found.' }, { status: 404 })
    const { data: facts } = await sb.from('hotel_facts').select('category, fact_key, fact_value, evidence_quote, page_url, confidence').eq('brain_id', brain.id)

    let latestAuditResult: any = null
    try {
      const { data: auditRow } = await sb.from('hotel_audits').select('result').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1).single()
      if (auditRow?.result) latestAuditResult = auditRow.result
    } catch {}

    let notOffered: string[] = []
    try {
      const { data: h } = await sb.from('hotels').select('not_offered').eq('id', hotelId).single()
      if (Array.isArray(h?.not_offered)) notOffered = h.not_offered
    } catch {}

    const knowledgeGraph = buildKnowledgeGraph(facts || [], latestAuditResult)
    const proposal = buildArchetypeProposal(knowledgeGraph, { notOffered })

    // Upsert as PROPOSED. Never overwrites a CONFIRMED archetype/taxonomy silently.
    const { data: existing } = await sb.from('hotel_profile').select('archetype_status, taxonomy_status').eq('hotel_id', hotelId).maybeSingle()
    const archetypeLocked = existing?.archetype_status === 'confirmed'
    const taxonomyLocked = existing?.taxonomy_status === 'confirmed'

    const row: any = {
      hotel_id: hotelId,
      raw_detection: proposal,
      proposed_at: new Date().toISOString(),
    }
    if (!archetypeLocked) {
      row.archetype = proposal.archetype
      row.archetype_confidence = proposal.archetype_confidence
      row.archetype_status = 'proposed'
    }
    if (!taxonomyLocked) {
      row.primary_experiences = proposal.primary_experiences
      row.secondary_experiences = proposal.secondary_experiences
      row.not_offered_experiences = proposal.not_offered_experiences
      row.taxonomy_status = 'proposed'
    }

    await sb.from('hotel_profile').upsert(row, { onConflict: 'hotel_id' })

    return NextResponse.json({
      hotelId,
      proposal,
      locked: { archetype: archetypeLocked, taxonomy: taxonomyLocked },
      note: 'Proposed and stored. Nothing downstream uses this until you confirm.',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Detection failed' }, { status: 500 })
  }
}
