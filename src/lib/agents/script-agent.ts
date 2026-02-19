import { BaseAgent, AgentConfig, AgentState } from './base-agent'
import ZAI from 'z-ai-web-dev-sdk'

export interface ScriptInput {
  prompt: string
  style?: string
  duration?: number
}

export interface ScriptOutput {
  title: string
  logline: string
  characters: Array<{
    name: string
    description: string
  }>
  scenes: Array<{
    id: number
    location: string
    description: string
    dialogue: Array<{
      character: string
      line: string
    }>
  }>
  rawScript: string
}

const SCRIPT_AGENT_CONFIG: AgentConfig = {
  id: 'script_agent',
  name: 'Script Agent',
  type: 'script',
  description: 'Generates story, dialogue, and scene descriptions',
  icon: 'Sparkles',
  color: 'violet',
  feePercent: 40,
}

export class ScriptAgent extends BaseAgent {
  private zai: Awaited<ReturnType<typeof ZAI.create>> | null = null

  constructor(chain: 'base' | 'ethereum' | 'polygon' | 'unichain' | 'solana' = 'base') {
    super(SCRIPT_AGENT_CONFIG, chain)
  }

  private async initAI(): Promise<void> {
    if (!this.zai) {
      this.zai = await ZAI.create()
    }
  }

  async execute(input: unknown): Promise<ScriptOutput> {
    const { prompt, style = 'cinematic', duration = 120 } = input as ScriptInput

    await this.initAI()

    this.updateProgress(10)

    const systemPrompt = `You are a professional screenwriter specializing in short films. 
Generate a script in JSON format with the following structure:
{
  "title": "Film Title",
  "logline": "One sentence summary",
  "characters": [{"name": "Name", "description": "Brief description"}],
  "scenes": [{"id": 1, "location": "Location", "description": "Scene description", "dialogue": [{"character": "Name", "line": "Spoken line"}]}]
}

Style: ${style}
Target duration: ${duration} seconds
Keep dialogue natural and concise.`

    this.updateProgress(30)

    const completion = await this.zai!.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      thinking: { type: 'disabled' },
    })

    this.updateProgress(80)

    const rawScript = completion.choices[0]?.message?.content || ''

    let parsedScript: ScriptOutput
    try {
      const jsonMatch = rawScript.match(/\{[\s\S]*\}/)
      parsedScript = jsonMatch ? JSON.parse(jsonMatch[0]) : this.getDefaultScript(prompt)
    } catch {
      parsedScript = this.getDefaultScript(prompt)
    }

    parsedScript.rawScript = rawScript

    this.updateProgress(100)

    return parsedScript
  }

  private getDefaultScript(prompt: string): ScriptOutput {
    return {
      title: 'Untitled Film',
      logline: prompt.slice(0, 100),
      characters: [{ name: 'Protagonist', description: 'Main character' }],
      scenes: [
        {
          id: 1,
          location: 'Unknown',
          description: prompt,
          dialogue: [],
        },
      ],
      rawScript: '',
    }
  }
}
