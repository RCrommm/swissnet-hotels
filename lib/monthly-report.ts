import { createClient } from '@supabase/supabase-js'

// ─── MONTHLY REPORT DATA GATHERING ───
// Pure data for ONE hotel's monthly report. Reads the SAME tables as
// app/api/admin-report/route.ts (single source of the query patterns), targets a
// specific calendar month, and pulls stored month-over-month business metrics from
// monthly_performance. Returns a plain object to eyeball / feed HTML — no OpenAI,
// no fabrication: every delta is null when the prior month has no stored data.

function ymParts(m: string): { y: number; mo: number } | null {
  const x = /^(\d{4})-(\d{2})$/.exec(m)
  if (!x) return null
  const y = parseInt(x[1], 10), mo = parseInt(x[2], 10)
  if (mo < 1 || mo > 12) return null
  return { y, mo }
}
function pad2(n: number) { return String(n).padStart(2, '0') }
function firstOf(y: number, mo: number) { return `${y}-${pad2(mo)}-01` }
function shiftMonth(y: number, mo: number, delta: number) {
  const idx = y * 12 + (mo - 1) + delta
  return { y: Math.floor(idx / 12), mo: (idx % 12) + 1 }
}
function lastCompleteMonth(): string {
  // month-end report covers the month that just ended → default target = previous calendar month
  const d = new Date()
  const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
  first.setUTCMonth(first.getUTCMonth() - 1)
  return `${first.getUTCFullYear()}-${pad2(first.getUTCMonth() + 1)}`
}

function adjust(platform: string, score: number) {
  return platform === 'chatgpt' ? Math.min(100, score + 8) : score
}
const inMonth = (d: string | undefined, s: string, e: string) => !!d && d >= s && d < e

async function resolveHotel(sb: any, hotelId: string) {
  // exact full-UUID match first; on invalid-uuid or no row, fall back to prefix (your shorthand)
  const exact = await sb.from('hotels').select('*').eq('id', hotelId).maybeSingle()
  if (exact.data) return exact.data
  const { data: all } = await sb.from('hotels').select('*')
  const matches = (all || []).filter((h: any) => String(h.id).startsWith(hotelId))
  if (matches.length > 1) throw new Error(`Ambiguous hotelId "${hotelId}" — ${matches.length} matches`)
  return matches[0] || null
}

