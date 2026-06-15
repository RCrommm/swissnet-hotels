import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const query = searchParams.get('q') || 'best luxury hotel to stay in Geneva'

  const res = await fetch('https://app.scrapingbee.com/api/v1/chatgpt', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SCRAPINGBEE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: query,
      search: true,
      country_code: 'ch',
      add_html: false,
    }),
  })

  const data = await res.json()

  return NextResponse.json({
    query,
    status: res.status,
    keys: Object.keys(data || {}),
    results_markdown: data?.results_markdown || null,
    raw: data,
  })
}