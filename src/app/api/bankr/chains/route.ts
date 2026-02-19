import { NextResponse } from 'next/server'
import { SUPPORTED_CHAINS } from '@/lib/bankr/types'

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        chains: SUPPORTED_CHAINS,
        default: 'base',
        count: SUPPORTED_CHAINS.length,
      },
    })
  } catch (error) {
    console.error('Error fetching chains:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chains' },
      { status: 500 }
    )
  }
}
