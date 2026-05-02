'use client'
import { useState, useEffect } from 'react'

interface Room {
  id?: string
  name: string
  description: string
  size_sqm: number
  bed_type: string
  view: string
  max_occupancy: number
  base_rate_chf: number
  amenities: string[]
  images: string[]
  is_available: boolean
  sort_order: number
}

interface Spa {
  id?: string
  name: string
  description: string
  size_sqm: number
  pool: boolean
  sauna: boolean
  hammam: boolean
  price_from: number
  facilities: string[]
  images: string[]
  is_available: boolean
}

interface Restaurant {
  id?: string
  name: string
  description: string
  cuisine_type: string
  michelin_stars: number
  meal_types: string[]
  price_from: number
  images: string[]
  is_available: boolean
  sort_order: number
}

interface Experience {
  id?: string
  name: string
  description: string
  category: string
  duration: string
  price_from: number
  images: string[]
  is_available: boolean
  sort_order: number
}

interface Props {
  hotelId: string
  hotelName: string
  onClose: () => void
}

const gold = '#C9A84C'
const border = 'rgba(201,169,110,0.2)'
const text = '#2A1A0E'
const textMuted = 'rgba(42,26,14,0.45)'
const bg = '#F8F5EF'
const white = '#FFFFFF'

const inputStyle: React.CSSProperties = {
  width: '100%', background: white, border: '1px solid ' + border,
  color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem',
  padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box', borderRadius: 4,
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem',
  letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: textMuted, marginBottom: '0.3rem',
}
const btnGold: React.CSSProperties = {
  background: gold, color: white, fontFamily: 'Montserrat, sans-serif',
  fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.12em',
  textTransform: 'uppercase' as const, padding: '0.5rem 1.25rem',
  border: 'none', cursor: 'pointer', borderRadius: 4,
}
const btnOutline: React.CSSProperties = {
  background: 'transparent', color: textMuted, fontFamily: 'Montserrat, sans-serif',
  fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.12em',
  textTransform: 'uppercase' as const, padding: '0.5rem 1.25rem',
  border: '1px solid ' + border, cursor: 'pointer', borderRadius: 4,
}
const btnDanger: React.CSSProperties = {
  background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontFamily: 'Montserrat, sans-serif',
  fontSize: '0.55rem', fontWeight: 600, padding: '0.3rem 0.75rem',
  border: '1px solid rgba(220,38,38,0.2)', cursor: 'pointer', borderRadius: 4,
}

