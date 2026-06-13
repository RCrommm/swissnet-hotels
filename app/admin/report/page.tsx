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
      if (data.error) setError(data.error)
      else setResult(data)
    } catch { setError('Request failed.') }
    finally { setLoading(false) }
  }

  const prColor = (p: string) => p === 'High' ? RED : p === 'Medium' ? GOLD : '#3b82f6'
  const r = result?.report
  const d = result?.data

  const card: any = { background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem' }
  const label: any = { fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.75rem' }

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '2.5rem', fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', color: TEXT, margin: '0 0 0.25rem' }}>Internal Hotel Intelligence Report</p>
        <p style={{ fontSize: '0.65rem', color: MUTED, margin: '0 0 1.5rem' }}>Admin only · combines AI visibility, website audit and profile data into a tailored action plan</p>

        <div style={{ ...card, display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: '0.3rem' }}>Hotel</label>
            <select value={hotelId} onChange={e => setHotelId(e.target.value)} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 6, border: '1px solid ' + BORDER, background: BG, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem' }}>
              {hotels.map(h => <option key={h.id} value={h.id}>{h.is_partner ? '★ ' : ''}{h.name} — {h.region}</option>)}
            </select>
          </div>
          <div style={{ width: 180 }}>
            <label style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: '0.3rem' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 6, border: '1px solid ' + BORDER, background: BG, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', boxSizing: 'border-box' }} />
          </div>
          <button onClick={generate} disabled={loading} style={{ background: GOLD, color: '#1a0e06', border: 'none', borderRadius: 6, padding: '0.6rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Generating…' : 'Generate Report'}</button>
        </div>

        {error && <div style={{ ...card, borderColor: '#fecaca', background: '#fef2f2' }}><p style={{ fontSize: '0.7rem', color: '#b91c1c', margin: 0 }}>{error}</p></div>}

        {loading && <div style={{ ...card, textAlign: 'center' }}><p style={{ fontSize: '0.7rem', color: MUTED, margin: 0 }}>Reading visibility data, audit and profile, then running the analysis…</p></div>}

        {r && !r.error && (
          <>
            <div style={{ background: 'linear-gradient(135deg, #2A1A0E, #3D2810)', borderRadius: 14, padding: '2rem', marginBottom: '1.25rem' }}>
              <p style={{ ...label, color: 'rgba(201,169,76,0.7)' }}>{result.hotel.name} · {result.hotel.region}</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: WHITE, margin: '0 0 0.75rem', lineHeight: 1.3 }}>{r.headline}</p>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.7 }}>{r.summary}</p>
            </div>

            {d && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { l: 'Audit score', v: d.websiteAudit ? d.websiteAudit.score + '%' : '—' },
                  { l: 'FAQs', v: d.profile.faqs },
                  { l: 'Rooms', v: d.profile.rooms },
                  { l: 'Restaurants', v: d.profile.restaurants },
                  { l: 'Spa venues', v: d.profile.spaVenues },
                  { l: 'Profile gaps', v: d.profile.missingFields.length },
                ].map((s, i) => (
                  <div key={i} style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '0.75rem 1rem' }}>
                    <p style={{ fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, margin: '0 0 0.2rem' }}>{s.l}</p>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: GOLD, margin: 0, lineHeight: 1 }}>{s.v}</p>
                  </div>
                ))}
              </div>
            )}

            {d?.aiVisibility?.categoryScores && Object.keys(d.aiVisibility.categoryScores).length > 0 && (
              <div style={card}>
                <p style={label}>AI Visibility by Category</p>
                {Object.entries(d.aiVisibility.categoryScores).map(([cat, score]: any) => {
                  const rank = d.aiVisibility.categoryRanks?.[cat]
                  return (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid ' + BORDER }}>
                      <span style={{ fontSize: '0.7rem', color: TEXT, textTransform: 'capitalize' }}>{cat}</span>
                      <span style={{ fontSize: '0.7rem', color: MUTED }}>{score}%{rank ? ` · #${rank.rank} of ${rank.total}${rank.ahead ? ` · behind ${rank.ahead}` : ' · leader'}` : ''}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={card}>
                <p style={{ ...label, color: GREEN }}>Strengths</p>
                {(r.strengths || []).map((s: string, i: number) => <p key={i} style={{ fontSize: '0.68rem', color: TEXT, margin: '0 0 0.5rem', lineHeight: 1.6 }}>✓ {s}</p>)}
              </div>
              <div style={card}>
                <p style={{ ...label, color: RED }}>Gaps</p>
                {(r.gaps || []).map((s: string, i: number) => <p key={i} style={{ fontSize: '0.68rem', color: TEXT, margin: '0 0 0.5rem', lineHeight: 1.6 }}>• {s}</p>)}
              </div>
            </div>

            <div style={card}>
              <p style={label}>Recommended Actions</p>
              {(r.recommendations || []).map((rec: any, i: number) => (
                <div key={i} style={{ padding: '1rem 0', borderBottom: i < r.recommendations.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: TEXT }}>{rec.title}</span>
                    <span style={{ fontSize: '0.46rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: prColor(rec.priority), background: prColor(rec.priority) + '14', border: '1px solid ' + prColor(rec.priority) + '33', borderRadius: 5, padding: '0.2rem 0.45rem' }}>{rec.priority}</span>
                    {rec.category && <span style={{ fontSize: '0.46rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED, background: BG, border: '1px solid ' + BORDER, borderRadius: 5, padding: '0.2rem 0.45rem' }}>{rec.category}</span>}
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