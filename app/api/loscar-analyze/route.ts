// app/api/loscar-analyze/route.ts
// AI Answerability Engine. Reads latest audit's scraped pages →
// extract knowledge → test questions → verify evidence in code →
// critic pass → per-category coverage → store + return all stages.
import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const MODEL = 'gpt-4o'
const HOTEL_SLUG = 'loscar-london'

// Universal question library → categories. Queries tuned for a London luxury hotel.
const QUESTION_LIBRARY: { category: string; query: string }[] = [
  { category: 'location', query: 'Where is the hotel located and what is nearby?' },
  { category: 'location', query: 'Is the hotel close to West End theatres and Covent Garden?' },
  { category: 'rooms', query: 'What types of rooms and suites does the hotel offer?' },
  { category: 'rooms', query: 'How big are the suites and what are the bed configurations?' },
  { category: 'rooms', query: 'Do rooms have bathtubs or special features?' },
  { category: 'dining', query: 'What restaurant and cuisine does the hotel have?' },
  { category: 'dining', query: 'What are the restaurant opening hours?' },
  { category: 'afternoon_tea', query: 'Does the hotel offer afternoon tea and how much does it cost?' },
  { category: 'afternoon_tea', query: 'Is the afternoon tea vegetarian, vegan or allergy friendly?' },
  { category: 'afternoon_tea', query: 'Is there a dress code for afternoon tea?' },
  { category: 'meetings', query: 'Does the hotel have meeting or event spaces and what capacity?' },
  { category: 'meetings', query: 'Is the event space wheelchair accessible?' },
  { category: 'events', query: 'Can the hotel host weddings or private dining?' },
  { category: 'amenities', query: 'Does the hotel have a spa, gym or pool?' },
  { category: 'amenities', query: 'Is WiFi available?' },
  { category: 'families', query: 'Is the hotel family friendly and does it allow children?' },
  { category: 'pets', query: 'Are pets or dogs allowed at the hotel?' },
  { category: 'parking', query: 'Is parking available at or near the hotel?' },
  { category: 'transportation', query: 'What is the nearest underground station and airport access?' },
  { category: 'policies', query: 'What are the check-in and check-out times?' },
  { category: 'policies', query: 'What is the cancellation policy?' },
  { category: 'accessibility', query: 'Is the hotel wheelchair accessible?' },
  { category: 'offers', query: 'Are there any current offers or packages?' },
  { category: 'identity', query: 'What makes this hotel unique or notable?' },
  { category: 'identity', query: 'What star rating or awards does the hotel have?' },
]

async function gpt(messages: any[], json = true): Promise<any> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.2,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  })
  if (!res.ok) { const b = await res.text(); throw new Error(`OpenAI ${res.status}: ${b.slice(0, 300)}`) }
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  return json ? JSON.parse(text) : text
}