export async function gatherMonthlyReportData(hotelId: string, month?: string) {
  const targetMonth = month && ymParts(month) ? month : lastCompleteMonth()
  const p = ymParts(targetMonth)!
  const targetStart = firstOf(p.y, p.mo)
  const nx = shiftMonth(p.y, p.mo, 1); const nextStart = firstOf(nx.y, nx.mo)
  const pv = shiftMonth(p.y, p.mo, -1); const prevStart = firstOf(pv.y, pv.mo)
  const prevMonth = `${pv.y}-${pad2(pv.mo)}`

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const hotel = await resolveHotel(sb, hotelId)
  if (!hotel) throw new Error('Hotel not found')
  hotelId = hotel.id  // downstream hotel_id queries need the full UUID, not the shorthand prefix
  const region = hotel.region || 'Geneva'

  // latest 2 audits → current + prior (improvement vs last audit; baseline if none)
  const { data: auditRows } = await sb.from('website_audits').select('*')
    .eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(2)
  const audit = auditRows?.[0] || null
  const priorAudit = auditRows?.[1] || null

  const [{ data: content }, { data: faqSug }] = await Promise.all([
    sb.from('hotel_content').select('faqs').eq('hotel_id', hotelId).single(),
    sb.from('hotel_faq_suggestions').select('page_type, question').eq('hotel_id', hotelId),
  ])

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

  // Google AI per-query — won/missed
  const { data: googleRows } = await sb.from('ai_visibility_scores')
    .select('query, appeared, checked_at')
    .eq('hotel_id', hotelId).eq('platform', 'google_ai')
    .order('checked_at', { ascending: false })
  const latestPerQuery = [...new Map((googleRows || []).map((r: any) => [r.query, r])).values()]
  const wonQueries = latestPerQuery.filter((r: any) => r.appeared).map((r: any) => r.query)
  const missedQueries = latestPerQuery.filter((r: any) => !r.appeared).map((r: any) => r.query)

  // competitor_visibility — window covers dashboard's 90d AND the target's prev month
  const ninetyBack = new Date(Date.now() - 90 * 864e5).toISOString().split('T')[0]
  const since = prevStart < ninetyBack ? prevStart : ninetyBack
  const { data: comp } = await sb.from('competitor_visibility')
    .select('competitor_name, category, platform, visibility_score, checked_at, run_date')
    .eq('region', region).gte('run_date', since).limit(5000)

  const dateOf = (r: any) => r.run_date || r.checked_at?.split('T')[0]

  const platMonthAvg = (rows: any[], plat: string) => {
    const arr = rows.filter((r: any) => r.platform === plat).map((r: any) => adjust(plat, r.visibility_score))
    return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null
  }
  const googleMonthAvg = (s: string, e: string) => {
    const rows = (googleRows || []).filter((r: any) => inMonth(r.checked_at?.split('T')[0], s, e))
    const byDate: Record<string, any[]> = {}
    for (const r of rows) (byDate[r.checked_at.split('T')[0]] ||= []).push(r)
    const daily = Object.values(byDate).map((day: any[]) => Math.round((day.filter(r => r.appeared).length / day.length) * 100))
    return daily.length ? Math.round(daily.reduce((a, b) => a + b, 0) / daily.length) : null
  }
  const overallOf = (m: any) => { const v = [m.chatgpt, m.perplexity, m.googleAi].filter((x: any) => x !== null); return v.length ? Math.round(v.reduce((a: number, b: number) => a + b, 0) / v.length) : null }
  const latestScore = (rows: any[]) => {
    const byPlat: Record<string, any> = {}
    for (const r of rows) {
      const stamp = r.run_date || r.checked_at || ''
      if (!byPlat[r.platform] || stamp > (byPlat[r.platform].run_date || byPlat[r.platform].checked_at || '')) byPlat[r.platform] = r
    }
    const vals = Object.values(byPlat).map((r: any) => adjust(r.platform, r.visibility_score))
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  }

  // ── 1) monthly AI visibility score (live from competitor_visibility) ──
  const mineOverview = (comp || []).filter((r: any) => r.competitor_name === hotel.name && r.category === null)
  const thisRows = mineOverview.filter((r: any) => inMonth(dateOf(r), targetStart, nextStart))
  const lastRows = mineOverview.filter((r: any) => inMonth(dateOf(r), prevStart, targetStart))
  const thisMonth: any = { chatgpt: platMonthAvg(thisRows, 'chatgpt'), perplexity: platMonthAvg(thisRows, 'perplexity'), googleAi: googleMonthAvg(targetStart, nextStart) }
  const lastMonth: any = { chatgpt: platMonthAvg(lastRows, 'chatgpt'), perplexity: platMonthAvg(lastRows, 'perplexity'), googleAi: googleMonthAvg(prevStart, targetStart) }
  thisMonth.overall = overallOf(thisMonth)
  lastMonth.overall = overallOf(lastMonth)
  const hasLast = [lastMonth.chatgpt, lastMonth.perplexity, lastMonth.googleAi].some(x => x !== null)
  const d = (a: number | null, b: number | null) => (a !== null && b !== null) ? a - b : null
  const visibilityDelta = hasLast ? { chatgpt: d(thisMonth.chatgpt, lastMonth.chatgpt), perplexity: d(thisMonth.perplexity, lastMonth.perplexity), googleAi: d(thisMonth.googleAi, lastMonth.googleAi), overall: d(thisMonth.overall, lastMonth.overall) } : null

  // ── 2) competitor comparison — overview leaderboard for the target month ──
  const overviewThis = (comp || []).filter((r: any) => r.category === null && inMonth(dateOf(r), targetStart, nextStart))
  const compNames = [...new Set(overviewThis.map((r: any) => r.competitor_name))]
  const leaderboard = compNames
    .map((n: any) => ({ name: n, score: latestScore(overviewThis.filter((r: any) => r.competitor_name === n)) }))
    .filter(x => x.score !== null)
    .sort((a: any, b: any) => (b.score as number) - (a.score as number))
    .map((x, i) => ({ rank: i + 1, name: x.name, score: x.score as number, isYou: x.name === hotel.name }))

  // categories + ranks (weakest → feeds recommendations)
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
  const weakestCategories = Object.entries(categoryScores).sort((a, b) => a[1] - b[1]).slice(0, 2)
    .map(([cat, score]) => ({ category: cat, score, rank: categoryRanks[cat]?.rank, total: categoryRanks[cat]?.total, ahead: categoryRanks[cat]?.ahead }))

  // ── 4) website analysis + improvement vs prior audit (baseline when none) ──
  const websiteAudit = audit ? {
    score: audit.score,
    summary: audit.summary,
    failedFindings: (audit.findings || []).filter((f: any) => !f.ok).map((f: any) => ({ label: f.label, priority: f.priority, detail: f.detail })),
    priorScore: priorAudit ? priorAudit.score : null,
    scoreDelta: priorAudit ? (audit.score - priorAudit.score) : null,
    baseline: !priorAudit,
  } : null

  // stored business performance (monthly_performance) — deltas null when prior absent
  const { data: perfRows } = await sb.from('monthly_performance').select('*')
    .eq('hotel_id', hotelId).in('month', [targetMonth, prevMonth])
  const perfThis = (perfRows || []).find((r: any) => r.month === targetMonth) || null
  const perfPrev = (perfRows || []).find((r: any) => r.month === prevMonth) || null

  return {
    hotel: { id: hotel.id, name: hotel.name, region },
    month: targetMonth,
    priorMonth: prevMonth,

    visibility: { thisMonth, lastMonth: hasLast ? lastMonth : null, delta: visibilityDelta, baseline: !hasLast },

    competitors: leaderboard,
    categories: { scores: categoryScores, ranks: categoryRanks, weakest: weakestCategories },

    // 3) citations — STUB: needs the Citation Sources table (name + columns). Not fabricating a query.
    citations: null,

    websiteAudit,

    // 5) recommendation INPUTS (real gathered facts; generation is a later step)
    recommendationInputs: {
      won: wonQueries, missed: missedQueries,
      weakestCategories, faqsPerPage: faqByPage,
      missingProfileFields: missingFields,
      failedFindings: websiteAudit?.failedFindings || [],
    },

    performance: { thisMonth: perfThis, lastMonth: perfPrev, baseline: !perfPrev },
  }
}
export async function debugCompVisibility(hotelIdArg: string) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  let hotel: any = null
  const exact = await sb.from('hotels').select('id,name,region').eq('id', hotelIdArg).maybeSingle()
  if (exact.data) hotel = exact.data
  else {
    const { data: all } = await sb.from('hotels').select('id,name,region')
    hotel = (all || []).find((h: any) => String(h.id).startsWith(hotelIdArg)) || null
  }
  if (!hotel) throw new Error('Hotel not found')
  const region = hotel.region || 'Geneva'

  const since = new Date(Date.now() - 75 * 864e5).toISOString().split('T')[0]
  const { data: comp } = await sb.from('competitor_visibility')
    .select('competitor_name, category, platform, visibility_score, run_date, checked_at')
    .eq('region', region).gte('run_date', since).limit(8000)

  const dateOf = (r: any) => r.run_date || (r.checked_at ? r.checked_at.split('T')[0] : null)
  const groups: Record<string, { rows: number; hotels: Set<string>; includesYou: boolean; scoreSum: number }> = {}
  for (const r of comp || []) {
    const d = dateOf(r); if (!d) continue
    const kind = r.category === null ? 'overview' : `cat:${r.category}`
    const key = `${r.platform} | ${d.slice(0, 7)} | ${kind}`
    const g = (groups[key] ||= { rows: 0, hotels: new Set(), includesYou: false, scoreSum: 0 })
    g.rows++; g.hotels.add(r.competitor_name); g.scoreSum += r.visibility_score || 0
    if (r.competitor_name === hotel.name) g.includesYou = true
  }
  const competitorVisibility = Object.entries(groups)
    .map(([key, v]) => ({ key, rows: v.rows, hotels: v.hotels.size, includesYou: v.includesYou, avg: v.rows ? Math.round(v.scoreSum / v.rows) : null }))
    .sort((a, b) => (a.key < b.key ? -1 : 1))

  const { data: g } = await sb.from('ai_visibility_scores')
    .select('appeared, checked_at').eq('hotel_id', hotel.id).eq('platform', 'google_ai')
  const googleByMonth: Record<string, { rows: number; appeared: number }> = {}
  for (const r of g || []) {
    const m = r.checked_at?.slice(0, 7); if (!m) continue
    const x = (googleByMonth[m] ||= { rows: 0, appeared: 0 }); x.rows++; if (r.appeared) x.appeared++
  }

  return { hotel: { name: hotel.name, region, id: hotel.id }, competitorVisibility, googleByMonth }
}