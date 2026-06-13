import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_PASSWORD = process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo'
export const maxDuration = 60

const SYSTEM_PROMPT = `You are SwissNet's senior AI-visibility strategist writing a DETAILED internal monthly working report on ONE partner hotel, for the founder to act on and discuss with the hotel.

This is an internal working document. It must be SPECIFIC and ACTIONABLE, never vague. Bad: "improve your romantic content." Good: "Romantic is your weakest category at 42% (#6 of 9). The rooms page has only 5 FAQs and none target romantic stays. Add these 4 FAQs to the rooms page: [actual question + actual answer]."

Rules:
- Recommendations MUST target the hotel's ACTUAL weak spots given in the data: the weakest categories and the EXACT missed queries listed. Never recommend improving a category that is already strong. If romantic is weak and dining is strong, you work on romantic.
- DO NOT give advice like "add FAQs". WRITE the actual FAQs — real question and a real, specific, factual answer the hotel can paste in. Base answers on the hotel facts provided; if a fact is unknown, write the answer with a clear [PLACEHOLDER] for the hotel to fill (e.g. "[confirm exact distance]").
- Tie content to the exact missed queries. If they miss "romantic hotel Geneva lake view", produce an FAQ whose question and answer use that language.
- For the official website, use the audit's failed findings: name the specific page and the specific fix.
- Structured, dense, plain. Substance over polish.

Return ONLY valid JSON, no markdown, in this exact shape:
{
  "headline": "one sentence on where this hotel stands this month",
  "visibilityRecap": "3-4 sentences: did overall/per-platform visibility go up or down vs last month, by how much, and the likely reason (cite the numbers).",
  "weakestAreas": ["the specific weak category with its score and rank", "..."],
  "swissnetActions": [
    {
      "title": "specific action e.g. 'Add 4 romantic FAQs to the rooms page'",
      "priority": "High|Medium|Low",
      "targetsQuery": "the exact missed query this addresses, or category",
      "rationale": "why — cite the actual score/rank/gap",
      "page": "which page: rooms | dining | spa | experiences | overview | hotel-info",
      "faqsToAdd": [ { "question": "exact question", "answer": "exact answer to paste" } ],
      "otherInstruction": "any non-FAQ instruction, else empty string"
    }
  ],
  "websiteActions": [
    { "title": "specific fix", "priority": "High|Medium|Low", "page": "which page of their own site", "rationale": "cite the audit finding", "action": "exactly what to change" }
  ],
  "callScript": "4-5 sentences: open with the real visibility movement, name the one category focus, name the one website fix, end with what SwissNet will do this month"
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

    const { data: auditRows } = await sb.from('website_audits').select('*').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1)
    const audit = auditRows?.[0] || null

    const [{ data: rooms }, { data: restaurants }, { data: spa }, { data: experiences }, { data: content }, { data: faqSug }] = await Promise.all([
      sb.from('room_types').select('name, size_sqm, base_rate_chf, bed_type').eq('hotel_id', hotelId),
      sb.from('hotel_restaurants').select('name, cuisine_type, michelin_stars, description').eq('hotel_id', hotelId).eq('is_available', true),
      sb.from('hotel_spa').select('name, size_sqm, treatments').eq('hotel_id', hotelId).eq('is_available', true),
      sb.from('hotel_experiences').select('name').eq('hotel_id', hotelId).eq('is_available', true),
      sb.from('hotel_content').select('faqs').eq('hotel_id', hotelId).single(),
      sb.from('hotel_faq_suggestions').select('page_type, question').eq('hotel_id', hotelId),
    ])

    // FAQ count per page
    const faqByPage: Record<string, number> = { overview: content?.faqs?.length || 0, rooms: 0, dining: 0, spa: 0, experiences: 0, events: 0 }
    for (const f of faqSug || []) { if (faqByPage[f.page_type] !== undefined) faqByPage[f.page_type]++ }

    const missingFields: string[] = []
    const check = (label: string, val: any) => { if (!val) missingFields.push(label) }
    check('About Us (AI schema)', hotel.about_us)
    check('Languages spoken', hotel.languages)
    check('Cancellation policy', hotel.cancellation_policy)
    check('Direct booking benefits', hotel.booking_benefits)
    check('Accessibility', hotel.accessibility)
    check('Seasonal notes', hotel.seasonal_notes)

    // Google AI per-query
    const { data: googleRows } = await sb.from('ai_visibility_scores')
      .select('query, appeared, checked_at')
      .eq('hotel_id', hotelId).eq('platform', 'google_ai')
      .order('checked_at', { ascending: false })
    const latestPerQuery = [...new Map((googleRows || []).map((r: any) => [r.query, r])).values()]
    const wonQueries = latestPerQuery.filter((r: any) => r.appeared).map((r: any) => r.query)
    const missedQueries = latestPerQuery.filter((r: any) => !r.appeared).map((r: any) => r.query)

    // Monthly visibility from competitor_visibility
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: comp } = await sb.from('competitor_visibility')
      .select('competitor_name, category, platform, visibility_score, checked_at, run_date')
      .eq('region', region).gte('run_date', since).limit(5000)

    const now = new Date()
    const pad = (m: number) => String(m + 1).padStart(2, '0')
    const curStart = `${now.getFullYear()}-${pad(now.getMonth())}-01`
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastStart = `${lm.getFullYear()}-${pad(lm.getMonth())}-01`
    const inMonth = (d: string, s: string, e: string) => d >= s && d < e

    const mineOverview = (comp || []).filter((r: any) => r.competitor_name === hotel.name && r.category === null)
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
    const lastRows = mineOverview.filter((r: any) => inMonth(r.run_date || r.checked_at?.split('T')[0], lastStart, curStart))
    const overallOf = (m: any) => { const v = [m.chatgpt, m.perplexity, m.googleAi].filter((x: any) => x !== null); return v.length ? Math.round(v.reduce((a: number, b: number) => a + b, 0) / v.length) : null }
    const monthlyVisibility: any = {
      thisMonth: { chatgpt: platMonthAvg(curRows, 'chatgpt'), perplexity: platMonthAvg(curRows, 'perplexity'), googleAi: googleMonthAvg(curStart, '9999-12-31') },
      lastMonth: { chatgpt: platMonthAvg(lastRows, 'chatgpt'), perplexity: platMonthAvg(lastRows, 'perplexity'), googleAi: googleMonthAvg(lastStart, curStart) },
    }
    monthlyVisibility.thisMonth.overall = overallOf(monthlyVisibility.thisMonth)
    monthlyVisibility.lastMonth.overall = overallOf(monthlyVisibility.lastMonth)

    // Categories + ranks
    const latestScore = (rows: any[]) => {
      const byPlat: Record<string, any> = {}
      for (const r of rows) {
        const stamp = r.run_date || r.checked_at || ''
        if (!byPlat[r.platform] || stamp > (byPlat[r.platform].run_date || byPlat[r.platform].checked_at || '')) byPlat[r.platform] = r
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
        .filter(h => h.score !== null).sort((a: any, b: any) => (b.score as number) - (a.score as number))
      const idx = ranked.findIndex(h => h.name === hotel.name)
      if (idx !== -1) {
        categoryScores[cat] = ranked[idx].score as number
        categoryRanks[cat] = { rank: idx + 1, total: ranked.length, leader: ranked[0]?.name, ahead: ranked[idx - 1]?.name }
      }
    }
    const weakestCategories = Object.entries(categoryScores).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([cat, score]) => ({ category: cat, score, rank: categoryRanks[cat]?.rank, total: categoryRanks[cat]?.total, ahead: categoryRanks[cat]?.ahead }))

    const hotelFacts = {
      name: hotel.name, region, location: hotel.location, category: hotel.category, stars: hotel.star_classification,
      nightlyRate: hotel.nightly_rate_chf, description: hotel.description, aboutUs: hotel.about_us,
      rooms: (rooms || []).map((r: any) => ({ name: r.name, sqm: r.size_sqm, bed: r.bed_type, rate: r.base_rate_chf })),
      restaurants: (restaurants || []).map((r: any) => ({ name: r.name, cuisine: r.cuisine_type, michelin: r.michelin_stars })),
      spa: (spa || []).map((s: any) => ({ name: s.name, sqm: s.size_sqm })),
      experiences: (experiences || []).map((e: any) => e.name),
    }

    const dataBlock = {
      hotel: hotelFacts,
      monthlyVisibility,
      keywords: { won: wonQueries, missed: missedQueries },
      categories: { scores: categoryScores, ranks: categoryRanks, weakest: weakestCategories },
      faqsPerPage: faqByPage,
      missingProfileFields: missingFields,
      websiteAudit: audit ? { score: audit.score, summary: audit.summary, failedFindings: (audit.findings || []).filter((f: any) => !f.ok).map((f: any) => ({ label: f.label, priority: f.priority, detail: f.detail })) } : null,
    }

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0.3, response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Write the detailed monthly working report. Target the weakest categories and the exact missed queries. Write real FAQs to paste.\n\nDATA:\n${JSON.stringify(dataBlock, null, 2)}` },
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