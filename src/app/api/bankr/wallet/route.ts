import { NextRequest, NextResponse } from 'next/server'
import { getBankrClient } from '@/lib/bankr/client'
import { getWalletManager } from '@/lib/bankr/wallet'
import { SupportedChain } from '@/lib/bankr/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chain = (searchParams.get('chain') as SupportedChain) || 'base'

    const client = getBankrClient()
    const walletManager = getWalletManager()

    const balances = await client.getWalletBalance(chain)
    const agentWallets = await client.getAgentWallets()
    const producerWallet = walletManager.getProducerWallet()

    return NextResponse.json({
      success: true,
      data: {
        balances,
        agentWallets: Object.values(agentWallets),
        producerWallet,
      },
    })
  } catch (error) {
    console.error('Error fetching wallet info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wallet info' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, amount, token, to, chain } = body

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      )
    }

    const client = getBankrClient()

    let result
    switch (action) {
      case 'swap':
        if (!amount || !token) {
          return NextResponse.json(
            { success: false, error: 'Amount and token are required for swap' },
            { status: 400 }
          )
        }
        result = await client.swap(token, 'VVV', amount, chain || 'base')
        break

      case 'transfer':
        if (!amount || !token || !to) {
          return NextResponse.json(
            { success: false, error: 'Amount, token, and destination are required for transfer' },
            { status: 400 }
          )
        }
        result = await client.transfer(to, amount, token, chain || 'base')
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error executing wallet action:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to execute wallet action' },
      { status: 500 }
    )
  }
}
