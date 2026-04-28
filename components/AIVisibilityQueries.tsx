'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const QUERY_SUGGESTIONS: Record<string, string[]> = {
  'Zermatt': [
    'best luxury hotel in Zermatt with Matterhorn view',
    'most romantic hotel Zermatt Switzerland',
    'best ski hotel Zermatt',
    'luxury hotel Zermatt honeymoon',
    'best 5 star hotel Zermatt',
    'Zermatt hotel with spa and pool',
  ],
  'Geneva': [
    'best luxury hotel Geneva lake view',
    'top 5 star hotel Geneva Switzerland',
    'best business hotel Geneva',
    'romantic hotel Geneva Switzerland',
    'luxury hotel Geneva for couples',
  ],
  'St. Moritz': [
    'best luxury hotel St Moritz Switzerland',
    'top ski hotel St Moritz',
    'best 5 star hotel St Moritz',
    'luxury winter hotel St Moritz',
  ],
  'Interlaken': [
    'best luxury hotel Interlaken Jungfrau view',
    'top wellness hotel Interlaken Switzerland',
    'luxury spa hotel Interlaken',
    'best hotel Interlaken mountains',
  ],
  'Zurich': [
    'best luxury hotel Zurich Switzerland',
    'top 5 star hotel Zurich city centre',
    'best business hotel Zurich',
    'luxury boutique hotel Zurich',
  ],
  'Gstaad': [
    'best luxury hotel Gstaad Switzerland',
    'top ski hotel Gstaad Alps',
    'most exclusive hotel Gstaad',
  ],
  'Lucerne': [
    'best luxury hotel Lucerne lake view',
    'top 5 star hotel Lucerne Switzerland',
    'romantic hotel Lucerne Switzerland',
  ],
  'Verbier': [
    'best luxury ski hotel Verbier Switzerland',
    'top hotel Verbier Alps',
    'luxury chalet hotel Verbier',
  ],
  'default': [
    'best luxury hotel Switzerland Alps',
    'finest Swiss luxury hotel',
    'best 5 star hotel Switzerland',
    'top rated luxury hotel Switzerland',
  ]
}

