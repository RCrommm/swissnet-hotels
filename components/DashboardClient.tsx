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
  'La Réserve Genève': ['spa', 'dining', 'romantic', 'lake', 'business', 'family'],
  'La Réserve Eden au Lac Zurich': ['business', 'romantic', 'lake', 'dining'],
  'Mont Cervin Palace': ['ski', 'dining', 'romantic', 'family'],
  'Monte Rosa Zermatt': ['ski', 'romantic'],
  'Schweizerhof Zermatt': ['ski', 'spa', 'family'],
  'Victoria-Jungfrau Grand Hotel Interlaken': ['spa', 'dining', 'romantic', 'family'],
  'Bellevue Palace': ['business', 'dining', 'romantic'],
  'Crans Ambassador': ['ski', 'spa'],
  'Alpengold Hotel': ['ski', 'business'],
  'Hotel Adula': ['spa', 'ski', 'family'],
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
    setMarkers([])
  }, [hotelId, labels.join(',')])

  const clicks = datasets.find(d => d.label === 'Clicks')?.data || []
  const views = datasets.find(d => d.label === 'Views')?.data || []
  const conversions = datasets.find(d => d.label === 'Conversions')?.data || []
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
  const convPts: [number, number][] = conversions.map((v, i) => [cx(i), cyC(v)])
  const vPath = smooth(vPts)
  const vArea = vPath + ` L${cx(n - 1)},${pT + cH} L${cx(0)},${pT + cH} Z`
  const cPath = smooth(cPts)
  const convPath = smooth(convPts)
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
          <path d={convPath} fill="none" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={hoverIdx !== null ? 0.9 : 0.7} />
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
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT }}>{hoverClickVal} total clicks</span>
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

function OptimiseTab({ hotelId, hotelName, hotelSlug, hotel, onSchemaRefresh, initialTab }: { hotelId: string; hotelName: string; hotelSlug: string; hotel: any; onSchemaRefresh?: () => void; initialTab?: string }) {
  const [mainTab, setMainTab] = useState<'overview' | 'events' | 'rooms' | 'dining' | 'spa' | 'experiences' | 'hotel-info'>(initialTab as any || 'overview')

  useEffect(() => {
    if (initialTab) {
      setMainTab(initialTab as any)
      setSubTab(initialTab === 'overview' ? 'faqs' : 'content')
    }
  }, [initialTab])
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
  const [hotelInfo, setHotelInfo] = useState({
  about_us: hotel?.about_us || '',
  languages: hotel?.languages || '',
  check_in_time: hotel?.check_in_time || '',
  check_out_time: hotel?.check_out_time || '',
  parking: hotel?.parking || '',
  pet_friendly: hotel?.pet_friendly || false,
  family_friendly: hotel?.family_friendly || false,
  private_transfer: hotel?.private_transfer || false,
  cancellation_policy: hotel?.cancellation_policy || '',
  accessibility: hotel?.accessibility || '',
  seasonal_notes: hotel?.seasonal_notes || '',
  booking_benefits: hotel?.booking_benefits || '',
})
const [savingInfo, setSavingInfo] = useState(false)

const saveHotelInfo = async () => {
  setSavingInfo(true)
  const { createClient } = await import('@supabase/supabase-js')
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  await sb.from('hotels').update(hotelInfo).eq('id', hotelId)
  await notify('Hotel info updated', 'Awards, languages, check-in, parking')
  setSavingInfo(false)
  setMsg('Hotel info updated and live.')
  setTimeout(() => setMsg(''), 3000)
  if (onSchemaRefresh) onSchemaRefresh()
}
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
  { key: 'hotel-info', label: 'Hotel Info', count: '' },
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
      {mainTab !== 'overview' && mainTab !== 'hotel-info' && (
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

      {/* HOTEL INFO */}
{mainTab === 'hotel-info' && (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
      <div>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: TEXT, margin: '0 0 0.2rem' }}>Hotel Information</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: 0 }}>These details appear in your AI schema and boost visibility in specific searches</p>
      </div>
    </div>
    <div style={{ display: 'grid', gap: '1rem' }}>
      
      <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '1.25rem' }}>
        <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Languages Spoken <span style={{ color: GOLD }}>· Medium AI Impact</span></label>
        <input value={hotelInfo.languages} onChange={e => setHotelInfo(p => ({ ...p, languages: e.target.value }))} placeholder="e.g. French, English, German, Italian, Japanese" style={inp} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '1.25rem' }}>
          <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Check-in Time</label>
          <input value={hotelInfo.check_in_time} onChange={e => setHotelInfo(p => ({ ...p, check_in_time: e.target.value }))} placeholder="e.g. 3:00 PM" style={inp} />
        </div>
        <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '1.25rem' }}>
          <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Check-out Time</label>
          <input value={hotelInfo.check_out_time} onChange={e => setHotelInfo(p => ({ ...p, check_out_time: e.target.value }))} placeholder="e.g. 12:00 PM" style={inp} />
        </div>
      </div>
      <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '1.25rem' }}>
        <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>About Us — AI Schema Only <span style={{ color: GOLD }}>· High AI Impact</span></label>
        <textarea value={hotelInfo.about_us} onChange={e => setHotelInfo(p => ({ ...p, about_us: e.target.value }))} rows={4} placeholder="e.g. La Réserve Genève is the only resort-style hotel in Geneva set within a 10-acre private lakefront park, combining resort tranquility with 3 minutes from Geneva Airport." style={{ ...inp, resize: 'vertical' }} />
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', color: TEXT_MUTED, margin: '0.3rem 0 0' }}>⚠ This does <strong>not</strong> appear on your public page — it is embedded in your AI schema only. AI bots read it when crawling your profile. Be specific and factual, not marketing language.</p>
      </div>
      <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '1.25rem' }}>
        <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Parking</label>
        <input value={hotelInfo.parking} onChange={e => setHotelInfo(p => ({ ...p, parking: e.target.value }))} placeholder="e.g. Valet parking available, CHF 50/night" style={inp} />
      </div>
      <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.2rem' }}>Pet Friendly</label>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: 0 }}>Appears in "pet friendly luxury hotel" searches</p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={hotelInfo.pet_friendly} onChange={e => setHotelInfo(p => ({ ...p, pet_friendly: e.target.checked }))} style={{ accentColor: GOLD, width: 16, height: 16 }} />
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT }}>{hotelInfo.pet_friendly ? 'Yes' : 'No'}</span>
        </label>
      </div>
      <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.2rem' }}>Family Friendly</label>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: 0 }}>Appears in "family luxury hotel" searches</p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={hotelInfo.family_friendly} onChange={e => setHotelInfo(p => ({ ...p, family_friendly: e.target.checked }))} style={{ accentColor: GOLD, width: 16, height: 16 }} />
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT }}>{hotelInfo.family_friendly ? 'Yes' : 'No'}</span>
        </label>
      </div>
      <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.2rem' }}>Airport Transfer</label>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: 0 }}>Appears in "hotel with airport transfer" searches</p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={hotelInfo.private_transfer} onChange={e => setHotelInfo(p => ({ ...p, private_transfer: e.target.checked }))} style={{ accentColor: GOLD, width: 16, height: 16 }} />
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT }}>{hotelInfo.private_transfer ? 'Yes' : 'No'}</span>
        </label>
      </div>
      <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '1.25rem' }}>
        <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Cancellation Policy</label>
        <input value={hotelInfo.cancellation_policy} onChange={e => setHotelInfo(p => ({ ...p, cancellation_policy: e.target.value }))} placeholder="e.g. Free cancellation up to 48 hours before arrival" style={inp} />
      </div>
      <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '1.25rem' }}>
        <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Accessibility</label>
        <input value={hotelInfo.accessibility} onChange={e => setHotelInfo(p => ({ ...p, accessibility: e.target.value }))} placeholder="e.g. Wheelchair accessible rooms, lift access, accessible spa" style={inp} />
      </div>
      <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '1.25rem' }}>
        <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Seasonal Notes</label>
        <input value={hotelInfo.seasonal_notes} onChange={e => setHotelInfo(p => ({ ...p, seasonal_notes: e.target.value }))} placeholder="e.g. Outdoor pool open May–September, ski access December–April" style={inp} />
      </div>
      <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '1.25rem' }}>
        <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.3rem' }}>Direct Booking Benefits <span style={{ color: GOLD }}>· High AI Impact</span></label>
        <textarea value={hotelInfo.booking_benefits} onChange={e => setHotelInfo(p => ({ ...p, booking_benefits: e.target.value }))} rows={3} placeholder="e.g. Complimentary welcome drink, early check-in from 12pm, late check-out until 2pm, no booking fees" style={{ ...inp, resize: 'vertical' }} />
      </div>
    </div>
    <div style={{ marginTop: '1.25rem' }}>
      <button onClick={saveHotelInfo} disabled={savingInfo} style={{ background: GOLD, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, padding: '0.55rem 1.5rem', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: savingInfo ? 0.7 : 1 }}>{savingInfo ? 'Saving...' : 'Save & Publish'}</button>
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

// ── CATEGORY TREND CHART ─────────────────────────────────────────────────────

const CHART_COLORS = [
  '#C9A84C',
  '#94a3b8',
  '#6366f1',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
]

