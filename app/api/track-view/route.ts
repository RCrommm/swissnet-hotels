'use client'
import { useEffect } from 'react'

export default function ViewTracker({ hotelId, hotelName }: { hotelId: string; hotelName: string }) {
  useEffect(() => {
    setTimeout(() => {
      fetch('/api/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotelId, hotel_name: hotelName }),
      }).catch(() => {})
    }, 2000)
  }, [hotelId, hotelName])
  return null
}