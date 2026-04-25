'use client'
import Link from 'next/link'
import { useState } from 'react'

const regions = [
  { name: 'Zermatt', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600' },
  { name: 'St. Moritz', img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600' },
  { name: 'Verbier', img: 'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=600' },
  { name: 'Lucerne', img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600' },
  { name: 'Interlaken', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600' },
]

export default function RegionGrid() {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      {regions.map(r => (
        <Link key={r.name} href={`/hotels?region=${r.name}`} style={{ textDecoration: 'none', display: 'block', position: 'relative', height: '200px', overflow: 'hidden' }}
          onMouseEnter={() => setHovered(r.name)}
          onMouseLeave={() => setHovered(null)}
        >
          <img src={r.img} alt={r.name} style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transition: 'transform 0.4s ease',
            transform: hovered === r.name ? 'scale(1.05)' : 'scale(1)',
          }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(12,12,12,0.45)' }} />
          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 400, color: '#fff', margin: 0 }}>{r.name}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}