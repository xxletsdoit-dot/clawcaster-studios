import {
  BankrClientConfig,
  SupportedChain,
  TokenLaunchParams,
  TokenLaunchResult,
  JobStatus,
  FeeSplitConfig,
  DEFAULT_FEE_SPLIT,
} from './types'
import {
  MOCK_AGENT_WALLETS,
  MOCK_PRODUCER_WALLET,
  generateMockTokenLaunch,
  getMockBalances,
  simulateDelay,
  MOCK_JOB_RESULT,
} from './mock-data'

const BANKR_API_URL = 'https://api.bankr.bot'

export class BankrClient {
  private apiKey: string | undefined
  private privateKey: string | undefined
  private baseUrl: string
  private demoMode: boolean

  constructor(config: BankrClientConfig = {}) {
    this.apiKey = config.apiKey || process.env.BANKR_API_KEY
    this.privateKey = config.privateKey || process.env.BANKR_PRIVATE_KEY
    this.baseUrl = config.baseUrl || BANKR_API_URL
    this.demoMode = config.demoMode ?? (process.env.DEMO_MODE === 'true' || !this.apiKey)
  }

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey || '',
    }
  }

  async prompt(prompt: string, threadId?: string): Promise<JobStatus> {
    if (this.demoMode) {
      await simulateDelay(500)
      return {
        id: `job_${Date.now()}`,
        status: 'completed',
        progress: 100,
        result: { response: `Demo response for: ${prompt}` },
      }
    }

    const response = await fetch(`${this.baseUrl}/agent/prompt`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ prompt, threadId }),
    })

    if (!response.ok) {
      throw new Error(`Bankr API error: ${response.statusText}`)
    }

    return response.json()
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    if (this.demoMode) {
      return MOCK_JOB_RESULT
    }

    const response = await fetch(`${this.baseUrl}/agent/job/${jobId}`, {
      headers: this.headers,
    })

    if (!response.ok) {
      throw new Error(`Bankr API error: ${response.statusText}`)
    }

    return response.json()
  }

  async promptAndWait(prompt: string, timeout = 60000): Promise<JobStatus> {
    const job = await this.prompt(prompt)

    if (job.status === 'completed' || job.status === 'failed') {
      return job
    }

    const startTime = Date.now()
    while (Date.now() - startTime < timeout) {
      await simulateDelay(1000)
      const status = await this.getJobStatus(job.id)

      if (status.status === 'completed' || status.status === 'failed') {
        return status
      }
    }

    return { ...job, status: 'failed', error: 'Timeout' }
  }

  async launchToken(params: TokenLaunchParams): Promise<TokenLaunchResult> {
    const feeSplit = params.feeSplit || DEFAULT_FEE_SPLIT

    if (this.demoMode) {
      await simulateDelay(2000)
      return generateMockTokenLaunch(params.name, params.symbol, params.chain, feeSplit)
    }

    const prompt = `deploy a token called ${params.name} with symbol ${params.symbol} on ${params.chain}`
    const result = await this.promptAndWait(prompt)

    if (result.status === 'failed') {
      return { success: false }
    }

    return {
      success: true,
      tokenId: (result.result as { tokenId?: string })?.tokenId,
      contractAddress: (result.result as { contractAddress?: string })?.contractAddress,
      transactionHash: (result.result as { transactionHash?: string })?.transactionHash,
    }
  }

  async getWalletBalance(chain: SupportedChain = 'base'): Promise<Record<string, string>> {
    if (this.demoMode) {
      return getMockBalances(chain)
    }

    const result = await this.promptAndWait(`what are my balances on ${chain}?`)

    return (result.result as { balances?: Record<string, string> })?.balances || {}
  }

  async swap(fromToken: string, toToken: string, amount: string, chain: SupportedChain = 'base'): Promise<JobStatus> {
    const prompt = `swap ${amount} ${fromToken} to ${toToken} on ${chain}`
    return this.promptAndWait(prompt)
  }

  async transfer(to: string, amount: string, token: string, chain: SupportedChain = 'base'): Promise<JobStatus> {
    const prompt = `transfer ${amount} ${token} to ${to} on ${chain}`
    return this.promptAndWait(prompt)
  }

  async getAgentWallets(): Promise<Record<string, typeof MOCK_AGENT_WALLETS[string]>> {
    if (this.demoMode) {
      return MOCK_AGENT_WALLETS
    }

    return MOCK_AGENT_WALLETS
  }

  async distributeFees(
    totalAmount: number,
    feeSplit: FeeSplitConfig = DEFAULT_FEE_SPLIT,
    chain: SupportedChain = 'base'
  ): Promise<JobStatus[]> {
    const wallets = await this.getAgentWallets()
    const results: JobStatus[] = []

    for (const [agentType, wallet] of Object.entries(wallets)) {
      const percent = feeSplit[`${agentType}Agent` as keyof FeeSplitConfig]
      if (percent && percent > 0) {
        const amount = (totalAmount * percent / 100).toFixed(2)
        const result = await this.transfer(wallet.address, amount, 'VVV', chain)
        results.push(result)
      }
    }

    return results
  }
}

let bankrClient: BankrClient | null = null

export function getBankrClient(config?: BankrClientConfig): BankrClient {
  if (!bankrClient) {
    bankrClient = new BankrClient(config)
  }
  return bankrClient
}

export { MOCK_AGENT_WALLETS, MOCK_PRODUCER_WALLET, DEFAULT_FEE_SPLIT }
