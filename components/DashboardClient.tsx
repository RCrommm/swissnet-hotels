'use client'
import { useState, useEffect } from 'react'
import { buildRoadmap } from '@/lib/recommendation-roadmap'

const GOLD = '#C9A84C'
const GOLD_LIGHT = 'rgba(201,169,76,0.10)'
const BG = '#F8F5EF'
const WHITE = '#FFFFFF'
const TEXT = '#2A1A0E'
const TEXT_MUTED = 'rgba(42,26,14,0.75)'
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
    const limit = 12
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
  { key: 'overview', label: 'Overview', count: `${(faqs.overview || []).length}/12` },
  { key: 'events', label: 'Events & Offers', count: `${activeOffers.length}/3` },
  { key: 'rooms', label: 'Rooms', count: `${(faqs.rooms || []).length}/12` },
  { key: 'dining', label: 'Dining', count: `${(faqs.dining || []).length}/12` },
  { key: 'spa', label: 'Spa', count: `${(faqs.spa || []).length}/12` },
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
          {[{ key: 'content', label: 'Content' }, { key: 'faqs', label: `FAQs (${(faqs[faqPageKey] || []).length}/12)` }].map(s => (
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
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.92rem', fontWeight: 600, color: TEXT, margin: 0 }}>{offer.name}</p>
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
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: 0 }}>Changes go live immediately · Max 12 per page · Appear in FAQPage schema</p>
            </div>
            {(faqs[faqPageKey] || []).length < 12 && (
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
        const score = row.visibility_score
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

function SchemaTab({ hotel, hotelId, onGoToOptimise }: { hotel: any; hotelId: string; onGoToOptimise: (tab?: string) => void }) {
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

      

      {/* ── KNOWLEDGE LAYERS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
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

function GoalCard({ num, kicker, title, chips, actions, status }: any) {
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
        {status && (
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem', minWidth: 200, paddingTop: '0.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.2rem' }}>Now</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', fontWeight: 400, color: TEXT, margin: 0, lineHeight: 1 }}>{status.current}</p>
              </div>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', color: status.reached ? GREEN : GOLD }}>→</span>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.2rem' }}>Goal</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', fontWeight: 400, color: GOLD, margin: 0, lineHeight: 1 }}>{status.goal}</p>
              </div>
            </div>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, padding: '0.35rem 0.9rem', borderRadius: 20, color: status.reached ? GREEN : '#d97706', background: (status.reached ? GREEN : '#d97706') + '14', border: `1px solid ${(status.reached ? GREEN : '#d97706')}40` }}>{status.reached ? '✓ Goal reached' : '◘ In progress'}</span>
          </div>
        )}
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

  // Monthly-locked selection: pick a query that was MISSED as of the start of this month
  // (its last run before the current month, or its first-ever run if tracking began this month).
  // That anchor is immutable, so the chosen query stays fixed all month. We then check whether
  // the hotel appears NOW → goal achieved. Next calendar month, a fresh miss is selected.
  const g3Now = new Date()
  const g3MonthStart = `${g3Now.getFullYear()}-${String(g3Now.getMonth() + 1).padStart(2, '0')}-01`

  const runsByQuery: Record<string, any[]> = {}
  for (const r of (googleAiScores || [])) {
    if (!r.query) continue
    if (!runsByQuery[r.query]) runsByQuery[r.query] = []
    runsByQuery[r.query].push(r)
  }
  for (const q of Object.keys(runsByQuery)) {
    runsByQuery[q].sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime())
  }
  const baselineMissed = (q: string) => {
    const runs = runsByQuery[q] || []
    if (!runs.length) return false
    const before = runs.filter(r => (r.checked_at || '').split('T')[0] < g3MonthStart)
    const anchor = before.length ? before[before.length - 1] : runs[0]
    return anchor.appeared === false
  }
  const appearsNow = (q: string) => {
    const runs = runsByQuery[q] || []
    return runs.length ? runs[runs.length - 1].appeared === true : false
  }
  const baselineMissedQueries = Object.keys(runsByQuery)
    .filter(q => baselineMissed(q))
    .sort((a, b) => a.localeCompare(b))
  const distinctG3 = baselineMissedQueries.filter(q => !usedWords.some(w => q.toLowerCase().includes(w)))
  const missedQuery = (distinctG3[0] || baselineMissedQueries[0]) || null
  const g3Achieved = missedQuery ? appearsNow(missedQuery) : false
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
        ].filter(Boolean)}
        status={cur !== null && scoreTarget !== null ? { current: `${cur}%`, goal: `${scoreTarget}%`, reached: cur >= scoreTarget } : null}
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
            { text: `${weakCatRank.total} hotels tracked`, tone: 'muted' },
            weakCatRank.ahead ? { text: `Overtake ${weakCatRank.ahead.replace(' Geneva','').replace(' Hotel','')}`, tone: 'note' } : null,
          ].filter(Boolean)}
          status={targetRank ? { current: `#${weakCatRank.rank}`, goal: `#${targetRank}`, reached: weakCatRank.rank <= targetRank } : null}
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
          title={g3Achieved ? `Now appearing for "${missedQuery}"` : `Start appearing for "${missedQuery}"`}
          chips={[
            { text: 'Google AI search', tone: 'muted' },
          ]}
          status={{ current: g3Achieved ? 'Appearing' : 'Not yet', goal: 'Appear', reached: g3Achieved }}
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

// ── COMPARISON REPORT (Reports tab) ──────────────────────────────────────────

function ComparisonReport({ hotelId, hotelName, hotelRegion, overviewRunData, googleAiScores, views, clicks, categoryLabels }: any) {
  const [catHistory, setCatHistory] = useState<any[]>([])
  const [frozenVis, setFrozenVis] = useState<Record<string, any>>({})
  const [frozenCat, setFrozenCat] = useState<Record<string, number>>({})
  const [loaded, setLoaded] = useState(false)
  const [monthA, setMonthA] = useState('')
  const [monthB, setMonthB] = useState('')

  useEffect(() => {
    if (!hotelId) return
    const load = async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await sb.from('competitor_visibility')
        .select('category, visibility_score, platform, checked_at')
        .eq('competitor_name', hotelName)
        .not('category', 'is', null)
      setCatHistory(data || [])
      const { data: fv } = await sb.from('monthly_scores')
        .select('month, chatgpt_score, perplexity_score, google_ai_score, blended_score')
        .eq('hotel_id', hotelId)
      const fvMap: Record<string, any> = {}
      for (const row of (fv || [])) fvMap[row.month] = row
      setFrozenVis(fvMap)
      const { data: fc } = await sb.from('monthly_category_scores')
        .select('month, category, blended_score')
        .eq('hotel_id', hotelId)
      const fcMap: Record<string, number> = {}
      for (const row of (fc || [])) fcMap[`${row.month}:${row.category}`] = row.blended_score
      setFrozenCat(fcMap)
      setLoaded(true)
    }
    load()
  }, [hotelId, hotelName])

  const pad = (m: number) => String(m + 1).padStart(2, '0')
  const winOf = (key: string) => { const [y, m] = key.split('-').map(Number); return { start: `${y}-${pad(m)}-01`, end: m === 11 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01` } }

  // Overall + per-platform + appearances for a month key
  const visMetrics = (key: string) => {
    const { start, end } = winOf(key)
    const runs = (overviewRunData || []).filter((r: any) => { const d = r.run_date || r.checked_at?.split('T')[0]; return d >= start && d < end })
    const dates = [...new Set(runs.map((r: any) => r.run_date || r.checked_at?.split('T')[0]).filter(Boolean))] as string[]
    const platAvg = (plat: string) => {
      const vals = dates.map(d => {
        const e = runs.filter((s: any) => s.platform === plat && (s.run_date || s.checked_at?.split('T')[0]) === d).sort((a: any, b: any) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime())[0]
        if (!e) return null
        return e.visibility_score
      }).filter((s): s is number => s !== null)
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
    }
    const gByDate = (d: string) => { const g = (googleAiScores || []).filter((r: any) => r.checked_at?.split('T')[0] === d); return g.length ? Math.round((g.filter((r: any) => r.appeared).length / g.length) * 100) : null }
    const gDates = [...new Set((googleAiScores || []).map((r: any) => r.checked_at?.split('T')[0]).filter((d: string) => d >= start && d < end))] as string[]
    const gVals = gDates.map(gByDate).filter((s): s is number => s !== null)
    const google = gVals.length ? Math.round(gVals.reduce((a, b) => a + b, 0) / gVals.length) : null
    const chatgpt = platAvg('chatgpt'), perplexity = platAvg('perplexity')
    const allDates = [...new Set([...dates, ...gDates])]
    const overallVals = allDates.map(d => {
      const cp = ['chatgpt', 'perplexity'].map(p => {
        const e = runs.filter((s: any) => s.platform === p && (s.run_date || s.checked_at?.split('T')[0]) === d).sort((a: any, b: any) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime())[0]
        if (!e) return null
        return e.visibility_score
      }).filter((s): s is number => s !== null)
      const g = gByDate(d)
      const all = [...cp, ...(g !== null ? [g] : [])]
      return all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : null
    }).filter((s): s is number => s !== null)
    const overall = overallVals.length ? Math.round(overallVals.reduce((a, b) => a + b, 0) / overallVals.length) : null
    const appearances = runs.reduce((s: number, r: any) => s + (r.appearances || 0), 0) + (googleAiScores || []).filter((r: any) => { const d = r.checked_at?.split('T')[0]; return d >= start && d < end && r.appeared }).length
    const fz = frozenVis[start.slice(0, 7)]
    if (fz) {
      return {
        overall: fz.blended_score ?? overall,
        chatgpt: fz.chatgpt_score ?? chatgpt,
        perplexity: fz.perplexity_score ?? perplexity,
        google: fz.google_ai_score ?? google,
        appearances,
      }
    }
    return { overall, chatgpt, perplexity, google, appearances }
  }

  const engMetrics = (key: string) => {
    const { start, end } = winOf(key)
    const inWin = (ds: string) => { const d = ds?.split('T')[0]; return d >= start && d < end }
    const WEBSITE = ['hotel_profile', 'rooms_page', 'dining_page', 'spa_page', 'experiences_page', 'events_page', 'hotels_page_website']
    return {
      bookClicks: (clicks || []).filter((c: any) => c.utm_campaign === 'hotels_page_book' && inWin(c.clicked_at)).length,
      webClicks: (clicks || []).filter((c: any) => WEBSITE.includes(c.utm_campaign) && inWin(c.clicked_at)).length,
      views: (views || []).filter((v: any) => inWin(v.viewed_at)).length,
    }
  }

  const catScore = (key: string, category: string) => {
    const { start, end } = winOf(key)
    const fz = frozenCat[`${start.slice(0, 7)}:${category}`]
    if (fz !== undefined) return fz
    const rows = catHistory.filter((r: any) => r.category === category && r.checked_at?.split('T')[0] >= start && r.checked_at?.split('T')[0] < end)
    if (!rows.length) return null
    const adj = rows.map((r: any) => r.visibility_score)
    return Math.round(adj.reduce((a: number, b: number) => a + b, 0) / adj.length)
  }

  // Months that have ANY data
  const allDataDates = [
    ...(overviewRunData || []).map((r: any) => r.run_date || r.checked_at?.split('T')[0]),
    ...(googleAiScores || []).map((r: any) => r.checked_at?.split('T')[0]),
    ...(views || []).map((v: any) => v.viewed_at?.split('T')[0]),
    ...catHistory.map((r: any) => r.checked_at?.split('T')[0]),
  ].filter(Boolean).sort()
  const monthKeys: string[] = [...new Set(allDataDates.map((d: string) => { const dt = new Date(d); return `${dt.getFullYear()}-${dt.getMonth()}` }))].sort()
  const monthKeysDesc = [...monthKeys].reverse()
  const monthLabel = (key: string) => { const [y, m] = key.split('-').map(Number); return new Date(y, m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) }

  useEffect(() => {
    if (monthKeysDesc.length && !monthB) {
      setMonthB(monthKeysDesc[0])
      setMonthA(monthKeysDesc[1] || monthKeysDesc[0])
    }
  }, [loaded, monthKeys.join(',')])

  if (!loaded) return <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>Loading report…</p>
  if (monthKeys.length < 1) return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '3rem', textAlign: 'center' }}>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: TEXT_MUTED, margin: '0 0 0.4rem' }}>Not enough data yet</p>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED, margin: 0 }}>Month-by-month comparison appears once you have data across at least one full month.</p>
    </div>
  )

  const va = monthA ? visMetrics(monthA) : null
  const vb = monthB ? visMetrics(monthB) : null
  const ea = monthA ? engMetrics(monthA) : null
  const eb = monthB ? engMetrics(monthB) : null
  const cats = [...new Set(catHistory.map((r: any) => r.category))].sort()

  const Change = ({ a, b, suffix = '' }: { a: number | null; b: number | null; suffix?: string }) => {
    if (a === null || b === null) return <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: TEXT_MUTED }}>—</span>
    const d = b - a
    if (d === 0) return <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED, fontWeight: 600 }}>No change</span>
    const up = d > 0
    return <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', fontWeight: 700, color: up ? GREEN : RED, background: (up ? GREEN : RED) + '14', padding: '2px 9px', borderRadius: 20 }}>{up ? '↑' : '↓'} {Math.abs(d)}{suffix}</span>
  }
  const val = (v: number | null, suffix = '') => v === null ? <span style={{ color: TEXT_MUTED }}>—</span> : <>{v}{suffix}</>

  const Row = ({ label, a, b, suffix = '' }: { label: string; a: number | null; b: number | null; suffix?: string }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', alignItems: 'center', padding: '0.85rem 1.5rem', borderBottom: '1px solid ' + BORDER }}>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: TEXT, fontWeight: 500 }}>{label}</span>
      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: TEXT_MUTED, textAlign: 'center' }}>{val(a, suffix)}</span>
      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: TEXT, textAlign: 'center' }}>{val(b, suffix)}</span>
      <span style={{ textAlign: 'right' }}><Change a={a} b={b} suffix={suffix} /></span>
    </div>
  )

  const Section = ({ title, children }: { title: string; children: any }) => (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, overflow: 'hidden', marginBottom: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', padding: '0.9rem 1.5rem', borderBottom: '1px solid ' + BORDER, background: BG }}>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', color: TEXT }}>{title}</span>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, textAlign: 'center' }}>{monthA ? monthLabel(monthA) : ''}</span>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, textAlign: 'center' }}>{monthB ? monthLabel(monthB) : ''}</span>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, textAlign: 'right' }}>Change</span>
      </div>
      {children}
    </div>
  )

  const selStyle = { padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid ' + BORDER, background: WHITE, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', outline: 'none' } as any

  return (
    <div>
      {/* Hero + pickers */}
      <div style={{ background: `linear-gradient(135deg, #2A1A0E 0%, #3D2810 100%)`, borderRadius: 16, padding: '2.25rem 2.5rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -30, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,76,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.7)', margin: '0 0 0.9rem' }}>Performance Report</p>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: WHITE, margin: '0 0 1.5rem', lineHeight: 1.4, maxWidth: 520 }}>Compare any two months and see exactly what moved.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select value={monthA} onChange={e => setMonthA(e.target.value)} style={selStyle}>
              {monthKeysDesc.map(k => <option key={k} value={k}>{monthLabel(k)}</option>)}
            </select>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>compared to</span>
            <select value={monthB} onChange={e => setMonthB(e.target.value)} style={selStyle}>
              {monthKeysDesc.map(k => <option key={k} value={k}>{monthLabel(k)}</option>)}
            </select>
          </div>
        </div>
      </div>

      <Section title="Visibility">
        <Row label="Overall AI Visibility" a={va?.overall ?? null} b={vb?.overall ?? null} suffix="%" />
        <Row label="ChatGPT" a={va?.chatgpt ?? null} b={vb?.chatgpt ?? null} suffix="%" />
        <Row label="Perplexity" a={va?.perplexity ?? null} b={vb?.perplexity ?? null} suffix="%" />
        <Row label="Google AI" a={va?.google ?? null} b={vb?.google ?? null} suffix="%" />
        <Row label="AI Appearances" a={va?.appearances ?? null} b={vb?.appearances ?? null} />
      </Section>

      <Section title="Engagement">
        <Row label="Sent to Official Site" a={ea?.webClicks ?? null} b={eb?.webClicks ?? null} />
        <Row label="Profile Views" a={ea?.views ?? null} b={eb?.views ?? null} />
      </Section>

      {cats.length > 0 && (
        <Section title="Category Visibility">
          {cats.map((c: string) => (
            <Row key={c} label={categoryLabels?.[c] || c} a={monthA ? catScore(monthA, c) : null} b={monthB ? catScore(monthB, c) : null} suffix="%" />
          ))}
        </Section>
      )}

      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, lineHeight: 1.6, margin: '0.5rem 0.5rem 0' }}>A dash (—) means no data was recorded for that metric in that month. Scores are monthly averages across daily measurements.</p>
    </div>
  )
}

