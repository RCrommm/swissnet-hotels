'use client'
import { useState } from 'react'

const REGIONS = ['Zermatt', 'St. Moritz', 'Verbier', 'Davos', 'Interlaken', 'Lucerne', 'Geneva', 'Zurich', 'Gstaad', 'Lugano']
const CATEGORIES = ['Ski Resort', 'Wellness Retreat', 'City Luxury', 'Mountain Lodge', 'Lake Resort']

interface Props {
  hotels: any[]
  password: string
}

export default function HotelsTab({ hotels: initialHotels, password }: Props) {
  const [hotels, setHotels] = useState<any[]>(initialHotels || [])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [search, setSearch] = useState('')
  const [fetchingImage, setFetchingImage] = useState<string | null>(null)
  const [fetchingAll, setFetchingAll] = useState(false)
  const [fetchResults, setFetchResults] = useState<Record<string, 'success' | 'error'>>({})
  const [enrichingId, setEnrichingId] = useState<string | null>(null)
  const [enrichResults, setEnrichResults] = useState<Record<string, 'success' | 'error'>>({})

  const gold = '#C9A84C'
  const border = 'rgba(201,169,110,0.2)'
  const text = '#2A1A0E'
  const textMuted = 'rgba(42,26,14,0.45)'
  const bg = '#F8F5EF'
  const bgSection = '#F2EAE0'

  const filteredHotels = hotels.filter(h =>
    !search ||
    h.name?.toLowerCase().includes(search.toLowerCase()) ||
    h.location?.toLowerCase().includes(search.toLowerCase()) ||
    h.region?.toLowerCase().includes(search.toLowerCase())
  )

  const startEdit = (hotel: any) => {
    setEditingId(hotel.id)
    setEditForm({
      name: hotel.name || '',
      location: hotel.location || '',
      region: hotel.region || '',
      category: hotel.category || '',
      rating: hotel.rating || '',
      nightly_rate_chf: hotel.nightly_rate_chf || '',
      description: hotel.description || '',
      direct_booking_url: hotel.direct_booking_url || '',
      exclusive_offer: hotel.exclusive_offer || '',
      contact_email: hotel.contact_email || '',
      is_active: hotel.is_active || false,
      is_featured: hotel.is_featured || false,
      is_partner: hotel.is_partner || false,
      show_schema: hotel.show_schema || false,
      images: hotel.images?.length ? hotel.images : ['', '', ''],
      amenities: hotel.amenities?.join(', ') || '',
      best_for: hotel.best_for?.join(', ') || '',
      seo_keywords: hotel.seo_keywords || '',
      star_classification: hotel.star_classification || 4,
    })
  }

  const handleSave = async () => {
    if (!editingId || !editForm) return
    setSaving(true)
    const payload = {
      ...editForm,
      rating: parseFloat(editForm.rating),
      nightly_rate_chf: parseInt(editForm.nightly_rate_chf),
      amenities: editForm.amenities.split(',').map((a: string) => a.trim()).filter(Boolean),
      best_for: editForm.best_for.split(',').map((b: string) => b.trim()).filter(Boolean),
      images: editForm.images.filter(Boolean),
    }
    try {
      const res = await fetch('/api/hotels/' + editingId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setHotels(prev => prev.map(h => h.id === editingId ? { ...h, ...payload } : h))
        setEditingId(null)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  const fetchImageForHotel = async (hotel: any) => {
    setFetchingImage(hotel.id)
    try {
      const res = await fetch('/api/fetch-hotel-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotel.id, url: hotel.direct_booking_url }),
      })
      const data = await res.json()
      if (data.success) {
        setHotels(prev => prev.map(h => h.id === hotel.id ? { ...h, images: [data.image_url] } : h))
        setFetchResults(prev => ({ ...prev, [hotel.id]: 'success' }))
      } else {
        setFetchResults(prev => ({ ...prev, [hotel.id]: 'error' }))
      }
    } catch {
      setFetchResults(prev => ({ ...prev, [hotel.id]: 'error' }))
    } finally {
      setFetchingImage(null)
      setTimeout(() => setFetchResults(prev => { const n = { ...prev }; delete n[hotel.id]; return n }), 3000)
    }
  }

  const fetchAllImages = async () => {
    setFetchingAll(true)
    const missing = hotels.filter(h => !h.images?.[0] || h.images[0].includes('unsplash'))
    for (const hotel of missing) {
      setFetchingImage(hotel.id)
      try {
        const res = await fetch('/api/fetch-hotel-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hotel_id: hotel.id, url: hotel.direct_booking_url }),
        })
        const data = await res.json()
        if (data.success) {
          setHotels(prev => prev.map(h => h.id === hotel.id ? { ...h, images: [data.image_url] } : h))
          setFetchResults(prev => ({ ...prev, [hotel.id]: 'success' }))
        } else {
          setFetchResults(prev => ({ ...prev, [hotel.id]: 'error' }))
        }
      } catch {
        setFetchResults(prev => ({ ...prev, [hotel.id]: 'error' }))
      }
      setFetchingImage(null)
      await new Promise(r => setTimeout(r, 800))
    }
    setFetchingAll(false)
  }

  const enrichHotel = async (hotel: any) => {
    setEnrichingId(hotel.id)
    try {
      const res = await fetch('/api/enrich-hotel', {
        method: 'POST',
        headers: { 
  'Content-Type': 'application/json',
  'x-api-secret': 'RCrom2004Romeo',
},
        body: JSON.stringify({
          hotel_id: hotel.id,
          hotel_name: hotel.name,
          hotel_url: hotel.direct_booking_url,
          location: hotel.location,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setHotels(prev => prev.map(h => h.id === hotel.id ? { ...h, ...data.updates } : h))
        setEnrichResults(prev => ({ ...prev, [hotel.id]: 'success' }))
      } else {
        setEnrichResults(prev => ({ ...prev, [hotel.id]: 'error' }))
      }
    } catch {
      setEnrichResults(prev => ({ ...prev, [hotel.id]: 'error' }))
    } finally {
      setEnrichingId(null)
      setTimeout(() => setEnrichResults(prev => { const n = { ...prev }; delete n[hotel.id]; return n }), 4000)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#fff', border: '1px solid ' + border,
    color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem',
    padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem',
    letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, marginBottom: '0.3rem',
  }

  const missingImages = hotels.filter(h => !h.images?.[0] || h.images[0].includes('unsplash')).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: 0, whiteSpace: 'nowrap' }}>
            {filteredHotels.length} of {hotels.length} properties
          </p>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, location or region..."
            style={{ background: '#fff', border: '1px solid ' + border, borderRadius: 6, padding: '6px 14px', fontSize: 13, color: text, outline: 'none', width: 280, fontFamily: 'Montserrat, sans-serif' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: textMuted, cursor: 'pointer', fontSize: 12 }}>✕ Clear</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {missingImages > 0 && (
            <button onClick={fetchAllImages} disabled={fetchingAll}
              style={{ background: fetchingAll ? bgSection : 'rgba(201,169,110,0.15)', color: gold, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.5rem 1.25rem', border: '1px solid ' + gold + '55', cursor: fetchingAll ? 'not-allowed' : 'pointer', borderRadius: 6 }}>
              {fetchingAll ? 'Fetching...' : 'Auto-fetch ' + missingImages + ' images'}
            </button>
          )}
          <a href="/onboarding" style={{ background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.5rem 1.25rem', textDecoration: 'none', borderRadius: 6 }}>
            + Add New Hotel
          </a>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredHotels.length === 0 && (
          <div style={{ background: '#fff', border: '1px solid ' + border, borderRadius: 8, padding: '40px', textAlign: 'center', color: textMuted, fontSize: 14 }}>
            No hotels match "{search}"
          </div>
        )}
        {filteredHotels.map(hotel => (
          <div key={hotel.id} style={{ background: '#fff', border: '1px solid ' + border, overflow: 'hidden', boxShadow: '0 2px 12px rgba(201,169,110,0.06)', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: editingId === hotel.id ? bgSection : '#fff', borderBottom: editingId === hotel.id ? '1px solid ' + border : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 56, height: 42, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: bgSection }}>
                  {hotel.images?.[0] ? (
                    <img src={hotel.images[0]} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏨</div>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 }}>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: text, margin: 0, fontWeight: 400 }}>{hotel.name}</p>
                    {hotel.is_partner && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, background: gold, color: '#1a0e06', padding: '2px 8px', borderRadius: 20 }}>✦ Partner</span>}
                    {!hotel.is_active && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 600, background: 'rgba(220,38,38,0.1)', color: '#dc2626', padding: '2px 8px', borderRadius: 20 }}>Hidden</span>}
                  </div>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, margin: 0 }}>
                    {hotel.location} · {hotel.category} · ★ {hotel.rating} · CHF {hotel.nightly_rate_chf?.toLocaleString()}/night
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {!hotel.is_partner && (
                  <button onClick={() => enrichHotel(hotel)} disabled={enrichingId === hotel.id}
                    style={{ background: enrichResults[hotel.id] === 'success' ? 'rgba(22,163,74,0.1)' : enrichResults[hotel.id] === 'error' ? 'rgba(220,38,38,0.1)' : 'rgba(59,130,246,0.1)', color: enrichResults[hotel.id] === 'success' ? '#16a34a' : enrichResults[hotel.id] === 'error' ? '#dc2626' : '#3b82f6', fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, padding: '0.2rem 0.6rem', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 4, cursor: enrichingId === hotel.id ? 'not-allowed' : 'pointer' }}>
                    {enrichingId === hotel.id ? 'Enriching...' : enrichResults[hotel.id] === 'success' ? '✓ Enriched' : enrichResults[hotel.id] === 'error' ? '✗ Failed' : '✦ AI Enrich'}
                  </button>
                )}
                <button onClick={() => fetchImageForHotel(hotel)} disabled={fetchingImage === hotel.id || fetchingAll}
                  style={{ background: fetchResults[hotel.id] === 'success' ? 'rgba(22,163,74,0.1)' : fetchResults[hotel.id] === 'error' ? 'rgba(220,38,38,0.1)' : bgSection, color: fetchResults[hotel.id] === 'success' ? '#16a34a' : fetchResults[hotel.id] === 'error' ? '#dc2626' : textMuted, fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, padding: '0.2rem 0.6rem', border: '1px solid ' + border, borderRadius: 4, cursor: 'pointer' }}>
                  {fetchingImage === hotel.id ? '...' : fetchResults[hotel.id] === 'success' ? '✓ Got image' : fetchResults[hotel.id] === 'error' ? '✗ Failed' : '🖼 Fetch'}
                </button>
                <button onClick={() => editingId === hotel.id ? setEditingId(null) : startEdit(hotel)}
                  style={{ background: editingId === hotel.id ? 'transparent' : gold, color: editingId === hotel.id ? textMuted : '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.4rem 1rem', border: editingId === hotel.id ? '1px solid ' + border : 'none', cursor: 'pointer', borderRadius: 4 }}>
                  {editingId === hotel.id ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>

            {editingId === hotel.id && editForm && (
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div><label style={labelStyle}>Hotel Name</label><input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Location</label><input type="text" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} style={inputStyle} /></div>
                  <div>
                    <label style={labelStyle}>Region</label>
                    <select value={editForm.region} onChange={e => setEditForm({ ...editForm, region: e.target.value })} style={{ ...inputStyle, background: bg }}>
                      <option value="">Select region</option>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} style={{ ...inputStyle, background: bg }}>
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label style={labelStyle}>Rating (1-5)</label><input type="number" min="1" max="5" step="0.1" value={editForm.rating} onChange={e => setEditForm({ ...editForm, rating: e.target.value })} style={inputStyle} /></div>
<div>
  <label style={labelStyle}>Star Classification</label>
  <select value={editForm.star_classification || 4} onChange={e => setEditForm({ ...editForm, star_classification: parseInt(e.target.value) })} style={{ ...inputStyle, background: bg }}>
    <option value={3}>3 Stars</option>
    <option value={4}>4 Stars</option>
    <option value={5}>5 Stars</option>
  </select>
</div>
                  <div><label style={labelStyle}>Nightly Rate (CHF)</label><input type="number" value={editForm.nightly_rate_chf} onChange={e => setEditForm({ ...editForm, nightly_rate_chf: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Contact Email</label><input type="email" value={editForm.contact_email} onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Direct Booking URL</label><input type="url" value={editForm.direct_booking_url} onChange={e => setEditForm({ ...editForm, direct_booking_url: e.target.value })} style={inputStyle} /></div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Description</label>
                  <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Exclusive Offer</label>
                  <input type="text" value={editForm.exclusive_offer} onChange={e => setEditForm({ ...editForm, exclusive_offer: e.target.value })} style={inputStyle} placeholder="3-night stay includes spa credit" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div><label style={labelStyle}>Amenities (comma separated)</label><input type="text" value={editForm.amenities} onChange={e => setEditForm({ ...editForm, amenities: e.target.value })} style={inputStyle} placeholder="Spa, Pool, Fine Dining" /></div>
                  <div><label style={labelStyle}>Best For (comma separated)</label><input type="text" value={editForm.best_for} onChange={e => setEditForm({ ...editForm, best_for: e.target.value })} style={inputStyle} placeholder="Couples, Wellness, Ski" /></div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>SEO Keywords</label>
                  <input type="text" value={editForm.seo_keywords} onChange={e => setEditForm({ ...editForm, seo_keywords: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={labelStyle}>Images (URLs)</label>
                    <button onClick={() => fetchImageForHotel({ id: editingId, direct_booking_url: editForm.direct_booking_url })} disabled={fetchingImage === editingId}
                      style={{ background: 'rgba(201,169,110,0.15)', color: gold, fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, padding: '0.2rem 0.75rem', border: '1px solid ' + gold + '44', borderRadius: 4, cursor: 'pointer' }}>
                      {fetchingImage === editingId ? 'Fetching...' : '🖼 Auto-fetch from website'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[0, 1, 2].map(i => (
                      <input key={i} type="url" value={editForm.images[i] || ''} onChange={e => {
                        const newImages = [...editForm.images]
                        newImages[i] = e.target.value
                        setEditForm({ ...editForm, images: newImages })
                      }} style={inputStyle} placeholder={'Image ' + (i + 1) + ' URL'} />
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  {[
                    { key: 'is_active', label: 'Active' },
                    { key: 'is_featured', label: 'Featured' },
                    { key: 'is_partner', label: '✦ Partner' },
                    { key: 'show_schema', label: 'Show Schema' },
                  ].map(f => (
                    <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={editForm[f.key]} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.checked })} style={{ accentColor: gold }} />
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text }}>{f.label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={handleSave} disabled={saving}
                    style={{ background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.75rem 2rem', border: 'none', cursor: 'pointer', borderRadius: 6 }}>
                    {saving ? 'Saving...' : saveSuccess ? '✓ Saved' : 'Save Changes'}
                  </button>
                  <button onClick={() => setEditingId(null)}
                    style={{ background: 'transparent', color: textMuted, fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.75rem 1.5rem', border: '1px solid ' + border, cursor: 'pointer', borderRadius: 6 }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
