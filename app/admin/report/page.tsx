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
  const card: any = { background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem' }
  const label: any = { fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.75rem' }

  const Delta = ({ now, prev }: { now: number | null; prev: number | null }) => {
    if (now === null || prev === null) return <span style={{ color: MUTED, fontSize: '0.6rem' }}>—</span>
    const dd = now - prev
    if (dd === 0) return <span style={{ color: MUTED, fontSize: '0.6rem' }}>±0</span>
    return <span style={{ color: dd > 0 ? GREEN : RED, fontSize: '0.6rem', fontWeight: 700 }}>{dd > 0 ? '↑' : '↓'}{Math.abs(dd)}</span>
  }

  const recBlock = (title: string, recs: any[]) => (
    <div style={card}>
      <p style={label}>{title}</p>
      {(recs || []).length === 0 && <p style={{ fontSize: '0.65rem', color: MUTED, margin: 0 }}>No specific actions flagged.</p>}
      {(recs || []).map((rec: any, i: number) => (
        <div key={i} style={{ padding: '1rem 0', borderBottom: i < recs.length - 1 ? '1px solid ' + BORDER : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: TEXT }}>{rec.title}</span>
            <span style={{ fontSize: '0.46rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: prColor(rec.priority), background: prColor(rec.priority) + '14', border: '1px solid ' + prColor(rec.priority) + '33', borderRadius: 5, padding: '0.2rem 0.45rem' }}>{rec.priority}</span>
          </div>
          <p style={{ fontSize: '0.65rem', color: MUTED, margin: '0 0 0.4rem', lineHeight: 1.6, fontStyle: 'italic' }}>{rec.rationale}</p>
          <p style={{ fontSize: '0.7rem', color: TEXT, margin: 0, lineHeight: 1.7 }}>→ {rec.action}</p>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '2.5rem', fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', color: TEXT, margin: '0 0 0.25rem' }}>Internal Monthly Hotel Report</p>
        <p style={{ fontSize: '0.65rem', color: MUTED, margin: '0 0 1.5rem' }}>Admin only · monthly AI visibility + keywords + categories + official website audit, with detailed recommendations</p>

        <div style={{ ...card, display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: '0.3rem' }}>Hotel</label>
            <select value={hotelId} onChange={e => setHotelId(e.target.value)} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 6, border: '1px solid ' + BORDER, background: BG, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem' }}>
              {hotels.map(h => <option key={h.id} value={h.id}>{h.is_partner ? '★ ' : ''}{h.name} — {h.region}</option>)}
            </select>
          </div>
          <div style={{ width: 160 }}>
            <label style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: '0.3rem' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 6, border: '1px solid ' + BORDER, background: BG, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', boxSizing: 'border-box' }} />
          </div>
          <button onClick={generate} disabled={loading} style={{ background: GOLD, color: '#1a0e06', border: 'none', borderRadius: 6, padding: '0.6rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Generating…' : 'Generate Report'}</button>
        </div>

        {error && <div style={{ ...card, borderColor: '#fecaca', background: '#fef2f2' }}><p style={{ fontSize: '0.7rem', color: '#b91c1c', margin: 0 }}>{error}</p></div>}
        {loading && <div style={{ ...card, textAlign: 'center' }}><p style={{ fontSize: '0.7rem', color: MUTED, margin: 0 }}>Reading this month's visibility, keywords, categories and the website audit, then analysing…</p></div>}

        {r && !r.error && (
          <>
            <div style={{ background: 'linear-gradient(135deg, #2A1A0E, #3D2810)', borderRadius: 14, padding: '2rem', marginBottom: '1.25rem' }}>
              <p style={{ ...label, color: 'rgba(201,169,76,0.7)' }}>{result.hotel.name} · {result.hotel.region}</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: WHITE, margin: '0 0 0.75rem', lineHeight: 1.3 }}>{r.headline}</p>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.7 }}>{r.summary}</p>
            </div>

            {d?.monthlyVisibility && (
              <div style={card}>
                <p style={label}>Monthly AI Visibility · This Month vs Last</p>
                {[
                  { k: 'overall', l: 'Overall' }, { k: 'chatgpt', l: 'ChatGPT' }, { k: 'perplexity', l: 'Perplexity' }, { k: 'googleAi', l: 'Google AI' },
                ].map(row => {
                  const tm = d.monthlyVisibility.thisMonth[row.k]
                  const lmv = d.monthlyVisibility.lastMonth[row.k]
                  return (
                    <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid ' + BORDER }}>
                      <span style={{ fontSize: '0.7rem', color: TEXT }}>{row.l}</span>
                      <span style={{ fontSize: '0.7rem', color: MUTED }}>
                        last {lmv ?? '—'}{lmv !== null ? '%' : ''} → this <strong style={{ color: TEXT }}>{tm ?? '—'}{tm !== null ? '%' : ''}</strong> <Delta now={tm} prev={lmv} />
                      </span>
                    </div>
                  )
                })}
                {r.visibilityRecap && <p style={{ fontSize: '0.68rem', color: TEXT, margin: '1rem 0 0', lineHeight: 1.7 }}>{r.visibilityRecap}</p>}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={card}>
                <p style={{ ...label, color: GREEN }}>Winning these searches ({(r.wonQueries || []).length})</p>
                {(r.wonQueries || []).slice(0, 12).map((q: string, i: number) => <p key={i} style={{ fontSize: '0.66rem', color: TEXT, margin: '0 0 0.4rem' }}>✓ {q}</p>)}
                {(r.wonQueries || []).length === 0 && <p style={{ fontSize: '0.65rem', color: MUTED, margin: 0 }}>None yet.</p>}
              </div>
              <div style={card}>
                <p style={{ ...label, color: RED }}>Missing these searches ({(r.missedQueries || []).length})</p>
                {(r.missedQueries || []).slice(0, 12).map((q: string, i: number) => <p key={i} style={{ fontSize: '0.66rem', color: TEXT, margin: '0 0 0.4rem' }}>• {q}</p>)}
                {(r.missedQueries || []).length === 0 && <p style={{ fontSize: '0.65rem', color: MUTED, margin: 0 }}>None — full coverage.</p>}
              </div>
            </div>

            {d?.categories?.scores && Object.keys(d.categories.scores).length > 0 && (
              <div style={card}>
                <p style={label}>Category Performance</p>
                {Object.entries(d.categories.scores).map(([cat, score]: any) => {
                  const rank = d.categories.ranks?.[cat]
                  return (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid ' + BORDER }}>
                      <span style={{ fontSize: '0.7rem', color: TEXT, textTransform: 'capitalize' }}>{cat}</span>
                      <span style={{ fontSize: '0.68rem', color: MUTED }}>{score}%{rank ? ` · #${rank.rank}/${rank.total}${rank.ahead ? ` · behind ${rank.ahead}` : ' · leader'}` : ''}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {recBlock('Improve SwissNet Visibility', r.swissnetRecommendations)}

            <div style={card}>
              <p style={label}>Official Website {d?.websiteAudit ? `· audit score ${d.websiteAudit.score}%` : ''}</p>
              {!d?.websiteAudit && <p style={{ fontSize: '0.65rem', color: MUTED, margin: '0 0 0.75rem' }}>No website audit on file — run one from the dashboard's Official Website tab first for website recommendations.</p>}
              {(r.websiteRecommendations || []).map((rec: any, i: number) => (
                <div key={i} style={{ padding: '1rem 0', borderBottom: i < r.websiteRecommendations.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: TEXT }}>{rec.title}</span>
                    <span style={{ fontSize: '0.46rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: prColor(rec.priority), background: prColor(rec.priority) + '14', border: '1px solid ' + prColor(rec.priority) + '33', borderRadius: 5, padding: '0.2rem 0.45rem' }}>{rec.priority}</span>
                  </div>
                  <p style={{ fontSize: '0.65rem', color: MUTED, margin: '0 0 0.4rem', lineHeight: 1.6, fontStyle: 'italic' }}>{rec.rationale}</p>
                  <p style={{ fontSize: '0.7rem', color: TEXT, margin: 0, lineHeight: 1.7 }}>→ {rec.action}</p>
                </div>
              ))}
            </div>

            {r.callScript && (
              <div style={{ background: 'rgba(201,169,76,0.10)', border: '1px solid ' + BORDER, borderLeft: '3px solid ' + GOLD, borderRadius: 10, padding: '1.25rem 1.5rem' }}>
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