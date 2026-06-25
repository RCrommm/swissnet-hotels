import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 120

// ─── GROUNDED CONSULTANT ───
// Reasons ONLY over stored Brain facts + audit findings. Never invents metrics,
// traffic, rankings, competitor claims, or percentages. Every move cites stored data.

const CONSULTANT_SYSTEM = `You are a senior AI-visibility consultant for luxury hotels. You advise a non-technical hotel marketing director. You are given two things about ONE hotel, both produced by an automated system from the hotel's own website:
1) KNOWN FACTS — what the hotel's site actually states (each with an evidence quote). This is what AI assistants can currently retrieve and trust.
2) OPEN FINDINGS — gaps the audit found: missing pages, missing page sections, and guest questions the site cannot answer (each with the affected guest searches).

Your job is to REASON like a consultant, not to list tasks. Produce a strategic diagnosis grounded ONLY in the facts and findings provided.

ABSOLUTE RULES:
- Use ONLY the provided facts and findings. NEVER invent anything: no traffic numbers, no percentages, no rankings, no competitor names or claims, no "industry average", no made-up statistics. If you don't have a number, don't use one.
- Every strategic move MUST reference at least one specific stored fact OR finding, name the affected guest searches it would unlock, and explain the AI-retrieval reasoning (WHY an AI can or cannot recommend the hotel for it).
- Reason about CONNECTIONS the site fails to make, not just missing pages. Example pattern: "AI knows you have X (fact) and Y (fact) but nothing connects them for use-case Z, so the searches [affected] go unanswered."
- "confidence": High/Medium/Low — reflects EVIDENCE STRENGTH: High = multiple facts + a finding directly support it; Medium = one fact supports it; Low = thin/indirect signal.
- "effort": Low/Medium/High. "priority": 1 = do first.
- Be specific to THIS hotel. Never write a sentence that could apply to any hotel.

PRIORITIZE LIKE A HOTEL REVENUE CONSULTANT, not a content checklist:
1. RELEVANCE GATE — Only rank something a TOP MOVE if the hotel clearly HAS that offer (multiple supporting facts). A single weak mention (e.g. one yoga class) is NOT a spa product — note it at most as a Low-confidence opportunity, never as a top priority.
2. COMMERCIAL INTENT — Rank by what drives bookings. Revenue-driving intents come first: rooms, dining, meetings, weddings, business, location, luxury, romantic. Then offers, family, wellness. Practical trust pages (accessibility, parking, pets) matter for completeness but are hygiene, NOT flagship strategic moves — only elevate one if it is a clear booking dealbreaker for this hotel.
3. PAGE vs SECTION — Do NOT default to "create a page". If the hotel already has related content, the right fix is often a homepage Quick-Facts block, an FAQ answer, or a section on an existing page. Recommend the SMALLEST fix that unlocks the searches, and say which (page / section / FAQ / Quick-Facts).
4. JUSTIFY THE RANK — Each top move's reasoning must answer "why this before the other findings?", referencing how many guest searches it unlocks AND its commercial importance.
5. Return the 3 (at most 4) highest-leverage moves only — never a long list.

Return STRICTLY this JSON shape:
{
  "executive_diagnosis": string,
  "ai_understands": [string],
  "ai_cannot_connect": [string],
  "top_moves": [
    {
      "title": string,
      "reasoning": string,
      "evidence": [string],
      "affected_searches": [string],
      "confidence": "High"|"Medium"|"Low",
      "effort": "Low"|"Medium"|"High",
      "priority": integer
    }
  ],
  "what_not_to_do_yet": string
}`

function consultantSchema() {
  return {
    type: 'object', additionalProperties: false,
    required: ['executive_diagnosis','ai_understands','ai_cannot_connect','top_moves','what_not_to_do_yet'],
    properties: {
      executive_diagnosis: { type: 'string' },
      ai_understands: { type: 'array', items: { type: 'string' } },
      ai_cannot_connect: { type: 'array', items: { type: 'string' } },
      top_moves: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['title','reasoning','evidence','affected_searches','confidence','effort','priority'],
          properties: {
            title: { type: 'string' }, reasoning: { type: 'string' },
            evidence: { type: 'array', items: { type: 'string' } },
            affected_searches: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'string', enum: ['High','Medium','Low'] },
            effort: { type: 'string', enum: ['Low','Medium','High'] },
            priority: { type: 'integer' },
          },
        },
      },
      what_not_to_do_yet: { type: 'string' },
    },
  }
}

function buildBrief(facts: any[], findings: any[]) {
  const factLines = facts.slice(0, 120).map(f => `[${f.category}] ${f.fact_key} = ${f.fact_value}  ("${(f.evidence_quote||'').slice(0,80)}")`)
  const missingPages = findings.filter(f => f.type === 'missing_page').map(f => `MISSING PAGE: ${f.title} → affects: ${(f.affected_queries||[]).join('; ')}`)
  const weakElements = findings.filter(f => f.type === 'missing_element').map(f => `WEAK: ${f.title}`)
  const unanswered = findings.filter(f => f.type === 'unanswered_query').map(f => `UNANSWERED: ${f.title}`)
  return { factLines, missingPages, weakElements, unanswered }
}

export async function POST(req: Request) {
  try {
    const { hotelId, password } = await req.json()
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 })
    const openaiKey = process.env.OPENAI_API_KEY
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!openaiKey || !sbUrl || !sbKey) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    const sb = createClient(sbUrl, sbKey)

    const { data: brain } = await sb.from('hotel_brains').select('id, hotel_name, city, knowledge').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1).single()
    if (!brain) return NextResponse.json({ error: 'No Hotel Brain found. Run /api/hotel-brain first.' }, { status: 404 })
    const { data: facts } = await sb.from('hotel_facts').select('category, fact_key, fact_value, evidence_quote, confidence').eq('brain_id', brain.id)

    let findings: any[] = []
    const { data: fRows } = await sb.from('audit_findings').select('finding_key, type, title, affected_queries, audit_run_id, created_at').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(400)
    if (fRows && fRows.length) { const lastRun = fRows[0].audit_run_id; findings = fRows.filter((r: any) => r.audit_run_id === lastRun) }

    if ((!facts || !facts.length) && !findings.length) return NextResponse.json({ error: 'No stored facts or findings for this hotel yet.' }, { status: 404 })

    const brief = buildBrief(facts || [], findings)
    const user = `HOTEL: ${brain.hotel_name || ''} (${brain.city || ''})

KNOWN FACTS (what the site states, with evidence):
${brief.factLines.join('\n')}

OPEN FINDINGS:
${brief.missingPages.join('\n')}
${brief.weakElements.join('\n')}
${brief.unanswered.join('\n')}`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0.2, max_tokens: 2800,
        response_format: { type: 'json_schema', json_schema: { name: 'consultant', strict: true, schema: consultantSchema() } },
        messages: [{ role: 'system', content: CONSULTANT_SYSTEM }, { role: 'user', content: user }],
      }),
    })
    const data = await res.json()
    const c = data?.choices?.[0]?.message?.content
    if (!c) return NextResponse.json({ error: 'Consultant produced no output' }, { status: 502 })
    const advisory = JSON.parse(c)

    return NextResponse.json({
      hotel: brain.hotel_name, city: brain.city,
      basedOn: { facts: (facts || []).length, findings: findings.length },
      advisory,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Consultant failed' }, { status: 500 })
  }
}