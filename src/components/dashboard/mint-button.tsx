'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChainSelector } from './chain-selector'
import { FeeSplitChart } from './fee-split-chart'
import { SupportedChain, TokenLaunchResult } from '@/lib/bankr/types'
import { Coins, Loader2, CheckCircle2, ExternalLink, Copy, Check } from 'lucide-react'

interface MintButtonProps {
  filmTitle: string
  onMint: (params: { name: string; symbol: string; chain: SupportedChain }) => Promise<TokenLaunchResult>
  disabled?: boolean
}

export function MintButton({ filmTitle, onMint, disabled }: MintButtonProps) {
  const [chain, setChain] = useState<SupportedChain>('base')
  const [tokenName, setTokenName] = useState(filmTitle || 'My Film')
  const [tokenSymbol, setTokenSymbol] = useState('CLAW')
  const [isMinting, setIsMinting] = useState(false)
  const [result, setResult] = useState<TokenLaunchResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleMint = async () => {
    setIsMinting(true)
    try {
      const res = await onMint({
        name: tokenName,
        symbol: tokenSymbol,
        chain,
      })
      setResult(res)
    } catch (error) {
      console.error('Mint failed:', error)
    } finally {
      setIsMinting(false)
    }
  }

  const copyAddress = () => {
    if (result?.contractAddress) {
      navigator.clipboard.writeText(result.contractAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (result?.success) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
            Token Launched Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Contract Address</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-xs font-mono">
                {result.contractAddress}
              </code>
              <Button size="icon" variant="outline" onClick={copyAddress}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Token ID</Label>
            <code className="block p-2 bg-muted rounded text-xs font-mono">
              {result.tokenId}
            </code>
          </div>

          <Separator />

          <div className="flex gap-2">
            {result.explorerUrl && (
              <Button variant="outline" className="flex-1 gap-2" asChild>
                <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  View on Explorer
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setResult(null)}
            >
              Mint Another
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Launch Token
        </CardTitle>
        <CardDescription>
          Deploy your film as an NFT using Bankr Token Launchpad
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select Blockchain</Label>
          <ChainSelector
            selectedChain={chain}
            onChainSelect={setChain}
            disabled={isMinting || disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tokenName">Token Name</Label>
          <Input
            id="tokenName"
            placeholder="ClawCaster Film #001"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            disabled={isMinting || disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tokenSymbol">Token Symbol</Label>
          <Input
            id="tokenSymbol"
            placeholder="CLAW"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            disabled={isMinting || disabled}
            maxLength={10}
          />
        </div>

        <Separator />

        <FeeSplitChart totalRevenue={100} />

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Bankr Connected
            </Badge>
          </div>
          <Button
            onClick={handleMint}
            disabled={isMinting || disabled || !tokenName || !tokenSymbol}
            className="gap-2"
          >
            {isMinting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Coins className="w-4 h-4" />
                Launch Token
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
