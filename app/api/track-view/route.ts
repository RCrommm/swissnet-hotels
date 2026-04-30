'use client'
import { useEffect } from 'react'

export default function ViewTracker({ hotelId, hotelName }: { hotelId: string; hotelName: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch('/api/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotelId, hotel_name: hotelName }),
      })
      .then(r => r.json())
      .then(data => console.log('ViewTracker:', data))
      .catch(err => console.error('ViewTracker error:', err))
    }, 2000)
    return () => clearTimeout(timer)
  }, [hotelId, hotelName])
  return null
}