// lib/recommendation-case.ts
// The SwissNet Consulting CASE: every recommendation becomes a 5-section case.
// Platform builds the deterministic input; GPT writes each section from its field ONLY.
// No new facts. Senior hospitality consultant voice.

import type { Recommendation, SwissCase } from './recommendation-model'

// Deterministic: map a canonical recommendation -> the structured Case input GPT receives.
export function buildCaseInput(rec: Recommendation) {
  return {
    topic: rec.targeting.affected_entity,
    posture: rec.identity.posture,
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

export const CASE_SYSTEM = `You are a senior hospitality strategy consultant writing for the GM of a luxury hotel. You produce ONE consulting case from supplied structured fields. You do NOT audit; you advise.

You will receive deterministic fields for one strategic decision. Write FOUR short prose sections from those fields ONLY. Never introduce a fact, number, page, or claim that is not in the supplied fields. Never invent amenities, locations, or features.

SECTIONS (return strictly the JSON schema):
- "diagnosis": ONE sentence naming ONE clear problem. State what is happening structurally (e.g. AI recognises the offering but cannot connect its scattered pages).
- "business_consequence": ONE short paragraph on why the GM should care. Ground it in the supplied failed guest questions — name the kind of searches the hotel currently loses. Connect to commercial reality (visibility, bookings, being recommended).
- "recommendation": ONE concrete action. Be specific about WHAT to do (consolidate which pages, add which sections), using the supplied action and pages. No vague "improve" language.
- "expected_result": ONE specific sentence on what changes — what AI will be able to do that it cannot today.

VOICE: senior consultant. Concise, confident, concrete. No jargon, no filler, no "leverage/optimise/utilise". Every sentence must be specific to THIS hotel's supplied facts. If a sentence could apply to any hotel, rewrite it.`

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
        model: 'gpt-4o', temperature: 0.4, max_tokens: 900,
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