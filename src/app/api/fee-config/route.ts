import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/fee-config - Get fee configuration
export async function GET() {
  try {
    let feeConfig = await db.feeConfig.findFirst({
      where: { isActive: true }
    })

    // Create default config if not exists
    if (!feeConfig) {
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
      feeConfig
    })
  } catch (error) {
    console.error('Error fetching fee config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fee config' },
      { status: 500 }
    )
  }
}

// PUT /api/fee-config - Update fee configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      scriptAgent,
      directorAgent,
      renderingAgent,
      assetAgent,
      voiceAgent,
      humanProducer,
      platformFee
    } = body

    // Validate total is 100%
    const total = (scriptAgent || 0) + (directorAgent || 0) + (renderingAgent || 0) +
      (assetAgent || 0) + (voiceAgent || 0) + (humanProducer || 0) + (platformFee || 0)

    if (Math.abs(total - 1) > 0.001) {
      return NextResponse.json(
        { success: false, error: `Fee split must total 100%. Current total: ${(total * 100).toFixed(1)}%` },
        { status: 400 }
      )
    }

    // Deactivate old config and create new one
    await db.feeConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    const newConfig = await db.feeConfig.create({
      data: {
        name: `config_${Date.now()}`,
        scriptAgent: scriptAgent || 0.40,
        directorAgent: directorAgent || 0.20,
        renderingAgent: renderingAgent || 0.10,
        assetAgent: assetAgent || 0.10,
        voiceAgent: voiceAgent || 0.05,
        humanProducer: humanProducer || 0.10,
        platformFee: platformFee || 0.05
      }
    })

    return NextResponse.json({
      success: true,
      feeConfig: newConfig
    })
  } catch (error) {
    console.error('Error updating fee config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update fee config' },
      { status: 500 }
    )
  }
}
