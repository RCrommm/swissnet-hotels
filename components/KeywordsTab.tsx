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
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch('/api/keywords?id=' + id, { method: 'DELETE' })
    setKeywords(prev => prev.filter(k => k.id !== id))
  }

  return (
    <div>
      {/* Add keyword form */}
      <div className="bg-white border border-stone-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-stone-800 uppercase tracking-wide mb-4">Add Keyword</h3>
        <div className="flex gap-3 flex-wrap">
          <select
            value={selectedHotel}
            onChange={e => setSelectedHotel(e.target.value)}
            className="border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-700 bg-white min-w-[200px]"
          >
            <option value="">Select hotel</option>
            {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <input
            type="text"
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="luxury ski hotel zermatt"
            className="border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-700 flex-1 min-w-[200px]"
          />
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-700 bg-white"
          >
            <option value="1">Priority 1 (highest)</option>
            <option value="2">Priority 2</option>
            <option value="3">Priority 3</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={loading || !selectedHotel || !newKeyword}
            className="btn-primary text-xs py-2 px-6"
          >
            {loading ? 'Adding...' : 'Add Keyword'}
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-3">
          Priority 1 = highest boost in AI search results. Use exact phrases people type into ChatGPT.
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-4 items-center">
        <p className="text-stone-600 text-sm">{filteredKeywords.length} keywords</p>
        <select
          value={filterHotel}
          onChange={e => setFilterHotel(e.target.value)}
          className="border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-700 bg-white ml-auto"
        >
          <option value="">All hotels</option>
          {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>

      {/* Keywords table */}
      <div className="bg-white border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              {['Keyword', 'Hotel', 'Priority', 'Added', 'Action'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wide text-stone-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredKeywords.map((kw, i) => (
              <tr key={kw.id} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                <td className="px-4 py-3 font-medium text-stone-800">{kw.keyword}</td>
                <td className="px-4 py-3 text-stone-600">{kw.hotels?.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 ${kw.priority === 1 ? 'bg-amber-100 text-amber-800' : kw.priority === 2 ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-600'}`}>
                    P{kw.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-500 text-xs">{new Date(kw.created_at).toLocaleDateString('en-GB')}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(kw.id)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredKeywords.length === 0 && <p className="text-center text-stone-400 py-10 text-sm">No keywords yet.</p>}
      </div>

      {/* Test section */}
      <div className="bg-amber-50 border border-amber-200 p-5 mt-6">
        <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">Test your keywords</p>
        <p className="text-xs text-amber-700 mb-3">Open this URL in your browser to see which hotels appear for a query:</p>
        <code className="text-xs text-amber-900 bg-amber-100 px-3 py-2 block rounded">
          /api/recommend?q=luxury+ski+hotel+zermatt&limit=3
        </code>
      </div>
    </div>
  )
}