import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { factsSupport } from '@/lib/evidence'

export const maxDuration = 120

// ─── EXECUTE V1 — grounded FAQ generation, the first advise→execute loop ───
// Reads the latest advisory, selects CONFIRMED page moves, and generates FAQs
// grounded ONLY in confirmed Brain facts. Any FAQ that can't be answered from a
// fact is DROPPED, never invented. Saves as status='suggested' (human approves).
// Never publishes to the hotel's own site. No schema, no full pages in V1.

const ELIGIBLE_ACTIONS = new Set(['add_faq', 'strengthen_page', 'create_page', 'add_section'])

const FAQ_SYSTEM = `You generate FAQ question-and-answer pairs for ONE luxury hotel, to improve how AI assistants answer guest questions about it. You are given a TOPIC, the guest QUESTIONS to address, and the hotel's CONFIRMED FACTS about that topic (each with an evidence quote and source page).

IRON RULES — these define whether you are trustworthy:
- Answer EVERY FAQ using ONLY the confirmed facts provided. NEVER invent, infer, or embellish: no prices, numbers, names, services, hours, or claims that aren't in the facts.
- If a question CANNOT be fully answered from the confirmed facts, DROP it entirely — do not include it, do not answer it partially with a guess. A dropped question is correct behaviour, not a failure.
- Each answer must be specific to THIS hotel and traceable to a fact. Quote or closely paraphrase the evidence.
- Write 3-6 FAQs maximum, only as many as the facts genuinely support. Returning fewer (even zero) is correct when facts are thin.
- Keep answers concise, factual, and quotable — the way you'd want an AI assistant to read them.

Return a JSON object: { "faqs": [ { "question": string, "answer": string } ] }. Include ONLY grounded FAQs. If none can be grounded, return an empty array.`

function faqSchema() {
  return {
    type: 'object', additionalProperties: false, required: ['faqs'],
    properties: {
      faqs: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false, required: ['question', 'answer'],
          properties: { question: { type: 'string' }, answer: { type: 'string' } },
        },
      },
    },
  }
}

function pathOf(u: string): string {
  try { return new URL(u).pathname.replace(/\/$/, '') || '/' } catch { return u || '' }
}

// Infer the topic a move is about, so we can gather its confirmed facts.
function moveTopic(title: string): string | null {
  const t = (title || '').toLowerCase()
  if (/(meeting|business|corporate|conference|event|baptist|venue)/.test(t)) return 'meetings'
  if (/(dining|restaurant|cuisine|bar|afternoon.tea)/.test(t)) return 'dining'
  if (/(spa|wellness)/.test(t)) return 'spa'
  if (/(family|kids|children)/.test(t)) return 'family'
  if (/(romantic|honeymoon|wedding|couple)/.test(t)) return 'weddings'
  if (/(room|suite|accommodation)/.test(t)) return 'rooms'
  return null
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

    // Latest advisory (carries the decisions) + Brain facts
    const { data: brain } = await sb.from('hotel_brains').select('id, hotel_name').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    const { data: facts } = brain ? await sb.from('hotel_facts').select('category, fact_value, evidence_quote, page_url').eq('brain_id', brain.id) : { data: [] as any[] }
    const { data: advRow } = await sb.from('hotel_consultant').select('advisory, created_at').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    const advisory = advRow?.advisory
    if (!advisory?.top_moves?.length) return NextResponse.json({ error: 'No advisory with moves found. Generate the advisory first.' }, { status: 404 })

    const generated: any[] = []
    const refused: any[] = []

    for (const move of advisory.top_moves) {
      const d = move.decision || {}
      // Eligibility: an eligible action AND confirmed evidence. Everything else refused.
      if (!ELIGIBLE_ACTIONS.has(d.action) || d.evidence_state !== 'confirmed') {
        refused.push({ move: move.title, reason: `${d.action || 'no-action'} / ${d.evidence_state || 'no-evidence'} — not confirmed page work` })
        continue
      }
      const topic = moveTopic(move.title)
      if (!topic) { refused.push({ move: move.title, reason: 'topic not recognized' }); continue }

      // Confirmed facts for this topic only — the sole grounding material.
      const supportPaths = factsSupport(facts || [], topic)
      const topicFacts = (facts || []).filter((f: any) => {
        const p = pathOf(f.page_url || '')
        return supportPaths.includes(p) || (f.category || '').toLowerCase() === topic
      })
      if (!topicFacts.length) { refused.push({ move: move.title, reason: 'no confirmed facts for topic' }); continue }

      const factLines = topicFacts.slice(0, 40).map((f: any) => `[${f.category}] ${f.fact_value}${f.evidence_quote ? `  — "${(f.evidence_quote || '').slice(0, 160)}"` : ''}${f.page_url ? ` (${pathOf(f.page_url)})` : ''}`)
      const questions = (move.questions_to_answer || []).slice(0, 8)
      const user = `TOPIC: ${topic}
HOTEL: ${brain?.hotel_name || ''}

GUEST QUESTIONS TO ADDRESS (only answer the ones the facts support; drop the rest):
${questions.length ? questions.map((q: string) => `- ${q}`).join('\n') : '- (none specified; generate FAQs only where facts clearly support a guest question)'}

CONFIRMED FACTS (the ONLY material you may use):
${factLines.join('\n')}`

      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o', temperature: 0.2, max_tokens: 1200,
            response_format: { type: 'json_schema', json_schema: { name: 'faqs', strict: true, schema: faqSchema() } },
            messages: [{ role: 'system', content: FAQ_SYSTEM }, { role: 'user', content: user }],
          }),
        })
        const data = await res.json()
        const c = data?.choices?.[0]?.message?.content
        const parsed = c ? JSON.parse(c) : { faqs: [] }
        const faqs = (parsed.faqs || []).filter((f: any) => f?.question?.trim() && f?.answer?.trim()).slice(0, 6)
        if (!faqs.length) { refused.push({ move: move.title, reason: 'no FAQs could be grounded in confirmed facts' }); continue }

        // Save into the EXECUTION QUEUE (not the live FAQ table) so the Optimise
        // tab's delete-and-replace can never wipe proposed work. page_type = topic bucket.
        const pageType = topic === 'meetings' ? 'events' : topic
        const evidenceUsed = topicFacts.slice(0, 12).map((f: any) => ({ fact: f.fact_value, quote: (f.evidence_quote || '').slice(0, 200), page: pathOf(f.page_url || '') }))
        const rows = faqs.map((f: any) => ({
          hotel_id: hotelId,
          hotel_name: brain?.hotel_name || '',
          artifact_type: 'faq',
          page_type: pageType,
          question: f.question.trim(),
          answer: f.answer.trim(),
          decision_action: d.action || null,
          decision_target: d.target || null,
          source_advisory_at: advRow?.created_at || null,
          source_brain_id: brain?.id || null,
          evidence_used: evidenceUsed,
          status: 'suggested',
        }))
        await sb.from('execution_queue').insert(rows)
        generated.push({ move: move.title, topic, count: faqs.length, faqs })
      } catch (e: any) {
        refused.push({ move: move.title, reason: `generation error: ${e?.message || 'failed'}` })
      }
    }

    return NextResponse.json({
      hotel: brain?.hotel_name,
      generated,
      refused,
      summary: { movesGenerated: generated.length, faqsCreated: generated.reduce((s, g) => s + g.count, 0), movesRefused: refused.length },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Execute failed' }, { status: 500 })
  }
}