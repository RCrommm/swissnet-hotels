'use client'
import { useState, useRef } from 'react'

export default function HeroCarousel({ images, name }: { images: string[]; name: string }) {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const validImages = images?.filter(Boolean) || []

  if (validImages.length === 0) {
    return <img src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600" alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  }

  const prev = () => setCurrent(c => (c - 1 + validImages.length) % validImages.length)
  const next = () => setCurrent(c => (c + 1) % validImages.length)

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 40) next()
    else if (diff < -40) prev()
    touchStartX.current = null
  }

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {validImages.map((img, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0,
          opacity: i === current ? 1 : 0,
          transition: 'opacity 0.8s ease-in-out',
        }}>
          <img src={img} alt={name + ' ' + (i + 1)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}

      {/* Dots */}
      {validImages.length > 1 && (
        <div style={{ position: 'absolute', bottom: '1.5rem', right: '2rem', display: 'flex', gap: '0.5rem', zIndex: 20 }}>
          {validImages.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{
              width: i === current ? 24 : 8, height: 8,
              borderRadius: 4, border: 'none', cursor: 'pointer',
              background: i === current ? '#C9A84C' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.3s', padding: 0,
            }} />
          ))}
        </div>
      )}

      {/* Arrows for desktop */}
      {validImages.length > 1 && (
        <>
          <button onClick={prev}
            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', fontSize: 22, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ‹
          </button>
          <button onClick={next}
            style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', fontSize: 22, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ›
          </button>
        </>
      )}
    </div>
  )
}