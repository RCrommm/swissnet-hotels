'use client'
import { useState } from 'react'

interface Props {
  hotels: any[]
  keywords: any[]
  password: string
}

export default function KeywordsTab({ hotels, keywords: initialKeywords, password }: Props) {
  const [keywords, setKeywords] = useState(initialKeywords)
  const [selectedHotel, setSelectedHotel] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  const [priority, setPriority] = useState('1')
  const [loading, setLoading] = useState(false)
  const [filterHotel, setFilterHotel] = useState('')
  const [success, setSuccess] = useState(false)

  const gold = '#C9A84C'
  const border = 'rgba(201,169,110,0.2)'
  const text = '#2A1A0E'
  const textMuted = 'rgba(42,26,14,0.45)'
  const bg = '#F8F5EF'
  const bgSection = '#F2EAE0'

  const filteredKeywords = filterHotel
    ? keywords.filter(k => k.hotel_id === filterHotel)
    : keywords

  const handleAdd = async () => {
    if (!selectedHotel || !newKeyword) return
    setLoading(true)
    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: selectedHotel, keyword: newKeyword.toLowerCase(), priority: parseInt(priority) })
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

  return (
    <div>
      {/* Add keyword form */}
      <div style={{ background: '#fff', border: '1px solid ' + border, padding: '1.75rem', marginBottom: '1.5rem', boxShadow: '0 2px 16px rgba(201,169,110,0.07)' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: text, margin: '0 0 1.25rem', fontWeight: 400 }}>Add Keyword</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: '0.875rem', alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>Hotel</label>
            <select value={selectedHotel} onChange={e => setSelectedHotel(e.target.value)} style={{ ...inputStyle, background: bg }}>
              <option value="">Select hotel</option>
              {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Keyword Phrase</label>
            <input
              type="text"
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="e.g. best luxury ski hotel zermatt february"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} style={{ ...inputStyle, background: bg }}>
              <option value="1">Priority 1 — Highest</option>
              <option value="2">Priority 2</option>
              <option value="3">Priority 3</option>
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
            {loading ? 'Adding...' : success ? '✓ Added' : 'Add Keyword'}
          </button>
        </div>

        <div style={{ marginTop: '1rem', padding: '0.875rem', background: bgSection, borderLeft: '2px solid ' + gold }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: 0, lineHeight: 1.6 }}>
            <span style={{ color: gold, fontWeight: 600 }}>Priority 1</span> = highest boost in AI search results. Use exact phrases people type into ChatGPT — e.g. <em>"best romantic hotel zermatt matterhorn view"</em>. The more specific, the better.
          </p>
        </div>
      </div>

      {/* Filter + count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: 0 }}>
          {filteredKeywords.length} keyword{filteredKeywords.length !== 1 ? 's' : ''}
          {filterHotel && ` for ${hotels.find(h => h.id === filterHotel)?.name}`}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ ...labelStyle, margin: 0 }}>Filter by hotel</label>
          <select
            value={filterHotel}
            onChange={e => setFilterHotel(e.target.value)}
            style={{ background: '#fff', border: '1px solid ' + border, color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', padding: '0.4rem 0.75rem', outline: 'none' }}
          >
            <option value="">All hotels</option>
            {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
      </div>

      {/* Keywords table */}
      <div style={{ background: '#fff', border: '1px solid ' + border, overflow: 'hidden', boxShadow: '0 2px 16px rgba(201,169,110,0.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.7rem' }}>
          <thead>
            <tr style={{ background: bgSection }}>
              {['Keyword', 'Hotel', 'Priority', 'Added', 'Action'].map(h => (
                <th key={h} style={{ textAlign: 'left' as const, padding: '0.75rem 1rem', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: textMuted, borderBottom: '1px solid ' + border }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredKeywords.map((kw) => (
              <tr key={kw.id} style={{ background: '#fff', borderBottom: '1px solid ' + border }}>
                <td style={{ padding: '0.875rem 1rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: text, fontWeight: 500 }}>{kw.keyword}</td>
                <td style={{ padding: '0.875rem 1rem', color: textMuted }}>{kw.hotels?.name || '—'}</td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <span style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    padding: '0.2rem 0.6rem',
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
            ))}
          </tbody>
        </table>
        {filteredKeywords.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center' as const }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: textMuted }}>No keywords yet</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>Add your first keyword above to boost hotel visibility in AI search</p>
          </div>
        )}
      </div>

      {/* Test section */}
      <div style={{ background: '#fff', border: '1px solid ' + border, padding: '1.25rem', marginTop: '1.5rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, color: textMuted, letterSpacing: '0.15em', textTransform: 'uppercase' as const, margin: '0 0 0.5rem' }}>Test Your Keywords</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: '0 0 0.75rem' }}>Open this URL to see which hotels appear for a query:</p>
        <code style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: text, background: bgSection, padding: '0.5rem 0.875rem', display: 'block', border: '1px solid ' + border }}>
          /api/recommend?q=luxury+ski+hotel+zermatt&limit=3
        </code>
      </div>
    </div>
  )
}