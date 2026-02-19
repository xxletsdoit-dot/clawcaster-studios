import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/seed - Seed initial data
export async function POST() {
  try {
    // Create default agents
    const agentTypes = [
      { type: 'script', name: 'Script Agent', description: 'Generates story, dialogue, and scene descriptions', fee: 0.40 },
      { type: 'asset', name: 'Asset Agent', description: 'Creates visual assets, backgrounds, and characters', fee: 0.10 },
      { type: 'voice', name: 'Voice Agent', description: 'Synthesizes character voices and sound effects', fee: 0.05 },
      { type: 'director', name: 'Director Agent', description: 'Coordinates all agents and ensures consistency', fee: 0.20 },
      { type: 'rendering', name: 'Rendering Agent', description: 'Composites final video with effects', fee: 0.10 }
    ]

    const agents = []
    for (const agent of agentTypes) {
      // Check if agent exists
      const existing = await db.agent.findFirst({
        where: { type: agent.type }
      })

      if (!existing) {
        const walletAddress = `0x${agent.type.slice(0, 4)}${Date.now().toString(16)}${Math.random().toString(16).slice(2, 6)}`
        const newAgent = await db.agent.create({
          data: {
            name: agent.name,
            type: agent.type,
            description: agent.description,
            walletAddress,
            publicKey: `pk_${Math.random().toString(36).slice(2, 15)}`
          }
        })
        agents.push(newAgent)
      } else {
        agents.push(existing)
      }
    }

    // Create default fee config
    const existingConfig = await db.feeConfig.findFirst({
      where: { isActive: true }
    })

    let feeConfig = existingConfig
    if (!existingConfig) {
      feeConfig = await db.feeConfig.create({
        data: {
          name: 'default_split',
          scriptAgent: 0.40,
          directorAgent: 0.20,
          renderingAgent: 0.10,
          assetAgent: 0.10,
          voiceAgent: 0.05,
          humanProducer: 0.10,
          platformFee: 0.05
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        agents: agents.length,
        feeConfig: !!feeConfig
      }
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}

// GET /api/seed - Check seed status
export async function GET() {
  try {
    const agentsCount = await db.agent.count()
    const feeConfigCount = await db.feeConfig.count()
    const projectsCount = await db.project.count()

    return NextResponse.json({
      success: true,
      status: {
        agents: agentsCount,
        feeConfigs: feeConfigCount,
        projects: projectsCount
      }
    })
  } catch (error) {
    console.error('Error checking seed status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check seed status' },
      { status: 500 }
    )
  }
}
