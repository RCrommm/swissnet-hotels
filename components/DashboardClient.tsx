'use client'
import { useState, useEffect } from 'react'

const GOLD = '#C9A84C'
const GOLD_LIGHT = 'rgba(201,169,76,0.10)'
const BG = '#F8F5EF'
const WHITE = '#FFFFFF'
const TEXT = '#2A1A0E'
const TEXT_MUTED = 'rgba(42,26,14,0.5)'
const BORDER = 'rgba(201,169,76,0.15)'
const GREEN = '#16a34a'
const RED = '#dc2626'
const BLUE = '#3b82f6'
const PURPLE = '#8B5CF6'

// ── CATEGORY COMPETITOR DATA ──────────────────────────────────────────────────

const CATEGORY_COMPETITORS: Record<string, { label: string; hotels: string[] }> = {
  spa: {
    label: 'Spa & Wellness',
    hotels: [
      'Bürgenstock Resort',
      'The Dolder Grand',
      'Six Senses Crans-Montana',
      'Grand Resort Bad Ragaz',
      'The Chedi Andermatt',
      'Clinique La Prairie',
      'La Réserve Genève',
      'Le Grand Bellevue Gstaad',
      'Suvretta House',
    ],
  },
  ski: {
    label: 'Ski Resort',
    hotels: [
      "Badrutt's Palace Hotel",
      'The Chedi Andermatt',
      'The Alpina Gstaad',
      'Kulm Hotel St. Moritz',
      'Mont Cervin Palace',
      'Suvretta House',
      'Grand Hotel Kronenhof Pontresina',
      'Palace Hotel Gstaad',
      'Kempinski Grand Hotel des Bains St. Moritz',
    ],
  },
  dining: {
    label: 'Fine Dining',
    hotels: [
      'Grand Resort Bad Ragaz',
      'Les Trois Rois Basel',
      'The Chedi Andermatt',
      'Giardino Mountain St. Moritz',
      'Carlton Hotel St. Moritz',
      'Baur au Lac',
      'La Réserve Genève',
      'Victoria-Jungfrau Grand Hotel Interlaken',
      'Beau-Rivage Palace Lausanne',
    ],
  },
  business: {
    label: 'Business & City',
    hotels: [
      'Baur au Lac',
      'Four Seasons Hotel des Bergues Geneva',
      'The Dolder Grand',
      'Mandarin Oriental Geneva',
      'Widder Hotel Zurich',
      'La Réserve Genève',
      'Park Hyatt Zurich',
      'Bellevue Palace',
      'La Réserve Eden au Lac Zurich',
    ],
  },
  romantic: {
    label: 'Romantic',
    hotels: [
      'The Alpina Gstaad',
      "Badrutt's Palace Hotel",
      'La Réserve Genève',
      'Mont Cervin Palace',
      'Eden Roc Ascona',
      'Castello del Sole Ascona',
      'Beau-Rivage Palace Lausanne',
      'Victoria-Jungfrau Grand Hotel Interlaken',
      'The Chedi Andermatt',
    ],
  },
  lake: {
    label: 'Lake Hotel',
    hotels: [
      'Bürgenstock Resort',
      'La Réserve Genève',
      'Beau-Rivage Palace Lausanne',
      'La Réserve Eden au Lac Zurich',
      'Fairmont Le Montreux Palace',
      'Eden Roc Ascona',
      'Castello del Sole Ascona',
      'Grand Hotel Villa Castagnola Lugano',
      'Grand Hotel Vitznauerhof Lucerne',
    ],
  },
}

// Max 2 categories per hotel + region always shown
const HOTEL_CATEGORIES: Record<string, string[]> = {
  'La Réserve Genève': ['spa', 'dining', 'romantic', 'lake', 'business'],
  'La Réserve Eden au Lac Zurich': ['business', 'romantic', 'lake', 'dining'],
  'Victoria-Jungfrau Grand Hotel Interlaken': ['spa', 'dining', 'romantic'],
  'Mont Cervin Palace': ['ski', 'dining', 'romantic'],
  'Bellevue Palace': ['business', 'dining', 'romantic'],
  'Hotel Adula': ['spa', 'ski'],
  'Crans Ambassador': ['ski', 'spa'],
  'Alpengold Hotel': ['ski', 'business'],
  'Schweizerhof Zermatt': ['ski', 'spa'],
  'Monte Rosa Zermatt': ['ski', 'romantic'],
}

// ── CHART COMPONENTS ──────────────────────────────────────────────────────────

function SparkLine({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80, h = 28
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  )
}

function LineChart({ datasets, labels, height = 140 }: { datasets: { data: number[]; color: string; label: string }[]; labels: string[]; height?: number }) {
  const allVals = datasets.flatMap(d => d.data)
  const max = Math.max(...allVals) || 1
  const w = 600, h = height
  const padL = 32, padB = 20, padR = 16, padT = 8
  const chartW = w - padL - padR
  const chartH = h - padB - padT
  const n = datasets[0]?.data?.length || 1
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      {[0, 0.5, 1].map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={padT + chartH * (1 - t)} x2={w - padR} y2={padT + chartH * (1 - t)} stroke={BORDER} strokeWidth="1" />
          <text x={padL - 6} y={padT + chartH * (1 - t) + 4} textAnchor="end" fill={TEXT_MUTED} fontSize="9">{Math.round(max * t)}</text>
        </g>
      ))}
      {datasets.map((ds, si) => {
        if (n < 2) return null
        const pts = ds.data.map((v, i) => `${padL + (i / (n - 1)) * chartW},${padT + chartH - (v / max) * chartH}`).join(' ')
        return <polyline key={si} points={pts} fill="none" stroke={ds.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      })}
      {labels.filter((_, i) => i % Math.ceil(n / 5) === 0).map((label, i) => {
        const idx = labels.indexOf(label)
        return <text key={i} x={padL + (idx / (n - 1)) * chartW} y={h - 4} textAnchor="middle" fill={TEXT_MUTED} fontSize="8">{label.slice(5)}</text>
      })}
    </svg>
  )
}

