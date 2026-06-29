import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

interface OnboardBody {
  name: string
  slug?: string
  location?: string
  region: string
  category?: string
  rating?: number | string
  nightly_rate_chf?: number | string
  description?: string
  direct_booking_url?: string
  contact_email?: string
  tier?: string
  is_partner?: boolean
  is_active?: boolean
  show_schema?: boolean
  categories?: string[]
  newRegion?: boolean
  regionGeneral?: boolean
  regionCategories?: string[]
  regionQueries?: string[]
  competitors?: string[]
}

type Step = { step: string; ok: boolean; detail: string }

export async function POST(request: NextRequest) {
  let body: OnboardBody
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }) }

  const steps: Step[] = []
  const fail = (step: string, detail: string) =>
    NextResponse.json({ ok: false, steps: [...steps, { step, ok: false, detail }] }, { status: 500 })

  if (!body.name?.trim()) return NextResponse.json({ error: 'Hotel name is required' }, { status: 400 })
  if (!body.region?.trim()) return NextResponse.json({ error: 'Region is required' }, { status: 400 })
  const region = body.region.trim()

  if (body.newRegion) {
    const { error } = await supabase.from('regions').upsert({
      region,
      general: body.regionGeneral !== false,
      categories: body.regionCategories || [],
      is_active: true,
    }, { onConflict: 'region' })
    if (error) return fail('region', error.message)
    steps.push({ step: 'region', ok: true, detail: 'Region "' + region + '" created/updated' })

    const queries = (body.regionQueries || []).map(q => q.trim()).filter(Boolean)
    if (queries.length) {
      const rows = queries.map(q => ({ region, query: q, is_active: true }))
      const { error: qErr } = await supabase.from('region_queries').insert(rows)
      if (qErr) return fail('region_queries', qErr.message)
      steps.push({ step: 'region_queries', ok: true, detail: rows.length + ' general queries added' })
    } else {
      steps.push({ step: 'region_queries', ok: true, detail: 'No new queries provided' })
    }

    const comps = (body.competitors || []).map(c => c.trim()).filter(Boolean)
    if (comps.length) {
      const rows = comps.map(name => ({ name, region, is_active: true }))
      const { error: cErr } = await supabase.from('competitor_hotels').insert(rows)
      if (cErr) return fail('competitor_hotels', cErr.message)
      steps.push({ step: 'competitor_hotels', ok: true, detail: rows.length + ' competitors added' })
    } else {
      steps.push({ step: 'competitor_hotels', ok: true, detail: 'No competitors provided' })
    }
  } else {
    steps.push({ step: 'region', ok: true, detail: 'Using existing region "' + region + '" (queries + competitors inherited)' })
  }

  const hotelRow: any = {
    name: body.name.trim(),
    region,
    is_partner: body.is_partner !== false,
    is_active: body.is_active !== false,
    tier: body.tier || 'monitor',
    categories: body.categories || [],
    show_schema: body.show_schema || false,
  }
  if (body.slug) hotelRow.slug = body.slug.trim()
  if (body.location) hotelRow.location = body.location.trim()
  if (body.category) hotelRow.category = body.category
  if (body.rating !== undefined && body.rating !== '') hotelRow.rating = parseFloat(String(body.rating))
  if (body.nightly_rate_chf !== undefined && body.nightly_rate_chf !== '') hotelRow.nightly_rate_chf = parseInt(String(body.nightly_rate_chf))
  if (body.description) hotelRow.description = body.description
  if (body.direct_booking_url) hotelRow.direct_booking_url = body.direct_booking_url.trim()
  if (body.contact_email) hotelRow.contact_email = body.contact_email.trim()

  const { data: hotel, error: hErr } = await supabase
    .from('hotels').insert([hotelRow]).select().single()
  if (hErr) return fail('hotels', hErr.message)
  steps.push({ step: 'hotels', ok: true, detail: 'Hotel "' + hotel.name + '" created (tier: ' + hotel.tier + ')' })

  return NextResponse.json({ ok: true, hotelId: hotel.id, steps }, { status: 201 })
}
