import { SupportedChain, DEFAULT_FEE_SPLIT, FeeSplitConfig } from '../bankr/types'
import { ScriptAgent, ScriptOutput } from './script-agent'
import { AssetAgent, AssetOutput } from './asset-agent'
import { VoiceAgent, VoiceOutput } from './voice-agent'
import { DirectorAgent, DirectorOutput } from './director-agent'
import { RenderingAgent, RenderingOutput } from './rendering-agent'
import { BaseAgent, AgentState } from './base-agent'
import { getBankrClient } from '../bankr/client'

export interface WorkflowProgress {
  phase: 'script' | 'asset' | 'voice' | 'director' | 'rendering' | 'completed'
  agentName: string
  progress: number
  status: AgentState['status']
  message: string
}

export interface WorkflowResult {
  success: boolean
  script?: ScriptOutput
  assets?: AssetOutput
  audio?: VoiceOutput
  direction?: DirectorOutput
  video?: RenderingOutput
  totalDuration?: number
  feeSplit: FeeSplitConfig
}

export type ProgressCallback = (progress: WorkflowProgress) => void

export class WorkflowManager {
  private scriptAgent: ScriptAgent
  private assetAgent: AssetAgent
  private voiceAgent: VoiceAgent
  private directorAgent: DirectorAgent
  private renderingAgent: RenderingAgent
  private chain: SupportedChain
  private onProgress?: ProgressCallback

  constructor(chain: SupportedChain = 'base', onProgress?: ProgressCallback) {
    this.chain = chain
    this.onProgress = onProgress

    this.scriptAgent = new ScriptAgent(chain)
    this.assetAgent = new AssetAgent(chain)
    this.voiceAgent = new VoiceAgent(chain)
    this.directorAgent = new DirectorAgent(chain)
    this.renderingAgent = new RenderingAgent(chain)
  }

  private emitProgress(
    phase: WorkflowProgress['phase'],
    agentName: string,
    progress: number,
    status: AgentState['status'],
    message: string
  ): void {
    if (this.onProgress) {
      this.onProgress({ phase, agentName, progress, status, message })
    }
  }

  async execute(prompt: string): Promise<WorkflowResult> {
    const result: WorkflowResult = {
      success: false,
      feeSplit: DEFAULT_FEE_SPLIT,
    }

    try {
      await this.scriptAgent.initialize()
      await this.assetAgent.initialize()
      await this.voiceAgent.initialize()
      await this.directorAgent.initialize()
      await this.renderingAgent.initialize()

      this.emitProgress('script', 'Script Agent', 0, 'running', 'Generating story and dialogue...')
      const script = await this.scriptAgent.run({ prompt }) as ScriptOutput
      result.script = script.output as ScriptOutput
      this.emitProgress('script', 'Script Agent', 100, 'completed', 'Script generated successfully')

      this.emitProgress('asset', 'Asset Agent', 0, 'running', 'Creating visual assets...')
      const sceneDescriptions = script.output?.scenes?.map(s => s.description) || []
      const assets = await this.assetAgent.run({
        prompt,
        sceneDescriptions,
        count: Math.min(sceneDescriptions.length, 4),
      }) as AssetOutput
      result.assets = assets.output as AssetOutput
      this.emitProgress('asset', 'Asset Agent', 100, 'completed', 'Assets created successfully')

      this.emitProgress('voice', 'Voice Agent', 0, 'running', 'Synthesizing voices...')
      const dialogue = script.output?.scenes?.flatMap(s => s.dialogue || []) || []
      const audio = await this.voiceAgent.run({ dialogue }) as VoiceOutput
      result.audio = audio.output as VoiceOutput
      this.emitProgress('voice', 'Voice Agent', 100, 'completed', 'Voice synthesis complete')

      this.emitProgress('director', 'Director Agent', 0, 'running', 'Reviewing production...')
      const direction = await this.directorAgent.run({
        script: script.output,
        assets: (assets.output as AssetOutput)?.images || [],
        audio: (audio.output as VoiceOutput)?.audioFiles || [],
      }) as DirectorOutput
      result.direction = direction.output as DirectorOutput
      this.emitProgress('director', 'Director Agent', 100, 'completed', 'Director approved')

      this.emitProgress('rendering', 'Rendering Agent', 0, 'running', 'Rendering final video...')
      const video = await this.renderingAgent.run({
        script: script.output,
        assets: (assets.output as AssetOutput)?.images || [],
        audio: (audio.output as VoiceOutput)?.audioFiles || [],
        sceneOrder: (direction.output as DirectorOutput)?.sceneOrder || [],
      }) as RenderingOutput
      result.video = video.output as RenderingOutput
      this.emitProgress('rendering', 'Rendering Agent', 100, 'completed', 'Video rendered successfully')

      result.success = true
      result.totalDuration = (video.output as RenderingOutput)?.duration || 0

      this.emitProgress('completed', 'Workflow', 100, 'completed', 'All phases completed!')

      return result
    } catch (error) {
      this.emitProgress('completed', 'Workflow', 0, 'error', error instanceof Error ? error.message : 'Unknown error')
      result.success = false
      return result
    }
  }

  getAgents(): BaseAgent[] {
    return [
      this.scriptAgent,
      this.assetAgent,
      this.voiceAgent,
      this.directorAgent,
      this.renderingAgent,
    ]
  }

  getAgentStates(): Record<string, AgentState> {
    return {
      script: this.scriptAgent.getState(),
      asset: this.assetAgent.getState(),
      voice: this.voiceAgent.getState(),
      director: this.directorAgent.getState(),
      rendering: this.renderingAgent.getState(),
    }
  }

  reset(): void {
    this.scriptAgent.reset()
    this.assetAgent.reset()
    this.voiceAgent.reset()
    this.directorAgent.reset()
    this.renderingAgent.reset()
  }
}

export function createWorkflowManager(
  chain: SupportedChain = 'base',
  onProgress?: ProgressCallback
): WorkflowManager {
  return new WorkflowManager(chain, onProgress)
}
