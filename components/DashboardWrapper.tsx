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
        supabase.from('hotel_views').select('*').eq('hotel_id', hotelId).order('viewed_at', { ascending: false }).then(r => r.data || []),
        supabase.from('referral_clicks').select('*').eq('hotel_id', hotelId)
          .in('utm_campaign', ['hotel_profile', 'rooms_page', 'dining_page', 'spa_page', 'experiences_page', 'events_page'])
          .order('clicked_at', { ascending: false }).then(r => r.data || []),
        supabase.from('leads').select('*').eq('hotel_id', hotelId).order('created_at', { ascending: false }).then(r => r.data || []),
        supabase.from('ai_visibility_scores').select('*').eq('hotel_id', hotelId).order('checked_at', { ascending: false }).then(r => r.data || []),
        supabase.from('bookings').select('*').eq('hotel_id', hotelId).eq('source', 'swissnet').order('booked_at', { ascending: false }).then(r => r.data || []),
      ])

      const { data: competitorHotels } = await supabase
        .from('hotels')
        .select('id, name, rating, nightly_rate_chf, region, category')
        .eq('is_active', true)
        .neq('id', hotelId)

      const competitorIds = (competitorHotels || []).map((h: any) => h.id)

      const { data: competitorScores } = await supabase
        .from('ai_visibility_scores')
        .select('hotel_id, appeared')
        .in('hotel_id', competitorIds)

      const { data: categoryScores } = await supabase
        .from('competitor_visibility')
        .select('competitor_name, category, platform, visibility_score')
        .not('category', 'is', null)
        .neq('category', 'region')
        const { data: partnerCatScores } = await supabase
        .from('competitor_visibility')
        .select('category, platform, visibility_score')
        .eq('competitor_name', hotel?.name)
        .neq('category', 'region')

      const hotelCatScores: Record<string, number> = {}
      for (const cat of ['spa', 'ski', 'dining', 'romantic', 'lake', 'business']) {
        const entries = partnerCatScores?.filter((s: any) => s.category === cat) || []
        if (entries.length > 0) {
          hotelCatScores[cat] = Math.round(entries.reduce((sum: number, s: any) => sum + s.visibility_score, 0) / entries.length)
        }
      }

      const competitors = (competitorHotels || []).map((h: any) => {
        const hotelScores = competitorScores?.filter((s: any) => s.hotel_id === h.id) || []
        const appeared = hotelScores.filter((s: any) => s.appeared).length
        const visibilityScore = hotelScores.length > 0 ? Math.round((appeared / hotelScores.length) * 100) : null

        // Build category scores map
        const catScores: Record<string, number> = {}
        const hotelCatScores = categoryScores?.filter((s: any) => s.competitor_name === h.name) || []
        for (const cat of ['spa', 'ski', 'dining', 'romantic', 'lake', 'business']) {
          const catEntries = hotelCatScores.filter((s: any) => s.category === cat)
          if (catEntries.length > 0) {
            catScores[cat] = Math.round(catEntries.reduce((sum: number, s: any) => sum + s.visibility_score, 0) / catEntries.length)
          }
        }

        return { ...h, visibilityScore, catScores }
      })

      setData({
        hotel,
        views,
        clicks,
        leads,
        aiVisibility,
        bookings: bookings || [],
        competitors: competitors || [],
        hotelCatScores,
      })
      setLoading(false)
    }

    loadDashboard()
  }, [router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F5EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: '#C9A84C' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  return <DashboardClient {...data} />
}