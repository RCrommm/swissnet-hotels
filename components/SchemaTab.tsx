'use client'
import { useState } from 'react'
import RoomTypesTab from '@/components/RoomTypesTab'
import SpaSchema from '@/components/schema/SpaSchema'
import RestaurantsSchema from '@/components/schema/RestaurantsSchema'
import ExperiencesSchema from '@/components/schema/OffersSchema'
import ContentSchema from '@/components/schema/ContentSchema'

const COLORS = {
  bg: '#492816', bgLight: '#3D2010', bgCard: '#5C3320',
  gold: '#C9A84C', text: '#F5EDD8', textMuted: '#C4A882',
  border: 'rgba(201,168,76,0.25)',
}

const SECTIONS = ['Rooms', 'Spa & Wellness', 'Restaurants', 'Experiences', 'Content']

export default function SchemaTab({ hotels }: { hotels: any[] }) {
  const [hotelId, setHotelId] = useState(hotels[0]?.id || '')
  const [section, setSection] = useState('Rooms')
  const hotel = hotels.find(h => h.id === hotelId) || hotels[0]

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Hotel selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, background: '#fff', border: '1px solid #e7e5e4', borderRadius: 10, padding: '14px 20px' }}>
        <span style={{ fontSize: 13, color: '#78716c', fontWeight: 600, whiteSpace: 'nowrap' }}>Hotel:</span>
        <select
          value={hotelId}
          onChange={e => setHotelId(e.target.value)}
          style={{ border: '1px solid #e7e5e4', borderRadius: 6, padding: '8px 14px', fontSize: 14, color: '#3D2B1F', background: '#fff', cursor: 'pointer', flex: 1, maxWidth: 380 }}
        >
          {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <span style={{ fontSize: 12, color: '#C9A84C', background: '#C9A84C22', border: '1px solid #C9A84C44', padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>
          Schema Hub
        </span>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: COLORS.bg, borderRadius: 12, padding: 6 }}>
        {SECTIONS.map(s => (
          <button key={s} onClick={() => setSection(s)} style={{
            flex: 1, padding: '10px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, transition: 'all .15s',
            background: section === s ? COLORS.gold : 'transparent',
            color: section === s ? '#1a0e06' : COLORS.textMuted,
          }}>{s}</button>
        ))}
      </div>

      {/* Section content */}
      <div style={{ background: COLORS.bg, borderRadius: 12, padding: 24 }}>
        {section === 'Rooms' && <RoomTypesTab hotelId={hotelId} hotelName={hotel?.name || ''} />}
        {section === 'Spa & Wellness' && <SpaSchema hotelId={hotelId} hotelName={hotel?.name || ''} />}
        {section === 'Restaurants' && <RestaurantsSchema hotelId={hotelId} hotelName={hotel?.name || ''} />}
{section === 'Experiences' && <ExperiencesSchema hotelId={hotelId} hotelName={hotel?.name || ''} />}
        {section === 'Content' && <ContentSchema hotelId={hotelId} hotelName={hotel?.name || ''} />}
      </div>
    </div>
  )
}