// normalize text for evidence verification (accents, punctuation, whitespace)
function norm(s: string): string {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function slug(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40)
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!OPENAI_API_KEY) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 })

  // Resolve hotel + latest audit with pages
  const { data: hotel } = await supabase.from('audit_hotels').select('id, name, domain').eq('slug', HOTEL_SLUG).single()
  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })

  const { data: audit } = await supabase.from('audits')
    .select('id, created_at').eq('hotel_id', hotel.id).order('created_at', { ascending: false }).limit(1).single()
  if (!audit) return NextResponse.json({ error: 'No audit found — run the scraper first' }, { status: 404 })

  const { data: pages } = await supabase.from('audit_pages')
    .select('url, page_type, title, extracted_text').eq('audit_id', audit.id)
  if (!pages?.length) return NextResponse.json({ error: 'No pages on this audit' }, { status: 404 })

  const fullText = pages.map((p: any) => `### PAGE: ${p.page_type} (${p.url})\n${p.extracted_text}`).join('\n\n')
  const normCorpus = norm(pages.map((p: any) => p.extracted_text).join(' '))

  // ── PASS 1a: Knowledge extraction ──
  const knowledge = await gpt([
    { role: 'system', content: 'You extract structured facts about a hotel from its website text. Only include facts EXPLICITLY stated in the text. If something is not stated, omit it or use null. Never invent. Return JSON.' },
    { role: 'user', content: `Hotel: ${hotel.name}\nDomain: ${hotel.domain}\n\nWebsite text:\n${fullText}\n\nExtract a structured knowledge object with keys: location, rooms, dining, afternoon_tea, meetings, events, amenities, families, pets, parking, transportation, policies, accessibility, offers, identity. Each value should contain only facts present in the text (quotes, numbers, names). Use null where the site says nothing. Return JSON only.` },
  ])

  // ── PASS 1b: Answerability per question, against the knowledge + text ──
  const qList = QUESTION_LIBRARY.map((q, i) => `${i + 1}. [${q.category}] ${q.query}`).join('\n')
  const rawAnswer = await gpt([
    { role: 'system', content: 'You judge whether an AI assistant could answer a guest question using ONLY the hotel\'s website information provided. For each question return: answerable (bool), coverage_type (explicit=stated outright, implicit=inferable, not_answerable=no basis), confidence (0-1), evidence_quote (a SHORT verbatim snippet from the website text that supports the answer, or empty string if none), missing_information (array of what is absent), recommendation (specific fix), expected_visibility_impact (high/medium/low). Be strict: if the text does not contain it, it is not_answerable. Never invent evidence. Return JSON {"results":[...]} preserving question order and including the category and query.' },
    { role: 'user', content: `Hotel knowledge:\n${JSON.stringify(knowledge)}\n\nFull website text:\n${fullText}\n\nQuestions:\n${qList}\n\nReturn JSON {"results":[{query, category, answerable, coverage_type, confidence, evidence_quote, missing_information, recommendation, expected_visibility_impact}]}` },
  ])

  let results: any[] = Array.isArray(rawAnswer?.results) ? rawAnswer.results : []

  // ── CODE: verify every evidence quote actually exists in the page text ──
  results = results.map((r: any) => {
    const ev = norm(r.evidence_quote || '')
    const evidenceReal = ev.length >= 8 && normCorpus.includes(ev)
    // If claimed answerable but evidence isn't real, downgrade
    if (r.answerable && r.coverage_type === 'explicit' && !evidenceReal) {
      return { ...r, answerable: false, coverage_type: 'not_answerable', confidence: Math.min(r.confidence ?? 0.3, 0.3), _evidence_rejected: true }
    }
    return { ...r, _evidence_verified: evidenceReal }
  })

  // ── PASS 2: Critic — strip generic / unsupported / duplicate findings ──
  const problemCandidates = results.filter((r: any) => !r.answerable || r.coverage_type !== 'explicit')
  const critic = await gpt([
    { role: 'system', content: 'You are a strict audit critic. Given draft findings about gaps in a hotel website, KEEP only findings that are specific, evidence-grounded, actionable, and materially impactful for AI visibility. REMOVE anything generic ("add more content", "improve SEO"), unsupported, or duplicated. For each kept finding, sharpen the recommendation to be concrete. Return JSON {"kept":[...], "removed":[{finding, reason}]}.' },
    { role: 'user', content: `Hotel: ${hotel.name}\n\nDraft findings (gaps):\n${JSON.stringify(problemCandidates, null, 2)}\n\nReturn JSON {"kept":[{query, category, issue, missing_information, recommendation, expected_visibility_impact}], "removed":[{finding, reason}]}` },
  ])

  const kept: any[] = Array.isArray(critic?.kept) ? critic.kept : []
  const removed: any[] = Array.isArray(critic?.removed) ? critic.removed : []

  // ── Per-category coverage ──
  const byCat: Record<string, { total: number; answerable: number }> = {}
  for (const r of results) {
    const c = r.category || 'other'
    byCat[c] = byCat[c] || { total: 0, answerable: 0 }
    byCat[c].total++
    if (r.answerable) byCat[c].answerable++
  }
  const categoryCoverage: Record<string, number> = {}
  for (const [c, v] of Object.entries(byCat)) categoryCoverage[c] = Math.round((v.answerable / v.total) * 100)
  const overall = results.length ? Number(((results.filter((r: any) => r.answerable).length / results.length) * 100).toFixed(2)) : 0

  // ── Store: knowledge, query results, findings, audit score ──
  await supabase.from('audit_knowledge').upsert({ audit_id: audit.id, hotel_id: hotel.id, knowledge, model_name: MODEL }, { onConflict: 'audit_id' })

  const qrRows = results.map((r: any) => ({
    audit_id: audit.id, hotel_id: hotel.id, query: r.query, category: r.category || 'other',
    answerable: !!r.answerable,
    coverage_type: r.coverage_type === 'explicit' || r.coverage_type === 'implicit' ? r.coverage_type : 'not_answerable',
    confidence: typeof r.confidence === 'number' ? Math.max(0, Math.min(1, r.confidence)) : null,
    evidence_quote: r.evidence_quote || null,
    missing_information: Array.isArray(r.missing_information) ? r.missing_information : null,
    recommendation: r.recommendation || null,
    finding_key: `ai_answerability_${slug(r.category)}_${slug(r.query)}`,
    expected_visibility_impact: ['high', 'medium', 'low'].includes(r.expected_visibility_impact) ? r.expected_visibility_impact : 'medium',
  }))
  // dedupe by finding_key (unique constraint)
  const seen = new Set<string>()
  const qrDedup = qrRows.filter((r: any) => { if (seen.has(r.finding_key)) return false; seen.add(r.finding_key); return true })
  if (qrDedup.length) await supabase.from('audit_query_results').upsert(qrDedup, { onConflict: 'audit_id,finding_key' })

  const findingRows = kept.map((k: any) => ({
    audit_id: audit.id, hotel_id: hotel.id, page_url: null,
    finding_key: `ai_answerability_${slug(k.category)}_${slug(k.query || k.issue || '')}`,
    category: 'ai_answerability',
    severity: k.expected_visibility_impact === 'high' ? 'high' : k.expected_visibility_impact === 'low' ? 'low' : 'medium',
    issue: k.issue || k.query || 'Gap',
    evidence: Array.isArray(k.missing_information) ? `Missing: ${k.missing_information.join(', ')}` : 'Information not found on site',
    recommendation: k.recommendation || 'Add this information.',
    why_it_matters: `AI cannot confidently answer: "${k.query || k.issue}"`,
    status: 'open',
  }))
  const seenF = new Set<string>()
  const fDedup = findingRows.filter((r: any) => { if (seenF.has(r.finding_key)) return false; seenF.add(r.finding_key); return true })
  if (fDedup.length) await supabase.from('audit_findings').upsert(fDedup, { onConflict: 'audit_id,finding_key' })

  await supabase.from('audits').update({ overall_score: overall, overall_summary: `Answerability ${overall}% across ${results.length} questions`, model_name: MODEL }).eq('id', audit.id)

  // ── Return all stages for quality inspection ──
  return NextResponse.json({
    success: true,
    audit_id: audit.id,
    hotel: hotel.name,
    pages_analyzed: pages.length,
    overall_coverage: overall,
    category_coverage: categoryCoverage,
    knowledge,
    query_results: results,
    findings_kept: kept,
    findings_removed: removed,
  })
}
