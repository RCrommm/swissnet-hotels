import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

// ─── ASK SWISSNET ───
// Grounded Q&A over ONE hotel's stored Brain facts + latest audit findings +
// latest advisory. Answers ONLY from provided data. Never invents. Three modes:
//   (a) answer from facts, (b) answer from findings/advisory (gaps & priorities),
//   (c) when neither contains it, say so plainly — no guessing.

const ASK_SYSTEM = `You are SwissNet, an AI-visibility advisor for ONE luxury hotel. A hotel marketing director is asking you a question. You answer ONLY from the DATA provided below about THIS hotel — three sources:
1) KNOWN FACTS — what the hotel's own website states (each with an evidence quote and the page it came from). This is what AI assistants can currently retrieve.
2) OPEN FINDINGS — gaps an audit found: missing pages, weak sections, and guest questions the site cannot answer.
3) CURRENT ADVISORY — the strategic priorities already produced for this hotel.

ABSOLUTE RULES — these define whether you are trustworthy:
- Answer ONLY from the three sources above. NEVER invent facts, numbers, prices, percentages, rankings, competitor names, or claims. If a number isn't in the data, you do not have it.
- When a fact answers the question, cite it: quote the evidence and name the page (e.g. "your afternoon-tea page states ...").
- When the question is about a GAP, a PRIORITY, or "why" — answer from the FINDINGS and ADVISORY, explaining the reasoning that was used.
- THREE-WAY HONESTY: (a) if the FACTS contain it, answer from them; (b) if the FACTS don't but a FINDING or the ADVISORY addresses it, say what the site currently does/doesn't confirm and that it's flagged — this is more useful than a flat "no"; (c) if NONE of the three sources contains it, say plainly "Your stored data doesn't include anything about that" and, if useful, suggest it could be added. NEVER fill the gap with a plausible guess.
- A "why is X prioritized over Y" question is answered from the advisory's reasoning + the supporting facts/findings — not from generic hotel knowledge.
- Be concise and specific to THIS hotel. A few sentences. Never write something that could apply to any hotel.
- You are not a general chatbot. If asked something unrelated to this hotel's AI visibility, facts, findings, or advice, say that's outside what you can answer from the hotel's data.

Return a JSON object: { "answer": string, "grounded_on": [string] } where grounded_on lists the specific facts/findings/advisory points you used (short labels), or is empty if you had to say the data doesn't cover it.`

function askSchema() {
  return {
    type: 'object', additionalProperties: false,
    required: ['answer', 'grounded_on'],
    properties: {
      answer: { type: 'string' },
      grounded_on: { type: 'array', items: { type: 'string' } },
    },
  }
}

function pathOf(u: string): string {
  try { return new URL(u).pathname.replace(/\/$/, '') || '/' } catch { return u || '' }
}

function buildBrief(facts: any[], findings: any[], advisory: any) {
  const factLines = (facts || []).slice(0, 140).map(f => {
    const q = (f.evidence_quote || '').slice(0, 120)
    const p = pathOf(f.page_url || '')
    return `[${f.category}] ${f.fact_value}${q ? `  — "${q}"` : ''}${p ? ` (${p})` : ''}`
  })
  const findingLines = (findings || []).map(f => {
    const t = (f.type || '').toUpperCase()
    const aq = (f.affected_queries || []).join('; ')
    return `${t}: ${f.title}${aq ? ` → ${aq}` : ''}`
  })
  const advisoryLines: string[] = []
  if (advisory?.one_line_priority) advisoryLines.push(`PRIORITY: ${advisory.one_line_priority}`)
  for (const m of (advisory?.top_moves || [])) advisoryLines.push(`MOVE #${m.priority ?? '?'} (${m.confidence ?? ''}): ${m.title}${m.why_this_priority ? ` — ${m.why_this_priority}` : ''}`)
  if (advisory?.what_not_to_do_yet) advisoryLines.push(`NOT YET: ${advisory.what_not_to_do_yet}`)
  return { factLines, findingLines, advisoryLines }
}

export async function POST(req: Request) {
  try {
    const { hotelId, question, password } = await req.json()
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 })
    if (!question || !String(question).trim()) return NextResponse.json({ error: 'Ask a question' }, { status: 400 })
    const openaiKey = process.env.OPENAI_API_KEY
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!openaiKey || !sbUrl || !sbKey) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    const sb = createClient(sbUrl, sbKey)

    // Latest Brain + its facts
    const { data: brain } = await sb.from('hotel_brains').select('id, hotel_name, city').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1).single()
    if (!brain) return NextResponse.json({ error: 'No Hotel Brain found for this hotel yet.' }, { status: 404 })
    const { data: facts } = await sb.from('hotel_facts').select('category, fact_value, evidence_quote, page_url').eq('brain_id', brain.id)

    // Latest audit findings (most recent run only)
    let findings: any[] = []
    const { data: fRows } = await sb.from('audit_findings').select('type, title, affected_queries, audit_run_id, created_at').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(400)
    if (fRows && fRows.length) { const lastRun = fRows[0].audit_run_id; findings = fRows.filter((r: any) => r.audit_run_id === lastRun) }

    // Latest stored advisory
    const { data: advRow } = await sb.from('hotel_consultant').select('advisory').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    const advisory = advRow?.advisory || null

    if ((!facts || !facts.length) && !findings.length && !advisory) {
      return NextResponse.json({ error: 'No stored data for this hotel yet — run the Brain and Advisor first.' }, { status: 404 })
    }

    const brief = buildBrief(facts || [], findings, advisory)
    const user = `HOTEL: ${brain.hotel_name || ''} (${brain.city || ''})

KNOWN FACTS (what the site states, with evidence quote + page):
${brief.factLines.join('\n') || '(none stored)'}

OPEN FINDINGS (gaps the audit found):
${brief.findingLines.join('\n') || '(none stored)'}

CURRENT ADVISORY (the strategic priorities already produced):
${brief.advisoryLines.join('\n') || '(none stored)'}

QUESTION FROM THE HOTEL: ${String(question).trim()}

Answer ONLY from the data above, following the three-way honesty rule.`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0.1, max_tokens: 900,
        response_format: { type: 'json_schema', json_schema: { name: 'ask', strict: true, schema: askSchema() } },
        messages: [{ role: 'system', content: ASK_SYSTEM }, { role: 'user', content: user }],
      }),
    })
    const data = await res.json()
    const c = data?.choices?.[0]?.message?.content
    if (!c) return NextResponse.json({ error: 'No answer produced' }, { status: 502 })
    const parsed = JSON.parse(c)

    return NextResponse.json({
      hotel: brain.hotel_name,
      answer: parsed.answer,
      grounded_on: parsed.grounded_on || [],
      basedOn: { facts: (facts || []).length, findings: findings.length, hasAdvisory: !!advisory },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Ask failed' }, { status: 500 })
  }
}