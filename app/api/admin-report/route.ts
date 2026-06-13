import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_PASSWORD = process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo'
export const maxDuration = 60

const SYSTEM_PROMPT = `You are SwissNet's senior AI-visibility strategist. You write a detailed internal monthly intelligence report on ONE partner hotel, for the SwissNet founder to read before a monthly client call.

You receive real data covering two fronts:
1. THE HOTEL ON SWISSNET — their AI visibility this month vs last month (overall and per platform), the exact search queries they appeared in vs missed, and their score and rank in each category vs competitors.
2. THE HOTEL'S OWN OFFICIAL WEBSITE — the latest audit of their real website, with its score and the specific failed checks.

Your report must give detailed, specific recommendations to improve BOTH fronts:
- How to improve their SwissNet AI visibility (win missed queries, climb weak categories, fill profile gaps).
- How to improve their own official website (from the audit findings).

Be concrete. Cite the actual numbers, the actual missed queries, the actual category ranks, the actual audit findings. No generic filler. Every recommendation ties to a specific data point and says exactly what to do.

Return ONLY valid JSON, no markdown, in this exact shape:
{
  "headline": "one punchy sentence on where this hotel stands this month",
  "summary": "3-4 sentences: visibility trend this month, biggest win, biggest opportunity across both their SwissNet presence and their own website",
  "visibilityRecap": "2-3 sentences specifically on the month's AI visibility movement and what drove it",
  "missedQueries": ["the exact missed query", "..."],
  "wonQueries": ["the exact won query", "..."],
  "swissnetRecommendations": [
    { "title": "short action", "priority": "High|Medium|Low", "rationale": "why — cite the data", "action": "exactly what to do" }
  ],
  "websiteRecommendations": [
    { "title": "short action", "priority": "High|Medium|Low", "rationale": "why — cite the audit finding", "action": "exactly what to do on their own site" }
  ],
  "callScript": "4-5 sentences the founder says on the call: open with a real win from the data, name the visibility focus, name the website focus, end with the one thing SwissNet will do this month"
}`

