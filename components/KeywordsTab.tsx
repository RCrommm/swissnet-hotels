'use client'
import { useState } from 'react'

interface Props {
  hotels: any[]
  keywords: any[]
  password: string
}

const INTENT_TYPES = [
  { value: 'romantic', label: '💑 Romantic', color: '#e879a0' },
  { value: 'family', label: '👨‍👩‍👧 Family', color: '#60a5fa' },
  { value: 'business', label: '💼 Business', color: '#818cf8' },
  { value: 'wellness', label: '🧘 Wellness', color: '#34d399' },
  { value: 'ski', label: '⛷️ Ski', color: '#38bdf8' },
  { value: 'location', label: '📍 Location', color: '#fb923c' },
  { value: 'comparison', label: '🔄 Comparison', color: '#a78bfa' },
  { value: 'occasion', label: '🎉 Occasion', color: '#fbbf24' },
  { value: 'luxury', label: '✦ Luxury', color: '#C9A84C' },
  { value: 'general', label: '🔍 General', color: '#94a3b8' },
]

const INTENT_EXAMPLES: Record<string, string[]> = {
  romantic: [
    'best romantic hotel zermatt matterhorn view',
    'luxury honeymoon hotel switzerland with spa',
    'most romantic hotel geneva lake view',
  ],
  family: [
    'best family hotel zermatt with kids activities',
    'luxury family resort interlaken jungfrau',
  ],
  business: [
    'best business hotel geneva with meeting rooms',
    'luxury hotel zurich city centre conference facilities',
  ],
  wellness: [
    'best spa hotel switzerland alpine wellness',
    'luxury hotel zermatt with indoor pool and spa',
  ],
  ski: [
    'ski in ski out hotel zermatt matterhorn',
    'best hotel near zermatt ski slopes luxury',
  ],
  location: [
    'luxury hotel walking distance matterhorn',
    'hotel on lake geneva waterfront five star',
  ],
  comparison: [
    'alternative to the omnia zermatt',
    'better than zermatterhof direct booking',
  ],
  occasion: [
    'best hotel switzerland for anniversary dinner',
    'luxury new year hotel zermatt with fireworks view',
  ],
  luxury: [
    'most luxurious hotel in zermatt five star',
    'best five star hotel switzerland direct booking',
  ],
  general: [
    'best luxury hotels in switzerland',
    'top rated swiss alpine hotels',
  ],
}

