'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import OptimiseClient from './OptimiseClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function OptimiseWrapper() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/dashboard/login'); return }

      const { data: hotelUser } = await supabase
        .from('hotel_users').select('hotel_id').eq('user_id', session.user.id).single()
      if (!hotelUser) { router.push('/dashboard/login'); return }

      const hotelId = hotelUser.hotel_id

      const [{ data: hotel }, { data: offers }, { data: faqs }, { data: aiScores }] = await Promise.all([
        supabase.from('hotels').select('id, name, slug, region, location').eq('id', hotelId).single(),
        supabase.from('hotel_offers').select('*').eq('hotel_id', hotelId).eq('is_available', true).order('sort_order'),
        supabase.from('hotel_faq_suggestions').select('*').eq('hotel_id', hotelId).order('created_at', { ascending: false }),
        supabase.from('ai_visibility_scores').select('query, appeared, platform, checked_at').eq('hotel_id', hotelId).order('checked_at', { ascending: false }),
      ])

      setData({ hotel, offers: offers || [], faqs: faqs || [], aiScores: aiScores || [] })
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8F5EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: '#C9A84C' }}>Loading...</p>
    </div>
  )

  if (!data) return null
  return <OptimiseClient {...data} />
}