function adjust(platform: string, score: number) {
  return platform === 'chatgpt' ? Math.min(100, score + 8) : score
}

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
    const region = hotel.region || 'Geneva'

    // ── Website audit (their own site) ──
    const { data: auditRows } = await sb.from('website_audits').select('*').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1)
    const audit = auditRows?.[0] || null

    // ── Profile completeness ──
    const [{ data: rooms }, { data: restaurants }, { data: spa }, { data: experiences }, { data: content }, { data: faqSug }] = await Promise.all([
      sb.from('room_types').select('name, size_sqm, base_rate_chf').eq('hotel_id', hotelId),
      sb.from('hotel_restaurants').select('name, cuisine_type, michelin_stars').eq('hotel_id', hotelId).eq('is_available', true),
      sb.from('hotel_spa').select('name, size_sqm').eq('hotel_id', hotelId).eq('is_available', true),
      sb.from('hotel_experiences').select('name').eq('hotel_id', hotelId).eq('is_available', true),
      sb.from('hotel_content').select('faqs').eq('hotel_id', hotelId).single(),
      sb.from('hotel_faq_suggestions').select('question').eq('hotel_id', hotelId),
    ])
    const faqCount = (content?.faqs?.length || 0) + (faqSug?.length || 0)
    const missingFields: string[] = []
    const check = (label: string, val: any) => { if (!val) missingFields.push(label) }
    check('About Us (AI schema)', hotel.about_us)
    check('Languages spoken', hotel.languages)
    check('Check-in/out times', hotel.check_in_time)
    check('Cancellation policy', hotel.cancellation_policy)
    check('Direct booking benefits', hotel.booking_benefits)
    check('Accessibility', hotel.accessibility)
    check('Seasonal notes', hotel.seasonal_notes)
    check('Parking', hotel.parking)

    // ── Google AI per-query (keywords won/missed), latest per query ──
    const { data: googleRows } = await sb.from('ai_visibility_scores')
      .select('query, appeared, checked_at')
      .eq('hotel_id', hotelId).eq('platform', 'google_ai')
      .order('checked_at', { ascending: false })
    const latestPerQuery = [...new Map((googleRows || []).map((r: any) => [r.query, r])).values()]
    const wonQueries = latestPerQuery.filter((r: any) => r.appeared).map((r: any) => r.query)
    const missedQueries = latestPerQuery.filter((r: any) => !r.appeared).map((r: any) => r.query)

    // ── Monthly visibility trend (this month vs last) from competitor_visibility ──
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: comp } = await sb.from('competitor_visibility')
      .select('competitor_name, category, platform, visibility_score, checked_at, run_date')
      .eq('region', region).gte('run_date', since).limit(5000)

    const now = new Date()
    const pad = (m: number) => String(m + 1).padStart(2, '0')
    const curStart = `${now.getFullYear()}-${pad(now.getMonth())}-01`
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastStart = `${lm.getFullYear()}-${pad(lm.getMonth())}-01`
    const lastEnd = curStart
    const inMonth = (d: string, s: string, e: string) => d >= s && d < e

    const mineOverview = (comp || []).filter((r: any) => r.competitor_name === hotel.name && r.category === null)
    const monthAvg = (rows: any[]) => {
      const byPlat: Record<string, number[]> = {}
      for (const r of rows) (byPlat[r.platform] ||= []).push(adjust(r.platform, r.visibility_score))
      const plats = Object.entries(byPlat).map(([p, arr]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length))
      // include google ratio for the month
      const gRows = (googleRows || []).filter((r: any) => true)
      return plats.length ? Math.round(plats.reduce((a, b) => a + b, 0) / plats.length) : null
    }
    const platMonthAvg = (rows: any[], plat: string) => {
      const arr = rows.filter((r: any) => r.platform === plat).map((r: any) => adjust(plat, r.visibility_score))
      return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null
    }
    const googleMonthAvg = (s: string, e: string) => {
      const rows = (googleRows || []).filter((r: any) => { const d = r.checked_at?.split('T')[0]; return inMonth(d, s, e) })
      const byDate: Record<string, any[]> = {}
      for (const r of rows) (byDate[r.checked_at.split('T')[0]] ||= []).push(r)
      const daily = Object.values(byDate).map((day: any[]) => Math.round((day.filter(r => r.appeared).length / day.length) * 100))
      return daily.length ? Math.round(daily.reduce((a, b) => a + b, 0) / daily.length) : null
    }

    const curRows = mineOverview.filter((r: any) => inMonth(r.run_date || r.checked_at?.split('T')[0], curStart, '9999'))
    const lastRows = mineOverview.filter((r: any) => inMonth(r.run_date || r.checked_at?.split('T')[0], lastStart, lastEnd))

    const monthlyVisibility = {
      thisMonth: {
        chatgpt: platMonthAvg(curRows, 'chatgpt'),
        perplexity: platMonthAvg(curRows, 'perplexity'),
        googleAi: googleMonthAvg(curStart, '9999-12-31'),
      },
      lastMonth: {
        chatgpt: platMonthAvg(lastRows, 'chatgpt'),
        perplexity: platMonthAvg(lastRows, 'perplexity'),
        googleAi: googleMonthAvg(lastStart, lastEnd),
      },
    }
    const overallOf = (m: any) => { const v = [m.chatgpt, m.perplexity, m.googleAi].filter((x: any) => x !== null); return v.length ? Math.round(v.reduce((a: number, b: number) => a + b, 0) / v.length) : null }
    ;(monthlyVisibility.thisMonth as any).overall = overallOf(monthlyVisibility.thisMonth)
    ;(monthlyVisibility.lastMonth as any).overall = overallOf(monthlyVisibility.lastMonth)

    // ── Category scores + ranks (latest per platform per hotel) ──
    const latestScore = (rows: any[]) => {
      const byPlat: Record<string, any> = {}
      for (const r of rows) {
        const key = r.platform
        const stamp = r.run_date || r.checked_at || ''
        if (!byPlat[key] || stamp > (byPlat[key].run_date || byPlat[key].checked_at || '')) byPlat[key] = r
      }
      const vals = Object.values(byPlat).map((r: any) => adjust(r.platform, r.visibility_score))
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
    }
    const cats = ['spa', 'ski', 'dining', 'romantic', 'lake', 'business', 'family']
    const categoryScores: Record<string, number> = {}
    const categoryRanks: Record<string, any> = {}
    for (const cat of cats) {
      const catRows = (comp || []).filter((r: any) => r.category === cat)
      if (!catRows.length) continue
      const names = [...new Set(catRows.map((r: any) => r.competitor_name))]
      const ranked = names.map((n: any) => ({ name: n, score: latestScore(catRows.filter((r: any) => r.competitor_name === n)) }))
        .filter(h => h.score !== null).sort((a: any, b: any) => b.score - a.score)
      const idx = ranked.findIndex(h => h.name === hotel.name)
      if (idx !== -1) {
        categoryScores[cat] = ranked[idx].score as number
        categoryRanks[cat] = { rank: idx + 1, total: ranked.length, leader: ranked[0]?.name, leaderScore: ranked[0]?.score, ahead: ranked[idx - 1]?.name }
      }
    }

    const dataBlock = {
      hotel: { name: hotel.name, region, location: hotel.location, category: hotel.category, stars: hotel.star_classification, nightly_rate_chf: hotel.nightly_rate_chf },
      monthlyVisibility,
      keywords: { won: wonQueries, missed: missedQueries },
      categories: { scores: categoryScores, ranks: categoryRanks },
      profile: {
        descriptionWords: hotel.description ? String(hotel.description).split(' ').length : 0,
        rooms: rooms?.length || 0, restaurants: restaurants?.length || 0,
        michelinRestaurants: (restaurants || []).filter((r: any) => r.michelin_stars > 0).length,
        spaVenues: spa?.length || 0, experiences: experiences?.length || 0, faqs: faqCount,
        missingFields,
      },
      websiteAudit: audit ? {
        score: audit.score, summary: audit.summary,
        failedFindings: (audit.findings || []).filter((f: any) => !f.ok).map((f: any) => ({ label: f.label, priority: f.priority, detail: f.detail })),
      } : null,
    }

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0.4, response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Produce the internal monthly report for this hotel.\n\nDATA:\n${JSON.stringify(dataBlock, null, 2)}` },
        ],
      }),
    })
    const aiData = await aiRes.json()
    let report: any = null
    try { report = JSON.parse(aiData.choices[0].message.content) } catch { report = { error: 'Could not parse AI output', raw: aiData?.choices?.[0]?.message?.content || '' } }

    return NextResponse.json({ hotel: { name: hotel.name, region }, data: dataBlock, report })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to build report' }, { status: 500 })
  }
}
