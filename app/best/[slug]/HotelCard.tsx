'use client'
import Link from 'next/link'

const PARTNER_HOTEL_NAMES = new Set([
  'La Réserve Genève','La Réserve Eden au Lac Zurich','Mont Cervin Palace',
  'Victoria-Jungfrau Grand Hotel Interlaken','Victoria-Jungfrau Grand Hotel & Spa',
  'Bellevue Palace','Hotel Adula','Alpengold Hotel','Crans Ambassador',
  'Schweizerhof Zermatt','Monte Rosa Zermatt','Hotel Monte Rosa',
])

export default function BestHotelCard({ hotel, slug, gold, border, bg, text, textMuted }: any) {
  const isPartner = hotel.is_partner || PARTNER_HOTEL_NAMES.has(hotel.name)

  const trackProfile = () => {
    if (isPartner) fetch(`/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(`https://swissnethotels.com/hotels/${hotel.slug || hotel.id}`)}&medium=profile&campaign=best_page&source=${encodeURIComponent(`/best/${slug}`)}`).catch(() => {})
  }

  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden', display: 'flex', gap: 0 }}>
      <div style={{ width: 6, flexShrink: 0, background: isPartner ? gold : 'transparent' }} />
      {hotel.images?.[0] && (
        <div style={{ width: 140, flexShrink: 0, overflow: 'hidden' }}>
          <img src={hotel.images[0]} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ flex: 1, padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: text, margin: 0 }}>{hotel.name}</h3>
              
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.2rem' }}>
                {Array.from({ length: hotel.star_classification || 5 }).map((_: any, si: number) => (
                  <span key={si} style={{ color: gold, fontSize: '0.55rem' }}>★</span>
                ))}
              </div>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted }}>{hotel.location}</span>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted }}>·</span>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted }}>{hotel.category}</span>
            </div>
          </div>
          {hotel.nightly_rate_chf && (
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, margin: '0 0 0.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>From</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: gold, margin: 0, lineHeight: 1 }}>CHF {hotel.nightly_rate_chf?.toLocaleString()}</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, margin: '0.1rem 0 0' }}>/night</p>
            </div>
          )}
        </div>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, lineHeight: 1.7, margin: '0 0 1rem', fontWeight: 300, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>
          {hotel.description}
        </p>
        {hotel.best_for?.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {hotel.best_for.slice(0, 3).map((b: string) => (
              <span key={b} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: textMuted, background: bg, border: `1px solid ${border}`, padding: '2px 8px', borderRadius: 2 }}>{b}</span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a href={`/hotels/${hotel.slug || hotel.id}`} onClick={trackProfile} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: text, border: `1px solid ${border}`, padding: '0.5rem 1rem', textDecoration: 'none', borderRadius: 2 }}>
            View Profile
          </a>
          {hotel.direct_booking_url && (
            <a href={isPartner ? `/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=website&campaign=best_page&source=${encodeURIComponent(`/best/${slug}`)}` : hotel.direct_booking_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a0e06', background: gold, padding: '0.5rem 1rem', textDecoration: 'none', borderRadius: 2 }}>
              Official Website →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
