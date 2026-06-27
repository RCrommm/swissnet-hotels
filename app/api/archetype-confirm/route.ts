import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Confirms (locks) a hotel's archetype + taxonomy so downstream layers may trust it.
// IMPORTANT: this does NOT touch hotels.not_offered (the score-exclusion list). The taxonomy's
// not_offered_experiences is a SUGGESTION recorded on the profile; the authoritative
// score-exclusion list stays exactly what the owner set on hotels.not_offered. Confirming an
// archetype must never silently change which dimensions are scored. Owner overrides accepted.
export async function POST(req: Request) {
  try {
    const { hotelId, password, archetype, primary_experiences, secondary_experiences, not_offered_experiences } = await req.json()
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 })
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!sbUrl || !sbKey) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    const sb = createClient(sbUrl, sbKey)

    const { data: existing } = await sb.from('hotel_profile').select('*').eq('hotel_id', hotelId).maybeSingle()
    if (!existing) return NextResponse.json({ error: 'No proposal to confirm. Run /api/archetype-detect first.' }, { status: 404 })

    const finalArchetype = archetype || existing.archetype
    const finalPrimary = Array.isArray(primary_experiences) ? primary_experiences : (existing.primary_experiences || [])
    const finalSecondary = Array.isArray(secondary_experiences) ? secondary_experiences : (existing.secondary_experiences || [])
    const finalNotOffered = Array.isArray(not_offered_experiences) ? not_offered_experiences : (existing.not_offered_experiences || [])

    await sb.from('hotel_profile').update({
      archetype: finalArchetype,
      primary_experiences: finalPrimary,
      secondary_experiences: finalSecondary,
      not_offered_experiences: finalNotOffered,
      archetype_status: 'confirmed',
      taxonomy_status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    }).eq('hotel_id', hotelId)

    return NextResponse.json({
      hotelId,
      confirmed: { archetype: finalArchetype, primary_experiences: finalPrimary, secondary_experiences: finalSecondary, not_offered_experiences: finalNotOffered },
      note: 'Archetype and taxonomy confirmed. hotels.not_offered (the score-exclusion list) was NOT changed.',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Confirm failed' }, { status: 500 })
  }
}