function DualAxisChart({ datasets, labels, height = 160, hotelId }: { datasets: { data: number[]; color: string; label: string }[]; labels: string[]; height?: number; hotelId?: string }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [markers, setMarkers] = useState<{ idx: number; label: string; type: string }[]>([])

  useEffect(() => {
    if (!hotelId) return
    const load = async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const [{ data: faqs }, { data: offers }] = await Promise.all([
        sb.from('hotel_faq_suggestions').select('page_type, created_at').eq('hotel_id', hotelId).eq('status', 'approved').order('created_at'),
        sb.from('hotel_offers').select('name, created_at').eq('hotel_id', hotelId).eq('offer_type', 'temporary').eq('is_available', true).order('created_at'),
      ])
      const events: { date: string; label: string; type: string }[] = []
      const seenFaqDates = new Set<string>()
      for (const f of faqs || []) {
        const date = f.created_at?.split('T')[0]
        if (date && !seenFaqDates.has(date)) {
          seenFaqDates.add(date)
          events.push({ date, label: 'FAQs updated', type: 'faq' })
        }
      }
      for (const o of offers || []) {
        const date = o.created_at?.split('T')[0]
        if (date) events.push({ date, label: o.name || 'Offer published', type: 'offer' })
      }
      const result = events.map(e => {
        const idx = labels.indexOf(e.date)
        if (idx === -1) return null
        return { idx, label: e.label, type: e.type }
      }).filter(Boolean) as { idx: number; label: string; type: string }[]
      setMarkers(result)
    }
    load()
  }, [hotelId, labels.join(',')])

  const clicks = datasets.find(d => d.label === 'Clicks')?.data || []
  const views = datasets.find(d => d.label === 'Views')?.data || []
  const n = labels.length
  if (n < 2) return null

  const maxClicks = Math.max(...clicks) || 1
  const maxViews = Math.max(...views) || 1
  const W = 580, H = height + 60
  const pL = 32, pR = 32, pT = 24, pB = 24
  const cW = W - pL - pR
  const cH = H - pT - pB
  const cx = (i: number) => pL + (i / (n - 1)) * cW
  const cyC = (v: number) => pT + cH - (v / maxClicks) * cH
  const cyV = (v: number) => pT + cH - (v / maxViews) * cH

  const smooth = (pts: [number, number][]) => {
    if (pts.length < 2) return ''
    let d = `M${pts[0][0]},${pts[0][1]}`
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i]
      const t = 0.35
      d += ` C${x0 + (x1 - x0) * t},${y0} ${x1 - (x1 - x0) * t},${y1} ${x1},${y1}`
    }
    return d
  }

  const vPts: [number, number][] = views.map((v, i) => [cx(i), cyV(v)])
  const cPts: [number, number][] = clicks.map((v, i) => [cx(i), cyC(v)])
  const vPath = smooth(vPts)
  const vArea = vPath + ` L${cx(n - 1)},${pT + cH} L${cx(0)},${pT + cH} Z`
  const cPath = smooth(cPts)
  const xLabels = labels.filter((_, i) => i % Math.ceil(n / 6) === 0)
  const hoverX = hoverIdx !== null ? cx(hoverIdx) : null
  const hoverClickVal = hoverIdx !== null ? clicks[hoverIdx] : null
  const hoverViewVal = hoverIdx !== null ? views[hoverIdx] : null
  const hoverLabel = hoverIdx !== null ? labels[hoverIdx] : null

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const svgX = ((e.clientX - rect.left) / rect.width) * W
          const idx = Math.round(((svgX - pL) / cW) * (n - 1))
          setHoverIdx(Math.max(0, Math.min(n - 1, idx)))
        }}
        onMouseLeave={() => setHoverIdx(null)}>
        <defs>
          <linearGradient id="vFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.07" />
            <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <clipPath id="chartClip"><rect x={pL} y={pT} width={cW} height={cH} /></clipPath>
        </defs>
        {[0, 0.5, 1].map((t, i) => (
          <line key={i} x1={pL} y1={pT + cH * (1 - t)} x2={pL + cW} y2={pT + cH * (1 - t)} stroke="rgba(201,169,76,0.06)" strokeWidth="1" />
        ))}
        <line x1={pL} y1={pT + cH} x2={pL + cW} y2={pT + cH} stroke="rgba(201,169,76,0.1)" strokeWidth="0.5" />
        {[0, 0.5, 1].map((t, i) => (
          <g key={i}>
            <text x={pL - 6} y={pT + cH * (1 - t) + 3} textAnchor="end" fill="rgba(42,26,14,0.5)" fontSize="7.5" fontFamily="Montserrat, sans-serif">{Math.round(maxClicks * t)}</text>
            <text x={pL + cW + 5} y={pT + cH * (1 - t) + 3} textAnchor="start" fill="rgba(59,130,246,0.5)" fontSize="7.5" fontFamily="Montserrat, sans-serif">{Math.round(maxViews * t)}</text>
          </g>
        ))}
        {markers.map((m, i) => (
          <g key={i}>
            <line x1={cx(m.idx)} y1={pT - 14} x2={cx(m.idx)} y2={pT + cH} stroke={m.type === 'faq' ? 'rgba(201,169,76,0.2)' : 'rgba(59,130,246,0.2)'} strokeWidth="1" strokeDasharray="2 3" />
            <circle cx={cx(m.idx)} cy={pT - 18} r="4" fill="white" stroke={m.type === 'faq' ? GOLD : BLUE} strokeWidth="1" opacity="0.7" />
            <text x={cx(m.idx)} y={pT - 26} textAnchor="middle" fill="rgba(42,26,14,0.35)" fontSize="6.5" fontFamily="Montserrat, sans-serif">{m.label}</text>
          </g>
        ))}
        <g clipPath="url(#chartClip)">
          <path d={vArea} fill="url(#vFill)" />
          <path d={vPath} fill="none" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={hoverIdx !== null ? 0.85 : 0.65} />
          <path d={cPath} fill="none" stroke={GOLD} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity={hoverIdx !== null ? 0.7 : 0.5} />
        </g>
        {hoverX !== null && (
          <g>
            <line x1={hoverX} y1={pT} x2={hoverX} y2={pT + cH} stroke="rgba(42,26,14,0.08)" strokeWidth="1" />
            <circle cx={hoverX} cy={cyV(hoverViewVal!)} r="3" fill={WHITE} stroke={BLUE} strokeWidth="1.5" opacity="0.9" />
            <circle cx={hoverX} cy={cyC(hoverClickVal!)} r="2.5" fill={WHITE} stroke={GOLD} strokeWidth="1.5" opacity="0.9" />
          </g>
        )}
        {xLabels.map((label, i) => {
          const idx = labels.indexOf(label)
          return <text key={i} x={cx(idx)} y={H - 4} textAnchor="middle" fill="rgba(42,26,14,0.5)" fontSize="7.5" fontFamily="Montserrat, sans-serif">{label.slice(5)}</text>
        })}
      </svg>
      {hoverIdx !== null && hoverX !== null && (
        <div style={{ position: 'absolute', left: `${(hoverX / W) * 100}%`, top: `${(pT / H) * 100 + 2}%`, transform: hoverX > W * 0.65 ? 'translateX(-110%)' : 'translateX(8px)', background: BG, border: '1px solid ' + BORDER, borderRadius: 6, padding: '0.5rem 0.75rem', pointerEvents: 'none', boxShadow: '0 2px 12px rgba(42,26,14,0.08)', minWidth: 100, zIndex: 10 }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', color: TEXT_MUTED, margin: '0 0 0.35rem', letterSpacing: '0.05em' }}>{hoverLabel?.slice(5)}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: BLUE, opacity: 0.7 }} />
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT }}>{hoverViewVal} views</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, opacity: 0.7 }} />
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT }}>{hoverClickVal} booking clicks</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── SMALL COMPONENTS ──────────────────────────────────────────────────────────

function KPICard({ label, value, sub, color, spark }: { label: string; value: string | number; sub: string; color: string; spark?: number[] }) {
  return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.25rem 1.5rem', flex: 1, minWidth: 0 }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.75rem' }}>{label}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, color: TEXT, margin: '0 0 0.2rem', lineHeight: 1 }}>{value}</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color, margin: 0 }}>{sub}</p>
        </div>
        {spark && <SparkLine data={spark} color={color} />}
      </div>
    </div>
  )
}

