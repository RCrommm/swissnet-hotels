import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const query = searchParams.get('q') || 'best luxury hotel to stay in Geneva'

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      input: `${query}. Search the web and list all relevant hotels by name with their sources.`,
      tools: [{ type: 'web_search_preview' }],
      tool_choice: { type: 'web_search_preview' },
      include: ['web_search_call.action.sources'],
    }),
  })

  const data = await res.json()

  const citations: any[] = []
  const sources: any[] = []

  for (const item of data.output || []) {
    if (item.type === 'message') {
      for (const c of item.content || []) {
        for (const a of c.annotations || []) {
          if (a.type === 'url_citation') citations.push({ url: a.url, title: a.title })
        }
      }
    }
    if (item.type === 'web_search_call') {
      const srcs = item.action?.sources || []
      for (const s of srcs) sources.push(s.url || s)
    }
  }

  return NextResponse.json({
    query,
    model: 'gpt-4o',
    citation_count: citations.length,
    citations,
    sources_count: sources.length,
    sources,
    raw_output_types: (data.output || []).map((o: any) => o.type),
    error: data.error || null,
  })
}