// ── YOUR WEBSITE TAB — UNIFIED AI VISIBILITY AUDIT ───────────────────────────
function WebsiteTab({ hotel }: any) {
  const officialUrl = hotel?.direct_booking_url || ''
  const domain = (() => { try { return officialUrl ? new URL(officialUrl).hostname.replace('www.', '') : '' } catch { return '' } })()

  const [r, setR] = useState<any>(null)
  const [savedAt, setSavedAt] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<string | null>(null)
  const [openLayer, setOpenLayer] = useState<number | null>(null)

  useEffect(() => {
    if (!hotel?.id) { setLoading(false); return }
    const load = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data: match } = await sb.from('hotel_audits')
          .select('result, created_at').eq('hotel_id', hotel.id)
          .order('created_at', { ascending: false }).limit(1).maybeSingle()
        if (match) { setR(match.result); setSavedAt(match.created_at) }
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [hotel?.id])

  const scoreColor = (v: number) => v >= 75 ? GREEN : v >= 50 ? '#d97706' : RED
  const statusColor = (s: string) => s === 'PASS' || s === 'YES' ? GREEN : s === 'PARTIAL' ? '#d97706' : RED
  const impactColor = (i: string) => i === 'Critical' || i === 'High' ? RED : i === 'Medium' ? '#d97706' : TEXT_MUTED
  const path = (u: string) => { try { return new URL(u).pathname || u } catch { return u } }

  const proj = r?.projects
  const pillars = r?.pillars
  const arch = pillars?.architecture
  const answer = pillars?.answerability
  const reco = pillars?.recommendation
  const trust = pillars?.trust
  const cq = r?.contentQuality
  const prompts = r?.recommendation?.results || []
  const overall = (() => {
    const rec = r?.recommendation?.score, cqs = cq?.score, ar = r?.architectureScore, qc = answer?.score
    const parts = [[rec, 0.40], [qc, 0.25], [cqs, 0.20], [ar, 0.15]].filter(([v]) => typeof v === 'number')
    if (!parts.length) return null
    const w = parts.reduce((s, [, x]) => s + x, 0)
    return Math.round(parts.reduce((s, [v, x]) => s + v * x, 0) / w)
  })()
  const orderedPrompts = ['NO', 'PARTIAL', 'YES'].flatMap(g => prompts.filter((p: any) => p.readiness === g))

  const Section = ({ id, title, subtitle, score, suffix = '%', children }: any) => {
    const isOpen = open === id
    return (
      <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, overflow: 'hidden', marginBottom: '0.85rem' }}>
        <div onClick={() => setOpen(isOpen ? null : id)} style={{ padding: '1.35rem 1.75rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', background: isOpen ? BG : WHITE }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: TEXT, margin: 0 }}>{title}</p>
            {subtitle && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: TEXT_MUTED, margin: '0.2rem 0 0', lineHeight: 1.4 }}>{subtitle}</p>}
          </div>
          {typeof score === 'number' && <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.85rem', color: scoreColor(score), flexShrink: 0 }}>{score}<span style={{ fontSize: '0.9rem', color: TEXT_MUTED }}>{suffix}</span></span>}
          <span style={{ color: TEXT_MUTED, fontSize: '1.1rem', flexShrink: 0, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
        </div>
        {isOpen && <div style={{ borderTop: '1px solid ' + BORDER }}>{children}</div>}
      </div>
    )
  }

  return (
    <div>
      {/* HERO */}
      <div style={{ background: `linear-gradient(135deg, #2A1A0E 0%, #3D2810 100%)`, borderRadius: 18, padding: '3rem 3.25rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,76,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.75)', margin: '0 0 0.75rem' }}>Your own website · AI visibility audit</p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.25rem', fontWeight: 300, color: WHITE, margin: '0 0 0.6rem', lineHeight: 1.2 }}>How {domain || 'your website'} reads to AI</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.65, maxWidth: 560 }}>We read your pages the way ChatGPT, Perplexity and Google AI do — then tell you exactly what to fix first.</p>
          </div>
          {typeof overall === 'number' && (
            <div style={{ flexShrink: 0, textAlign: 'center', border: '1px solid rgba(201,169,76,0.35)', borderRadius: 16, padding: '1.25rem 1.5rem', minWidth: 130 }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.8)', margin: '0 0 0.35rem' }}>Overall score</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', color: overall >= 75 ? '#86efac' : overall >= 50 ? '#fcd34d' : '#fca5a5', margin: 0, lineHeight: 1 }}>{overall}<span style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)' }}>/100</span></p>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: TEXT_MUTED, margin: 0 }}>Loading your latest audit…</p>
        </div>
      )}

      {!loading && !r && (
        <div style={{ background: WHITE, border: '1px dashed ' + BORDER, borderRadius: 14, padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: TEXT, margin: '0 0 0.5rem' }}>Your website audit is being prepared</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: TEXT_MUTED, margin: 0, lineHeight: 1.6, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>Your SwissNet specialist runs a full AI-readability audit of {domain || 'your official site'}. Your latest results will appear here.</p>
        </div>
      )}

      {!loading && r && (
        <>
          {/* HEADLINE SCORES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem', marginBottom: '1.75rem' }}>
            {[
              { label: 'Recommendation readiness', value: r.recommendation?.score, suffix: '/100', sub: `${r.recommendation?.yes || 0} yes · ${r.recommendation?.partial || 0} partial · ${r.recommendation?.no || 0} no` },
              { label: 'Content quality', value: cq?.score, suffix: '%', sub: 'how quotable your writing is' },
              { label: 'AI architecture', value: r.architectureScore, suffix: '/100', sub: '14 layers evaluated' },
              { label: 'Question coverage', value: answer?.score, suffix: '%', sub: `${(answer?.yes || 0) + (answer?.partial || 0)}/${answer?.total || 30} answered` },
            ].map((t, i) => (
              <div key={i} style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '1.35rem 1.5rem' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.6rem' }}>{t.label}</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.3rem', color: scoreColor(t.value ?? 0), margin: 0, lineHeight: 1 }}>{typeof t.value === 'number' ? t.value : '—'}<span style={{ fontSize: '0.95rem', color: TEXT_MUTED }}>{typeof t.value === 'number' ? t.suffix : ''}</span></p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: TEXT_MUTED, margin: '0.45rem 0 0' }}>{t.sub}</p>
              </div>
            ))}
          </div>
          {savedAt && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: TEXT_MUTED, margin: '0 0 1.5rem' }}>Last audit: {new Date(savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {(r.pagesScraped || []).length} pages reviewed</p>}

          {/* WHAT TO DO FIRST (always open) */}
          {proj?.projects?.length > 0 && (
            <div style={{ marginBottom: '1.75rem' }}>
              {proj.overview && (
                <div style={{ background: WHITE, border: '1px solid ' + GOLD, borderLeft: '3px solid ' + GOLD, borderRadius: 12, padding: '1.5rem 1.75rem', marginBottom: '1.1rem' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.6rem' }}>Start here</p>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.45rem', color: TEXT, margin: 0, lineHeight: 1.5 }}>{proj.overview}</p>
                </div>
              )}
              {proj.projects.map((p: any, i: number) => {
                const isQuick = p.effort === 'Quick win'
                const ec = isQuick ? GREEN : GOLD
                const ic = impactColor(p.impact)
                return (
                  <div key={i} style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, overflow: 'hidden', marginBottom: '0.85rem' }}>
                    <div style={{ padding: '1.1rem 1.75rem', borderBottom: '1px solid ' + BORDER, background: BG, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.45rem', color: TEXT }}>{i + 1}. {p.title}</span>
                      <span style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.05em', color: ec, border: '1px solid ' + ec, borderRadius: 4, padding: '0.18rem 0.6rem', textTransform: 'uppercase' }}>{p.effort}</span>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.05em', color: ic, border: '1px solid ' + ic, borderRadius: 4, padding: '0.18rem 0.6rem', textTransform: 'uppercase' }}>{p.impact} impact</span>
                      </span>
                    </div>
                    <div style={{ padding: '1.1rem 1.75rem 1.3rem' }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.92rem', color: TEXT, margin: '0 0 0.7rem', lineHeight: 1.65 }}>{p.why}</p>
                      {p.steps?.length > 0 && p.steps.map((s: string, j: number) => (
                        <p key={j} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.86rem', color: TEXT, margin: '0.3rem 0', lineHeight: 1.55, display: 'flex', gap: '0.5rem' }}><span style={{ color: ec }}>›</span><span>{s}</span></p>
                      ))}
                      {p.unlocks?.length > 0 && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: '#d97706', margin: '0.6rem 0 0', lineHeight: 1.55 }}><strong>Unlocks:</strong> {p.unlocks.join('; ')}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.9rem' }}>The detail · tap any section</p>

          {/* CONTENT QUALITY */}
          {cq?.categories?.length > 0 && (
            <Section id="content" title="Content quality" subtitle="How quotable your writing is — every score cites a real line" score={cq.score}>
              <div style={{ padding: '1rem 1.75rem 1.25rem' }}>
                {cq.categories.map((c: any, i: number) => (
                  <div key={i} style={{ padding: '0.9rem 0', borderBottom: i < cq.categories.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.92rem', fontWeight: 600, color: TEXT }}>{c.label}</span>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.88rem', fontWeight: 700, color: scoreColor(c.score) }}>{c.score}%</span>
                    </div>
                    <div style={{ height: 6, background: BG, borderRadius: 3, overflow: 'hidden', marginBottom: '0.5rem' }}><div style={{ width: c.score + '%', height: '100%', background: scoreColor(c.score) }} /></div>
                    {c.comment && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', color: TEXT, margin: '0 0 0.3rem', lineHeight: 1.55 }}>{c.comment}</p>}
                    {c.evidence && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: TEXT_MUTED, margin: 0, fontStyle: 'italic', lineHeight: 1.45 }}>“{c.evidence}”</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* PROMPT COVERAGE */}
          {orderedPrompts.length > 0 && (
            <Section id="prompts" title="Prompt coverage" subtitle={`Every guest search, and why AI answered that way · ${answer ? `${(answer.yes || 0) + (answer.partial || 0)}/${answer.total}` : ''} answered`} score={answer?.score ?? r.recommendation?.score}>
              <div style={{ padding: '0.6rem 1.75rem 1.5rem' }}>
                {orderedPrompts.map((c: any, i: number) => (
                  <div key={i} style={{ padding: '1rem 0', borderBottom: i < orderedPrompts.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.92rem', color: TEXT, fontWeight: 600, flex: 1 }}>{c.question}</span>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 700, color: statusColor(c.readiness), border: '1px solid ' + statusColor(c.readiness), borderRadius: 4, padding: '0.18rem 0.6rem', flexShrink: 0 }}>{c.readiness}</span>
                    </div>
                    {c.evidence && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: TEXT_MUTED, margin: '0.4rem 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>“{c.evidence}”{c.url && <span style={{ fontStyle: 'normal' }}> — {path(c.url)}</span>}</p>}
                    {c.reasons?.length > 0 && c.readiness !== 'YES' && (
                      <div style={{ margin: '0.45rem 0 0' }}>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', fontWeight: 700, color: TEXT, margin: '0 0 0.2rem' }}>{c.readiness === 'NO' ? 'AI could not recommend because:' : 'Holding it back from a strong yes:'}</p>
                        {c.reasons.map((rs: string, j: number) => <p key={j} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: '#d97706', margin: '0.15rem 0 0' }}>{j + 1}. {rs}</p>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* RECOMMENDATION COVERAGE */}
          {reco?.intents?.length > 0 && (
            <Section id="reco" title="Recommendation coverage" subtitle="Which guest types AI can confidently recommend you for">
              <div>
                {reco.intents.map((it: any, i: number) => (
                  <div key={i} style={{ padding: '1.25rem 1.75rem', borderBottom: i < reco.intents.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.92rem', fontWeight: 600, color: TEXT }}>{it.label}</span>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.88rem', fontWeight: 700, color: scoreColor(it.coverage) }}>{it.coverage}%</span>
                    </div>
                    {it.definition && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: TEXT_MUTED, margin: '0 0 0.3rem', lineHeight: 1.55 }}>{it.definition} <span style={{ fontStyle: 'italic' }}>{it.why}</span></p>}
                    {it.evidence?.length > 0 && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: GREEN, margin: '0.25rem 0 0', lineHeight: 1.55 }}>Evidence: “{it.evidence.join('” · “')}”</p>}
                    {it.missing?.length > 0 && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: '#d97706', margin: '0.25rem 0 0', lineHeight: 1.55 }}>Missing: {it.missing.join('; ')}</p>}
                    {it.fix && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: TEXT, margin: '0.25rem 0 0', lineHeight: 1.55 }}><strong>Fix:</strong> {it.fix}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* TECHNICAL ARCHITECTURE */}
          {arch?.layers?.length > 0 && (
            <Section id="arch" title="Technical AI-readiness" subtitle="14 architecture layers · tap a layer for what, why and how to fix" score={arch.score} suffix="/100">
              <div>
                {arch.layers.map((l: any, i: number) => {
                  const lOpen = openLayer === l.n
                  return (
                    <div key={i} style={{ borderBottom: i < arch.layers.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                      <div onClick={() => setOpenLayer(lOpen ? null : l.n)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.75rem', cursor: 'pointer' }}>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', fontWeight: 700, color: TEXT_MUTED, width: 22 }}>{l.n}</span>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', fontWeight: 600, color: TEXT, flex: 1 }}>{l.layer}{typeof l.score === 'number' ? <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>  {l.score}%</span> : null}</span>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 700, color: statusColor(l.status), border: '1px solid ' + statusColor(l.status), borderRadius: 4, padding: '0.18rem 0.6rem' }}>{l.status}</span>
                        <span style={{ color: TEXT_MUTED, fontSize: '0.95rem', transform: lOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
                      </div>
                      {lOpen && (
                        <div style={{ padding: '0 1.75rem 1.3rem 3.5rem', background: BG }}>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0.9rem 0 0.2rem' }}>What it is</p>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', color: TEXT, margin: '0 0 0.6rem', lineHeight: 1.6 }}>{l.definition}</p>
                          {l.scoreReason && (<>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: statusColor(l.status), margin: '0 0 0.2rem' }}>Why this score</p>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', color: TEXT, margin: '0 0 0.6rem', lineHeight: 1.6 }}>{l.scoreReason}</p>
                          </>)}
                          {l.missing?.length > 0 && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: '#d97706', margin: '0 0 0.3rem', lineHeight: 1.55 }}><strong>Missing:</strong> {l.missing.join(', ')}</p>}
                          {l.fix && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', color: TEXT, margin: '0.4rem 0 0', lineHeight: 1.6 }}><strong>How to improve:</strong> {l.fix}</p>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {/* TRUST */}
          {trust && (
            <Section id="trust" title="Trust & authority" subtitle="Reviews, awards and ratings AI can read">
              <div style={{ padding: '1.25rem 1.75rem' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', color: TEXT_MUTED, margin: '0 0 0.9rem', lineHeight: 1.6 }}>{trust.why}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: trust.missing?.length ? '0.9rem' : 0 }}>
                  {[{ k: 'Review schema', v: trust.reviewSchema }, { k: 'Awards', v: trust.awards }, { k: 'Ratings', v: trust.ratings }].map((t, i) => (
                    <span key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 600, color: t.v ? GREEN : RED, background: (t.v ? GREEN : RED) + '12', border: '1px solid ' + (t.v ? GREEN : RED) + '30', borderRadius: 16, padding: '0.35rem 0.85rem' }}>{t.v ? '✓' : '✗'} {t.k}</span>
                  ))}
                </div>
                {trust.missing?.length > 0 && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: '#d97706', margin: 0, lineHeight: 1.55 }}><strong>To add:</strong> {trust.missing.join(', ')}</p>}
              </div>
            </Section>
          )}

          {/* PAGES REVIEWED */}
          {(r.pagesScraped || []).length > 0 && (
            <Section id="pages" title="Pages reviewed" subtitle={`${r.pagesScraped.length} pages crawled for this audit`}>
              <div style={{ padding: '1.25rem 1.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {r.pagesScraped.map((u: string, i: number) => <span key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', fontWeight: 600, color: TEXT, background: BG, border: '1px solid ' + BORDER, borderRadius: 20, padding: '0.4rem 0.9rem' }}>{path(u)}</span>)}
              </div>
            </Section>
          )}

          <div style={{ background: GOLD_LIGHT, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${GOLD}`, borderRadius: 10, padding: '1.5rem 1.75rem', marginTop: '0.5rem' }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: TEXT, margin: 0, lineHeight: 1.7 }}><strong>Want us to implement these?</strong> Your SwissNet specialist can work through this plan with you. Reach us at <a href="mailto:contact@swissnethotels.com" style={{ color: GOLD, textDecoration: 'none', fontWeight: 600 }}>contact@swissnethotels.com</a>.</p>
          </div>
        </>
      )}
    </div>
  )
}

// ── CITATION SOURCES TAB ──────────────────────────────────────────────────────

function CitationSourcesTab({ hotelName, hotelRegion, hotelId }: { hotelName: string; hotelRegion: string; hotelId: string }) {
  const [rows, setRows] = useState<any[]>([])
  const [mentions, setMentions] = useState<Record<string, boolean | null>>({})
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const ownDomain = 'swissnethotels.com'

  useEffect(() => {
    const load = async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const sinceDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const { data: cites } = await sb
        .from('ai_citations')
        .select('query, source_url, source_domain, run_date')
        .eq('region', hotelRegion)
        .gte('run_date', sinceDate)
        .order('run_date', { ascending: false })
        .limit(5000)
      setRows(cites || [])

      const urls = [...new Set((cites || []).map((c: any) => c.source_url))]
      try {
        if (urls.length) {
          const { data: pm } = await sb
            .from('page_mentions')
            .select('source_url, mentioned')
            .eq('hotel_id', hotelId)
            .in('source_url', urls.slice(0, 100))
          const map: Record<string, boolean | null> = {}
          for (const m of pm || []) map[m.source_url] = m.mentioned
          setMentions(map)
        }
      } catch (e) {
        console.error('page_mentions lookup failed (non-fatal):', e)
      }
      setLoaded(true)
    }
    load()
  }, [hotelRegion])

  const sourceType = (domain: string): { label: string; color: string } => {
    const d = domain.toLowerCase()
    const map: { match: string[]; label: string; color: string }[] = [
      { match: ['booking.com','expedia','hotels.com','agoda','trivago','kayak','tripadvisor','hrs.','lastminute'], label: 'OTA', color: '#dc2626' },
      { match: ['forbestravelguide','guide.michelin','relaischateaux','slh.com','tablethotels','leadinghotels','virtuoso','fivestaralliance'], label: 'Guide', color: '#8B5CF6' },
      { match: ['facebook','instagram','x.com','twitter','tiktok','linkedin','youtube','pinterest'], label: 'Social', color: '#3b82f6' },
      { match: ['americanexpress','marriott','hyatt','fourseasons','accor','hilton'], label: 'Brand / loyalty', color: '#0891b2' },
      { match: ['blog','medium.com','substack','wordpress','condenast','cntraveler','cntraveller','travelandleisure','vogue'], label: 'Editorial / blog', color: '#d97706' },
    ]
    for (const m of map) if (m.match.some(s => d.includes(s))) return { label: m.label, color: m.color }
    if (d === ownDomain) return { label: 'Your site', color: GOLD }
    return { label: 'Other', color: TEXT_MUTED }
  }

  // Total distinct queries in the period = coverage denominator
  const allQueries = new Set(rows.map((r: any) => r.query).filter(Boolean))
  const totalQueries = allQueries.size || 1

  // Aggregate by domain → citation count + distinct queries + mention status
  const byDomain: Record<string, { count: number; queries: Set<string>; urls: Set<string>; mentioned: boolean | null }> = {}
  for (const r of rows) {
    const d = r.source_domain || ''
    if (!d) continue
    if (!byDomain[d]) byDomain[d] = { count: 0, queries: new Set(), urls: new Set(), mentioned: null }
    byDomain[d].count++
    if (r.query) byDomain[d].queries.add(r.query)
    byDomain[d].urls.add(r.source_url)
    const m = mentions[r.source_url]
    if (m === true) byDomain[d].mentioned = true
    else if (m === false && byDomain[d].mentioned !== true) byDomain[d].mentioned = false
  }

  const ranked = Object.entries(byDomain)
    .map(([domain, v]) => ({ domain, count: v.count, coverage: Math.round((v.queries.size / totalQueries) * 100), mentioned: v.mentioned }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  const top10CiteTotal = ranked.reduce((s, r) => s + r.count, 0) || 1

  // Page-level aggregation → every distinct cited URL, ranked by all-time usage
  const byUrl: Record<string, { count: number; queries: Set<string>; domain: string; mentioned: boolean | null }> = {}
  for (const r of rows) {
    const u = r.source_url || ''
    if (!u) continue
    if (!byUrl[u]) byUrl[u] = { count: 0, queries: new Set(), domain: r.source_domain || '', mentioned: mentions[u] ?? null }
    byUrl[u].count++
    if (r.query) byUrl[u].queries.add(r.query)
  }
  const rankedUrls = Object.entries(byUrl)
    .map(([url, v]) => ({ url, domain: v.domain, count: v.count, coverage: Math.round((v.queries.size / totalQueries) * 100), mentioned: v.mentioned }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 100)
  const urlsCiteTotal = rankedUrls.reduce((s, r) => s + r.count, 0) || 1

  const totalSources = Object.keys(byUrl).length
  const totalUrls = rankedUrls.length || 1
  const mentionYes = Math.round((rankedUrls.filter(r => r.mentioned === true).length / totalUrls) * 100) + '%'
  const mentionNo = Math.round((rankedUrls.filter(r => r.mentioned === false).length / totalUrls) * 100) + '%'

  if (!loaded) return <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>Loading citation sources…</p>

  if (rows.length === 0) return (
    <div style={{ background: WHITE, border: '1px dashed ' + BORDER, borderRadius: 14, padding: '3rem', textAlign: 'center' }}>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: TEXT, margin: '0 0 0.4rem' }}>No citation data yet</p>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED, margin: 0, lineHeight: 1.6, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
        As the daily visibility run records which pages ChatGPT and Perplexity cite for {hotelRegion} hotel searches, the most-cited sources will appear here — and whether {hotelName} is mentioned on each.
      </p>
    </div>
  )

  const StatusPill = ({ m }: { m: boolean | null }) => {
    if (m === true) return <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, color: GREEN, background: GREEN + '14', padding: '3px 10px', borderRadius: 20 }}>Mentions you</span>
    if (m === false) return <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, color: RED, background: RED + '12', padding: '3px 10px', borderRadius: 20 }}>Missing you</span>
    return <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, color: TEXT_MUTED, background: BG, border: '1px solid ' + BORDER, padding: '3px 10px', borderRadius: 20 }}>Not checked</span>
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, #2A1A0E 0%, #3D2810 100%)`, borderRadius: 16, padding: '2.5rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,76,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.7)', margin: '0 0 0.6rem' }}>Citation Sources · Last 90 Days</p>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', fontWeight: 300, color: WHITE, margin: '0 0 0.6rem', lineHeight: 1.3, maxWidth: 560 }}>Where AI gets its answers for {hotelRegion}</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.7, maxWidth: 560 }}>The publisher pages cited in ChatGPT and Perplexity answers for {hotelRegion} hotel searches. The ones that don't mention {hotelName} are your outreach targets — get placed there to improve your odds of being cited.</p>
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <KPICard label="Sources Cited" value={totalSources} sub="distinct pages · all time" color={GOLD} />
        <KPICard label="Already Mention You" value={mentionYes} sub="sources mentioning you" color={GREEN} />
        <KPICard label="Cited but Missing You" value={mentionNo} sub="outreach targets" color={RED} />
      </div>

      {/* ── AI OUTREACH PRIORITIES ── */}
      {/* Pure re-presentation of byDomain. Missing-you sources only — pages AI already
          trusts that don't yet mention this hotel. Ranked by real signals (citation
          count, query coverage, source type). No invented numbers. The "Incorrect
          information" category is architected here but stays empty until AI Knowledge
          Integrity exists. */}
      {(() => {
        const TYPE_WEIGHT: Record<string, number> = { Guide: 1.3, 'Editorial / blog': 1.2, OTA: 1.15, 'Brand / loyalty': 1.1, Other: 1.0, Social: 0.9 }
        const APPROACH: Record<string, string> = {
          OTA: 'Update your listing or distribution so this page carries your hotel',
          Guide: 'Pitch editorial inclusion — usually a longer submission process',
          'Editorial / blog': 'Contact the author or editor to request inclusion',
          Social: 'Engage with or claim your presence on this platform',
          'Brand / loyalty': 'Request your hotel be added to this partner listing',
          Other: 'Request a listing or mention on this page',
        }
        const targets = Object.entries(byDomain)
          .filter(([domain, v]) => v.mentioned === false && domain !== ownDomain)
          .map(([domain, v]) => {
            const t = sourceType(domain)
            const queries = v.queries.size
            const coverage = Math.round((queries / totalQueries) * 100)
            const score = v.count * (TYPE_WEIGHT[t.label] ?? 1) * (1 + queries / totalQueries)
            return { domain, count: v.count, queries, coverage, type: t, score, approach: APPROACH[t.label] || APPROACH.Other }
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)

        // Deferred — filled later by AI Knowledge Integrity. Empty today, renders nothing.
        const incorrectFindings: any[] = []

        if (targets.length === 0 && incorrectFindings.length === 0) return null
        const topScore = targets[0]?.score || 1
        const tierOf = (s: number) => s >= topScore * 0.6 ? { txt: 'High', icon: '🔥', col: RED } : { txt: 'Medium', icon: '⭐', col: GOLD }

        return (
          <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid ' + BORDER, background: BG }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: TEXT, margin: '0 0 0.2rem' }}>AI Outreach Priorities</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED, margin: 0, lineHeight: 1.5 }}>Where to spend your outreach time first — high-authority pages AI cites for {hotelRegion} that don&rsquo;t yet mention {hotelName}.</p>
            </div>
            {targets.length > 0 ? (
              <div>
                {targets.map((t, i) => {
                  const tier = tierOf(t.score)
                  return (
                    <div key={t.domain} style={{ padding: '1.1rem 1.5rem', borderBottom: i < targets.length - 1 ? '1px solid ' + BORDER : 'none', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, color: tier.col, background: tier.col + '12', border: '1px solid ' + tier.col + '30', padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0, marginTop: '0.1rem' }}>{tier.icon} {tier.txt}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', fontWeight: 700, color: TEXT }}>{t.domain}</span>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 600, color: t.type.color, background: t.type.color + '14', padding: '2px 9px', borderRadius: 20 }}>{t.type.label}</span>
                        </div>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.66rem', color: TEXT_MUTED, margin: '0 0 0.4rem', lineHeight: 1.5 }}>Cited {t.count}× across {t.queries} of your tracked {hotelRegion} {t.queries === 1 ? 'search' : 'searches'} — but doesn&rsquo;t mention you.</p>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: TEXT, margin: 0, lineHeight: 1.5 }}><span style={{ fontWeight: 700, color: GOLD }}>Recommended:</span> {t.approach}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ padding: '1.75rem 1.5rem', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: TEXT_MUTED, margin: 0, lineHeight: 1.6 }}>No outreach targets yet — every checked source that AI cites already mentions {hotelName}, or pages haven&rsquo;t been scanned for your name yet.</p>
              </div>
            )}
          </div>
        )
      })()}

      {/* Source list */}
      <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid ' + BORDER, background: BG }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', color: TEXT, margin: '0 0 0.2rem' }}>Most-cited sources</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: 0 }}>Share of all citations · top 10 domains</p>
        </div>
        <div>
          {ranked.map((r, i) => {
            const isOwn = r.domain === ownDomain
            return (
              <div key={r.domain} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.85rem 1.5rem', borderBottom: i < ranked.length - 1 ? '1px solid ' + BORDER : 'none', background: isOwn ? GOLD_LIGHT : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, color: TEXT_MUTED, width: 20, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: isOwn ? 700 : 500, color: isOwn ? GOLD : TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.domain}</span>
                  {isOwn && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', fontWeight: 700, color: GOLD, background: WHITE, border: '1px solid rgba(201,169,76,0.3)', padding: '2px 7px', borderRadius: 10, flexShrink: 0 }}>YOUR PAGE</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED }}>cited {r.count}×</span>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 600, color: GOLD, minWidth: 52, textAlign: 'right' }}>{Math.round((r.count / top10CiteTotal) * 100)}%</span>
                  {(() => { const t = sourceType(r.domain); return <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, color: t.color, background: t.color + '14', padding: '3px 10px', borderRadius: 20, minWidth: 80, textAlign: 'center' }}>{t.label}</span> })()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* All cited pages — actual URLs */}
      <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid ' + BORDER, background: BG, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', color: TEXT, margin: '0 0 0.15rem' }}>Every cited page</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: 0 }}>The exact pages ChatGPT and Perplexity cited across your queries — click to open</p>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pages…" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT, border: '1px solid ' + BORDER, borderRadius: 6, padding: '0.45rem 0.75rem', background: WHITE, outline: 'none', minWidth: 180 }} />
        </div>
        <div>
          {rankedUrls.filter(r => !search || r.url.toLowerCase().includes(search.toLowerCase())).map((r, i) => {
            const short = (() => { try { const u = new URL(r.url); const base = u.hostname.replace(/^www\./, ''); return u.pathname && u.pathname !== '/' ? base + u.pathname : base } catch { return r.url } })()
            return (
              <div key={r.url} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.8rem 1.5rem', borderBottom: i < rankedUrls.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, color: TEXT_MUTED, width: 18, flexShrink: 0 }}>{i + 1}</span>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', color: TEXT, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{short}</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED }}>cited {r.count}×</span>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 600, color: GOLD, minWidth: 52, textAlign: 'right' }}>{Math.round((r.count / urlsCiteTotal) * 100)}%</span>
                  <StatusPill m={r.mentioned} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ background: GOLD_LIGHT, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${GOLD}`, borderRadius: 10, padding: '1.25rem 1.5rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: TEXT, margin: 0, lineHeight: 1.7 }}>
          <strong>How to use this:</strong>the "Missing you" sources are pages AI already trusts for {hotelRegion}. Getting {hotelName} added to the highest-cited ones is the fastest way to start appearing in more AI answers. "Not checked" means the page hasn't been scanned for your name yet.
        </p>
      </div>
    </div>
  )
}

function QueryAppearanceBreakdown({ hotelId, hotelName, googleAiScores, onAddFaq }: { hotelId: string; hotelName: string; googleAiScores: any[]; onAddFaq: () => void }) {
  const [platform, setPlatform] = useState<'chatgpt' | 'perplexity' | 'google_ai'>('chatgpt')
  const [rows, setRows] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!hotelId) return
    const load = async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await sb
        .from('query_appearances')
        .select('query, platform, appeared, checked_at')
        .eq('hotel_id', hotelId)
        .eq('category', 'general')
        .order('checked_at', { ascending: false })
      setRows(data || [])
      setLoaded(true)
    }
    load()
  }, [hotelId])

  const latestForPlatform = (plat: string, source: any[]) =>
    [...new Map(
      [...source]
        .filter((r: any) => plat === 'google_ai' ? true : r.platform === plat)
        .sort((a: any, b: any) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime())
        .map((r: any) => [r.query, r])
    ).values()]

  const source = platform === 'google_ai' ? (googleAiScores || []) : rows
  const latest = latestForPlatform(platform, source)
  const appeared = latest.filter((r: any) => r.appeared)
  const missed = latest.filter((r: any) => !r.appeared)

  const platforms = [
    { key: 'chatgpt', label: 'ChatGPT' },
    { key: 'perplexity', label: 'Perplexity' },
    { key: 'google_ai', label: 'Google AI' },
  ]

  const List = ({ items, type }: { items: any[]; type: 'appeared' | 'missed' }) => (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '1.5rem' }}>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: '0 0 0.25rem' }}>{type === 'appeared' ? 'Where You Appear' : 'Queries to Improve'}</p>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: '0 0 1rem' }}>{type === 'appeared' ? `Searches where ${hotelName} was recommended` : 'Searches where your hotel did not appear'}</p>
      {items.length === 0 ? (
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>{type === 'appeared' ? 'No appearances recorded yet for this platform.' : 'No missed queries — excellent coverage.'}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 210, overflowY: 'auto' }}>
          {items.map((row: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid ' + BORDER }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: type === 'appeared' ? GREEN : RED, flexShrink: 0 }} />
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT, margin: 0, flex: 1 }}>{row.query}</p>
              {type === 'missed' && <button onClick={onAddFaq} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, color: GOLD, background: GOLD_LIGHT, border: '1px solid ' + BORDER, borderRadius: 4, padding: '0.2rem 0.6rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>Add FAQ →</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: 0 }}>Query appearance by platform</p>
        <select value={platform} onChange={e => setPlatform(e.target.value as any)} style={{ padding: '0.4rem 0.75rem', borderRadius: 4, border: '1px solid ' + BORDER, background: WHITE, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
          {platforms.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </div>
      {platform !== 'google_ai' && !loaded ? (
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>Loading…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <List items={appeared} type="appeared" />
          <List items={missed} type="missed" />
        </div>
      )}
    </div>
  )
}

// ── AI VISIBILITY MODEL — "Current AI Identity", how AI sees the hotel across dimensions ──
function VisibilityModelPanel({ model }: any) {
  const [open, setOpen] = useState<string | null>(null)
  if (!model?.dimensions?.length) return null

  const bandColor = (band: string) => band === 'strong' ? GREEN : band === 'moderate' ? GOLD : band === 'weak' ? '#d97706' : 'rgba(42,26,14,0.3)'
  const dims = [...model.dimensions].sort((a: any, b: any) => b.score - a.score)

  return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 16, overflow: 'hidden', marginBottom: '1.5rem' }}>
      <div style={{ padding: '1.5rem 1.85rem 1.25rem', borderBottom: '1px solid ' + BORDER, background: `linear-gradient(135deg, #2A1A0E 0%, #3D2810 100%)` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.8)', margin: '0 0 0.35rem' }}>Current AI Identity</p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: WHITE, margin: 0, lineHeight: 1.25 }}>How AI assistants currently see you</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.4rem', fontWeight: 300, color: GOLD, margin: 0, lineHeight: 1 }}>{model.overall}<span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>/100</span></p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', margin: '0.2rem 0 0' }}>Overall AI visibility</p>
          </div>
        </div>
      </div>
      <div style={{ padding: '1.5rem 1.85rem' }}>
        {dims.map((d: any) => {
          const pct = Math.max(2, d.score)
          const col = bandColor(d.band)
          const isOpen = open === d.dimension
          return (
            <div key={d.dimension} style={{ marginBottom: '0.95rem' }}>
              <div onClick={() => setOpen(isOpen ? null : d.dimension)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', fontWeight: 600, color: TEXT, width: 145, flexShrink: 0 }}>{d.label}</span>
                <div style={{ flex: 1, height: 9, background: 'rgba(42,26,14,0.06)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: 5, transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', fontWeight: 700, color: col, width: 30, textAlign: 'right', flexShrink: 0 }}>{d.score}</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: col, width: 60, textAlign: 'right', flexShrink: 0 }}>{d.band}</span>
              </div>
              {isOpen && d.evidence?.length > 0 && (
                <div style={{ marginTop: '0.5rem', marginLeft: 160, background: BG, borderRadius: 8, padding: '0.7rem 1rem', borderLeft: '3px solid ' + col }}>
                  {d.evidence.map((e: string, i: number) => (
                    <p key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', color: TEXT_MUTED, margin: '0.2rem 0', lineHeight: 1.5 }}>{e}</p>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.66rem', color: TEXT_MUTED, margin: '0.85rem 0 0', fontStyle: 'italic', lineHeight: 1.5 }}>Each score is computed from your confirmed facts, your pages, and which guest questions AI can answer — tap any dimension to see the evidence behind its score.</p>
      </div>
    </div>
  )
}

// ── HISTORY PANEL — "since last audit" diff, reads the audit's memory object ──
function HistoryPanel({ hotel }: any) {
  const [memory, setMemory] = useState<any>(null)
  const [prevDate, setPrevDate] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hotel?.id) { setLoading(false); return }
    const load = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data: rows } = await sb.from('hotel_audits')
          .select('result, created_at').eq('hotel_id', hotel.id)
          .order('created_at', { ascending: false }).limit(2)
        if (rows && rows.length) {
          setMemory(rows[0].result?.memory || null)
          if (rows[1]) setPrevDate(rows[1].created_at)
        }
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [hotel?.id])

  if (loading || !memory) return null

  const humanizeKey = (k: string) => {
    const parts = (k || '').split(':')
    if (parts[0] === 'page') return parts[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' page'
    if (parts[0] === 'query') return parts.slice(2).join(' ').replace(/-/g, ' ').replace(/^./, c => c.toUpperCase())
    return (k || '').replace(/[:-]/g, ' ')
  }

  if (memory.isFirstRun) {
    return (
      <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '1.5rem 1.75rem', marginBottom: '1.5rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.4rem' }}>Tracking started</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: TEXT, margin: 0, lineHeight: 1.6 }}>This audit recorded a baseline of {memory.counts?.total ?? 0} findings. From your next audit on, this panel will show exactly what improved, what's still open, and what's new.</p>
      </div>
    )
  }

  const c = memory.counts || { fixed: 0, stillOpen: 0, new: 0 }
  const Stat = ({ n, label, color }: { n: number; label: string; color: string }) => (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color, margin: 0, lineHeight: 1 }}>{n}</p>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0.3rem 0 0' }}>{label}</p>
    </div>
  )

  return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, overflow: 'hidden', marginBottom: '1.5rem' }}>
      <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid ' + BORDER, background: BG }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.3rem' }}>Since last audit{prevDate ? ` · ${new Date(prevDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
          <Stat n={c.fixed} label="Resolved" color={GREEN} />
          <Stat n={c.stillOpen} label="Still open" color="#d97706" />
          <Stat n={c.new} label="New" color={BLUE} />
        </div>
      </div>
      <div style={{ padding: '1.25rem 1.75rem' }}>
        {memory.fixed?.length > 0 && (
          <div style={{ marginBottom: memory.newlyFound?.length ? '1rem' : 0 }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GREEN, margin: '0 0 0.5rem' }}>✓ Resolved since last audit</p>
            {memory.fixed.map((k: string, i: number) => (
              <p key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: TEXT, margin: '0.2rem 0', lineHeight: 1.5, display: 'flex', gap: '0.5rem' }}><span style={{ color: GREEN }}>✓</span><span>{humanizeKey(k)}</span></p>
            ))}
          </div>
        )}
        {memory.newlyFound?.length > 0 && (
          <div style={{ marginBottom: memory.stillOpen?.length ? '1rem' : 0 }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BLUE, margin: '0 0 0.5rem' }}>New this audit</p>
            {memory.newlyFound.map((f: any, i: number) => (
              <p key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: TEXT, margin: '0.2rem 0', lineHeight: 1.5, display: 'flex', gap: '0.5rem' }}><span style={{ color: BLUE }}>›</span><span>{f.title}</span></p>
            ))}
          </div>
        )}
        {memory.stillOpen?.length > 0 && (
          <div>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#d97706', margin: '0 0 0.5rem' }}>Still open</p>
            {memory.stillOpen.slice(0, 6).map((f: any, i: number) => (
              <p key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: TEXT_MUTED, margin: '0.2rem 0', lineHeight: 1.5, display: 'flex', gap: '0.5rem' }}><span style={{ color: '#d97706' }}>•</span><span>{f.title}</span></p>
            ))}
            {memory.stillOpen.length > 6 && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: TEXT_MUTED, margin: '0.4rem 0 0', fontStyle: 'italic' }}>+ {memory.stillOpen.length - 6} more still open</p>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── ADVISOR EXECUTIVE DASHBOARD ──
const ADV_GREEN_C = '#3F7D5B'
const ADV_AMBER = '#9A7B2E'

function AdvSectionLabel({ title }: any) {
  return <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: TEXT, margin: '0 0 0.85rem' }}>{title}</p>
}

function advBandWord(score: number) { return score >= 70 ? 'Strong' : score >= 45 ? 'Moderate' : score >= 25 ? 'Weak' : 'Limited' }
function advBandColor(score: number) { return score >= 70 ? ADV_GREEN_C : score >= 45 ? GOLD : score >= 25 ? ADV_AMBER : 'rgba(42,26,14,0.4)' }
function advDimColor(band: string) { return band === 'strong' ? ADV_GREEN_C : band === 'moderate' ? GOLD : band === 'weak' ? ADV_AMBER : 'rgba(42,26,14,0.3)' }

// One strategic priority — compact collapsed tile. Full analysis opens in a modal.
function PriorityCard({ m, i, onOpen }: any) {
  const rec = m.canonicalRecommendation
  const c = rec.case
  const topic = rec.targeting?.affected_entity || m.topic || ''
  const topicLabel = (topic || '').toString().toUpperCase() === '__SITE__' ? 'FOUNDATION' : (topic || '').toString().toUpperCase()
  const POSTURE_LEAD: Record<string, string> = { Commit: 'Protect your strongest advantage', 'Fix-foundation': 'Remove operational AI friction', Confirm: 'Confirm this offering', Defer: 'Hold for later' }
  const lead = m.posture === 'Convert' ? ('Unlock your ' + topic.toLowerCase() + ' opportunity') : m.posture === 'Strengthen' ? ('Deepen your ' + topic.toLowerCase()) : (POSTURE_LEAD[m.posture] || topic)

  const statusTag = (() => {
    const h = rec.history
    if (!h || !h.status) return null
    const map: Record<string, { txt: string; col: string }> = {
      new: { txt: 'New this week', col: BLUE },
      continuing: { txt: 'Continuing', col: TEXT_MUTED },
      improving: { txt: h.changed_metrics?.posture_shift ? ('Moved ' + h.changed_metrics.posture_shift) : 'Improving', col: ADV_GREEN_C },
      evolved: { txt: h.changed_metrics?.posture_shift ? ('Evolved ' + h.changed_metrics.posture_shift) : 'Evolved', col: GOLD },
      regressed: { txt: 'Needs attention', col: ADV_AMBER },
    }
    const t = map[h.status]
    if (!t) return null
    return <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.54rem', fontWeight: 600, letterSpacing: '0.04em', color: t.col, background: t.col + '14', padding: '3px 9px', borderRadius: 4, whiteSpace: 'nowrap' }}>{t.txt}</span>
  })()

  return (
    <button onClick={onOpen} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid rgba(42,26,14,0.10)', background: WHITE, borderRadius: 14, padding: '1.1rem 1.2rem', display: 'block', boxShadow: '0 1px 3px rgba(42,26,14,0.04)', transition: 'box-shadow 0.15s, transform 0.1s' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(42,26,14,0.10)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(42,26,14,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.7rem' }}>
        <span style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid rgba(42,26,14,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', fontWeight: 700, color: TEXT_MUTED, flexShrink: 0 }}>{i + 1}</span>
        <span style={{ flex: 1 }} />
        {statusTag}
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.95rem', color: TEXT_MUTED }}>›</span>
      </div>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.92rem', fontWeight: 700, lineHeight: 1.3, color: TEXT, margin: '0 0 0.4rem' }}>{lead}</p>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', lineHeight: 1.5, color: TEXT_MUTED, margin: '0 0 0.7rem' }}>{c.diagnosis}</p>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.54rem', fontWeight: 700, letterSpacing: '0.08em', color: TEXT_MUTED, background: BG, border: '1px solid ' + BORDER, padding: '3px 9px', borderRadius: 4 }}>{topicLabel}</span>
    </button>
  )
}

// Full consulting analysis — wide two-column executive modal over a dark backdrop.
function CaseModal({ m, i, onClose, model, savedAt }: any) {
  const rec = m.canonicalRecommendation
  const c = rec.case
  const verify = rec.confidence?.evidence_state !== 'confirmed'
  const topic = rec.targeting?.affected_entity || m.topic || ''
  const topicLabel = (topic || '').toString().toUpperCase() === '__SITE__' ? 'FOUNDATION' : (topic || '').toString().toUpperCase()
  const POSTURE_LEAD: Record<string, string> = { Commit: 'Protect your strongest advantage', 'Fix-foundation': 'Remove operational AI friction', Confirm: 'Confirm this offering', Defer: 'Hold for later' }
  const lead = m.posture === 'Convert' ? ('Unlock your ' + topic.toLowerCase() + ' opportunity') : m.posture === 'Strengthen' ? ('Deepen your ' + topic.toLowerCase()) : (POSTURE_LEAD[m.posture] || topic)
  const proof = c.proof || {}

  const statusTag = (() => {
    const h = rec.history
    if (!h || !h.status) return null
    const map: Record<string, { txt: string; col: string }> = {
      new: { txt: 'New this week', col: BLUE },
      continuing: { txt: 'Continuing', col: ADV_AMBER },
      improving: { txt: h.changed_metrics?.posture_shift ? ('Moved ' + h.changed_metrics.posture_shift) : 'Improving', col: ADV_GREEN_C },
      evolved: { txt: h.changed_metrics?.posture_shift ? ('Evolved ' + h.changed_metrics.posture_shift) : 'Evolved', col: GOLD },
      regressed: { txt: 'Needs attention', col: ADV_AMBER },
    }
    return map[h.status] || null
  })()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  // LEFT — narrative section
  const Sec = ({ icon, title, children }: any) => (
    <div style={{ paddingTop: '1.5rem', borderTop: '1px solid ' + BORDER, marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.7rem' }}>
        <span style={{ color: GOLD, fontSize: '0.8rem' }}>{icon}</span>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT, margin: 0 }}>{title}</p>
      </div>
      {children}
    </div>
  )
  // RIGHT — rail card
  const Rail = ({ icon, title, children }: any) => (
    <div style={{ paddingBottom: '1.4rem', borderBottom: '1px solid ' + BORDER, marginBottom: '1.4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
        <span style={{ color: GOLD, fontSize: '0.8rem' }}>{icon}</span>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT, margin: 0 }}>{title}</p>
      </div>
      {children}
    </div>
  )

  const dims = model?.dimensions ? [...model.dimensions].sort((a: any, b: any) => b.score - a.score) : []
  const relatedActions = (() => {
    const out: string[] = []
    if (proof.failed_questions?.length) out.push('Add FAQ section to ' + (rec.targeting?.canonical_page || 'the page'))
    if (!verify && rec.technical?.causes?.length) for (const t of rec.technical.causes) out.push(t.fix)
    return out.slice(0, 4)
  })()

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(26,14,6,0.55)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '3vh 1.5rem', overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: WHITE, borderRadius: 20, maxWidth: 1080, width: '100%', boxShadow: '0 24px 80px rgba(26,14,6,0.4)', position: 'relative', marginBottom: '3vh' }}>
        {/* HEADER */}
        <div style={{ padding: '2rem 2.5rem 1.5rem', position: 'relative' }}>
          <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: '1.6rem', right: '1.8rem', width: 34, height: 34, borderRadius: '50%', border: '1px solid ' + BORDER, background: WHITE, color: TEXT_MUTED, fontSize: '1.2rem', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1rem' }}>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_MUTED }}>Case {String(i + 1).padStart(2, '0')}</span>
            <span style={{ width: 1, height: 12, background: BORDER }} />
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.08em', color: TEXT_MUTED, background: BG, border: '1px solid ' + BORDER, padding: '3px 10px', borderRadius: 4 }}>{topicLabel}</span>
          </div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.1rem', fontWeight: 600, lineHeight: 1.15, color: TEXT, margin: '0 0 0.7rem', maxWidth: '90%' }}>{lead}</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', lineHeight: 1.55, color: TEXT_MUTED, margin: '0 0 1rem', maxWidth: '85%' }}>{c.diagnosis}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {statusTag && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: statusTag.col, background: statusTag.col + '14', padding: '4px 11px', borderRadius: 4 }}>{statusTag.txt}</span>}
            {savedAt && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: TEXT_MUTED }}>Last updated: {new Date(savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
          </div>
        </div>

        {/* TWO COLUMNS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 0, borderTop: '1px solid ' + BORDER }}>
          {/* LEFT — narrative */}
          <div style={{ padding: '0.5rem 2rem 2.25rem', borderRight: '1px solid ' + BORDER }}>
            {c.business_consequence && (
              <Sec icon="◎" title="Why it matters">
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', lineHeight: 1.65, color: TEXT, margin: 0 }}>{c.business_consequence}</p>
              </Sec>
            )}
            <Sec icon="✸" title={verify ? 'What we need' : 'Recommendation'}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.6, color: TEXT, margin: 0 }}>{c.recommendation}</p>
              {rec.targeting?.canonical_page && (
                <code style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.7rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: TEXT, background: BG, padding: '5px 11px', borderRadius: 5, border: '1px solid ' + BORDER, wordBreak: 'break-all' }}>{rec.targeting.canonical_page} <span style={{ color: TEXT_MUTED }}>⊘</span></code>
              )}
            </Sec>
            {(() => {
              const rm = buildRoadmap(rec)
              const hasAny = rm.quickWins.length > 0 || rm.nextImprovements.length > 0 || rm.strategicProject
              if (!hasAny) return null
              const Tier = ({ band, label, time, steps, col }: any) => steps.length === 0 ? null : (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em', color: col }}>{label}</span>
                    {time && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED }}>{time}</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {steps.map((st: any, j: number) => (
                      <div key={j} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.6rem 0.85rem', background: BG, borderRadius: 8, border: '1px solid ' + BORDER, borderLeft: '3px solid ' + col }}>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: TEXT, margin: 0, lineHeight: 1.5 }}>{st.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
              return (
                <Sec icon="⛓" title="Implementation roadmap">
                  <Tier label="QUICK WINS" time="~30 min each" steps={rm.quickWins} col={ADV_GREEN_C} />
                  <Tier label="NEXT IMPROVEMENTS" time="2–3 hours" steps={rm.nextImprovements} col={GOLD} />
                  {rm.strategicProject && <Tier label="STRATEGIC PROJECT" time="1–2 days" steps={[rm.strategicProject]} col={'#8A6D1F'} />}
                </Sec>
              )
            })()}
            {c.expected_result && (
              <Sec icon="◘" title="Expected outcome">
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', lineHeight: 1.65, color: TEXT, margin: 0 }}>{c.expected_result}</p>
              </Sec>
            )}
            {Array.isArray(m.behavioural_claims) && m.behavioural_claims.length > 0 && (
              <Sec icon="▤" title="Guest behaviour · Google Analytics">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {m.behavioural_claims.map((b: any, j: number) => (
                    <div key={j} style={{ padding: '0.75rem 0.95rem', background: BG, borderRadius: 8, border: '1px solid ' + BORDER }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.84rem', lineHeight: 1.6, color: TEXT, margin: 0 }}>{b.claim}</p>
                    </div>
                  ))}
                </div>
              </Sec>
            )}
            {(() => {
              const sd = rec.future?.search
              if (!sd || !sd.measured_pages || sd.measured_pages.length === 0 || sd.impressions === null) return null
              const fmtN = (n: number | null) => n === null || n === undefined ? '—' : n.toLocaleString()
              const chg = sd.impressions_change_pct
              return (
                <Sec icon="◴" title="Search demand · Google Search Console">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: '0.55rem', marginBottom: sd.top_queries?.length ? '0.85rem' : 0 }}>
                    {[
                      { label: 'Impressions', value: fmtN(sd.impressions), sub: chg !== null && chg !== undefined ? ((chg >= 0 ? '↑ ' : '↓ ') + Math.abs(chg) + '%') : 'this period', col: chg !== null && chg !== undefined ? (chg >= 0 ? ADV_GREEN_C : RED) : TEXT_MUTED },
                      { label: 'Clicks', value: fmtN(sd.clicks), sub: '', col: TEXT_MUTED },
                      { label: 'CTR', value: sd.ctr === null ? '—' : sd.ctr + '%', sub: '', col: TEXT_MUTED },
                      { label: 'Avg position', value: sd.avg_position === null ? '—' : sd.avg_position, sub: '', col: TEXT_MUTED },
                    ].map((k, j) => (
                      <div key={j} style={{ padding: '0.65rem 0.8rem', background: BG, borderRadius: 8, border: '1px solid ' + BORDER }}>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.54rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.3rem' }}>{k.label}</p>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: TEXT, margin: 0, lineHeight: 1 }}>{k.value}</p>
                        {k.sub && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: k.col, margin: '0.2rem 0 0' }}>{k.sub}</p>}
                      </div>
                    ))}
                  </div>
                  {sd.top_queries?.length > 0 && (
                    <div>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>Searches bringing guests to these pages</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {sd.top_queries.map((q: any, j: number) => (
                          <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.85rem', background: BG, borderRadius: 7, border: '1px solid ' + BORDER }}>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.query}</span>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.66rem', color: TEXT_MUTED, flexShrink: 0 }}>{q.impressions.toLocaleString()} impressions · pos {q.position}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Sec>
              )
            })()}
            {Array.isArray(rec.review_evidence) && rec.review_evidence.length > 0 && (
              <Sec icon="★" title="Official reviews">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  {rec.review_evidence.map((f: any, j: number) => (
                    <div key={j} style={{ padding: '0.8rem 1rem', background: BG, borderRadius: 8, border: '1px solid ' + BORDER }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.84rem', fontWeight: 500, lineHeight: 1.55, color: TEXT, margin: 0 }}>{f.claim}</p>
                      {Array.isArray(f.representative_quotes) && f.representative_quotes.length > 0 && (
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: TEXT_MUTED, margin: '0.5rem 0 0', fontStyle: 'italic' }}>&ldquo;{f.representative_quotes[0].text}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              </Sec>
            )}
            {((proof.quotes?.length || proof.failed_questions?.length || rec.technical?.causes?.length) > 0) && (
              <Sec icon="▦" title="Supporting evidence">
                {proof.quotes?.length > 0 && (
                  <div style={{ marginBottom: (proof.failed_questions?.length || rec.technical?.causes?.length) ? '1.2rem' : 0 }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>From your website</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {proof.quotes.map((q: any, j: number) => (
                        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.9rem', background: BG, borderRadius: 8, border: '1px solid ' + BORDER }}>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: TEXT, margin: 0 }}>&ldquo;{q.quote}&rdquo;{q.page && <span style={{ color: TEXT_MUTED }}> — {q.page}</span>}</p>
                          <span style={{ color: TEXT_MUTED, flexShrink: 0 }}>›</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {proof.failed_questions?.length > 0 && (
                  <div style={{ marginBottom: rec.technical?.causes?.length ? '1.2rem' : 0 }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>Guest questions AI can&rsquo;t answer today</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {proof.failed_questions.map((q: string, j: number) => (
                        <li key={j} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: TEXT, paddingLeft: '0.95rem', position: 'relative', lineHeight: 1.5 }}><span style={{ position: 'absolute', left: 0, color: TEXT_MUTED }}>•</span>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {!verify && rec.technical?.causes?.length > 0 && (
                  <div>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>What&rsquo;s making AI hesitate</p>
                    {rec.technical.causes.map((t: any, j: number) => (
                      <p key={j} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', lineHeight: 1.55, color: TEXT, margin: j ? '0.45rem 0 0' : 0, paddingLeft: '0.95rem', position: 'relative' }}><span style={{ position: 'absolute', left: 0, color: ADV_AMBER }}>◔</span>{t.fix}</p>
                    ))}
                  </div>
                )}
              </Sec>
            )}
          </div>

          {/* RIGHT — rail */}
          <div style={{ padding: '1.5rem 2rem 2.25rem', background: 'rgba(248,245,239,0.4)' }}>
            <Rail icon="⤢" title="AI Visibility Contribution">
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: TEXT_MUTED, margin: '0 0 0.6rem' }}>This case strengthens how AI understands your:</p>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: TEXT, background: WHITE, border: '1px solid ' + BORDER, padding: '4px 11px', borderRadius: 6, display: 'inline-block' }}>{topicLabel.charAt(0) + topicLabel.slice(1).toLowerCase()}</span>
            </Rail>

            {dims.length > 0 && (
              <Rail icon="▤" title="Evidence at a glance">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  {dims.map((d: any) => {
                    const col = advDimColor(d.band)
                    return (
                      <div key={d.dimension}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', color: TEXT }}>{d.label}</span>
                          <span style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', fontWeight: 700, color: TEXT }}>{d.score}</span>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, textTransform: 'capitalize', color: col, width: 56, textAlign: 'right' }}>{d.band}</span>
                          </span>
                        </div>
                        <div style={{ height: 5, background: 'rgba(42,26,14,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: Math.max(2, d.score) + '%', height: '100%', background: col, borderRadius: 3 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Rail>
            )}

            {relatedActions.length > 0 && (
              <Rail icon="◈" title="Related actions">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {relatedActions.map((a: string, j: number) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.8rem', background: WHITE, borderRadius: 8, border: '1px solid ' + BORDER }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.76rem', color: TEXT, margin: 0, lineHeight: 1.4, flex: 1 }}>{a}</p>
                      <span style={{ color: TEXT_MUTED, flexShrink: 0 }}>›</span>
                    </div>
                  ))}
                </div>
              </Rail>
            )}

            {/* Evidence sources — always present, show state */}
            <div>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT, margin: '0 0 0.7rem' }}>Evidence sources</p>
              {(() => {
                const ga4On = Array.isArray(m.behavioural_claims) && m.behavioural_claims.length > 0
                const reviewsOn = Array.isArray(rec.review_evidence) && rec.review_evidence.length > 0
                const gscOn = !!(rec.future?.search && rec.future.search.measured_pages?.length > 0 && rec.future.search.impressions !== null)
                const sources = [
                  { name: 'Website Intelligence', on: true, state: 'Active' },
                  { name: 'Review Intelligence', on: reviewsOn, state: reviewsOn ? 'Active' : 'Awaiting reviews' },
                  { name: 'Google Analytics', on: ga4On, state: ga4On ? 'Connected' : 'Connect to see results' },
                  { name: 'Search Console', on: gscOn, state: gscOn ? 'Connected' : 'Connect to see results' },
                ]
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {sources.map((src, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.5rem 0.7rem', background: WHITE, borderRadius: 7, border: '1px solid ' + BORDER }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: src.on ? ADV_GREEN_C : 'rgba(42,26,14,0.22)', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 500, color: TEXT, flex: 1 }}>{src.name}</span>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: src.on ? ADV_GREEN_C : TEXT_MUTED }}>{src.state}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// AI FOUNDATIONS — the explainability layer under the visibility score. Reads
// adv.foundations (real architecture layers + KG + question coverage). Each row is
// clickable, expanding to why/assessment/evidence/recommendation. No invented data:
// renders only foundations the platform actually computed.
function FoundationsPanel({ foundations }: any) {
  const [open, setOpen] = useState<string | null>(null)
  if (!Array.isArray(foundations) || foundations.length === 0) return null

  const bandCol = (band: string) => band === 'strong' ? ADV_GREEN_C : band === 'moderate' ? GOLD : band === 'weak' ? ADV_AMBER : 'rgba(42,26,14,0.35)'
  const bandWord = (band: string) => band === 'strong' ? 'Strong' : band === 'moderate' ? 'Moderate' : band === 'weak' ? 'Weak' : 'Absent'
  const dims = [...foundations].sort((a: any, b: any) => (b.score ?? -1) - (a.score ?? -1))

  return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '1.5rem 1.6rem', marginTop: '1.25rem' }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: TEXT, margin: '0 0 0.3rem' }}>AI Foundations</p>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: TEXT_MUTED, margin: '0 0 1.1rem', lineHeight: 1.5 }}>What gives your hotel this visibility score — tap any foundation to see the evidence.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {dims.map((f: any) => {
          const col = bandCol(f.band)
          const isOpen = open === f.key
          return (
            <div key={f.key} style={{ borderRadius: 10, border: '1px solid ' + (isOpen ? 'rgba(201,169,76,0.3)' : 'transparent'), background: isOpen ? BG : 'transparent', overflow: 'hidden' }}>
              <div onClick={() => setOpen(isOpen ? null : f.key)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 0.7rem' }}>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.76rem', fontWeight: 500, color: TEXT, flex: 1 }}>{f.name}</span>
                {f.score != null && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', fontWeight: 700, color: col }}>{f.score}</span>}
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: col, width: 64, textAlign: 'right' }}>{bandWord(f.band)}</span>
                <span style={{ color: TEXT_MUTED, fontSize: '0.9rem', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
              </div>
              {isOpen && (
                <div style={{ padding: '0.3rem 0.9rem 1rem', borderTop: '1px solid ' + BORDER }}>
                  {Array.isArray(f.components) && f.components.length > 0 && (
                    <div style={{ marginTop: '0.8rem' }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.45rem' }}>Underlying components</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {f.components.map((cmp: any, i: number) => {
                          const cmpCol = cmp.ok ? ADV_GREEN_C : ADV_AMBER
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ color: cmpCol, fontSize: '0.74rem', width: 14, flexShrink: 0 }}>{cmp.ok ? '✓' : '⚠'}</span>
                              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', color: TEXT, flex: 1 }}>{cmp.name}</span>
                              {cmp.score != null && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 600, color: cmpCol }}>{cmp.score}</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {f.why_it_matters && (
                    <div style={{ marginTop: '0.8rem' }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.3rem' }}>Why this matters</p>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: TEXT, margin: 0, lineHeight: 1.55 }}>{f.why_it_matters}</p>
                    </div>
                  )}
                  {f.assessment && (
                    <div style={{ marginTop: '0.85rem' }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: col, margin: '0 0 0.3rem' }}>Current assessment</p>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: TEXT, margin: 0, lineHeight: 1.55 }}>{f.assessment}</p>
                    </div>
                  )}
                  {Array.isArray(f.evidence) && f.evidence.length > 0 && (
                    <div style={{ marginTop: '0.85rem' }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.4rem' }}>Evidence</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {f.evidence.map((e: string, i: number) => (
                          <p key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', color: TEXT_MUTED, margin: 0, lineHeight: 1.45, paddingLeft: '0.8rem', position: 'relative' }}><span style={{ position: 'absolute', left: 0, color: col }}>•</span>{e}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {f.recommendation && (
                    <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', background: WHITE, borderRadius: 8, border: '1px solid ' + BORDER, borderLeft: '3px solid ' + GOLD }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A6D1F', margin: '0 0 0.3rem' }}>Recommendation</p>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: TEXT, margin: 0, lineHeight: 1.55 }}>{f.recommendation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ScorePanel({ model }: any) {
  const [showAll, setShowAll] = useState(false)
  if (!model?.dimensions?.length) return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '1.5rem', textAlign: 'center' }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: TEXT_MUTED, margin: 0 }}>Score is being prepared.</p>
    </div>
  )
  const overall = model.overall ?? 0
  const band = advBandWord(overall)
  const bandCol = advBandColor(overall)
  const R = 50, C = 2 * Math.PI * R, dash = (overall / 100) * C
  const dims = [...model.dimensions].sort((a: any, b: any) => b.score - a.score)
  const shown = showAll ? dims : dims.slice(0, 6)
  return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '1.5rem 1.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.4rem' }}>
        <div style={{ position: 'relative', width: 132, height: 132 }}>
          <svg width="132" height="132" viewBox="0 0 132 132" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="66" cy="66" r={R} fill="none" stroke="rgba(42,26,14,0.07)" strokeWidth="9" />
            <circle cx="66" cy="66" r={R} fill="none" stroke={bandCol} strokeWidth="9" strokeLinecap="round" strokeDasharray={dash + ' ' + C} style={{ transition: 'stroke-dasharray 0.8s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.4rem', fontWeight: 400, color: TEXT, lineHeight: 1 }}>{overall}<span style={{ fontSize: '1rem', color: TEXT_MUTED }}>/100</span></span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: bandCol, marginTop: '0.2rem' }}>{band}</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        {shown.map((d: any) => {
          if (d.applicable === false || d.band === 'na') {
            return (
              <div key={d.dimension} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: 0.6 }}>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 500, color: TEXT_MUTED, width: 96, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
                <div style={{ flex: 1, height: 7, background: 'rgba(42,26,14,0.04)', borderRadius: 4 }} />
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: TEXT_MUTED, textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>Not offered</span>
              </div>
            )
          }
          const col = advDimColor(d.band)
          return (
            <div key={d.dimension} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 500, color: TEXT, width: 96, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
              <div style={{ flex: 1, height: 7, background: 'rgba(42,26,14,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: Math.max(2, d.score) + '%', height: '100%', background: col, borderRadius: 4 }} />
              </div>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 700, color: col, width: 22, textAlign: 'right', flexShrink: 0 }}>{d.score}</span>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: col, width: 52, textAlign: 'right', flexShrink: 0 }}>{d.band}</span>
            </div>
          )
        })}
      </div>
      {dims.length > 6 && (
        <button onClick={() => setShowAll(s => !s)} style={{ marginTop: '1.1rem', width: '100%', fontFamily: 'Montserrat, sans-serif', fontSize: '0.66rem', fontWeight: 600, color: TEXT, background: BG, border: '1px solid ' + BORDER, borderRadius: 8, padding: '0.55rem', cursor: 'pointer' }}>{showAll ? 'Show less' : 'View full score breakdown'}</button>
      )}
    </div>
  )
}

function ActivityPanel({ memory }: any) {
  const humanizeKey = (k: string) => {
    const parts = (k || '').split(':')
    if (parts[0] === 'page') return parts[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' page'
    if (parts[0] === 'query') return parts.slice(2).join(' ').replace(/-/g, ' ').replace(/^./, c => c.toUpperCase())
    return (k || '').replace(/[:-]/g, ' ')
  }
  if (!memory) return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '1.5rem', textAlign: 'center' }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: TEXT_MUTED, margin: 0 }}>Activity will appear after your next audit.</p>
    </div>
  )
  if (memory.isFirstRun) return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '1.5rem' }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.4rem' }}>Tracking started</p>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: TEXT, margin: 0, lineHeight: 1.6 }}>This audit set a baseline of {memory.counts?.total ?? 0} findings. From your next audit, this shows what improved, what&rsquo;s still open, and what&rsquo;s new.</p>
    </div>
  )
  const c = memory.counts || { fixed: 0, stillOpen: 0, new: 0 }
  const Stat = ({ n, label, col }: any) => (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.9rem', color: col, margin: 0, lineHeight: 1 }}>{n}</p>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0.3rem 0 0' }}>{label}</p>
    </div>
  )
  return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '1.5rem 1.6rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.1rem' }}>
        <Stat n={c.fixed} label="Resolved" col={ADV_GREEN_C} />
        <Stat n={c.stillOpen} label="Still open" col={ADV_AMBER} />
        <Stat n={c.new} label="New" col={BLUE} />
      </div>
      {memory.fixed?.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ADV_GREEN_C, margin: '0 0 0.5rem' }}>Recently resolved</p>
          <div style={{ maxHeight: 140, overflowY: 'auto', paddingRight: '0.3rem' }}>
            {memory.fixed.map((k: string, i: number) => (
              <p key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.76rem', color: TEXT, margin: '0.25rem 0', lineHeight: 1.45, display: 'flex', gap: '0.45rem' }}><span style={{ color: ADV_GREEN_C, flexShrink: 0 }}>✓</span><span>{humanizeKey(k)}</span></p>
            ))}
          </div>
        </div>
      )}
      {memory.stillOpen?.length > 0 && (
        <div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ADV_AMBER, margin: '0 0 0.5rem' }}>Still open ({memory.stillOpen.length})</p>
          <div style={{ maxHeight: 180, overflowY: 'auto', paddingRight: '0.3rem' }}>
            {memory.stillOpen.map((f: any, i: number) => (
              <p key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.76rem', color: TEXT_MUTED, margin: '0.25rem 0', lineHeight: 1.45, display: 'flex', gap: '0.45rem' }}><span style={{ color: ADV_AMBER, flexShrink: 0 }}>•</span><span>{f.title}</span></p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function EvidenceRow({ adv, hotel }: any) {
  const hasReviews = (adv.top_moves || []).some((m: any) => Array.isArray(m.canonicalRecommendation?.review_evidence) && m.canonicalRecommendation.review_evidence.length > 0)
  const ga4 = hotel?.ga4_status === 'connected'
  const gsc = hotel?.gsc_status === 'connected'
  const items = [
    { name: 'Website Intelligence', status: 'Active', on: true },
    { name: 'GA4 Intelligence', status: ga4 ? 'Connected' : 'Not connected', on: ga4 },
    { name: 'Review Intelligence', status: hasReviews ? 'Active' : 'Awaiting reviews', on: hasReviews },
    { name: 'Search Console', status: gsc ? 'Connected' : 'Not connected', on: gsc },
    { name: 'Citation Sources', status: 'Active', on: true },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
      {items.map((it, i) => (
        <div key={i} style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '1rem 1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: it.on ? ADV_GREEN_C : 'rgba(42,26,14,0.25)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: TEXT }}>{it.name}</span>
          </div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.64rem', color: it.on ? ADV_GREEN_C : TEXT_MUTED, margin: 0, fontWeight: 500 }}>{it.status}</p>
        </div>
      ))}
    </div>
  )
}

// AI Performance Intelligence — measurement bubble. Reads adv.ai_performance (real
// GA4 data when connected). No causal language; reports what happened only. When not
// connected, shows a connect state. Every number traces to a real GA4 aggregation.
function AiPerformancePanel({ perf, ga4Connected }: any) {
  const measured = perf && perf.measured
  const Wrap = ({ children }: any) => (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 16, overflow: 'hidden', marginBottom: '1.5rem' }}>
      <div style={{ padding: '1.4rem 1.85rem 1.1rem', borderBottom: '1px solid ' + BORDER, background: 'linear-gradient(135deg, #2A1A0E 0%, #3D2810 100%)' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.8)', margin: '0 0 0.3rem' }}>AI Performance Intelligence</p>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.35rem', fontWeight: 300, color: WHITE, margin: 0, lineHeight: 1.25 }}>Is AI visibility driving real traffic to your website?</p>
      </div>
      {children}
    </div>
  )

  // Not connected (or no usable data yet) → honest connect state, no fabricated numbers.
  if (!measured) {
    return (
      <Wrap>
        <div style={{ padding: '2rem 1.85rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.86rem', color: TEXT, margin: '0 0 0.5rem', fontWeight: 600 }}>{ga4Connected ? 'Measuring your AI traffic' : 'Connect Google Analytics to see results'}</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.76rem', color: TEXT_MUTED, margin: '0 auto', lineHeight: 1.6, maxWidth: 460 }}>{ga4Connected
            ? 'Your property is connected. As soon as your next analysis runs, this will show how much traffic AI assistants send to your website, which platforms, and how it trends.'
            : 'Once you connect your Google Analytics in Settings, SwissNet will measure how much traffic ChatGPT, Perplexity, Google AI and others send directly to your website — and whether it converts.'}</p>
        </div>
      </Wrap>
    )
  }

  const fmt = (n: number | null) => n === null || n === undefined ? '—' : n.toLocaleString()
  const pct = (n: number | null) => n === null || n === undefined ? '—' : n + '%'
  const change = perf.ai_sessions_change_pct
  const PLAT_COL: Record<string, string> = { ChatGPT: '#10a37f', Perplexity: '#20808d', Gemini: '#4285f4', Claude: GOLD, Copilot: '#0078d4', 'Bing / Copilot': '#0078d4' }

  return (
    <Wrap>
      <div style={{ padding: '1.5rem 1.85rem' }}>
        {/* Headline numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'AI sessions', value: fmt(perf.ai_sessions), sub: change !== null ? ((change >= 0 ? '↑ ' : '↓ ') + Math.abs(change) + '% vs last period') : 'this period', subcol: change !== null ? (change >= 0 ? ADV_GREEN_C : RED) : TEXT_MUTED },
            { label: 'Share of all traffic', value: pct(perf.ai_share_pct), sub: 'of total sessions', subcol: TEXT_MUTED },
            { label: 'AI conversion rate', value: pct(perf.ai_conversion_rate), sub: perf.ai_conversions !== null ? fmt(perf.ai_conversions) + ' conversions' : '', subcol: TEXT_MUTED },
            { label: 'AI revenue', value: perf.ai_revenue === null ? 'Not tracked' : ('CHF ' + fmt(perf.ai_revenue)), sub: perf.ai_revenue === null ? 'connect revenue tracking' : 'this period', subcol: TEXT_MUTED },
          ].map((k, i) => (
            <div key={i} style={{ background: BG, borderRadius: 10, padding: '1rem 1.15rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.5rem' }}>{k.label}</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', fontWeight: 400, color: TEXT, margin: '0 0 0.2rem', lineHeight: 1 }}>{k.value}</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: k.subcol, margin: 0 }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* By platform */}
        {perf.by_platform && perf.by_platform.length > 0 && (
          <div style={{ marginBottom: perf.top_ai_landing_pages?.length ? '1.5rem' : 0 }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT, margin: '0 0 0.8rem' }}>Traffic by AI platform</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {perf.by_platform.map((pl: any) => {
                const col = PLAT_COL[pl.platform] || GOLD
                const maxS = perf.by_platform[0].sessions || 1
                return (
                  <div key={pl.platform} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', fontWeight: 500, color: TEXT, width: 110, flexShrink: 0 }}>{pl.platform}</span>
                    <div style={{ flex: 1, height: 8, background: 'rgba(42,26,14,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: Math.max(2, Math.round((pl.sessions / maxS) * 100)) + '%', height: '100%', background: col, borderRadius: 4 }} />
                    </div>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', fontWeight: 700, color: TEXT, width: 54, textAlign: 'right', flexShrink: 0 }}>{fmt(pl.sessions)}</span>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.64rem', color: TEXT_MUTED, width: 70, textAlign: 'right', flexShrink: 0 }}>{pl.conversion_rate === null ? '' : pl.conversion_rate + '% conv'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top AI landing pages */}
        {perf.top_ai_landing_pages && perf.top_ai_landing_pages.length > 0 && (
          <div>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT, margin: '0 0 0.8rem' }}>Where AI visitors land</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {perf.top_ai_landing_pages.map((pg: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.85rem', background: BG, borderRadius: 7, border: '1px solid ' + BORDER }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pg.path}</span>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 600, color: GOLD, flexShrink: 0, marginLeft: '1rem' }}>{fmt(pg.sessions)} sessions</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.64rem', color: TEXT_MUTED, margin: '1.25rem 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>Measured from your Google Analytics over the last {perf.period_days || 28} days. This reports what happened — it does not claim a cause.</p>
      </div>
    </Wrap>
  )
}

// ── AI KNOWLEDGE INTEGRITY (manual, read-only) ──
// ── GUEST REVIEW INTELLIGENCE (reads advisory blob; no DB, no re-analysis) ──
function GuestReviewCard({ adv }: any) {
  const [open, setOpen] = useState(false)

  // Collect every review finding: per-Case review_evidence + advisory-level emerging_opportunities.
  const findings: any[] = []
  const seen = new Set<string>()
  const push = (f: any) => {
    if (!f || !f.theme) return
    const key = (f.topic || '') + '|' + f.theme
    if (seen.has(key)) return
    seen.add(key)
    findings.push(f)
  }
  for (const m of (adv?.top_moves || [])) {
    for (const f of (m?.canonicalRecommendation?.review_evidence || [])) push(f)
  }
  for (const f of (adv?.emerging_opportunities || [])) push(f)

  // Sort by support strength so the loudest guest signal leads.
  findings.sort((a, b) => (b.support_count || 0) - (a.support_count || 0))

  const POSITIVE = new Set(['recurring_strength', 'emerging_reputation'])
  const strengths = findings.filter(f => POSITIVE.has(f.kind))
  const issues = findings.filter(f => !POSITIVE.has(f.kind))
  const total = findings.length
  const top = findings[0]

  // Dimensions reviews support vs don't — derived from the visibility model.
  // A dimension "supported" if any strength theme maps to its topic; "rarely heard"
  // if it's a real scored dimension with no review theme. No invented numbers.
  const dims = (adv?.visibility_model?.dimensions || []).filter((d: any) => d.applicable !== false && d.band !== 'na')
  const themeTopics = new Set(findings.map((f: any) => (f.topic || '').toLowerCase()).filter(Boolean))
  const themeThemesLc = strengths.map((f: any) => (f.theme || '').toLowerCase())
  const dimSupported = (d: any) => {
    const dl = (d.label || d.dimension || '').toLowerCase()
    if (themeTopics.has((d.dimension || '').toLowerCase())) return true
    return themeThemesLc.some(t => t.includes(dl) || dl.includes(t.split(' ')[0]))
  }
  const supportedDims = dims.filter(dimSupported)
  const rarelyHeardDims = dims.filter((d: any) => !dimSupported(d))

  // Recommendations — derived from real themes. 3–5 max.
  const recs: string[] = []
  if (top) recs.push('Surface your strongest guest theme \u2014 ' + top.theme.toLowerCase() + ' \u2014 prominently across your website so AI can retrieve it.')
  if (strengths[1]) recs.push('Reflect recurring guest language about ' + strengths[1].theme.toLowerCase() + ' naturally within the relevant pages.')
  if (rarelyHeardDims[0]) recs.push('Encourage guests to mention ' + (rarelyHeardDims[0].label || rarelyHeardDims[0].dimension).toLowerCase() + ' in reviews \u2014 AI has little review evidence for it today.')
  if (issues[0]) recs.push('Address the recurring guest concern around ' + issues[0].theme.toLowerCase() + ', then let improved reviews rebuild that signal.')
  if (strengths.length >= 3) recs.push('Keep your strongest review themes visible on the pages guests book from \u2014 reputation only helps AI if the website states it.')
  const recList = recs.slice(0, 5)

  // Status — Strong / Moderate / Weak from how many strength themes cleared the gate.
  const statusWord = strengths.length >= 3 ? 'Strong' : strengths.length >= 1 ? 'Moderate' : 'Weak'
  const statusCol = strengths.length >= 3 ? ADV_GREEN_C : strengths.length >= 1 ? GOLD : ADV_AMBER
  const execLine = top
    ? 'Guest reviews consistently reinforce ' + strengths.slice(0, 3).map((f: any) => f.theme.toLowerCase()).join(', ') + '. These themes strengthen AI confidence when recommending you, while some dimensions receive little guest discussion.'
    : 'A few guest themes have emerged, but there is not yet enough consistent review evidence for AI to draw on.'

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!total) return null

  const kindLabel: any = {
    recurring_strength: 'Strength',
    emerging_reputation: 'Emerging',
    recurring_complaint: 'Complaint',
    expectation_gap: 'Expectation gap',
  }
  const kindColor = (k: string) => POSITIVE.has(k) ? ADV_GREEN_C : RED

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '1.25rem 1.4rem', display: 'block', marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 700, color: TEXT }}>Guest Review Intelligence</span>
          </div>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.95rem', color: TEXT_MUTED }}>›</span>
        </div>
        {top && (
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: TEXT, margin: '0.7rem 0 0', lineHeight: 1.5 }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: GOLD, fontWeight: 600 }}>{top.support_count}</span>
            {' '}guests highlight <strong>{top.theme.toLowerCase()}</strong> — your loudest guest signal. Tap to see what guests say and how it affects AI visibility.
          </p>
        )}
      </button>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(42,26,14,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4vh 1rem', zIndex: 1000, overflowY: 'auto' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: BG, borderRadius: 18, maxWidth: 880, width: '100%', boxShadow: '0 20px 60px rgba(42,26,14,0.3)', overflow: 'hidden', marginBottom: '4vh' }}>
            {/* HEADER */}
            <div style={{ background: 'linear-gradient(135deg, #2A1A0E 0%, #3D2810 100%)', padding: '2rem 2.5rem', position: 'relative' }}>
              <button onClick={() => setOpen(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.4rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>\u00d7</button>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.75)', margin: '0 0 0.5rem' }}>Review Intelligence</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.7rem' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.9rem', fontWeight: 400, color: WHITE, margin: 0, lineHeight: 1.1 }}>What guest reviews teach AI</p>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: statusCol, background: 'rgba(255,255,255,0.1)', border: '1px solid ' + statusCol, padding: '4px 12px', borderRadius: 20 }}>{statusWord}</span>
              </div>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: 'rgba(255,255,255,0.82)', margin: 0, lineHeight: 1.6, maxWidth: '64ch' }}>{execLine}</p>
            </div>

            <div style={{ padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>

              {/* 1 — WHAT AI LEARNS */}
              {strengths.length > 0 && (
                <div>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT, margin: '0 0 0.3rem' }}>What AI learns from guests</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', color: TEXT_MUTED, margin: '0 0 1rem', lineHeight: 1.5 }}>The themes guests raise most consistently \u2014 the strengths AI can draw on.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
                    {strengths.map((f, i) => (
                      <div key={'l' + i} style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '1.1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.45rem' }}>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 700, color: TEXT }}>{f.theme}</span>
                          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 600, color: GOLD, lineHeight: 1, flexShrink: 0 }}>{f.support_count}<span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', color: TEXT_MUTED, fontWeight: 600 }}> mentions</span></span>
                        </div>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.76rem', color: TEXT_MUTED, margin: 0, lineHeight: 1.5 }}>{f.claim}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2 — WHAT AI RARELY HEARS */}
              {rarelyHeardDims.length > 0 && (
                <div>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT, margin: '0 0 0.3rem' }}>What AI rarely hears</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', color: TEXT_MUTED, margin: '0 0 1rem', lineHeight: 1.5 }}>Dimensions guests seldom discuss \u2014 so AI has weaker confidence recommending you for them.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
                    {rarelyHeardDims.map((d: any, i: number) => (
                      <div key={'r' + i} style={{ background: 'rgba(42,26,14,0.02)', border: '1px solid ' + BORDER, borderRadius: 12, padding: '1.1rem 1.25rem' }}>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 700, color: TEXT, margin: '0 0 0.35rem' }}>{d.label || d.dimension}</p>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.76rem', color: TEXT_MUTED, margin: 0, lineHeight: 1.5 }}>Few reviews discuss this \u2014 little guest evidence for AI to draw on.</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3 — AI VISIBILITY IMPACT */}
              {(supportedDims.length > 0 || rarelyHeardDims.length > 0) && (
                <div>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT, margin: '0 0 1rem' }}>How reviews shape AI visibility</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderLeft: '3px solid ' + ADV_GREEN_C, borderRadius: 12, padding: '1.25rem 1.4rem' }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.66rem', fontWeight: 700, color: ADV_GREEN_C, margin: '0 0 0.8rem', lineHeight: 1.4 }}>Reviews strengthen AI confidence in</p>
                      {supportedDims.length > 0 ? supportedDims.map((d: any, i: number) => (
                        <p key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: TEXT, margin: '0.35rem 0', display: 'flex', gap: '0.5rem', lineHeight: 1.4 }}><span style={{ color: ADV_GREEN_C }}>\u2713</span>{d.label || d.dimension}</p>
                      )) : <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.76rem', color: TEXT_MUTED, margin: 0, fontStyle: 'italic' }}>No dimensions are review-supported yet.</p>}
                    </div>
                    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderLeft: '3px solid rgba(42,26,14,0.2)', borderRadius: 12, padding: '1.25rem 1.4rem' }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.66rem', fontWeight: 700, color: TEXT_MUTED, margin: '0 0 0.8rem', lineHeight: 1.4 }}>Reviews provide little evidence for</p>
                      {rarelyHeardDims.length > 0 ? rarelyHeardDims.map((d: any, i: number) => (
                        <p key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: TEXT, margin: '0.35rem 0', display: 'flex', gap: '0.5rem', lineHeight: 1.4 }}><span style={{ color: TEXT_MUTED }}>\u2022</span>{d.label || d.dimension}</p>
                      )) : <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.76rem', color: TEXT_MUTED, margin: 0, fontStyle: 'italic' }}>Every tracked dimension has review support.</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* 4 — RECOMMENDATIONS */}
              {recList.length > 0 && (
                <div>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT, margin: '0 0 1rem' }}>Recommendations</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {recList.map((rText, i) => (
                      <div key={'rec' + i} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, padding: '0.9rem 1.1rem' }}>
                        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 600, color: GOLD, lineHeight: 1.3, flexShrink: 0 }}>{i + 1}</span>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: TEXT, margin: 0, lineHeight: 1.55 }}>{rText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5 — SUPPORTING EVIDENCE */}
              {findings.some((f: any) => (f.representative_quotes || []).length > 0) && (
                <div>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT, margin: '0 0 1rem' }}>Supporting evidence</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    {findings.filter((f: any) => (f.representative_quotes || []).length > 0).map((f, i) => {
                      const q = f.representative_quotes[0]
                      return (
                        <div key={'e' + i} style={{ background: WHITE, border: '1px solid ' + BORDER, borderLeft: '4px solid ' + (POSITIVE.has(f.kind) ? ADV_GREEN_C : RED), borderRadius: 10, padding: '0.95rem 1.2rem' }}>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontStyle: 'italic', fontSize: '0.82rem', color: TEXT, margin: '0 0 0.4rem', lineHeight: 1.55 }}>\u201c{q.text}\u201d</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.66rem', fontWeight: 700, color: TEXT_MUTED }}>{f.theme}</span>
                            {q.source && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED }}>\u00b7 {q.source}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.66rem', color: TEXT_MUTED, margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>Based on {total} review theme{total > 1 ? 's' : ''} found across guest reviews. Themes need multiple supporting reviews to appear.</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function KnowledgeIntegrityCard({ hotelId }: any) {
  const [rows, setRows] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!hotelId) { setLoaded(true); return }
    const load = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data } = await sb.from('knowledge_integrity').select('*').eq('hotel_id', hotelId).order('created_at', { ascending: false })
        setRows(data || [])
      } catch {} finally { setLoaded(true) }
    }
    load()
  }, [hotelId])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const n = rows.length
  const hasIssues = n > 0
  const accent = hasIssues ? RED : ADV_GREEN_C

  return (
    <>
      <button onClick={() => hasIssues && setOpen(true)} style={{ width: '100%', textAlign: 'left', cursor: hasIssues ? 'pointer' : 'default', background: WHITE, border: '1px solid ' + (hasIssues ? 'rgba(220,38,38,0.25)' : BORDER), borderRadius: 14, padding: '1.25rem 1.4rem', display: 'block' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 700, color: TEXT }}>AI Knowledge Integrity</span>
          </div>
          {hasIssues && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.95rem', color: TEXT_MUTED }}>›</span>}
        </div>
        {!loaded && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: TEXT_MUTED, margin: '0.7rem 0 0' }}>Checking\u2026</p>}
        {loaded && hasIssues && (
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: TEXT, margin: '0.7rem 0 0', lineHeight: 1.5 }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: RED, fontWeight: 600 }}>{n}</span>
            {' '}{n === 1 ? 'source is teaching AI' : 'sources are teaching AI'} something inaccurate about this hotel. Tap to review.
          </p>
        )}
        {loaded && !hasIssues && (
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.76rem', color: TEXT_MUTED, margin: '0.7rem 0 0', lineHeight: 1.5 }}>No inaccuracies on record. The sources AI learns from are reporting correct information.</p>
        )}
      </button>

      {open && hasIssues && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(42,26,14,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4vh 1rem', zIndex: 1000, overflowY: 'auto' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: BG, borderRadius: 18, maxWidth: 760, width: '100%', boxShadow: '0 20px 60px rgba(42,26,14,0.3)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #2A1A0E 0%, #3D2810 100%)', padding: '1.75rem 2rem', position: 'relative' }}>
              <button onClick={() => setOpen(false)} style={{ position: 'absolute', top: '1.1rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.75)', margin: '0 0 0.4rem' }}>AI Knowledge Integrity</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.7rem', fontWeight: 400, color: WHITE, margin: 0, lineHeight: 1.15 }}>What external sources are teaching AI</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', margin: '0.6rem 0 0', lineHeight: 1.55, maxWidth: '60ch' }}>These pages are cited by AI assistants but contain information that conflicts with this hotel&rsquo;s confirmed facts.</p>
            </div>
            <div style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {rows.map((r: any, i: number) => (
                <div key={r.id || i} style={{ border: '1px solid ' + BORDER, borderLeft: '4px solid ' + RED, borderRadius: 12, background: WHITE, padding: '1.25rem 1.4rem' }}>
                  <div style={{ marginBottom: '0.9rem' }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: RED, margin: '0 0 0.3rem' }}>Incorrect claim</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', fontWeight: 600, color: TEXT, margin: 0, lineHeight: 1.45 }}>&ldquo;{r.incorrect_claim}&rdquo;</p>
                  </div>
                  <div style={{ marginBottom: '0.9rem' }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.3rem' }}>Source</p>
                    <a href={r.source_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: BLUE, margin: 0, lineHeight: 1.4, wordBreak: 'break-all', textDecoration: 'none' }}>{r.source_url}</a>
                  </div>
                  <div style={{ marginBottom: '0.9rem' }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ADV_GREEN_C, margin: '0 0 0.3rem' }}>Correct information</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: TEXT, margin: 0, lineHeight: 1.5 }}>{r.correct_information}</p>
                  </div>
                  <div style={{ marginBottom: '0.9rem' }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.3rem' }}>Why this matters</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: TEXT, margin: 0, lineHeight: 1.5 }}>{r.why_it_matters}</p>
                  </div>
                  <div style={{ paddingTop: '0.9rem', borderTop: '1px solid ' + BORDER }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.3rem' }}>Recommended action</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 600, color: TEXT, margin: 0, lineHeight: 1.5 }}>{r.recommended_action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function AdvisorV2Body({ adv, memory, hotel, savedAt }: any) {
  const [openCase, setOpenCase] = useState<number | null>(null)
  const cases = (adv.top_moves || []).filter((m: any) => m.canonicalRecommendation?.case)

  if (!cases.length) {
    return (
      <div style={{ background: WHITE, border: '1px dashed ' + BORDER, borderRadius: 14, padding: '2.5rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.05rem', fontWeight: 600, color: TEXT, margin: '0 0 0.4rem' }}>Your briefing is being prepared</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: TEXT_MUTED, margin: 0, lineHeight: 1.6 }}>Your latest strategic analysis will appear here shortly.</p>
      </div>
    )
  }

  return (
    <div>
      {openCase !== null && cases[openCase] && (
        <CaseModal m={cases[openCase]} i={openCase} onClose={() => setOpenCase(null)} model={adv.visibility_model} savedAt={savedAt} />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.25rem', alignItems: 'start', marginBottom: '2rem' }}>
        <div>
          <AdvSectionLabel title="Strategic Priorities" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {cases.map((m: any, i: number) => (
              <PriorityCard key={i} m={m} i={i} onOpen={() => setOpenCase(i)} />
            ))}
          </div>
          
        </div>

        <div>
          <AdvSectionLabel title="AI Visibility Score" />
          <ScorePanel model={adv.visibility_model} />
          <FoundationsPanel foundations={adv.foundations} />
        </div>

        <div>
          <AdvSectionLabel title="Activity Since Last Audit" />
          <ActivityPanel memory={memory} />
          <div style={{ marginTop: '1rem' }}><KnowledgeIntegrityCard hotelId={hotel?.id} /></div>
          <GuestReviewCard adv={adv} />
        </div>
      </div>

      <AdvSectionLabel title="Evidence Behind This Advice" />
      <EvidenceRow adv={adv} hotel={hotel} />

      {adv.continuity && !adv.continuity.isFirstRun && adv.continuity.resolved && adv.continuity.resolved.length > 0 && (
        <div style={{ padding: '1.25rem 1.6rem', border: '1px solid rgba(63,125,91,0.25)', borderRadius: 14, background: 'rgba(63,125,91,0.04)', marginBottom: '0.85rem' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ADV_GREEN_C, margin: '0 0 0.6rem' }}>Completed since last audit</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {adv.continuity.resolved.map((d: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '0.55rem' }}>
                <span style={{ color: ADV_GREEN_C, fontSize: '0.85rem', flexShrink: 0 }}>✓</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 600, color: TEXT }}>{d.label}</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: TEXT_MUTED }}>— now complete</span>
              </div>
            ))}
          </div>
        </div>
      )}

      
    </div>
  )
}

// ── AI ADVISOR TAB — executive dashboard ──
function AdvisorTab({ hotel }: any) {
  const [data, setData] = useState<any>(null)
  const [memory, setMemory] = useState<any>(null)
  const [savedAt, setSavedAt] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hotel?.id) { setLoading(false); return }
    const load = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const [{ data: row }, { data: auditRows }] = await Promise.all([
          sb.from('hotel_consultant').select('advisory, based_on, created_at').eq('hotel_id', hotel.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          sb.from('hotel_audits').select('result, created_at').eq('hotel_id', hotel.id).order('created_at', { ascending: false }).limit(1),
        ])
        if (row) { setData(row); setSavedAt(row.created_at) }
        if (auditRows && auditRows.length) setMemory(auditRows[0].result?.memory || null)
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [hotel?.id])

  const adv = data?.advisory
  const cases = adv ? (adv.top_moves || []).filter((m: any) => m.canonicalRecommendation?.case) : []
  const overall = adv?.visibility_model?.overall ?? null

  return (
    <div>
      {/* EXECUTIVE BRIEF HERO */}
      <div style={{ background: 'linear-gradient(135deg, #2A1A0E 0%, #3D2810 100%)', borderRadius: 18, padding: '2.5rem 3rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,76,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.1rem', fontWeight: 400, color: WHITE, margin: '0 0 0.4rem', lineHeight: 1.1 }}>{hotel?.name || 'Your hotel'}</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.75)', margin: '0 0 1.1rem' }}>Your strategic briefing</p>
            {adv?.briefing_opening && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', fontWeight: 400, color: 'rgba(255,255,255,0.88)', margin: 0, lineHeight: 1.65, maxWidth: '60ch' }}>{adv.briefing_opening}</p>}
          </div>
          {adv && (
            <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'stretch', flexShrink: 0 }}>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.12)' }} />
              <div>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.6rem', fontWeight: 400, color: WHITE, margin: 0, lineHeight: 1 }}>{cases.length}</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.7)', margin: '0.35rem 0 0' }}>Strategic priorities</p>
              </div>
              {overall !== null && (
                <div>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.6rem', fontWeight: 400, color: GOLD, margin: 0, lineHeight: 1 }}>{overall}<span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>/100</span></p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.7)', margin: '0.35rem 0 0' }}>AI visibility score</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {loading && <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '3rem', textAlign: 'center' }}><p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', color: TEXT_MUTED, margin: 0 }}>Loading your advisory…</p></div>}

      {!loading && !adv && (
        <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 14, padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.1rem', fontWeight: 600, color: TEXT, margin: '0 0 0.5rem' }}>Your briefing is being prepared</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: TEXT_MUTED, margin: 0, lineHeight: 1.6, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>Your SwissNet specialist is preparing your strategic briefing. Your latest analysis will appear here.</p>
        </div>
      )}

      {!loading && adv && (
        <>
          <AdvisorV2Body adv={adv} memory={memory} hotel={hotel} savedAt={savedAt} />

          <AiPerformancePanel perf={adv.ai_performance} ga4Connected={hotel?.ga4_status === 'connected'} />

          {adv?.visibility_model && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2.5rem 0 1.5rem' }}>
                <div style={{ flex: 1, height: 1, background: BORDER }} />
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: TEXT_MUTED, margin: 0 }}>The analysis behind this briefing</p>
                <div style={{ flex: 1, height: 1, background: BORDER }} />
              </div>
              <VisibilityModelPanel model={adv.visibility_model} />
            </>
          )}

          {savedAt && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: TEXT_MUTED, margin: '1.25rem 0 0', textAlign: 'right' }}>Last generated: {new Date(savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
        </>
      )}
    </div>
  )
}

// ── GA4 ANALYTICS CONNECTION CARD ─────────────────────────────────────────────
// The hotel pastes our shared service-account email as a Viewer on their GA4
// property, enters their Property ID, and clicks Connect. The route runs one real
// test-pull to confirm access. Status is stored on the hotels row (ga4_status).
const GA4_SERVICE_ACCOUNT = 'swissnet-ga4-reader@swissnet-ga4.iam.gserviceaccount.com' // PLACEHOLDER — replace with real service-account email once Google Cloud is set up

function Ga4ConnectCard({ hotel }: any) {
  const [propertyId, setPropertyId] = useState<string>(hotel?.ga4_property_id || '')
  const [status, setStatus] = useState<string>(hotel?.ga4_status || 'not_connected')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const connected = status === 'connected'
  const error = status === 'error'

  const statusPill = () => {
    if (connected) return { txt: 'Connected', col: GREEN, bg: GREEN + '15', bd: GREEN + '30' }
    if (error) return { txt: 'Connection failed', col: RED, bg: RED + '12', bd: RED + '30' }
    if (status === 'pending') return { txt: 'Checking…', col: '#d97706', bg: '#d9770612', bd: '#d9770630' }
    return { txt: 'Not connected', col: TEXT_MUTED, bg: BG, bd: BORDER }
  }
  const pill = statusPill()

  const copyEmail = () => {
    navigator.clipboard?.writeText(GA4_SERVICE_ACCOUNT)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const connect = async () => {
    const id = propertyId.trim().replace(/[^0-9]/g, '')
    if (!id) { setMsg('Enter your GA4 Property ID (a number like 123456789).'); setTimeout(() => setMsg(''), 4000); return }
    setBusy(true); setMsg(''); setStatus('pending')
    try {
      const res = await fetch('/api/ga4-connect', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: hotel?.id, propertyId: id, password: 'RCrom2004Romeo' }),
      })
      const j = await res.json()
      if (res.ok && j?.status === 'connected') {
        setStatus('connected')
        setMsg(`Connected — we read ${j.sampleSessions ?? 0} sessions from the last 7 days.`)
      } else {
        setStatus('error')
        setMsg(j?.error || 'We could not read your property. Confirm you added the email as a Viewer, then try again.')
      }
    } catch (e: any) {
      setStatus('error')
      setMsg(e?.message || 'Request failed. Try again in a moment.')
    } finally {
      setBusy(false)
      setTimeout(() => setMsg(''), 7000)
    }
  }

  return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, overflow: 'hidden', marginBottom: '1rem' }}>
      <div style={{ padding: '1rem 1.5rem', background: BG, borderBottom: '1px solid ' + BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: 0 }}>Connect Google Analytics</p>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, color: pill.col, background: pill.bg, border: '1px solid ' + pill.bd, padding: '3px 10px', borderRadius: 20 }}>{pill.txt}</span>
      </div>
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: TEXT_MUTED, margin: '0 0 1.1rem', lineHeight: 1.7 }}>
          Connecting GA4 lets SwissNet see how real guests behave on the pages we recommend — so each recommendation can be backed by actual traffic and booking activity. Your data stays read-only and private to your dashboard.
        </p>

        {/* Step 1 — add our email */}
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.4rem' }}>Step 1 · Give us read access</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT, margin: '0 0 0.5rem', lineHeight: 1.6 }}>
          In Google Analytics, open <strong>Admin → Property Access Management</strong>, click <strong>+</strong>, and add this email as a <strong>Viewer</strong>:
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <code style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: TEXT, background: BG, border: '1px solid ' + BORDER, borderRadius: 6, padding: '0.5rem 0.75rem', flex: 1, minWidth: 220, wordBreak: 'break-all' }}>{GA4_SERVICE_ACCOUNT}</code>
          <button onClick={copyEmail} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, color: copied ? GREEN : TEXT_MUTED, background: WHITE, border: '1px solid ' + BORDER, borderRadius: 6, padding: '0.5rem 0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>{copied ? '✓ Copied' : 'Copy email'}</button>
        </div>

        {/* Step 2 — property id */}
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.4rem' }}>Step 2 · Enter your Property ID</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT, margin: '0 0 0.5rem', lineHeight: 1.6 }}>
          Find it in <strong>Admin → Property Settings</strong> — it’s a number like <code style={{ fontFamily: 'monospace', fontSize: '0.62rem', background: BG, padding: '1px 5px', borderRadius: 4 }}>123456789</code>.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={propertyId}
            onChange={e => setPropertyId(e.target.value)}
            placeholder="e.g. 123456789"
            style={{ flex: 1, minWidth: 180, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: TEXT, border: '1px solid ' + BORDER, borderRadius: 6, padding: '0.55rem 0.875rem', background: BG, outline: 'none', boxSizing: 'border-box' }}
          />
          <button onClick={connect} disabled={busy} style={{ background: GOLD, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 700, padding: '0.55rem 1.4rem', border: 'none', borderRadius: 6, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1, whiteSpace: 'nowrap' }}>{busy ? 'Connecting…' : connected ? 'Reconnect' : 'Connect'}</button>
        </div>

        {msg && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.64rem', color: error ? RED : connected ? GREEN : TEXT_MUTED, margin: '0.9rem 0 0', lineHeight: 1.6 }}>{msg}</p>}
      </div>
    </div>
  )
}

// ── SEARCH CONSOLE CONNECTION CARD ────────────────────────────────────────────
// Mirrors Ga4ConnectCard. Same shared service-account email (it can read both GA4
// and Search Console). The hotel adds it as a user in Search Console → Settings →
// Users and permissions, pastes their property string, and clicks Connect. The route
// runs one real test-pull. Status stored on hotels.gsc_status.
function GscConnectCard({ hotel }: any) {
  const [siteUrl, setSiteUrl] = useState<string>(hotel?.gsc_property || '')
  const [status, setStatus] = useState<string>(hotel?.gsc_status || 'not_connected')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const connected = status === 'connected'
  const error = status === 'error'

  const statusPill = () => {
    if (connected) return { txt: 'Connected', col: GREEN, bg: GREEN + '15', bd: GREEN + '30' }
    if (error) return { txt: 'Connection failed', col: RED, bg: RED + '12', bd: RED + '30' }
    if (status === 'pending') return { txt: 'Checking…', col: '#d97706', bg: '#d9770612', bd: '#d9770630' }
    return { txt: 'Not connected', col: TEXT_MUTED, bg: BG, bd: BORDER }
  }
  const pill = statusPill()

  const copyEmail = () => { navigator.clipboard?.writeText(GA4_SERVICE_ACCOUNT); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const connect = async () => {
    const site = siteUrl.trim()
    if (!site) { setMsg('Enter your Search Console property (e.g. https://www.yourhotel.com/ or sc-domain:yourhotel.com).'); setTimeout(() => setMsg(''), 4000); return }
    setBusy(true); setMsg(''); setStatus('pending')
    try {
      const res = await fetch('/api/gsc-connect', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: hotel?.id, siteUrl: site, password: 'RCrom2004Romeo' }),
      })
      const j = await res.json()
      if (res.ok && j?.status === 'connected') {
        setStatus('connected')
        setMsg(`Connected — we read ${j.sampleImpressions ?? 0} impressions of historical data.`)
      } else {
        setStatus('error')
        setMsg(j?.error || 'We could not read this property. Confirm the email was added in Search Console, then try again.')
      }
    } catch (e: any) {
      setStatus('error')
      setMsg(e?.message || 'Request failed. Try again in a moment.')
    } finally {
      setBusy(false); setTimeout(() => setMsg(''), 7000)
    }
  }

  return (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, overflow: 'hidden', marginBottom: '1rem' }}>
      <div style={{ padding: '1rem 1.5rem', background: BG, borderBottom: '1px solid ' + BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: 0 }}>Connect Search Console</p>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, color: pill.col, background: pill.bg, border: '1px solid ' + pill.bd, padding: '3px 10px', borderRadius: 20 }}>{pill.txt}</span>
      </div>
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: TEXT_MUTED, margin: '0 0 1.1rem', lineHeight: 1.7 }}>
          Search Console shows what guests actually search before they click — the impressions, click-through rate and exact queries your pages appear for. It lets each recommendation show the real search demand behind it. Read-only and private to your dashboard.
        </p>

        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.4rem' }}>Step 1 · Give us read access</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT, margin: '0 0 0.5rem', lineHeight: 1.6 }}>
          In Search Console, open <strong>Settings → Users and permissions</strong>, click <strong>Add user</strong>, and add this email with <strong>Full</strong> or <strong>Restricted</strong> access:
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <code style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: TEXT, background: BG, border: '1px solid ' + BORDER, borderRadius: 6, padding: '0.5rem 0.75rem', flex: 1, minWidth: 220, wordBreak: 'break-all' }}>{GA4_SERVICE_ACCOUNT}</code>
          <button onClick={copyEmail} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, color: copied ? GREEN : TEXT_MUTED, background: WHITE, border: '1px solid ' + BORDER, borderRadius: 6, padding: '0.5rem 0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>{copied ? '✓ Copied' : 'Copy email'}</button>
        </div>

        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.4rem' }}>Step 2 · Enter your property</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT, margin: '0 0 0.5rem', lineHeight: 1.6 }}>
          Copy it exactly as shown at the top of Search Console — a URL-prefix property like <code style={{ fontFamily: 'monospace', fontSize: '0.62rem', background: BG, padding: '1px 5px', borderRadius: 4 }}>https://www.yourhotel.com/</code> (keep the trailing slash) or a Domain property like <code style={{ fontFamily: 'monospace', fontSize: '0.62rem', background: BG, padding: '1px 5px', borderRadius: 4 }}>sc-domain:yourhotel.com</code>.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={siteUrl} onChange={e => setSiteUrl(e.target.value)} placeholder="e.g. https://www.yourhotel.com/" style={{ flex: 1, minWidth: 200, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: TEXT, border: '1px solid ' + BORDER, borderRadius: 6, padding: '0.55rem 0.875rem', background: BG, outline: 'none', boxSizing: 'border-box' }} />
          <button onClick={connect} disabled={busy} style={{ background: GOLD, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 700, padding: '0.55rem 1.4rem', border: 'none', borderRadius: 6, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1, whiteSpace: 'nowrap' }}>{busy ? 'Connecting…' : connected ? 'Reconnect' : 'Connect'}</button>
        </div>

        {msg && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.64rem', color: error ? RED : connected ? GREEN : TEXT_MUTED, margin: '0.9rem 0 0', lineHeight: 1.6 }}>{msg}</p>}
      </div>
    </div>
  )
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────

export default function DashboardClient({ hotel, views, clicks, leads, aiVisibility, googleAiScores, bookings, competitors, hotelCatScores, platformScores, overviewRunData, myRankChange, marketAverages, crawlerCount, accessHotels, activeHotelId, tier }: any) {
  const [tab, setTab] = useState('overview')
  const [period, setPeriod] = useState(30)
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(null)
  const [showRangePicker, setShowRangePicker] = useState(false)
  const [chartPeriod, setChartPeriod] = useState(7)
  const [chartPlatform, setChartPlatform] = useState('overall')
  const [visHover, setVisHover] = useState<number | null>(null)
  const [competitorView, setCompetitorView] = useState('region')
  const [optimiseTab, setOptimiseTab] = useState('overview')
  const [frozenMonths, setFrozenMonths] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!hotel?.id) return
    const load = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data } = await sb.from('monthly_scores').select('month, blended_score').eq('hotel_id', hotel.id)
        if (data) {
          const map: Record<string, number> = {}
          for (const row of data) map[row.month] = row.blended_score
          setFrozenMonths(map)
        }
      } catch {}
    }
    load()
  }, [hotel?.id])
  const hotelName = hotel?.name || 'Your Hotel'
  const hotelRegion = hotel?.region || 'Switzerland'

  // Scores from competitor_visibility (overview) + google AI
  const chatgptScore = platformScores?.chatgpt ?? null
  const perplexityScore = platformScores?.perplexity ?? null
  const googleScore = platformScores?.google_ai ?? null
  const visibilityScore = platformScores?.overall ?? 0

  // For chart — use overviewRunData grouped by date
  const runDates = [...new Set((overviewRunData || []).map((r: any) => r.run_date || r.checked_at?.split('T')[0]).filter(Boolean))].sort() as string[]

  // For "Where You Appear" and "Queries to Improve" — use hotelSpecificScores
  const rangeStartStr = customRange
  ? customRange.start
  : new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
const rangeEndStr = customRange
  ? customRange.end
  : new Date().toISOString().split('T')[0]
const inDateRange = (dateStr: string) => {
  const d = (dateStr || '').split('T')[0]
  return d >= rangeStartStr && d <= rangeEndStr
}
const myRunsInPeriod = (overviewRunData || []).filter((r: any) => inDateRange(r.run_date || r.checked_at))
const totalQueriesChatPerp = myRunsInPeriod.reduce((sum: number, r: any) => sum + (r.total_queries || 0), 0)
const appearedQueriesChatPerp = myRunsInPeriod.reduce((sum: number, r: any) => sum + (r.appearances || 0), 0)

// Add Google AI queries in period
const googleInPeriod = (googleAiScores || []).filter((r: any) => inDateRange(r.checked_at))
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
      return entry.visibility_score
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
const curMonthKey = curMonthStart.slice(0, 7)
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
      return entry.visibility_score
    }).filter((s): s is number => s !== null)
    const googleForDate = (googleAiScores || []).filter((r: any) => r.checked_at?.split('T')[0] === d)
    const googleDayScore = googleForDate.length > 0 ? Math.round((googleForDate.filter((r: any) => r.appeared).length / googleForDate.length) * 100) : null
    const allScores = [...latestPerPlatform, ...(googleDayScore !== null ? [googleDayScore] : [])]
    return allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null
  }).filter((s): s is number => s !== null)
  const liveScore = dailyAvgs.length > 0 ? Math.round(dailyAvgs.reduce((a, b) => a + b, 0) / dailyAvgs.length) : null
  const prevKey = prevStartStr.slice(0, 7)
  const score = frozenMonths[prevKey] ?? liveScore
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

  const tierRank: Record<string, number> = { monitor: 1, optimise: 2, premium: 3 }
  const myTier = tierRank[tier || 'monitor'] || 1
  const navGroups = [
    { heading: 'Monitor', items: [
      { id: 'overview', label: 'Overview' },
      { id: 'ai-visibility', label: 'AI Visibility' },
      { id: 'performance', label: 'Performance' },
      { id: 'competitors', label: 'Competitors' },
    ] },
    { heading: 'Improve', items: [
      { id: 'advisor', label: '✦ AI Advisor', minTier: 2 },
      { id: 'schema', label: 'SwissNet Profile', minTier: 2 },
      { id: 'website', label: 'Official Website', minTier: 2 },
      { id: 'optimise', label: 'Optimise', minTier: 2 },
      { id: 'citations', label: 'Citation Sources', minTier: 2 },
    ] },
    { heading: 'Account', items: [
      { id: 'reports', label: 'Monthly Reports', minTier: 3 },
      { id: 'settings', label: 'Settings' },
    ] },
  ].map(g => ({ ...g, items: g.items.filter((it: any) => !it.minTier || myTier >= it.minTier) }))
    .filter(g => g.items.length > 0)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: 'Montserrat, sans-serif' }}>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }`}</style>

      {/* SIDEBAR */}
      <div style={{ width: 210, background: WHITE, borderRight: '1px solid ' + BORDER, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 40 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid ' + BORDER }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: GOLD, margin: '0 0 0.15rem' }}>SwissNet <span style={{ fontStyle: 'italic', color: TEXT }}>Hotels</span></p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: TEXT_MUTED, margin: 0 }}>AI Visibility Platform</p>
          {accessHotels && accessHotels.length > 1 && (
            <select
              value={activeHotelId || hotel?.id || ''}
              onChange={e => { window.location.href = `/dashboard?hotel=${e.target.value}` }}
              style={{ marginTop: '0.85rem', width: '100%', padding: '0.45rem 0.6rem', borderRadius: 6, border: '1px solid ' + BORDER, background: BG, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
            >
              {accessHotels.map((h: any) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          )}
        </div>
        <div style={{ padding: '0.5rem 0', flex: 1 }}>
          {navGroups.map((group, gi) => (
            <div key={group.heading} style={{ marginTop: gi === 0 ? '0.5rem' : '1.25rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.5rem', padding: '0 1.5rem' }}>{group.heading}</p>
              {group.items.map(item => (
                <button key={item.id} onClick={() => setTab(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '0.6rem 1.5rem', background: tab === item.id ? GOLD_LIGHT : 'transparent', border: 'none', borderLeft: tab === item.id ? `3px solid ${GOLD}` : '3px solid transparent', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', fontWeight: tab === item.id ? 600 : 400, color: tab === item.id ? TEXT : TEXT_MUTED }}>{item.label}</span>
                </button>
              ))}
            </div>
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
      <div style={{ marginLeft: 210, flex: 1, padding: '2.5rem 3rem', minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', fontWeight: 300, color: TEXT, margin: '0 0 0.25rem' }}>
              {tab === 'overview' && `Welcome back, ${hotelName}`}
              {tab === 'ai-visibility' && 'AI Visibility'}
              {tab === 'performance' && 'Performance'}
              {tab === 'competitors' && 'Competitors'}
              {tab === 'schema' && '✦ SwissNet Profile'}
{tab === 'optimise' && '✦ Optimise'}
{tab === 'website' && '✦ Official Website'}
{tab === 'advisor' && '✦ AI Advisor'}
{tab === 'citations' && '✦ Citation Sources'}
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
{tab === 'website' && 'Build AI visibility on your own official site'}
{tab === 'advisor' && 'Your strategic brief, reasoned from what AI knows about you'}
{tab === 'citations' && 'Where AI gets its answers — and where to get listed'}
{tab === 'reports' && 'Compare your performance month over month'}
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
                  { label: 'Total Conversions', value: bookings?.length ? bookings.length : '—', sub: 'all time' },
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
<KPICard label="SwissNet Profile Views" value={recentViews.length} sub={`last ${period} days`} color={BLUE} spark={viewsByDay} />              <KPICard label="Direct Savings" value={recentBookings.length > 0 ? `CHF ${Math.round(recentBookings.reduce((sum: number, b: any) => sum + (b.total_chf || 0), 0) * 0.15).toLocaleString()}` : '—'} sub="vs OTA commissions" color={GREEN} />
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
            <QueryAppearanceBreakdown hotelId={hotel?.id} hotelName={hotelName} googleAiScores={googleAiScores} onAddFaq={() => setTab('optimise')} />
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
                  : ([...new Set((overviewRunData || []).filter((r: any) => r.platform === chartPlatform).map((r: any) => r.run_date || r.checked_at?.split('T')[0]).filter(Boolean))].sort() as string[])

                const realPoints = allDates.map((d: string) => {
                  if (chartPlatform === 'overall') {
                    const dayScoresAll = (overviewRunData || []).filter((r: any) => (r.run_date === d || r.checked_at?.startsWith(d)))
// Take only latest score per platform
const dayScores = ['chatgpt', 'perplexity'].map(platform => 
  dayScoresAll.filter((s: any) => s.platform === platform)
    .sort((a: any, b: any) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime())[0]
).filter(Boolean)
                    const adjustedScores = dayScores
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
                  const dayScores = (overviewRunData || []).filter((r: any) => (r.run_date === d || r.checked_at?.startsWith(d)) && r.platform === chartPlatform)
                  const adjustedDayScores = dayScores
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
                    {marketAvg !== null && (
                      <line x1={pL} y1={py(marketAvg)} x2={pL + cW} y2={py(marketAvg)} stroke="rgba(42,26,14,0.08)" strokeWidth="1" strokeDasharray="3 6" />
                    )}
                    {segments.map((s, i) => (<path key={i} d={`M${s.x1} ${s.y1} L${s.x2} ${s.y2} L${s.x2} ${pT + cH} L${s.x1} ${pT + cH} Z`} fill="url(#ag4)" />))}
                    {segments.map((s, i) => (<line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={GOLD} strokeWidth="2" strokeLinecap="round" opacity="0.9" />))}
                    {realPoints.map((d, i) => (
                      <circle key={i} cx={dateToX(d.date)} cy={py(d.score)} r={visHover === i ? 4 : 2.5} fill={visHover === i ? GOLD : WHITE} stroke={GOLD} strokeWidth="1.5" style={{ transition: 'r 0.12s ease' }} />
                    ))}
                    <line x1={pL} y1={pT + cH} x2={pL + cW} y2={pT + cH} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                    {xLabels.map((d, i) => (<text key={i} x={dateToX(d)} y={H - 4} textAnchor="middle" fill="rgba(42,26,14,0.3)" fontSize="7" fontFamily="Montserrat, sans-serif">{new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</text>))}
                    <rect x={pL} y={pT} width={cW} height={cH} fill="transparent"
                      onMouseMove={(e) => {
                        const svg = e.currentTarget.ownerSVGElement
                        if (!svg) return
                        const r = svg.getBoundingClientRect()
                        const svgX = ((e.clientX - r.left) / r.width) * W
                        let best = 0, bestD = Infinity
                        realPoints.forEach((p, i) => { const dx = Math.abs(dateToX(p.date) - svgX); if (dx < bestD) { bestD = dx; best = i } })
                        setVisHover(best)
                      }}
                      onMouseLeave={() => setVisHover(null)}
                    />
                    {visHover !== null && realPoints[visHover] && (() => {
                      const d = realPoints[visHover]
                      const x = dateToX(d.date), yv = py(d.score)
                      const boxW = 72, boxH = 36
                      const bx = Math.min(Math.max(x - boxW / 2, pL), pL + cW - boxW)
                      const above = yv > pT + 52
                      const by = above ? yv - boxH - 13 : yv + 13
                      return (
                        <g style={{ pointerEvents: 'none' }}>
                          <line x1={x} y1={pT} x2={x} y2={pT + cH} stroke="rgba(42,26,14,0.14)" strokeWidth="1" strokeDasharray="2 3" />
                          <circle cx={x} cy={yv} r="6" fill={GOLD} opacity="0.12" />
                          <rect x={bx} y={by} width={boxW} height={boxH} rx="7" fill={WHITE} stroke={BORDER} strokeWidth="1" style={{ filter: 'drop-shadow(0 3px 8px rgba(42,26,14,0.14))' }} />
                          <text x={bx + boxW / 2} y={by + 14} textAnchor="middle" fill={TEXT_MUTED} fontSize="6.5" fontFamily="Montserrat, sans-serif" style={{ letterSpacing: '0.05em' }}>{new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</text>
                          <text x={bx + boxW / 2} y={by + 27} textAnchor="middle" fill={TEXT} fontSize="9" fontFamily="Montserrat, sans-serif" fontWeight="700">{d.score}%</text>
                        </g>
                      )
                    })()}
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
              <KPICard label="Conversion Rate" value={recentBookings.length > 0 ? conversionRate + '%' : '—'} sub="clicks to enquiries" color={PURPLE} />
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
  <SchemaTab hotel={hotel} hotelId={hotel?.id} onGoToOptimise={(tab) => { setTab('optimise'); setOptimiseTab(tab || 'overview') }} />
)}

        {/* ── OPTIMISE ── */}
        {tab === 'optimise' && (
          <OptimiseTab hotelId={hotel?.id} hotelName={hotelName} hotelSlug={hotel?.slug} hotel={hotel} initialTab={optimiseTab} />
        )}

        {/* ── CITATION SOURCES ── */}
        {tab === 'citations' && (
          <CitationSourcesTab hotelName={hotelName} hotelRegion={hotelRegion} hotelId={hotel?.id} />
        )}
        {tab === 'website' && <WebsiteTab hotel={hotel} />}
        {tab === 'advisor' && <AdvisorTab hotel={hotel} />}

        {/* ── REPORTS ── */}
        {tab === 'reports' && (
          <ComparisonReport
            hotelId={hotel?.id}
            hotelName={hotelName}
            hotelRegion={hotelRegion}
            overviewRunData={overviewRunData}
            googleAiScores={googleAiScores}
            views={views}
            clicks={clicks}
            categoryLabels={categoryLabels}
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
            {/* ── GA4 ANALYTICS CONNECTION ── */}
            <Ga4ConnectCard hotel={hotel} />

            {/* ── SEARCH CONSOLE CONNECTION ── */}
            <GscConnectCard hotel={hotel} />

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