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
1. RELEVANCE GATE — Only rank something a TOP MOVE if the hotel clearly HAS that offer (2+ supporting facts) OR there is a clear commercial finding for it. A single incidental mention (e.g. one yoga class) is NOT a wellness product — put it in what_not_to_do_yet or mark it Low confidence, never a top priority. A revenue-driving category with a clear finding (e.g. weddings with a missing romantic page) CAN be a top move even on fewer facts — the finding is the signal.
1b. EXISTING-PAGE AWARENESS — You are told which page topics already exist. If a page for THIS MOVE'S topic already exists, recommend strengthening it (build_type "Section on existing page") and name that page in what_to_build. If the topic has NO existing page of its own, recommend a New page — do NOT graft the topic onto an unrelated existing page just to avoid creating one (e.g. never put wedding/romantic content on the Meetings & Events page, or family content on a Dining page). Match the recommendation to the page whose subject actually fits: strengthen when the right page exists, create when it genuinely doesn't. Recommending creation of a page that already exists destroys trust; so does housing a topic on a page where a guest would never look for it.
2. COMMERCIAL INTENT — Rank by what drives bookings. Revenue-driving intents come first: rooms, dining, meetings, weddings, business, location, luxury, romantic. Then offers, family, wellness. Practical trust pages (accessibility, parking, pets) matter for completeness but are hygiene, NOT flagship strategic moves — only elevate one if it is a clear booking dealbreaker for this hotel.
3. PAGE vs SECTION — Do NOT default to "create a page". If the hotel already has related content, the right fix is often a homepage Quick-Facts block, an FAQ answer, or a section on an existing page. Recommend the SMALLEST fix that unlocks the searches, and say which (page / section / FAQ / Quick-Facts).
4. JUSTIFY THE RANK — Each top move's reasoning must answer "why this before the other findings?", referencing how many guest searches it unlocks AND its commercial importance.
5. Return the 3 (at most 4) highest-leverage moves only — never a long list.

Return STRICTLY this JSON shape:
{
  "executive_diagnosis": string,
  "one_line_priority": string,
  "ai_understands": [string],
  "ai_cannot_connect": [string],
  "work_plan": {
    "quick_wins": [string],
    "strategic_projects": [string]
  },
  "top_moves": [
    {
      "title": string,
      "why_this_priority": string,
      "why_ai_cares": string,
      "what_to_build": string,
      "build_type": "New page"|"Section on existing page"|"Homepage block"|"FAQ only",
      "sections_to_add": [string],
      "implementation_steps": [string],
      "questions_to_answer": [string],
      "affected_searches": [string],
      "expected_ai_effect": string,
      "success_criteria": string,
      "reasoning": string,
      "evidence": [string],
      "confidence": "High"|"Medium"|"Low",
      "effort": "Low"|"Medium"|"High",
      "priority": integer
    }
  ],
  "next_opportunities": [
    { "title": string, "why": string, "effort": "Low"|"Medium"|"High" }
  ],
  "what_not_to_do_yet": string
}

