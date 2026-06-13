'use client'
import { useState, useEffect } from 'react'

const GOLD = '#C9A84C', BG = '#F8F5EF', WHITE = '#FFFFFF', TEXT = '#2A1A0E', MUTED = 'rgba(42,26,14,0.5)', BORDER = 'rgba(201,169,76,0.2)', GREEN = '#16a34a', RED = '#dc2626'

export default function AdminReportPage() {
  const [password, setPassword] = useState('')
  const [hotels, setHotels] = useState<any[]>([])
  const [hotelId, setHotelId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    const url = new URLSearchParams(window.location.search)
    const p = url.get('password'); if (p) setPassword(p)
    const load = async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await sb.from('hotels').select('id, name, region, is_partner').eq('is_active', true).order('is_partner', { ascending: false }).order('name')
      if (data) { setHotels(data); if (data[0]) setHotelId(data[0].id) }
    }
    load()
  }, [])

  const generate = async () => {
    if (!hotelId) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/admin-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hotelId, password }) })
      const data = await res.json()
      if (data.error) setError(data.error); else setResult(data)
    } catch { setError('Request failed.') } finally { setLoading(false) }
  }

  const prColor = (p: string) => p === 'High' ? RED : p === 'Medium' ? GOLD : '#3b82f6'
  const r = result?.report
  const d = result?.data
  const card: any = { background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem', marginBottom: '1rem' }
  const label: any = { fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.75rem' }

  const Delta = ({ now, prev }: { now: number | null; prev: number | null }) => {
    if (now === null || prev === null) return <span style={{ color: MUTED, fontSize: '0.6rem' }}>—</span>
    const dd = now - prev
    if (dd === 0) return <span style={{ color: MUTED, fontSize: '0.6rem' }}>±0</span>
    return <span style={{ color: dd > 0 ? GREEN : RED, fontSize: '0.6rem', fontWeight: 700 }}>{dd > 0 ? '↑' : '↓'}{Math.abs(dd)}</span>
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '2.5rem', fontFamily: 'Montserrat, sans-serif' }}>
      <style>{`@media print { .no-print { display: none !important; } body { background: #fff !important; } }`}</style>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', color: TEXT, margin: '0 0 0.25rem' }}>Internal Monthly Working Report</p>
        <p style={{ fontSize: '0.65rem', color: MUTED, margin: '0 0 1.5rem' }}>Admin only · ready-to-paste actions targeting the actual weak spots</p>

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
          <button onClick={generate} disabled={loading} style={{ background: GOLD, color: '#1a0e06', border: 'none', borderRadius: 6, padding: '0.6rem 1.5rem', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Generating…' : 'Generate Report'}</button>
          {r && !r.error && <button onClick={() => window.print()} style={{ background: TEXT, color: WHITE, border: 'none', borderRadius: 6, padding: '0.6rem 1.5rem', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}>Download PDF</button>}
        </div>

        {error && <div className="no-print" style={{ ...card, borderColor: '#fecaca', background: '#fef2f2' }}><p style={{ fontSize: '0.7rem', color: '#b91c1c', margin: 0 }}>{error}</p></div>}
        {loading && <div className="no-print" style={{ ...card, textAlign: 'center' }}><p style={{ fontSize: '0.7rem', color: MUTED, margin: 0 }}>Analysing visibility, keywords, FAQs per page and the website audit…</p></div>}

        {r && !r.error && (
          <>
            <div style={{ background: 'linear-gradient(135deg, #2A1A0E, #3D2810)', borderRadius: 12, padding: '1.75rem', marginBottom: '1rem' }}>
              <p style={{ ...label, color: 'rgba(201,169,76,0.7)' }}>{result.hotel.name} · {result.hotel.region}</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.35rem', color: WHITE, margin: 0, lineHeight: 1.3 }}>{r.headline}</p>
            </div>

            {d?.monthlyVisibility && (
              <div style={card}>
                <p style={label}>Visibility This Month vs Last</p>
                {[{ k: 'overall', l: 'Overall' }, { k: 'chatgpt', l: 'ChatGPT' }, { k: 'perplexity', l: 'Perplexity' }, { k: 'googleAi', l: 'Google AI' }].map(row => {
                  const tm = d.monthlyVisibility.thisMonth[row.k], lmv = d.monthlyVisibility.lastMonth[row.k]
                  return (
                    <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid ' + BORDER }}>
                      <span style={{ fontSize: '0.7rem', color: TEXT }}>{row.l}</span>
                      <span style={{ fontSize: '0.7rem', color: MUTED }}>last {lmv ?? '—'}{lmv !== null ? '%' : ''} → this <strong style={{ color: TEXT }}>{tm ?? '—'}{tm !== null ? '%' : ''}</strong> <Delta now={tm} prev={lmv} /></span>
                    </div>
                  )
                })}
                {r.visibilityRecap && <p style={{ fontSize: '0.7rem', color: TEXT, margin: '1rem 0 0', lineHeight: 1.7 }}>{r.visibilityRecap}</p>}
              </div>
            )}

            {d?.faqsPerPage && (
              <div style={card}>
                <p style={label}>FAQs Per Page (what AI can read)</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {Object.entries(d.faqsPerPage).map(([page, n]: any) => (
                    <span key={page} style={{ fontSize: '0.62rem', color: n === 0 ? RED : TEXT, background: BG, border: '1px solid ' + BORDER, borderRadius: 20, padding: '0.3rem 0.7rem' }}>{page}: <strong>{n}</strong></span>
                  ))}
                </div>
              </div>
            )}

            {r.weakestAreas && r.weakestAreas.length > 0 && (
              <div style={{ ...card, borderLeft: '3px solid ' + RED }}>
                <p style={{ ...label, color: RED }}>Weakest Areas — focus here</p>
                {r.weakestAreas.map((w: string, i: number) => <p key={i} style={{ fontSize: '0.7rem', color: TEXT, margin: '0 0 0.4rem', lineHeight: 1.6 }}>• {w}</p>)}
              </div>
            )}

            {(d?.keywords?.missed || []).length > 0 && (
              <div style={card}>
                <p style={{ ...label, color: RED }}>Missed Searches ({d.keywords.missed.length})</p>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {d.keywords.missed.map((q: string, i: number) => <span key={i} style={{ fontSize: '0.62rem', color: TEXT, background: BG, border: '1px solid ' + BORDER, borderRadius: 4, padding: '0.25rem 0.6rem' }}>{q}</span>)}
                </div>
              </div>
            )}

            <p style={{ ...label, fontSize: '0.6rem', margin: '1.5rem 0 0.75rem' }}>SwissNet Actions — ready to paste</p>
            {(r.swissnetActions || []).map((a: any, i: number) => (
              <div key={i} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: TEXT }}>{a.title}</span>
                  <span style={{ fontSize: '0.46rem', fontWeight: 700, textTransform: 'uppercase', color: prColor(a.priority), background: prColor(a.priority) + '14', border: '1px solid ' + prColor(a.priority) + '33', borderRadius: 5, padding: '0.2rem 0.45rem' }}>{a.priority}</span>
                  {a.page && <span style={{ fontSize: '0.46rem', fontWeight: 700, textTransform: 'uppercase', color: MUTED, background: BG, border: '1px solid ' + BORDER, borderRadius: 5, padding: '0.2rem 0.45rem' }}>{a.page} page</span>}
                </div>
                {a.targetsQuery && <p style={{ fontSize: '0.6rem', color: GOLD, margin: '0 0 0.4rem' }}>Targets: {a.targetsQuery}</p>}
                <p style={{ fontSize: '0.65rem', color: MUTED, margin: '0 0 0.6rem', lineHeight: 1.6, fontStyle: 'italic' }}>{a.rationale}</p>
                {a.otherInstruction && <p style={{ fontSize: '0.7rem', color: TEXT, margin: '0 0 0.6rem', lineHeight: 1.7 }}>→ {a.otherInstruction}</p>}
                {(a.faqsToAdd || []).map((f: any, j: number) => (
                  <div key={j} style={{ background: BG, borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.5rem' }}>
                    <p style={{ fontSize: '0.68rem', fontWeight: 700, color: TEXT, margin: '0 0 0.3rem' }}>Q: {f.question}</p>
                    <p style={{ fontSize: '0.66rem', color: TEXT, margin: 0, lineHeight: 1.7 }}>A: {f.answer}</p>
                  </div>
                ))}
              </div>
            ))}

            <p style={{ ...label, fontSize: '0.6rem', margin: '1.5rem 0 0.75rem' }}>Official Website Fixes {d?.websiteAudit ? `· audit ${d.websiteAudit.score}%` : '· no audit on file'}</p>
            {!d?.websiteAudit && <div style={card}><p style={{ fontSize: '0.65rem', color: MUTED, margin: 0 }}>Run a website audit from the dashboard's Official Website tab to populate website fixes.</p></div>}
            {(r.websiteActions || []).map((a: any, i: number) => (
              <div key={i} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', color: TEXT }}>{a.title}</span>
                  <span style={{ fontSize: '0.46rem', fontWeight: 700, textTransform: 'uppercase', color: prColor(a.priority), background: prColor(a.priority) + '14', border: '1px solid ' + prColor(a.priority) + '33', borderRadius: 5, padding: '0.2rem 0.45rem' }}>{a.priority}</span>
                  {a.page && <span style={{ fontSize: '0.46rem', fontWeight: 700, textTransform: 'uppercase', color: MUTED, background: BG, border: '1px solid ' + BORDER, borderRadius: 5, padding: '0.2rem 0.45rem' }}>{a.page}</span>}
                </div>
                <p style={{ fontSize: '0.65rem', color: MUTED, margin: '0 0 0.4rem', lineHeight: 1.6, fontStyle: 'italic' }}>{a.rationale}</p>
                <p style={{ fontSize: '0.7rem', color: TEXT, margin: 0, lineHeight: 1.7 }}>→ {a.action}</p>
              </div>
            ))}

            {r.callScript && (
              <div style={{ background: 'rgba(201,169,76,0.10)', border: '1px solid ' + BORDER, borderLeft: '3px solid ' + GOLD, borderRadius: 10, padding: '1.25rem 1.5rem', marginTop: '1rem' }}>
                <p style={label}>What to say on the call</p>
                <p style={{ fontSize: '0.72rem', color: TEXT, margin: 0, lineHeight: 1.8 }}>{r.callScript}</p>
              </div>
            )}
          </>
        )}
        {r?.error && <div style={card}><p style={{ fontSize: '0.7rem', color: RED, margin: 0 }}>{r.error}</p></div>}
      </div>
    </div>
  )
}