function InsightCard({ text, type = 'info' }: { text: string; type?: 'info' | 'warning' | 'success' }) {
  const colors = { info: GOLD, warning: '#d97706', success: GREEN }
  return (
    <div style={{ background: GOLD_LIGHT, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${colors[type]}`, borderRadius: 8, padding: '1rem 1.25rem' }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT, margin: 0, lineHeight: 1.7 }}>{text}</p>
    </div>
  )
}

function CountryBreakdown({ hotelId, period }: { hotelId: string; period: number }) {
  const [data, setData] = useState<{ country: string; count: number }[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!hotelId) return
    const load = async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString()
      const { data: views } = await sb.from('hotel_views').select('country').eq('hotel_id', hotelId).gte('viewed_at', since).not('country', 'is', null)
      if (views) {
        const counts: Record<string, number> = {}
        for (const v of views) { if (v.country) counts[v.country] = (counts[v.country] || 0) + 1 }
        setData(Object.entries(counts).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count).slice(0, 10))
      }
      setLoaded(true)
    }
    load()
  }, [hotelId, period])

  const total = data.reduce((s, d) => s + d.count, 0)
  const countryName = (code: string) => { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code } catch { return code } }

  if (!loaded) return <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>Loading...</p>
  if (data.length === 0) return <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>No country data yet — new visits will be tracked automatically.</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {data.map(({ country, count }) => (
        <div key={country} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid ' + BORDER }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT }}>{countryName(country)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 80, height: 4, background: BORDER, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: Math.round((count / total) * 100) + '%', background: GOLD, borderRadius: 2 }} />
            </div>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 600, color: GOLD, minWidth: 20 }}>{count}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── OPTIMISE TAB ──────────────────────────────────────────────────────────────

function OptimiseTab({ hotelId, hotelName, hotelSlug }: { hotelId: string; hotelName: string; hotelSlug: string }) {
  const [mainTab, setMainTab] = useState<'overview' | 'events' | 'rooms' | 'dining' | 'spa' | 'experiences'>('overview')
  const [subTab, setSubTab] = useState<'content' | 'faqs'>('faqs')
  const [faqs, setFaqs] = useState<Record<string, { q: string; a: string }[]>>({ overview: [], rooms: [], dining: [], spa: [], experiences: [], events: [] })
  const [offers, setOffers] = useState<any[]>([])
  const [offerForm, setOfferForm] = useState<any>(null)
  const [experiences, setExperiences] = useState<any[]>([])
  const [expForm, setExpForm] = useState<any>(null)
  const [spaContent, setSpaContent] = useState<any[]>([])
  const [spaForm, setSpaForm] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (loaded || !hotelId) return
    const load = async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const [{ data: offersData }, { data: expData }, { data: spaData }, { data: contentData }, { data: faqData }] = await Promise.all([
        sb.from('hotel_offers').select('*').eq('hotel_id', hotelId).eq('is_available', true).eq('offer_type', 'temporary').order('sort_order'),
        sb.from('hotel_experiences').select('*').eq('hotel_id', hotelId).eq('is_available', true).order('sort_order'),
        sb.from('hotel_spa').select('*').eq('hotel_id', hotelId).eq('is_available', true).order('created_at'),
        sb.from('hotel_content').select('faqs').eq('hotel_id', hotelId).single(),
        sb.from('hotel_faq_suggestions').select('*').eq('hotel_id', hotelId).order('created_at'),
      ])
      setOffers(offersData || [])
      setExperiences(expData || [])
      setSpaContent(spaData || [])
      const ovFaqs = (contentData?.faqs || []).map((f: any) => ({ q: f.question, a: f.answer }))
      const grouped: Record<string, { q: string; a: string }[]> = { overview: ovFaqs, rooms: [], dining: [], spa: [], experiences: [], events: [] }
      for (const f of faqData || []) { if (grouped[f.page_type] !== undefined) grouped[f.page_type].push({ q: f.question, a: f.answer }) }
      setFaqs(grouped)
      setLoaded(true)
    }
    load()
  }, [hotelId, loaded])

  const notify = async (action: string, detail: string) => {
    await fetch('/api/notify-change', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hotel_name: hotelName, action, detail }) }).catch(() => {})
  }

  const saveFaqs = async (page: string) => {
    setSaving(true)
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const validFaqs = faqs[page].filter(f => f.q.trim() && f.a.trim())
    if (page === 'overview') {
      await sb.from('hotel_content').update({ faqs: validFaqs.map(f => ({ question: f.q, answer: f.a })) }).eq('hotel_id', hotelId)
      await notify('Overview FAQs updated', `${validFaqs.length} FAQs`)
      setMsg('Overview FAQs updated and live.')
    } else {
      await sb.from('hotel_faq_suggestions').delete().eq('hotel_id', hotelId).eq('page_type', page)
      if (validFaqs.length > 0) {
        await sb.from('hotel_faq_suggestions').insert(validFaqs.map(f => ({ hotel_id: hotelId, hotel_name: hotelName, page_type: page, question: f.q, answer: f.a, status: 'approved' })))
      }
      await notify('FAQs updated', `${page}: ${validFaqs.length} FAQs`)
      setMsg('FAQs saved and live.')
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 4000)
  }

  const saveOffer = async () => {
    if (!offerForm?.name?.trim() || !offerForm?.description?.trim()) return
    setSaving(true)
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const payload = { hotel_id: hotelId, name: offerForm.name, description: offerForm.description, start_date: offerForm.start_date || null, end_date: offerForm.end_date || null, is_available: true, active: true, offer_type: 'temporary', sort_order: offers.length }
    if (offerForm.id) {
      await sb.from('hotel_offers').update(payload).eq('id', offerForm.id)
      setOffers(prev => prev.map(o => o.id === offerForm.id ? { ...o, ...payload } : o))
      await notify('Event updated', offerForm.name)
    } else {
      const { data } = await sb.from('hotel_offers').insert(payload).select().single()
      if (data) setOffers(prev => [...prev, data])
      await notify('Event added', offerForm.name)
    }
    setOfferForm(null); setSaving(false); setMsg('Event saved.')
    setTimeout(() => setMsg(''), 3000)
  }

  const archiveOffer = async (id: string, name: string) => {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.from('hotel_offers').update({ is_available: false }).eq('id', id)
    setOffers(prev => prev.filter(o => o.id !== id))
    await notify('Event removed', name); setMsg('Event removed.')
    setTimeout(() => setMsg(''), 3000)
  }

  const saveSpa = async () => {
    if (!spaForm) return
    setSaving(true)
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const payload = { hotel_id: hotelId, name: spaForm.name || null, description: spaForm.description || null, treatments: spaForm.treatments || null, wellness_philosophy: spaForm.wellness_philosophy || null, size_sqm: spaForm.size_sqm ? Number(spaForm.size_sqm) : null, pool: spaForm.pool || false, sauna: spaForm.sauna || false, hammam: spaForm.hammam || false, price_from: spaForm.price_from ? Number(spaForm.price_from) : null, opening_hours: spaForm.opening_hours || null, is_available: true }
    if (spaForm.id) {
      await sb.from('hotel_spa').update(payload).eq('id', spaForm.id)
      setSpaContent((prev: any[]) => prev.map(s => s.id === spaForm.id ? { ...s, ...payload } : s))
    } else {
      const { data } = await sb.from('hotel_spa').insert(payload).select().single()
      if (data) setSpaContent((prev: any[]) => [...prev, data])
    }
    setSpaForm(null)
    await notify('Spa content updated', spaForm.name || 'Spa')
    setMsg('Spa content updated and live in schema.'); setSaving(false)
    setTimeout(() => setMsg(''), 4000)
  }

  const removeSpa = async (id: string, name: string) => {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.from('hotel_spa').update({ is_available: false }).eq('id', id)
    setSpaContent((prev: any[]) => prev.filter(s => s.id !== id))
    await notify('Spa venue removed', name); setMsg('Removed.')
    setTimeout(() => setMsg(''), 3000)
  }

  const saveExperience = async () => {
    if (!expForm?.name?.trim() || !expForm?.description?.trim()) return
    setSaving(true)
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const payload = { hotel_id: hotelId, name: expForm.name, description: expForm.description, category: expForm.category || null, duration: expForm.duration || null, price_from: expForm.price_from ? Number(expForm.price_from) : null, is_available: true, sort_order: expForm.sort_order ?? experiences.length }
    if (expForm.id) {
      await sb.from('hotel_experiences').update(payload).eq('id', expForm.id)
      setExperiences(prev => prev.map(e => e.id === expForm.id ? { ...e, ...payload } : e))
      await notify('Experience updated', expForm.name)
    } else {
      const { data } = await sb.from('hotel_experiences').insert(payload).select().single()
      if (data) setExperiences(prev => [...prev, data])
      await notify('Experience added', expForm.name)
    }
    setExpForm(null); setSaving(false); setMsg('Experience saved and live.')
    setTimeout(() => setMsg(''), 3000)
  }

  const removeExperience = async (id: string, name: string) => {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.from('hotel_experiences').update({ is_available: false }).eq('id', id)
    setExperiences(prev => prev.filter(e => e.id !== id))
    await notify('Experience removed', name); setMsg('Experience removed.')
    setTimeout(() => setMsg(''), 3000)
  }

  const updateFaq = (page: string, idx: number, field: 'q' | 'a', value: string) => {
    setFaqs(prev => { const updated = [...(prev[page] || [])]; updated[idx] = { ...updated[idx], [field]: value }; return { ...prev, [page]: updated } })
  }
  const addFaq = (page: string) => {
    const limit = page === 'overview' ? 8 : 6
    if ((faqs[page] || []).length >= limit) return
    setFaqs(prev => ({ ...prev, [page]: [...(prev[page] || []), { q: '', a: '' }] }))
  }
  const removeFaq = (page: string, idx: number) => {
    setFaqs(prev => { const updated = [...(prev[page] || [])]; updated.splice(idx, 1); return { ...prev, [page]: updated } })
  }

  const activeOffers = offers.filter(o => !o.end_date || o.end_date >= today)
  const faqPageKey = mainTab === 'events' ? 'events' : mainTab
  const mainTabs = [
    { key: 'overview', label: 'Overview', count: `${(faqs.overview || []).length}/8` },
    { key: 'events', label: 'Events & Offers', count: `${activeOffers.length}/3` },
    { key: 'rooms', label: 'Rooms', count: `${(faqs.rooms || []).length}/6` },
    { key: 'dining', label: 'Dining', count: `${(faqs.dining || []).length}/6` },
    { key: 'spa', label: 'Spa', count: `${(faqs.spa || []).length}/6` },
    { key: 'experiences', label: 'Experiences', count: `${experiences.length}` },
  ]
  const inp: any = { width: '100%', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: TEXT, border: '1px solid ' + BORDER, borderRadius: 6, padding: '0.55rem 0.875rem', background: BG, outline: 'none', boxSizing: 'border-box' }

  return (
    <div>
      {/* Main tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid ' + BORDER, marginBottom: '1.5rem' }}>
        {mainTabs.map(t => (
          <button key={t.key} onClick={() => { setMainTab(t.key as any); setSubTab(t.key === 'overview' ? 'faqs' : 'content') }} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: mainTab === t.key ? 700 : 400, padding: '0.7rem 1.125rem', cursor: 'pointer', background: 'transparent', border: 'none', borderBottom: mainTab === t.key ? '2px solid ' + GOLD : '2px solid transparent', color: mainTab === t.key ? TEXT : TEXT_MUTED, whiteSpace: 'nowrap' }}>
            {t.label}{t.count ? <span style={{ marginLeft: '0.3rem', fontSize: '0.55rem', color: TEXT_MUTED }}>({t.count})</span> : null}
          </button>
        ))}
      </div>

      {/* Sub tabs */}
      {mainTab !== 'overview' && (
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem' }}>
          {[{ key: 'content', label: 'Content' }, { key: 'faqs', label: `FAQs (${(faqs[faqPageKey] || []).length}/6)` }].map(s => (
            <button key={s.key} onClick={() => setSubTab(s.key as any)} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, padding: '0.4rem 1rem', borderRadius: 4, cursor: 'pointer', background: subTab === s.key ? TEXT : WHITE, color: subTab === s.key ? WHITE : TEXT_MUTED, border: '1px solid ' + (subTab === s.key ? TEXT : BORDER) }}>{s.label}</button>
          ))}
        </div>
      )}

      {msg && <div style={{ background: GREEN + '12', border: '1px solid ' + GREEN + '30', borderRadius: 6, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: GREEN }}>{msg}</div>}

      {/* EVENTS */}
      {mainTab === 'events' && subTab === 'content' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: TEXT, margin: '0 0 0.2rem' }}>Events & Time-Limited Offers</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: 0 }}>e.g. Watches & Wonders, Christmas Gala, Ski Weekend · Appear on /events page · Max 3 active</p>
            </div>
            {activeOffers.length < 3 && !offerForm && (
              <button onClick={() => setOfferForm({ name: '', description: '', start_date: today, end_date: '' })} style={{ background: GOLD, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, padding: '0.55rem 1.125rem', border: 'none', borderRadius: 4, cursor: 'pointer', flexShrink: 0, marginLeft: '1rem' }}>+ Add Event</button>
            )}
          </div>
          {offerForm && (
            <div style={{ background: WHITE, border: '1px solid ' + GOLD + '40', borderRadius: 10, padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: TEXT, margin: '0 0 1rem' }}>{offerForm.id ? 'Edit Event' : 'New Event or Offer'}</p>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div><label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Title *</label><input value={offerForm.name} onChange={e => setOfferForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="e.g. Watches & Wonders Geneva · Christmas Gala Dinner" style={inp} /></div>
                <div><label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Description *</label><textarea value={offerForm.description} onChange={e => setOfferForm((p: any) => ({ ...p, description: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical' }} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div><label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Start Date</label><input type="date" value={offerForm.start_date} onChange={e => setOfferForm((p: any) => ({ ...p, start_date: e.target.value }))} style={inp} /></div>
                  <div><label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>End Date</label><input type="date" value={offerForm.end_date} onChange={e => setOfferForm((p: any) => ({ ...p, end_date: e.target.value }))} style={inp} /></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button onClick={saveOffer} disabled={saving} style={{ background: GOLD, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, padding: '0.55rem 1.125rem', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : 'Save'}</button>
                <button onClick={() => setOfferForm(null)} style={{ background: 'transparent', color: TEXT_MUTED, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', padding: '0.55rem 1rem', border: '1px solid ' + BORDER, borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {offers.length === 0 && !offerForm && (
              <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '2.5rem', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: TEXT_MUTED, margin: '0 0 0.4rem' }}>No events yet</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED, margin: 0 }}>Add a time-limited event or special offer</p>
              </div>
            )}
            {offers.map((offer: any) => {
              const expired = offer.end_date && offer.end_date < today
              return (
                <div key={offer.id} style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '1rem 1.25rem', opacity: expired ? 0.5 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: TEXT, margin: 0 }}>{offer.name}</p>
                        {expired ? <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', fontWeight: 700, textTransform: 'uppercase', color: TEXT_MUTED, background: BG, border: '1px solid ' + BORDER, padding: '2px 6px', borderRadius: 10 }}>Expired</span> : <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', fontWeight: 700, textTransform: 'uppercase', color: GREEN, background: GREEN + '12', padding: '2px 6px', borderRadius: 10 }}>Live</span>}
                      </div>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED, margin: '0 0 0.3rem', lineHeight: 1.5 }}>{offer.description}</p>
                      {(offer.start_date || offer.end_date) && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, margin: 0 }}>{offer.start_date}{offer.start_date && offer.end_date && ' → '}{offer.end_date}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '1rem', flexShrink: 0 }}>
                      {!expired && <button onClick={() => setOfferForm({ ...offer })} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, background: BG, border: '1px solid ' + BORDER, padding: '0.28rem 0.65rem', borderRadius: 4, cursor: 'pointer' }}>Edit</button>}
                      <button onClick={() => archiveOffer(offer.id, offer.name)} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, background: BG, border: '1px solid ' + BORDER, padding: '0.28rem 0.65rem', borderRadius: 4, cursor: 'pointer' }}>Remove</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ROOMS/DINING CONTENT */}
      {(mainTab === 'rooms' || mainTab === 'dining') && subTab === 'content' && (
        <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: TEXT, margin: '0 0 0.5rem' }}>{mainTab === 'rooms' ? 'Rooms & Suites' : 'Dining & Restaurants'}</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED, margin: 0, lineHeight: 1.7 }}>{mainTab === 'rooms' ? 'Room descriptions and data are managed by SwissNet to maintain schema precision. Use the FAQs tab to add targeted content for specific search queries.' : 'Restaurant descriptions and Michelin data are managed by SwissNet. Use the FAQs tab to add targeted dining content for specific search queries.'}</p>
          <div style={{ marginTop: '1rem', background: BG, borderRadius: 6, padding: '0.75rem 1rem' }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: 0 }}>To update room rates, descriptions or restaurant data, contact <a href="mailto:contact@swissnethotels.com" style={{ color: GOLD }}>contact@swissnethotels.com</a></p>
          </div>
        </div>
      )}

      {/* SPA CONTENT */}
      {mainTab === 'spa' && subTab === 'content' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: TEXT, margin: '0 0 0.2rem' }}>Spa & Wellness Venues</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: 0 }}>Add spa, gym, hair salon and other wellness venues · Changes update live in schema</p>
            </div>
            {!spaForm && <button onClick={() => setSpaForm({ name: '', description: '', treatments: '', wellness_philosophy: '', size_sqm: '', pool: false, sauna: false, hammam: false, price_from: '', opening_hours: '' })} style={{ background: GOLD, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, padding: '0.55rem 1.125rem', border: 'none', borderRadius: 4, cursor: 'pointer', flexShrink: 0, marginLeft: '1rem' }}>+ Add</button>}
          </div>
          {spaForm && (
            <div style={{ background: WHITE, border: '1px solid ' + GOLD + '40', borderRadius: 10, padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div><label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Name *</label><input value={spaForm.name} onChange={e => setSpaForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="e.g. Spa Nescens · Gym · Hair Salon" style={inp} /></div>
                <div><label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Description</label><textarea value={spaForm.description} onChange={e => setSpaForm((p: any) => ({ ...p, description: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical' }} /></div>
                <div><label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Treatments / Services</label><textarea value={spaForm.treatments} onChange={e => setSpaForm((p: any) => ({ ...p, treatments: e.target.value }))} placeholder="e.g. Deep tissue massage, Hot stone therapy..." rows={2} style={{ ...inp, resize: 'vertical' }} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div><label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Size (m²)</label><input type="number" value={spaForm.size_sqm} onChange={e => setSpaForm((p: any) => ({ ...p, size_sqm: e.target.value }))} placeholder="e.g. 2500" style={inp} /></div>
                  <div><label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Price from (CHF)</label><input type="number" value={spaForm.price_from} onChange={e => setSpaForm((p: any) => ({ ...p, price_from: e.target.value }))} placeholder="e.g. 150" style={inp} /></div>
                  <div><label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Opening Hours</label><input value={spaForm.opening_hours} onChange={e => setSpaForm((p: any) => ({ ...p, opening_hours: e.target.value }))} placeholder="e.g. 9am – 9pm daily" style={inp} /></div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  {[{ key: 'pool', label: 'Pool' }, { key: 'sauna', label: 'Sauna' }, { key: 'hammam', label: 'Hammam' }].map(f => (
                    <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT }}>
                      <input type="checkbox" checked={spaForm[f.key] || false} onChange={e => setSpaForm((p: any) => ({ ...p, [f.key]: e.target.checked }))} style={{ accentColor: GOLD }} />{f.label}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button onClick={saveSpa} disabled={saving} style={{ background: GOLD, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, padding: '0.55rem 1.125rem', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : 'Save'}</button>
                <button onClick={() => setSpaForm(null)} style={{ background: 'transparent', color: TEXT_MUTED, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', padding: '0.55rem 1rem', border: '1px solid ' + BORDER, borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {spaContent.length === 0 && !spaForm && (
              <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '2.5rem', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: TEXT_MUTED, margin: '0 0 0.4rem' }}>No wellness venues yet</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED, margin: 0 }}>Add your spa, gym, hair salon and other wellness facilities</p>
              </div>
            )}
            {spaContent.map((spa: any) => (
              <div key={spa.id} style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: TEXT, margin: '0 0 0.25rem' }}>{spa.name}</p>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                      {spa.size_sqm && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED }}>{spa.size_sqm} m²</span>}
                      {spa.pool && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED }}>Pool</span>}
                      {spa.sauna && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED }}>Sauna</span>}
                      {spa.hammam && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED }}>Hammam</span>}
                      {spa.price_from && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: GOLD, fontWeight: 600 }}>From CHF {spa.price_from}</span>}
                    </div>
                    {spa.description && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED, margin: '0 0 0.25rem', lineHeight: 1.5 }}>{spa.description}</p>}
                    {spa.treatments && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED, margin: 0 }}><strong style={{ color: TEXT }}>Services:</strong> {Array.isArray(spa.treatments) ? spa.treatments.join(', ') : spa.treatments}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '1rem', flexShrink: 0 }}>
                    <button onClick={() => setSpaForm({ ...spa, treatments: Array.isArray(spa.treatments) ? spa.treatments.join(', ') : (spa.treatments || '') })} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, background: BG, border: '1px solid ' + BORDER, padding: '0.28rem 0.65rem', borderRadius: 4, cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => removeSpa(spa.id, spa.name)} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, background: BG, border: '1px solid ' + BORDER, padding: '0.28rem 0.65rem', borderRadius: 4, cursor: 'pointer' }}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXPERIENCES CONTENT */}
      {mainTab === 'experiences' && subTab === 'content' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: TEXT, margin: '0 0 0.2rem' }}>Experiences & Activities</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: 0 }}>Permanent curated experiences on your /experiences page · Changes live immediately</p>
            </div>
            {!expForm && <button onClick={() => setExpForm({ name: '', description: '', category: '', duration: '', price_from: '' })} style={{ background: GOLD, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, padding: '0.55rem 1.125rem', border: 'none', borderRadius: 4, cursor: 'pointer', flexShrink: 0, marginLeft: '1rem' }}>+ Add</button>}
          </div>
          {expForm && (
            <div style={{ background: WHITE, border: '1px solid ' + GOLD + '40', borderRadius: 10, padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: TEXT, margin: '0 0 1rem' }}>{expForm.id ? 'Edit Experience' : 'New Experience'}</p>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div><label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Title *</label><input value={expForm.name} onChange={e => setExpForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="e.g. Private Lake Geneva Cruise" style={inp} /></div>
                <div><label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Description *</label><textarea value={expForm.description} onChange={e => setExpForm((p: any) => ({ ...p, description: e.target.value }))} rows={4} style={{ ...inp, resize: 'vertical' }} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div><label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Category</label><input value={expForm.category} onChange={e => setExpForm((p: any) => ({ ...p, category: e.target.value }))} placeholder="e.g. Outdoor, Culture" style={inp} /></div>
                  <div><label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Duration</label><input value={expForm.duration} onChange={e => setExpForm((p: any) => ({ ...p, duration: e.target.value }))} placeholder="e.g. 2 hours" style={inp} /></div>
                  <div><label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Price from (CHF)</label><input type="number" value={expForm.price_from} onChange={e => setExpForm((p: any) => ({ ...p, price_from: e.target.value }))} placeholder="450" style={inp} /></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button onClick={saveExperience} disabled={saving} style={{ background: GOLD, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, padding: '0.55rem 1.125rem', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : 'Save'}</button>
                <button onClick={() => setExpForm(null)} style={{ background: 'transparent', color: TEXT_MUTED, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', padding: '0.55rem 1rem', border: '1px solid ' + BORDER, borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {experiences.length === 0 && !expForm && (
              <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '2.5rem', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: TEXT_MUTED, margin: '0 0 0.4rem' }}>No experiences yet</p>
              </div>
            )}
            {experiences.map((exp: any) => (
              <div key={exp.id} style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: TEXT, margin: 0 }}>{exp.name}</p>
                      {exp.category && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', fontWeight: 700, textTransform: 'uppercase', color: GOLD, background: GOLD + '15', padding: '2px 7px', borderRadius: 10 }}>{exp.category}</span>}
                    </div>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED, margin: '0 0 0.3rem', lineHeight: 1.5 }}>{exp.description}</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {exp.duration && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED }}>⏱ {exp.duration}</span>}
                      {exp.price_from && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: GOLD, fontWeight: 600 }}>From CHF {Number(exp.price_from).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '1rem', flexShrink: 0 }}>
                    <button onClick={() => setExpForm({ ...exp })} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, background: BG, border: '1px solid ' + BORDER, padding: '0.28rem 0.65rem', borderRadius: 4, cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => removeExperience(exp.id, exp.name)} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, background: BG, border: '1px solid ' + BORDER, padding: '0.28rem 0.65rem', borderRadius: 4, cursor: 'pointer' }}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ SECTIONS */}
      {subTab === 'faqs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: TEXT, margin: '0 0 0.2rem' }}>
                {mainTab === 'overview' ? 'Overview FAQs' : mainTab === 'events' ? 'Events & Offers FAQs' : `${mainTab.charAt(0).toUpperCase() + mainTab.slice(1)} FAQs`}
              </p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: 0 }}>Changes go live immediately · Max {faqPageKey === 'overview' ? 8 : 6} per page · Appear in FAQPage schema</p>
            </div>
            {(faqs[faqPageKey] || []).length < (faqPageKey === 'overview' ? 8 : 6) && (
              <button onClick={() => addFaq(faqPageKey)} style={{ background: GOLD, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, padding: '0.55rem 1.125rem', border: 'none', borderRadius: 4, cursor: 'pointer', flexShrink: 0, marginLeft: '1rem' }}>+ Add FAQ</button>
            )}
          </div>
          {(faqs[faqPageKey] || []).length === 0 && (
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '2.5rem', textAlign: 'center', marginBottom: '1rem' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: TEXT_MUTED, margin: '0 0 0.4rem' }}>No FAQs yet</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED, margin: 0 }}>Add FAQs to help AI systems answer guest questions</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            {(faqs[faqPageKey] || []).map((faq, idx) => (
              <div key={idx} style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.1em', textTransform: 'uppercase' }}>FAQ {idx + 1}</span>
                  <button onClick={() => removeFaq(faqPageKey, idx)} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: RED, background: 'transparent', border: 'none', cursor: 'pointer' }}>Remove</button>
                </div>
                <input value={faq.q} onChange={e => updateFaq(faqPageKey, idx, 'q', e.target.value)} placeholder="Question" style={{ ...inp, marginBottom: '0.5rem' }} />
                <textarea value={faq.a} onChange={e => updateFaq(faqPageKey, idx, 'a', e.target.value)} placeholder="Answer — be specific and factual..." rows={3} style={{ ...inp, resize: 'vertical' }} />
              </div>
            ))}
          </div>
          {(faqs[faqPageKey] || []).length > 0 && (
            <button onClick={() => saveFaqs(faqPageKey)} disabled={saving} style={{ background: GOLD, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, padding: '0.55rem 1.5rem', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : 'Save & Publish'}</button>
          )}
        </div>
      )}
    </div>
  )
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────

export default function DashboardClient({ hotel, views, clicks, leads, aiVisibility, googleAiScores, bookings, competitors, hotelCatScores, platformScores, overviewRunData }: any) {
  const [tab, setTab] = useState('overview')
  const [period, setPeriod] = useState(30)
  const [chartPeriod, setChartPeriod] = useState(7)
  const [chartPlatform, setChartPlatform] = useState('overall')
  const [competitorView, setCompetitorView] = useState('region')

  const hotelName = hotel?.name || 'Your Hotel'
  const hotelRegion = hotel?.region || 'Switzerland'

  // Scores from competitor_visibility (overview) + google AI
  const chatgptScore = platformScores?.chatgpt ?? null
  const perplexityScore = platformScores?.perplexity ?? null
  const googleScore = platformScores?.google_ai ?? null
  const visibilityScore = platformScores?.overall ?? 0

  // For chart — use overviewRunData grouped by date
  const runDates = [...new Set((overviewRunData || []).map((r: any) => r.checked_at?.split('T')[0]))].sort() as string[]

  // For "Where You Appear" and "Queries to Improve" — use hotelSpecificScores
  const totalQueries = aiVisibility?.length || 0
  const appearedQueries = aiVisibility?.filter((r: any) => r.appeared)?.length || 0

  const now = new Date()
  const periodStart = new Date(now.getTime() - period * 24 * 60 * 60 * 1000)
  const recentViews = views?.filter((v: any) => new Date(v.viewed_at) > periodStart) || []
  const recentClicks = clicks?.filter((c: any) => new Date(c.clicked_at) > periodStart) || []
  const recentLeads = leads?.filter((l: any) => new Date(l.created_at) > periodStart) || []
  const recentBookings = bookings?.filter((b: any) => new Date(b.booked_at) > periodStart) || []

  const days = Array.from({ length: period }, (_, i) => {
    const d = new Date(now.getTime() - (period - 1 - i) * 24 * 60 * 60 * 1000)
    return d.toISOString().split('T')[0]
  })
  const clicksByDay = days.map(d => recentClicks.filter((c: any) => c.clicked_at?.startsWith(d)).length)
  const viewsByDay = days.map(d => recentViews.filter((v: any) => v.viewed_at?.startsWith(d)).length)
  const bookingsByDay = days.map(d => recentBookings.filter((b: any) => b.booked_at?.startsWith(d)).length)

  const regionHotels = competitors?.filter((h: any) => h.region === hotelRegion) || []
  const allHotelsInRegion = [
    { name: hotelName, rating: hotel?.rating || 4.5, is_current: true, visibilityScore },
    ...regionHotels.map((h: any) => ({ ...h, is_current: false })),
  ].sort((a, b) => {
    const sA = a.is_current ? visibilityScore : (a.visibilityScore ?? -1)
    const sB = b.is_current ? visibilityScore : (b.visibilityScore ?? -1)
    return sB - sA
  })
  const hotelRank = allHotelsInRegion.findIndex((h: any) => h.is_current) + 1

  const conversionRate = recentClicks.length > 0 ? Math.round((recentLeads.length / recentClicks.length) * 100) : 0

  const platformScore = (platformId: string) => {
    if (platformId === 'google_ai') return googleScore
    if (platformId === 'chatgpt') return chatgptScore
    if (platformId === 'perplexity') return perplexityScore
    return null
  }
  const sourceBreakdown = recentViews.reduce((acc: any, v: any) => {
    const ref = v.referrer || ''; const utm = v.utm_source || v.source || ''
    let src = 'Direct'
    if (utm === 'chatgpt' || ref.includes('chatgpt.com')) src = 'ChatGPT'
    else if (utm === 'perplexity' || ref.includes('perplexity.ai')) src = 'Perplexity'
    else if (utm === 'google' || ref.includes('google.com')) src = 'Google'
    else if (utm === 'bing' || ref.includes('bing.com')) src = 'Bing'
    else if (ref.includes('swissnethotels.com')) src = 'SwissNet'
    else if (ref) src = 'Referral'
    acc[src] = (acc[src] || 0) + 1
    return acc
  }, {})

  const generateInsight = () => {
    if (visibilityScore === 0) return { text: 'Your AI visibility tracking has started. Results will build as your pages are indexed by Google and Bing over the next 4–6 weeks.', type: 'info' as const }
    if (visibilityScore < 20) return { text: `You are appearing in ${visibilityScore}% of tracked searches. Adding more FAQs, spa and dining content will significantly improve your ranking.`, type: 'warning' as const }
    if (hotelRank === 1) return { text: `You lead the ${hotelRegion} market with a ${visibilityScore}% AI visibility score. Maintain your position by keeping content fresh and complete.`, type: 'success' as const }
    return { text: `You are ranked #${hotelRank} in ${hotelRegion} with a ${visibilityScore}% visibility score. Completing your spa, dining and rooms schema will help you rise in rankings.`, type: 'info' as const }
  }
  const insight = generateInsight()

  // Competitor view helpers
  const hotelCategories = HOTEL_CATEGORIES[hotelName] || []
  const competitorTabs = [
    { key: 'region', label: 'Overview' },
    { key: 'spa', label: 'Spa & Wellness' },
    { key: 'ski', label: 'Ski Resort' },
    { key: 'dining', label: 'Fine Dining' },
    { key: 'romantic', label: 'Romantic' },
    { key: 'lake', label: 'Lake Hotel' },
    { key: 'business', label: 'Business & City' },
  ]

  const getCompetitorTableHotels = () => {
    if (competitorView === 'region') return allHotelsInRegion

    // For all categories, use the same regional hotels
    const list = allHotelsInRegion.map((h: any) => {
      if (h.is_current) {
        return { ...h, visibilityScore: hotelCatScores?.[competitorView] ?? null }
      }
      const catScore = h.catScores?.[competitorView] ?? null
      return { ...h, visibilityScore: catScore }
    })

    return list.sort((a: any, b: any) => {
      const sA = a.visibilityScore ?? -1
      const sB = b.visibilityScore ?? -1
      return sB - sA
    })
  }

  const competitorTableHotels = getCompetitorTableHotels()
  const competitorTableLabel = competitorView === 'region' 
    ? `Overview — ${hotelRegion}` 
    : `${competitorTabs.find(t => t.key === competitorView)?.label || ''} — ${hotelRegion}`

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'ai-visibility', label: 'AI Visibility' },
    { id: 'performance', label: 'Performance' },
    { id: 'competitors', label: 'Competitors' },
    { id: 'optimise', label: '✦ Optimise' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: 'Montserrat, sans-serif' }}>

      {/* SIDEBAR */}
      <div style={{ width: 210, background: WHITE, borderRight: '1px solid ' + BORDER, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 40 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid ' + BORDER }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: GOLD, margin: '0 0 0.15rem' }}>SwissNet <span style={{ fontStyle: 'italic', color: TEXT }}>Hotels</span></p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: TEXT_MUTED, margin: 0 }}>AI Visibility Platform</p>
        </div>
        <div style={{ padding: '0.75rem 0', flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '0.65rem 1.5rem', background: tab === item.id ? GOLD_LIGHT : 'transparent', border: 'none', borderLeft: tab === item.id ? `3px solid ${GOLD}` : '3px solid transparent', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', fontWeight: tab === item.id ? 600 : 400, color: tab === item.id ? TEXT : TEXT_MUTED }}>{item.label}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid ' + BORDER }}>
          <div style={{ background: GOLD_LIGHT, borderRadius: 6, padding: '0.75rem' }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, color: GOLD, margin: '0 0 0.2rem' }}>Need Help?</p>
            <a href="mailto:contact@swissnethotels.com" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: GOLD, margin: 0, textDecoration: 'none' }}>contact@swissnethotels.com</a>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ marginLeft: 210, flex: 1, padding: '2.5rem 3rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', fontWeight: 300, color: TEXT, margin: '0 0 0.25rem' }}>
              {tab === 'overview' && `Welcome back, ${hotelName}`}
              {tab === 'ai-visibility' && 'AI Visibility'}
              {tab === 'performance' && 'Performance'}
              {tab === 'competitors' && 'Competitors'}
              {tab === 'optimise' && '✦ Optimise'}
              {tab === 'settings' && 'Settings'}
            </h1>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED, margin: 0 }}>
              {tab === 'overview' && `Last ${period} days · ${hotelRegion}, Switzerland`}
              {tab === 'ai-visibility' && 'Your presence across AI search platforms'}
              {tab === 'performance' && 'Clicks, leads and conversion tracking'}
              {tab === 'competitors' && 'AI visibility rankings across categories'}
              {tab === 'optimise' && 'Manage your content and FAQs'}
              {tab === 'settings' && 'Account and hotel settings'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[7, 30, 90].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '0.35rem 0.75rem', borderRadius: 4, border: '1px solid ' + BORDER, background: period === p ? GOLD : WHITE, color: period === p ? WHITE : TEXT_MUTED, fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, cursor: 'pointer' }}>{p}d</button>
            ))}
          </div>
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div>
            <div style={{ background: `linear-gradient(135deg, #2A1A0E 0%, #3D2810 100%)`, borderRadius: 10, padding: '1.75rem 2.5rem', marginBottom: '2rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.6)', margin: '0 0 1.25rem' }}>Your Performance at a Glance</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { label: 'AI Visibility Score', value: visibilityScore + '%', sub: `${appearedQueries} appearances` },
                  { label: 'Market Rank', value: '#' + hotelRank, sub: `of ${allHotelsInRegion.length} in ${hotelRegion}` },
                  { label: 'Total Conversions', value: bookings?.length || 0, sub: 'all time' },
                  { label: 'Revenue Generated', value: bookings?.filter((b: any) => b.total_chf)?.reduce((sum: number, b: any) => sum + (b.total_chf || 0), 0) > 0 ? `CHF ${bookings.reduce((sum: number, b: any) => sum + (b.total_chf || 0), 0).toLocaleString()}` : '—', sub: 'from SwissNet Hotels' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '1.25rem 0', paddingRight: '2rem', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none', paddingLeft: i > 0 ? '2rem' : 0 }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.6)', margin: '0 0 0.5rem' }}>{item.label}</p>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.25rem', fontWeight: 300, color: WHITE, margin: '0 0 0.2rem', lineHeight: 1 }}>{item.value}</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <KPICard label="Booking Clicks" value={recentClicks.length} sub={`last ${period} days`} color={GOLD} spark={clicksByDay} />
              <KPICard label="Profile Views" value={recentViews.length} sub={`last ${period} days`} color={BLUE} spark={viewsByDay} />
              <KPICard label="SwissNet Cost" value={recentBookings.length > 0 ? `CHF ${Math.round(recentBookings.reduce((sum: number, b: any) => sum + (b.total_chf || 0), 0) * 0.03).toLocaleString()}` : '—'} sub="3% of revenue" color={GREEN} />
              <KPICard label="Conversions" value={recentBookings.length} sub={`last ${period} days`} color={PURPLE} />
            </div>
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: 0 }}>Performance Trend</p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {[{ label: 'Clicks', color: GOLD }, { label: 'Conversions', color: GREEN }].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <div style={{ width: 8, height: 2, background: l.color, borderRadius: 1 }} />
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <LineChart datasets={[{ data: clicksByDay, color: GOLD, label: 'Clicks' }, { data: bookingsByDay, color: GREEN, label: 'Conversions' }]} labels={days} />
            </div>
            <InsightCard text={insight.text} type={insight.type} />
          </div>
        )}

        {/* ── AI VISIBILITY ── */}
        {tab === 'ai-visibility' && (
          <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <KPICard label="AI Visibility Score" value={visibilityScore + '%'} sub="overall score" color={GOLD} />
              <KPICard label="AI Appearances" value={appearedQueries} sub="times appeared in AI" color={GREEN} />
              <KPICard label="Market Opportunities" value={totalQueries} sub="searches tracked" color={BLUE} />
              <KPICard label="Missed Opportunities" value={totalQueries - appearedQueries} sub="searches to improve" color={TEXT_MUTED} />
            </div>
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: '0 0 0.25rem' }}>Visibility by AI Platform</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED, margin: '0 0 1.25rem', lineHeight: 1.6 }}>Platform scores become accurate as your pages are indexed. Full data available within 4–6 weeks.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[{ label: 'ChatGPT', note: 'Via Bing index', key: 'chatgpt' }, { label: 'Perplexity', note: 'Via Bing index', key: 'perplexity' }, { label: 'Google AI', note: 'Manually tracked', key: 'google_ai' }].map(src => {
                  const score = platformScore(src.key)
                  const status = score === null ? 'Pending' : score === 0 ? 'Low' : score < 30 ? 'Growing' : score < 60 ? 'Medium' : 'Strong'
                  const statusColor = score === null ? TEXT_MUTED : score === 0 ? TEXT_MUTED : score < 30 ? '#d97706' : score < 60 ? GOLD : GREEN
                  return (
                    <div key={src.label} style={{ background: BG, borderRadius: 8, padding: '1.25rem' }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', fontWeight: 700, color: TEXT, margin: '0 0 0.2rem' }}>{src.label}</p>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: '0 0 1rem' }}>{src.note}</p>
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: score !== null && score > 0 ? GOLD : TEXT_MUTED, margin: '0 0 0.25rem', lineHeight: 1 }}>{score !== null ? score + '%' : '—'}</p>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, color: statusColor, background: statusColor + '18', padding: '2px 8px', borderRadius: 20 }}>{status}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: '0 0 1rem' }}>Where You Appear</p>
                {appearedQueries === 0 ? <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>No appearances yet — indexing in progress.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {aiVisibility?.filter((r: any) => r.appeared).slice(0, 5).map((row: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid ' + BORDER }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, flexShrink: 0 }} />
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT, margin: 0 }}>{row.query}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: '0 0 0.25rem' }}>Queries to Improve</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: '0 0 1rem' }}>Searches where your hotel did not appear</p>
                {aiVisibility?.filter((r: any) => !r.appeared).slice(0, 6).length === 0
                  ? <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>No missed queries — excellent coverage.</p>
                  : aiVisibility?.filter((r: any) => !r.appeared).slice(0, 6).map((row: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid ' + BORDER }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: RED, flexShrink: 0 }} />
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT, margin: 0, flex: 1 }}>{row.query}</p>
                    </div>
                  ))
                }
              </div>
            </div>
            {/* Visibility over time chart */}
            <div style={{ background: WHITE, border: '1px solid rgba(201,169,76,0.08)', borderRadius: 10, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', overflow: 'hidden', boxShadow: '0 1px 12px rgba(42,26,14,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: TEXT, margin: 0 }}>AI Visibility Over Time</p>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[{ label: 'Overall', key: 'overall' }, { label: 'ChatGPT', key: 'chatgpt' }, { label: 'Perplexity', key: 'perplexity' }, { label: 'Google AI', key: 'google_ai' }].map(p => (
                      <button key={p.key} onClick={() => setChartPlatform(p.key)} style={{ padding: '0.25rem 0.75rem', borderRadius: 20, border: '1px solid ' + (chartPlatform === p.key ? TEXT : 'rgba(42,26,14,0.15)'), background: chartPlatform === p.key ? TEXT : 'transparent', color: chartPlatform === p.key ? WHITE : 'rgba(42,26,14,0.5)', fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, cursor: 'pointer' }}>{p.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {runDates.length >= 2 && (() => {
                    const cur = visibilityScore
                    const prevDayScores = (overviewRunData || []).filter((r: any) => r.checked_at?.startsWith(runDates[runDates.length - 2]))
                    const prev = prevDayScores.length > 0
                      ? Math.round(prevDayScores.reduce((sum: number, s: any) => sum + s.visibility_score, 0) / prevDayScores.length)
                      : cur
                    const delta = cur - prev
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: '#000', lineHeight: 1, fontWeight: 500 }}>{cur}%</span>
                        {delta !== 0 && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, color: delta > 0 ? GREEN : RED, background: (delta > 0 ? GREEN : RED) + '12', padding: '2px 7px', borderRadius: 20 }}>{delta > 0 ? '↑' : '↓'} {Math.abs(delta)}%</span>}
                      </div>
                    )
                  })()}
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[{ l: '7D', v: 7 }, { l: '30D', v: 30 }, { l: '90D', v: 90 }, { l: 'All', v: 365 }].map(p => (
                      <button key={p.v} onClick={() => setChartPeriod(p.v)} style={{ padding: '0.28rem 0.6rem', borderRadius: 4, border: '1px solid ' + BORDER, background: chartPeriod === p.v ? TEXT : 'transparent', color: chartPeriod === p.v ? WHITE : TEXT_MUTED, fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 600, cursor: 'pointer' }}>{p.l}</button>
                    ))}
                  </div>
                </div>
              </div>
              {runDates.length < 2 ? (
                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, borderRadius: 8 }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED }}>Score history appears after multiple cron runs</p>
                </div>
              ) : (() => {
                const cutoff = new Date(Date.now() - chartPeriod * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                const allDates = chartPlatform === 'overall'
                  ? runDates
                  : ([...new Set((overviewRunData || []).filter((r: any) => r.platform === chartPlatform).map((r: any) => r.checked_at?.split('T')[0]).filter(Boolean))].sort() as string[])

                const realPoints = allDates.map((d: string) => {
                  if (chartPlatform === 'overall') {
                    const dayScores = (overviewRunData || []).filter((r: any) => r.checked_at?.startsWith(d))
                    const avg = dayScores.length > 0
                      ? Math.round(dayScores.reduce((sum: number, s: any) => sum + s.visibility_score, 0) / dayScores.length)
                      : null
                    return { date: d, score: avg }
                  }
                  const dayScores = (overviewRunData || []).filter((r: any) => r.checked_at?.startsWith(d) && r.platform === chartPlatform)
                  const score = dayScores.length > 0
                    ? Math.round(dayScores.reduce((sum: number, s: any) => sum + s.visibility_score, 0) / dayScores.length)
                    : null
                  return { date: d, score }
                }).filter((d): d is { date: string; score: number } => d.score !== null)

                if (realPoints.length === 0) return <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED }}>No data yet for this platform</p></div>

                const startDate = chartPeriod === 365 ? new Date(realPoints[0].date) : new Date(Math.min(...realPoints.map(p => new Date(p.date).getTime()), new Date(cutoff).getTime()))
                const endDate = new Date()
                const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                const calendarDays: string[] = []
                for (let i = 0; i <= totalDays; i++) { const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000); calendarDays.push(d.toISOString().split('T')[0]) }

                if (realPoints.length === 1) return (
                  <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', color: GOLD, margin: 0 }}>{realPoints[0].score}%</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: 0 }}>Recorded on {new Date(realPoints[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} · More runs needed to show trend</p>
                  </div>
                )

                const W = 580, H = 170, pL = 40, pR = 60, pT = 16, pB = 30
                const cW = W - pL - pR, cH = H - pT - pB
                const marketAvg = 35
                const dateToX = (date: string) => { const idx = calendarDays.indexOf(date); if (idx === -1) return pL; return pL + (idx / Math.max(calendarDays.length - 1, 1)) * cW }
                const py = (v: number) => pT + cH - (v / 100) * cH
                const segments: { x1: number; y1: number; x2: number; y2: number }[] = []
                for (let i = 1; i < realPoints.length; i++) {
                  segments.push({ x1: Math.max(pL, dateToX(realPoints[i - 1].date)), y1: py(realPoints[i - 1].score), x2: Math.max(pL, dateToX(realPoints[i].date)), y2: py(realPoints[i].score) })
                }
                const labelCount = Math.min(6, calendarDays.length)
                const labelStep = Math.max(1, Math.floor(calendarDays.length / Math.max(labelCount - 1, 1)))
                const xLabels = calendarDays.filter((_, i) => i % labelStep === 0)
                return (
                  <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
                    <defs><linearGradient id="ag4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={GOLD} stopOpacity="0.07" /><stop offset="100%" stopColor={GOLD} stopOpacity="0" /></linearGradient></defs>
                    {[0, 25, 50, 75, 100].map(v => (<g key={v}><line x1={pL} y1={py(v)} x2={pL + cW} y2={py(v)} stroke="rgba(0,0,0,0.03)" strokeWidth="1" /><text x={pL - 6} y={py(v) + 4} textAnchor="end" fill="rgba(42,26,14,0.3)" fontSize="7.5" fontFamily="Montserrat, sans-serif">{v}%</text></g>))}
                    <line x1={pL} y1={py(marketAvg)} x2={pL + cW} y2={py(marketAvg)} stroke="rgba(42,26,14,0.08)" strokeWidth="1" strokeDasharray="3 6" />
                    <text x={pL + cW - 4} y={py(marketAvg) - 5} textAnchor="end" fill="rgba(42,26,14,0.4)" fontSize="7" fontFamily="Montserrat, sans-serif" fontWeight="600">Market avg</text>
                    {segments.map((s, i) => (<path key={i} d={`M${s.x1} ${s.y1} L${s.x2} ${s.y2} L${s.x2} ${pT + cH} L${s.x1} ${pT + cH} Z`} fill="url(#ag4)" />))}
                    {segments.map((s, i) => (<line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={GOLD} strokeWidth="2" strokeLinecap="round" opacity="0.9" />))}
                    {realPoints.map((d, i) => (<g key={i}><circle cx={dateToX(d.date)} cy={py(d.score)} r="3" fill={WHITE} stroke={GOLD} strokeWidth="1.5" /><text x={dateToX(d.date)} y={py(d.score) - 9} textAnchor="middle" fill={TEXT} fontSize="8" fontFamily="Montserrat, sans-serif" fontWeight="600">{d.score}%</text></g>))}
                    <line x1={pL} y1={pT + cH} x2={pL + cW} y2={pT + cH} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                    {xLabels.map((d, i) => (<text key={i} x={dateToX(d)} y={H - 4} textAnchor="middle" fill="rgba(42,26,14,0.3)" fontSize="7" fontFamily="Montserrat, sans-serif">{new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</text>))}
                  </svg>
                )
              })()}
              <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><div style={{ width: 14, height: 2, background: GOLD, borderRadius: 2, opacity: 0.9 }} /><span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', color: TEXT_MUTED }}>Your AI Visibility</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><div style={{ width: 14, height: 0, borderTop: '1px dashed rgba(42,26,14,0.2)' }} /><span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', color: TEXT_MUTED }}>Average Market</span></div>
              </div>
            </div>
          </div>
        )}

        {/* ── PERFORMANCE ── */}
        {tab === 'performance' && (
          <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <KPICard label="Booking Clicks" value={recentClicks.length} sub={`last ${period} days`} color={GOLD} spark={clicksByDay} />
              <KPICard label="Conversions" value={recentBookings.length} sub={`last ${period} days`} color={GREEN} spark={bookingsByDay} />
              <KPICard label="Conversion Rate" value={conversionRate + '%'} sub="clicks to enquiries" color={PURPLE} />
              <KPICard label="Profile Views" value={recentViews.length} sub={`last ${period} days`} color={BLUE} spark={viewsByDay} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: '0 0 1rem' }}>Traffic Sources</p>
                {Object.keys(sourceBreakdown).length === 0 ? <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>No traffic data yet.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Object.entries(sourceBreakdown).sort((a: any, b: any) => b[1] - a[1]).map(([src, count]: any) => (
                      <div key={src} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid ' + BORDER }}>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT, textTransform: 'capitalize' }}>{src}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: 60, height: 4, background: BORDER, borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', width: Math.round((count / recentViews.length) * 100) + '%', background: GOLD, borderRadius: 2 }} /></div>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 600, color: GOLD, minWidth: 20 }}>{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: '0 0 1rem' }}>Visitors by Country</p>
                <CountryBreakdown hotelId={hotel?.id} period={period} />
              </div>
            </div>
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: '0 0 1rem' }}>Performance Over Time</p>
              <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '0.75rem' }}>
                {[{ label: 'Booking Clicks', color: GOLD }, { label: 'Views', color: BLUE }].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: 18, height: 2, background: l.color, borderRadius: 2, opacity: l.label === 'Views' ? 0.7 : 0.9 }} />
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{l.label}</span>
                    {l.label === 'Views' && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', color: 'rgba(55,138,221,0.5)', marginLeft: 2 }}>right axis</span>}
                  </div>
                ))}
              </div>
              <DualAxisChart datasets={[{ data: clicksByDay, color: GOLD, label: 'Clicks' }, { data: viewsByDay, color: BLUE, label: 'Views' }]} labels={days} height={160} hotelId={hotel?.id} />
            </div>
          </div>
        )}

        {/* ── COMPETITORS ── */}
        {tab === 'competitors' && (
          <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <KPICard label="Your Rank" value={'#' + hotelRank} sub={`in ${hotelRegion}`} color={hotelRank === 1 ? GREEN : GOLD} />
              <KPICard label="Hotels Tracked" value={competitorTableHotels.length} sub="in this category" color={BLUE} />
              <KPICard label="Market Position" value={hotelRank === 1 ? 'Leader' : hotelRank <= 3 ? 'Top 3' : 'Growing'} sub="competitive status" color={PURPLE} />
              <KPICard label="Visibility Score" value={visibilityScore + '%'} sub="your AI score" color={GOLD} />
            </div>

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {competitorTabs.map(t => (
                <button key={t.key} onClick={() => setCompetitorView(t.key)} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 600, padding: '0.5rem 1.125rem', borderRadius: 4, cursor: 'pointer', background: competitorView === t.key ? TEXT : WHITE, color: competitorView === t.key ? WHITE : TEXT_MUTED, border: '1px solid ' + (competitorView === t.key ? TEXT : BORDER), transition: 'all 0.15s' }}>{t.label}</button>
              ))}
            </div>

            {/* Competitor table */}
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid ' + BORDER }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: 0 }}>{competitorTableLabel}</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: BG }}>
                    {['Rank', 'Hotel', 'AI Visibility', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, borderBottom: '1px solid ' + BORDER }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {competitorTableHotels.map((h: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid ' + BORDER, background: h.is_current ? GOLD_LIGHT : 'transparent' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: i === 0 ? GOLD : BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.85rem', fontWeight: 600, color: i === 0 ? WHITE : TEXT_MUTED }}>#{i + 1}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: h.is_current ? 700 : 400, color: h.is_current ? GOLD : TEXT }}>{h.name}</span>
                          {h.is_current && <span style={{ background: GOLD, color: WHITE, fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', fontWeight: 700, padding: '2px 6px', borderRadius: 20 }}>YOU</span>}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {h.is_current ? (() => {
                          const displayScore = competitorView === 'region' ? visibilityScore : (hotelCatScores?.[competitorView] ?? null)
                          return displayScore !== null ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: 70, height: 4, background: BORDER, borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', width: displayScore + '%', background: GOLD, borderRadius: 2 }} /></div>
                              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 700, color: GOLD }}>{displayScore}%</span>
                            </div>
                          ) : (
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>Not tracked yet</span>
                          )
                        })() : h.visibilityScore !== null && h.visibilityScore !== undefined ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 70, height: 4, background: BORDER, borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', width: h.visibilityScore + '%', background: TEXT_MUTED, borderRadius: 2 }} /></div>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED }}>{h.visibilityScore}%</span>
                          </div>
                        ) : (
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>Not tracked yet</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ background: h.is_current ? GREEN + '18' : BG, color: h.is_current ? GREEN : TEXT_MUTED, fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
                          {h.is_current ? 'Your hotel' : 'Competitor'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: '0 0 1rem' }}>Recommendations</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  hotelRank === 1 ? 'Maintain your #1 position by keeping content fresh and complete' : 'Improve your profile content to rise in category rankings',
                  'Complete your spa, dining and room schema for better AI coverage',
                  'Add FAQs targeting high-intent travel queries',
                  'Ensure your hotel appears in destination and best-of pages',
                ].map((rec, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 0', borderBottom: i < 3 ? '1px solid ' + BORDER : 'none' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, flexShrink: 0, marginTop: 4 }} />
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: TEXT_MUTED, margin: 0, lineHeight: 1.5 }}>{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            <InsightCard
              text={hotelRank === 1
                ? `You lead the ${competitorView === 'region' ? hotelRegion : CATEGORY_COMPETITORS[competitorView]?.label || ''} category. Maintain your position by keeping your profile content complete and up to date.`
                : `You are ranked #${hotelRank} in the ${competitorView === 'region' ? hotelRegion : CATEGORY_COMPETITORS[competitorView]?.label || ''} category. Completing your hotel profile will help you rise in AI search rankings.`
              }
              type={hotelRank === 1 ? 'success' : 'info'}
            />
          </div>
        )}

        {/* ── OPTIMISE ── */}
        {tab === 'optimise' && (
          <OptimiseTab hotelId={hotel?.id} hotelName={hotelName} hotelSlug={hotel?.slug} />
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (
          <div style={{ maxWidth: 680 }}>
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ padding: '1rem 1.5rem', background: BG, borderBottom: '1px solid ' + BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: 0 }}>Hotel Profile</p>
                <a href={`/hotels/${hotel?.slug || hotel?.id}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: GOLD, textDecoration: 'none', fontWeight: 600 }}>View public page →</a>
              </div>
              <div style={{ padding: '1.25rem 1.5rem' }}>
                {[
                  { label: 'Hotel Name', value: hotel?.name || '—' },
                  { label: 'Location', value: hotel?.location ? `${hotel.location}, Switzerland` : '—' },
                  { label: 'Region', value: hotel?.region || '—' },
                  { label: 'Category', value: hotel?.category || '—' },
                  { label: 'Nightly Rate', value: hotel?.nightly_rate_chf ? `CHF ${hotel.nightly_rate_chf}/night` : '—' },
                  { label: 'Direct Booking URL', value: hotel?.direct_booking_url ? 'Connected ✓' : 'Not set' },
                  { label: 'Contact Email', value: hotel?.contact_email || '—' },
                  { label: 'Telephone', value: hotel?.telephone || '—' },
                ].map(field => (
                  <div key={field.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid ' + BORDER }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{field.label}</span>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: field.value?.includes('✓') ? GREEN : TEXT }}>{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ padding: '1rem 1.5rem', background: BG, borderBottom: '1px solid ' + BORDER }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: 0 }}>AI Visibility Status</p>
              </div>
              <div style={{ padding: '1.25rem 1.5rem' }}>
                {[
                  { label: 'Schema Status', value: hotel?.show_schema ? 'Active ✓' : 'Inactive', ok: hotel?.show_schema },
                  { label: 'FAQs', value: '9 published', ok: true },
                  { label: 'Rooms & Suites', value: hotel?.show_schema ? 'Schema active' : 'Inactive', ok: hotel?.show_schema },
                  { label: 'Spa & Wellness', value: hotel?.show_schema ? 'Schema active' : 'Inactive', ok: hotel?.show_schema },
                  { label: 'Dining & Restaurants', value: hotel?.show_schema ? 'Schema active' : 'Inactive', ok: hotel?.show_schema },
                  { label: 'Tracking Queries', value: `${totalQueries} active queries`, ok: totalQueries > 0 },
                  { label: 'Last Visibility Run', value: runDates.length > 0 ? new Date(runDates[runDates.length - 1]).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Never', ok: runDates.length > 0 },
                ].map(field => (
                  <div key={field.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid ' + BORDER }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{field.label}</span>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: field.ok ? GREEN : '#d97706' }}>{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ padding: '1rem 1.5rem', background: BG, borderBottom: '1px solid ' + BORDER }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: 0 }}>Your SwissNet Pages</p>
              </div>
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: 'Hotel Profile', path: `/hotels/${hotel?.slug || hotel?.id}` },
                  { label: 'Rooms & Suites', path: `/hotels/${hotel?.slug || hotel?.id}/rooms` },
                  { label: 'Dining', path: `/hotels/${hotel?.slug || hotel?.id}/dining` },
                  { label: 'Spa & Wellness', path: `/hotels/${hotel?.slug || hotel?.id}/spa` },
                  { label: 'Experiences', path: `/hotels/${hotel?.slug || hotel?.id}/experiences` },
                ].map(page => (
                  <div key={page.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid ' + BORDER }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: TEXT }}>{page.label}</span>
                    <a href={`https://swissnethotels.com${page.path}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: GOLD, textDecoration: 'none', fontWeight: 600 }}>View →</a>
                  </div>
                ))}
              </div>
            </div>
            {[
              { title: 'Subscription', desc: 'AI Visibility Growth Programme · CHF 699/month', badge: 'Active' },
              { title: 'Monthly Reports', desc: 'Automated performance reports sent each month' },
              { title: 'Integrations', desc: 'Connect your booking system for live rate sync', badge: 'Coming Soon' },
            ].map(s => (
              <div key={s.title} style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.25rem 1.5rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: TEXT, margin: '0 0 0.2rem' }}>{s.title}</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED, margin: 0 }}>{s.desc}</p>
                </div>
                {s.badge ? (
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, color: s.badge === 'Active' ? GREEN : TEXT_MUTED, background: s.badge === 'Active' ? GREEN + '15' : BG, border: '1px solid ' + (s.badge === 'Active' ? GREEN + '30' : BORDER), padding: '3px 10px', borderRadius: 20 }}>{s.badge}</span>
                ) : (
                  <a href="mailto:contact@swissnethotels.com" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, color: GOLD, background: GOLD_LIGHT, border: '1px solid ' + BORDER, padding: '0.35rem 0.875rem', borderRadius: 4, textDecoration: 'none' }}>Contact</a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}