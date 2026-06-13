'use client'
import { useState, useEffect } from 'react'

const GOLD = '#C9A84C', BG = '#F8F5EF', WHITE = '#FFFFFF', TEXT = '#2A1A0E', MUTED = 'rgba(42,26,14,0.5)', BORDER = 'rgba(201,169,76,0.2)', RED = '#dc2626'

export default function WebsiteAnalysisPage() {
  const [password, setPassword] = useState('')
  const [urls, setUrls] = useState('')
  const [hotels, setHotels] = useState<any[]>([])
  const [hotelId, setHotelId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('password'); if (p) setPassword(p)
    const loadLast = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data: hotelList } = await sb.from('hotels').select('id, name, region, is_partner').eq('is_active', true).order('is_partner', { ascending: false }).order('name')
        if (hotelList) { setHotels(hotelList); if (hotelList[0]) setHotelId(hotelList[0].id) }
      } catch {}
    }
    loadLast()
  }, [])
  useEffect(() => {
    if (!hotelId) return
    setResult(null)
    const loadForHotel = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data } = await sb.from('website_analyses').select('urls_scraped, urls_failed, analysis').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1).maybeSingle()
        if (data) {
          setResult({ urlsScraped: data.urls_scraped, urlsFailed: data.urls_failed, analysis: data.analysis })
          if (Array.isArray(data.urls_scraped)) setUrls(data.urls_scraped.join('\n'))
        } else {
          setUrls('')
        }
      } catch {}
    }
    loadForHotel()
  }, [hotelId])

  const run = async () => {
    if (!urls.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/website-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ urls, password, hotelId }) })
      const data = await res.json()
      if (data.error) setError(data.error); else setResult(data)
    } catch { setError('Request failed (analysis may have timed out).') } finally { setLoading(false) }
  }

  const a = result?.analysis
  const inp: any = { width: '100%', padding: '0.55rem 0.75rem', borderRadius: 6, border: '1px solid ' + BORDER, background: WHITE, color: TEXT, fontSize: '0.75rem', boxSizing: 'border-box', fontFamily: 'monospace' }

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '2.5rem', fontFamily: 'Montserrat, sans-serif' }}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', color: TEXT, margin: '0 0 0.25rem' }}>Official Website — Deep AI Analysis</p>
        <p style={{ fontSize: '0.7rem', color: MUTED, margin: '0 0 1.5rem' }}>Paste the major page URLs (one per line). It scrapes each, reads what AI sees, audits schema, checks internal linking, and reports exactly what to change.</p>

        <div className="no-print" style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem', marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: '0.4rem' }}>Hotel</label>
          <select value={hotelId} onChange={e => setHotelId(e.target.value)} style={{ ...inp, fontFamily: 'Montserrat, sans-serif', marginBottom: '0.75rem' }}>
            {hotels.map(h => <option key={h.id} value={h.id}>{h.is_partner ? '★ ' : ''}{h.name} — {h.region}</option>)}
          </select>
          <label style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: '0.4rem' }}>Page URLs (one per line)</label>
          <textarea value={urls} onChange={e => setUrls(e.target.value)} rows={7} placeholder={'https://www.lareserve-geneve.com/en/\nhttps://www.lareserve-geneve.com/en/luxury-spa/\nhttps://www.lareserve-geneve.com/en/rooms-suites/'} style={{ ...inp, marginBottom: '0.75rem', resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" style={{ ...inp, width: 160, fontFamily: 'Montserrat, sans-serif' }} />
            <button onClick={run} disabled={loading} style={{ background: GOLD, color: '#1a0e06', border: 'none', borderRadius: 6, padding: '0.6rem 1.5rem', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Analysing…' : 'Run Analysis'}</button>
            {a && !a.error && <button onClick={() => window.print()} style={{ background: TEXT, color: WHITE, border: 'none', borderRadius: 6, padding: '0.6rem 1.5rem', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}>Download PDF</button>}
          </div>
        </div>

        {error && <div className="no-print" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '1.5rem', marginBottom: '1rem' }}><p style={{ fontSize: '0.7rem', color: '#b91c1c', margin: 0 }}>{error}</p></div>}
        {loading && <div className="no-print" style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}><p style={{ fontSize: '0.7rem', color: MUTED, margin: 0 }}>Scraping each page and analysing what AI can read… can take a few minutes, keep this tab open.</p></div>}

        {a && !a.error && (
          <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '2rem', fontSize: '0.8rem', color: TEXT, lineHeight: 1.7 }}>
            <p style={{ color: MUTED, margin: '0 0 1rem', fontSize: '0.7rem' }}>Scraped: {(result.urlsScraped || []).join(', ')}{(result.urlsFailed || []).length > 0 && <span style={{ color: RED }}> · Failed: {result.urlsFailed.join(', ')}</span>}</p>

            <p style={{ margin: '0 0 0.5rem' }}><strong>AI-readability score: {a.overallScore}/100</strong> — {a.scoreReason}</p>

            {(a.scoreBreakdown || []).length > 0 && (
              <div style={{ margin: '0.75rem 0 1.25rem' }}>
                {a.scoreBreakdown.map((s: any, i: number) => (
                  <div key={i} style={{ marginBottom: '0.45rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '0.18rem' }}>
                      <span>{s.label}</span><span style={{ color: MUTED }}>{s.score}/{s.max}</span>
                    </div>
                    <div style={{ height: 6, background: BG, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round((s.score / s.max) * 100)}%`, background: GOLD }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p style={{ margin: '0 0 1rem' }}>{a.summary}</p>

            {a.headlineInsight && (
              <div style={{ borderLeft: '3px solid ' + GOLD, background: BG, borderRadius: 6, padding: '0.8rem 1rem', margin: '0 0 1.25rem' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0, lineHeight: 1.6 }}>{a.headlineInsight}</p>
              </div>
            )}

            {(a.searchVisibility || []).length > 0 && <>
              <h2 style={{ fontSize: '1.05rem', margin: '1.5rem 0 0.25rem', borderTop: '2px solid ' + GOLD, paddingTop: '1rem' }}>The searches you're losing — and the exact fix</h2>
              <p style={{ fontSize: '0.72rem', color: MUTED, margin: '0 0 0.9rem' }}>Each is a real AI search tracked for this hotel. For the ones it doesn't win, here's why — and the exact passage to add, on the exact page.</p>
              {a.searchVisibility.map((s: any, i: number) => {
                const appearC = s.appears === 'Yes' ? '#15803d' : s.appears === 'Partial' ? '#b45309' : RED
                const skip = s.fit === 'Skip'
                return (
                  <div key={i} style={{ border: '1px solid ' + BORDER, borderLeft: `3px solid ${skip ? MUTED : appearC}`, borderRadius: 8, padding: '0.9rem 1.1rem', margin: '0 0 0.7rem', opacity: skip ? 0.7 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{s.category}</span>
                      <span style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                        {skip
                          ? <span style={{ fontSize: '0.56rem', fontWeight: 700, color: MUTED, border: '1px solid ' + BORDER, borderRadius: 4, padding: '0.1rem 0.4rem' }}>NOT YOUR FIT</span>
                          : <span style={{ fontSize: '0.56rem', fontWeight: 700, color: appearC, border: '1px solid ' + appearC, borderRadius: 4, padding: '0.1rem 0.4rem' }}>{s.appears === 'Yes' ? 'APPEARING' : s.appears === 'Partial' ? 'PARTIAL' : 'NOT APPEARING'}</span>}
                      </span>
                    </div>
                    {(s.exampleSearches || []).length > 0 && <p style={{ fontSize: '0.64rem', color: MUTED, fontStyle: 'italic', margin: '0 0 0.4rem' }}>{s.exampleSearches.join(' · ')}</p>}
                    {s.diagnosis && <p style={{ fontSize: '0.68rem', margin: '0 0 0.5rem', lineHeight: 1.55 }}>{s.diagnosis}</p>}
                    {!skip && s.fix && <>
                      <p style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.25rem' }}>Add this {s.pageToFix ? `→ ${s.pageToFix}` : ''}</p>
                      <p style={{ fontSize: '0.68rem', background: BG, borderRadius: 6, padding: '0.6rem 0.8rem', margin: '0 0 0.5rem', lineHeight: 1.6 }}>{s.fix}</p>
                    </>}
                    {!skip && s.faq?.question && (
                      <div style={{ background: BG, borderRadius: 6, padding: '0.55rem 0.8rem' }}>
                        <p style={{ fontSize: '0.66rem', fontWeight: 700, margin: '0 0 0.2rem' }}>Q: {s.faq.question}</p>
                        <p style={{ fontSize: '0.64rem', color: MUTED, margin: 0, lineHeight: 1.55 }}>A: {s.faq.answer}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </>}

            {(a.visibilityOpportunities || []).length > 0 && <>
              <h2 style={{ fontSize: '1rem', margin: '1.5rem 0 0.25rem', borderTop: '1px solid ' + BORDER, paddingTop: '1rem' }}>High-impact AI visibility opportunities</h2>
              <p style={{ fontSize: '0.72rem', color: MUTED, margin: '0 0 0.75rem' }}>Closing operational gaps helps AI answer questions about you. This content is what makes AI recommend you in the first place.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.7rem', margin: '0 0 1rem' }}>
                {a.visibilityOpportunities.map((o: any, i: number) => {
                  const c = o.status === 'Strong' ? '#15803d' : o.status === 'Weak' ? '#b45309' : RED
                  return (
                    <div key={i} style={{ border: '1px solid ' + BORDER, borderRadius: 8, padding: '0.8rem 0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.74rem' }}>{o.theme}</span>
                        <span style={{ fontSize: '0.58rem', fontWeight: 700, color: c, border: '1px solid ' + c, borderRadius: 4, padding: '0.1rem 0.4rem' }}>{o.status}</span>
                      </div>
                      {(o.targetSearches || []).length > 0 && <p style={{ fontSize: '0.62rem', color: MUTED, margin: '0 0 0.4rem', fontStyle: 'italic' }}>Wins searches like: {o.targetSearches.join(' · ')}</p>}
                      <p style={{ fontSize: '0.66rem', margin: 0, lineHeight: 1.5 }}>{o.recommendation}</p>
                    </div>
                  )
                })}
              </div>
            </>}

            {(a.answersCheck || []).length > 0 && <>
              <h2 style={{ fontSize: '1rem', margin: '1.5rem 0 0.5rem', borderTop: '1px solid ' + BORDER, paddingTop: '1rem' }}>What a guest can ask AI — and whether your site answers it</h2>
              <ul style={{ margin: '0 0 1rem', padding: 0, listStyle: 'none' }}>
                {a.answersCheck.map((q: any, i: number) => (
                  <li key={i} style={{ marginBottom: '0.4rem', display: 'flex', gap: '0.55rem' }}>
                    <span style={{ color: q.answerable ? '#15803d' : RED, fontWeight: 700, flexShrink: 0 }}>{q.answerable ? '✓' : '✗'}</span>
                    <span><strong>{q.question}</strong>{q.note ? ` — ${q.note}` : ''}</span>
                  </li>
                ))}
              </ul>
            </>}

            {a.linkingAnalysis && <>
              <h2 style={{ fontSize: '1rem', margin: '1.5rem 0 0.5rem', borderTop: '1px solid ' + BORDER, paddingTop: '1rem' }}>Internal linking</h2>
              <p style={{ margin: '0 0 1rem' }}>{a.linkingAnalysis}</p>
            </>}

            {(a.factsCheck || []).filter((f: any) => !f.present).length > 0 && <>
              <h2 style={{ fontSize: '1rem', margin: '1.5rem 0 0.5rem', borderTop: '1px solid ' + BORDER, paddingTop: '1rem' }}>Facts AI cannot find on your site</h2>
              <ul style={{ margin: '0 0 1rem', padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.3rem 1rem' }}>
                {a.factsCheck.filter((f: any) => !f.present).map((f: any, i: number) => (
                  <li key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.72rem' }}>
                    <span style={{ color: RED, fontWeight: 700, flexShrink: 0 }}>✗</span><span>{f.fact}</span>
                  </li>
                ))}
              </ul>
            </>}

            {(a.entityPositioning || []).length > 0 && <>
              <h2 style={{ fontSize: '1rem', margin: '1.5rem 0 0.5rem', borderTop: '1px solid ' + BORDER, paddingTop: '1rem' }}>How strongly AI associates this hotel with…</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem', margin: '0 0 1rem' }}>
                {a.entityPositioning.map((e: any, i: number) => {
                  const c = e.strength === 'Strong' ? '#15803d' : e.strength === 'Medium' ? '#b45309' : RED
                  return (
                    <div key={i} style={{ border: '1px solid ' + BORDER, borderRadius: 8, padding: '0.7rem 0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.72rem' }}>{e.entity}</span>
                        <span style={{ fontSize: '0.58rem', fontWeight: 700, color: c, border: '1px solid ' + c, borderRadius: 4, padding: '0.1rem 0.4rem' }}>{e.strength}</span>
                      </div>
                      <p style={{ fontSize: '0.66rem', color: MUTED, margin: 0, lineHeight: 1.5 }}>{e.why}</p>
                    </div>
                  )
                })}
              </div>
            </>}

            {(a.recommendationReadiness || []).length > 0 && <>
              <h2 style={{ fontSize: '1rem', margin: '1.5rem 0 0.5rem', borderTop: '1px solid ' + BORDER, paddingTop: '1rem' }}>Would AI recommend this hotel for…</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem', margin: '0 0 1rem' }}>
                {a.recommendationReadiness.map((r: any, i: number) => {
                  const c = r.readiness === 'High' ? '#15803d' : r.readiness === 'Medium' ? '#b45309' : RED
                  return (
                    <div key={i} style={{ border: '1px solid ' + BORDER, borderRadius: 8, padding: '0.7rem 0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.72rem' }}>{r.traveller}</span>
                        <span style={{ fontSize: '0.58rem', fontWeight: 700, color: c, border: '1px solid ' + c, borderRadius: 4, padding: '0.1rem 0.4rem' }}>{r.readiness}</span>
                      </div>
                      <p style={{ fontSize: '0.66rem', color: MUTED, margin: 0, lineHeight: 1.5 }}>{r.why}</p>
                    </div>
                  )
                })}
              </div>
            </>}

            {(a.contentGaps || []).length > 0 && <>
              <h2 style={{ fontSize: '1rem', margin: '1.5rem 0 0.5rem', borderTop: '1px solid ' + BORDER, paddingTop: '1rem' }}>Foundational fixes — operational facts to add</h2>
              {['Critical', 'Important', 'Nice-to-have'].map(tier => {
                const items = (a.contentGaps || []).filter((g: any) => g.tier === tier)
                if (items.length === 0) return null
                const c = tier === 'Critical' ? RED : tier === 'Important' ? '#b45309' : MUTED
                return (
                  <div key={tier} style={{ marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c, margin: '0 0 0.3rem' }}>{tier}</p>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                      {items.map((g: any, j: number) => <li key={j} style={{ marginBottom: '0.25rem' }}><strong>{g.area}</strong> — {g.why}</li>)}
                    </ul>
                  </div>
                )
              })}
            </>}

            {(a.siteWideReport || []).length > 0 && <>
              <h2 style={{ fontSize: '1rem', margin: '1.5rem 0 0.5rem', borderTop: '1px solid ' + BORDER, paddingTop: '1rem' }}>What to change or add — whole site</h2>
              <ol style={{ margin: '0 0 1rem', paddingLeft: '1.2rem' }}>{a.siteWideReport.map((p: string, i: number) => <li key={i} style={{ marginBottom: '0.4rem' }}>{p}</li>)}</ol>
            </>}
            {a.marketerSummary && <>
              <h2 style={{ fontSize: '1rem', margin: '1.5rem 0 0.5rem', borderTop: '1px solid ' + BORDER, paddingTop: '1rem' }}>Summary for the marketing team</h2>
              <p style={{ margin: '0 0 1rem' }}>{a.marketerSummary}</p>
            </>}

            {(a.actionPlan || []).length > 0 && <>
              <h2 style={{ fontSize: '1.05rem', margin: '1.5rem 0 0.5rem', borderTop: '2px solid ' + GOLD, paddingTop: '1rem' }}>Action plan — exactly what to do, page by page</h2>
              {a.actionPlan.map((ap: any, i: number) => (
                <div key={i} style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.9rem', margin: '1rem 0 0.4rem', wordBreak: 'break-all' }}>{ap.page}</h3>
                  {(ap.majorGaps || []).length > 0 && <>
                    <p style={{ margin: '0.5rem 0 0.2rem', fontWeight: 700 }}>Major gaps:</p>
                    <ul style={{ margin: '0 0 0.5rem', paddingLeft: '1.2rem' }}>{ap.majorGaps.map((g: string, j: number) => <li key={j} style={{ marginBottom: '0.2rem' }}>{g}</li>)}</ul>
                  </>}
                  {(ap.schemaToAdd || []).length > 0 && <>
                    <p style={{ margin: '0.5rem 0 0.2rem', fontWeight: 700 }}>Schema to add:</p>
                    <ul style={{ margin: '0 0 0.5rem', paddingLeft: '1.2rem' }}>{ap.schemaToAdd.map((s: string, j: number) => <li key={j} style={{ marginBottom: '0.2rem' }}>{s}</li>)}</ul>
                  </>}
                  {(ap.faqsToAdd || []).length > 0 && <>
                    <p style={{ margin: '0.5rem 0 0.2rem', fontWeight: 700 }}>FAQs to add:</p>
                    {ap.faqsToAdd.map((q: any, j: number) => (
                      <div key={j} style={{ marginBottom: '0.4rem' }}>
                        <p style={{ margin: '0 0 0.15rem' }}><strong>Q:</strong> {q.question}</p>
                        <p style={{ margin: 0 }}><strong>A:</strong> {q.answer}</p>
                      </div>
                    ))}
                  </>}
                  {(ap.otherActions || []).length > 0 && <>
                    <p style={{ margin: '0.5rem 0 0.2rem', fontWeight: 700 }}>Other actions:</p>
                    <ul style={{ margin: '0 0 0.5rem', paddingLeft: '1.2rem' }}>{ap.otherActions.map((s: string, j: number) => <li key={j} style={{ marginBottom: '0.2rem' }}>{s}</li>)}</ul>
                  </>}
                </div>
              ))}
            </>}

            {(a.pages || []).map((pg: any, i: number) => (
              <div key={i}>
                <h2 style={{ fontSize: '1.05rem', margin: '2rem 0 0.5rem', borderTop: '2px solid ' + GOLD, paddingTop: '1rem', wordBreak: 'break-all' }}>{pg.url}</h2>

                {(pg.schemaAudit || []).length > 0 && <>
                  <h3 style={{ fontSize: '0.85rem', margin: '1rem 0 0.3rem' }}>Schema audit</h3>
                  {pg.schemaAudit.map((s: any, j: number) => (
                    <div key={j} style={{ marginBottom: '0.6rem' }}>
                      <p style={{ margin: '0 0 0.15rem' }}><strong>{s.type}</strong></p>
                      {(s.present || []).length > 0 && <p style={{ margin: '0 0 0.15rem' }}>Present: {s.present.join(' · ')}</p>}
                      {(s.missing || []).length > 0 && <p style={{ margin: '0 0 0.15rem', color: RED }}>Missing: {s.missing.join(', ')}</p>}
                      {s.note && <p style={{ margin: 0, fontStyle: 'italic', color: MUTED }}>{s.note}</p>}
                    </div>
                  ))}
                  {(pg.missingSchemaTypes || []).length > 0 && <p style={{ color: RED, margin: '0 0 0.5rem' }}>Entirely missing: {pg.missingSchemaTypes.join(', ')}</p>}
                </>}

                {(pg.aiSees || []).length > 0 && <>
                  <h3 style={{ fontSize: '0.85rem', margin: '1rem 0 0.3rem' }}>What AI sees</h3>
                  <ul style={{ margin: '0 0 0.5rem', paddingLeft: '1.2rem' }}>{pg.aiSees.map((s: string, j: number) => <li key={j} style={{ marginBottom: '0.2rem' }}>{s}</li>)}</ul>
                </>}

                {(pg.aiCannotSee || []).length > 0 && <>
                  <h3 style={{ fontSize: '0.85rem', margin: '1rem 0 0.3rem', color: RED }}>What AI cannot see (why / where to add)</h3>
                  <ul style={{ margin: '0 0 0.5rem', paddingLeft: '1.2rem' }}>{pg.aiCannotSee.map((s: string, j: number) => <li key={j} style={{ marginBottom: '0.2rem' }}>{s}</li>)}</ul>
                </>}

                {(pg.weak || []).length > 0 && <>
                  <h3 style={{ fontSize: '0.85rem', margin: '1rem 0 0.3rem' }}>Present but weak</h3>
                  <ul style={{ margin: '0 0 0.5rem', paddingLeft: '1.2rem' }}>{pg.weak.map((s: string, j: number) => <li key={j} style={{ marginBottom: '0.2rem' }}>{s}</li>)}</ul>
                </>}

                {(pg.fixes || []).length > 0 && <>
                  <h3 style={{ fontSize: '0.85rem', margin: '1rem 0 0.3rem' }}>Fixes</h3>
                  {pg.fixes.map((f: any, j: number) => (
                    <div key={j} style={{ marginBottom: '1rem' }}>
                      <p style={{ margin: '0 0 0.2rem' }}><strong>{f.title}</strong> [{f.priority}{f.schemaType ? ' · ' + f.schemaType : ''}]</p>
                      <p style={{ margin: '0 0 0.3rem' }}>{f.instruction}</p>
                      {f.schemaBlock && <pre style={{ fontSize: '0.65rem', background: BG, border: '1px solid ' + BORDER, borderRadius: 6, padding: '0.6rem', overflowX: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.5, margin: '0 0 0.4rem' }}>{f.schemaBlock}</pre>}
                      {(f.faqsToAdd || []).map((q: any, k: number) => (
                        <div key={k} style={{ marginBottom: '0.4rem' }}>
                          <p style={{ margin: '0 0 0.15rem' }}><strong>Q:</strong> {q.question}</p>
                          <p style={{ margin: 0 }}><strong>A:</strong> {q.answer}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </>}
              </div>
            ))}
          </div>
        )}
        {a?.error && <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem' }}><p style={{ fontSize: '0.7rem', color: RED, margin: 0 }}>{a.error}</p></div>}
      </div>
    </div>
  )
}