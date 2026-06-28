import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

function pageHasHotel(hotelName: string, pageText: string): boolean {
  const noAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const r = noAccents(pageText.toLowerCase())
  const n = noAccents(hotelName.toLowerCase())
  if (r.includes(n)) return true
  const words = n.split(' ').filter((w: string) => !['hotel','the','le','la','les','grand','de','du','au','aux','by','at','and','&'].includes(w))
  const lastTwo = noAccents(hotelName.split(' ').slice(-2).join(' ').toLowerCase())
  const firstTwo = noAccents(hotelName.split(' ').slice(0, 2).join(' ').toLowerCase())
  const keyWords = words.slice(0, 3).join(' ')
  return r.includes(lastTwo) || r.includes(firstTwo) || (words.length >= 2 && r.includes(keyWords))
}

async function fetchDirect(url: string): Promise<{ status: number; text: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
      redirect: 'follow',
    })
    const text = res.ok ? (await res.text()).slice(0, 200000) : ''
    return { status: res.status, text }
  } catch {
    return { status: 0, text: '' }
  } finally {
    clearTimeout(timer)
  }
}

async function fetchViaScrapingBee(url: string): Promise<{ status: number; text: string }> {
  const key = process.env.SCRAPINGBEE_API_KEY
  if (!key) return { status: 0, text: '' }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  try {
    const api = `https://app.scrapingbee.com/api/v1/?api_key=${key}&url=${encodeURIComponent(url)}&render_js=false`
    const res = await fetch(api, { signal: controller.signal })
    const text = res.ok ? (await res.text()).slice(0, 200000) : ''
    return { status: res.ok ? 200 : res.status, text }
  } catch {
    return { status: 0, text: '' }
  } finally {
    clearTimeout(timer)
  }
}

async function fetchPage(url: string): Promise<{ status: number; text: string }> {
  // Try a direct fetch first (free). If the site blocks us (403/429/0/etc.),
  // fall back to ScrapingBee, which renders as a real browser and gets through.
  const direct = await fetchDirect(url)
  if (direct.status === 200) return direct
  return await fetchViaScrapingBee(url)
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const BATCH = 80

  const { data: partners } = await supabase
    .from('hotels')
    .select('id, name')
    .eq('is_partner', true)
    .eq('is_active', true)
  if (!partners?.length) return NextResponse.json({ message: 'No partner hotels' })

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: cites } = await supabase
    .from('ai_citations')
    .select('source_url')
    .eq('region', 'Geneva')
    .gte('run_date', since30)
    .limit(10000)
  // Rank URLs by how often they're cited, keep only the top 100 —
  // the dashboard never displays beyond #100, so we never need to scan further.
  const counts: Record<string, number> = {}
  for (const c of (cites || [])) {
    if (c.source_url) counts[c.source_url] = (counts[c.source_url] || 0) + 1
  }
  const allUrls = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(([url]) => url)

  const { data: done } = await supabase
    .from('page_mentions')
    .select('source_url, hotel_id, http_status')
  // Only "done" if we actually reached the page (200). Blocked/throttled/timed-out
  // rows (403, 429, 0, etc.) stay eligible so the cron retries them next run.
  const doneSet = new Set(
    (done || [])
      .filter((d: any) => d.http_status === 200)
      .map((d: any) => `${d.source_url}|${d.hotel_id}`)
  )

  const todo = allUrls.filter(url => partners.some(p => !doneSet.has(`${url}|${p.id}`))).slice(0, BATCH)

  let checked = 0
  let reachable = 0
  const rows: any[] = []

  for (const url of todo) {
    const { status, text } = await fetchPage(url)
    checked++
    if (status === 200) reachable++
    for (const p of partners) {
      if (doneSet.has(`${url}|${p.id}`)) continue
      rows.push({
        source_url: url,
        hotel_id: p.id,
        mentioned: status === 200 ? pageHasHotel(p.name, text) : null,
        http_status: status,
        checked_at: new Date().toISOString(),
      })
    }
    await new Promise(r => setTimeout(r, 200))
  }

  if (rows.length) {
    await supabase.from('page_mentions').upsert(rows, { onConflict: 'source_url,hotel_id' })
  }

  return NextResponse.json({
    success: true,
    urls_checked: checked,
    reachable,
    rows_written: rows.length,
    remaining: allUrls.filter(url => partners.some(p => !doneSet.has(`${url}|${p.id}`))).length - checked,
  })
}