function CategoryTrendChart({ category, hotelName, hotels }: { category: string; hotelName: string; hotels: any[] }) {
  const [trendData, setTrendData] = useState<Record<string, { date: string; score: number }[]>>({})
  const [loaded, setLoaded] = useState(false)
  const [chartDays, setChartDays] = useState(30)
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const hotelNames = hotels.map((h: any) => h.name)

  useEffect(() => {
    const load = async () => {
      setLoaded(false)
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      const { data } = await sb
        .from('competitor_visibility')
        .select('competitor_name, visibility_score, checked_at, platform, category')
        .eq('category', category)
        .gte('checked_at', since)
        .order('checked_at', { ascending: true })

      if (!data) { setLoaded(true); return }

      // Group by hotel → by date → average chatgpt+perplexity
      const grouped: Record<string, Record<string, number[]>> = {}
      for (const row of data) {
        if (!grouped[row.competitor_name]) grouped[row.competitor_name] = {}
        const date = row.checked_at?.split('T')[0]
        if (!date) continue
        if (!grouped[row.competitor_name][date]) grouped[row.competitor_name][date] = []
        const score = row.platform === 'chatgpt' ? Math.min(100, row.visibility_score + 8) : row.visibility_score
        grouped[row.competitor_name][date].push(score)
      }

      const result: Record<string, { date: string; score: number }[]> = {}
      for (const [hotel, dates] of Object.entries(grouped)) {
        result[hotel] = Object.entries(dates)
          .map(([date, scores]) => ({ date, score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }))
          .sort((a, b) => a.date.localeCompare(b.date))
      }
      setTrendData(result)
      setLoaded(true)
    }
    load()
  }, [category, hotelNames.join(',')])

  const toggleHotel = (name: string) => {
    setHidden(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const cutoff = new Date(Date.now() - chartDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const allDates = [...new Set(Object.values(trendData).flatMap(d => d.map(p => p.date)).filter(d => d >= cutoff))].sort()

  const orderedHotels = [hotelName, ...hotelNames.filter(n => n !== hotelName)]
  const datasets = orderedHotels
    .filter(name => trendData[name] && trendData[name].length > 0)
    .map((name, i) => ({
      name,
      color: i === 0 ? GOLD : CHART_COLORS[i] || '#94a3b8',
      points: trendData[name].filter(p => p.date >= cutoff),
    }))

  const W = 580, H = 200, pL = 36, pR = 20, pT = 16, pB = 28
  const cW = W - pL - pR, cH = H - pT - pB
  const n = allDates.length

  const dateToX = (date: string) => {
    const idx = allDates.indexOf(date)
    if (idx === -1 || n <= 1) return pL
    return pL + (idx / (n - 1)) * cW
  }
  const py = (v: number) => pT + cH - (v / 100) * cH

  const smooth = (points: {date: string; score: number}[]) => {
    if (points.length < 2) return ''
    const pts: [number, number][] = points.map(p => [dateToX(p.date), py(p.score)])
    let d = `M${pts[0][0]},${pts[0][1]}`
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1]
      const [x1, y1] = pts[i]
      const t = 0.3
      d += ` C${x0 + (x1 - x0) * t},${y0} ${x1 - (x1 - x0) * t},${y1} ${x1},${y1}`
    }
    return d
  }

  if (!loaded) return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED }}>Loading trend data...</p>
    </div>
  )

  const currentHotelDataset = datasets.find(ds => ds.name === hotelName)
  const cutoffDate = new Date(Date.now() - chartDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const latestScore = currentHotelDataset?.points?.slice(-1)[0]?.score
  const firstScore = currentHotelDataset?.points?.find(p => p.date >= cutoffDate)?.score
  const delta = latestScore !== undefined && firstScore !== undefined ? latestScore - firstScore : null

  return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '1.75rem', marginBottom: '1.5rem', boxShadow: '0 1px 16px rgba(42,26,14,0.05)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: '0 0 0.2rem' }}>Category Trend</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, margin: 0, letterSpacing: '0.03em' }}>AI visibility score over time · click legend to filter</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {delta !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', borderRadius: 20, background: delta >= 0 ? GREEN + '12' : RED + '12', border: `1px solid ${delta >= 0 ? GREEN + '30' : RED + '30'}` }}>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, color: delta >= 0 ? GREEN : RED }}>{delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}pts</span>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', color: TEXT_MUTED }}>{chartDays}d</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.2rem', background: BG, borderRadius: 6, padding: '0.2rem' }}>
            {[{ l: '7D', v: 7 }, { l: '30D', v: 30 }, { l: '90D', v: 90 }].map(p => (
              <button key={p.v} onClick={() => setChartDays(p.v)} style={{ padding: '0.25rem 0.65rem', borderRadius: 4, border: 'none', background: chartDays === p.v ? WHITE : 'transparent', color: chartDays === p.v ? TEXT : TEXT_MUTED, fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: chartDays === p.v ? 700 : 400, cursor: 'pointer', boxShadow: chartDays === p.v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>{p.l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>

        {/* Chart */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {allDates.length < 2 ? (
            <div style={{ height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: BG, borderRadius: 8, gap: '0.5rem' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: TEXT_MUTED, margin: 0 }}>Trend builds with each weekly run</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, margin: 0 }}>Check back after the next Sunday cron</p>
            </div>
          ) : (
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
              {[0, 25, 50, 75, 100].map(v => (
                <g key={v}>
                  <line x1={pL} y1={py(v)} x2={pL + cW} y2={py(v)} stroke={v === 0 ? 'rgba(0,0,0,0.07)' : 'rgba(0,0,0,0.03)'} strokeWidth="1" />
                  <text x={pL - 6} y={py(v) + 3} textAnchor="end" fill="rgba(42,26,14,0.22)" fontSize="6.5" fontFamily="Montserrat, sans-serif">{v}%</text>
                </g>
              ))}

              {/* Competitor lines — muted */}
              {datasets.filter(ds => ds.name !== hotelName && !hidden.has(ds.name)).map(ds => {
                if (ds.points.length < 2) return null
                return (
                  <path key={ds.name} d={smooth(ds.points)} fill="none" stroke={ds.color} strokeWidth="1" strokeLinecap="round" opacity="0.35" />
                )
              })}

              {/* Your hotel — dominant */}
              {currentHotelDataset && !hidden.has(hotelName) && currentHotelDataset.points.length >= 2 && (() => {
                const path = smooth(currentHotelDataset.points)
                const lastPt = currentHotelDataset.points[currentHotelDataset.points.length - 1]
                const firstPt = currentHotelDataset.points[0]
                return (
                  <g>
                    <path d={path} fill="none" stroke={GOLD} strokeWidth="6" strokeLinecap="round" opacity="0.07" />
                    <path d={path} fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx={dateToX(firstPt.date)} cy={py(firstPt.score)} r="3" fill={WHITE} stroke={GOLD} strokeWidth="2" />
                    <circle cx={dateToX(lastPt.date)} cy={py(lastPt.score)} r="4.5" fill={GOLD} stroke={WHITE} strokeWidth="2" />
                    <text x={dateToX(lastPt.date) + 9} y={py(lastPt.score) + 4} fill={GOLD} fontSize="8.5" fontFamily="Montserrat, sans-serif" fontWeight="700">{lastPt.score}%</text>
                  </g>
                )
              })()}

              <line x1={pL} y1={pT + cH} x2={pL + cW} y2={pT + cH} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
              {[0, Math.floor(n / 2), n - 1].filter(i => i >= 0 && i < allDates.length).map((i) => (
                <text key={i} x={dateToX(allDates[i])} y={H - 6} textAnchor="middle" fill="rgba(42,26,14,0.28)" fontSize="6.5" fontFamily="Montserrat, sans-serif">
                  {new Date(allDates[i]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </text>
              ))}
            </svg>
          )}
        </div>

        {/* Legend */}
        <div style={{ width: 190, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>

          {/* Your hotel */}
          {datasets.filter(ds => ds.name === hotelName).map(ds => {
            const isHidden = hidden.has(ds.name)
            const lastScore = ds.points.slice(-1)[0]?.score
            return (
              <div key={ds.name} onClick={() => toggleHotel(ds.name)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.6rem', borderRadius: 6, cursor: 'pointer', background: isHidden ? 'transparent' : GOLD_LIGHT, border: `1px solid ${isHidden ? BORDER : 'rgba(201,169,76,0.3)'}`, marginBottom: '0.5rem', opacity: isHidden ? 0.4 : 1 }}>
                <div style={{ width: 14, height: 3, borderRadius: 2, background: isHidden ? 'transparent' : GOLD, border: isHidden ? `1.5px solid ${GOLD}` : 'none', flexShrink: 0 }} />
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: GOLD, fontWeight: 700, flex: 1, lineHeight: 1.3 }}>{ds.name} ✦</span>
              </div>
            )
          })}

          {/* Competitors */}
          <div style={{ borderTop: '1px solid ' + BORDER, paddingTop: '0.5rem' }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.4rem 0.4rem' }}>Competitors</p>
            {datasets.filter(ds => ds.name !== hotelName).map(ds => {
              const isHidden = hidden.has(ds.name)
              const lastScore = ds.points.slice(-1)[0]?.score
              return (
                <div key={ds.name} onClick={() => toggleHotel(ds.name)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.3rem 0.4rem', borderRadius: 4, cursor: 'pointer', opacity: isHidden ? 0.25 : 0.7 }}>
                  <div style={{ width: 12, height: 2, borderRadius: 1, background: isHidden ? 'transparent' : ds.color, border: isHidden ? `1px solid ${ds.color}` : 'none', flexShrink: 0, opacity: 0.7 }} />
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', color: TEXT_MUTED, flex: 1, lineHeight: 1.3, textDecoration: isHidden ? 'line-through' : 'none' }}>{ds.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── SOURCE PAGE CHART ─────────────────────────────────────────────────────────

function SourcePageChart({ hotelId, period }: { hotelId: string; period: number }) {
  const [data, setData] = useState<{ page: string; count: number }[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!hotelId) return
    const load = async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString()
      const { data: rows } = await sb
        .from('referral_clicks')
        .select('utm_campaign, clicked_at')
        .eq('hotel_id', hotelId)
        .gte('clicked_at', since)
      if (!rows) { setLoaded(true); return }

      const LABELS: Record<string, string> = {
        best_page: 'Best Pages',
        compare: 'Compare Pages',
        destination: 'Destination Pages',
        ai_concierge: 'AI Concierge',
      }

      const PROFILE_SOURCES = ['best_page', 'compare', 'destination', 'ai_concierge']
      const counts: Record<string, number> = {}
      for (const row of rows) {
        const key = row.utm_campaign || 'other'
        if (!PROFILE_SOURCES.includes(key)) continue
        const label = LABELS[key] || key
        counts[label] = (counts[label] || 0) + 1
      }

      const result = Object.entries(counts)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)

      setData(result)
      setLoaded(true)
    }
    load()
  }, [hotelId, period])

  if (!loaded) return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '2rem', textAlign: 'center' }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED }}>Loading...</p>
    </div>
  )

  if (data.length === 0) return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '2rem', textAlign: 'center' }}>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: TEXT_MUTED, margin: '0 0 0.4rem' }}>No page click data yet</p>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED, margin: 0 }}>Clicks will appear here as visitors engage</p>
    </div>
  )

  const maxVal = Math.max(...data.map(d => d.count)) || 1
  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: '0 0 0.2rem' }}>Clicks by Page</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, margin: 0 }}>Where visitors discover and click through to your hotel</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 140, flexShrink: 0 }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.page}</p>
                </div>
                <div style={{ flex: 1, display: 'flex', gap: '2px', height: 20 }}>
                  <div style={{ width: `${(d.count / maxVal) * 100}%`, background: GOLD, borderRadius: '3px', opacity: 0.85, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4, minWidth: 20 }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, color: '#1a0e06' }}>{d.count}</span>
                  </div>
                </div>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, color: TEXT_MUTED, width: 24, textAlign: 'right', flexShrink: 0 }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: 140, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem 1rem', background: BG, borderRadius: 8 }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.3rem' }}>Total Clicks</p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: GOLD, margin: 0, lineHeight: 1 }}>{total}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SchemaVisualizer({ hotelId, hotelSlug }: { hotelId: string; hotelSlug: string }) {
  const [schema, setSchema] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchSchema = async () => {
    if (schema) { setOpen(o => !o); return }
    setLoading(true)
    try {
      const res = await fetch(`https://swissnethotels.com/hotels/${hotelSlug}`)
      const html = await res.text()
      const matches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      if (matches.length > 0) {
        const allSchemas = matches.map(m => { try { return JSON.parse(m[1]) } catch { return null } }).filter(Boolean)
        const hotelSchema = allSchemas.find((s: any) => s['@graph']?.some((n: any) => n['@type'] === 'Hotel'))
        const combined = hotelSchema || { '@context': 'https://schema.org', '@graph': allSchemas.flatMap((s: any) => s['@graph'] || [s]) }
        setSchema(combined)
        setOpen(true)
      }
    } catch {
      setSchema({ error: 'Could not load schema' })
      setOpen(true)
    }
    setLoading(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const countFields = (obj: any): number => {
    if (!obj || typeof obj !== 'object') return 0
    return Object.keys(obj).length + Object.values(obj).reduce((sum: number, v) => sum + (typeof v === 'object' ? countFields(v) : 0), 0)
  }

  return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, overflow: 'hidden', marginTop: '1.5rem' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: open ? '1px solid ' + BORDER : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: TEXT, margin: '0 0 0.2rem' }}>JSON-LD Schema Viewer</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: 0 }}>The exact structured data AI bots read when crawling your page</p>
        </div>
        <button onClick={fetchSchema} disabled={loading} style={{ background: open ? BG : GOLD, color: open ? TEXT_MUTED : '#1a0e06', border: '1px solid ' + BORDER, borderRadius: 6, padding: '0.5rem 1.25rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Loading...' : open ? 'Hide Schema' : 'View My Schema →'}
        </button>
      </div>
      {open && schema && !schema.error && (
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Schema Types', value: schema['@graph']?.length || 1 },
              { label: 'Total Fields', value: countFields(schema) },
              { label: 'FAQs', value: schema['@graph']?.find((n: any) => n['@type'] === 'FAQPage')?.mainEntity?.length || 0 },
              { label: 'Rooms', value: schema['@graph']?.find((n: any) => n['@type'] === 'Hotel')?.containsPlace?.filter((p: any) => p['@type'] === 'HotelRoom')?.length || 0 },
            ].map(s => (
              <div key={s.label} style={{ background: BG, borderRadius: 6, padding: '0.6rem 1rem' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', color: TEXT_MUTED, margin: '0 0 0.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: GOLD, margin: 0, lineHeight: 1 }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
            <button onClick={copy} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, color: copied ? GREEN : TEXT_MUTED, background: BG, border: '1px solid ' + BORDER, borderRadius: 4, padding: '0.3rem 0.75rem', cursor: 'pointer' }}>
              {copied ? '✓ Copied' : 'Copy JSON'}
            </button>
          </div>
          <pre style={{ background: '#1a0e06', color: '#C9A84C', fontFamily: 'monospace', fontSize: '0.6rem', padding: '1.25rem', borderRadius: 8, overflow: 'auto', maxHeight: 400, margin: 0, lineHeight: 1.6 }}>
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>
      )}
      {open && schema?.error && (
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: RED }}>Could not load schema — check that your hotel page is live.</p>
        </div>
      )}
    </div>
  )
}

