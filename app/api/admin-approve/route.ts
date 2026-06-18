import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const { id, hotel_id, user_id, email, password } = await request.json()
  const ok = cookieStore.get('admin_auth')?.value === process.env.ADMIN_PASSWORD
    || password === process.env.ADMIN_PASSWORD
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hotel_id) return NextResponse.json({ error: 'Missing hotel_id' }, { status: 400 })

  // Case 1: approving an existing pending row (has id) → set its hotel + approve
  if (id) {
    const { error } = await supabaseAdmin
      .from('hotel_users')
      .update({ hotel_id, status: 'approved' })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Case 2: adding ANOTHER hotel to an existing user (has user_id) → insert a new approved row
  if (user_id) {
    // avoid duplicate link
    const { data: existing } = await supabaseAdmin
      .from('hotel_users')
      .select('id')
      .eq('user_id', user_id)
      .eq('hotel_id', hotel_id)
      .maybeSingle()
    if (existing) return NextResponse.json({ ok: true, message: 'already linked' })

    const { error } = await supabaseAdmin
      .from('hotel_users')
      .insert({ user_id, email: email || null, hotel_id, status: 'approved' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Missing id or user_id' }, { status: 400 })
}