function ImageManager({ images, onChange }: { images: string[], onChange: (imgs: string[]) => void }) {
  const [newUrl, setNewUrl] = useState('')
  const addImage = () => { if (newUrl.trim()) { onChange([...images, newUrl.trim()]); setNewUrl('') } }
  const removeImage = (i: number) => onChange(images.filter((_, idx) => idx !== i))
  return (
    <div>
      <label style={labelStyle}>Images</label>
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.5rem', marginBottom: '0.75rem' }}>
        {images.map((url, i) => (
          <div key={i} style={{ position: 'relative' as const, width: 80, height: 60 }}>
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' as const, borderRadius: 4, border: '1px solid ' + border }} />
            <button onClick={() => removeImage(i)} style={{ position: 'absolute' as const, top: -6, right: -6, background: '#dc2626', color: white, border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>
        ))}
        {images.length === 0 && <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>No images yet</div>}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && addImage()} placeholder="Paste image URL and press Enter or Add" style={{ ...inputStyle, flex: 1 }} />
        <button onClick={addImage} style={btnGold}>Add</button>
      </div>
    </div>
  )
}

export default function SchemaEditor({ hotelId, hotelName, onClose }: Props) {
  const [tab, setTab] = useState<'rooms' | 'spa' | 'dining' | 'experiences'>('rooms')
  const [rooms, setRooms] = useState<Room[]>([])
  const [spa, setSpa] = useState<Spa[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingRoom, setEditingRoom] = useState<number | null>(null)
  const [editingSpa, setEditingSpa] = useState<number | null>(null)
  const [editingRestaurant, setEditingRestaurant] = useState<number | null>(null)
  const [editingExperience, setEditingExperience] = useState<number | null>(null)

  useEffect(() => { loadData() }, [hotelId])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/schema-data?hotel_id=${hotelId}`)
      const data = await res.json()
      setRooms(data.rooms || [])
      setSpa(data.spa || [])
      setRestaurants(data.restaurants || [])
      setExperiences(data.experiences || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const saveData = async (type: string, data: any[]) => {
    setSaving(true)
    try {
      await fetch('/api/schema-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotelId, type, data }),
      })
      if (type === 'rooms') setEditingRoom(null)
      if (type === 'spa') setEditingSpa(null)
      if (type === 'restaurants') setEditingRestaurant(null)
      if (type === 'experiences') setEditingExperience(null)
    } finally { setSaving(false) }
  }

  const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Late Night', 'Afternoon']
  const EXPERIENCE_CATS = ['Ski & Snow', 'Wellness', 'Gastronomy', 'Adventure', 'Culture', 'Outdoor', 'Water', 'Shopping', 'Sport & Wellness']
  const BED_TYPES = ['Single', 'Twin', 'Double', 'Queen', 'King', 'King + Twin']

  const tabs = [
    { key: 'rooms', label: 'Rooms & Suites', count: rooms.length },
    { key: 'spa', label: 'Spa', count: spa.length },
    { key: 'dining', label: 'Dining', count: restaurants.length },
    { key: 'experiences', label: 'Experiences', count: experiences.length },
  ]

  return (
    <div style={{ position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '2rem 1rem' }}>
      <div style={{ background: bg, width: '100%', maxWidth: 900, borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', marginBottom: '2rem' }}>

        {/* Header */}
        <div style={{ background: '#2A1A0E', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.25em', textTransform: 'uppercase' as const, color: gold, margin: '0 0 0.25rem' }}>Schema Editor</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: white, margin: 0 }}>{hotelName}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', color: white, border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid ' + border, background: white }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid ' + gold : '2px solid transparent', padding: '0.875rem 1rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: tab === t.key ? gold : textMuted, cursor: 'pointer' }}>
              {t.label} <span style={{ background: tab === t.key ? gold : 'rgba(201,169,110,0.15)', color: tab === t.key ? white : textMuted, borderRadius: 20, padding: '1px 7px', fontSize: '0.5rem', marginLeft: 4 }}>{t.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted }}>Loading...</div>
        ) : (
          <div style={{ padding: '1.5rem 2rem' }}>

            {/* ROOMS */}
            {tab === 'rooms' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: 0 }}>{rooms.length} room types</p>
                  <button onClick={() => { setRooms([...rooms, { name: 'New Room', description: '', size_sqm: 30, bed_type: 'King', view: 'Mountain View', max_occupancy: 2, base_rate_chf: 400, amenities: [], images: [], is_available: true, sort_order: rooms.length + 1 }]); setEditingRoom(rooms.length) }} style={btnGold}>+ Add Room</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {rooms.map((room, i) => (
                    <div key={i} style={{ background: white, border: '1px solid ' + border, borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem', background: editingRoom === i ? '#F2EAE0' : white }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {room.images?.[0] && <img src={room.images[0]} alt="" style={{ width: 48, height: 36, objectFit: 'cover' as const, borderRadius: 4 }} />}
                          <div>
                            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', color: text, margin: 0 }}>{room.name}</p>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: textMuted, margin: 0 }}>{room.bed_type} · {room.view} · CHF {room.base_rate_chf}/night · {room.images?.length || 0} images</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => setEditingRoom(editingRoom === i ? null : i)} style={editingRoom === i ? btnOutline : btnGold}>{editingRoom === i ? 'Close' : 'Edit'}</button>
                          <button onClick={() => setRooms(rooms.filter((_, idx) => idx !== i))} style={btnDanger}>Delete</button>
                        </div>
                      </div>
                      {editingRoom === i && (
                        <div style={{ padding: '1.25rem', borderTop: '1px solid ' + border }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '0.875rem' }}>
                            <div><label style={labelStyle}>Room Name</label><input style={inputStyle} value={room.name} onChange={e => { const r = [...rooms]; r[i].name = e.target.value; setRooms(r) }} /></div>
                            <div><label style={labelStyle}>Bed Type</label><select style={{ ...inputStyle, background: bg }} value={room.bed_type} onChange={e => { const r = [...rooms]; r[i].bed_type = e.target.value; setRooms(r) }}>{BED_TYPES.map(b => <option key={b}>{b}</option>)}</select></div>
                            <div><label style={labelStyle}>View</label><input style={inputStyle} value={room.view} onChange={e => { const r = [...rooms]; r[i].view = e.target.value; setRooms(r) }} /></div>
                            <div><label style={labelStyle}>Size (m²)</label><input type="number" style={inputStyle} value={room.size_sqm} onChange={e => { const r = [...rooms]; r[i].size_sqm = Number(e.target.value); setRooms(r) }} /></div>
                            <div><label style={labelStyle}>Max Occupancy</label><input type="number" style={inputStyle} value={room.max_occupancy} onChange={e => { const r = [...rooms]; r[i].max_occupancy = Number(e.target.value); setRooms(r) }} /></div>
                            <div><label style={labelStyle}>Rate from (CHF/night)</label><input type="number" style={inputStyle} value={room.base_rate_chf} onChange={e => { const r = [...rooms]; r[i].base_rate_chf = Number(e.target.value); setRooms(r) }} /></div>
                          </div>
                          <div style={{ marginBottom: '0.875rem' }}><label style={labelStyle}>Description</label><textarea rows={3} style={{ ...inputStyle, resize: 'none' as const }} value={room.description} onChange={e => { const r = [...rooms]; r[i].description = e.target.value; setRooms(r) }} /></div>
                          <div style={{ marginBottom: '0.875rem' }}><label style={labelStyle}>Amenities (comma separated)</label><input style={inputStyle} value={room.amenities?.join(', ')} onChange={e => { const r = [...rooms]; r[i].amenities = e.target.value.split(',').map((a: string) => a.trim()).filter(Boolean); setRooms(r) }} placeholder="King Bed, Balcony, Marble Bathroom" /></div>
                          <div style={{ marginBottom: '0.875rem' }}><ImageManager images={room.images || []} onChange={imgs => { const r = [...rooms]; r[i].images = imgs; setRooms(r) }} /></div>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <button onClick={() => saveData('rooms', rooms)} disabled={saving} style={btnGold}>{saving ? 'Saving...' : 'Save'}</button>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}><input type="checkbox" checked={room.is_available} onChange={e => { const r = [...rooms]; r[i].is_available = e.target.checked; setRooms(r) }} style={{ accentColor: gold }} /><span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: text }}>Available</span></label>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {rooms.length === 0 && <div style={{ border: '1px dashed ' + border, borderRadius: 8, padding: '2rem', textAlign: 'center', color: textMuted, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem' }}>No rooms yet. Click + Add Room.</div>}
                </div>
                {rooms.length > 0 && <div style={{ marginTop: '1.25rem' }}><button onClick={() => saveData('rooms', rooms)} disabled={saving} style={btnGold}>{saving ? 'Saving...' : 'Save All Rooms'}</button></div>}
              </div>
            )}

            {/* SPA */}
            {tab === 'spa' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: 0 }}>{spa.length} spa entries</p>
                  <button onClick={() => { setSpa([...spa, { name: 'Spa & Wellness', description: '', size_sqm: 500, pool: false, sauna: false, hammam: false, price_from: 100, facilities: [], images: [], is_available: true }]); setEditingSpa(spa.length) }} style={btnGold}>+ Add Spa</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {spa.map((s, i) => (
                    <div key={i} style={{ background: white, border: '1px solid ' + border, borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem', background: editingSpa === i ? '#F2EAE0' : white }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {s.images?.[0] && <img src={s.images[0]} alt="" style={{ width: 48, height: 36, objectFit: 'cover' as const, borderRadius: 4 }} />}
                          <div>
                            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', color: text, margin: 0 }}>{s.name}</p>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: textMuted, margin: 0 }}>{s.size_sqm}m² · From CHF {s.price_from} · {[s.pool && 'Pool', s.sauna && 'Sauna', s.hammam && 'Hammam'].filter(Boolean).join(', ')} · {s.images?.length || 0} images</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => setEditingSpa(editingSpa === i ? null : i)} style={editingSpa === i ? btnOutline : btnGold}>{editingSpa === i ? 'Close' : 'Edit'}</button>
                          <button onClick={() => setSpa(spa.filter((_, idx) => idx !== i))} style={btnDanger}>Delete</button>
                        </div>
                      </div>
                      {editingSpa === i && (
                        <div style={{ padding: '1.25rem', borderTop: '1px solid ' + border }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '0.875rem' }}>
                            <div><label style={labelStyle}>Spa Name</label><input style={inputStyle} value={s.name} onChange={e => { const arr = [...spa]; arr[i].name = e.target.value; setSpa(arr) }} /></div>
                            <div><label style={labelStyle}>Size (m²)</label><input type="number" style={inputStyle} value={s.size_sqm} onChange={e => { const arr = [...spa]; arr[i].size_sqm = Number(e.target.value); setSpa(arr) }} /></div>
                            <div><label style={labelStyle}>Price from (CHF)</label><input type="number" style={inputStyle} value={s.price_from} onChange={e => { const arr = [...spa]; arr[i].price_from = Number(e.target.value); setSpa(arr) }} /></div>
                          </div>
                          <div style={{ marginBottom: '0.875rem' }}><label style={labelStyle}>Description</label><textarea rows={3} style={{ ...inputStyle, resize: 'none' as const }} value={s.description} onChange={e => { const arr = [...spa]; arr[i].description = e.target.value; setSpa(arr) }} /></div>
                          <div style={{ marginBottom: '0.875rem' }}><label style={labelStyle}>Facilities (comma separated)</label><input style={inputStyle} value={s.facilities?.join(', ')} onChange={e => { const arr = [...spa]; arr[i].facilities = e.target.value.split(',').map((a: string) => a.trim()).filter(Boolean); setSpa(arr) }} placeholder="Indoor Pool, Finnish Sauna, Hammam" /></div>
                          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.875rem' }}>
                            {[{key: 'pool', label: 'Pool'}, {key: 'sauna', label: 'Sauna'}, {key: 'hammam', label: 'Hammam'}].map(f => (
                              <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={(s as any)[f.key]} onChange={e => { const arr = [...spa]; (arr[i] as any)[f.key] = e.target.checked; setSpa(arr) }} style={{ accentColor: gold }} />
                                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: text }}>{f.label}</span>
                              </label>
                            ))}
                          </div>
                          <div style={{ marginBottom: '0.875rem' }}><ImageManager images={s.images || []} onChange={imgs => { const arr = [...spa]; arr[i].images = imgs; setSpa(arr) }} /></div>
                          <button onClick={() => saveData('spa', spa)} disabled={saving} style={btnGold}>{saving ? 'Saving...' : 'Save'}</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {spa.length === 0 && <div style={{ border: '1px dashed ' + border, borderRadius: 8, padding: '2rem', textAlign: 'center', color: textMuted, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem' }}>No spa entries yet.</div>}
                </div>
                {spa.length > 0 && <div style={{ marginTop: '1.25rem' }}><button onClick={() => saveData('spa', spa)} disabled={saving} style={btnGold}>{saving ? 'Saving...' : 'Save All'}</button></div>}
              </div>
            )}

            {/* DINING */}
            {tab === 'dining' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: 0 }}>{restaurants.length} restaurants</p>
                  <button onClick={() => { setRestaurants([...restaurants, { name: 'New Restaurant', description: '', cuisine_type: 'Swiss-Alpine', michelin_stars: 0, meal_types: ['Dinner'], price_from: 80, images: [], is_available: true, sort_order: restaurants.length + 1 }]); setEditingRestaurant(restaurants.length) }} style={btnGold}>+ Add Restaurant</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {restaurants.map((r, i) => (
                    <div key={i} style={{ background: white, border: '1px solid ' + border, borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem', background: editingRestaurant === i ? '#F2EAE0' : white }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {r.images?.[0] && <img src={r.images[0]} alt="" style={{ width: 48, height: 36, objectFit: 'cover' as const, borderRadius: 4 }} />}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', color: text, margin: 0 }}>{r.name}</p>
                              {r.michelin_stars > 0 && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', background: '#dc2626', color: white, padding: '2px 6px', borderRadius: 3 }}>{'★'.repeat(r.michelin_stars)} Michelin</span>}
                            </div>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: textMuted, margin: 0 }}>{r.cuisine_type} · {r.meal_types?.join(', ')} · {r.images?.length || 0} images</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => setEditingRestaurant(editingRestaurant === i ? null : i)} style={editingRestaurant === i ? btnOutline : btnGold}>{editingRestaurant === i ? 'Close' : 'Edit'}</button>
                          <button onClick={() => setRestaurants(restaurants.filter((_, idx) => idx !== i))} style={btnDanger}>Delete</button>
                        </div>
                      </div>
                      {editingRestaurant === i && (
                        <div style={{ padding: '1.25rem', borderTop: '1px solid ' + border }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '0.875rem' }}>
                            <div><label style={labelStyle}>Name</label><input style={inputStyle} value={r.name} onChange={e => { const arr = [...restaurants]; arr[i].name = e.target.value; setRestaurants(arr) }} /></div>
                            <div><label style={labelStyle}>Cuisine</label><input style={inputStyle} value={r.cuisine_type} onChange={e => { const arr = [...restaurants]; arr[i].cuisine_type = e.target.value; setRestaurants(arr) }} /></div>
                            <div><label style={labelStyle}>Michelin Stars</label><select style={{ ...inputStyle, background: bg }} value={r.michelin_stars} onChange={e => { const arr = [...restaurants]; arr[i].michelin_stars = Number(e.target.value); setRestaurants(arr) }}><option value={0}>None</option><option value={1}>1 Star ★</option><option value={2}>2 Stars ★★</option><option value={3}>3 Stars ★★★</option></select></div>
                            <div><label style={labelStyle}>Price from (CHF)</label><input type="number" style={inputStyle} value={r.price_from} onChange={e => { const arr = [...restaurants]; arr[i].price_from = Number(e.target.value); setRestaurants(arr) }} /></div>
                          </div>
                          <div style={{ marginBottom: '0.875rem' }}><label style={labelStyle}>Description</label><textarea rows={3} style={{ ...inputStyle, resize: 'none' as const }} value={r.description} onChange={e => { const arr = [...restaurants]; arr[i].description = e.target.value; setRestaurants(arr) }} /></div>
                          <div style={{ marginBottom: '0.875rem' }}>
                            <label style={labelStyle}>Meal Types</label>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const }}>
                              {MEAL_TYPES.map(m => (
                                <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                                  <input type="checkbox" checked={r.meal_types?.includes(m)} onChange={e => { const arr = [...restaurants]; arr[i].meal_types = e.target.checked ? [...(arr[i].meal_types || []), m] : arr[i].meal_types.filter((t: string) => t !== m); setRestaurants(arr) }} style={{ accentColor: gold }} />
                                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: text }}>{m}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div style={{ marginBottom: '0.875rem' }}><ImageManager images={r.images || []} onChange={imgs => { const arr = [...restaurants]; arr[i].images = imgs; setRestaurants(arr) }} /></div>
                          <button onClick={() => saveData('restaurants', restaurants)} disabled={saving} style={btnGold}>{saving ? 'Saving...' : 'Save'}</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {restaurants.length === 0 && <div style={{ border: '1px dashed ' + border, borderRadius: 8, padding: '2rem', textAlign: 'center', color: textMuted, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem' }}>No restaurants yet.</div>}
                </div>
                {restaurants.length > 0 && <div style={{ marginTop: '1.25rem' }}><button onClick={() => saveData('restaurants', restaurants)} disabled={saving} style={btnGold}>{saving ? 'Saving...' : 'Save All'}</button></div>}
              </div>
            )}

            {/* EXPERIENCES */}
            {tab === 'experiences' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: 0 }}>{experiences.length} experiences</p>
                  <button onClick={() => { setExperiences([...experiences, { name: 'New Experience', description: '', category: 'Outdoor', duration: '3 hours', price_from: 150, images: [], is_available: true, sort_order: experiences.length + 1 }]); setEditingExperience(experiences.length) }} style={btnGold}>+ Add Experience</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {experiences.map((exp, i) => (
                    <div key={i} style={{ background: white, border: '1px solid ' + border, borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem', background: editingExperience === i ? '#F2EAE0' : white }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {exp.images?.[0] && <img src={exp.images[0]} alt="" style={{ width: 48, height: 36, objectFit: 'cover' as const, borderRadius: 4 }} />}
                          <div>
                            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', color: text, margin: 0 }}>{exp.name}</p>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: textMuted, margin: 0 }}>{exp.category} · {exp.duration} · From CHF {exp.price_from} · {exp.images?.length || 0} images</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => setEditingExperience(editingExperience === i ? null : i)} style={editingExperience === i ? btnOutline : btnGold}>{editingExperience === i ? 'Close' : 'Edit'}</button>
                          <button onClick={() => setExperiences(experiences.filter((_, idx) => idx !== i))} style={btnDanger}>Delete</button>
                        </div>
                      </div>
                      {editingExperience === i && (
                        <div style={{ padding: '1.25rem', borderTop: '1px solid ' + border }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '0.875rem' }}>
                            <div><label style={labelStyle}>Name</label><input style={inputStyle} value={exp.name} onChange={e => { const arr = [...experiences]; arr[i].name = e.target.value; setExperiences(arr) }} /></div>
                            <div><label style={labelStyle}>Category</label><select style={{ ...inputStyle, background: bg }} value={exp.category} onChange={e => { const arr = [...experiences]; arr[i].category = e.target.value; setExperiences(arr) }}>{EXPERIENCE_CATS.map(c => <option key={c}>{c}</option>)}</select></div>
                            <div><label style={labelStyle}>Duration</label><input style={inputStyle} value={exp.duration} onChange={e => { const arr = [...experiences]; arr[i].duration = e.target.value; setExperiences(arr) }} placeholder="3 hours" /></div>
                            <div><label style={labelStyle}>Price from (CHF)</label><input type="number" style={inputStyle} value={exp.price_from} onChange={e => { const arr = [...experiences]; arr[i].price_from = Number(e.target.value); setExperiences(arr) }} /></div>
                          </div>
                          <div style={{ marginBottom: '0.875rem' }}><label style={labelStyle}>Description</label><textarea rows={3} style={{ ...inputStyle, resize: 'none' as const }} value={exp.description} onChange={e => { const arr = [...experiences]; arr[i].description = e.target.value; setExperiences(arr) }} /></div>
                          <div style={{ marginBottom: '0.875rem' }}><ImageManager images={exp.images || []} onChange={imgs => { const arr = [...experiences]; arr[i].images = imgs; setExperiences(arr) }} /></div>
                          <button onClick={() => saveData('experiences', experiences)} disabled={saving} style={btnGold}>{saving ? 'Saving...' : 'Save'}</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {experiences.length === 0 && <div style={{ border: '1px dashed ' + border, borderRadius: 8, padding: '2rem', textAlign: 'center', color: textMuted, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem' }}>No experiences yet.</div>}
                </div>
                {experiences.length > 0 && <div style={{ marginTop: '1.25rem' }}><button onClick={() => saveData('experiences', experiences)} disabled={saving} style={btnGold}>{saving ? 'Saving...' : 'Save All'}</button></div>}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}