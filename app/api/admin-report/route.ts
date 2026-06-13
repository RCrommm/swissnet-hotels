import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Internal use only. Matches your existing admin password; change if you like.
const ADMIN_PASSWORD = process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are SwissNet's senior AI-visibility strategist. You produce a sharp, internal monthly intelligence report on ONE partner hotel, for the SwissNet founder to read before a monthly client call.

You are given real data: the hotel's profile completeness, its AI-visibility scores by category (and rank vs competitors), and the latest audit of the hotel's OWN website.

Your job: turn this data into a specific, tailored action plan. Be concrete and reference the actual numbers. No generic filler, no vague "improve your content". Every recommendation must tie to a specific weakness in the data and say exactly what to do. Prefer the highest-impact moves. Most hotels have 3-6 real priorities.

Return ONLY valid JSON, no markdown, in this exact shape:
{
  "headline": "one punchy sentence summarising where this hotel stands",
  "summary": "2-3 sentences: overall AI-visibility health, biggest opportunity",
  "strengths": ["specific strength tied to data", "..."],
  "gaps": ["specific gap tied to data", "..."],
  "recommendations": [
    { "title": "short action title", "priority": "High|Medium|Low", "category": "Visibility|Website|Content|Profile", "rationale": "why — cite the actual data point", "action": "exactly what to do, specific and doable" }
  ],
  "callScript": "3-4 sentences the founder can say on the call: lead with a win, name the focus, end with the one action SwissNet will take this month"
}`

export async function POST(req: Request) {
  try {
    const { hotelId, password } = await req.json()
    if (password !== ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hotelId) return NextResponse.json({ error: 'Missing hotelId' }, { status: 400 })

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: hotel } = await sb.from('hotels').select('*').eq('id', hotelId).single()
    if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })

    const { data: auditRows } = await sb.from('website_audits').select('*').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1)
    const audit = auditRows?.[0] || null

    const [{ data: rooms }, { data: restaurants }, { data: spa }, { data: experiences }, { data: content }, { data: faqSug }] = await Promise.all([
      sb.from('room_types').select('name, size_sqm, base_rate_chf').eq('hotel_id', hotelId),
      sb.from('hotel_restaurants').select('name, cuisine_type, michelin_stars').eq('hotel_id', hotelId).eq('is_available', true),
      sb.from('hotel_spa').select('name, size_sqm, treatments').eq('hotel_id', hotelId).eq('is_available', true),
      sb.from('hotel_experiences').select('name').eq('hotel_id', hotelId).eq('is_available', true),
      sb.from('hotel_content').select('faqs').eq('hotel_id', hotelId).single(),
      sb.from('hotel_faq_suggestions').select('question').eq('hotel_id', hotelId),
    ])

    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const { data: myVis } = await sb.from('competitor_visibility')
      .select('category, visibility_score, platform, checked_at')
      .eq('competitor_name', hotel.name)
      .gte('checked_at', since)

    const byCat: Record<string, number[]> = {}
    for (const r of myVis || []) {
      const cat = r.category || 'general'
      const s = r.platform === 'chatgpt' ? Math.min(100, r.visibility_score + 8) : r.visibility_score
      ;(byCat[cat] ||= []).push(s)
    }
    const catScores: Record<string, number> = {}
    for (const [cat, arr] of Object.entries(byCat)) catScores[cat] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)

    const cats = Object.keys(byCat).filter(c => c !== 'general')
    const catRanks: Record<string, any> = {}
    for (const cat of cats) {
      const { data: rows } = await sb.from('competitor_visibility')
        .select('competitor_name, visibility_score, platform, checked_at')
        .eq('category', cat).gte('checked_at', since)
      const byHotel: Record<string, number[]> = {}
      for (const r of rows || []) {
        const s = r.platform === 'chatgpt' ? Math.min(100, r.visibility_score + 8) : r.visibility_score
        ;(byHotel[r.competitor_name] ||= []).push(s)
      }
      const ranked = Object.entries(byHotel)
        .map(([n, arr]) => ({ name: n, score: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) }))
        .sort((a, b) => b.score - a.score)
      const idx = ranked.findIndex(h => h.name === hotel.name)
      if (idx !== -1) catRanks[cat] = { rank: idx + 1, total: ranked.length, leader: ranked[0]?.name, leaderScore: ranked[0]?.score, ahead: ranked[idx - 1]?.name }
    }

    const faqCount = (content?.faqs?.length || 0) + (faqSug?.length || 0)
    const profileGaps: string[] = []
    const check = (label: string, val: any) => { if (!val) profileGaps.push(label) }
    check('About Us (AI schema)', hotel.about_us)
    check('Languages spoken', hotel.languages)
    check('Check-in/out times', hotel.check_in_time)
    check('Cancellation policy', hotel.cancellation_policy)
    check('Direct booking benefits', hotel.booking_benefits)
    check('Accessibility', hotel.accessibility)
    check('Seasonal notes', hotel.seasonal_notes)
    check('Parking', hotel.parking)

    const dataBlock = {
      hotel: { name: hotel.name, region: hotel.region, location: hotel.location, category: hotel.category, stars: hotel.star_classification, nightly_rate_chf: hotel.nightly_rate_chf, is_partner: hotel.is_partner },
      profile: {
        descriptionWords: hotel.description ? String(hotel.description).split(' ').length : 0,
        aboutUsWords: hotel.about_us ? String(hotel.about_us).split(' ').length : 0,
        rooms: rooms?.length || 0,
        restaurants: restaurants?.length || 0,
        michelinRestaurants: (restaurants || []).filter((r: any) => r.michelin_stars > 0).length,
        spaVenues: spa?.length || 0,
        experiences: experiences?.length || 0,
        faqs: faqCount,
        missingFields: profileGaps,
      },
      aiVisibility: { categoryScores: catScores, categoryRanks: catRanks },
      websiteAudit: audit ? {
        score: audit.score,
        summary: audit.summary,
        failedFindings: (audit.findings || []).filter((f: any) => !f.ok).map((f: any) => ({ label: f.label, priority: f.priority, detail: f.detail })),
      } : null,
    }

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Produce the internal report for this hotel.\n\nDATA:\n${JSON.stringify(dataBlock, null, 2)}` },
        ],
      }),
    })
    const aiData = await aiRes.json()
    let report: any = null
    try { report = JSON.parse(aiData.choices[0].message.content) } catch { report = { error: 'Could not parse AI output', raw: aiData?.choices?.[0]?.message?.content || '' } }

    return NextResponse.json({ hotel: { name: hotel.name, region: hotel.region }, data: dataBlock, report })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to build report' }, { status: 500 })
  }
}