DEPTH REQUIREMENTS:
- one_line_priority is the headline a GM reads first — specific and decisive, naming the actual move (e.g. "Your fastest win is a romantic & weddings page — you already have the assets, AI just can't connect them").
- why_ai_cares must explain AI RETRIEVAL specifically: AI assistants avoid recommending what they cannot confirm. Name what's unconfirmed and why that blocks a confident recommendation.
- implementation_steps: 3-6 concrete ordered actions a hotel's web person follows — a real checklist, not "add content about X".
- success_criteria describes the observable result with NO invented numbers — what an AI assistant would be able to answer that it can't today.
- next_opportunities must be genuinely DIFFERENT findings from the top 3 — the next layer down, not restatements.
- work_plan.quick_wins are low-effort high-value fixes (an FAQ, a Quick-Facts block); strategic_projects are bigger builds (a new page).
- Depth does NOT mean inventing — it means fuller reasoning over the SAME facts and findings. Stay grounded.`

function consultantSchema() {
  return {
    type: 'object', additionalProperties: false,
    required: ['executive_diagnosis','one_line_priority','ai_understands','ai_cannot_connect','work_plan','top_moves','next_opportunities','what_not_to_do_yet'],
    properties: {
      executive_diagnosis: { type: 'string' },
      one_line_priority: { type: 'string' },
      ai_understands: { type: 'array', items: { type: 'string' } },
      ai_cannot_connect: { type: 'array', items: { type: 'string' } },
      work_plan: {
        type: 'object', additionalProperties: false,
        required: ['quick_wins','strategic_projects'],
        properties: {
          quick_wins: { type: 'array', items: { type: 'string' } },
          strategic_projects: { type: 'array', items: { type: 'string' } },
        },
      },
      top_moves: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['title','why_this_priority','why_ai_cares','what_to_build','build_type','sections_to_add','implementation_steps','questions_to_answer','affected_searches','expected_ai_effect','success_criteria','reasoning','evidence','confidence','effort','priority'],
          properties: {
            title: { type: 'string' },
            why_this_priority: { type: 'string' },
            why_ai_cares: { type: 'string' },
            what_to_build: { type: 'string' },
            build_type: { type: 'string', enum: ['New page','Section on existing page','Homepage block','FAQ only'] },
            sections_to_add: { type: 'array', items: { type: 'string' } },
            implementation_steps: { type: 'array', items: { type: 'string' } },
            questions_to_answer: { type: 'array', items: { type: 'string' } },
            affected_searches: { type: 'array', items: { type: 'string' } },
            expected_ai_effect: { type: 'string' },
            success_criteria: { type: 'string' },
            reasoning: { type: 'string' },
            evidence: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'string', enum: ['High','Medium','Low'] },
            effort: { type: 'string', enum: ['Low','Medium','High'] },
            priority: { type: 'integer' },
          },
        },
      },
      next_opportunities: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['title','why','effort'],
          properties: {
            title: { type: 'string' },
            why: { type: 'string' },
            effort: { type: 'string', enum: ['Low','Medium','High'] },
          },
        },
      },
      what_not_to_do_yet: { type: 'string' },
    },
  }
}

function pathOf(u: string): string {
  try { return new URL(u).pathname.replace(/\/$/, '') || '/' } catch { return u || '' }
}

// Which page "topics" the site already has, derived from the URLs the Brain crawled.
const PAGE_TOPICS: { topic: string; re: RegExp }[] = [
  { topic: 'meetings & events', re: /(meeting|event|conference|baptist)/i },
  { topic: 'dining', re: /(restaurant|dining|bar|brasserie|afternoon-tea)/i },
  { topic: 'rooms & suites', re: /(accommodation|rooms?|suites?)/i },
  { topic: 'spa / wellness', re: /(spa|wellness)/i },
  { topic: 'weddings', re: /(wedding|civil)/i },
  { topic: 'about / story', re: /(about|story|heritage)/i },
  { topic: 'location', re: /(location|neighbourhood|directions)/i },
  { topic: 'offers', re: /(offers?|packages?)/i },
  { topic: "what's on / experiences", re: /(whats-on|experience|things-to-do)/i },
  { topic: 'contact', re: /(contact)/i },
]
function existingPages(facts: any[]): { topics: string[]; paths: string[] } {
  const paths = Array.from(new Set((facts || []).map(f => pathOf(f.page_url || '')).filter(p => p && p !== '/')))
  const topics = new Set<string>()
  for (const p of paths) for (const t of PAGE_TOPICS) if (t.re.test(p)) topics.add(t.topic)
  return { topics: [...topics], paths }
}

function buildBrief(facts: any[], findings: any[]) {
  // Human-readable evidence: the actual quote + the page it came from (not internal keys)
  const factLines = facts.slice(0, 120).map(f => {
    const q = (f.evidence_quote || '').slice(0, 120)
    const p = pathOf(f.page_url || '')
    return `[${f.category}] ${f.fact_value}${q ? `  — "${q}"` : ''}${p ? ` (${p})` : ''}`
  })
  const missingPages = findings.filter(f => f.type === 'missing_page').map(f => `MISSING PAGE: ${f.title} → affects: ${(f.affected_queries||[]).join('; ')}`)
  const weakElements = findings.filter(f => f.type === 'missing_element').map(f => `WEAK: ${f.title}`)
  const unanswered = findings.filter(f => f.type === 'unanswered_query').map(f => `UNANSWERED: ${f.title}`)
  const factCountByCat: Record<string, number> = {}
  for (const f of facts) factCountByCat[f.category] = (factCountByCat[f.category] || 0) + 1
  return { factLines, missingPages, weakElements, unanswered, factCountByCat }
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
    const { data: facts } = await sb.from('hotel_facts').select('category, fact_key, fact_value, evidence_quote, page_url, confidence').eq('brain_id', brain.id)

    let findings: any[] = []
    const { data: fRows } = await sb.from('audit_findings').select('finding_key, type, title, affected_queries, audit_run_id, created_at').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(400)
    if (fRows && fRows.length) { const lastRun = fRows[0].audit_run_id; findings = fRows.filter((r: any) => r.audit_run_id === lastRun) }

    if ((!facts || !facts.length) && !findings.length) return NextResponse.json({ error: 'No stored facts or findings for this hotel yet.' }, { status: 404 })

    const brief = buildBrief(facts || [], findings)
    const existing = existingPages(facts || [])
    const catCounts = Object.entries(brief.factCountByCat).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}: ${n}`).join(', ')
    const user = `HOTEL: ${brain.hotel_name || ''} (${brain.city || ''})

PAGES THAT ALREADY EXIST ON THE SITE (crawled): ${existing.paths.length ? existing.paths.join(', ') : '(none detected)'}
PAGE TOPICS ALREADY COVERED: ${existing.topics.length ? existing.topics.join(', ') : '(none detected)'}
→ If a topic above already has a page, NEVER say "create a [topic] page". Say "strengthen" / "add a section to" the existing page, and set build_type to "Section on existing page".

SUPPORTING FACTS PER CATEGORY: ${catCounts || '(none)'}
→ A category with only 1 incidental fact (e.g. a single yoga mention) must NOT be a top move — put it in what_not_to_do_yet or mark it Low confidence. A category may be a top move only if it has 2+ supporting facts OR a clear commercial finding (a missing/weak page tied to revenue intent).

KNOWN FACTS (what the site states, with evidence quote + page):
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
    const basedOn = { facts: (facts || []).length, findings: findings.length }

    // Persist so the AI Advisor tab can read the latest instantly (no GPT on open)
    await sb.from('hotel_consultant').insert({
      hotel_id: hotelId,
      hotel_name: brain.hotel_name,
      city: brain.city,
      based_on: basedOn,
      advisory,
    })

    return NextResponse.json({
      hotel: brain.hotel_name, city: brain.city,
      basedOn,
      advisory,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Consultant failed' }, { status: 500 })
  }
}