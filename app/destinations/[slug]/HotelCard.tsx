'use client'
import Link from 'next/link'

export default function HotelCard({ hotel, slug, index, gold, border, bg, text, textMuted }: any) {
  const handleClick = () => {
    fetch(`/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(`https://swissnethotels.com/hotels/${hotel.slug || hotel.id}`)}&medium=profile&campaign=destination&source=${encodeURIComponent(`/destinations/${slug}`)}`).catch(() => {})
  }

  return (
    <Link href={`/hotels/${hotel.slug || hotel.id}`} onClick={handleClick} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#FFFFFF', border: hotel.is_partner ? `1px solid ${gold}88` : `1px solid ${border}`, padding: '1.25rem 1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
        {hotel.is_partner && (
          <div style={{ flexShrink: 0, width: 8, height: 8, background: gold, borderRadius: '50%', marginTop: '0.4rem' }} title="SwissNet Partner" />
        )}
        {hotel.images?.[0] && (
          <div style={{ width: 80, height: 60, flexShrink: 0, overflow: 'hidden', borderRadius: 4 }}>
            <img src={hotel.images[0]} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: text, margin: 0 }}>{hotel.name}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
            <span style={{ display: 'flex', gap: '0.1rem' }}>
              {Array.from({ length: hotel.star_classification || 5 }).map((_: any, si: number) => (
                <span key={si} style={{ color: gold, fontSize: '0.55rem' }}>★</span>
              ))}
            </span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>{hotel.category}</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: gold }}>From CHF {hotel.nightly_rate_chf?.toLocaleString()}/night</span>
          </div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {hotel.description}
          </p>
        </div>
        <div style={{ flexShrink: 0 }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: gold }}>View →</span>
        </div>
      </div>
    </Link>
  )
}
