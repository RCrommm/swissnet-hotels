import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

async function queryPerplexity(query: string): Promise<string> {
  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: `${query}. Please recommend 3-5 specific hotels by name.` }],
        max_tokens: 500,
      }),
    })
    if (!res.ok) { console.error('[PERPLEXITY ERROR]', res.status, await res.text()); return '' }
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (e: any) { console.error('[PERPLEXITY EXCEPTION]', e.message); return '' }
}

async function queryChatGPT(query: string): Promise<string> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: `${query}. Please recommend 3-5 specific hotels by name.` }],
        max_tokens: 500,
      }),
    })
    if (!res.ok) { console.error('[CHATGPT ERROR]', res.status, await res.text()); return '' }
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (e: any) { console.error('[CHATGPT EXCEPTION]', e.message); return '' }
}

async function queryClaude(query: string): Promise<string> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: 'You are a helpful travel assistant. Recommend specific hotels by name.',
        messages: [{ role: 'user', content: `${query}. Please recommend 3-5 specific hotels by name.` }],
      }),
    })
    if (!res.ok) { console.error('[CLAUDE ERROR]', res.status, await res.text()); return '' }
    const data = await res.json()
    return data.content?.[0]?.text || ''
  } catch (e: any) { console.error('[CLAUDE EXCEPTION]', e.message); return '' }
}

const PLATFORMS = [
  { id: 'chatgpt', queryFn: queryChatGPT },
  { id: 'perplexity', queryFn: queryPerplexity },
]

const CORE_VARIANTS = [
  'la réserve genève', 'la reserve geneve', 'la réserve geneva', 'la reserve geneva',
  'mont cervin', 'monte rosa zermatt', 'schweizerhof zermatt',
  'bellevue palace', 'alpengold', 'crans ambassador', 'hotel adula', 'adula hotel',
  'victoria-jungfrau', 'victoria jungfrau',
  'la réserve eden', 'la reserve eden', 'eden au lac', 'réserve eden au lac', 'reserve eden au lac',
]

function checkAppeared(hotelName: string, responseText: string): boolean {
  const r = responseText.toLowerCase()
  const n = hotelName.toLowerCase()
  const noAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const words = n.split(' ').filter(w => !['hotel','the','le','la','les','grand','de','du','au','aux','by','at','and','&'].includes(w))
  const lastTwo = hotelName.split(' ').slice(-2).join(' ').toLowerCase()
  const firstTwo = hotelName.split(' ').slice(0, 2).join(' ').toLowerCase()
  const keyWords = words.slice(0, 3).join(' ')
  const shortName = words.slice(0, 2).join(' ')

  return CORE_VARIANTS.some(v => r.includes(v)) ||
    r.includes(n) || r.includes(noAccents(n)) ||
    r.includes(lastTwo) || r.includes(noAccents(lastTwo)) ||
    r.includes(firstTwo) || r.includes(noAccents(firstTwo)) ||
    r.includes(keyWords) || r.includes(noAccents(keyWords)) ||
    r.includes(shortName) || r.includes(noAccents(shortName))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const hotelIdParam = searchParams.get('hotel_id')
  const platformParam = searchParams.get('platform')

  if (!hotelIdParam) {
    const { data: setting } = await supabase.from('settings').select('value').eq('key', 'ai_visibility_cron_enabled').single()
    if (setting?.value !== 'true') return NextResponse.json({ message: 'AI visibility cron is disabled' })
  }

  let hotelsQuery = supabase.from('hotels').select('id, name, region').eq('is_active', true).eq('is_partner', true)
  if (hotelIdParam) hotelsQuery = hotelsQuery.eq('id', hotelIdParam)
  const { data: hotels, error: hotelsError } = await hotelsQuery
  if (hotelsError) return NextResponse.json({ error: hotelsError.message })
  if (!hotels?.length) return NextResponse.json({ error: 'No partner hotels found' })

  const platformsToRun = platformParam ? PLATFORMS.filter(p => p.id === platformParam) : PLATFORMS

  let totalAppearances = 0
  let totalQueries = 0
  let estimatedCost = 0
  const appeared_results: any[] = []
  const errors: any[] = []

  for (const hotel of hotels) {
    const { data: customQueries } = await supabase
      .from('ai_visibility_queries')
      .select('query')
      .eq('hotel_id', hotel.id)
      .eq('is_active', true)

    if (!customQueries?.length) continue
    const queriesToRun = customQueries.map(q => q.query)

    // Run one platform at a time, queries in parallel within each platform
    for (const platform of platformsToRun) {
      for (const query of queriesToRun) {
        const responseText = await platform.queryFn(query)
        if (platform.id === 'chatgpt') estimatedCost += 0.01
        else estimatedCost += 0.001
        totalQueries++

        const appeared = checkAppeared(hotel.name, responseText)
        let snippet: string | null = null

        if (appeared && responseText) {
          const r = responseText.toLowerCase()
          const n = hotel.name.toLowerCase()
          const idx = r.indexOf(n) !== -1 ? r.indexOf(n) : r.indexOf(hotel.name.split(' ').slice(-2).join(' ').toLowerCase())
          if (idx !== -1) snippet = responseText.substring(Math.max(0, idx - 50), idx + 150).trim()
          totalAppearances++
        }

        await supabase.from('ai_visibility_scores').upsert({
          hotel_id: hotel.id,
          hotel_name: hotel.name,
          query,
          appeared,
          platform: platform.id,
          response_snippet: snippet,
          checked_at: new Date().toISOString(),
        }, { onConflict: 'hotel_id,query,platform' })

        if (appeared) appeared_results.push({ hotel: hotel.name, query, platform: platform.id, appeared })
        await new Promise(r => setTimeout(r, 2000))
      }
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  await supabase.from('cron_costs').insert({
    hotels_checked: hotels.length,
    queries_run: totalQueries,
    platforms_checked: platformsToRun.length,
    estimated_cost_usd: estimatedCost,
    triggered_by: hotelIdParam ? 'manual' : 'cron',
    run_at: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    queries_run: totalQueries,
    hotels_checked: hotels.length,
    platforms_checked: platformsToRun.length,
    total_appearances: totalAppearances,
    estimated_cost_usd: Number(estimatedCost.toFixed(4)),
    errors: errors.length ? errors : undefined,
    results: appeared_results.slice(0, 10),
  })
}