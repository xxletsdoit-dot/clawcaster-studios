import { NextRequest, NextResponse } from 'next/server'
import { getBankrClient } from '@/lib/bankr/client'
import { TokenLaunchParams, SupportedChain, DEFAULT_FEE_SPLIT } from '@/lib/bankr/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractAddress = searchParams.get('contractAddress')
    const tokenId = searchParams.get('tokenId')

    if (!contractAddress || !tokenId) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Token launch endpoint ready',
          supportedChains: ['base', 'ethereum', 'polygon', 'unichain', 'solana'],
          defaultFeeSplit: DEFAULT_FEE_SPLIT,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        contractAddress,
        tokenId,
        status: 'deployed',
      },
    })
  } catch (error) {
    console.error('Error fetching token info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch token info' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, symbol, chain, description, feeSplit } = body as TokenLaunchParams

    if (!name || !symbol) {
      return NextResponse.json(
        { success: false, error: 'Token name and symbol are required' },
        { status: 400 }
      )
    }

    if (!chain) {
      return NextResponse.json(
        { success: false, error: 'Chain is required' },
        { status: 400 }
      )
    }

    const client = getBankrClient()

    const result = await client.launchToken({
      name,
      symbol,
      chain: chain as SupportedChain,
      description,
      feeSplit: feeSplit || DEFAULT_FEE_SPLIT,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Token launch failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error launching token:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to launch token' },
      { status: 500 }
    )
  }
}
