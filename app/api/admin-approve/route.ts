import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const ok = cookieStore.get('admin_auth')?.value === process.env.ADMIN_PASSWORD
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, hotel_id } = await request.json()
  if (!id || !hotel_id) return NextResponse.json({ error: 'Missing id or hotel_id' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('hotel_users')
    .update({ hotel_id, status: 'approved' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
