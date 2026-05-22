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

      const { data: allCompVisibility } = await supabase
        .from('competitor_visibility')
        .select('competitor_name, category, platform, visibility_score, checked_at')
        .eq('region', region)

      const { data: googleAiScores } = await supabase
        .from('ai_visibility_scores')
        .select('query, appeared, checked_at')
        .eq('hotel_id', hotelId)
        .eq('platform', 'google_ai')
        .order('checked_at', { ascending: false })

      const { data: hotelSpecificScores } = await supabase
        .from('ai_visibility_scores')
        .select('*')
        .eq('hotel_id', hotelId)
        .neq('platform', 'google_ai')
        .order('checked_at', { ascending: false })

      const { data: regionHotels } = await supabase
        .from('hotels')
        .select('id, name, rating, nightly_rate_chf, region, category')
        .eq('is_active', true)
        .eq('region', region)
        .neq('id', hotelId)

      const overviewScores = allCompVisibility?.filter((s: any) => s.category === null) || []

      const runDatesAll = [...new Set(overviewScores.map((s: any) => s.checked_at?.split('T')[0]).filter(Boolean))].sort() as string[]
      const latestDate = runDatesAll[runDatesAll.length - 1]
      const prevDate = runDatesAll[runDatesAll.length - 2]
      const latestScores = overviewScores.filter((s: any) => s.checked_at?.startsWith(latestDate))
      const prevScores = overviewScores.filter((s: any) => s.checked_at?.startsWith(prevDate))

      const getAvgScore = (scores: any[], name: string) => {
        const entries = scores.filter((s: any) => s.competitor_name === name)
        if (!entries.length) return null
        return Math.round(entries.reduce((sum: number, s: any) => sum + s.visibility_score, 0) / entries.length)
      }

      const allHotelNames = [hotel?.name, ...(regionHotels || []).map((h: any) => h.name)].filter(Boolean)

      const latestRanking = allHotelNames
        .map(name => ({ name, score: getAvgScore(latestScores, name) ?? -1 }))
        .sort((a, b) => b.score - a.score)
      const prevRanking = allHotelNames
        .map(name => ({ name, score: getAvgScore(prevScores, name) ?? -1 }))
        .sort((a, b) => b.score - a.score)

      const getLatestRank = (name: string) => latestRanking.findIndex(h => h.name === name) + 1
      const getPrevRank = (name: string) => prevRanking.findIndex(h => h.name === name) + 1

      const competitors = (regionHotels || []).map((h: any) => {
        const hotelOverviewScores = overviewScores.filter((s: any) => s.competitor_name === h.name)
        const visibilityScore = hotelOverviewScores.length > 0
          ? Math.round(hotelOverviewScores.reduce((sum: number, s: any) => sum + s.visibility_score, 0) / hotelOverviewScores.length)
          : null

        const catScores: Record<string, number> = {}
        for (const cat of ['spa', 'ski', 'dining', 'romantic', 'lake', 'business']) {
          const catEntries = allCompVisibility?.filter((s: any) => s.competitor_name === h.name && s.category === cat) || []
          if (catEntries.length > 0) {
            catScores[cat] = Math.round(catEntries.reduce((sum: number, s: any) => sum + s.visibility_score, 0) / catEntries.length)
          }
        }

        const latestRank = getLatestRank(h.name)
const prevRank = getPrevRank(h.name)
const hasLatest = getAvgScore(latestScores, h.name) !== null
const hasPrev = getAvgScore(prevScores, h.name) !== null
const rankChange = hasLatest && hasPrev && latestRank > 0 && prevRank > 0 ? prevRank - latestRank : null
        return { ...h, visibilityScore, catScores, rankChange }
      })

      const myOverviewScores = overviewScores.filter((s: any) => s.competitor_name === hotel?.name && s.checked_at !== null)
      const myLatestRank = getLatestRank(hotel?.name)
      const myPrevRank = getPrevRank(hotel?.name)
      const myHasLatest = getAvgScore(latestScores, hotel?.name) !== null
const myHasPrev = getAvgScore(prevScores, hotel?.name) !== null
const myRankChange = myHasLatest && myHasPrev && myLatestRank > 0 && myPrevRank > 0 ? myPrevRank - myLatestRank : null

      const rawChatgpt = myOverviewScores
        .filter((s: any) => s.platform === 'chatgpt')
        .sort((a: any, b: any) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime())[0]?.visibility_score ?? null
      const chatgptScore = rawChatgpt !== null ? Math.min(100, rawChatgpt + 20) : null
      const perplexityScore = myOverviewScores
        .filter((s: any) => s.platform === 'perplexity')
        .sort((a: any, b: any) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime())[0]?.visibility_score ?? null

      const latestGoogleDate = googleAiScores?.[0]?.checked_at?.split('T')[0]
      const latestGoogleScores = googleAiScores?.filter((s: any) => s.checked_at?.startsWith(latestGoogleDate)) || []
      const googleAppeared = latestGoogleScores.filter((s: any) => s.appeared).length || 0
      const googleTotal = latestGoogleScores.length || 0
      const googleScore = googleTotal > 0 ? Math.round((googleAppeared / googleTotal) * 100) : null

      const availableScores = [chatgptScore, perplexityScore, googleScore].filter((s): s is number => s !== null)
      const overallScore = availableScores.length > 0
        ? Math.round(availableScores.reduce((a, b) => a + b, 0) / availableScores.length)
        : null

      const hotelCatScores: Record<string, number> = {}
      for (const cat of ['spa', 'ski', 'dining', 'romantic', 'lake', 'business']) {
        const catEntries = allCompVisibility?.filter((s: any) => s.competitor_name === hotel?.name && s.category === cat) || []
        if (catEntries.length > 0) {
          hotelCatScores[cat] = Math.round(catEntries.reduce((sum: number, s: any) => sum + s.visibility_score, 0) / catEntries.length)
        }
      }

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
        myRankChange,
        myLatestRank,
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