function SchemaTab({ hotel, hotelId, crawlerCount, onGoToOptimise }: { hotel: any; hotelId: string; crawlerCount?: number; onGoToOptimise: (tab?: string) => void }) {
  const [data, setData] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!hotelId) return
    const load = async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const [{ data: spa }, { data: rooms }, { data: restaurants }, { data: experiences }, { data: content }, { data: faqs }] = await Promise.all([
        sb.from('hotel_spa').select('*').eq('hotel_id', hotelId).eq('is_available', true),
        sb.from('room_types').select('*').eq('hotel_id', hotelId),
        sb.from('hotel_restaurants').select('*').eq('hotel_id', hotelId).eq('is_available', true),
        sb.from('hotel_experiences').select('*').eq('hotel_id', hotelId).eq('is_available', true),
        sb.from('hotel_content').select('faqs').eq('hotel_id', hotelId).single(),
        sb.from('hotel_faq_suggestions').select('*').eq('hotel_id', hotelId),
      ])
      setData({ spa, rooms, restaurants, experiences, faqs: content?.faqs || [], faqSuggestions: faqs || [] })
      setLoaded(true)
    }
    load()
  }, [hotelId])

  if (!loaded) return <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>Loading schema health...</p>

  const totalFaqs = (data.faqs?.length || 0) + (data.faqSuggestions?.length || 0)
  const spaFields = data.spa?.[0] ? ['name','description','size_sqm','treatments','price_from'].filter(f => data.spa[0][f]).length : 0
  const roomsWithDetail = (data.rooms || []).filter((r: any) => r.size_sqm && r.base_rate_chf).length
  const restaurantsWithDetail = (data.restaurants || []).filter((r: any) => r.description && r.cuisine_type).length

  const scoredFields = [
    {
      label: 'Hotel Description',
      impact: 'High',
      done: !!hotel?.description,
      score: hotel?.description ? Math.min(100, Math.round((hotel.description.split(' ').length / 80) * 100)) : 0,
      detail: hotel?.description ? `${hotel.description.split(' ').length} words` : 'Missing',
      tip: 'Include specific facts: m², distances, number of rooms, awards',
      fix: null,
    },
    {
      label: 'About Us',
      impact: 'High',
      done: !!hotel?.about_us,
      score: hotel?.about_us ? Math.min(100, Math.round((hotel.about_us.split(' ').length / 50) * 100)) : 0,
      detail: hotel?.about_us ? `${hotel.about_us.split(' ').length} words` : 'Missing',
      tip: 'Your unique story — specific facts AI can quote',
      fix: 'hotel-info',
    },
    {
      label: 'FAQs',
      impact: 'High',
      done: totalFaqs >= 5,
      score: totalFaqs === 0 ? 0 : totalFaqs <= 3 ? 30 : totalFaqs <= 5 ? 60 : totalFaqs <= 7 ? 80 : 100,
      detail: `${totalFaqs} FAQs across all pages`,
      tip: 'Aim for 8+ FAQs covering spa, dining, location, family, honeymoon',
      fix: 'overview',
    },
    {
      label: 'Spa & Wellness',
      impact: 'High',
      done: (data.spa?.length || 0) > 0,
      score: Math.round((spaFields / 5) * 100),
      detail: data.spa?.[0] ? `${spaFields}/5 fields complete` : 'Missing',
      tip: 'Add size, treatments, price, pool/sauna/hammam details',
      fix: 'spa',
    },
    {
      label: 'Room Types',
      impact: 'High',
      done: (data.rooms?.length || 0) > 0,
      score: data.rooms?.length === 0 ? 0 : Math.min(100, Math.round((roomsWithDetail / Math.max(data.rooms?.length || 1, 4)) * 100)),
      detail: `${data.rooms?.length || 0} rooms · ${roomsWithDetail} with full detail`,
      tip: 'Add size, bed type and price to every room for maximum AI retrieval',
      fix: null,
    },
    {
      label: 'Restaurants & Dining',
      impact: 'Medium',
      done: (data.restaurants?.length || 0) > 0,
      score: data.restaurants?.length === 0 ? 0 : Math.min(100, Math.round((restaurantsWithDetail / Math.max(data.restaurants?.length || 1, 2)) * 100) + (data.restaurants?.some((r: any) => r.michelin_stars > 0) ? 20 : 0)),
      detail: `${data.restaurants?.length || 0} restaurants · ${restaurantsWithDetail} with full detail`,
      tip: 'Add cuisine type, description and Michelin stars to each restaurant',
      fix: 'dining',
    },
    {
      label: 'Experiences',
      impact: 'Medium',
      done: (data.experiences?.length || 0) > 0,
      score: data.experiences?.length === 0 ? 0 : Math.min(100, data.experiences.length * 25),
      detail: `${data.experiences?.length || 0} experiences`,
      tip: 'Add at least 4 specific experiences with descriptions',
      fix: 'experiences',
    },
    {
      label: 'Languages Spoken',
      impact: 'Medium',
      done: !!hotel?.languages,
      score: hotel?.languages ? 100 : 0,
      detail: hotel?.languages || 'Missing',
      tip: 'Helps appear in searches from international travelers',
      fix: 'hotel-info',
    },
    {
      label: 'Check-in / Check-out',
      impact: 'Low',
      done: !!hotel?.check_in_time,
      score: hotel?.check_in_time && hotel?.check_out_time ? 100 : hotel?.check_in_time ? 50 : 0,
      detail: hotel?.check_in_time ? `${hotel.check_in_time} / ${hotel.check_out_time || '?'}` : 'Missing',
      tip: 'AI answers "what time is check-in" queries with this',
      fix: 'hotel-info',
    },
    {
      label: 'Cancellation Policy',
      impact: 'High',
      done: !!hotel?.cancellation_policy,
      score: hotel?.cancellation_policy ? 100 : 0,
      detail: hotel?.cancellation_policy || 'Missing',
      tip: 'One of the most common guest questions — AI quotes this directly',
      fix: 'hotel-info',
    },
    {
      label: 'Direct Booking Benefits',
      impact: 'High',
      done: !!hotel?.booking_benefits,
      score: hotel?.booking_benefits ? 100 : 0,
      detail: hotel?.booking_benefits ? `${hotel.booking_benefits.split(' ').slice(0, 5).join(' ')}...` : 'Missing',
      tip: 'Why book direct — AI uses this to differentiate from OTAs',
      fix: 'hotel-info',
    },
    {
      label: 'Seasonal Notes',
      impact: 'Medium',
      done: !!hotel?.seasonal_notes,
      score: hotel?.seasonal_notes ? 100 : 0,
      detail: hotel?.seasonal_notes || 'Missing',
      tip: 'Pool dates, ski season, terrace — guests ask AI about this',
      fix: 'hotel-info',
    },
    {
      label: 'Accessibility',
      impact: 'Medium',
      done: !!hotel?.accessibility,
      score: hotel?.accessibility ? 100 : 0,
      detail: hotel?.accessibility || 'Missing',
      tip: 'Growing search category — wheelchair access, lift, accessible spa',
      fix: 'hotel-info',
    },
    {
      label: 'Airport Transfer',
      impact: 'Medium',
      done: !!hotel?.private_transfer,
      score: hotel?.private_transfer ? 100 : 0,
      detail: hotel?.private_transfer ? 'Available' : 'Not set',
      tip: 'Appears in "hotel with airport transfer Geneva" searches',
      fix: 'hotel-info',
    },
    {
      label: 'Star Rating',
      impact: 'Medium',
      done: !!hotel?.rating,
      score: hotel?.rating ? 100 : 0,
      detail: hotel?.rating ? `${hotel.rating} stars` : 'Missing',
      tip: null,
      fix: null,
    },
    {
      label: 'Direct Booking URL',
      impact: 'High',
      done: !!hotel?.direct_booking_url,
      score: hotel?.direct_booking_url ? 100 : 0,
      detail: hotel?.direct_booking_url ? 'Connected ✓' : 'Missing',
      tip: null,
      fix: null,
    },
    {
      label: 'Nightly Rate',
      impact: 'High',
      done: !!hotel?.nightly_rate_chf,
      score: hotel?.nightly_rate_chf ? 100 : 0,
      detail: hotel?.nightly_rate_chf ? `CHF ${hotel.nightly_rate_chf}` : 'Missing',
      tip: null,
      fix: null,
    },
  ]

  const overallScore = Math.round(
    scoredFields.reduce((sum, f) => {
      const weight = f.impact === 'High' ? 3 : f.impact === 'Medium' ? 2 : 1
      return sum + (f.score * weight)
    }, 0) /
    scoredFields.reduce((sum, f) => {
      const weight = f.impact === 'High' ? 3 : f.impact === 'Medium' ? 2 : 1
      return sum + (weight * 100)
    }, 0) * 100
  )

  const scoreColor = overallScore >= 80 ? GREEN : overallScore >= 50 ? GOLD : RED
  const scoreLabel = overallScore >= 80 ? 'Strong' : overallScore >= 50 ? 'Good' : 'Needs Work'
  const missing = scoredFields.filter(f => !f.done)

  // Group fields into knowledge themes for premium presentation
  const themes = [
    { key: 'identity', label: 'Identity & Story', desc: 'Who the hotel is', fields: ['Hotel Description', 'About Us', 'Star Rating'] },
    { key: 'experience', label: 'The Experience', desc: 'What guests find', fields: ['Spa & Wellness', 'Restaurants & Dining', 'Experiences', 'Room Types'] },
    { key: 'practical', label: 'Stay Details', desc: 'Practical guest answers', fields: ['FAQs', 'Languages Spoken', 'Check-in / Check-out', 'Cancellation Policy', 'Seasonal Notes', 'Accessibility', 'Airport Transfer'] },
    { key: 'booking', label: 'Direct Booking', desc: 'The path to the guest', fields: ['Direct Booking Benefits', 'Direct Booking URL', 'Nightly Rate'] },
  ]
  const themeScore = (fieldLabels: string[]) => {
    const fs = scoredFields.filter(f => fieldLabels.includes(f.label))
    if (!fs.length) return 0
    return Math.round(fs.reduce((s, f) => s + f.score, 0) / fs.length)
  }

  // Circular gauge geometry
  const R = 54, C = 2 * Math.PI * R
  const dash = (overallScore / 100) * C

  return (
    <div>
      {/* ── HERO: AI Knowledge Profile ── */}
      <div style={{ background: `linear-gradient(135deg, #2A1A0E 0%, #3D2810 100%)`, borderRadius: 16, padding: '2.5rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,76,0.08) 0%, transparent 70%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', position: 'relative' }}>
          {/* Gauge */}
          <div style={{ flexShrink: 0, position: 'relative', width: 140, height: 140 }}>
            <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
              <circle cx="70" cy="70" r={R} fill="none" stroke={GOLD} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dash} ${C}`} style={{ transition: 'stroke-dasharray 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.75rem', fontWeight: 400, color: WHITE, lineHeight: 1 }}>{overallScore}</span>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.7)', marginTop: '0.2rem' }}>of 100</span>
            </div>
          </div>
          {/* Text */}
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.7)', margin: '0 0 0.6rem' }}>AI Knowledge Profile</p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', fontWeight: 300, color: WHITE, margin: '0 0 0.6rem', lineHeight: 1.3 }}>
              {overallScore >= 80 ? 'AI systems understand your hotel in depth.' : overallScore >= 50 ? 'AI systems understand your hotel well — with room to deepen.' : 'AI systems have a partial picture of your hotel.'}
            </p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.7, maxWidth: 480 }}>
              This score reflects how completely the structured data behind your profile describes your hotel to AI assistants. The richer it is, the more confidently they can recommend you.
            </p>
          </div>
        </div>
        {/* Impact bars */}
        <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', paddingTop: '1.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { label: 'Essential', completed: scoredFields.filter(f => f.impact === 'High').filter(f => f.done).length, total: scoredFields.filter(f => f.impact === 'High').length },
            { label: 'Enriching', completed: scoredFields.filter(f => f.impact === 'Medium').filter(f => f.done).length, total: scoredFields.filter(f => f.impact === 'Medium').length },
            { label: 'Refining', completed: scoredFields.filter(f => f.impact === 'Low').filter(f => f.done).length, total: scoredFields.filter(f => f.impact === 'Low').length },
          ].map(bar => (
            <div key={bar.label} style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>{bar.label}</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(201,169,76,0.8)', fontWeight: 600 }}>{bar.completed}/{bar.total}</span>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(bar.completed / bar.total) * 100}%`, background: GOLD, borderRadius: 2, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI CRAWLER PROOF ── */}
      {crawlerCount !== undefined && crawlerCount > 0 && (
        <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '1.5rem 1.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: GOLD_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: GOLD, fontSize: '1.1rem' }}>✦</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, flexShrink: 0, animation: 'pulse 2s infinite' }} />
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: GREEN }}>Live · tracking now</span>
            </div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: TEXT, margin: '0 0 0.2rem' }}>AI systems are actively reading your pages</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED, margin: 0, lineHeight: 1.6 }}>GPTBot, PerplexityBot and Google have crawled your profile, reading the structured data behind your hotel.</p>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0, paddingLeft: '1.5rem', borderLeft: '1px solid ' + BORDER, minWidth: 110 }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 400, color: GOLD, margin: 0, lineHeight: 1 }}>{crawlerCount.toLocaleString()}</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0.4rem 0 0' }}>{crawlerCount === 1 ? 'crawler visit' : 'crawler visits'}</p>
          </div>
        </div>
      )}

      {/* ── KNOWLEDGE LAYERS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {themes.map(t => {
          const sc = themeScore(t.fields)
          const scColor = sc >= 80 ? GREEN : sc >= 50 ? GOLD : sc > 0 ? '#d97706' : TEXT_MUTED
          return (
            <div key={t.key} style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', color: TEXT, margin: '0 0 0.1rem', lineHeight: 1.2 }}>{t.label}</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', color: TEXT_MUTED, margin: 0 }}>{t.desc}</p>
                </div>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: scColor, lineHeight: 1 }}>{sc}<span style={{ fontSize: '0.7rem', color: TEXT_MUTED }}>%</span></span>
              </div>
              <div style={{ height: 3, background: BORDER, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${sc}%`, background: scColor, borderRadius: 2 }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── COMPLETE YOUR PROFILE (recommendations) ── */}
      {missing.length > 0 && (
        <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '1.75rem', marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: TEXT, margin: '0 0 0.2rem' }}>Complete Your Profile</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED, margin: 0 }}>Each addition gives AI more to understand and recommend you for</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {missing.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.95rem 1.25rem', background: BG, borderRadius: 10, border: '1px solid ' + BORDER }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: f.impact === 'High' ? RED : f.impact === 'Medium' ? GOLD : BLUE, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', fontWeight: 600, color: TEXT, margin: 0 }}>{f.label}</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, margin: '0.1rem 0 0' }}>{f.impact === 'High' ? 'Essential' : f.impact === 'Medium' ? 'Enriching' : 'Refining'} · {f.tip || 'Adds depth to your AI profile'}</p>
                  </div>
                </div>
                {f.fix ? (
                  <button onClick={() => { onGoToOptimise(f.fix!); }} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, color: GOLD, background: GOLD_LIGHT, border: '1px solid rgba(201,169,76,0.3)', borderRadius: 6, padding: '0.4rem 0.9rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '1rem' }}>Complete →</button>
                ) : (
                  <a href="mailto:contact@swissnethotels.com" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, color: TEXT_MUTED, background: BG, border: '1px solid ' + BORDER, borderRadius: 6, padding: '0.4rem 0.9rem', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '1rem' }}>Contact us</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── WHAT AI UNDERSTANDS (full breakdown) ── */}
      <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid ' + BORDER }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: TEXT, margin: '0 0 0.2rem' }}>What AI Understands About Your Hotel</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED, margin: 0 }}>Every element of your structured profile, and how complete it is</p>
        </div>
        <div>
          {scoredFields.map((f, i) => {
            const sc = f.score
            const scColor = sc >= 80 ? GREEN : sc >= 50 ? GOLD : sc > 0 ? '#d97706' : RED
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1rem 1.75rem', borderBottom: i < scoredFields.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.done ? GREEN : scColor, flexShrink: 0, opacity: f.done ? 1 : 0.4 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 600, color: TEXT, margin: 0 }}>{f.label}</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: '0.1rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.detail || '—'}</p>
                </div>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: f.impact === 'High' ? RED : f.impact === 'Medium' ? GOLD : BLUE, flexShrink: 0, width: 70, textAlign: 'right' }}>{f.impact === 'High' ? 'Essential' : f.impact === 'Medium' ? 'Enriching' : 'Refining'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, width: 90 }}>
                  <div style={{ flex: 1, height: 4, background: BORDER, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: sc + '%', background: scColor, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, color: scColor, width: 30, textAlign: 'right' }}>{sc}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <SchemaVisualizer hotelId={hotelId} hotelSlug={hotel?.slug || ''} />
    </div>
  )
}

