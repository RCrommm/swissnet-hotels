import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const region = searchParams.get('region')
  const category = searchParams.get('category')
  const limit = parseInt(searchParams.get('limit') || '20')

  let query = supabase
    .from('hotels')
    .select('*')
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(limit)

  if (region) query = query.eq('region', region)
  if (category) query = query.eq('category', category)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  return NextResponse.json({ hotels: data, count: data?.length || 0 })
}