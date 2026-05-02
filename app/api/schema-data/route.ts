import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const hotel_id = searchParams.get('hotel_id')
  if (!hotel_id) return NextResponse.json({ error: 'Missing hotel_id' }, { status: 400 })

  const [rooms, spa, restaurants, experiences] = await Promise.all([
    supabase.from('room_types').select('*').eq('hotel_id', hotel_id).order('sort_order'),
    supabase.from('hotel_spa').select('*').eq('hotel_id', hotel_id),
    supabase.from('hotel_restaurants').select('*').eq('hotel_id', hotel_id).order('sort_order'),
    supabase.from('hotel_experiences').select('*').eq('hotel_id', hotel_id).order('sort_order'),
  ])

  return NextResponse.json({
    rooms: rooms.data || [],
    spa: spa.data || [],
    restaurants: restaurants.data || [],
    experiences: experiences.data || [],
  })
}

export async function POST(request: NextRequest) {
  const { hotel_id, type, data } = await request.json()
  if (!hotel_id || !type || !data) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const tableMap: Record<string, string> = {
    rooms: 'room_types',
    spa: 'hotel_spa',
    restaurants: 'hotel_restaurants',
    experiences: 'hotel_experiences',
  }

  const table = tableMap[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  await supabase.from(table).delete().eq('hotel_id', hotel_id)

  if (data.length > 0) {
    const rows = data.map((item: any, idx: number) => ({
      ...item,
      hotel_id,
      id: item.id || undefined,
      sort_order: idx + 1,
    }))
    const { error } = await supabase.from(table).insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
