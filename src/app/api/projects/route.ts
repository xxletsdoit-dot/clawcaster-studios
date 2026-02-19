import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/projects - List all projects
export async function GET() {
  try {
    const projects = await db.project.findMany({
      include: {
        agents: {
          include: {
            agent: true
          }
        },
        assets: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      projects
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, title } = body

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Get or create default agents
    const agentTypes = ['script', 'asset', 'voice', 'director', 'rendering']
    const agents = await Promise.all(
      agentTypes.map(async (type) => {
        let agent = await db.agent.findFirst({
          where: { type }
        })

        if (!agent) {
          // Create agent with simulated wallet
          const walletAddress = `0x${type.slice(0, 4)}${Math.random().toString(16).slice(2, 10)}`
          agent = await db.agent.create({
            data: {
              name: `${type.charAt(0).toUpperCase() + type.slice(1)} Agent`,
              type,
              description: getAgentDescription(type),
              walletAddress
            }
          })
        }

        return agent
      })
    )

    // Create project with agent associations
    const project = await db.project.create({
      data: {
        title: title || prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
        prompt,
        status: 'draft',
        agents: {
          create: agents.map(agent => ({
            agentId: agent.id,
            role: agent.type,
            status: 'pending'
          }))
        }
      },
      include: {
        agents: {
          include: {
            agent: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      project
    })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

function getAgentDescription(type: string): string {
  const descriptions: Record<string, string> = {
    script: 'Generates story, dialogue, and scene descriptions',
    asset: 'Creates visual assets, backgrounds, and characters',
    voice: 'Synthesizes character voices and sound effects',
    director: 'Coordinates all agents and ensures consistency',
    rendering: 'Composites final video with effects'
  }
  return descriptions[type] || 'AI Agent'
}
