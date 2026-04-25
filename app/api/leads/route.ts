import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const { name, email, phone, hotel_id, hotel_name, check_in, check_out, guests, message } = body

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('leads')
    .insert([{ name, email, phone, hotel_id, hotel_name, check_in, check_out, guests, message, source: 'website' }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, lead: data }, { status: 201 })
}