import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { hotel_name, action, detail } = await request.json()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'SwissNet Hotels <notifications@swissnethotels.com>',
      to: ['contact@swissnethotels.com'],
      subject: `[SwissNet] ${hotel_name} — ${action}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #C9A84C;">SwissNet Hotels — Dashboard Activity</h2>
          <p><strong>Hotel:</strong> ${hotel_name}</p>
          <p><strong>Action:</strong> ${action}</p>
          <p><strong>Detail:</strong> ${detail}</p>
          <p style="color: #999; font-size: 12px;">Sent from SwissNet Hotels dashboard</p>
        </div>
      `,
    }),
  })

  if (!res.ok) {
    console.error('Email notification failed:', await res.text())
  }

  return NextResponse.json({ ok: true })
}