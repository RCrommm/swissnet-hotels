'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const COLORS = {
  bg: '#492816', bgCard: '#5C3320', gold: '#C9A84C', goldLight: '#E8C87A',
  text: '#F5EDD8', textMuted: '#C4A882', border: 'rgba(201,168,76,0.25)',
  danger: '#D64045', success: '#4CAF50', inputBg: 'rgba(0,0,0,0.25)',
}

const BEST_FOR_OPTIONS = [
  'Honeymooners', 'Couples', 'Families', 'Business Travelers', 'Solo Travelers',
  'Wellness Seekers', 'Ski Lovers', 'Foodies', 'Art Lovers', 'Nature Lovers',
  'Luxury Travelers', 'Ultra Luxury', 'Celebrity Privacy', 'Adventure Seekers',
  'History Enthusiasts', 'Design Lovers', 'Pet Friendly', 'Groups',
]

interface FAQ { question: string; answer: string }
interface Alternative { name: string; reason: string; url?: string }

export default function ContentSchema({ hotelId, hotelName }: { hotelId: string; hotelName: string }) {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [verdict, setVerdict] = useState('')
  const [bestFor, setBestFor] = useState<string[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([{ question: '', answer: '' }])
  const [alternatives, setAlternatives] = useState<Alternative[]>([{ name: '', reason: '', url: '' }])

  const fetchContent = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('hotel_content')
      .select('*')
      .eq('hotel_id', hotelId)
      .single()
    if (data) {
      setVerdict(data.verdict || '')
      setBestFor(data.best_for_extended || [])
      setFaqs(data.faqs?.length ? data.faqs : [{ question: '', answer: '' }])
      setAlternatives(data.nearby_alternatives?.length ? data.nearby_alternatives : [{ name: '', reason: '', url: '' }])
    } else {
      setVerdict('')
      setBestFor([])
      setFaqs([{ question: '', answer: '' }])
      setAlternatives([{ name: '', reason: '', url: '' }])
    }
    setLoading(false)
  }, [hotelId])

  useEffect(() => { fetchContent() }, [fetchContent])

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text }); setTimeout(() => setMsg(null), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    const cleanFaqs = faqs.filter(f => f.question.trim() && f.answer.trim())
    const cleanAlts = alternatives.filter(a => a.name.trim())
    const payload = {
      hotel_id: hotelId,
      verdict: verdict || null,
      best_for_extended: bestFor,
      faqs: cleanFaqs,
      nearby_alternatives: cleanAlts,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('hotel_content').upsert(payload, { onConflict: 'hotel_id' })
    setSaving(false)
    if (error) showMsg('error', error.message)
    else showMsg('success', 'Content saved!')
  }

  const toggleBestFor = (val: string) => {
    setBestFor(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])
  }

  const updateFaq = (i: number, field: 'question' | 'answer', val: string) => {
    setFaqs(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: val } : f))
  }

  const updateAlt = (i: number, field: keyof Alternative, val: string) => {
    setAlternatives(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a))
  }

  const S: Record<string, React.CSSProperties> = {
    sectionTitle: { color: COLORS.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8, marginBottom: 16, marginTop: 24 },
    label: { color: COLORS.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 },
    input: { background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', color: COLORS.text, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' as const },
    textarea: { background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', color: COLORS.text, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' as const, minHeight: 100, resize: 'vertical' as const, fontFamily: 'inherit' },
    card: { background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 12 },
    btnGold: { background: COLORS.gold, color: '#1a0e06', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' },
    btnOutline: { background: 'transparent', color: COLORS.gold, border: `1px solid ${COLORS.gold}`, padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
    btnDanger: { background: 'transparent', color: COLORS.danger, border: `1px solid ${COLORS.danger}44`, padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' },
    tag: (active: boolean): React.CSSProperties => ({
      padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
      border: `1px solid ${active ? COLORS.gold : COLORS.border}`,
      background: active ? COLORS.gold + '22' : 'transparent',
      color: active ? COLORS.goldLight : COLORS.textMuted,
    }),
  }

  if (loading) return <div style={{ color: COLORS.textMuted, padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ padding: '8px 0' }}>
      {msg && (
        <div style={{ padding: '12px 20px', borderRadius: 8, marginBottom: 20, fontSize: 14,
          background: msg.type === 'success' ? COLORS.success + '22' : COLORS.danger + '22',
          color: msg.type === 'success' ? COLORS.success : COLORS.danger }}>
          {msg.text}
        </div>
      )}

      <div style={{ color: COLORS.gold, fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
        ✦ Content — {hotelName}
      </div>

      {/* Verdict */}
      <div style={S.sectionTitle}>Verdict</div>
      <p style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 10 }}>
        One strong paragraph summing up who this hotel is best for. AI crawlers quote this directly.
      </p>
      <textarea
        value={verdict}
        onChange={e => setVerdict(e.target.value)}
        style={{ ...S.textarea, borderColor: COLORS.gold + '55', minHeight: 120 }}
        placeholder={`e.g. ${hotelName} is the finest choice for couples and honeymooners seeking alpine luxury with Matterhorn views. Its combination of historic grandeur, world-class spa and ski-in access makes it unmatched in Zermatt for a romantic escape.`}
      />

      {/* Best For */}
      <div style={S.sectionTitle}>Best For</div>
      <p style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 12 }}>
        Select all traveller types this hotel suits — used in schema and AI matching.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {BEST_FOR_OPTIONS.map(opt => (
          <span key={opt} style={S.tag(bestFor.includes(opt))} onClick={() => toggleBestFor(opt)}>{opt}</span>
        ))}
      </div>

      {/* FAQs */}
      <div style={S.sectionTitle}>FAQs</div>
      <p style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 12 }}>
        Write 5–8 questions guests actually ask. These become FAQPage schema — AI answers questions directly from these.
      </p>
      {faqs.map((faq, i) => (
        <div key={i} style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: COLORS.gold, fontSize: 12, fontWeight: 700 }}>Q{i + 1}</span>
            {faqs.length > 1 && (
              <button style={S.btnDanger} onClick={() => setFaqs(prev => prev.filter((_, idx) => idx !== i))}>Remove</button>
            )}
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={S.label}>Question</label>
            <input
              value={faq.question}
              onChange={e => updateFaq(i, 'question', e.target.value)}
              style={S.input}
              placeholder={`e.g. Is ${hotelName} good for a honeymoon?`}
            />
          </div>
          <div>
            <label style={S.label}>Answer</label>
            <textarea
              value={faq.answer}
              onChange={e => updateFaq(i, 'answer', e.target.value)}
              style={{ ...S.textarea, minHeight: 80 }}
              placeholder="Write a clear, helpful answer..."
            />
          </div>
        </div>
      ))}
      <button style={S.btnOutline} onClick={() => setFaqs(prev => [...prev, { question: '', answer: '' }])}>
        + Add FAQ
      </button>

      {/* Nearby Alternatives */}
      <div style={S.sectionTitle}>Nearby Alternatives</div>
      <p style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 12 }}>
        2–3 comparable hotels. AI uses these for comparison queries like "X vs Y".
      </p>
      {alternatives.map((alt, i) => (
        <div key={i} style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: COLORS.gold, fontSize: 12, fontWeight: 700 }}>Alternative {i + 1}</span>
            {alternatives.length > 1 && (
              <button style={S.btnDanger} onClick={() => setAlternatives(prev => prev.filter((_, idx) => idx !== i))}>Remove</button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 10 }}>
            <div>
              <label style={S.label}>Hotel Name</label>
              <input value={alt.name} onChange={e => updateAlt(i, 'name', e.target.value)} style={S.input} placeholder="e.g. The Omnia" />
            </div>
            <div>
              <label style={S.label}>URL (optional)</label>
              <input value={alt.url || ''} onChange={e => updateAlt(i, 'url', e.target.value)} style={S.input} placeholder="https://swissnethotels.com/hotels/..." />
            </div>
          </div>
          <div>
            <label style={S.label}>Why consider it instead</label>
            <input value={alt.reason} onChange={e => updateAlt(i, 'reason', e.target.value)} style={S.input} placeholder="e.g. Better for design lovers, more boutique feel" />
          </div>
        </div>
      ))}
      <button style={S.btnOutline} onClick={() => setAlternatives(prev => [...prev, { name: '', reason: '', url: '' }])}>
        + Add Alternative
      </button>

      {/* Save */}
      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
        <button style={{ ...S.btnGold, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Content'}
        </button>
      </div>
    </div>
  )
}