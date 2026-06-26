// lib/recommendation-prose.ts
// ─── RECOMMENDATION PROSE (Stage 2 of V3) ───
// GPT receives ONLY the assembled recommendation object — never raw hotel facts.
// It writes exactly 4 narrative fields, gated by evidence_state. It explains the
// deterministic intelligence; it never adds reasoning, decisions, facts, or numbers.

export const PROSE_SYSTEM = `You are a senior AI-visibility consultant writing the narrative around ONE already-computed recommendation for a luxury hotel. Everything factual has ALREADY been determined by a deterministic system. You do NOT decide what the recommendation is, what action to take, or whether the hotel offers something. You ONLY explain, in consultant language, the recommendation object you are given.

ABSOLUTE RULES:
- Use ONLY the data in the recommendation object provided. Never invent facts, numbers, revenue, traffic, bookings, rankings, competitors, percentages, or score predictions.
- The evidence_state is BINDING and determines your entire narrative:
  • "confirmed" → the hotel DEMONSTRABLY offers this. Narrate the structural/technical problem and the strengthening opportunity. You MAY say the offering exists.
  • "unverified" → the system could NOT confirm the hotel offers this from the pages analysed. You MUST NOT imply it exists or that it's merely "fragmented". The honest narrative is: "we could not verify this offering from your site — confirm whether you offer it." NEVER write a fragmentation/strengthening story for unverified.
  • "contradicted" → the site says conflicting things; narrate the need to resolve the conflict.
- "why_improves_ai" may ONLY reference: the AI-identity dimension(s) named, the unanswered guest questions listed, the website-understanding problem in the knowledge_graph explanation, and recommendation confidence. NEVER reference revenue, bookings, segments, or commercial value not in the object.
- expected_outcome is QUALITATIVE only — what AI assistants will be able to do that they can't today. No numbers, no score lifts, no percentages.
- Be specific to THIS object. Every sentence must reference something in the data provided.

Return STRICTLY this JSON:
{
  "executive_summary": string,
  "why_improves_ai": string,
  "strategic_explanation": string,
  "expected_outcome": string
}`

export function proseSchema() {
  return {
    type: 'object', additionalProperties: false,
    required: ['executive_summary', 'why_improves_ai', 'strategic_explanation', 'expected_outcome'],
    properties: {
      executive_summary: { type: 'string' },
      why_improves_ai: { type: 'string' },
      strategic_explanation: { type: 'string' },
      expected_outcome: { type: 'string' },
    },
  }
}

// GPT sees ONLY this projection of the assembled recommendation — never raw facts.
export function buildProseInput(rec: any): string {
  return JSON.stringify({
    title: rec?.title,
    evidence_state: rec?.evidence_state,
    evidence_reason: rec?.evidence_reason,
    confidence: rec?.confidence,
    bucket: rec?.bucket,
    recommended_action: rec?.decision?.action,
    target_page: rec?.decision?.target,
    ai_identity: rec?.ai_identity,
    knowledge_graph: rec?.knowledge_graph,
    technical_findings: rec?.technical,
    unanswered_guest_questions: rec?.questions_unanswered,
    affected_pages: rec?.affected_pages,
    evidence: rec?.evidence,
  }, null, 1)
}
// ─── BRIEFING OPENING — one grounded paragraph from deterministic inputs only ───
export const OPENING_SYSTEM = `You are a senior AI-visibility consultant opening a strategy briefing for a luxury hotel. Write ONE paragraph (2-4 sentences) that situates today's recommendations in how AI currently perceives the hotel. You are given ONLY computed values: an overall AI-visibility score, which dimensions are strong vs weak, the number of recommendations, and how many need confirming. Use ONLY these. NEVER invent revenue, traffic, competitors, bookings, or any context not in the data. If something isn't in the inputs, don't say it. End by pointing to where to start. Plain, confident, specific to this hotel's numbers. No fluff, no generic consultant-speak. Return STRICTLY: {"opening": string}`;

export function openingSchema() {
  return { type: 'object', additionalProperties: false, required: ['opening'], properties: { opening: { type: 'string' } } };
}

export function buildOpeningInput(visibilityModel: any, recommendations: any[]): string {
  const dims = (visibilityModel?.dimensions || []).map((d: any) => ({ label: d.label, score: d.score, band: d.band }));
  const strong = dims.filter((d: any) => d.band === 'strong').map((d: any) => d.label);
  const weak = dims.filter((d: any) => d.band === 'weak' || d.band === 'absent').map((d: any) => d.label);
  const verifyCount = recommendations.filter((r: any) => (r.recommendation?.evidence_state || r.evidence_state) !== 'confirmed').length;
  return JSON.stringify({
    overall_ai_visibility: visibilityModel?.overall,
    strong_dimensions: strong,
    weak_dimensions: weak,
    total_recommendations: recommendations.length,
    needs_confirming: verifyCount,
  }, null, 1);
}

// Deterministic transitions + step labels, derived from bucket sequence (no GPT).
const STEP_BY_INDEX = ['Start here', 'Then', 'After that', 'Also'];
const TRANSITION_BY_BUCKET: Record<string, string> = {
  Foundation: 'Before anything else \u2014',
  'Quick Win': 'Once that\u2019s confirmed, the fastest win is already within reach \u2014',
  Strategic: 'With the foundations in place, the longer-term build \u2014',
};
export function attachSequence(moves: any[]): void {
  moves.forEach((m: any, i: number) => {
    if (!m.recommendation) return;
    m.recommendation.step = STEP_BY_INDEX[i] || 'Also';
    m.recommendation.transition = i === 0 ? null : (TRANSITION_BY_BUCKET[m.recommendation.bucket] || 'Then \u2014');
  });
}