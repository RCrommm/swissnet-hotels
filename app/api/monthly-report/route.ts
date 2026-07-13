import { NextResponse } from 'next/server'
import { gatherMonthlyReportData } from '@/lib/monthly-report'

const ADMIN_PASSWORD = process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { hotelId, month, password } = await req.json()
    if (password !== ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hotelId) return NextResponse.json({ error: 'Missing hotelId' }, { status: 400 })
    const data = await gatherMonthlyReportData(hotelId, month)
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to build monthly report' }, { status: 500 })
  }
}