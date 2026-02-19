'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChainSelector, AgentStatusList, FeeSplitCompact, MintButton } from '@/components/dashboard'
import { SupportedChain, TokenLaunchResult } from '@/lib/bankr/types'
import { DEFAULT_FEE_SPLIT } from '@/lib/bankr/types'
import {
  Film,
  Sparkles,
  Loader2,
  CheckCircle2,
  Play,
  Coins,
} from 'lucide-react'

const AGENTS = [
  { type: 'script', name: 'Script Agent', description: 'Generates story and dialogue', feePercent: 40 },
  { type: 'asset', name: 'Asset Agent', description: 'Creates visual assets', feePercent: 10 },
  { type: 'voice', name: 'Voice Agent', description: 'Synthesizes voices', feePercent: 5 },
  { type: 'director', name: 'Director Agent', description: 'Coordinates production', feePercent: 20 },
  { type: 'rendering', name: 'Rendering Agent', description: 'Composites final video', feePercent: 10 },
]

export default function CreatePage() {
  const [prompt, setPrompt] = useState('')
  const [chain, setChain] = useState<SupportedChain>('base')
  const [isCreating, setIsCreating] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [workflowResult, setWorkflowResult] = useState<{
    success: boolean
    videoUrl?: string
    title?: string
  } | null>(null)
  const [agentStates, setAgentStates] = useState<Record<string, { status: string; progress: number }>>({
    script: { status: 'idle', progress: 0 },
    asset: { status: 'idle', progress: 0 },
    voice: { status: 'idle', progress: 0 },
    director: { status: 'idle', progress: 0 },
    rendering: { status: 'idle', progress: 0 },
  })

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }, [])

  const handleCreate = async () => {
    if (!prompt.trim()) return

    setIsCreating(true)
    setLogs([])
    setWorkflowResult(null)

    addLog('🚀 Starting film creation...')

    for (const agent of AGENTS) {
      setAgentStates(prev => ({
        ...prev,
        [agent.type]: { status: 'running', progress: 0 },
      }))
      addLog(`🎬 ${agent.name} starting...`)

      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setAgentStates(prev => ({
          ...prev,
          [agent.type]: { status: 'running', progress: i },
        }))
      }

      addLog(`✅ ${agent.name} completed!`)
      setAgentStates(prev => ({
        ...prev,
        [agent.type]: { status: 'completed', progress: 100 },
      }))
    }

    addLog('🎉 Film created successfully!')
    setWorkflowResult({
      success: true,
      videoUrl: '/demo-video.mp4',
      title: prompt.slice(0, 50),
    })
    setIsCreating(false)
  }

  const handleMint = async (params: { name: string; symbol: string; chain: SupportedChain }): Promise<TokenLaunchResult> => {
    addLog(`🪙 Launching token "${params.name}" (${params.symbol}) on ${params.chain}...`)

    await new Promise(resolve => setTimeout(resolve, 2000))

    const contractAddress = `0x${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16)}`
    const explorerUrls: Record<SupportedChain, string> = {
      base: `https://basescan.org/token/${contractAddress}`,
      ethereum: `https://etherscan.io/token/${contractAddress}`,
      polygon: `https://polygonscan.com/token/${contractAddress}`,
      unichain: `https://uniscan.io/token/${contractAddress}`,
      solana: `https://solscan.io/token/${contractAddress}`,
    }

    addLog('✅ Token launched successfully!')

    return {
      success: true,
      tokenId: `token_${Date.now()}`,
      contractAddress,
      transactionHash: `0x${Math.random().toString(16).slice(2)}`,
      explorerUrl: explorerUrls[params.chain],
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Film className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">ClawCaster Studios</h1>
                <p className="text-xs text-muted-foreground">Onchain Entertainment Pipeline</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Demo Mode
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <Coins className="w-3.5 h-3.5" />
                Bankr Connected
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Create Your Film
                </CardTitle>
                <CardDescription>
                  Describe your short film concept and let our AI agents bring it to life
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Film Concept</Label>
                  <Textarea
                    placeholder="A cyberpunk detective investigates a mysterious AI that has been stealing memories from citizens in a neon-lit megacity..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[150px] resize-none"
                    disabled={isCreating}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Blockchain</Label>
                  <ChainSelector
                    selectedChain={chain}
                    onChainSelect={setChain}
                    disabled={isCreating}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Estimated Time</Label>
                    <p className="text-sm font-medium">~2-3 minutes</p>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">AI Agents</Label>
                    <p className="text-sm font-medium">5 agents</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleCreate}
                  disabled={!prompt.trim() || isCreating}
                  className="w-full gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Film
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {workflowResult?.success && (
              <Card className="border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="w-5 h-5" />
                    Film Ready!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <Button size="lg" className="gap-2">
                      <Play className="w-5 h-5" />
                      Play Film
                    </Button>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Fee Distribution</Label>
                    <FeeSplitCompact />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Pipeline</CardTitle>
                <CardDescription>Real-time progress of AI agents</CardDescription>
              </CardHeader>
              <CardContent>
                <AgentStatusList
                  agents={AGENTS.map(agent => ({
                    ...agent,
                    state: {
                      status: agentStates[agent.type].status as 'idle' | 'running' | 'completed' | 'error',
                      progress: agentStates[agent.type].progress,
                    },
                  }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Live Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-1 font-mono text-xs">
                    {logs.map((log, i) => (
                      <div key={i} className="text-muted-foreground">
                        {log}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {workflowResult?.success && (
              <MintButton
                filmTitle={workflowResult.title || 'My Film'}
                onMint={handleMint}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