export default function AIVisibilityQueries({ hotels }: { hotels: any[] }) {
  const [selectedHotelId, setSelectedHotelId] = useState(hotels[0]?.id || '')
  const [queries, setQueries] = useState<any[]>([])
  const [newQuery, setNewQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const hotel = hotels.find(h => h.id === selectedHotelId) || hotels[0]
  const suggestions = QUERY_SUGGESTIONS[hotel?.region] || QUERY_SUGGESTIONS['default']

  const gold = '#C9A84C'
  const border = 'rgba(201,169,110,0.2)'
  const text = '#2A1A0E'
  const textMuted = 'rgba(42,26,14,0.45)'
  const bg = '#F8F5EF'

  const fetchQueries = useCallback(async () => {
    if (!selectedHotelId) return
    const { data } = await supabase
      .from('ai_visibility_queries')
      .select('*')
      .eq('hotel_id', selectedHotelId)
      .order('created_at', { ascending: true })
    setQueries(data || [])
  }, [selectedHotelId])

  useEffect(() => { fetchQueries() }, [fetchQueries])

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  const addQuery = async (queryText: string) => {
    const q = queryText.trim()
    if (!q) return
    if (queries.find(x => x.query === q)) return showMsg('error', 'Query already exists')
    const { error } = await supabase.from('ai_visibility_queries').insert({
      hotel_id: selectedHotelId,
      hotel_name: hotel?.name,
      query: q,
      is_active: true,
    })
    if (error) showMsg('error', error.message)
    else { showMsg('success', 'Query added!'); setNewQuery(''); fetchQueries() }
  }

  const deleteQuery = async (id: string) => {
    await supabase.from('ai_visibility_queries').delete().eq('id', id)
    fetchQueries()
  }

  const toggleQuery = async (id: string, current: boolean) => {
    await supabase.from('ai_visibility_queries').update({ is_active: !current }).eq('id', id)
    fetchQueries()
  }

  const runForHotel = async () => {
    setRunning(true)
    setRunResult(null)
    try {
      const res = await fetch('/api/cron/ai-visibility?hotel_id=' + selectedHotelId)
      const data = await res.json()
      setRunResult(`✓ Done — ${data.total_appearances || 0} appearances in ${data.queries_run || 0} queries`)
      fetchQueries()
    } catch {
      setRunResult('✗ Error running queries')
    }
    setRunning(false)
  }

  const inp: React.CSSProperties = {
    background: '#fff', border: '1px solid ' + border, borderRadius: 6,
    padding: '8px 12px', color: text, fontSize: 13, outline: 'none',
    fontFamily: 'Montserrat, sans-serif', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div>
      {msg && (
        <div style={{ padding: '10px 16px', borderRadius: 6, marginBottom: 16, fontSize: 13,
          background: msg.type === 'success' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
          color: msg.type === 'success' ? '#16a34a' : '#dc2626' }}>
          {msg.text}
        </div>
      )}

      {/* Hotel selector + run button */}
      <div style={{ background: '#fff', border: '1px solid ' + border, borderRadius: 8, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <span style={{ fontSize: 12, color: textMuted, fontWeight: 600, whiteSpace: 'nowrap' }}>Hotel:</span>
          <select value={selectedHotelId} onChange={e => setSelectedHotelId(e.target.value)}
            style={{ ...inp, width: 'auto', flex: 1, maxWidth: 320 }}>
            {hotels.filter(h => h.is_partner).map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {runResult && <span style={{ fontSize: 12, color: '#16a34a' }}>{runResult}</span>}
          <span style={{ fontSize: 12, color: textMuted }}>{queries.filter(q => q.is_active).length} active queries</span>
          <button onClick={runForHotel} disabled={running || queries.filter(q => q.is_active).length === 0}
            style={{ background: running ? bg : gold, color: running ? textMuted : '#1a0e06', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer', opacity: queries.filter(q => q.is_active).length === 0 ? 0.5 : 1 }}>
            {running ? 'Running...' : '▶ Run for ' + (hotel?.name?.split(' ')[0] || 'Hotel')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Current queries */}
        <div style={{ background: '#fff', border: '1px solid ' + border, borderRadius: 8, padding: '20px' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: text, margin: '0 0 16px' }}>
            Queries for {hotel?.name}
          </p>

          {/* Add custom query */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input style={{ ...inp, flex: 1 }} value={newQuery} onChange={e => setNewQuery(e.target.value)}
              placeholder="Type a custom query..." onKeyDown={e => e.key === 'Enter' && addQuery(newQuery)} />
            <button onClick={() => addQuery(newQuery)}
              style={{ background: gold, color: '#1a0e06', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Add
            </button>
          </div>

          {queries.length === 0 ? (
            <p style={{ fontSize: 13, color: textMuted, textAlign: 'center', padding: '20px 0' }}>
              No queries yet — add from suggestions or type your own
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {queries.map(q => (
                <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: q.is_active ? 'rgba(201,169,110,0.06)' : bg, border: '1px solid ' + border, borderRadius: 6, opacity: q.is_active ? 1 : 0.5 }}>
                  <input type="checkbox" checked={q.is_active} onChange={() => toggleQuery(q.id, q.is_active)}
                    style={{ accentColor: gold, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: text, lineHeight: 1.4 }}>{q.query}</span>
                  <button onClick={() => deleteQuery(q.id)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 11, cursor: 'pointer', padding: '2px 6px', flexShrink: 0 }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div style={{ background: '#fff', border: '1px solid ' + border, borderRadius: 8, padding: '20px' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: text, margin: '0 0 6px' }}>
            Suggested Queries
          </p>
          <p style={{ fontSize: 11, color: textMuted, margin: '0 0 16px' }}>
            Based on {hotel?.region} · {hotel?.category} — click to add
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {suggestions.map(s => {
              const already = queries.find(q => q.query === s)
              return (
                <div key={s} onClick={() => !already && addQuery(s)}
                  style={{ padding: '8px 12px', border: '1px solid ' + (already ? 'rgba(22,163,74,0.3)' : border), borderRadius: 6, fontSize: 12, color: already ? '#16a34a' : text, cursor: already ? 'default' : 'pointer', background: already ? 'rgba(22,163,74,0.05)' : bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span>{s}</span>
                  {already
                    ? <span style={{ fontSize: 10, color: '#16a34a', flexShrink: 0 }}>✓ Added</span>
                    : <span style={{ fontSize: 10, color: gold, flexShrink: 0 }}>+ Add</span>
                  }
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}