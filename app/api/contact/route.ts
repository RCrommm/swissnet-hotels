import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, email, hotel_name, phone, enquiry_type, message } = body

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
  }

  try {
    await resend.emails.send({
      from: 'SwissNet Hotels <contact@swissnethotels.com>',
to: 'contact@swissnethotels.com',
      subject: `SwissNet: ${enquiry_type === 'demo' ? 'Demo Request' : enquiry_type === 'join' ? 'New Hotel Wants to Join' : 'New Enquiry'} from ${name}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 2rem; background: #f8f5ef;">
          <h1 style="color: #492816; font-size: 1.5rem; margin-bottom: 1rem;">New ${enquiry_type === 'demo' ? 'Demo Request' : enquiry_type === 'join' ? 'Platform Join Request' : 'Enquiry'}</h1>
          
          <div style="background: white; padding: 1.5rem; border-left: 3px solid #C9A84C; margin-bottom: 1rem;">
            <p style="margin: 0 0 0.5rem;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 0 0 0.5rem;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            ${hotel_name ? `<p style="margin: 0 0 0.5rem;"><strong>Hotel:</strong> ${hotel_name}</p>` : ''}
            ${phone ? `<p style="margin: 0 0 0.5rem;"><strong>Phone:</strong> ${phone}</p>` : ''}
            <p style="margin: 0 0 0.5rem;"><strong>Type:</strong> ${enquiry_type}</p>
          </div>
          
          ${message ? `
          <div style="background: white; padding: 1.5rem; margin-bottom: 1rem;">
            <strong>Message:</strong>
            <p style="margin: 0.5rem 0 0; line-height: 1.6;">${message}</p>
          </div>
          ` : ''}
          
          <p style="color: #888; font-size: 0.8rem;">Sent from SwissNet Hotels contact form</p>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}