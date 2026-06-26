import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { classifyGap, inferTopic } from '@/lib/evidence'
import { decideAction } from '@/lib/decision'
import { buildVisibilityModel } from '@/lib/visibility-model'
import { buildKnowledgeGraph } from '@/lib/knowledge-graph'
import { buildTechnicalReadiness } from '@/lib/technical-readiness'
import { assembleRecommendation } from '@/lib/recommendation'
import { PROSE_SYSTEM, proseSchema, buildProseInput, OPENING_SYSTEM, openingSchema, buildOpeningInput, attachSequence } from '@/lib/recommendation-prose'

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
1. RELEVANCE GATE — Only rank something a TOP MOVE if the hotel clearly HAS that offer (2+ supporting facts) OR there is a clear commercial finding for it. A single incidental mention (e.g. one yoga class) is NOT a wellness product — put it in what_not_to_do_yet or mark it Low confidence, never a top priority.
1a. EVIDENCE-STATE RULE (CRITICAL) — Some findings are marked "UNVERIFIED — NOT CRAWLED". This means the audit never read a page for that topic, so the system does NOT know whether the hotel offers it. You MUST NOT recommend CREATING a page for an unverified-not-crawled topic, and MUST NOT state or imply the hotel lacks it. Absence from the crawl is NOT absence from the hotel. For these, the correct move is to VERIFY: title it like "Confirm and surface your [topic] offering", build_type "Section on existing page" or "New page" ONLY if the hotel confirms they offer it, and phrase why_this_priority around "we could not verify this from your site — confirm whether you offer it; if you do, it needs a crawlable page so AI can find it." A finding marked "LIKELY GAP — CRAWLED, NOT FOUND" CAN justify creating a page (we looked where it would be and found nothing). Never treat NOT-CRAWLED and CRAWLED-NOT-FOUND the same way.
1b. EXISTING-PAGE AWARENESS — You are told which page topics already exist. If a page for THIS MOVE'S topic already exists, recommend strengthening it (build_type "Section on existing page") and name that page in what_to_build. If the topic has NO existing page of its own, recommend a New page — do NOT graft the topic onto an unrelated existing page just to avoid creating one (e.g. never put wedding/romantic content on the Meetings & Events page, or family content on a Dining page). Match the recommendation to the page whose subject actually fits: strengthen when the right page exists, create when it genuinely doesn't. Recommending creation of a page that already exists destroys trust; so does housing a topic on a page where a guest would never look for it.
2. COMMERCIAL INTENT — Rank by what drives bookings. Revenue-driving intents come first: rooms, dining, meetings, weddings, business, location, luxury, romantic. Then offers, family, wellness. Practical trust pages (accessibility, parking, pets) matter for completeness but are hygiene, NOT flagship strategic moves — only elevate one if it is a clear booking dealbreaker for this hotel.
3. PAGE vs SECTION — Do NOT default to "create a page". If the hotel already has related content, the right fix is often a homepage Quick-Facts block, an FAQ answer, or a section on an existing page. Recommend the SMALLEST fix that unlocks the searches, and say which (page / section / FAQ / Quick-Facts).
4. JUSTIFY THE RANK — Each top move's reasoning must answer "why this before the other findings?", referencing how many guest searches it unlocks AND its commercial importance.
5. Return the 3 (at most 4) highest-leverage moves only — never a long list.

EVIDENCE-STATE CONTRACT (MANDATORY — every move MUST set these three fields honestly):
- "evidence_state": one of "confirmed" | "unverified" | "contradicted".
    • "confirmed" = the KNOWN FACTS contain 2+ substantive, on-topic facts that establish the hotel genuinely offers this (e.g. multiple dining facts naming the restaurant). Only "confirmed" may build/strengthen/generate.
    • "unverified" = you CANNOT establish from the facts that the hotel offers this. Use this when the topic has zero facts, only 1 incidental mention, or facts that appear ONLY on utility pages (news, reservation, careers) — i.e. the Knowledge Graph marks it contaminated/absent. A single yoga mention = unverified, NOT confirmed.
    • "contradicted" = the facts actively conflict (the site says two incompatible things).
