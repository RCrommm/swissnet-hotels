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

async function fetchPage(url: string): Promise<{ status: number; text: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SwissNetBot/1.0)' },
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

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const BATCH = 80

  const { data: partners } = await supabase
    .from('hotels')
    .select('id, name')
    .eq('is_partner', true)
    .eq('is_active', true)
  if (!partners?.length) return NextResponse.json({ message: 'No partner hotels' })

  const { data: cites } = await supabase
    .from('ai_citations')
    .select('source_url')
    .eq('region', 'Geneva')
    .limit(10000)
  const allUrls = [...new Set((cites || []).map((c: any) => c.source_url))]

  const { data: done } = await supabase
    .from('page_mentions')
    .select('source_url, hotel_id')
  const doneSet = new Set((done || []).map((d: any) => `${d.source_url}|${d.hotel_id}`))

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