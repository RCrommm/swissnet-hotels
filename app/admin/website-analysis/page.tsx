'use client'
import { useState, useEffect } from 'react'

const GOLD = '#C9A84C', BG = '#F8F5EF', WHITE = '#FFFFFF', TEXT = '#2A1A0E', MUTED = 'rgba(42,26,14,0.5)', BORDER = 'rgba(201,169,76,0.2)', GREEN = '#16a34a', RED = '#dc2626'

export default function WebsiteAnalysisPage() {
  const [password, setPassword] = useState('')
  const [hotels, setHotels] = useState<any[]>([])
  const [hotelId, setHotelId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('password'); if (p) setPassword(p)
    const load = async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await sb.from('hotels').select('id, name, region, is_partner').eq('is_active', true).order('is_partner', { ascending: false }).order('name')
      if (data) { setHotels(data); if (data[0]) setHotelId(data[0].id) }
    }
    load()
  }, [])

  const run = async () => {
    if (!hotelId) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/website-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hotelId, password }) })
      const data = await res.json()
      if (data.error) setError(data.error); else setResult(data)
    } catch { setError('Request failed (the analysis may have timed out).') } finally { setLoading(false) }
  }

  const prColor = (p: string) => p === 'High' ? RED : p === 'Medium' ? GOLD : '#3b82f6'
  const a = result?.analysis
  const card: any = { background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem', marginBottom: '1rem' }
  const label: any = { fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.75rem' }

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '2.5rem', fontFamily: 'Montserrat, sans-serif' }}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', color: TEXT, margin: '0 0 0.25rem' }}>Official Website — Deep AI Analysis</p>
        <p style={{ fontSize: '0.65rem', color: MUTED, margin: '0 0 1.5rem' }}>Scrapes their real site and reports exactly what AI sees, can't see, and should fix. Takes a few minutes.</p>

        <div className="no-print" style={{ ...card, display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: '0.3rem' }}>Hotel</label>
            <select value={hotelId} onChange={e => setHotelId(e.target.value)} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 6, border: '1px solid ' + BORDER, background: BG, color: TEXT, fontSize: '0.7rem' }}>
              {hotels.map(h => <option key={h.id} value={h.id}>{h.is_partner ? '★ ' : ''}{h.name} — {h.region}</option>)}
            </select>
          </div>
          <div style={{ width: 160 }}>
            <label style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: '0.3rem' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 6, border: '1px solid ' + BORDER, background: BG, color: TEXT, fontSize: '0.7rem', boxSizing: 'border-box' }} />
          </div>
          <button onClick={run} disabled={loading} style={{ background: GOLD, color: '#1a0e06', border: 'none', borderRadius: 6, padding: '0.6rem 1.5rem', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Analysing…' : 'Run Analysis'}</button>
          {a && !a.error && <button onClick={() => window.print()} style={{ background: TEXT, color: WHITE, border: 'none', borderRadius: 6, padding: '0.6rem 1.5rem', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}>Download PDF</button>}
        </div>

        {error && <div className="no-print" style={{ ...card, borderColor: '#fecaca', background: '#fef2f2' }}><p style={{ fontSize: '0.7rem', color: '#b91c1c', margin: 0 }}>{error}</p></div>}
        {loading && <div className="no-print" style={{ ...card, textAlign: 'center' }}><p style={{ fontSize: '0.7rem', color: MUTED, margin: 0 }}>Scraping pages and analysing what AI can read… this can take a few minutes, keep this tab open.</p></div>}

        {a && !a.error && (
          <>
            <div style={{ background: 'linear-gradient(135deg, #2A1A0E, #3D2810)', borderRadius: 12, padding: '1.75rem', marginBottom: '1rem' }}>
              <p style={{ ...label, color: 'rgba(201,169,76,0.7)' }}>{result.hotel.name} · {result.hotel.url}</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', color: WHITE, margin: '0 0 0.25rem' }}>{a.overallScore}<span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>/100</span></p>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.75rem' }}>{a.scoreReason}</p>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.7 }}>{a.summary}</p>
              <p style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', margin: '0.75rem 0 0' }}>Pages analysed: {(result.pagesScraped || []).join(', ')}</p>
            </div>
            {(a.schemaAudit || []).length > 0 && (
              <div style={card}>
                <p style={label}>Schema Audit — field by field</p>
                {a.schemaAudit.map((s: any, i: number) => (
                  <div key={i} style={{ padding: '0.6rem 0', borderBottom: '1px solid ' + BORDER }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: TEXT, margin: '0 0 0.3rem' }}>{s.type}</p>
                    {(s.present || []).length > 0 && <p style={{ fontSize: '0.62rem', color: GREEN, margin: '0 0 0.2rem', lineHeight: 1.5 }}>Present: {s.present.join(' · ')}</p>}
                    {(s.missing || []).length > 0 && <p style={{ fontSize: '0.62rem', color: RED, margin: '0 0 0.2rem', lineHeight: 1.5 }}>Missing: {s.missing.join(', ')}</p>}
                    {s.note && <p style={{ fontSize: '0.6rem', color: MUTED, margin: 0, fontStyle: 'italic' }}>{s.note}</p>}
                  </div>
                ))}
                {(a.missingSchemaTypes || []).length > 0 && <p style={{ fontSize: '0.64rem', color: RED, margin: '0.75rem 0 0', lineHeight: 1.6 }}>Entirely missing schema types: {a.missingSchemaTypes.join(', ')}</p>}
              </div>
            )}
            {(a.topPriorities || []).length > 0 && (
              <div style={{ ...card, borderLeft: '3px solid ' + RED }}>
                <p style={{ ...label, color: RED }}>Top Priorities</p>
                {a.topPriorities.map((p: string, i: number) => <p key={i} style={{ fontSize: '0.72rem', color: TEXT, margin: '0 0 0.5rem', lineHeight: 1.6 }}>{i + 1}. {p}</p>)}
              </div>
            )}

            {(a.pages || []).map((pg: any, i: number) => (
              <div key={i} style={card}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: TEXT, margin: '0 0 0.75rem' }}>{pg.url}</p>

                {(pg.aiSees || []).length > 0 && <>
                  <p style={{ ...label, color: GREEN, margin: '0.75rem 0 0.4rem' }}>What AI sees</p>
                  {pg.aiSees.map((s: string, j: number) => <p key={j} style={{ fontSize: '0.66rem', color: TEXT, margin: '0 0 0.3rem', lineHeight: 1.5 }}>✓ {s}</p>)}
                </>}

                {(pg.aiCannotSee || []).length > 0 && <>
                  <p style={{ ...label, color: RED, margin: '0.9rem 0 0.4rem' }}>What AI cannot see</p>
                  {pg.aiCannotSee.map((s: string, j: number) => <p key={j} style={{ fontSize: '0.66rem', color: TEXT, margin: '0 0 0.3rem', lineHeight: 1.5 }}>✕ {s}</p>)}
                </>}

                {(pg.weak || []).length > 0 && <>
                  <p style={{ ...label, color: GOLD, margin: '0.9rem 0 0.4rem' }}>Present but weak</p>
                  {pg.weak.map((s: string, j: number) => <p key={j} style={{ fontSize: '0.66rem', color: TEXT, margin: '0 0 0.3rem', lineHeight: 1.5 }}>~ {s}</p>)}
                </>}

                {(pg.fixes || []).length > 0 && <>
                  <p style={{ ...label, margin: '0.9rem 0 0.4rem' }}>Fixes</p>
                  {pg.fixes.map((f: any, j: number) => (
                    <div key={j} style={{ background: BG, borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: TEXT }}>{f.title}</span>
                        <span style={{ fontSize: '0.46rem', fontWeight: 700, textTransform: 'uppercase', color: prColor(f.priority), background: prColor(f.priority) + '14', border: '1px solid ' + prColor(f.priority) + '33', borderRadius: 5, padding: '0.2rem 0.45rem' }}>{f.priority}</span>
                        {f.schemaType && <span style={{ fontSize: '0.46rem', fontWeight: 700, textTransform: 'uppercase', color: MUTED, background: WHITE, border: '1px solid ' + BORDER, borderRadius: 5, padding: '0.2rem 0.45rem' }}>{f.schemaType}</span>}
                      </div>
                      <p style={{ fontSize: '0.68rem', color: TEXT, margin: 0, lineHeight: 1.7 }}>→ {f.instruction}</p>
                      {f.schemaBlock && <pre style={{ fontSize: '0.58rem', color: TEXT, background: WHITE, border: '1px solid ' + BORDER, borderRadius: 6, padding: '0.6rem', marginTop: '0.5rem', overflowX: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{f.schemaBlock}</pre>}
                      {(f.faqsToAdd || []).map((q: any, k: number) => (
                        <div key={k} style={{ background: WHITE, borderRadius: 6, padding: '0.6rem 0.8rem', marginTop: '0.5rem' }}>
                          <p style={{ fontSize: '0.66rem', fontWeight: 700, color: TEXT, margin: '0 0 0.25rem' }}>Q: {q.question}</p>
                          <p style={{ fontSize: '0.64rem', color: TEXT, margin: 0, lineHeight: 1.6 }}>A: {q.answer}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </>}
              </div>
            ))}
          </>
        )}
        {a?.error && <div style={card}><p style={{ fontSize: '0.7rem', color: RED, margin: 0 }}>{a.error}</p></div>}
      </div>
    </div>
  )
}