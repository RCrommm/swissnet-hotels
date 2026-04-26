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

  const gold = '#C9A84C'
  const border = 'rgba(201,169,110,0.2)'
  const text = '#2A1A0E'
  const textMuted = 'rgba(42,26,14,0.45)'
  const bg = '#F8F5EF'
  const bgSection = '#F2EAE0'

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
      images: hotel.images?.length ? hotel.images : ['', '', ''],
      amenities: hotel.amenities?.join(', ') || '',
      best_for: hotel.best_for?.join(', ') || '',
      seo_keywords: hotel.seo_keywords || '',
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#fff',
    border: '1px solid ' + border,
    color: text,
    fontFamily: 'Montserrat, sans-serif',
    fontSize: '0.75rem',
    padding: '0.5rem 0.75rem',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: '0.55rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: textMuted,
    marginBottom: '0.3rem',
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: 0 }}>{hotels.length} properties</p>
        <a href="/onboarding" style={{ background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.5rem 1.25rem', textDecoration: 'none' }}>
          + Add New Hotel
        </a>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {hotels.map(hotel => (
          <div key={hotel.id} style={{ background: '#fff', border: '1px solid ' + border, overflow: 'hidden', boxShadow: '0 2px 12px rgba(201,169,110,0.06)' }}>

            {/* Hotel header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: editingId === hotel.id ? bgSection : '#fff', borderBottom: editingId === hotel.id ? '1px solid ' + border : 'none' }}>
              <div>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: text, margin: '0 0 0.2rem', fontWeight: 400 }}>{hotel.name}</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, margin: 0 }}>
                  {hotel.location} · {hotel.category} · ★ {hotel.rating} · CHF {hotel.nightly_rate_chf?.toLocaleString()}/night
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, padding: '0.2rem 0.6rem', background: hotel.is_active ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: hotel.is_active ? '#16a34a' : '#dc2626' }}>
                  {hotel.is_active ? 'Live' : 'Hidden'}
                </span>
                {hotel.is_featured && (
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, padding: '0.2rem 0.6rem', background: 'rgba(201,169,110,0.15)', color: gold }}>
                    Featured
                  </span>
                )}
                <button
                  onClick={() => editingId === hotel.id ? setEditingId(null) : startEdit(hotel)}
                  style={{ background: editingId === hotel.id ? 'transparent' : gold, color: editingId === hotel.id ? textMuted : '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.4rem 1rem', border: editingId === hotel.id ? '1px solid ' + border : 'none', cursor: 'pointer' }}
                >
                  {editingId === hotel.id ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>

            {/* Edit form */}
            {editingId === hotel.id && editForm && (
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Hotel Name</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Location</label>
                    <input type="text" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} style={inputStyle} />
                  </div>
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
                  <div>
                    <label style={labelStyle}>Rating (1-5)</label>
                    <input type="number" min="1" max="5" step="0.1" value={editForm.rating} onChange={e => setEditForm({ ...editForm, rating: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Nightly Rate (CHF)</label>
                    <input type="number" value={editForm.nightly_rate_chf} onChange={e => setEditForm({ ...editForm, nightly_rate_chf: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Contact Email</label>
                    <input type="email" value={editForm.contact_email} onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Direct Booking URL</label>
                    <input type="url" value={editForm.direct_booking_url} onChange={e => setEditForm({ ...editForm, direct_booking_url: e.target.value })} style={inputStyle} />
                  </div>
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
                  <div>
                    <label style={labelStyle}>Amenities (comma separated)</label>
                    <input type="text" value={editForm.amenities} onChange={e => setEditForm({ ...editForm, amenities: e.target.value })} style={inputStyle} placeholder="Spa, Pool, Fine Dining" />
                  </div>
                  <div>
                    <label style={labelStyle}>Best For (comma separated)</label>
                    <input type="text" value={editForm.best_for} onChange={e => setEditForm({ ...editForm, best_for: e.target.value })} style={inputStyle} placeholder="Couples, Wellness, Ski" />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>SEO Keywords</label>
                  <input type="text" value={editForm.seo_keywords} onChange={e => setEditForm({ ...editForm, seo_keywords: e.target.value })} style={inputStyle} placeholder="luxury hotel geneva, romantic hotel switzerland" />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Images (URLs)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[0, 1, 2].map(i => (
                      <input key={i} type="url" value={editForm.images[i] || ''} onChange={e => {
                        const newImages = [...editForm.images]
                        newImages[i] = e.target.value
                        setEditForm({ ...editForm, images: newImages })
                      }} style={inputStyle} placeholder={`Image ${i + 1} URL`} />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })} />
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text }}>Active (visible on site)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editForm.is_featured} onChange={e => setEditForm({ ...editForm, is_featured: e.target.checked })} />
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text }}>Featured (shown on homepage)</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={handleSave} disabled={saving} style={{ background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.75rem 2rem', border: 'none', cursor: 'pointer' }}>
                    {saving ? 'Saving...' : saveSuccess ? '✓ Saved' : 'Save Changes'}
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ background: 'transparent', color: textMuted, fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.75rem 1.5rem', border: '1px solid ' + border, cursor: 'pointer' }}>
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