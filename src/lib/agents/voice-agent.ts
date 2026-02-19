import { BaseAgent, AgentConfig } from './base-agent'

export interface VoiceInput {
  dialogue: Array<{
    character: string
    line: string
  }>
  voices?: Record<string, string>
}

export interface VoiceOutput {
  audioFiles: Array<{
    character: string
    url: string
    duration: number
  }>
  totalDuration: number
}

const VOICE_AGENT_CONFIG: AgentConfig = {
  id: 'voice_agent',
  name: 'Voice Agent',
  type: 'voice',
  description: 'Synthesizes character voices and sound effects',
  icon: 'Mic',
  color: 'cyan',
  feePercent: 5,
}

export class VoiceAgent extends BaseAgent {
  constructor(chain: 'base' | 'ethereum' | 'polygon' | 'unichain' | 'solana' = 'base') {
    super(VOICE_AGENT_CONFIG, chain)
  }

  async execute(input: unknown): Promise<VoiceOutput> {
    const { dialogue } = input as VoiceInput

    this.updateProgress(10)

    const audioFiles: VoiceOutput['audioFiles'] = []

    for (let i = 0; i < dialogue.length; i++) {
      const { character, line } = dialogue[i]

      this.updateProgress(10 + (i / dialogue.length) * 80)

      const duration = this.estimateDuration(line)

      audioFiles.push({
        character,
        url: `/audio/${character.toLowerCase()}_${i}.mp3`,
        duration,
      })
    }

    this.updateProgress(100)

    return {
      audioFiles,
      totalDuration: audioFiles.reduce((sum, a) => sum + a.duration, 0),
    }
  }

  private estimateDuration(text: string): number {
    const wordsPerMinute = 150
    const wordCount = text.split(' ').length
    return (wordCount / wordsPerMinute) * 60
  }
}
