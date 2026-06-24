// app/api/loscar-audit/route.ts
// STEP 1: Scraper only. Fetch L'Oscar pages → extract text → hash → store. NO AI yet.
import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import crypto from 'crypto'

// ── EDIT to add/remove pages ──
const LOSCAR_PAGES: { url: string; page_type: string }[] = [
  { url: 'https://www.loscarlondon.com/',                page_type: 'homepage' },
  { url: 'https://www.loscarlondon.com/accommodation/',  page_type: 'accommodation' },
  { url: 'https://www.loscarlondon.com/restaurant/',     page_type: 'restaurant' },
  { url: 'https://www.loscarlondon.com/events/',         page_type: 'events' },
  { url: 'https://www.loscarlondon.com/contact/',        page_type: 'contact' },
]

const HOTEL_SLUG = 'loscar-london'

function extractText(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : ''
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return { title, text }
}

async function fetchPage(url: string): Promise<{ status: number; html: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SwissNetAuditBot/1.0)' },
      redirect: 'follow',
    })
    const html = res.ok ? await res.text() : ''
    return { status: res.status, html }
  } catch {
    return { status: 0, html: '' }
  } finally {
    clearTimeout(timer)
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: hotel } = await supabase
    .from('audit_hotels').select('id, name').eq('slug', HOTEL_SLUG).single()
  if (!hotel) return NextResponse.json({ error: 'L\'Oscar not found in audit_hotels' }, { status: 404 })

  const extracted: any[] = []
  const failed: any[] = []
  for (const page of LOSCAR_PAGES) {
    const { status, html } = await fetchPage(page.url)
    if (status !== 200 || !html) { failed.push({ url: page.url, status }); continue }
    const { title, text } = extractText(html)
    if (!text || text.length < 50) {
      failed.push({ url: page.url, status, reason: 'empty_or_js_rendered', text_length: text.length })
      continue
    }
    const content_hash = crypto.createHash('sha256').update(text).digest('hex')
    extracted.push({ url: page.url, page_type: page.page_type, title, text, content_hash })
    await new Promise(r => setTimeout(r, 300))
  }

  if (extracted.length === 0) {
    return NextResponse.json({
      success: false,
      error: 'No pages scraped — likely JS-rendered or wrong URLs. No audit created.',
      failed,
    }, { status: 422 })
  }

  const { data: audit, error: auditErr } = await supabase
    .from('audits')
    .insert({ hotel_id: hotel.id, model_name: 'scraper-only-v1', overall_summary: 'Scrape step — no analysis yet' })
    .select().single()
  if (auditErr || !audit) return NextResponse.json({ error: 'Could not create audit row', detail: auditErr?.message }, { status: 500 })

  const stored: any[] = []
  for (const p of extracted) {
    const { error: pageErr } = await supabase.from('audit_pages').insert({
      audit_id: audit.id, hotel_id: hotel.id, url: p.url,
      page_type: p.page_type, title: p.title, extracted_text: p.text, content_hash: p.content_hash,
    })
    if (pageErr) { failed.push({ url: p.url, reason: 'db_write_failed', detail: pageErr.message }); continue }
    stored.push({ url: p.url, page_type: p.page_type, title: p.title, text_length: p.text.length })
  }

  if (stored.length === 0) {
    await supabase.from('audits').delete().eq('id', audit.id)
    return NextResponse.json({ success: false, error: 'All page inserts failed — audit removed.', failed }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    audit_id: audit.id,
    hotel: hotel.name,
    pages_stored: stored.length,
    pages_failed: failed.length,
    stored,
    failed,
  })
}
