import { describe, test, expect } from 'bun:test'
import { WalletManager } from './wallet'
import { SUPPORTED_CHAINS } from './types'

describe('WalletManager', () => {
  test('should initialize with demo mode', () => {
    const manager = new WalletManager(true)
    expect(manager).toBeDefined()
  })

  test('should return all supported chains', () => {
    const manager = new WalletManager(true)
    const chains = manager.getAllChains()
    expect(chains.length).toBe(5)
  })

  test('should return agent wallet by type', () => {
    const manager = new WalletManager(true)
    const wallet = manager.getAgentWallet('script')
    expect(wallet).toBeDefined()
    expect(wallet?.agentType).toBe('script')
    expect(wallet?.feePercent).toBe(40)
  })

  test('should return all agent wallets', () => {
    const manager = new WalletManager(true)
    const wallets = manager.getAllAgentWallets()
    expect(wallets.length).toBe(5)
  })

  test('should format address correctly', () => {
    const manager = new WalletManager(true)
    const formatted = manager.formatAddress('0x1234567890abcdef1234567890abcdef', 4)
    expect(formatted).toBe('0x1234...cdef')
  })

  test('should return explorer url for chain', () => {
    const manager = new WalletManager(true)
    const url = manager.getExplorerUrl('0x1234', 'base')
    expect(url).toContain('basescan.org')
  })

  test('should return chain config', () => {
    const manager = new WalletManager(true)
    const config = manager.getChainConfig('base')
    expect(config).toBeDefined()
    expect(config?.name).toBe('Base')
  })
})
