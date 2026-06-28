// lib/recommendation-case.ts
// The SwissNet Consulting CASE: every recommendation becomes a 5-section case.
// Platform builds the deterministic input; GPT writes each section from its field ONLY.
// No new facts. Senior hospitality consultant voice.

import type { Recommendation, SwissCase } from './recommendation-model'

// Deterministic: map a canonical recommendation -> the structured Case input GPT receives.
export function buildCaseInput(rec: Recommendation) {
  const POSTURE_MEANING: Record<string,string> = {
    Commit: 'This topic is ALREADY well-organised on a single canonical page and is a strength — the goal is to lock in and deepen that lead, NOT to fix scattering. Do NOT describe it as scattered or broken.',
    Convert: 'This topic has real substance but it is SCATTERED across multiple pages with no single hub — the goal is to consolidate it.',
    'Fix-foundation': 'This is a site-wide trust/structure gap (schema, structured blocks), NOT a single-topic content problem.',
    Confirm: 'The platform could NOT verify this offering exists — the goal is to verify, not to assert it is missing.',
  }
  return {
    topic: rec.targeting.affected_entity,
    posture: rec.identity.posture,
    posture_meaning: POSTURE_MEANING[rec.identity.posture] || '',
    diagnosis_facts: {
      kg_state: rec.knowledge_graph.cluster_state,
      scattered_pages: rec.knowledge_graph.fact_pages,
      canonical_page: rec.targeting.canonical_page,
      ai_understands: rec.evidence.facts.length > 0,
    },
    consequence_facts: {
      failed_query_count: rec.audit.failed_queries.length,
      example_failed: rec.audit.failed_queries.slice(0, 3),
      coverage_pct: rec.audit.coverage_pct,
    },
    recommendability: rec.recommendability ? {
      ai_can_already: rec.recommendability.answerable.slice(0, 4),
      ai_partly_can: rec.recommendability.partially_answerable.slice(0, 4).map(x => x.intent),
      ai_cannot_yet: rec.recommendability.not_answerable.slice(0, 4).map(x => x.intent),
    } : null,
    action_facts: {
      action: rec.identity.action,
      posture: rec.identity.posture,
      canonical_page: rec.targeting.canonical_page,
      page_count: rec.knowledge_graph.fact_pages.length,
      missing_information: rec.audit.missing_information,
      technical_fixes: rec.technical.causes.map(c => c.fix),
    },
    outcome_facts: { topic: rec.targeting.affected_entity, current_coverage: rec.audit.coverage_pct },
    proof: {
      failed_queries: rec.audit.failed_queries,
      evidence_quotes: rec.evidence.facts.map(f => ({ quote: f.quote, page: f.page })),
      overlapping_pages: rec.knowledge_graph.fact_pages,
    },
  }
}

// The deterministic proof section (no GPT — verbatim evidence).
export function buildProof(rec: Recommendation): SwissCase['proof'] {
  return {
    failed_questions: rec.audit.failed_queries.slice(0, 5),
    overlapping_pages: rec.knowledge_graph.fact_pages,
    quotes: rec.evidence.facts.map(f => ({ quote: f.quote, page: f.page })),
  }
}

