'use client'
import { useState, useEffect } from 'react'

const GOLD = '#C9A84C', BG = '#F8F5EF', WHITE = '#FFFFFF', TEXT = '#2A1A0E', MUTED = 'rgba(42,26,14,0.5)', BORDER = 'rgba(201,169,76,0.2)', RED = '#dc2626'

export default function WebsiteAnalysisPage() {
  const [password, setPassword] = useState('')
  const [urls, setUrls] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('password'); if (p) setPassword(p)
    const loadLast = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data } = await sb.from('website_analyses').select('urls_scraped, urls_failed, analysis').order('created_at', { ascending: false }).limit(1).single()
        if (data) {
          setResult({ urlsScraped: data.urls_scraped, urlsFailed: data.urls_failed, analysis: data.analysis })
          if (Array.isArray(data.urls_scraped)) setUrls(data.urls_scraped.join('\n'))
        }
      } catch {}
    }
    loadLast()
  }, [])

  const run = async () => {
    if (!urls.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/website-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ urls, password }) })
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
            <p style={{ margin: '0 0 1rem' }}>{a.summary}</p>

            {a.linkingAnalysis && <>
              <h2 style={{ fontSize: '1rem', margin: '1.5rem 0 0.5rem', borderTop: '1px solid ' + BORDER, paddingTop: '1rem' }}>Internal linking</h2>
              <p style={{ margin: '0 0 1rem' }}>{a.linkingAnalysis}</p>
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