'use client'
import { useState } from 'react'

const GOLD = '#C9A84C', GOLD_LIGHT = 'rgba(201,169,76,0.10)', BG = '#F8F5EF', WHITE = '#FFFFFF', TEXT = '#2A1A0E', MUTED = 'rgba(42,26,14,0.5)', BORDER = 'rgba(201,169,76,0.2)', GREEN = '#15803d', AMBER = '#b45309', RED = '#dc2626'
const HOTEL_TYPES = ['Luxury', 'Spa & wellness', 'Family', 'Business / city', 'Boutique', 'Resort', 'Ski', 'Other']

export default function HotelAuditPage() {
  const [url, setUrl] = useState('')
  const [city, setCity] = useState('')
  const [hotelType, setHotelType] = useState('Luxury')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [r, setR] = useState<any>(null)

  const run = async () => {
    if (!url.trim()) return
    setLoading(true); setError(''); setR(null)
    try {
      const res = await fetch('/api/hotel-audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, city, hotelType, password }) })
      const data = await res.json()
      if (data.error) setError(data.error); else setR(data)
    } catch { setError('Request failed (the audit may have timed out — try fewer pages).') } finally { setLoading(false) }
  }

  const scoreColor = (v: number) => v >= 75 ? GREEN : v >= 50 ? AMBER : RED
  const prColor = (p: string) => p === 'Critical' ? RED : p === 'High' ? AMBER : p === 'Medium' ? GOLD : MUTED
  const inp: any = { width: '100%', padding: '0.6rem 0.8rem', borderRadius: 6, border: '1px solid ' + BORDER, background: WHITE, color: TEXT, fontSize: '0.75rem', boxSizing: 'border-box', fontFamily: 'Montserrat, sans-serif' }
  const areaChecklist = (label: string) => (r.checklist || []).filter((c: any) => c.area === label)

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '2.5rem', fontFamily: 'Montserrat, sans-serif' }}>
      <style>{`@media print { .no-print { display: none !important } }`}</style>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.9rem', color: TEXT, margin: '0 0 0.25rem' }}>Hotel Website AI Audit</p>
        <p style={{ fontSize: '0.72rem', color: MUTED, margin: '0 0 1.5rem' }}>Enter a hotel website. It crawls the key pages, checks them against a fixed AI-visibility checklist, scores the site, and tells you exactly what to add.</p>

        <div className="no-print" style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div><label style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: '0.3rem' }}>Website URL</label><input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://hotel.com" style={inp} /></div>
            <div><label style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: '0.3rem' }}>City</label><input value={city} onChange={e => setCity(e.target.value)} placeholder="Geneva" style={inp} /></div>
            <div><label style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: '0.3rem' }}>Type</label><select value={hotelType} onChange={e => setHotelType(e.target.value)} style={inp}>{HOTEL_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" style={{ ...inp, width: 160 }} />
            <button onClick={run} disabled={loading} style={{ background: GOLD, color: '#1a0e06', border: 'none', borderRadius: 6, padding: '0.65rem 1.6rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Auditing…' : 'Run Audit'}</button>
            {r && <button onClick={() => window.print()} style={{ background: TEXT, color: WHITE, border: 'none', borderRadius: 6, padding: '0.65rem 1.4rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>Download PDF</button>}
          </div>
        </div>

        {error && <div className="no-print" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem' }}><p style={{ fontSize: '0.72rem', color: '#b91c1c', margin: 0 }}>{error}</p></div>}
        {loading && <div className="no-print" style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem', textAlign: 'center' }}><p style={{ fontSize: '0.72rem', color: MUTED, margin: 0 }}>Crawling pages and checking each against the AI checklist… can take a minute or two.</p></div>}

        {r && <>
          {/* SCORE */}
          <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '1.75rem', marginBottom: '1.25rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3.25rem', fontWeight: 400, color: scoreColor(r.overall), margin: 0, lineHeight: 1 }}>{r.overall}<span style={{ fontSize: '1rem', color: MUTED }}>/100</span></p>
              <p style={{ fontSize: '0.55rem', color: MUTED, margin: '0.3rem 0 0', letterSpacing: '0.05em' }}>AI VISIBILITY SCORE</p>
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid ' + BORDER, paddingLeft: '2rem' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: TEXT, margin: '0 0 0.8rem' }}>{r.verdict}</p>
              {r.areas.map((a: any) => (
                <div key={a.key} style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', marginBottom: '0.15rem' }}><span>{a.label} <span style={{ color: MUTED }}>· {a.weight}%</span></span><span style={{ color: scoreColor(a.score), fontWeight: 700 }}>{a.score}</span></div>
                  <div style={{ height: 5, background: BG, borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: a.score + '%', background: scoreColor(a.score) }} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* TOP RECOMMENDATIONS */}
          {r.recommendations.length > 0 && <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, overflow: 'hidden', marginBottom: '1.25rem' }}>
            <div style={{ padding: '1.25rem 1.75rem', background: `linear-gradient(180deg, ${GOLD_LIGHT} 0%, rgba(248,245,239,0) 100%)`, borderBottom: '1px solid ' + BORDER }}>
              <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.3rem' }}>What to fix</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: TEXT, margin: 0 }}>Recommendations, in priority order</p>
            </div>
            <div style={{ padding: '0.5rem 1.75rem 1.25rem' }}>
              {r.recommendations.map((rec: any, i: number) => (
                <div key={i} style={{ padding: '1rem 0', borderBottom: i < r.recommendations.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: prColor(rec.priority), border: '1px solid ' + prColor(rec.priority), borderRadius: 4, padding: '0.12rem 0.45rem' }}>{rec.priority}</span>
                    <span style={{ fontSize: '0.5rem', color: MUTED, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{rec.area}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: TEXT, margin: '0 0 0.25rem' }}>{rec.title}</p>
                  <p style={{ fontSize: '0.68rem', color: MUTED, margin: '0 0 0.4rem', lineHeight: 1.6 }}>{rec.why}</p>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>{rec.include.map((x: string, j: number) => <li key={j} style={{ fontSize: '0.66rem', color: TEXT, marginBottom: '0.15rem', lineHeight: 1.5 }}>{x}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>}

          {/* CHECKLIST */}
          {['Technical', 'Content', 'AI readiness', 'Schema', 'Conversion'].map(area => (
            <div key={area} style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, overflow: 'hidden', marginBottom: '0.9rem' }}>
              <div style={{ padding: '0.9rem 1.5rem', borderBottom: '1px solid ' + BORDER, background: BG }}><p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', color: TEXT, margin: 0 }}>{area}</p></div>
              <div style={{ padding: '0.5rem 1.5rem 0.9rem' }}>
                {areaChecklist(area).map((c: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.4rem 0', borderBottom: i < areaChecklist(area).length - 1 ? '1px solid ' + BORDER : 'none' }}>
                    <span style={{ color: c.ok ? GREEN : RED, fontWeight: 700, fontSize: '0.78rem', flexShrink: 0 }}>{c.ok ? '✓' : '✗'}</span>
                    <span style={{ fontSize: '0.68rem', color: c.ok ? MUTED : TEXT, flex: 1 }}>{c.item}{c.detail && <span style={{ color: MUTED }}> — {c.detail}</span>}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <p style={{ fontSize: '0.58rem', color: MUTED, margin: '0.75rem 0.5rem 0' }}>Pages crawled: {(r.pagesScraped || []).length} · {(r.pagesScraped || []).map((u: string) => { try { return new URL(u).pathname } catch { return u } }).join('  ')}</p>
        </>}
      </div>
    </div>
  )
}