- "evidence_reason": one of "confirmed_facts" (for confirmed) | "unseen" (no page crawled) | "absent" (looked, found nothing) | "contaminated" (facts only on utility pages) | "insufficient_evidence" (too thin to confirm).
- "allowed_actions": the actions this evidence permits. If evidence_state is "confirmed": choose from ["strengthen_page","create_page","add_section","add_faq","add_schema"]. If "unverified": MUST be exactly ["verify"]. If "contradicted": MUST be exactly ["investigate","verify"].
- CRITICAL: a move's build_type and title may be phrased nicely, but evidence_state is the binding field. NEVER mark a topic "confirmed" to justify creating a page when the facts are thin or incidental. When in doubt, mark "unverified". The system will REFUSE to generate content for unverified/contradicted moves — so honesty here protects the hotel from fabricated content.

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
      "evidence_state": "confirmed"|"unverified"|"contradicted",
      "evidence_reason": "confirmed_facts"|"unseen"|"absent"|"contaminated"|"insufficient_evidence",
      "allowed_actions": [string],
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
          required: ['title','why_this_priority','why_ai_cares','what_to_build','build_type','evidence_state','evidence_reason','allowed_actions','sections_to_add','implementation_steps','questions_to_answer','affected_searches','expected_ai_effect','success_criteria','reasoning','evidence','confidence','effort','priority'],
          properties: {
            title: { type: 'string' },
            why_this_priority: { type: 'string' },
            why_ai_cares: { type: 'string' },
            what_to_build: { type: 'string' },
            build_type: { type: 'string', enum: ['New page','Section on existing page','Homepage block','FAQ only'] },
            evidence_state: { type: 'string', enum: ['confirmed','unverified','contradicted'] },
            evidence_reason: { type: 'string', enum: ['confirmed_facts','unseen','absent','contaminated','insufficient_evidence'] },
            allowed_actions: { type: 'array', items: { type: 'string' } },
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

// ─── STRUCTURAL DIAGNOSIS: pull the audit's page-structure + answerability findings ───
// Deterministic, no GPT. Feeds the consultant the audit's real analysis so recommendations
// cover structure and prompt-answerability, not just topic gaps. Reads hotel_audits.result.
function buildAuditBrief(result: any): { weakPages: string[]; unanswered: string[]; contentWeak: string[]; auditScore: number | null } {
  if (!result || typeof result !== 'object') return { weakPages: [], unanswered: [], contentWeak: [], auditScore: null }
  const weakPages: string[] = []
  for (const p of (result.importantPages || [])) {
    if (p.status !== 'Present') continue
    const missing = Array.isArray(p.missing) ? p.missing : []
    if (typeof p.score === 'number' && p.score < 75 && missing.length) {
      const aff = (p.affects || []).slice(0, 3).join('; ')
      weakPages.push(`${p.displayName || p.label} (${pathOf(p.url || '')}, score ${p.score}/100) is missing: ${missing.join(', ')}.${aff ? ` Blocks searches: ${aff}` : ''}`)
    }
  }
  const unanswered: string[] = []
  for (const r of (result.recommendation?.results || [])) {
    if (r.readiness === 'NO' || r.readiness === 'PARTIAL') {
      const why = (r.reasons || []).slice(0, 2).join('; ')
      unanswered.push(`[${r.readiness}] "${r.question}" (${r.category})${why ? ` — ${why}` : ''}`)
    }
  }
  const contentWeak: string[] = []
  const cq = result.contentQuality
  if (cq && Array.isArray(cq.categories)) {
    for (const c of cq.categories) {
      if (typeof c.score === 'number' && c.score < 70) contentWeak.push(`${c.name || c.label || c.category || 'content'}: ${c.score}/100${c.issue ? ` — ${c.issue}` : ''}`)
    }
  }
  const auditScore = typeof result.recommendation?.score === 'number' ? result.recommendation.score : (typeof result.architectureScore === 'number' ? result.architectureScore : null)
  return { weakPages: weakPages.slice(0, 12), unanswered: unanswered.slice(0, 18), contentWeak: contentWeak.slice(0, 8), auditScore }
}

// ─── EVIDENCE-STATE RECONCILIATION ───
// The Knowledge Graph is the source of truth for evidence_state, NOT GPT.
// absent → unverified. contaminated + thin (<=2 facts) → unverified.
// Real offerings (enough facts) keep GPT's emitted state. GPT never overrides the graph.
const RECON_TOPIC_RE: { kgTopic: string; re: RegExp }[] = [
  { kgTopic: 'meetings', re: /(meeting|business|conference|event|baptist|corporate)/i },
  { kgTopic: 'dining',   re: /(dining|restaurant|bar|brasserie|afternoon[- ]?tea|cuisine|food)/i },
  { kgTopic: 'spa',      re: /(spa|wellness|wellbeing|thermal)/i },
  { kgTopic: 'weddings', re: /(wedding|romance|romantic|honeymoon|civil|ceremon|couple)/i },
  { kgTopic: 'family',   re: /(family|kids|children)/i },
  { kgTopic: 'rooms',    re: /(rooms?|suites?|accommodation)/i },
  { kgTopic: 'location', re: /(location|neighbourhood|attractions?|transport)/i },
]
function reconcileEvidenceState(move: any, knowledgeGraph: any): { evidence_state: string; evidence_reason: string } {
  const gptState = (move?.evidence_state === 'confirmed' || move?.evidence_state === 'contradicted') ? move.evidence_state : 'unverified'
  const blob = `${move?.title || ''} ${move?.what_to_build || ''}`.toLowerCase()
  const topic = RECON_TOPIC_RE.find(t => t.re.test(blob))?.kgTopic || null
  const cluster = topic && knowledgeGraph?.clusters ? knowledgeGraph.clusters.find((c: any) => c.topic === topic) : null
  if (!cluster) return { evidence_state: gptState, evidence_reason: move?.evidence_reason || (gptState === 'confirmed' ? 'confirmed_facts' : 'insufficient_evidence') }
  const factCount = cluster.facts || 0
  if (cluster.cluster_state === 'absent') return { evidence_state: 'unverified', evidence_reason: 'absent' }
  if (cluster.cluster_state === 'contaminated' && factCount <= 2) return { evidence_state: 'unverified', evidence_reason: 'contaminated' }
  return { evidence_state: gptState, evidence_reason: move?.evidence_reason || (gptState === 'confirmed' ? 'confirmed_facts' : 'insufficient_evidence') }
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
  // The crawled-page list = the pages the Brain actually read (from fact URLs).
  const pagesScraped = Array.from(new Set((facts || []).map(f => f.page_url || '').filter(Boolean)))
  // ── EVIDENCE GUARD: a "missing_page" finding is only a real gap if the page-type
  // was actually crawled. If we never crawled it, we CANNOT say the hotel lacks it —
  // so frame it as VERIFY, not CREATE. Absence from crawl ≠ absence from hotel.
  const missingPages = findings.filter(f => f.type === 'missing_page').map(f => {
    // prefer a stored evidence_state if the audit already computed one; else derive it
    let state = f.evidence_state as string | undefined
    let reason = f.evidence_reason as string | undefined
    const topic = inferTopic('', f.title, [])
    if (!state && topic) { const ev = classifyGap(topic, pagesScraped, facts); state = ev.evidence_state; reason = ev.reason || undefined }
    const aff = (f.affected_queries || []).join('; ')
    if (state === 'unverified' && reason === 'unseen') {
      return `UNVERIFIED — NOT CRAWLED: No ${topic || 'such'} page was among the pages we read, so we CANNOT confirm whether the hotel offers ${topic || 'this'}. Recommend VERIFYING the offering (a "confirm whether you offer X" move), NOT creating a page as if it is absent. Affected searches: ${aff}`
    }
    if (state === 'unverified' && reason === 'absent') {
      return `LIKELY GAP — CRAWLED, NOT FOUND: pages where ${topic || 'this'} would appear were crawled but none confirmed it; a new page may be justified. Affects: ${aff}`
    }
    return `MISSING PAGE: ${f.title} → affects: ${aff}`
  })
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

    // Load the latest audit's STRUCTURAL diagnosis (page structure + answerability) and integrate it.
    let auditBrief = { weakPages: [] as string[], unanswered: [] as string[], contentWeak: [] as string[], auditScore: null as number | null }
    let latestAuditResult: any = null
    try {
      const { data: auditRow } = await sb.from('hotel_audits').select('result').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1).single()
      if (auditRow?.result) { latestAuditResult = auditRow.result; auditBrief = buildAuditBrief(auditRow.result) }
    } catch {}

    // ── AI VISIBILITY MODEL: compute how AI currently "sees" the hotel (deterministic) ──
    const visibilityModel = buildVisibilityModel(facts || [], latestAuditResult)

    // ── KNOWLEDGE GRAPH: the site's information architecture (deterministic) ──
    // The consultant CONSUMES this instead of re-inferring website structure.
    const knowledgeGraph = buildKnowledgeGraph(facts || [], latestAuditResult)

    // ── TECHNICAL AI-READINESS: schema, retrieval blocks, trust signals (from architecture block) ──
    const technical = buildTechnicalReadiness(latestAuditResult)
    const techLines = technical.findings.map(f => `[${f.severity}] ${f.layer} → ${f.action}: ${f.fix} (${f.evidence})`)
    // Compact lines the consultant reasons over: only clusters that need action.
    const graphLines = knowledgeGraph.clusters
      .filter(c => c.cluster_state !== 'consolidated' && c.cluster_state !== 'absent')
      .sort((a, b) => (a.commercial_importance === 'High' ? 0 : 1) - (b.commercial_importance === 'High' ? 0 : 1))
      .map(c => `${c.label} [${c.cluster_state.toUpperCase()}, health ${c.cluster_health}/100, ${c.commercial_importance} importance] → ${c.recommendation}: ${c.explanation}`)

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
${brief.unanswered.join('\n')}

STRUCTURAL DIAGNOSIS FROM THE WEBSITE AUDIT${auditBrief.auditScore != null ? ` (overall AI-readiness ${auditBrief.auditScore}/100)` : ''}:
These are the audit's measured findings about HOW the existing pages are built and which guest questions the site cannot answer. Use them: a recommendation to "strengthen" a page should name the SPECIFIC missing sections below, and a top move should unlock the unanswered questions below.

WEAK EXISTING PAGES (already crawled — strengthen these, don't recreate them):
${auditBrief.weakPages.length ? auditBrief.weakPages.join('\n') : '(none flagged)'}

GUEST QUESTIONS THE SITE CANNOT CONFIDENTLY ANSWER (AI-answerability gaps):
${auditBrief.unanswered.length ? auditBrief.unanswered.join('\n') : '(none flagged)'}

CONTENT-QUALITY WEAK SPOTS:
${auditBrief.contentWeak.length ? auditBrief.contentWeak.join('\n') : '(none flagged)'}

WEBSITE KNOWLEDGE GRAPH — how the site's information is ARCHITECTURALLY organised:
This is the deterministic analysis of where each topic's facts live and whether AI can form a clean concept. Use it to choose between CONSOLIDATE (facts exist but are scattered — move them onto the canonical page, don't create a new one) vs CREATE (no canonical page exists at all) vs STRENGTHEN (canonical page exists but answerability is weak). A "scattered" topic that already has a canonical page must be CONSOLIDATED, never recreated. A "contaminated" topic (facts only on utility pages like /news or /reservation) needs a real canonical page. When you recommend a move, NAME the architectural problem from below.
${graphLines.length ? graphLines.join('\n') : '(all commercial clusters are well-consolidated)'}

TECHNICAL AI-READINESS GAPS${technical.techScore != null ? ` (technical AI-readiness ${technical.techScore}/100)` : ''}:
These are MACHINE-READABILITY gaps — how well AI systems can parse, trust, and retrieve the site, separate from content. They include missing schema (FAQPage, Review, Restaurant, Event), missing structured retrieval blocks (Quick Facts, AI summary), and missing trust signals. Where relevant, fold these into your moves: a content move to strengthen a page should ALSO note the schema/structured-block it needs (e.g. "add FAQPage schema"). High-severity technical gaps that stand alone (like missing Review schema) can be their own quick-win move with build_type "FAQ only" or a schema note. Do not invent technical detail beyond what's listed.
${techLines.length ? techLines.join('\n') : '(no technical gaps flagged)'}`

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
    // ─── DECISION LAYER: deterministically attach a concrete action to each move ───
    // Execute consumes move.decision.action / .target / .generate mechanically.
    const pagesScraped = Array.from(new Set((facts || []).map((f: any) => f.page_url || '').filter(Boolean)))
    if (Array.isArray(advisory?.top_moves)) {
      for (const m of advisory.top_moves) {
        // 1) GRAPH OVERRIDES GPT: compute the TRUE evidence_state before anything consumes it
        try {
          const rec = reconcileEvidenceState(m, knowledgeGraph)
          m.evidence_state = rec.evidence_state
          m.evidence_reason = rec.evidence_reason
        } catch {}
        // 2) decision obeys the reconciled evidence_state
        try { m.decision = decideAction(m, pagesScraped, facts || []) } catch { m.decision = null }
        // 3) assemble the complete recommendation from the (now honest) state
        try { m.recommendation = assembleRecommendation(m, { visibilityModel, knowledgeGraph, technical, auditBrief }) } catch { m.recommendation = null }
      }
      // 4) STAGE 2 — prose: GPT explains each ASSEMBLED object (never raw facts), gated by evidence_state
      await Promise.all(advisory.top_moves.map(async (m: any) => {
        if (!m.recommendation) return
        try {
          const pr = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
            body: JSON.stringify({
              model: 'gpt-4o', temperature: 0.3, max_tokens: 700,
              response_format: { type: 'json_schema', json_schema: { name: 'prose', strict: true, schema: proseSchema() } },
              messages: [
                { role: 'system', content: PROSE_SYSTEM },
                { role: 'user', content: 'Recommendation object:\n' + buildProseInput(m.recommendation) + '\n\nReturn only the JSON.' },
              ],
            }),
          })
          const pd = await pr.json()
          const pc = pd?.choices?.[0]?.message?.content
          if (pc) m.recommendation.prose = JSON.parse(pc)
        } catch { m.recommendation.prose = null }
      }))

      // 5) STAGE 3 — sequence labels/transitions (deterministic) + one grounded opening paragraph
      attachSequence(advisory.top_moves)
      try {
        const or = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o', temperature: 0.3, max_tokens: 300,
            response_format: { type: 'json_schema', json_schema: { name: 'opening', strict: true, schema: openingSchema() } },
            messages: [
              { role: 'system', content: OPENING_SYSTEM },
              { role: 'user', content: 'Computed briefing inputs:\n' + buildOpeningInput(visibilityModel, advisory.top_moves) + '\n\nReturn only the JSON.' },
            ],
          }),
        })
        const od = await or.json()
        const oc = od?.choices?.[0]?.message?.content
        if (oc) advisory.briefing_opening = JSON.parse(oc).opening
      } catch { advisory.briefing_opening = null }
    }
    const basedOn = { facts: (facts || []).length, findings: findings.length }
    // attach the visibility model + knowledge graph onto the advisory so it stores with it
    advisory.visibility_model = visibilityModel
    advisory.knowledge_graph = knowledgeGraph
    advisory.technical_readiness = technical

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
