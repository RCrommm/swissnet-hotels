import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://swissnethotels.com'}/api/notify-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotel_name: 'NEW SIGNUP', action: 'New account awaiting approval', detail: email }),
    }).catch(() => {})
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
