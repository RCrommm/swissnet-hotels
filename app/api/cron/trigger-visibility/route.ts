import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Skipped' }, { status: 200 })
  }
  const res = await fetch(
    'https://api.github.com/repos/RCrommm/swissnet-hotels/actions/workflows/ai-visibility.yml/dispatches',
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${process.env.GH_DISPATCH_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'swissnet-cron',
      },
      body: JSON.stringify({ ref: 'main' }),
    }
  )
  const ok = res.status === 204
  return NextResponse.json({ triggered: ok, status: res.status, body: ok ? '' : await res.text() })
}
