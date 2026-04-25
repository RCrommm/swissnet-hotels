import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { url } = await request.json()

  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  let text = ''

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(15000),
    })
    const html = await res.text()
    text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000)
  } catch {
    text = `Hotel website URL: ${url}`
  }

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `You are helping onboard a Swiss luxury hotel. Based on the website URL and text, extract hotel information. Use the URL to infer the hotel name if needed.

Website URL: ${url}
Website text: ${text}

Return ONLY this JSON, no other text:
{
  "name": "hotel name",
  "location": "city, canton",
  "description": "2-3 sentence description",
  "contact_email": "",
  "direct_booking_url": "${url}",
  "exclusive_offer": "",
  "nightly_rate_chf": "",
  "rating": "",
  "amenities": ["list of amenities"],
  "best_for": ["list of guest types"]
}`
          }
        ]
      })
    })

    const claudeData = await claudeRes.json()

    if (claudeData.error) {
      return NextResponse.json({ error: 'API error: ' + claudeData.error.message }, { status: 500 })
    }

    const content = claudeData.content[0].text
    const cleanJson = content.replace(/```json|```/g, '').trim()
    const hotelData = JSON.parse(cleanJson)

    return NextResponse.json({ success: true, data: hotelData })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 422 })
  }
}