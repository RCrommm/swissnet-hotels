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
      if (!session) { router.push('/dashboard/login'); return }

      const { data: hotelUser } = await supabase
        .from('hotel_users')
        .select('hotel_id')
        .eq('user_id', session.user.id)
        .single()
      if (!hotelUser) { router.push('/dashboard/login'); return }

      const hotelId = hotelUser.hotel_id

      const [hotel, views, clicks, leads, bookings] = await Promise.all([
        supabase.from('hotels').select('*').eq('id', hotelId).single().then(r => r.data),
        supabase.from('hotel_views').select('*').eq('hotel_id', hotelId).order('viewed_at', { ascending: false }).then(r => r.data || []),
        supabase.from('referral_clicks').select('*').eq('hotel_id', hotelId)
          .in('utm_campaign', ['hotel_profile', 'rooms_page', 'dining_page', 'spa_page', 'experiences_page', 'events_page'])
          .order('clicked_at', { ascending: false }).then(r => r.data || []),
        supabase.from('leads').select('*').eq('hotel_id', hotelId).order('created_at', { ascending: false }).then(r => r.data || []),
        supabase.from('bookings').select('*').eq('hotel_id', hotelId).eq('source', 'swissnet').order('booked_at', { ascending: false }).then(r => r.data || []),
      ])

      const region = hotel?.region || 'Geneva'

      // Fetch all competitor_visibility for this region (overview + categories)
      const { data: allCompVisibility } = await supabase
        .from('competitor_visibility')
        .select('competitor_name, category, platform, visibility_score, checked_at')
        .eq('region', region)

      // Google AI scores for this hotel specifically
      const { data: googleAiScores } = await supabase
        .from('ai_visibility_scores')
        .select('query, appeared, checked_at')
        .eq('hotel_id', hotelId)
        .eq('platform', 'google_ai')
        .order('checked_at', { ascending: false })

      // Per-hotel specific AI visibility scores (for "Where You Appear" and "Queries to Improve")
      const { data: hotelSpecificScores } = await supabase
        .from('ai_visibility_scores')
        .select('*')
        .eq('hotel_id', hotelId)
        .neq('platform', 'google_ai')
        .order('checked_at', { ascending: false })

      // Build competitor list with overview scores
      const { data: regionHotels } = await supabase
        .from('hotels')
        .select('id, name, rating, nightly_rate_chf, region, category')
        .eq('is_active', true)
        .eq('region', region)
        .neq('id', hotelId)

      // Overview scores (category = null) per hotel
      const overviewScores = allCompVisibility?.filter((s: any) => s.category === null) || []

      const competitors = (regionHotels || []).map((h: any) => {
        const hotelOverviewScores = overviewScores.filter((s: any) => s.competitor_name === h.name)
        const appeared = hotelOverviewScores.reduce((sum: number, s: any) => sum + s.visibility_score, 0)
        const visibilityScore = hotelOverviewScores.length > 0
          ? Math.round(hotelOverviewScores.reduce((sum: number, s: any) => sum + s.visibility_score, 0) / hotelOverviewScores.length)
          : null

        // Category scores
        const catScores: Record<string, number> = {}
        for (const cat of ['spa', 'ski', 'dining', 'romantic', 'lake', 'business']) {
          const catEntries = allCompVisibility?.filter((s: any) => s.competitor_name === h.name && s.category === cat) || []
          if (catEntries.length > 0) {
            catScores[cat] = Math.round(catEntries.reduce((sum: number, s: any) => sum + s.visibility_score, 0) / catEntries.length)
          }
        }

        return { ...h, visibilityScore, catScores }
      })

      // Current hotel overview scores from competitor_visibility
      const myOverviewScores = overviewScores.filter((s: any) => s.competitor_name === hotel?.name)
      const chatgptScore = myOverviewScores.find((s: any) => s.platform === 'chatgpt')?.visibility_score ?? null
      const perplexityScore = myOverviewScores.find((s: any) => s.platform === 'perplexity')?.visibility_score ?? null

      // Google AI score
      const googleAppeared = googleAiScores?.filter((s: any) => s.appeared).length || 0
      const googleTotal = googleAiScores?.length || 0
      const googleScore = googleTotal > 0 ? Math.round((googleAppeared / googleTotal) * 100) : null

      // Overall = average of available platform scores
      const availableScores = [chatgptScore, perplexityScore, googleScore].filter((s): s is number => s !== null)
      const overallScore = availableScores.length > 0
        ? Math.round(availableScores.reduce((a, b) => a + b, 0) / availableScores.length)
        : null

      // Category scores for current hotel
      const hotelCatScores: Record<string, number> = {}
      for (const cat of ['spa', 'ski', 'dining', 'romantic', 'lake', 'business']) {
        const catEntries = allCompVisibility?.filter((s: any) => s.competitor_name === hotel?.name && s.category === cat) || []
        if (catEntries.length > 0) {
          hotelCatScores[cat] = Math.round(catEntries.reduce((sum: number, s: any) => sum + s.visibility_score, 0) / catEntries.length)
        }
      }

      // Run dates for chart — from competitor_visibility overview scores for this hotel
      const myRunDates = [...new Set(myOverviewScores.map((s: any) => s.checked_at?.split('T')[0]))].sort() as string[]

      setData({
        hotel,
        views,
        clicks,
        leads,
        aiVisibility: hotelSpecificScores || [],
        googleAiScores: googleAiScores || [],
        bookings: bookings || [],
        competitors: competitors || [],
        hotelCatScores,
        platformScores: {
          chatgpt: chatgptScore,
          perplexity: perplexityScore,
          google_ai: googleScore,
          overall: overallScore,
        },
        overviewRunData: myOverviewScores,
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