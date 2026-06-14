'use client'
import { useState, useEffect } from 'react'

const GOLD = '#C9A84C', GOLD_LIGHT = 'rgba(201,169,76,0.10)', BG = '#F8F5EF', WHITE = '#FFFFFF', TEXT = '#2A1A0E', MUTED = 'rgba(42,26,14,0.5)', BORDER = 'rgba(201,169,76,0.2)', GREEN = '#15803d', AMBER = '#b45309', RED = '#dc2626'

export default function HotelAuditPage() {
  const [url, setUrl] = useState('')
  const [city, setCity] = useState('')
  const [password, setPassword] = useState('')
  const [hotelId, setHotelId] = useState('')
  const [hotels, setHotels] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [r, setR] = useState<any>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('password'); if (p) setPassword(p)
    const load = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data } = await sb.from('hotels').select('id, name, region, direct_booking_url').eq('is_active', true).order('name')
        if (data) setHotels(data)
      } catch {}
    }
    load()
  }, [])

  const run = async () => {
    if (!url.trim()) return
    setLoading(true); setError(''); setR(null)
    try {
      const res = await fetch('/api/hotel-audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, city, password, hotelId: hotelId || undefined }) })
      const data = await res.json()
      if (data.error) setError(data.error); else setR(data)
    } catch { setError('Request failed (the audit may have timed out — full audits take 2–3 minutes).') } finally { setLoading(false) }
  }

  const sc = (v: number) => v >= 75 ? GREEN : v >= 50 ? AMBER : RED
  const pf = (s: string) => s === 'PASS' || s === 'YES' ? GREEN : s === 'PARTIAL' ? AMBER : s === 'Not assessed from crawled pages' ? MUTED : RED
  const inp: any = { width: '100%', padding: '0.6rem 0.8rem', borderRadius: 6, border: '1px solid ' + BORDER, background: WHITE, color: TEXT, fontSize: '0.75rem', boxSizing: 'border-box', fontFamily: 'Montserrat, sans-serif' }
  const grouped = (rs: any[], k: string) => rs.filter((x: any) => x.readiness === k)
  const path = (u: string) => { try { return new URL(u).pathname || u } catch { return u } }
  const card: any = { background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, overflow: 'hidden', marginBottom: '1rem' }
  const head: any = { padding: '0.9rem 1.5rem', borderBottom: '1px solid ' + BORDER, background: BG }

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '2.5rem', fontFamily: 'Montserrat, sans-serif' }}>
      <style>{`@media print { .no-print { display: none !important } }`}</style>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.9rem', color: TEXT, margin: '0 0 0.25rem' }}>Hotel AI Architecture Audit</p>
        <p style={{ fontSize: '0.72rem', color: MUTED, margin: '0 0 1.5rem' }}>Crawls up to 18 pages, tests AI recommendation-readiness against demand prompts, and audits the full AI-first architecture — evidence-based only, with anything unverifiable marked “Not assessed from crawled pages.”</p>

        <div className="no-print" style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: '0.3rem' }}>Your hotel <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional — saves to dashboard & loads its prompt set)</span></label>
            <select value={hotelId} onChange={e => { const h = hotels.find(x => x.id === e.target.value); setHotelId(e.target.value); if (h?.direct_booking_url) setUrl(h.direct_booking_url) }} style={inp}>
              <option value="">External hotel (no database link)</option>
              {hotels.map(h => <option key={h.id} value={h.id}>{h.name} — {h.region}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div><label style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: '0.3rem' }}>Website URL</label><input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://hotel.com" style={inp} /></div>
            <div><label style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: '0.3rem' }}>City <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span></label><input value={city} onChange={e => setCity(e.target.value)} placeholder="Geneva" style={inp} /></div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" style={{ ...inp, width: 160 }} />
            <button onClick={run} disabled={loading} style={{ background: GOLD, color: '#1a0e06', border: 'none', borderRadius: 6, padding: '0.65rem 1.6rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Auditing…' : 'Run Audit'}</button>
            {r && <button onClick={() => window.print()} style={{ background: TEXT, color: WHITE, border: 'none', borderRadius: 6, padding: '0.65rem 1.4rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>Download PDF</button>}
          </div>
        </div>

        {error && <div className="no-print" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem' }}><p style={{ fontSize: '0.72rem', color: '#b91c1c', margin: 0 }}>{error}</p></div>}
        {loading && <div className="no-print" style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem', textAlign: 'center' }}><p style={{ fontSize: '0.72rem', color: MUTED, margin: 0 }}>Crawling 18 pages, testing recommendation-readiness, and analysing every page… this takes 2–3 minutes.</p></div>}

        {r && <>
          {/* SCORES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 400, color: sc(r.recommendation.score), margin: 0, lineHeight: 1 }}>{r.recommendation.score}<span style={{ fontSize: '1rem', color: MUTED }}>/100</span></p>
              <p style={{ fontSize: '0.6rem', color: TEXT, margin: '0.4rem 0 0', fontWeight: 700 }}>{r.recommendation.yes} YES · {r.recommendation.partial} PARTIAL · {r.recommendation.no} NO</p>
              <p style={{ fontSize: '0.52rem', color: MUTED, margin: '0.2rem 0 0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI Recommendation Readiness</p>
            </div>
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 400, color: sc(r.architectureScore), margin: 0, lineHeight: 1 }}>{r.architectureScore}<span style={{ fontSize: '1rem', color: MUTED }}>/100</span></p>
              <p style={{ fontSize: '0.6rem', color: TEXT, margin: '0.4rem 0 0', fontWeight: 700 }}>{r.verdict}</p>
              <p style={{ fontSize: '0.52rem', color: MUTED, margin: '0.2rem 0 0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI Architecture Compliance</p>
            </div>
          </div>

          {/* SECTION 1 — READINESS PROMPTS */}
          <div style={card}>
            <div style={{ padding: '1.25rem 1.75rem', background: `linear-gradient(180deg, ${GOLD_LIGHT} 0%, rgba(248,245,239,0) 100%)`, borderBottom: '1px solid ' + BORDER }}>
              <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.3rem' }}>Section 1 · AI recommendation readiness</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: TEXT, margin: 0 }}>Can AI recommend this hotel for each demand prompt?</p>
              <p style={{ fontSize: '0.62rem', color: MUTED, margin: '0.35rem 0 0' }}>Judged only from the site's own text. NO and PARTIAL are where recommendations go to competitors.</p>
            </div>
            <div style={{ padding: '0.5rem 1.75rem 1.25rem' }}>
              {['NO', 'PARTIAL', 'YES'].flatMap(g => grouped(r.recommendation.results, g)).map((c: any, i: number, arr: any[]) => (
                <div key={i} style={{ padding: '0.8rem 0', borderBottom: i < arr.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
                    <span style={{ fontSize: '0.74rem', color: TEXT, fontWeight: 600, flex: 1 }}>{c.question}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.55rem', fontWeight: 700, color: MUTED }}>{c.confidence}</span>
                      <span style={{ fontSize: '0.55rem', fontWeight: 700, color: pf(c.readiness), border: '1px solid ' + pf(c.readiness), borderRadius: 4, padding: '0.12rem 0.5rem' }}>{c.readiness}</span>
                    </span>
                  </div>
                  {c.evidence && <p style={{ fontSize: '0.64rem', color: MUTED, margin: '0.3rem 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>“{c.evidence}”{c.url && <span style={{ fontStyle: 'normal' }}> — {path(c.url)}</span>}</p>}
                  {c.missing && c.readiness !== 'YES' && <p style={{ fontSize: '0.62rem', color: AMBER, margin: '0.25rem 0 0' }}>Missing: {c.missing}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2 — LAYERS */}
          <div style={{ margin: '1.5rem 0 0.75rem' }}>
            <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.3rem' }}>Section 2 · Architecture audit</p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: TEXT, margin: 0 }}>The 14 layers of AI-first hotel architecture</p>
          </div>

          {r.layers.map((l: any) => (
            <div key={l.n} style={card}>
              <div style={{ ...head, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', color: TEXT }}>Layer {l.n} · {l.layer}{typeof l.score === 'number' ? <span style={{ fontFamily: 'Montserrat', fontSize: '0.6rem', color: MUTED }}>  {l.score}%</span> : null}</span>
                <span style={{ fontSize: '0.55rem', fontWeight: 700, color: pf(l.result), border: '1px solid ' + pf(l.result), borderRadius: 4, padding: '0.12rem 0.5rem' }}>{l.result}</span>
              </div>
              <div style={{ padding: '0.75rem 1.5rem 1rem' }}>
                {l.present && l.present.length > 0 && <p style={{ fontSize: '0.64rem', color: GREEN, margin: '0 0 0.3rem' }}>Present: {l.present.join(', ')}</p>}
                {l.missing && l.missing.length > 0 && <p style={{ fontSize: '0.64rem', color: AMBER, margin: '0 0 0.3rem' }}>Missing: {l.missing.join(', ')}</p>}
                {l.level && <p style={{ fontSize: '0.64rem', color: TEXT, margin: '0 0 0.3rem' }}>{l.level}{typeof l.count === 'number' ? ` · ${l.count} named entities` : ''}</p>}
                {l.note && <p style={{ fontSize: '0.62rem', color: MUTED, margin: '0.2rem 0 0', lineHeight: 1.5 }}>{l.note}</p>}
                {l.n === 0 && l.detail && l.detail.map((d: any, j: number) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: j < l.detail.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                    <span style={{ fontSize: '0.64rem', color: TEXT }}>{d.topic}</span>
                    <span style={{ fontSize: '0.6rem', color: d.status === 'Single source' ? GREEN : d.status === 'Missing' ? RED : AMBER }}>{d.status} <span style={{ color: MUTED }}>· {d.note}</span></span>
                  </div>
                ))}
                {l.n === 4 && l.detail && l.detail.rooms && l.detail.rooms.map((rm: any, j: number) => (
                  <div key={j} style={{ padding: '0.4rem 0', borderBottom: j < l.detail.rooms.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.62rem', color: TEXT }}>{path(rm.url)}</span><span style={{ fontSize: '0.62rem', fontWeight: 700, color: sc(rm.score) }}>{rm.score}%</span></div>
                    {rm.missing.length > 0 && <p style={{ fontSize: '0.58rem', color: AMBER, margin: '0.15rem 0 0' }}>Missing: {rm.missing.join(', ')}</p>}
                  </div>
                ))}
                {l.n === 11 && l.clusters && l.clusters.map((cl: any, j: number) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: j < l.clusters.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                    <span style={{ fontSize: '0.64rem', color: TEXT }}>{cl.cluster} cluster</span>
                    <span style={{ fontSize: '0.6rem', color: cl.strength === 'Strong' ? GREEN : cl.strength === 'Moderate' ? AMBER : RED }}>{cl.strength} <span style={{ color: MUTED }}>· {cl.pages} pages, {cl.internalEdges} links</span></span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* PAGE BY PAGE */}
          <div style={card}>
            <div style={head}><p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', color: TEXT, margin: 0 }}>Page-by-page analysis ({r.pageByPage.length} crawled)</p></div>
            <div style={{ padding: '0.5rem 1.5rem 1rem' }}>
              {r.pageByPage.map((p: any, i: number) => (
                <div key={i} style={{ padding: '0.6rem 0', borderBottom: i < r.pageByPage.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
                    <span style={{ fontSize: '0.66rem', color: TEXT, fontWeight: 600 }}>{path(p.url)} <span style={{ fontSize: '0.55rem', color: MUTED, textTransform: 'uppercase' }}>{p.type}</span></span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: p.score === null ? MUTED : sc(p.score), flexShrink: 0 }}>{p.score === null ? '—' : p.score + '%'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                    {p.quickFacts && <span style={{ fontSize: '0.52rem', color: GREEN }}>✓ Quick Facts</span>}
                    {p.aiSummary && <span style={{ fontSize: '0.52rem', color: GREEN }}>✓ AI summary</span>}
                    {p.present.length > 0 && <span style={{ fontSize: '0.55rem', color: MUTED }}>Has: {p.present.join(', ')}</span>}
                    {p.missing.length > 0 && <span style={{ fontSize: '0.55rem', color: AMBER }}>Missing: {p.missing.join(', ')}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NOT ASSESSED + CRAWL */}
          <div style={{ background: BG, border: '1px solid ' + BORDER, borderRadius: 12, padding: '1rem 1.5rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, margin: '0 0 0.4rem' }}>Not assessed from crawled pages</p>
            <p style={{ fontSize: '0.6rem', color: MUTED, margin: 0, lineHeight: 1.6 }}>{(r.notAssessed || []).join(' · ')}</p>
          </div>
          <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '1rem 1.5rem' }}>
            <p style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED, margin: '0 0 0.6rem' }}>Pages crawled ({r.crawlDepth} of max {r.crawlLimit})</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {r.pagesScraped.map((p: any, i: number) => <span key={i} style={{ fontSize: '0.6rem', fontWeight: 600, color: TEXT, background: BG, border: '1px solid ' + BORDER, borderRadius: 20, padding: '0.3rem 0.75rem' }}>{path(p.url)}</span>)}
            </div>
            {r.robots && r.robots.blocked && r.robots.blocked.length > 0 && <p style={{ fontSize: '0.6rem', color: RED, margin: '0.6rem 0 0' }}>⚠ robots.txt blocks: {r.robots.blocked.join(', ')}</p>}
          </div>
        </>}
      </div>
    </div>
  )
}