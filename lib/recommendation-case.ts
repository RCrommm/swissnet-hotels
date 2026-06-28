// lib/recommendation-case.ts
// The SwissNet Consulting CASE. The platform builds a deterministic input; GPT writes the
// DIAGNOSIS, the WHY, the OBJECTIVE (outcome only) and the expected result. The
// IMPLEMENTATION OPTIONS are derived DETERMINISTICALLY from the proven missing evidence —
// never invented, never a single prescription. SwissNet recommends OUTCOMES and OFFERS
// evidence-backed ways to reach them; it never dictates information architecture the audit
// did not prove (e.g. "merge into one page").

import type { Recommendation, SwissCase } from './recommendation-model'

// Every concrete, PROVEN piece of missing evidence for this Case, flattened + de-duped.
function collectMissingEvidence(rec: Recommendation): string[] {
  const out: string[] = []
  const reco = rec.recommendability
  if (reco) {
    for (const x of [...(reco.partially_answerable || []), ...(reco.not_answerable || [])]) {
      for (const e of (x.evidence_needed || [])) out.push(String(e).trim())
    }
  }
  for (const m of (rec.audit.missing_information || [])) out.push(String(m).trim())
  return [...new Set(out.filter(Boolean))]
}

// DETERMINISTIC implementation MENU. Each option is a different WAY to carry the proven
// missing evidence; the hotel chooses. We never claim the page STRUCTURE is wrong unless
// the connection itself is the proven gap (Convert posture / explicit connection signal).
// No GPT here — every option is a function of real audit fields, so nothing is invented.
export function deriveImplementationOptions(rec: Recommendation): { label: string; detail: string }[] {
  const missing = collectMissingEvidence(rec)
  const topic = (rec.targeting.affected_entity || 'this area').toString().toLowerCase()
  const posture = rec.identity.posture
  const pageCount = (rec.knowledge_graph?.fact_pages || []).length
  const opts: { label: string; detail: string }[] = []

  // A — expand in place: the default that changes NO page structure.
  if (missing.length) {
    opts.push({
      label: `Add the missing detail to your existing ${topic} page${pageCount > 1 ? 's' : ''}`,
      detail: `Write these directly into the pages you already have — ${missing.slice(0, 4).join('; ')}.`,
    })
  }

  // B — connect: ONLY when the relationship itself is the proven gap (never for a Commit strength).
  const blob = (missing.join(' ') + ' ' + topic).toLowerCase()
  const connectionGap = posture === 'Convert' || /\b(one destination|as one|together|relationship|connect|unclear)\b/.test(blob)
  if (connectionGap && posture !== 'Commit') {
    opts.push({
      label: `Tie your ${topic} pages together with a short overview`,
      detail: `Add a single ${topic} overview that links to each page, so the experience reads as one — your existing pages can stay exactly where they are.`,
    })
  }

  // C — answer directly: ONLY when there are genuinely unanswered guest questions.
  if ((rec.audit.failed_queries || []).length > 0) {
    opts.push({
      label: 'Answer the questions guests actually ask',
      detail: 'Surface the missing facts as clear questions and answers on the page, the way a guest would ask them.',
    })
  }

  // D — machine-readability: ONLY when a technical cause was actually found.
  const tech = (rec.technical?.causes || []).map(c => c.fix).filter(Boolean)
  if (tech.length) {
    opts.push({
      label: 'Strengthen the behind-the-scenes data',
      detail: `Make the information machine-readable so AI can use it reliably — ${tech.slice(0, 2).join('; ')}.`,
    })
  }

  return opts.slice(0, 4)
}

