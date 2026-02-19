import { BaseAgent, AgentConfig } from './base-agent'
import ZAI from 'z-ai-web-dev-sdk'

export interface AssetInput {
  prompt: string
  sceneDescriptions?: string[]
  style?: string
  count?: number
}

export interface AssetOutput {
  images: Array<{
    url: string
    prompt: string
    width: number
    height: number
  }>
  generatedAt: Date
}

const ASSET_AGENT_CONFIG: AgentConfig = {
  id: 'asset_agent',
  name: 'Asset Agent',
  type: 'asset',
  description: 'Creates visual assets, backgrounds, and characters',
  icon: 'Palette',
  color: 'pink',
  feePercent: 10,
}

export class AssetAgent extends BaseAgent {
  private zai: Awaited<ReturnType<typeof ZAI.create>> | null = null

  constructor(chain: 'base' | 'ethereum' | 'polygon' | 'unichain' | 'solana' = 'base') {
    super(ASSET_AGENT_CONFIG, chain)
  }

  private async initAI(): Promise<void> {
    if (!this.zai) {
      this.zai = await ZAI.create()
    }
  }

  async execute(input: unknown): Promise<AssetOutput> {
    const { prompt, sceneDescriptions = [], style = 'cinematic', count = 2 } = input as AssetInput

    await this.initAI()

    const images: AssetOutput['images'] = []
    const prompts = sceneDescriptions.length > 0 ? sceneDescriptions : [prompt]

    this.updateProgress(10)

    for (let i = 0; i < Math.min(prompts.length, count); i++) {
      const scenePrompt = prompts[i]
      const imagePrompt = `${style} style, ${scenePrompt}, dramatic lighting, high quality, 4k`

      try {
        this.updateProgress(10 + (i / prompts.length) * 80)

        const result = await this.zai!.images.generate({
          prompt: imagePrompt,
          n: 1,
          size: '1024x1024',
        })

        if (result.data && result.data[0]) {
          images.push({
            url: result.data[0].url || '',
            prompt: imagePrompt,
            width: 1024,
            height: 1024,
          })
        }
      } catch (error) {
        console.error(`Failed to generate image ${i + 1}:`, error)
        images.push({
          url: '/placeholder-image.jpg',
          prompt: imagePrompt,
          width: 1024,
          height: 1024,
        })
      }
    }

    this.updateProgress(100)

    return {
      images,
      generatedAt: new Date(),
    }
  }
}