export const CASE_SYSTEM = `You are a senior hospitality strategy consultant writing for the General Manager of a five-star hotel. You produce ONE consulting case from supplied structured fields. You advise; you never audit.

Write FOUR short prose sections from the supplied fields ONLY. Never introduce a fact, number, page, amenity, or feature not in the fields.

THE HOTEL IS ALWAYS THE SUBJECT. Write about the hotel, never about "the platform", "the analysis", "the system", or "AI's process". You may say what AI assistants can or cannot do for the hotel's guests — that is allowed and useful.

BANNED WORDS — never appear in any section: knowledge graph, canonical page, retrieval, answerability, schema, structured data, cluster, coverage score, audit, fragment(ed/ation as jargon), optimise, leverage, utilise. If a fact only exists in those terms, translate it into plain hotel language.

SECTIONS:

- "diagnosis": ONE memorable sentence — the line the GM repeats after the meeting. An OBSERVATION about the hotel, never an action, never technical. Respect "posture_meaning": a Commit topic is a STRENGTH ("AI already understands your rooms better than almost anything else about the hotel — but can't yet answer the booking questions guests ask most"); a Convert topic is a strong asset AI can't yet see as one thing ("Your dining is one of your strongest assets, but AI doesn't yet understand it as one destination"); a Fix-foundation gap is practical questions going unanswered ("Guests ask everyday questions your website can't yet answer with confidence").Never call a Commit topic scattered or broken. When "recommendability" fields are present, anchor the diagnosis in what AI can do for this topic before what it can't — strength first. ai_can_already = AI can fully do this; ai_partly_can = AI can partly do this but the evidence is thin; ai_cannot_yet = AI cannot do this. If ai_can_already is empty but ai_partly_can is not, lead with the partial strength honestly (e.g. "AI can describe your rooms but can't yet say who they're best for"), NOT with "AI can't do anything". Phrase everything as plain traveller intents (romantic escape, executive meeting, food-led trip), never as website mechanics. Only claim AI "cannot" do something that is genuinely in ai_cannot_yet.

- "business_consequence": ONE or TWO sentences on why it matters commercially. Name the kind of guest searches the hotel loses today, drawn from the supplied failed questions. Plain language, no metrics.

- "recommendation": ONE clear action a GM could hand to their web team tomorrow. Name the REAL pages or topics from the supplied fields. It must be a single move, not a checklist. NEVER name a website mechanism (no "add an FAQ block", "add a Quick Facts section", "add schema"). Say it the way a consultant would: e.g. "Bring your restaurants, afternoon tea and private dining together into one Dining page, so the whole experience reads as one destination" — not "consolidate pages and add structured sections."

- "expected_result": ONE sentence on what changes for guests — what AI will be able to answer or recommend that it can't today.

VOICE: senior consultant. Confident, specific, warm, brief. Assume authority — say "AI already understands…", "Guests can't currently…", "We recommend…". Never "the analysis indicates" or "this is based on". Every sentence specific to THIS hotel. If a sentence could apply to any hotel, rewrite it. Aim for roughly a third fewer words than feels natural — cut everything that doesn't help the GM decide.`

export function caseSchema() {
  return {
    type: 'object', additionalProperties: false,
    required: ['diagnosis', 'business_consequence', 'recommendation', 'expected_result'],
    properties: {
      diagnosis: { type: 'string' },
      business_consequence: { type: 'string' },
      recommendation: { type: 'string' },
      expected_result: { type: 'string' },
    },
  }
}

// Generate the Case for one recommendation. GPT writes 4 prose sections; proof is deterministic.
export async function buildCase(rec: Recommendation, openaiKey: string): Promise<SwissCase> {
  const input = buildCaseInput(rec)
  const proof = buildProof(rec)
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0.35, max_tokens: 700,
        response_format: { type: 'json_schema', json_schema: { name: 'swiss_case', strict: true, schema: caseSchema() } },
        messages: [
          { role: 'system', content: CASE_SYSTEM },
          { role: 'user', content: `STRUCTURED FIELDS (write only from these):\n${JSON.stringify(input, null, 2)}` },
        ],
      }),
    })
    const data = await res.json()
    const c = data?.choices?.[0]?.message?.content
    if (!c) throw new Error('empty')
    const parsed = JSON.parse(c)
    return {
      diagnosis: parsed.diagnosis || '',
      business_consequence: parsed.business_consequence || '',
      recommendation: parsed.recommendation || '',
      expected_result: parsed.expected_result || '',
      proof,
    }
  } catch {
    // deterministic fallback — still grounded, never invented
    return {
      diagnosis: `${rec.targeting.affected_entity} content is ${rec.knowledge_graph.cluster_state} across ${rec.knowledge_graph.fact_pages.length} page(s).`,
      business_consequence: rec.audit.failed_queries.length ? `AI currently cannot answer ${rec.audit.failed_queries.length} guest question(s) about ${rec.targeting.affected_entity.toLowerCase()}.` : '',
      recommendation: rec.prose.business_reasoning || '',
      expected_result: rec.prose.expected_outcome || '',
      proof,
    }
  }
}