// ── GOALS TAB ─────────────────────────────────────────────────────────────────

function getCategoryRec(cat: string, hotelName: string) {
  const h = hotelName
  const lib: Record<string, { faq: string; words: string; campaign: string; ad: string }> = {
    spa: {
      faq: `Add an FAQ: "What makes the spa at ${h} special?" — answer with the spa's size in m², signature treatments, and thermal facilities (pool, sauna, hammam).`,
      words: `Use these in your spa description & FAQs: "wellness retreat", "thermal spa", "signature treatment", "spa day pass", "detox programme".`,
      campaign: `Launch a "Midweek Wellness Escape" package — 2 nights with daily spa access and one signature treatment.`,
      ad: `Post title: "A Day of Calm at ${h}". Content: a 20–30s Instagram Reel — slow shots of the spa, pool and a treatment, captioned with the spa size and one signature treatment. Boost to ages 30–55 within 100km. Wellness ads work best as quiet, sensory video.`,
    },
    dining: {
      faq: `Add an FAQ: "Does ${h} have a notable restaurant?" — name the chef, cuisine style, and any Michelin stars or awards.`,
      words: `Use these: "gastronomic", "tasting menu", "Michelin", "chef's table", "seasonal Swiss produce".`,
      campaign: `Create a "Gourmet Stay" offer pairing one night with a tasting menu for two.`,
      ad: `Post title: "Dinner Worth the Journey". Content: an Instagram carousel of 4–5 plated dishes plus one of the chef, captioned with the tasting-menu name and chef. Also post as a Google Business update. Food carousels earn strong saves and shares.`,
    },
    romantic: {
      faq: `Add an FAQ: "Is ${h} good for a honeymoon or romantic getaway?" — mention private terraces, couples spa treatments, and lake or mountain views.`,
      words: `Use these: "romantic getaway", "honeymoon suite", "couples retreat", "private dinner", "sunset terrace".`,
      campaign: `Build a "Romantic Escape" package — champagne on arrival, a couples massage, and a private candlelit dinner.`,
      ad: `Post title: "Two Nights, Just the Two of You". Content: a soft-lit Reel or photo set — champagne on a terrace, the suite, a candlelit table at dusk — captioned with the inclusions and price. Target couples 28–50, with an anniversary/Valentine's push. Romantic ads win on emotion, not detail.`,
    },
    lake: {
      faq: `Add an FAQ: "Does ${h} have lake views and lake access?" — specify which rooms have views, and any private beach, pontoon, or boat access.`,
      words: `Use these: "lakefront", "lake-view rooms", "private beach", "waterfront dining", "Lake Geneva".`,
      campaign: `Add a "Lakeside Summer" experience — a private boat cruise with a lakefront lunch.`,
      ad: `Post title: "Wake Up to the Lake". Content: a sunrise or sunset Reel from a lake-view room or terrace, plus a still of waterfront dining, captioned with which rooms have the view. Run May–September when lake searches peak. Golden-hour water footage stops the scroll.`,
    },
    business: {
      faq: `Add an FAQ: "Is ${h} suitable for business travel and meetings?" — give meeting-room capacities, airport distance, and late check-out for corporate guests.`,
      words: `Use these: "conference facilities", "meeting rooms", "business centre", "airport transfer", "executive".`,
      campaign: `Publish your meeting-room capacities and add a "Corporate Rate" booking benefit.`,
      ad: `Post title: "Meetings That Run Themselves". Content: a LinkedIn post (not Instagram) — one clean photo of the meeting room set up, with text listing capacity, airport distance and the corporate rate. Target HR, EA and event-planner titles nearby. Business travel is decided on LinkedIn.`,
    },
    family: {
      faq: `Add an FAQ: "Is ${h} family-friendly?" — mention connecting rooms, kids' club, family activities, and babysitting.`,
      words: `Use these: "family suite", "kids club", "connecting rooms", "child-friendly", "family activities".`,
      campaign: `Add a "Family Summer" package — connecting rooms, kids eat free, and one family activity.`,
      ad: `Post title: "A Holiday the Kids Remember". Content: a warm Reel of families by the pool or at kids' activities, captioned with "kids eat free" and connecting rooms. Target parents 30–45 during school-holiday windows. Family ads sell the parents' ease as much as the kids' fun.`,
    },
    ski: {
      faq: `Add an FAQ: "Is ${h} ski-in/ski-out?" — state distance to the nearest lift, ski storage, and any ski concierge service.`,
      words: `Use these: "ski-in ski-out", "slopeside", "ski concierge", "boot room", "alpine".`,
      campaign: `Add a "Ski Week" package with lift passes and ski storage, and publish your exact distance to the nearest lift.`,
      ad: `Post title: "Skis On, Straight to the Lift". Content: a fast-cut Reel — fresh snow, the boot room, someone clicking into skis at the door — captioned with exact distance to the lift and the Ski Week price. Run Nov–Feb. Ski buyers want proof of proximity, shown not told.`,
    },
  }
  return lib[cat] || lib.spa
}

function getQueryRec(query: string, hotelName: string) {
  const q = (query || '').toLowerCase()
  if (q.includes('spa') || q.includes('wellness') || q.includes('thermal')) return getCategoryRec('spa', hotelName)
  if (q.includes('honeymoon') || q.includes('romantic') || q.includes('couple')) return getCategoryRec('romantic', hotelName)
  if (q.includes('lake') || q.includes('waterfront')) return getCategoryRec('lake', hotelName)
  if (q.includes('family') || q.includes('kids') || q.includes('children')) return getCategoryRec('family', hotelName)
  if (q.includes('business') || q.includes('conference') || q.includes('meeting')) return getCategoryRec('business', hotelName)
  if (q.includes('dining') || q.includes('restaurant') || q.includes('michelin') || q.includes('food')) return getCategoryRec('dining', hotelName)
  if (q.includes('ski') || q.includes('slope') || q.includes('alpine')) return getCategoryRec('ski', hotelName)
  return {
    faq: `Add an FAQ that directly answers "${query}" — use the exact phrasing of the question and give a specific, factual answer AI can quote.`,
    words: `Mirror the language of the search itself: include the key words from "${query}" naturally in your description and FAQs.`,
    campaign: `Add a time-limited Event or package themed around this search. Fresh, dated, specific content is what tips a "not appearing" query into appearing.`,
    ad: `Post built around "${query}" — lead the title with that exact phrase. Content: one strong hero image or short Reel matching the search, captioned with those exact words. Post on Instagram and as a Google Business update so the language appears on indexed pages.`,
  }
}