// Deterministic: map a canonical recommendation -> the structured Case input GPT receives.
export function buildCaseInput(rec: Recommendation) {
  const POSTURE_MEANING: Record<string,string> = {
    Commit: 'This topic is ALREADY well-organised and is a strength — the goal is to lock in and deepen that lead, NOT to fix scattering. Do NOT describe it as scattered or broken.',
    Convert: 'This topic has real substance but AI does not yet read it as ONE connected experience — the goal is for AI to understand the relationship between its parts. This does NOT mean the pages must be merged into one.',
    'Fix-foundation': 'This is a site-wide trust/structure gap, NOT a single-topic content problem.',
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
    // The OBJECTIVE must name the PROVEN missing evidence — never a website mechanism.
    objective_facts: {
      topic: rec.targeting.affected_entity,
      posture: rec.identity.posture,
      missing_evidence: collectMissingEvidence(rec).slice(0, 6),
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

- "diagnosis": ONE memorable sentence — the line the GM repeats after the meeting. An OBSERVATION about the hotel, never an action, never technical. Respect "posture_meaning": a Commit topic is a STRENGTH ("AI already understands your rooms better than almost anything else about the hotel — but can't yet answer the booking questions guests ask most"); a Convert topic is a strong asset AI can't yet read as one connected experience ("Your dining is one of your strongest assets, but AI doesn't yet understand it as one destination"); a Fix-foundation gap is practical questions going unanswered. Never call a Commit topic scattered or broken. When "recommendability" fields are present, anchor the diagnosis in what AI can do for this topic before what it can't — strength first. ai_can_already = AI can fully do this; ai_partly_can = AI can partly do this but the evidence is thin; ai_cannot_yet = AI cannot do this. If ai_can_already is empty but ai_partly_can is not, lead with the partial strength honestly, NOT with "AI can't do anything". Phrase everything as plain traveller intents (romantic escape, executive meeting, food-led trip), never as website mechanics. Only claim AI "cannot" do something that is genuinely in ai_cannot_yet.

- "business_consequence": ONE or TWO sentences on why it matters commercially. Name the kind of guest searches the hotel loses today, drawn from the supplied failed questions. Plain language, no metrics.

- "objective": ONE or TWO sentences naming the OUTCOME to reach — what AI should be able to confidently do for guests once the gap is closed — and the concrete evidence that is missing (from objective_facts.missing_evidence). Describe the GOAL and the missing evidence; NEVER prescribe HOW to structure the website. This is the most important rule: do NOT say "create one page", "merge pages", "combine into a single page", "build a hub", "add an FAQ", "add a section", or name ANY single website solution. The hotel chooses HOW; you define WHAT success looks like and WHAT evidence is missing. GOOD: "Give AI enough about your dining — each venue's cuisine and character, the signature experiences, and how they connect — that it can confidently present you as a dining destination rather than three separate venues." BAD: "Merge your restaurants and afternoon tea into one Dining page." The good version names the outcome and the missing evidence; the bad version prescribes an information-architecture solution the audit never proved.

- "expected_result": ONE sentence on what changes for guests — what AI will be able to answer or recommend that it can't today.

VOICE: senior consultant. Confident, specific, warm, brief. Assume authority — say "AI already understands…", "Guests can't currently…", "The goal is…". Never "the analysis indicates" or "this is based on". Every sentence specific to THIS hotel. If a sentence could apply to any hotel, rewrite it. Aim for roughly a third fewer words than feels natural — cut everything that doesn't help the GM decide.`

export function caseSchema() {
  return {
    type: 'object', additionalProperties: false,
    required: ['diagnosis', 'business_consequence', 'objective', 'expected_result'],
    properties: {
      diagnosis: { type: 'string' },
      business_consequence: { type: 'string' },
      objective: { type: 'string' },
      expected_result: { type: 'string' },
    },
  }
}

// Generate the Case. GPT writes the prose sections; the implementation options are derived
// deterministically (never invented). Returns the SwissCase plus objective + options.
export async function buildCase(
  rec: Recommendation,
  openaiKey: string,
): Promise<SwissCase & { objective: string; implementation_options: { label: string; detail: string }[] }> {
  const input = buildCaseInput(rec)
  const proof = buildProof(rec)
  const options = deriveImplementationOptions(rec)
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
    const objective = parsed.objective || ''
    return {
      diagnosis: parsed.diagnosis || '',
      business_consequence: parsed.business_consequence || '',
      objective,
      recommendation: objective, // back-compat: anything still reading .recommendation gets the objective
      implementation_options: options,
      expected_result: parsed.expected_result || '',
      proof,
    }
  } catch {
    // deterministic fallback — still grounded, never invented
    const objective = rec.prose.expected_outcome || rec.prose.business_reasoning || ''
    return {
      diagnosis: `${rec.targeting.affected_entity} content is ${rec.knowledge_graph.cluster_state} across ${rec.knowledge_graph.fact_pages.length} page(s).`,
      business_consequence: rec.audit.failed_queries.length ? `AI currently cannot answer ${rec.audit.failed_queries.length} guest question(s) about ${rec.targeting.affected_entity.toLowerCase()}.` : '',
      objective,
      recommendation: objective,
      implementation_options: options,
      expected_result: rec.prose.expected_outcome || '',
      proof,
    }
  }
}