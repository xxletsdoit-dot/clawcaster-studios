import { describe, test, expect } from 'bun:test'
import { BankrClient } from './client'
import { DEFAULT_FEE_SPLIT, SUPPORTED_CHAINS } from './types'

describe('BankrClient', () => {
  test('should initialize in demo mode', () => {
    const client = new BankrClient({ demoMode: true })
    expect(client).toBeDefined()
  })

  test('should return mock wallet balance in demo mode', async () => {
    const client = new BankrClient({ demoMode: true })
    const balances = await client.getWalletBalance('base')
    expect(balances).toHaveProperty('VVV')
    expect(balances).toHaveProperty('ETH')
  })

  test('should return mock agent wallets in demo mode', async () => {
    const client = new BankrClient({ demoMode: true })
    const wallets = await client.getAgentWallets()
    expect(wallets).toHaveProperty('script')
    expect(wallets).toHaveProperty('asset')
    expect(wallets).toHaveProperty('voice')
    expect(wallets).toHaveProperty('director')
    expect(wallets).toHaveProperty('rendering')
  })

  test('should launch token in demo mode', async () => {
    const client = new BankrClient({ demoMode: true })
    const result = await client.launchToken({
      name: 'Test Token',
      symbol: 'TEST',
      chain: 'base',
    })
    expect(result.success).toBe(true)
    expect(result.tokenId).toBeDefined()
    expect(result.contractAddress).toBeDefined()
  })
})

describe('Fee Split Config', () => {
  test('default fee split should sum to 100', () => {
    const total = Object.values(DEFAULT_FEE_SPLIT).reduce((sum, val) => sum + val, 0)
    expect(total).toBe(100)
  })

  test('should have correct agent percentages', () => {
    expect(DEFAULT_FEE_SPLIT.scriptAgent).toBe(40)
    expect(DEFAULT_FEE_SPLIT.directorAgent).toBe(20)
    expect(DEFAULT_FEE_SPLIT.renderingAgent).toBe(10)
    expect(DEFAULT_FEE_SPLIT.assetAgent).toBe(10)
    expect(DEFAULT_FEE_SPLIT.voiceAgent).toBe(5)
    expect(DEFAULT_FEE_SPLIT.humanProducer).toBe(10)
    expect(DEFAULT_FEE_SPLIT.platformFee).toBe(5)
  })
})

describe('Supported Chains', () => {
  test('should have 5 supported chains', () => {
    expect(SUPPORTED_CHAINS.length).toBe(5)
  })

  test('should include Base chain', () => {
    const base = SUPPORTED_CHAINS.find(c => c.id === 'base')
    expect(base).toBeDefined()
    expect(base?.architecture).toBe('EVM')
  })

  test('should include Solana chain', () => {
    const solana = SUPPORTED_CHAINS.find(c => c.id === 'solana')
    expect(solana).toBeDefined()
    expect(solana?.architecture).toBe('SVM')
  })
})