function GoalCard({ num, kicker, title, chips, actions }: any) {
  const chipStyle = (tone: string) => {
    if (tone === 'live') return { color: TEXT, background: WHITE, border: '1px solid ' + BORDER }
    if (tone === 'goal') return { color: '#7a5e10', background: GOLD_LIGHT, border: '1px solid rgba(201,169,76,0.4)' }
    if (tone === 'note') return { color: TEXT_MUTED, background: 'transparent', border: '1px dashed ' + BORDER }
    return { color: TEXT_MUTED, background: BG, border: '1px solid ' + BORDER }
  }
  return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 16, marginBottom: '1.5rem', boxShadow: '0 2px 20px rgba(42,26,14,0.05)', overflow: 'hidden' }}>
      {/* Header band */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', padding: '1.75rem 1.85rem', borderBottom: '1px solid ' + BORDER, background: `linear-gradient(180deg, ${GOLD_LIGHT} 0%, rgba(248,245,239,0) 100%)` }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD} 0%, #b8923f 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(201,169,76,0.35)' }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 600, color: WHITE }}>{num}</span>
          </div>
        </div>
        <div style={{ flex: 1, paddingTop: '0.1rem' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.4rem' }}>{kicker}</p>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.45rem', color: TEXT, margin: 0, lineHeight: 1.25 }}>{title}</p>
          {chips && chips.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
              {chips.map((c: any, i: number) => (
                <span key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, borderRadius: 20, padding: '0.32rem 0.8rem', ...chipStyle(c.tone) }}>{c.text}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Actions */}
      <div style={{ padding: '1.4rem 1.85rem', display: 'flex', flexDirection: 'column', gap: '0' }}>
        {actions.map((a: any, i: number) => (
          <div key={i} style={{ display: 'flex', gap: '1.1rem', alignItems: 'flex-start', padding: '0.95rem 0', borderBottom: i < actions.length - 1 ? '1px solid ' + BORDER : 'none' }}>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: GOLD, background: GOLD_LIGHT, border: '1px solid rgba(201,169,76,0.3)', borderRadius: 6, padding: '0.45rem 0', whiteSpace: 'nowrap', flexShrink: 0, width: 116, textAlign: 'center', marginTop: '0.05rem' }}>{a.label}</span>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: TEXT, margin: 0, lineHeight: 1.75 }}>{a.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function GoalsTab({ hotelName, hotelRegion, periodScore, prevPeriodScore, hotelCatScores, competitors, missedList, categoryLabels, googleAiScores, onGo }: any) {
  const now = new Date()
  const monthName = now.toLocaleDateString('en-GB', { month: 'long' })
  const prevMonthName = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString('en-GB', { month: 'long' })
  const prevScore = prevPeriodScore?.score ?? null
  const cur = periodScore ?? null
  const scoreTarget = prevScore !== null ? Math.min(100, prevScore + 5) : (cur !== null ? cur + 5 : null)

  // GOAL 2 — weakest tracked category + rank
  const catRank = (cat: string) => {
    const list = [
      { name: hotelName, score: hotelCatScores?.[cat] ?? null, mine: true },
      ...(competitors || []).map((h: any) => ({ name: h.name, score: h.catScores?.[cat] ?? null, mine: false })),
    ].filter(x => x.score !== null).sort((a, b) => (b.score as number) - (a.score as number))
    const idx = list.findIndex(x => x.mine)
    return idx === -1 ? null : { rank: idx + 1, total: list.length, ahead: list[idx - 1]?.name }
  }
  const trackedCats = Object.keys(hotelCatScores || {})
  const weakestCat = trackedCats.length
    ? trackedCats.sort((a, b) => (hotelCatScores[a] as number) - (hotelCatScores[b] as number))[0]
    : null
  const weakCatRank = weakestCat ? catRank(weakestCat) : null
  const weakCatRec = weakestCat ? getCategoryRec(weakestCat, hotelName) : null
  const weakCatLabel = weakestCat ? (categoryLabels?.[weakestCat] || weakestCat) : ''
  const targetRank = weakCatRank ? Math.max(1, weakCatRank.rank - (weakCatRank.rank > 2 ? 2 : 1)) : null

  // GOAL 3 — a genuinely missed query (appeared === false), latest per query, distinct theme from goal 2
  const catKeywords: Record<string, string[]> = {
    spa: ['spa', 'wellness', 'thermal'], romantic: ['honeymoon', 'romantic', 'couple'],
    lake: ['lake', 'waterfront'], family: ['family', 'kids', 'children'],
    business: ['business', 'conference', 'meeting'], dining: ['dining', 'restaurant', 'michelin', 'food'],
    ski: ['ski', 'slope', 'alpine'],
  }
  const usedWords = weakestCat ? (catKeywords[weakestCat] || []) : []
  // For each query, find the single most recent row, then keep only those whose latest = not appeared
  const byQuery: Record<string, any> = {}
  for (const r of (googleAiScores || [])) {
    if (!r.query) continue
    const t = new Date(r.checked_at).getTime()
    if (!byQuery[r.query] || t > new Date(byQuery[r.query].checked_at).getTime()) byQuery[r.query] = r
  }
  const latestMissed = Object.values(byQuery).filter((r: any) => r.appeared === false)
  const distinctMissed = latestMissed.filter((m: any) => {
    const q = (m.query || '').toLowerCase()
    return !usedWords.some(w => q.includes(w))
  })
  const missedQuery = (distinctMissed[0] || latestMissed[0])?.query || null
  const queryRec = missedQuery ? getQueryRec(missedQuery, hotelName) : null

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, #2A1A0E 0%, #3D2810 100%)`, borderRadius: 16, padding: '2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -30, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,76,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.7)', margin: '0 0 0.9rem' }}>{monthName} {now.getFullYear()} · Your focus this month</p>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.65rem', fontWeight: 300, color: WHITE, margin: '0 0 1.5rem', lineHeight: 1.4, maxWidth: 560 }}>Three actions, each chosen from where {hotelName} is weakest right now.</p>
          <div style={{ display: 'flex', gap: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { n: '1', label: 'Raise your score' },
              { n: '2', label: 'Climb a category' },
              { n: '3', label: 'Win a new search' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(201,169,76,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.85rem', color: GOLD, flexShrink: 0 }}>{s.n}</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: 'rgba(255,255,255,0.6)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GOAL 1 */}
      <GoalCard
        num={1}
        kicker="Period Score Improvement"
        title="Raise your overall AI visibility score"
        chips={[
          prevScore !== null ? { text: `${prevMonthName}: ${prevScore}%`, tone: 'muted' } : null,
          cur !== null ? { text: `${monthName} so far: ${cur}%`, tone: 'live' } : null,
          scoreTarget !== null ? { text: `Goal: reach ${scoreTarget}%`, tone: 'goal' } : null,
        ].filter(Boolean)}
        actions={[
          { label: 'Add FAQs', text: `Add 2 new guest FAQs this ${monthName}. Each one widens the questions AI can match you to — the single highest-impact move on your score.` },
          { label: 'Complete content', text: 'In Content, fill any field still marked "Missing" — about, cancellation policy, booking benefits. The more complete your profile, the more often AI quotes you.' },
          { label: 'Stay current', text: 'Publish one dated offer or event. Fresh, dated content signals an active hotel, which AI systems favour.' },
        ]}
      />

      {/* GOAL 2 */}
      {weakestCat && weakCatRank && weakCatRec ? (
        <GoalCard
          num={2}
          kicker="Category to Improve"
          title={`Climb the ${weakCatLabel} ranking`}
          chips={[
            { text: `Starting rank: #${weakCatRank.rank} of ${weakCatRank.total}`, tone: 'muted' },
            targetRank ? { text: `Goal: climb to #${targetRank}`, tone: 'goal' } : null,
            weakCatRank.ahead ? { text: `Overtake ${weakCatRank.ahead.replace(' Geneva','').replace(' Hotel','')}`, tone: 'note' } : null,
          ].filter(Boolean)}
          actions={[
            { label: 'Add this FAQ', text: weakCatRec.faq },
            { label: 'Use these words', text: weakCatRec.words },
            { label: 'Run this package', text: weakCatRec.campaign },
            { label: 'Advertise this', text: weakCatRec.ad },
          ]}
        />
      ) : (
        <GoalCard num={2} kicker="Category to Improve" title="Category ranking" chips={[]} actions={[{ label: 'Building', text: 'Category rankings appear once enough data has been logged. Check back after the next weekly run.' }]} />
      )}

      {/* GOAL 3 */}
      {missedQuery && queryRec ? (
        <GoalCard
          num={3}
          kicker="Query Coverage"
          title={`Start appearing for "${missedQuery}"`}
          chips={[
            { text: 'Not appearing in Google AI', tone: 'muted' },
            { text: 'Goal: appear in Google AI', tone: 'goal' },
          ]}
          actions={[
            { label: 'Add this FAQ', text: queryRec.faq },
            { label: 'Use these words', text: queryRec.words },
            { label: 'Run this package', text: queryRec.campaign },
            { label: 'Advertise this', text: queryRec.ad },
          ]}
        />
      ) : (
        <GoalCard num={3} kicker="Query Coverage" title="Win a missed search" chips={[]} actions={[{ label: 'Great coverage', text: 'You currently appear in all tracked Google AI queries. Keep adding FAQs to widen the queries you are tracked against.' }]} />
      )}
    </div>
  )
}

// ── REPORTS TAB ───────────────────────────────────────────────────────────────

function ReportsTab({ hotelName, hotelRegion, overviewRunData, googleAiScores, views, clicks, hotelCatScores, competitors, categoryLabels, visibilityScore, hotelRank, regionCount }: any) {
  // Compute one month's metrics from a calendar window
  const monthReport = (year: number, month: number) => {
    const pad = (m: number) => String(m + 1).padStart(2, '0')
    const start = `${year}-${pad(month)}-01`
    const end = month === 11 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`

    // Visibility score for the window (ChatGPT+8, Perplexity, Google — daily avg then mean)
    const runs = (overviewRunData || []).filter((r: any) => {
      const d = r.run_date || r.checked_at?.split('T')[0]
      return d >= start && d < end
    })
    const uniqueDates = [...new Set(runs.map((r: any) => r.run_date || r.checked_at?.split('T')[0]).filter(Boolean))] as string[]
    const dailyAvgs = uniqueDates.map(d => {
      const day = runs.filter((r: any) => (r.run_date || r.checked_at?.split('T')[0]) === d)
      const perPlat = ['chatgpt', 'perplexity'].map(p => {
        const e = day.filter((s: any) => s.platform === p).sort((a: any, b: any) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime())[0]
        if (!e) return null
        return p === 'chatgpt' ? Math.min(100, e.visibility_score + 8) : e.visibility_score
      }).filter((s): s is number => s !== null)
      const g = (googleAiScores || []).filter((r: any) => r.checked_at?.split('T')[0] === d)
      const gScore = g.length > 0 ? Math.round((g.filter((r: any) => r.appeared).length / g.length) * 100) : null
      const all = [...perPlat, ...(gScore !== null ? [gScore] : [])]
      return all.length > 0 ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : null
    }).filter((s): s is number => s !== null)
    const score = dailyAvgs.length > 0 ? Math.round(dailyAvgs.reduce((a, b) => a + b, 0) / dailyAvgs.length) : null

    // Appearances
    const appearG = (googleAiScores || []).filter((r: any) => { const d = r.checked_at?.split('T')[0]; return d >= start && d < end && r.appeared }).length
    const appearCP = runs.reduce((s: number, r: any) => s + (r.appearances || 0), 0)

    // Clicks & views in window
    const inWin = (dateStr: string) => { const d = dateStr?.split('T')[0]; return d >= start && d < end }
    const bookClicks = (clicks || []).filter((c: any) => c.utm_campaign === 'hotels_page_book' && inWin(c.clicked_at)).length
    const WEBSITE = ['hotel_profile', 'rooms_page', 'dining_page', 'spa_page', 'experiences_page', 'events_page', 'hotels_page_website']
    const webClicks = (clicks || []).filter((c: any) => WEBSITE.includes(c.utm_campaign) && inWin(c.clicked_at)).length
    const monthViews = (views || []).filter((v: any) => inWin(v.viewed_at)).length

    return { score, appearances: appearG + appearCP, bookClicks, webClicks, views: monthViews }
  }

  // Build list of completed months (earliest data → last month)
  const allDates = [
    ...(overviewRunData || []).map((r: any) => r.run_date || r.checked_at?.split('T')[0]),
    ...(googleAiScores || []).map((r: any) => r.checked_at?.split('T')[0]),
    ...(views || []).map((v: any) => v.viewed_at?.split('T')[0]),
  ].filter(Boolean).sort()
  const now = new Date()
  const curY = now.getFullYear(), curM = now.getMonth()
  const months: { year: number; month: number }[] = []
  if (allDates.length > 0) {
    const first = new Date(allDates[0])
    let y = first.getFullYear(), m = first.getMonth()
    while (y < curY || (y === curY && m < curM)) {
      months.push({ year: y, month: m })
      if (m === 11) { m = 0; y++ } else m++
    }
  }
  months.reverse() // newest first

  const monthName = (y: number, m: number) => new Date(y, m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const download = (year: number, month: number) => {
    const rep = monthReport(year, month)
    const prev = month === 0 ? monthReport(year - 1, 11) : monthReport(year, month - 1)
    const delta = rep.score !== null && prev.score !== null ? rep.score - prev.score : null
    const mn = monthName(year, month)
    const topCats = Object.entries(hotelCatScores || {})
      .sort((a: any, b: any) => (b[1] as number) - (a[1] as number))
      .slice(0, 4)
      .map(([k, v]) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#444">${categoryLabels?.[k] || k}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:#C9A84C">${v}%</td></tr>`)
      .join('')

    const stat = (label: string, value: string, sub = '') =>
      `<div style="flex:1;padding:18px 20px;border:1px solid #eee;border-radius:10px"><p style="margin:0 0 6px;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#999">${label}</p><p style="margin:0;font-family:Georgia,serif;font-size:30px;color:#2A1A0E;line-height:1">${value}</p>${sub ? `<p style="margin:4px 0 0;font-size:10px;color:#999">${sub}</p>` : ''}</div>`

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${hotelName} — ${mn} Report</title>
<style>@media print{@page{margin:1.5cm}}body{font-family:'Helvetica Neue',Arial,sans-serif;color:#2A1A0E;max-width:760px;margin:0 auto;padding:40px 32px;line-height:1.6}</style></head><body>
<div style="border-bottom:2px solid #C9A84C;padding-bottom:20px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:flex-end">
  <div><p style="margin:0;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#C9A84C;font-weight:600">SwissNet Hotels</p>
  <h1 style="margin:8px 0 0;font-family:Georgia,serif;font-size:30px;font-weight:400">${hotelName}</h1>
  <p style="margin:4px 0 0;font-size:13px;color:#777">AI Visibility Report · ${mn}</p></div>
  <p style="margin:0;font-size:10px;color:#aaa">${hotelRegion}, Switzerland</p>
</div>

<p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#999;margin:0 0 12px">Headline</p>
<div style="display:flex;gap:12px;margin-bottom:28px">
  ${stat('AI Visibility Score', rep.score !== null ? rep.score + '%' : '—', delta !== null ? (delta >= 0 ? `▲ ${delta} pts vs previous month` : `▼ ${Math.abs(delta)} pts vs previous month`) : 'first month tracked')}
  ${stat('AI Appearances', String(rep.appearances), 'across tracked searches')}
  ${stat('Market Rank', '#' + hotelRank, `of ${regionCount} in ${hotelRegion} (current)`)}
</div>

<p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#999;margin:0 0 12px">Guest Engagement</p>
<div style="display:flex;gap:12px;margin-bottom:28px">
  ${stat('Booking Engine Clicks', String(rep.bookClicks), 'guests sent to book direct')}
  ${stat('Website Clicks', String(rep.webClicks), 'to your official site')}
  ${stat('Profile Views', String(rep.views), 'on SwissNet pages')}
</div>

${topCats ? `<p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#999;margin:0 0 12px">Top Categories</p>
<table style="width:100%;border-collapse:collapse;margin-bottom:28px;font-size:13px">${topCats}</table>` : ''}

<div style="border-top:1px solid #eee;padding-top:16px;margin-top:32px">
  <p style="font-size:10px;color:#aaa;line-height:1.6;margin:0">This report covers ${mn} and reflects data recorded during that month. AI visibility scores are measured across ChatGPT, Perplexity and Google AI. Market rank reflects current standing. Generated by SwissNet Hotels.</p>
</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`

    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, #2A1A0E 0%, #3D2810 100%)`, borderRadius: 16, padding: '2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -30, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,76,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.7)', margin: '0 0 0.9rem' }}>Monthly Reports</p>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.65rem', fontWeight: 300, color: WHITE, margin: 0, lineHeight: 1.4, maxWidth: 560 }}>A clean summary of your AI visibility, ready to download for each completed month.</p>
        </div>
      </div>

      {months.length === 0 ? (
        <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: TEXT_MUTED, margin: '0 0 0.4rem' }}>Your first report is on its way</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED, margin: 0, lineHeight: 1.7 }}>Reports become available at the start of each month, covering the month just completed.</p>
        </div>
      ) : (
        <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, overflow: 'hidden' }}>
          {months.map((m, i) => (
            <div key={`${m.year}-${m.month}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.75rem', borderBottom: i < months.length - 1 ? '1px solid ' + BORDER : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: GOLD_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: GOLD, fontSize: '0.9rem' }}>✦</span>
                </div>
                <div>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: TEXT, margin: 0, lineHeight: 1.2 }}>{monthName(m.year, m.month)}</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', color: TEXT_MUTED, margin: '0.1rem 0 0' }}>AI Visibility Report</p>
                </div>
              </div>
              <button onClick={() => download(m.year, m.month)} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, color: TEXT, background: GOLD, border: 'none', borderRadius: 6, padding: '0.55rem 1.25rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Download PDF</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────

export default function DashboardClient({ hotel, views, clicks, leads, aiVisibility, googleAiScores, bookings, competitors, hotelCatScores, platformScores, overviewRunData, myRankChange, marketAverages, crawlerCount }: any) {
  const [tab, setTab] = useState('overview')
  const [period, setPeriod] = useState(30)
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(null)
  const [showRangePicker, setShowRangePicker] = useState(false)
  const [chartPeriod, setChartPeriod] = useState(7)
  const [chartPlatform, setChartPlatform] = useState('overall')
  const [competitorView, setCompetitorView] = useState('region')
  const [optimiseTab, setOptimiseTab] = useState('overview')
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
  const periodStartDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
const myRunsInPeriod = (overviewRunData || []).filter((r: any) => {
  const date = r.run_date || r.checked_at?.split('T')[0]
  return date >= periodStartDate
})
const totalQueriesChatPerp = myRunsInPeriod.reduce((sum: number, r: any) => sum + (r.total_queries || 0), 0)
const appearedQueriesChatPerp = myRunsInPeriod.reduce((sum: number, r: any) => sum + (r.appearances || 0), 0)

// Add Google AI queries in period
const googleInPeriod = (googleAiScores || []).filter((r: any) => {
  const date = r.checked_at?.split('T')[0]
  return date >= periodStartDate
})
const totalQueriesGoogle = googleInPeriod.length
const appearedQueriesGoogle = googleInPeriod.filter((r: any) => r.appeared).length

const totalQueries = totalQueriesChatPerp + totalQueriesGoogle
const appearedQueries = appearedQueriesChatPerp + appearedQueriesGoogle
const scoreForWindow = (startStr: string, endStr: string) => {
  const runs = (overviewRunData || []).filter((r: any) => {
    const d = r.run_date || r.checked_at?.split('T')[0]
    return d >= startStr && d < endStr
  })
  const uniqueDates = [...new Set(runs.map((r: any) => r.run_date || r.checked_at?.split('T')[0]).filter(Boolean))] as string[]
  const dailyAvgs = uniqueDates.map(d => {
    const dayScoresAll = runs.filter((r: any) => (r.run_date || r.checked_at?.split('T')[0]) === d)
    const latestPerPlatform = ['chatgpt', 'perplexity'].map(platform => {
      const entry = dayScoresAll.filter((s: any) => s.platform === platform)
        .sort((a: any, b: any) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime())[0]
      if (!entry) return null
      return platform === 'chatgpt' ? Math.min(100, entry.visibility_score + 8) : entry.visibility_score
    }).filter((s): s is number => s !== null)
    const googleForDate = (googleAiScores || []).filter((r: any) => r.checked_at?.split('T')[0] === d)
    const googleDayScore = googleForDate.length > 0 ? Math.round((googleForDate.filter((r: any) => r.appeared).length / googleForDate.length) * 100) : null
    const allScores = [...latestPerPlatform, ...(googleDayScore !== null ? [googleDayScore] : [])].filter((s): s is number => s !== null)
    return allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null
  }).filter((s): s is number => s !== null)
  return dailyAvgs.length > 0 ? Math.round(dailyAvgs.reduce((a, b) => a + b, 0) / dailyAvgs.length) : null
}
const _now = new Date()
const fmt = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}-01`
const curMonthStart = fmt(_now.getFullYear(), _now.getMonth())
const nextMonthStart = _now.getMonth() === 11 ? fmt(_now.getFullYear() + 1, 0) : fmt(_now.getFullYear(), _now.getMonth() + 1)
const periodScore = scoreForWindow(curMonthStart, nextMonthStart)
const prevPeriodScore = (() => {
  const now = new Date()
  // previous full calendar month
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const fmt2 = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}-01`
  const prevStartStr = now.getMonth() === 0 ? fmt2(now.getFullYear() - 1, 11) : fmt2(now.getFullYear(), now.getMonth() - 1)
  const prevEndStr = fmt2(now.getFullYear(), now.getMonth())
  const prevRuns = (overviewRunData || []).filter((r: any) => {
    const d = r.run_date || r.checked_at?.split('T')[0]
    return d >= prevStartStr && d < prevEndStr
  })
  const uniqueDates = [...new Set(prevRuns.map((r: any) => r.run_date || r.checked_at?.split('T')[0]).filter(Boolean))] as string[]
  const dailyAvgs = uniqueDates.map(d => {
    const dayScoresAll = prevRuns.filter((r: any) => (r.run_date || r.checked_at?.split('T')[0]) === d)
    const latestPerPlatform = ['chatgpt', 'perplexity'].map(platform => {
      const entry = dayScoresAll.filter((s: any) => s.platform === platform)
        .sort((a: any, b: any) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime())[0]
      if (!entry) return null
      return platform === 'chatgpt' ? Math.min(100, entry.visibility_score + 8) : entry.visibility_score
    }).filter((s): s is number => s !== null)
    const googleForDate = (googleAiScores || []).filter((r: any) => r.checked_at?.split('T')[0] === d)
    const googleDayScore = googleForDate.length > 0 ? Math.round((googleForDate.filter((r: any) => r.appeared).length / googleForDate.length) * 100) : null
    const allScores = [...latestPerPlatform, ...(googleDayScore !== null ? [googleDayScore] : [])]
    return allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null
  }).filter((s): s is number => s !== null)
  const score = dailyAvgs.length > 0 ? Math.round(dailyAvgs.reduce((a, b) => a + b, 0) / dailyAvgs.length) : null
  const label = prevMonthStart.toLocaleDateString('en-GB', { month: 'short' })
  return { score, label }
})()
const latestPerQuery = [...new Map(
  [...(googleAiScores || [])].sort((a: any, b: any) => 
    new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()
  ).map((r: any) => [r.query, r])
).values()]
const appearedList = latestPerQuery.filter((r: any) => r.appeared)
const missedList = latestPerQuery.filter((r: any) => !r.appeared)
  const now = new Date()
  const periodStart = customRange ? new Date(customRange.start + 'T00:00:00') : new Date(now.getTime() - period * 24 * 60 * 60 * 1000)
  const periodEnd = customRange ? new Date(customRange.end + 'T23:59:59') : now
  const inRange = (dateStr: string) => { const d = new Date(dateStr); return d > periodStart && d <= periodEnd }
  const recentViews = views?.filter((v: any) => inRange(v.viewed_at)) || []
  const recentClicks = clicks?.filter((c: any) => inRange(c.clicked_at)) || []
  const recentLeads = leads?.filter((l: any) => inRange(l.created_at)) || []
  const recentBookings = bookings?.filter((b: any) => inRange(b.booked_at)) || []

  const rangeDays = customRange
    ? Math.max(1, Math.round((new Date(customRange.end).getTime() - new Date(customRange.start).getTime()) / 86400000) + 1)
    : period
  const days = Array.from({ length: rangeDays }, (_, i) => {
    const base = customRange ? new Date(customRange.start + 'T00:00:00') : new Date(now.getTime() - (period - 1) * 86400000)
    const d = new Date(base.getTime() + i * 86400000)
    return d.toISOString().split('T')[0]
  })
  const clicksByDay = days.map(d => recentClicks.filter((c: any) => c.clicked_at?.startsWith(d)).length)
  const viewsByDay = days.map(d => recentViews.filter((v: any) => v.viewed_at?.startsWith(d)).length)
  const bookingsByDay = days.map(d => recentBookings.filter((b: any) => b.booked_at?.startsWith(d)).length)
  const WEBSITE_CAMPAIGNS = ['hotel_profile', 'rooms_page', 'dining_page', 'spa_page', 'experiences_page', 'events_page', 'hotels_page_website']
  const PROFILE_CAMPAIGNS = ['best_page', 'compare', 'destination', 'ai_concierge']
  const websiteClicks = (clicks || []).filter((c: any) => WEBSITE_CAMPAIGNS.includes(c.utm_campaign) && inRange(c.clicked_at))
  const bookClicks = (clicks || []).filter((c: any) => c.utm_campaign === 'hotels_page_book' && inRange(c.clicked_at))
  const profileClicks = (clicks || []).filter((c: any) => PROFILE_CAMPAIGNS.includes(c.utm_campaign) && inRange(c.clicked_at))
  const profileClicksByDay = days.map(d => profileClicks.filter((c: any) => c.clicked_at?.startsWith(d)).length)
  const websiteClicksByDay = days.map(d => websiteClicks.filter((c: any) => c.clicked_at?.startsWith(d)).length)
  const bookClicksByDay = days.map(d => bookClicks.filter((c: any) => c.clicked_at?.startsWith(d)).length)

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
  const categoryLabels: Record<string, string> = {
    spa: 'Spa & Wellness',
    ski: 'Ski Resort',
    dining: 'Fine Dining',
    romantic: 'Romantic',
    lake: 'Lake Hotel',
    business: 'Business',
    family: 'Family',
  }

  const competitorTabs = [
    { key: 'region', label: 'General' },
    ...hotelCategories.map(c => ({ key: c, label: categoryLabels[c] || c })),
  ]
  


  const getCompetitorTableHotels = () => {
    if (competitorView === 'region') return allHotelsInRegion

    const list = [
      {
        name: hotelName,
        is_current: true,
        visibilityScore: hotelCatScores?.[competitorView] ?? null,
      },
      ...(competitors || []).map((h: any) => ({
        ...h,
        is_current: false,
        visibilityScore: h.catScores?.[competitorView] ?? null,
      }))
    ]

    return list.sort((a: any, b: any) => {
      const sA = a.visibilityScore ?? -1
      const sB = b.visibilityScore ?? -1
      return sB - sA
    })
  }

  const competitorTableHotels = getCompetitorTableHotels()
  const competitorTableLabel = competitorView === 'region' 
    ? `General — ${hotelRegion}` 
    : `${competitorTabs.find(t => t.key === competitorView)?.label || ''} — ${hotelRegion}`

  const navItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'ai-visibility', label: 'AI Visibility' },
  { id: 'performance', label: 'Performance' },
  { id: 'competitors', label: 'Competitors' },
  { id: 'schema', label: '✦ Schema' },
  { id: 'optimise', label: '✦ Optimise' },
  { id: 'goals', label: '✦ Goals' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: 'Montserrat, sans-serif' }}>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }`}</style>

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
              {tab === 'schema' && '✦ Schema Health'}
{tab === 'optimise' && '✦ Optimise'}
{tab === 'goals' && '✦ Goals This Month'}
{tab === 'reports' && 'Reports'}
{tab === 'settings' && 'Settings'}
            </h1>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED, margin: 0 }}>
              {tab === 'overview' && `${customRange ? `${customRange.start} → ${customRange.end}` : `Last ${period} days`} · ${hotelRegion}, Switzerland`}
              {tab === 'ai-visibility' && 'Your presence across AI search platforms'}
              {tab === 'performance' && 'Clicks, leads and conversion tracking'}
              {tab === 'competitors' && 'AI visibility rankings across categories'}
              {tab === 'schema' && 'AI readiness score and content recommendations'}
{tab === 'optimise' && 'Manage your content and FAQs'}
{tab === 'goals' && 'Three focused actions to climb the AI rankings'}
{tab === 'reports' && 'Download your monthly performance reports'}
{tab === 'settings' && 'Account and hotel settings'}
            </p>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <select
                value={(() => {
                  if (!customRange) return String(period)
                  const n = new Date()
                  const pad = (m: number) => String(m + 1).padStart(2, '0')
                  const tmStart = `${n.getFullYear()}-${pad(n.getMonth())}-01`
                  const tmEnd = n.toISOString().split('T')[0]
                  if (customRange.start === tmStart && customRange.end === tmEnd) return 'thismonth'
                  const lm = new Date(n.getFullYear(), n.getMonth() - 1, 1)
                  const lmStart = `${lm.getFullYear()}-${pad(lm.getMonth())}-01`
                  const lastDay = new Date(n.getFullYear(), n.getMonth(), 0).getDate()
                  const lmEnd = `${lm.getFullYear()}-${pad(lm.getMonth())}-${String(lastDay).padStart(2, '0')}`
                  if (customRange.start === lmStart && customRange.end === lmEnd) return 'lastmonth'
                  return 'custom'
                })()}
                onChange={(e) => {
                  const v = e.target.value
                  const pad = (m: number) => String(m + 1).padStart(2, '0')
                  if (v === 'custom') {
                    const end = new Date().toISOString().split('T')[0]
                    const start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
                    setCustomRange({ start, end }); setShowRangePicker(true)
                  } else if (v === 'thismonth') {
                    const n = new Date()
                    const start = `${n.getFullYear()}-${pad(n.getMonth())}-01`
                    const end = n.toISOString().split('T')[0]
                    setCustomRange({ start, end }); setShowRangePicker(false)
                  } else if (v === 'lastmonth') {
                    const n = new Date()
                    const lm = new Date(n.getFullYear(), n.getMonth() - 1, 1)
                    const start = `${lm.getFullYear()}-${pad(lm.getMonth())}-01`
                    const lastDay = new Date(n.getFullYear(), n.getMonth(), 0).getDate()
                    const end = `${lm.getFullYear()}-${pad(lm.getMonth())}-${String(lastDay).padStart(2, '0')}`
                    setCustomRange({ start, end }); setShowRangePicker(false)
                  } else {
                    setCustomRange(null); setShowRangePicker(false); setPeriod(Number(v))
                  }
                }}
                style={{ padding: '0.4rem 0.75rem', borderRadius: 4, border: '1px solid ' + BORDER, background: WHITE, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
              >
                <option value="7">Last week</option>
                <option value="30">Last 30 days</option>
                <option value="thismonth">This month</option>
                <option value="lastmonth">Last month</option>
                <option value="90">Last 90 days</option>
                <option value="custom">Custom range…</option>
              </select>
              {customRange && (
                <button onClick={() => setShowRangePicker(s => !s)} style={{ padding: '0.4rem 0.75rem', borderRadius: 4, border: '1px solid ' + GOLD, background: GOLD_LIGHT, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {customRange.start} → {customRange.end}
                </button>
              )}
            </div>
            {showRangePicker && customRange && (
              <div style={{ position: 'absolute', right: 0, top: '2.5rem', background: WHITE, border: '1px solid ' + BORDER, borderRadius: 8, padding: '1rem', boxShadow: '0 4px 20px rgba(42,26,14,0.12)', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: 220 }}>
                <div>
                  <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.25rem' }}>From</label>
                  <input type="date" value={customRange.start} max={customRange.end} onChange={(e) => setCustomRange(r => r ? { ...r, start: e.target.value } : r)} style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: 4, border: '1px solid ' + BORDER, fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, display: 'block', marginBottom: '0.25rem' }}>To</label>
                  <input type="date" value={customRange.end} min={customRange.start} max={new Date().toISOString().split('T')[0]} onChange={(e) => setCustomRange(r => r ? { ...r, end: e.target.value } : r)} style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: 4, border: '1px solid ' + BORDER, fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT, boxSizing: 'border-box' }} />
                </div>
                <button onClick={() => setShowRangePicker(false)} style={{ background: GOLD, color: TEXT, border: 'none', borderRadius: 4, padding: '0.45rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, cursor: 'pointer' }}>Apply</button>
              </div>
            )}
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
              <KPICard label="Official Website Clicks" value={websiteClicks.length} sub={`last ${period} days`} color={GOLD} spark={websiteClicksByDay} />
              <KPICard label="Booking Engine Clicks" value={bookClicks.length} sub={`to hotel booking engine · last ${period} days`} color={GOLD} spark={bookClicksByDay} />
              <KPICard label="Profile Views" value={recentViews.length} sub={`last ${period} days`} color={BLUE} spark={viewsByDay} />
              <KPICard label="Direct Savings" value={recentBookings.length > 0 ? `CHF ${Math.round(recentBookings.reduce((sum: number, b: any) => sum + (b.total_chf || 0), 0) * 0.15).toLocaleString()}` : '—'} sub="vs OTA commissions" color={GREEN} />
            </div>
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: '0 0 1rem' }}>Performance Over Time</p>
              <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '0.75rem' }}>
                {[{ label: 'Total Clicks', color: GOLD }, { label: 'Views', color: BLUE }, { label: 'Conversions', color: GREEN }].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: 18, height: 2, background: l.color, borderRadius: 2, opacity: 0.9 }} />
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{l.label}</span>
                  </div>
                ))}
              </div>
              <DualAxisChart datasets={[{ data: clicksByDay, color: GOLD, label: 'Clicks' }, { data: viewsByDay, color: BLUE, label: 'Views' }, { data: bookingsByDay, color: GREEN, label: 'Conversions' }]} labels={days} height={160} hotelId={hotel?.id} />
            </div>
            <InsightCard text={insight.text} type={insight.type} />
          </div>
        )}

        {/* ── AI VISIBILITY ── */}
        {tab === 'ai-visibility' && (
          <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
  <KPICard label="AI Visibility Score" value={visibilityScore + '%'} sub="overall daily score" color={GOLD} />
  <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.25rem 1.5rem', flex: 1, minWidth: 0 }}>
    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.75rem' }}>Period Score</p>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, color: TEXT, margin: '0 0 0.2rem', lineHeight: 1 }}>{periodScore !== null ? periodScore + '%' : '—'}</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: BLUE, margin: 0 }}>{new Date().toLocaleDateString('en-GB', { month: 'long' })} avg score</p>
      </div>
      {prevPeriodScore.score !== null && (
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT_MUTED, margin: '0 0 0.15rem', lineHeight: 1 }}>{prevPeriodScore.score}%</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', color: TEXT_MUTED, margin: 0 }}>
            {prevPeriodScore.label}
            {periodScore !== null && (
              <span style={{ color: periodScore >= prevPeriodScore.score ? GREEN : RED, fontWeight: 700, marginLeft: 4 }}>
                {periodScore >= prevPeriodScore.score ? '↑' : '↓'}{Math.abs(periodScore - prevPeriodScore.score)}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  </div>
  <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.25rem 1.5rem', flex: 1, minWidth: 0 }}>
    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.75rem' }}>AI Appearances</p>
    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, color: TEXT, margin: 0, lineHeight: 1 }}>{appearedQueries}</p>
    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: GOLD, margin: '0.2rem 0 0' }}>{`query appearances · last ${period}d`}</p>
  </div>
