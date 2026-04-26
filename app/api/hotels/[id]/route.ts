import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const { data, error } = await supabase
    .from('hotels')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Revalidate the hotel profile page and hotels list
  revalidatePath('/hotels')
  revalidatePath('/hotels/' + id)
  revalidatePath('/')

  return NextResponse.json({ success: true, hotel: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error } = await supabase
    .from('hotels')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/hotels')
  revalidatePath('/')

  return NextResponse.json({ success: true })
}