import { AgentWallet, SupportedChain, FeeSplitConfig, DEFAULT_FEE_SPLIT, TokenLaunchResult } from './types'

const generateWalletAddress = (prefix: string): string => {
  const randomPart = Math.random().toString(16).slice(2, 10)
  return `0x${prefix.slice(0, 4)}${randomPart}`
}

export const MOCK_AGENT_WALLETS: Record<string, AgentWallet> = {
  script: {
    agentId: 'agent_script',
    agentType: 'script',
    address: '0x7a3b91c8d2e4f5a6',
    chain: 'base',
    balance: '125.50',
    symbol: 'VVV',
    feePercent: DEFAULT_FEE_SPLIT.scriptAgent,
  },
  asset: {
    agentId: 'agent_asset',
    agentType: 'asset',
    address: '0x9e1fa4b7c3d2e8f1',
    chain: 'base',
    balance: '45.25',
    symbol: 'VVV',
    feePercent: DEFAULT_FEE_SPLIT.assetAgent,
  },
  voice: {
    agentId: 'agent_voice',
    agentType: 'voice',
    address: '0x2d5cf9e1a8b3c7d4',
    chain: 'base',
    balance: '22.75',
    symbol: 'VVV',
    feePercent: DEFAULT_FEE_SPLIT.voiceAgent,
  },
  director: {
    agentId: 'agent_director',
    agentType: 'director',
    address: '0x4a8bd3c6f2e5a9b1',
    chain: 'base',
    balance: '89.00',
    symbol: 'VVV',
    feePercent: DEFAULT_FEE_SPLIT.directorAgent,
  },
  rendering: {
    agentId: 'agent_rendering',
    agentType: 'rendering',
    address: '0x6c2eb8a5d4f3c7e9',
    chain: 'base',
    balance: '55.30',
    symbol: 'VVV',
    feePercent: DEFAULT_FEE_SPLIT.renderingAgent,
  },
}

export const MOCK_PRODUCER_WALLET: AgentWallet = {
  agentId: 'producer',
  agentType: 'human',
  address: '0x1234567890abcdef',
  chain: 'base',
  balance: '500.00',
  symbol: 'VVV',
  feePercent: DEFAULT_FEE_SPLIT.humanProducer,
}

export const generateMockTokenLaunch = (
  name: string,
  symbol: string,
  chain: SupportedChain,
  feeSplit: FeeSplitConfig
): TokenLaunchResult => {
  const contractAddress = generateWalletAddress('claw')
  const tokenId = `token_${Date.now()}`
  const txHash = `0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`

  const explorerUrls: Record<SupportedChain, string> = {
    base: `https://basescan.org/token/${contractAddress}`,
    ethereum: `https://etherscan.io/token/${contractAddress}`,
    polygon: `https://polygonscan.com/token/${contractAddress}`,
    unichain: `https://uniscan.io/token/${contractAddress}`,
    solana: `https://solscan.io/token/${contractAddress}`,
  }

  return {
    success: true,
    tokenId,
    contractAddress,
    transactionHash: txHash,
    explorerUrl: explorerUrls[chain],
  }
}

export const getMockBalances = (chain: SupportedChain): Record<string, string> => {
  return {
    VVV: (Math.random() * 1000).toFixed(2),
    ETH: (Math.random() * 2).toFixed(4),
    USDC: (Math.random() * 500).toFixed(2),
  }
}

export const simulateDelay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const MOCK_JOB_RESULT = {
  id: 'job_mock_001',
  status: 'completed' as const,
  progress: 100,
  result: {
    message: 'Transaction executed successfully',
    transactionHash: '0xabc123...',
  },
}
