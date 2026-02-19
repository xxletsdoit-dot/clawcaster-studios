import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/agents - List all agents
export async function GET() {
  try {
    const agents = await db.agent.findMany({
      include: {
        earnings: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: { contributions: true, earnings: true }
        }
      }
    })

    // Calculate total earnings for each agent
    const agentsWithEarnings = agents.map(agent => ({
      ...agent,
      totalEarnings: agent.earnings.reduce((sum, e) => sum + e.amount, 0)
    }))

    return NextResponse.json({
      success: true,
      agents: agentsWithEarnings
    })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, description, feePercent } = body

    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Generate a simulated Bankr wallet address
    const walletAddress = `0x${type.slice(0, 4)}${Date.now().toString(16)}${Math.random().toString(16).slice(2, 6)}`
    const publicKey = `pk_${Math.random().toString(36).slice(2, 15)}`

    const agent = await db.agent.create({
      data: {
        name,
        type,
        description: description || '',
        walletAddress,
        publicKey
      }
    })

    return NextResponse.json({
      success: true,
      agent
    })
  } catch (error) {
    console.error('Error creating agent:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}
