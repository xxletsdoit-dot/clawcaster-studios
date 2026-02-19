'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SUPPORTED_CHAINS, SupportedChain, ChainConfig } from '@/lib/bankr/types'
import { Check, ChevronDown } from 'lucide-react'

interface ChainSelectorProps {
  selectedChain: SupportedChain
  onChainSelect: (chain: SupportedChain) => void
  disabled?: boolean
}

export function ChainSelector({ selectedChain, onChainSelect, disabled }: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedChainConfig = SUPPORTED_CHAINS.find(c => c.id === selectedChain)

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-between gap-2"
      >
        {selectedChainConfig && (
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedChainConfig.color }}
            />
            <span>{selectedChainConfig.name}</span>
          </div>
        )}
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1">
          <CardContent className="p-2">
            {SUPPORTED_CHAINS.map((chain) => (
              <button
                key={chain.id}
                onClick={() => {
                  onChainSelect(chain.id)
                  setIsOpen(false)
                }}
                className="w-full flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: chain.color }}
                  />
                  <span className="font-medium">{chain.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {chain.architecture}
                  </Badge>
                </div>
                {selectedChain === chain.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function ChainBadges() {
  return (
    <div className="flex flex-wrap gap-2">
      {SUPPORTED_CHAINS.map((chain) => (
        <Badge
          key={chain.id}
          variant="outline"
          className="gap-1.5"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: chain.color }}
          />
          {chain.name}
        </Badge>
      ))}
    </div>
  )
}

export function getChainConfig(chainId: SupportedChain): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find(c => c.id === chainId)
}
