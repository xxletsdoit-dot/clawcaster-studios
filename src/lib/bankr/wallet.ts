import { AgentWallet, SupportedChain, SUPPORTED_CHAINS, ChainConfig } from './types'
import { MOCK_AGENT_WALLETS, MOCK_PRODUCER_WALLET } from './mock-data'

export interface WalletInfo {
  address: string
  chain: SupportedChain
  balances: Record<string, string>
  isActive: boolean
}

export class WalletManager {
  private demoMode: boolean
  private agentWallets: Map<string, AgentWallet>

  constructor(demoMode = true) {
    this.demoMode = demoMode
    this.agentWallets = new Map(Object.entries(MOCK_AGENT_WALLETS))
  }

  getChainConfig(chain: SupportedChain): ChainConfig | undefined {
    return SUPPORTED_CHAINS.find(c => c.id === chain)
  }

  getAllChains(): ChainConfig[] {
    return SUPPORTED_CHAINS
  }

  getAgentWallet(agentType: string): AgentWallet | undefined {
    return this.agentWallets.get(agentType)
  }

  getAllAgentWallets(): AgentWallet[] {
    return Array.from(this.agentWallets.values())
  }

  getProducerWallet(): AgentWallet {
    return MOCK_PRODUCER_WALLET
  }

  getWalletsByChain(chain: SupportedChain): AgentWallet[] {
    return this.getAllAgentWallets().filter(w => w.chain === chain)
  }

  async createWalletForAgent(agentType: string, chain: SupportedChain = 'base'): Promise<AgentWallet> {
    const existing = this.getAgentWallet(agentType)
    if (existing) return existing

    const address = `0x${agentType.slice(0, 4)}${Math.random().toString(16).slice(2, 10)}`

    const newWallet: AgentWallet = {
      agentId: `agent_${agentType}`,
      agentType,
      address,
      chain,
      balance: '0.00',
      symbol: 'VVV',
      feePercent: 0,
    }

    this.agentWallets.set(agentType, newWallet)
    return newWallet
  }

  async getBalance(address: string, chain: SupportedChain): Promise<Record<string, string>> {
    if (this.demoMode) {
      return {
        VVV: (Math.random() * 100).toFixed(2),
        ETH: (Math.random() * 1).toFixed(4),
        USDC: (Math.random() * 50).toFixed(2),
      }
    }

    return {
      VVV: '0.00',
      ETH: '0.0000',
      USDC: '0.00',
    }
  }

  formatAddress(address: string, chars = 4): string {
    if (!address) return ''
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
  }

  getExplorerUrl(address: string, chain: SupportedChain): string {
    const urls: Record<SupportedChain, string> = {
      base: `https://basescan.org/address/${address}`,
      ethereum: `https://etherscan.io/address/${address}`,
      polygon: `https://polygonscan.com/address/${address}`,
      unichain: `https://uniscan.io/address/${address}`,
      solana: `https://solscan.io/account/${address}`,
    }
    return urls[chain] || urls.base
  }
}

let walletManager: WalletManager | null = null

export function getWalletManager(demoMode = true): WalletManager {
  if (!walletManager) {
    walletManager = new WalletManager(demoMode)
  }
  return walletManager
}
