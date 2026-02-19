export type SupportedChain = 'base' | 'ethereum' | 'polygon' | 'unichain' | 'solana'

export interface ChainConfig {
  id: SupportedChain
  name: string
  symbol: string
  color: string
  architecture: 'EVM' | 'SVM'
  nativeToken: string
}

export const SUPPORTED_CHAINS: ChainConfig[] = [
  { id: 'base', name: 'Base', symbol: 'BASE', color: '#0052FF', architecture: 'EVM', nativeToken: 'ETH' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA', architecture: 'EVM', nativeToken: 'ETH' },
  { id: 'polygon', name: 'Polygon', symbol: 'POL', color: '#8247E5', architecture: 'EVM', nativeToken: 'POL' },
  { id: 'unichain', name: 'Unichain', symbol: 'UNI', color: '#FF007A', architecture: 'EVM', nativeToken: 'ETH' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#00FFA3', architecture: 'SVM', nativeToken: 'SOL' },
]

export interface BankrWallet {
  address: string
  chain: SupportedChain
  balance: string
  symbol: string
}

export interface AgentWallet extends BankrWallet {
  agentId: string
  agentType: string
  feePercent: number
}

export interface FeeSplitConfig {
  scriptAgent: number
  directorAgent: number
  renderingAgent: number
  assetAgent: number
  voiceAgent: number
  humanProducer: number
  platformFee: number
}

export const DEFAULT_FEE_SPLIT: FeeSplitConfig = {
  scriptAgent: 40,
  directorAgent: 20,
  renderingAgent: 10,
  assetAgent: 10,
  voiceAgent: 5,
  humanProducer: 10,
  platformFee: 5,
}

export interface TokenLaunchParams {
  name: string
  symbol: string
  chain: SupportedChain
  description?: string
  feeSplit?: FeeSplitConfig
}

export interface TokenLaunchResult {
  success: boolean
  tokenId?: string
  contractAddress?: string
  transactionHash?: string
  explorerUrl?: string
}

export interface JobStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  result?: unknown
  error?: string
}

export interface BankrClientConfig {
  apiKey?: string
  privateKey?: string
  baseUrl?: string
  demoMode?: boolean
}