export default function KeywordsTab({ hotels, keywords: initialKeywords, password }: Props) {
  const [keywords, setKeywords] = useState(initialKeywords)
  const [selectedHotel, setSelectedHotel] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  const [intentType, setIntentType] = useState('general')
  const [priority, setPriority] = useState('1')
  const [loading, setLoading] = useState(false)
  const [filterHotel, setFilterHotel] = useState('')
  const [filterIntent, setFilterIntent] = useState('')
  const [success, setSuccess] = useState(false)
  const [showExamples, setShowExamples] = useState(false)

  const gold = '#C9A84C'
  const border = 'rgba(201,169,110,0.2)'
  const text = '#2A1A0E'
  const textMuted = 'rgba(42,26,14,0.45)'
  const bg = '#F8F5EF'
  const bgSection = '#F2EAE0'

  const filteredKeywords = keywords.filter(k => {
    if (filterHotel && k.hotel_id !== filterHotel) return false
    if (filterIntent && k.intent_type !== filterIntent) return false
    return true
  })

  const handleAdd = async () => {
    if (!selectedHotel || !newKeyword) return
    setLoading(true)
    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: selectedHotel,
          keyword: newKeyword.toLowerCase(),
          intent_type: intentType,
          priority: parseInt(priority),
        })
      })
      const data = await res.json()
      if (data.success) {
        const hotel = hotels.find(h => h.id === selectedHotel)
        setKeywords(prev => [...prev, { ...data.keyword, hotels: { name: hotel?.name } }])
        setNewKeyword('')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch('/api/keywords?id=' + id, { method: 'DELETE' })
    setKeywords(prev => prev.filter(k => k.id !== id))
  }

  const selectedIntent = INTENT_TYPES.find(i => i.value === intentType)
  const examples = INTENT_EXAMPLES[intentType] || []

  const inputStyle = {
    background: '#fff',
    border: '1px solid ' + border,
    color: text,
    fontFamily: 'Montserrat, sans-serif',
    fontSize: '0.75rem',
    padding: '0.65rem 0.875rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: '0.55rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    color: textMuted,
    marginBottom: '0.4rem',
  }

  const getIntentColor = (intent: string) => INTENT_TYPES.find(i => i.value === intent)?.color || '#94a3b8'
  const getIntentLabel = (intent: string) => INTENT_TYPES.find(i => i.value === intent)?.label || intent

  return (
    <div>
      {/* Intent type explainer */}
      <div style={{ background: '#fff', border: '1px solid ' + border, padding: '1.5rem', marginBottom: '1.5rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, color: textMuted, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 0.75rem' }}>How AI Intent Phrases Work</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: text, lineHeight: 1.7, margin: '0 0 0.75rem' }}>
          These are full phrases people type into <strong>ChatGPT, Perplexity and Google AI</strong> when searching for hotels. Unlike traditional SEO keywords, these match the <em>intent</em> behind a search — not just the words.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div style={{ background: bgSection, padding: '0.75rem', borderLeft: '2px solid #dc2626' }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: '#dc2626', fontWeight: 600, margin: '0 0 0.3rem' }}>❌ Old way (SEO keywords)</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: 0 }}>luxury, spa, zermatt, mountain, hotel</p>
          </div>
          <div style={{ background: bgSection, padding: '0.75rem', borderLeft: '2px solid #16a34a' }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: '#16a34a', fontWeight: 600, margin: '0 0 0.3rem' }}>✓ New way (AI intent phrases)</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: 0 }}>best romantic hotel zermatt matterhorn view with spa</p>
          </div>
        </div>
      </div>

      {/* Add keyword form */}
      <div style={{ background: '#fff', border: '1px solid ' + border, padding: '1.75rem', marginBottom: '1.5rem' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: text, margin: '0 0 1.25rem', fontWeight: 400 }}>Add Intent Phrase</p>

        {/* Intent type selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>Intent Type</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {INTENT_TYPES.map(intent => (
              <button
                key={intent.value}
                onClick={() => setIntentType(intent.value)}
                style={{
                  padding: '0.4rem 0.875rem',
                  border: `1px solid ${intentType === intent.value ? intent.color : border}`,
                  background: intentType === intent.value ? intent.color + '22' : '#fff',
                  color: intentType === intent.value ? intent.color : textMuted,
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '0.65rem',
                  fontWeight: intentType === intent.value ? 600 : 400,
                  cursor: 'pointer',
                  borderRadius: 20,
                  transition: 'all .15s',
                }}
              >
                {intent.label}
              </button>
            ))}
          </div>
        </div>

        {/* Examples */}
        {examples.length > 0 && (
          <div style={{ marginBottom: '1rem', background: bgSection, padding: '0.875rem', borderLeft: `2px solid ${selectedIntent?.color}` }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, color: textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>
              Example {selectedIntent?.label} phrases — click to use
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {examples.map(ex => (
                <span
                  key={ex}
                  onClick={() => setNewKeyword(ex)}
                  style={{
                    fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem',
                    color: selectedIntent?.color, cursor: 'pointer',
                    background: '#fff', border: `1px solid ${selectedIntent?.color}44`,
                    padding: '0.25rem 0.625rem', borderRadius: 4,
                  }}
                >
                  {ex}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: '0.875rem', alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>Hotel</label>
            <select value={selectedHotel} onChange={e => setSelectedHotel(e.target.value)} style={{ ...inputStyle, background: bg }}>
              <option value="">Select hotel</option>
              {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Intent Phrase</label>
            <input
              type="text"
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder={`e.g. ${examples[0] || 'best luxury hotel switzerland...'}`}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} style={{ ...inputStyle, background: bg }}>
              <option value="1">P1 — Primary</option>
              <option value="2">P2 — Secondary</option>
              <option value="3">P3 — Supporting</option>
            </select>
          </div>

          <button
            onClick={handleAdd}
            disabled={loading || !selectedHotel || !newKeyword}
            style={{
              background: success ? '#16a34a' : gold,
              color: '#fff',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase' as const,
              padding: '0.65rem 1.25rem',
              border: 'none',
              cursor: loading || !selectedHotel || !newKeyword ? 'not-allowed' : 'pointer',
              opacity: !selectedHotel || !newKeyword ? 0.5 : 1,
              whiteSpace: 'nowrap' as const,
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Adding...' : success ? '✓ Added' : 'Add Phrase'}
          </button>
        </div>
      </div>

      {/* Filter + count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: 0 }}>
          {filteredKeywords.length} phrase{filteredKeywords.length !== 1 ? 's' : ''}
          {filterHotel && ` · ${hotels.find(h => h.id === filterHotel)?.name}`}
          {filterIntent && ` · ${getIntentLabel(filterIntent)}`}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select value={filterHotel} onChange={e => setFilterHotel(e.target.value)} style={{ background: '#fff', border: '1px solid ' + border, color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', padding: '0.4rem 0.75rem', outline: 'none' }}>
            <option value="">All hotels</option>
            {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <select value={filterIntent} onChange={e => setFilterIntent(e.target.value)} style={{ background: '#fff', border: '1px solid ' + border, color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', padding: '0.4rem 0.75rem', outline: 'none' }}>
            <option value="">All intents</option>
            {INTENT_TYPES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        </div>
      </div>

      {/* Keywords table */}
      <div style={{ background: '#fff', border: '1px solid ' + border, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.7rem' }}>
          <thead>
            <tr style={{ background: bgSection }}>
              {['Intent Phrase', 'Hotel', 'Intent Type', 'Priority', 'Added', 'Action'].map(h => (
                <th key={h} style={{ textAlign: 'left' as const, padding: '0.75rem 1rem', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: textMuted, borderBottom: '1px solid ' + border }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredKeywords.map((kw) => {
              const intentColor = getIntentColor(kw.intent_type || 'general')
              return (
                <tr key={kw.id} style={{ background: '#fff', borderBottom: '1px solid ' + border }}>
                  <td style={{ padding: '0.875rem 1rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: text, fontWeight: 500, maxWidth: 320 }}>{kw.keyword}</td>
                  <td style={{ padding: '0.875rem 1rem', color: textMuted, fontSize: '0.68rem' }}>{kw.hotels?.name || '—'}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{
                      fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600,
                      padding: '0.2rem 0.625rem', borderRadius: 20,
                      background: intentColor + '18', color: intentColor,
                      border: `1px solid ${intentColor}44`,
                    }}>
                      {getIntentLabel(kw.intent_type || 'general')}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{
                      fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600,
                      letterSpacing: '0.1em', padding: '0.2rem 0.6rem',
                      background: kw.priority === 1 ? 'rgba(201,169,110,0.15)' : kw.priority === 2 ? 'rgba(59,130,246,0.1)' : bgSection,
                      color: kw.priority === 1 ? gold : kw.priority === 2 ? '#3b82f6' : textMuted,
                    }}>
                      P{kw.priority}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: textMuted, fontSize: '0.65rem' }}>{new Date(kw.created_at).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <button onClick={() => handleDelete(kw.id)} style={{ background: 'none', border: 'none', color: '#dc2626', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredKeywords.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center' as const }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: textMuted }}>No intent phrases yet</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>Add phrases above to boost AI search visibility</p>
          </div>
        )}
      </div>

      {/* Test section */}
      <div style={{ background: '#fff', border: '1px solid ' + border, padding: '1.25rem', marginTop: '1.5rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, color: textMuted, letterSpacing: '0.15em', textTransform: 'uppercase' as const, margin: '0 0 0.5rem' }}>Test Your Phrases</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: '0 0 0.75rem' }}>Open this URL to see which hotels match a query:</p>
        <code style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: text, background: bgSection, padding: '0.5rem 0.875rem', display: 'block', border: '1px solid ' + border }}>
          /api/recommend?q=luxury+romantic+hotel+zermatt+matterhorn+view&limit=3
        </code>
      </div>
    </div>
  )
}