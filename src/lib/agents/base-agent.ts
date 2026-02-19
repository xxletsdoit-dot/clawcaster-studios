import { AgentWallet, SupportedChain } from '../bankr/types'
import { getWalletManager, WalletManager } from '../bankr/wallet'

export interface AgentConfig {
  id: string
  name: string
  type: string
  description: string
  icon: string
  color: string
  feePercent: number
}

export interface AgentState {
  status: 'idle' | 'pending' | 'running' | 'completed' | 'error'
  progress: number
  output?: unknown
  error?: string
  startedAt?: Date
  completedAt?: Date
}

export abstract class BaseAgent {
  protected config: AgentConfig
  protected state: AgentState
  protected wallet: AgentWallet | null = null
  protected walletManager: WalletManager
  protected chain: SupportedChain

  constructor(config: AgentConfig, chain: SupportedChain = 'base') {
    this.config = config
    this.chain = chain
    this.walletManager = getWalletManager()
    this.state = {
      status: 'idle',
      progress: 0,
    }
  }

  get id(): string {
    return this.config.id
  }

  get name(): string {
    return this.config.name
  }

  get type(): string {
    return this.config.type
  }

  get feePercent(): number {
    return this.config.feePercent
  }

  getState(): AgentState {
    return { ...this.state }
  }

  getConfig(): AgentConfig {
    return { ...this.config }
  }

  getWallet(): AgentWallet | null {
    return this.wallet
  }

  async initialize(): Promise<void> {
    this.wallet = this.walletManager.getAgentWallet(this.config.type)
    if (!this.wallet) {
      this.wallet = await this.walletManager.createWalletForAgent(this.config.type, this.chain)
    }
  }

  protected setState(newState: Partial<AgentState>): void {
    this.state = { ...this.state, ...newState }
  }

  protected updateProgress(progress: number): void {
    this.state.progress = Math.min(100, Math.max(0, progress))
  }

  abstract execute(input: unknown): Promise<unknown>

  async run(input: unknown): Promise<AgentState> {
    this.setState({
      status: 'running',
      progress: 0,
      startedAt: new Date(),
    })

    try {
      const output = await this.execute(input)
      this.setState({
        status: 'completed',
        progress: 100,
        output,
        completedAt: new Date(),
      })
    } catch (error) {
      this.setState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      })
    }

    return this.getState()
  }

  reset(): void {
    this.state = {
      status: 'idle',
      progress: 0,
    }
  }
}
