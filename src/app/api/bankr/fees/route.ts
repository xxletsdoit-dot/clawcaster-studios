import { NextRequest, NextResponse } from 'next/server'
import { getBankrClient } from '@/lib/bankr/client'
import { getWalletManager } from '@/lib/bankr/wallet'
import { FeeSplitConfig, DEFAULT_FEE_SPLIT, SupportedChain } from '@/lib/bankr/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get('tokenId')
    const chain = (searchParams.get('chain') as SupportedChain) || 'base'

    const walletManager = getWalletManager()
    const agentWallets = walletManager.getAllAgentWallets()

    const feeRecipients = agentWallets.map(wallet => ({
      agentType: wallet.agentType,
      address: wallet.address,
      percent: wallet.feePercent,
      balance: wallet.balance,
    }))

    const producerWallet = walletManager.getProducerWallet()
    feeRecipients.push({
      agentType: 'humanProducer',
      address: producerWallet.address,
      percent: producerWallet.feePercent,
      balance: producerWallet.balance,
    })

    feeRecipients.push({
      agentType: 'platformFee',
      address: '0xplatform00000000000000000000000000',
      percent: DEFAULT_FEE_SPLIT.platformFee,
      balance: '0.00',
    })

    if (tokenId) {
      return NextResponse.json({
        success: true,
        data: {
          tokenId,
          chain,
          feeSplit: DEFAULT_FEE_SPLIT,
          recipients: feeRecipients,
          totalDistributed: 0,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        feeSplit: DEFAULT_FEE_SPLIT,
        recipients: feeRecipients,
      },
    })
  } catch (error) {
    console.error('Error fetching fee info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fee info' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, chain = 'base', feeSplit } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    const client = getBankrClient()
    const effectiveFeeSplit = feeSplit || DEFAULT_FEE_SPLIT

    const distributionResults = await client.distributeFees(
      amount,
      effectiveFeeSplit as FeeSplitConfig,
      chain as SupportedChain
    )

    const distribution = Object.entries(effectiveFeeSplit).map(([key, percent]) => ({
      recipient: key,
      percent,
      amount: (amount * percent) / 100,
    }))

    return NextResponse.json({
      success: true,
      data: {
        totalAmount: amount,
        chain,
        distribution,
        results: distributionResults,
      },
    })
  } catch (error) {
    console.error('Error distributing fees:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to distribute fees' },
      { status: 500 }
    )
  }
}
