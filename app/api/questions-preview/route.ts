import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildDemandModel } from '@/lib/demand'
import { EXPERIENCE_BY_KEY } from '@/lib/experiences'

// DEV-ONLY preview: generates the adaptive audit questions for a hotel WITHOUT crawling,
// scoring, storing, or running the consultant. One GPT call. Zero ScrapingBee. No writes.
// Lets us validate Phase 2a (taxonomy-driven question generation) before spending credits.
// Mirrors the audit's QGEN logic exactly so what you see here is what the audit would ask.

const QGEN_SYSTEM = `You are a hotel demand strategist. Generate the real questions a guest would type into an AI assistant (ChatGPT, Perplexity, Google AI) when looking for a hotel like this one — the questions whose answers decide whether AI recommends or rejects THIS specific hotel.

You are given a DEMAND MODEL for this hotel: its confirmed archetype (e.g. Luxury City Hotel, Mountain Resort), its PRIMARY and SECONDARY experiences, and the universal guest filters. You are ALSO given the real city, pages, and amenity signals. The demand model is the SOURCE OF TRUTH for what guests care about for this hotel — weight your questions toward its PRIMARY experiences, cover its SECONDARY ones, and always include the universal filters.

RULES:
- Generate 26 to 30 questions.
- Each question gets a "category" — use EXACTLY one of the allowed categories provided in the user message (these are derived from THIS hotel's confirmed experiences plus universal filters). Never use a category outside that list.
- Weight toward the PRIMARY experiences (more questions), then SECONDARY, then the universal filters. Do NOT invent demand for experiences not in the demand model — e.g. do not ask about a spa, ski, or beach unless that experience is listed.
- Phrase questions the way a guest writes to AI, naturally including the city/area/landmarks. Mix broad and specific. Use the provided question SEEDS as inspiration for phrasing, but write natural full questions, not the seed templates verbatim.
- ALWAYS include at least one question each for the universal filters (location, practical/parking/accessibility/pets, overall fit).
- "priority": "high" for the hotel's PRIMARY experiences and the universal dealbreakers; "medium" otherwise.
- Do NOT invent named amenities the signals don't support. Ask about guest NEEDS, not claimed features.
Return STRICTLY the JSON schema.`

function qgenSchema(categories: string[]) {
  return { type: 'object', additionalProperties: false, required: ['questions'], properties: { questions: { type: 'array', items: {
    type: 'object', additionalProperties: false, required: ['question', 'category', 'priority'],
    properties: { question: { type: 'string' }, category: { type: 'string', enum: categories }, priority: { type: 'string', enum: ['high', 'medium'] } },
  } } } }
}
const EXP_TO_QCAT: Record<string, string> = { luxury: 'luxury', dining: 'dining', business: 'business', location: 'location', romantic: 'romantic', family: 'family', wellness: 'spa', trust: 'overall', ski: 'ski', hiking: 'hiking', beach: 'beach', watersports: 'watersports', golf: 'golf' }
const UNIVERSAL_QCATS = ['location', 'accessibility', 'parking', 'pets', 'overall']

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

    const { data: hotel } = await sb.from('hotels').select('name, region, location, category').eq('id', hotelId).single()
    const city = hotel?.location || hotel?.region || ''
    const { data: prof } = await sb.from('hotel_profile').select('*').eq('hotel_id', hotelId).maybeSingle()
    const demand = buildDemandModel(prof || null, { location: city })

    let categories: string[]
    let demandBlock = ''
    const fallbackUsed = demand.source !== 'confirmed_profile'
    if (!fallbackUsed) {
      const expCats = [...demand.primary, ...demand.secondary].map((k: string) => EXP_TO_QCAT[k]).filter(Boolean)
      categories = Array.from(new Set([...expCats, ...UNIVERSAL_QCATS]))
      const seedsFor = (keys: string[]) => keys.map((k: string) => { const e = EXPERIENCE_BY_KEY[k]; return e ? `${e.label}: ${(e.questionSeeds || []).join(' | ')}` : '' }).filter(Boolean).join('\n')
      demandBlock = `\nDEMAND MODEL (source of truth):\nARCHETYPE: ${demand.archetype_label}\nPRIMARY:\n${seedsFor(demand.primary) || '(none)'}\nSECONDARY:\n${seedsFor(demand.secondary) || '(none)'}\nUNIVERSAL filters: location, parking/accessibility/pets, overall fit\n`
    } else {
      categories = ['location', 'dining', 'spa', 'family', 'romantic', 'business', 'luxury', 'accessibility', 'parking', 'pets', 'overall']
      demandBlock = '\n(No confirmed hotel profile — generic demand across all standard categories.)\n'
    }

    const user = `HOTEL: ${hotel?.name || ''}\nCITY: ${city}\nTYPE: ${hotel?.category || ''}\nPAGES FOUND: (preview — pages not crawled)\nAMENITY SIGNALS: (preview — not detected)\n${demandBlock}\nALLOWED CATEGORIES (use EXACTLY these): ${categories.join(', ')}`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0.4, max_tokens: 1800,
        response_format: { type: 'json_schema', json_schema: { name: 'questions', strict: true, schema: qgenSchema(categories) } },
        messages: [{ role: 'system', content: QGEN_SYSTEM }, { role: 'user', content: user }],
      }),
    })
    const data = await res.json()
    const c = data?.choices?.[0]?.message?.content
    const parsed = c ? JSON.parse(c) : { questions: [] }
    const questions = (parsed.questions || []).map((q: any) => ({ question: q.question, category: q.category, priority: q.priority }))

    // Tally questions per category so it's easy to eyeball the weighting.
    const byCat: Record<string, number> = {}
    for (const q of questions) byCat[q.category] = (byCat[q.category] || 0) + 1

    return NextResponse.json({
      hotel: hotel?.name || hotelId,
      fallback_used: fallbackUsed,
      archetype: demand.archetype_label,
      primary_experiences: demand.primary,
      secondary_experiences: demand.secondary,
      allowed_categories: categories,
      question_count: questions.length,
      questions_by_category: byCat,
      questions,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Preview failed' }, { status: 500 })
  }
}
