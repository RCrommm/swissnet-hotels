'use client'
import Link from 'next/link'
import { Hotel } from '@/types/hotel'
import { useState } from 'react'

export default function HotelCard({ hotel }: { hotel: Hotel }) {
  const [hovered, setHovered] = useState(false)
  const gold = '#C9A84C'
  const text = '#3D2B1F'
  const textMuted = 'rgba(61,43,31,0.5)'
  const border = 'rgba(201,169,110,0.25)'

  const trackingUrl = `/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=website&campaign=hotel_card`

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        border: '1px solid ' + border,
        overflow: 'hidden',
        transition: 'all 0.4s ease',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? '0 20px 60px rgba(61,43,31,0.15)' : '0 2px 12px rgba(201,169,110,0.08)',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: '260px', overflow: 'hidden' }}>
        <img
          src={hotel.images[0] || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'}
          alt={hotel.name}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transition: 'transform 0.6s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(61,43,31,0.6) 0%, transparent 50%)' }} />

        {hotel.is_featured && (
          <div style={{
            position: 'absolute', top: '1rem', left: '1rem',
            background: gold, color: '#fff',
            fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem',
            fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase',
            padding: '0.3rem 0.8rem',
          }}>
            Featured
          </div>
        )}

        <div style={{ position: 'absolute', bottom: '1rem', left: '1.25rem', right: '1.25rem' }}>
          <p style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem',
            fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: gold, marginBottom: '0.3rem',
          }}>
            {hotel.category}
          </p>
          <h3 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem',
            fontWeight: 400, color: '#fff', lineHeight: 1.2, margin: 0,
          }}>
            {hotel.name}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <svg width="12" height="12" fill="none" stroke={gold} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          </svg>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>
            {hotel.location}
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ color: gold, fontSize: '0.7rem' }}>★</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, fontWeight: 500 }}>{hotel.rating}</span>
          </span>
        </div>

        <p style={{
          fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem',
          color: textMuted, lineHeight: 1.7, marginBottom: '1rem',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {hotel.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
          {hotel.amenities.slice(0, 3).map(a => (
            <span key={a} style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem',
              fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: gold, border: '1px solid ' + border,
              padding: '0.25rem 0.6rem', background: 'rgba(201,169,110,0.06)',
            }}>
              {a}
            </span>
          ))}
        </div>

        {hotel.exclusive_offer && (
          <div style={{
            background: 'rgba(201,169,110,0.06)', borderLeft: '2px solid ' + gold,
            padding: '0.6rem 0.75rem', marginBottom: '1.25rem',
          }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: gold, margin: 0, lineHeight: 1.5 }}>
              ✦ {hotel.exclusive_offer}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid ' + border }}>
          <div>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 0.2rem' }}>From</p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: text, margin: 0 }}>
              CHF {hotel.nightly_rate_chf.toLocaleString()}
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, fontWeight: 300 }}> /night</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href={`/hotels/${hotel.id}`} style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: text, border: '1px solid ' + border,
              padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s',
            }}>
              View
            </Link>
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#fff', background: gold,
              padding: '0.6rem 1rem', textDecoration: 'none', transition: 'all 0.2s',
            }}>
              Book
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}