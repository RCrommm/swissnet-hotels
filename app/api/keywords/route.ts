import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const hotelId = searchParams.get('hotel_id')

  let query = supabase
    .from('hotel_keywords')
    .select('*')
    .order('priority', { ascending: true })

  if (hotelId) query = query.eq('hotel_id', hotelId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ keywords: data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { hotel_id, keyword, priority } = body

  if (!hotel_id || !keyword) {
    return NextResponse.json({ error: 'hotel_id and keyword required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('hotel_keywords')
    .insert([{ hotel_id, keyword, priority: priority || 1 }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, keyword: data }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('hotel_keywords')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}