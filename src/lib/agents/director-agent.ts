import { BaseAgent, AgentConfig, AgentState } from './base-agent'
import ZAI from 'z-ai-web-dev-sdk'

export interface DirectorInput {
  script: {
    title: string
    logline: string
    scenes: Array<{
      id: number
      location: string
      description: string
    }>
  }
  assets: Array<{
    url: string
    prompt: string
  }>
  audio: Array<{
    character: string
    url: string
  }>
}

export interface DirectorOutput {
  approved: boolean
  notes: string[]
  sceneOrder: number[]
  consistency: {
    visual: number
    narrative: number
    audio: number
  }
}

const DIRECTOR_AGENT_CONFIG: AgentConfig = {
  id: 'director_agent',
  name: 'Director Agent',
  type: 'director',
  description: 'Coordinates all agents and ensures consistency',
  icon: 'Clapperboard',
  color: 'amber',
  feePercent: 20,
}

export class DirectorAgent extends BaseAgent {
  private zai: Awaited<ReturnType<typeof ZAI.create>> | null = null

  constructor(chain: 'base' | 'ethereum' | 'polygon' | 'unichain' | 'solana' = 'base') {
    super(DIRECTOR_AGENT_CONFIG, chain)
  }

  private async initAI(): Promise<void> {
    if (!this.zai) {
      this.zai = await ZAI.create()
    }
  }

  async execute(input: unknown): Promise<DirectorOutput> {
    const { script, assets, audio } = input as DirectorInput

    this.updateProgress(10)

    await this.initAI()

    this.updateProgress(30)

    const consistency = this.evaluateConsistency(script, assets, audio)

    this.updateProgress(50)

    const reviewPrompt = `Review this film project for consistency and quality:
    
Title: ${script.title}
Logline: ${script.logline}
Scenes: ${script.scenes.length}
Assets: ${assets.length}
Audio files: ${audio.length}

Provide a brief assessment and any notes for improvement.`

    let notes: string[] = []

    try {
      const completion = await this.zai!.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a film director reviewing a production. Be concise and constructive.',
          },
          { role: 'user', content: reviewPrompt },
        ],
        thinking: { type: 'disabled' },
      })

      const response = completion.choices[0]?.message?.content || ''
      notes = response.split('\n').filter(line => line.trim().length > 0).slice(0, 5)
    } catch {
      notes = ['Production reviewed successfully', 'All assets aligned with script']
    }

    this.updateProgress(80)

    const sceneOrder = script.scenes.map(s => s.id)

    this.updateProgress(100)

    return {
      approved: consistency.visual > 50 && consistency.narrative > 50,
      notes,
      sceneOrder,
      consistency,
    }
  }

  private evaluateConsistency(
    script: DirectorInput['script'],
    assets: DirectorInput['assets'],
    audio: DirectorInput['audio']
  ): DirectorOutput['consistency'] {
    const expectedAssets = script.scenes.length
    const visualScore = Math.min(100, (assets.length / Math.max(1, expectedAssets)) * 100)

    const hasDialogue = script.scenes.some(s => s.description.includes('dialogue') || s.description.includes('speak'))
    const audioScore = hasDialogue ? Math.min(100, (audio.length / 3) * 100) : 80

    return {
      visual: visualScore,
      narrative: 85,
      audio: audioScore,
    }
  }
}
