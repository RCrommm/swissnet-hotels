'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import DashboardClient from './DashboardClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardWrapper() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/dashboard/login')
        return
      }

      const { data: hotelUser } = await supabase
        .from('hotel_users')
        .select('hotel_id')
        .eq('user_id', session.user.id)
        .single()

      if (!hotelUser) {
        router.push('/dashboard/login')
        return
      }

      const hotelId = hotelUser.hotel_id

      const [hotel, views, clicks, leads, aiVisibility, bookings] = await Promise.all([
        supabase.from('hotels').select('*').eq('id', hotelId).single().then(r => r.data),
        supabase.from('hotel_views').select('*').eq('hotel_id', hotelId).then(r => r.data || []),
        supabase.from('hotel_clicks').select('*').eq('hotel_id', hotelId).then(r => r.data || []),
        supabase.from('leads').select('*').eq('hotel_id', hotelId).then(r => r.data || []),
        supabase.from('ai_visibility').select('*').eq('hotel_id', hotelId).then(r => r.data || []),
        supabase.from('bookings').select('*').eq('hotel_id', hotelId).then(r => r.data || []),
      ])

      const { data: competitors } = await supabase
        .from('hotels')
        .select('name, rating, nightly_rate_chf, region, category')
        .eq('region', hotel?.region || '')
        .neq('id', hotelId)

      setData({ hotel, views, clicks, leads, aiVisibility, bookings, competitors: competitors || [] })
      setLoading(false)
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0C0C0C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: '#C9A96E' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  return <DashboardClient {...data} />
}