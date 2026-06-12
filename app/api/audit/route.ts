import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

    let target = url.trim()
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target

    // Fetch the page like a normal browser, with a timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    let html = ''
    try {
      const res = await fetch(target, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"macOS"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: controller.signal,
        redirect: 'follow',
      })
      clearTimeout(timeout)
      if (!res.ok) {
        return NextResponse.json({ error: `Site returned status ${res.status}`, reachable: false }, { status: 200 })
      }
      html = await res.text()
    } catch (e: any) {
      clearTimeout(timeout)
      return NextResponse.json({ error: 'Could not reach the site (it may be slow or blocking automated visits).', reachable: false }, { status: 200 })
    }

    const lower = html.toLowerCase()

    // Strip tags to get readable text (what a simple crawler "sees")
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase()

    const textLength = text.trim().length

    // --- Checks ---
    const hasJsonLd = /<script[^>]+type=["']application\/ld\+json["']/i.test(html)
    const jsonLdIsHotel = /"@type"\s*:\s*"(hotel|lodgingbusiness|resort)"/i.test(html)
    const hasFaqSchema = /"@type"\s*:\s*"faqpage"/i.test(html) || /"@type"\s*:\s*"question"/i.test(html)
    const hasFaqText = /\bfaq\b|frequently asked|questions fréquentes|foire aux questions/i.test(text)
    const hasMetaDesc = /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{20,}/i.test(html)
    const hasCheckin = /check[\s-]?in|check[\s-]?out|arrival|arrivée|départ|15:00|14:00|12:00|11:00|3 ?pm|2 ?pm/i.test(text)
    const hasCancellation = /cancellation|cancel|annulation|refund|non-refundable/i.test(text)
    const hasPhone = /\+\d[\d\s().-]{7,}/.test(text) || /tel:\+?\d/i.test(html)
    const hasAddress = /\b\d{4,5}\b[^.]{0,40}(geneva|genève|zurich|lausanne|switzerland|suisse|street|avenue|rue|quai|strasse)/i.test(text)
    const hasRoomCount = /\b\d{1,3}\s*(rooms|suites|chambres|bedrooms|keys)\b/i.test(text)
    const hasDining = /restaurant|dining|michelin|gastronom|cuisine|bar\b|breakfast|petit[\s-]déjeuner/i.test(text)
    const looksThin = textLength < 600

    const findings = [
      {
        key: 'jsonld',
        label: 'Structured data (schema) for AI',
        ok: hasJsonLd,
        detail: hasJsonLd
          ? (jsonLdIsHotel ? 'Found, and it identifies you as a hotel — exactly what AI needs.' : 'Found, but it may not declare the hotel type. Make sure your schema uses the "Hotel" type.')
          : 'No structured data found in the page. This is the single most important signal — AI uses it to understand what you are.',
        priority: 'High',
      },
      {
        key: 'faq',
        label: 'FAQ content',
        ok: hasFaqSchema || hasFaqText,
        detail: (hasFaqSchema || hasFaqText)
          ? (hasFaqSchema ? 'FAQ structured data found — AI can quote your answers directly.' : 'FAQ text found. Adding FAQ schema markup would make it even easier for AI to quote you.')
          : 'No FAQ section found. FAQs are one of the most-quoted sources for AI answers — adding them is high-impact.',
        priority: 'High',
      },
      {
        key: 'checkin',
        label: 'Practical details (check-in, times)',
        ok: hasCheckin,
        detail: hasCheckin
          ? 'Check-in / arrival details appear in your readable text.'
          : 'No check-in or arrival times found in plain text. Guests increasingly ask AI these — make sure they are written out, not in an image.',
        priority: 'Medium',
      },
      {
        key: 'cancellation',
        label: 'Cancellation policy in text',
        ok: hasCancellation,
        detail: hasCancellation
          ? 'Cancellation / booking policy wording found.'
          : 'No cancellation policy found in readable text. This is a common guest question AI tries to answer.',
        priority: 'Medium',
      },
      {
        key: 'rooms',
        label: 'Room / suite count mentioned',
        ok: hasRoomCount,
        detail: hasRoomCount
          ? 'A room or suite count appears in your text — good concrete detail for AI.'
          : 'No room/suite count found. AI favours concrete numbers; stating "X rooms and Y suites" helps.',
        priority: 'Medium',
      },
      {
        key: 'dining',
        label: 'Dining / restaurants named',
        ok: hasDining,
        detail: hasDining
          ? 'Dining or restaurant information found.'
          : 'No dining or restaurant detail found. Named restaurants (and any Michelin recognition) are strong signals.',
        priority: 'Low',
      },
      {
        key: 'contact',
        label: 'Address & phone in text',
        ok: hasPhone || hasAddress,
        detail: (hasPhone || hasAddress)
          ? 'Contact details appear in readable text.'
          : 'Address or phone not clearly found in text. Make sure they are written out, not only in an image or map widget.',
        priority: 'Low',
      },
      {
        key: 'meta',
        label: 'Meta description',
        ok: hasMetaDesc,
        detail: hasMetaDesc
          ? 'A meta description is present.'
          : 'No meta description found. It is a small but easy win for how you are summarised.',
        priority: 'Low',
      },
      {
        key: 'readable',
        label: 'Readable without JavaScript',
        ok: !looksThin,
        detail: looksThin
          ? 'Very little readable text was found — your content may load via JavaScript. If a simple visit sees little, AI crawlers may see little too. This is worth checking.'
          : 'Your page returns readable text directly, which AI crawlers can access.',
        priority: 'High',
      },
    ]

    const score = Math.round((findings.filter(f => f.ok).length / findings.length) * 100)

    return NextResponse.json({
      reachable: true,
      url: target,
      score,
      passed: findings.filter(f => f.ok).length,
      total: findings.length,
      findings,
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Audit failed: ' + (e?.message || 'unknown error') }, { status: 500 })
  }
}