</div>
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: '0 0 0.25rem' }}>Visibility by AI Platform</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED, margin: '0 0 1.25rem', lineHeight: 1.6 }}>Scores update daily across all three platforms.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[{ label: 'ChatGPT', note: 'Via Bing index', key: 'chatgpt' }, { label: 'Perplexity', note: 'Via Bing index', key: 'perplexity' }, { label: 'Google AI', note: 'Via Google index', key: 'google_ai' }].map(src => {
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
                    {appearedList.slice(0, 5).map((row: any, i: number) => (
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
                {googleAiScores?.filter((r: any) => !r.appeared).slice(0, 6).length === 0
  ? <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>No missed queries — excellent coverage.</p>
  : [...new Map(googleAiScores?.filter((r: any) => !r.appeared).map((r: any) => [r.query, r])).values()].slice(0, 6).map((row: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid ' + BORDER }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: RED, flexShrink: 0 }} />
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT, margin: 0, flex: 1 }}>{row.query}</p>
                      <button onClick={() => { setTab('optimise') }} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, color: GOLD, background: GOLD_LIGHT, border: '1px solid ' + BORDER, borderRadius: 4, padding: '0.2rem 0.6rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>Add FAQ →</button>
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
                  : chartPlatform === 'google_ai'
                  ? ([...new Set((googleAiScores || []).map((r: any) => r.checked_at?.split('T')[0]).filter(Boolean))].sort() as string[])
                  : ([...new Set((overviewRunData || []).filter((r: any) => r.platform === chartPlatform).map((r: any) => r.checked_at?.split('T')[0]).filter(Boolean))].sort() as string[])

                const realPoints = allDates.map((d: string) => {
                  if (chartPlatform === 'overall') {
                    const dayScoresAll = (overviewRunData || []).filter((r: any) => r.checked_at?.startsWith(d))
// Take only latest score per platform
const dayScores = ['chatgpt', 'perplexity'].map(platform => 
  dayScoresAll.filter((s: any) => s.platform === platform)
    .sort((a: any, b: any) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime())[0]
).filter(Boolean)
                    const adjustedScores = dayScores.map((s: any) => ({
  ...s,
  visibility_score: s.platform === 'chatgpt' ? Math.min(100, s.visibility_score + 8) : s.visibility_score
}))
const platformAvg = adjustedScores.length > 0
  ? Math.round(adjustedScores.reduce((sum: number, s: any) => sum + s.visibility_score, 0) / adjustedScores.length)
  : null
// Include Google AI score for that date if available
const googleForDate = (googleAiScores || []).filter((r: any) => r.checked_at?.startsWith(d))
const googleScore = googleForDate.length > 0 ? Math.round((googleForDate.filter((r: any) => r.appeared).length / googleForDate.length) * 100) : null
const chatgptForDate = adjustedScores.find((s: any) => s.platform === 'chatgpt')?.visibility_score ?? null
const perplexityForDate = adjustedScores.find((s: any) => s.platform === 'perplexity')?.visibility_score ?? null
const allScores = [chatgptForDate, perplexityForDate, googleScore].filter((s): s is number => s !== null)
const avg = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null
return { date: d, score: avg }
                  }
                  if (chartPlatform === 'google_ai') {
                    const dayGoogleScores = (googleAiScores || []).filter((r: any) => r.checked_at?.startsWith(d))
                    const appeared = dayGoogleScores.filter((r: any) => r.appeared).length
                    const score = dayGoogleScores.length > 0 ? Math.round((appeared / dayGoogleScores.length) * 100) : null
                    return { date: d, score }
                  }
                  const dayScores = (overviewRunData || []).filter((r: any) => r.checked_at?.startsWith(d) && r.platform === chartPlatform)
                  const adjustedDayScores = dayScores.map((s: any) => ({
  ...s,
  visibility_score: s.platform === 'chatgpt' ? Math.min(100, s.visibility_score +8) : s.visibility_score
}))
                  const score = adjustedDayScores.length > 0
                    ? Math.round(adjustedDayScores.reduce((sum: number, s: any) => sum + s.visibility_score, 0) / adjustedDayScores.length)
                    : null
                  return { date: d, score }
                }).filter((d): d is { date: string; score: number } => d.score !== null && d.date >= cutoff)

                if (realPoints.length === 0) return <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED }}>No data yet for this platform</p></div>

                const startDate = chartPeriod === 365 ? new Date(realPoints[0].date) : new Date(Math.min(...realPoints.map(p => new Date(p.date).getTime()), new Date(cutoff).getTime()))
                const endDate = new Date()
                const today = new Date().toISOString().split('T')[0]
const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
const calendarDays: string[] = []
for (let i = 0; i <= totalDays; i++) { const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000); calendarDays.push(d.toISOString().split('T')[0]) }
if (!calendarDays.includes(today)) calendarDays.push(today)

                if (realPoints.length === 1) return (
                  <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', color: GOLD, margin: 0 }}>{realPoints[0].score}%</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: 0 }}>Recorded on {new Date(realPoints[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} · More runs needed to show trend</p>
                  </div>
                )

                const W = 580, H = 170, pL = 40, pR = 60, pT = 16, pB = 30
                const cW = W - pL - pR, cH = H - pT - pB
                const marketAvg = chartPlatform === 'overall' ? (marketAverages?.overall ?? 35)
  : chartPlatform === 'chatgpt' ? (marketAverages?.chatgpt ?? 35)
  : chartPlatform === 'perplexity' ? (marketAverages?.perplexity ?? 35)
  : null
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
                    {marketAvg !== null && <>
                      <line x1={pL} y1={py(marketAvg)} x2={pL + cW} y2={py(marketAvg)} stroke="rgba(42,26,14,0.08)" strokeWidth="1" strokeDasharray="3 6" />
                      <text x={pL + cW - 4} y={py(marketAvg) - 5} textAnchor="end" fill="rgba(42,26,14,0.4)" fontSize="7" fontFamily="Montserrat, sans-serif" fontWeight="600">Market avg</text>
                    </>}
                    {segments.map((s, i) => (<path key={i} d={`M${s.x1} ${s.y1} L${s.x2} ${s.y2} L${s.x2} ${pT + cH} L${s.x1} ${pT + cH} Z`} fill="url(#ag4)" />))}
                    {segments.map((s, i) => (<line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={GOLD} strokeWidth="2" strokeLinecap="round" opacity="0.9" />))}
                    {realPoints.map((d, i) => {
  const showLabel = chartPlatform === 'overall' && chartPeriod <= 30
  return (
    <g key={i}>
      <circle cx={dateToX(d.date)} cy={py(d.score)} r="3" fill={WHITE} stroke={GOLD} strokeWidth="1.5" />
      {showLabel && <text x={dateToX(d.date)} y={py(d.score) - 9} textAnchor="middle" fill={TEXT} fontSize="8" fontFamily="Montserrat, sans-serif" fontWeight="600">{d.score}%</text>}
    </g>
  )
})}
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
              <KPICard label="Profile Views" value={recentViews.length} sub={`page visits · last ${period} days`} color={GOLD} spark={viewsByDay} />
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
            <SourcePageChart hotelId={hotel?.id} period={period} />
          </div>
        )}

        {/* ── COMPETITORS ── */}
        {tab === 'competitors' && (
          <div>
            {competitorView === 'region' ? (
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard label="Your Rank" value={'#' + hotelRank} sub={`in ${hotelRegion}`} color={GOLD} />
                <KPICard label="Hotels Tracked" value={competitorTableHotels.length} sub="in this category" color={BLUE} />
                <KPICard label="Market Position" value={hotelRank === 1 ? 'Leader' : hotelRank <= 3 ? 'Top 3' : 'Growing'} sub="competitive status" color={PURPLE} />
                <KPICard label="Visibility Score" value={visibilityScore + '%'} sub="your AI score" color={GOLD} />
              </div>
            ) : (
              <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.75rem', marginBottom: '1.5rem' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: '0 0 1.25rem' }}>
                  {({ spa: 'Spa & Wellness', dining: 'Fine Dining', romantic: 'Romantic', lake: 'Lake Hotel', business: 'Business', ski: 'Ski Resort', family: 'Family' } as Record<string,string>)[competitorView] || competitorView} Summary
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  {(() => {
                    const catScore = hotelCatScores?.[competitorView] ?? null
                    const catHotels = competitorTableHotels
                    const myRankInCat = catHotels.findIndex((h: any) => h.is_current) + 1
                    const topCompetitor = catHotels.filter((h: any) => !h.is_current).sort((a: any, b: any) => (b.visibilityScore ?? 0) - (a.visibilityScore ?? 0))[0]
                    const status = catScore === null ? '—' : catScore >= 70 ? 'Strong' : catScore >= 40 ? 'Growing' : 'Needs work'
                    const statusColor = catScore === null ? TEXT_MUTED : catScore >= 70 ? GREEN : catScore >= 40 ? GOLD : RED
                    return [
                      { label: 'Your Score', value: catScore !== null ? catScore + '%' : '—', color: GOLD },
                      { label: 'Category Rank', value: myRankInCat > 0 ? `#${myRankInCat} in ${hotelRegion}` : '—', color: TEXT },
                      { label: 'Performance', value: status, color: statusColor },
                      { label: 'Top Competitor', value: topCompetitor ? topCompetitor.name.replace(' Geneva', '').replace(' Hotel', '') : '—', color: TEXT },
                      { label: 'Competitor Score', value: topCompetitor?.visibilityScore != null ? topCompetitor.visibilityScore + '%' : '—', color: TEXT_MUTED },
                      { label: 'Gap to Leader', value: (() => {
                        if (catScore === null || !topCompetitor?.visibilityScore) return '—'
                        const gap = catScore - topCompetitor.visibilityScore
                        if (gap > 0) return `+${gap}pts ahead`
                        if (gap < 0) return `${gap}pts behind`
                        return 'Tied'
                      })(), color: catScore !== null && topCompetitor?.visibilityScore != null && catScore >= topCompetitor.visibilityScore ? GREEN : RED },
                    ].map((item, i) => (
                      <div key={i} style={{ padding: '1rem 1.25rem', background: BG, borderRadius: 8 }}>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.4rem' }}>{item.label}</p>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: item.color, margin: 0, lineHeight: 1.2 }}>{item.value}</p>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {competitorTabs.map(t => (
                <button key={t.key} onClick={() => setCompetitorView(t.key)} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 600, padding: '0.5rem 1.125rem', borderRadius: 4, cursor: 'pointer', background: competitorView === t.key ? TEXT : WHITE, color: competitorView === t.key ? WHITE : TEXT_MUTED, border: '1px solid ' + (competitorView === t.key ? TEXT : BORDER), transition: 'all 0.15s' }}>{t.label}</button>
              ))}
            </div>

            {/* Competitor table */}
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid ' + BORDER }}>
                <div>
  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: '0 0 0.2rem' }}>{competitorTableLabel}</p>
  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: 0, fontStyle: 'italic' }}>
    {competitorView === 'region' && 'Tracks overall AI visibility across general luxury hotel searches in this region'}
    {competitorView === 'spa' && 'Tracks visibility for spa, wellness and thermal retreat searches in Switzerland'}
    {competitorView === 'dining' && 'Tracks visibility for fine dining, Michelin and gourmet restaurant searches'}
    {competitorView === 'romantic' && 'Tracks visibility for romantic getaway, honeymoon and couples hotel searches'}
    {competitorView === 'lake' && 'Tracks visibility for lakeside hotel and lake view accommodation searches'}
    {competitorView === 'business' && 'Tracks visibility for business travel, corporate stays and congress hotel searches'}
    {competitorView === 'ski' && 'Tracks visibility for ski hotel, ski resort and alpine winter sports searches'}
    {competitorView === 'family' && 'Tracks visibility for family hotel, kids friendly and family resort searches'}
  </p>
</div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: BG }}>
                    {['Rank', 'Hotel', 'AI Visibility', 'Change', 'Status'].map(h => (
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
                        {(() => {
                          const change = competitorView === 'region' ? (h.is_current ? myRankChange : h.rankChange) : null
                          if (change === null || change === undefined) return <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: TEXT_MUTED }}>—</span>
                          if (change > 0) return <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: GREEN }}>↑ {change}</span>
                          if (change < 0) return <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: RED }}>↓ {Math.abs(change)}</span>
                          return <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: TEXT_MUTED }}>—</span>
                        })()}
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

            

            {competitorView === 'region' && (
              <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.75rem', marginBottom: '1.5rem' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: '0 0 1.25rem' }}>AI Visibility Summary</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  {[
                    { label: 'Your Visibility', value: visibilityScore + '%', color: GOLD },
                    { label: 'Market Rank', value: `#${hotelRank} in ${hotelRegion}`, color: TEXT },
                    { label: 'Strongest Category', value: (() => {
                      const cats = Object.entries(hotelCatScores || {})
                      if (!cats.length) return '—'
                      const best = cats.sort((a, b) => (b[1] as number) - (a[1] as number))[0]
                      const labels: Record<string, string> = { spa: 'Spa & Wellness', dining: 'Fine Dining', romantic: 'Romantic', lake: 'Lake Hotel', business: 'Business', ski: 'Ski Resort' }
                      return labels[best[0]] || best[0]
                    })(), color: GREEN },
                    { label: 'Weakest Category', value: (() => {
                      const cats = Object.entries(hotelCatScores || {})
                      if (!cats.length) return '—'
                      const worst = cats.sort((a, b) => (a[1] as number) - (b[1] as number))[0]
                      const labels: Record<string, string> = { spa: 'Spa & Wellness', dining: 'Fine Dining', romantic: 'Romantic', lake: 'Lake Hotel', business: 'Business', ski: 'Ski Resort' }
                      return labels[worst[0]] || worst[0]
                    })(), color: RED },
                    { label: 'Main Competitor', value: (() => {
                      const top = allHotelsInRegion.filter((h: any) => !h.is_current).sort((a: any, b: any) => (b.visibilityScore ?? 0) - (a.visibilityScore ?? 0))[0]
                      return top ? top.name.replace(' Geneva', '').replace(' Hotel', '') : '—'
                    })(), color: TEXT },
                    { label: 'Overall Status', value: visibilityScore >= 70 ? 'Strong' : visibilityScore >= 50 ? 'Improving' : visibilityScore >= 30 ? 'Growing' : 'Early Stage', color: visibilityScore >= 70 ? GREEN : visibilityScore >= 50 ? GOLD : visibilityScore >= 30 ? '#d97706' : TEXT_MUTED },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '1rem 1.25rem', background: BG, borderRadius: 8 }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.4rem' }}>{item.label}</p>
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: item.color, margin: 0, lineHeight: 1.2 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SCHEMA ── */}
{tab === 'schema' && (
  <SchemaTab hotel={hotel} hotelId={hotel?.id} crawlerCount={crawlerCount} onGoToOptimise={(tab) => { setTab('optimise'); setOptimiseTab(tab || 'overview') }} />
)}

        {/* ── OPTIMISE ── */}
        {tab === 'optimise' && (
          <OptimiseTab hotelId={hotel?.id} hotelName={hotelName} hotelSlug={hotel?.slug} hotel={hotel} initialTab={optimiseTab} />
        )}

        {/* ── GOALS ── */}
        {tab === 'goals' && (
          <GoalsTab
            hotelName={hotelName}
            hotelRegion={hotelRegion}
            periodScore={periodScore}
            prevPeriodScore={prevPeriodScore}
            hotelCatScores={hotelCatScores}
            competitors={competitors}
            missedList={missedList}
            categoryLabels={categoryLabels}
            googleAiScores={googleAiScores}
          />
        )}

        {/* ── REPORTS ── */}
        {tab === 'reports' && (
          <ReportsTab
            hotelName={hotelName}
            hotelRegion={hotelRegion}
            overviewRunData={overviewRunData}
            googleAiScores={googleAiScores}
            views={views}
            clicks={clicks}
            hotelCatScores={hotelCatScores}
            competitors={competitors}
            categoryLabels={categoryLabels}
            visibilityScore={visibilityScore}
            hotelRank={hotelRank}
            regionCount={allHotelsInRegion.length}
          />
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
              { title: 'Subscription', desc: 'AI Visibility Growth Programme · CHF 699/month · No commission', badge: 'Active' },
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