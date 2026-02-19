'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Film, 
  Sparkles, 
  Palette, 
  Mic, 
  Clapperboard, 
  MonitorPlay,
  Wallet,
  Coins,
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
  Play,
  Upload,
  Zap,
  Users,
  TrendingUp,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react'

// Agent types and their configurations
const AGENTS = [
  {
    id: 'script',
    name: 'Script Agent',
    description: 'Generates story, dialogue, and scene descriptions',
    icon: Sparkles,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    feePercent: 40,
    wallet: '0x7a3b...c8d2'
  },
  {
    id: 'asset',
    name: 'Asset Agent',
    description: 'Creates visual assets, backgrounds, and characters',
    icon: Palette,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    feePercent: 10,
    wallet: '0x9e1f...a4b7'
  },
  {
    id: 'voice',
    name: 'Voice Agent',
    description: 'Synthesizes character voices and sound effects',
    icon: Mic,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    feePercent: 5,
    wallet: '0x2d5c...f9e1'
  },
  {
    id: 'director',
    name: 'Director Agent',
    description: 'Coordinates all agents and ensures consistency',
    icon: Clapperboard,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    feePercent: 20,
    wallet: '0x4a8b...d3c6'
  },
  {
    id: 'rendering',
    name: 'Rendering Agent',
    description: 'Composites final video with effects',
    icon: MonitorPlay,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    feePercent: 10,
    wallet: '0x6c2e...b8a5'
  }
]

// Supported chains
const SUPPORTED_CHAINS = [
  { id: 'base', name: 'Base', color: 'text-blue-400' },
  { id: 'ethereum', name: 'Ethereum', color: 'text-indigo-400' },
  { id: 'polygon', name: 'Polygon', color: 'text-purple-400' },
  { id: 'solana', name: 'Solana', color: 'text-green-400' },
  { id: 'unichain', name: 'Unichain', color: 'text-pink-400' }
]

// Fee splitting configuration
const FEE_SPLIT = {
  scriptAgent: 40,
  directorAgent: 20,
  renderingAgent: 10,
  assetAgent: 10,
  voiceAgent: 5,
  humanProducer: 10,
  platformFee: 5
}

interface AgentStatus {
  status: 'pending' | 'active' | 'completed' | 'error'
  progress: number
  output?: string
  startTime?: Date
  endTime?: Date
}

interface Project {
  id: string
  title: string
  prompt: string
  status: 'draft' | 'processing' | 'completed' | 'minted'
  agents: Record<string, AgentStatus>
  videoUrl?: string
  thumbnailUrl?: string
  tokenId?: string
  chain?: string
  totalRevenue?: number
  streamCount?: number
}

export default function ClawCasterStudios() {
  const [project, setProject] = useState<Project | null>(null)
  const [prompt, setPrompt] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('create')
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  // Add log entry
  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }, [])

  // Simulate agent execution
  const simulateAgentExecution = useCallback(async (agentId: string, agentName: string) => {
    addLog(`🎬 ${agentName} starting...`)
    
    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300))
      setProject(prev => {
        if (!prev) return prev
        return {
          ...prev,
          agents: {
            ...prev.agents,
            [agentId]: {
              ...prev.agents[agentId],
              progress: i
            }
          }
        }
      })
    }

    addLog(`✅ ${agentName} completed!`)
    
    setProject(prev => {
      if (!prev) return prev
      return {
        ...prev,
        agents: {
          ...prev.agents,
          [agentId]: {
            ...prev.agents[agentId],
            status: 'completed',
            progress: 100,
            endTime: new Date()
          }
        }
      }
    })
  }, [addLog])

  // Create new project
  const handleCreateProject = useCallback(async () => {
    if (!prompt.trim()) return

    setIsCreating(true)
    addLog('🚀 Starting new project creation...')

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      title: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
      prompt,
      status: 'processing',
      agents: {
        script: { status: 'pending', progress: 0 },
        asset: { status: 'pending', progress: 0 },
        voice: { status: 'pending', progress: 0 },
        director: { status: 'pending', progress: 0 },
        rendering: { status: 'pending', progress: 0 }
      }
    }

    setProject(newProject)
    setActiveTab('pipeline')

    // Simulate the agent pipeline
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Execute agents in sequence (with some parallelism)
    setProject(prev => prev ? {
      ...prev,
      agents: {
        ...prev.agents,
        script: { status: 'active', progress: 0, startTime: new Date() }
      }
    } : prev)

    await simulateAgentExecution('script', 'Script Agent')

    // Asset and Voice can run in parallel after script
    setProject(prev => prev ? {
      ...prev,
      agents: {
        ...prev.agents,
        asset: { status: 'active', progress: 0, startTime: new Date() },
        voice: { status: 'active', progress: 0, startTime: new Date() }
      }
    } : prev)

    await Promise.all([
      simulateAgentExecution('asset', 'Asset Agent'),
      simulateAgentExecution('voice', 'Voice Agent')
    ])

    // Director reviews
    setProject(prev => prev ? {
      ...prev,
      agents: {
        ...prev.agents,
        director: { status: 'active', progress: 0, startTime: new Date() }
      }
    } : prev)

    await simulateAgentExecution('director', 'Director Agent')

    // Final rendering
    setProject(prev => prev ? {
      ...prev,
      agents: {
        ...prev.agents,
        rendering: { status: 'active', progress: 0, startTime: new Date() }
      }
    } : prev)

    await simulateAgentExecution('rendering', 'Rendering Agent')

    // Mark project as completed
    addLog('🎉 Project completed successfully!')
    setProject(prev => prev ? {
      ...prev,
      status: 'completed',
      videoUrl: '/demo-video.mp4',
      thumbnailUrl: '/thumbnail.jpg'
    } : prev)

    setIsCreating(false)
  }, [prompt, simulateAgentExecution, addLog])

  // Copy wallet address
  const copyWallet = useCallback((wallet: string) => {
    navigator.clipboard.writeText(wallet)
    setCopiedWallet(wallet)
    setTimeout(() => setCopiedWallet(null), 2000)
  }, [])

  // Calculate overall progress
  const calculateOverallProgress = useCallback(() => {
    if (!project) return 0
    const agents = Object.values(project.agents)
    const totalProgress = agents.reduce((sum, agent) => sum + agent.progress, 0)
    return Math.round(totalProgress / agents.length)
  }, [project])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Film className="w-8 h-8 text-primary" />
                <Zap className="w-4 h-4 text-amber-500 absolute -top-1 -right-1" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">ClawCaster Studios</h1>
                <p className="text-xs text-muted-foreground">Onchain Entertainment Pipeline</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                Bankr Connected
              </Badge>
              <Button variant="outline" size="sm" className="gap-2">
                <Coins className="w-4 h-4" />
                1,234 VVV
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="create" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-2">
              <Clapperboard className="w-4 h-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="mint" className="gap-2">
              <Coins className="w-4 h-4" />
              Mint
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2">
              <Users className="w-4 h-4" />
              Agents
            </TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Film className="w-5 h-5 text-primary" />
                    Create Your Film
                  </CardTitle>
                  <CardDescription>
                    Describe your short film concept and let our AI agents bring it to life
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Film Concept</Label>
                    <Textarea
                      id="prompt"
                      placeholder="A cyberpunk detective investigates a mysterious AI that has been stealing memories from citizens in a neon-lit megacity..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[150px] resize-none"
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
                    onClick={handleCreateProject} 
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

              {/* Agent Overview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Agent Pipeline</h3>
                <div className="space-y-3">
                  {AGENTS.map((agent, index) => (
                    <Card key={agent.id} className={`border ${agent.borderColor} bg-surface/30`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${agent.bgColor}`}>
                            <agent.icon className={`w-5 h-5 ${agent.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{agent.name}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {agent.feePercent}% fee
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{agent.description}</p>
                          </div>
                          {index < AGENTS.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-muted-foreground hidden lg:block" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="space-y-6">
            {!project ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Film className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Project</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create a new film project to see the agent pipeline in action
                  </p>
                  <Button onClick={() => setActiveTab('create')} className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Start Creating
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Agent Status */}
                <div className="lg:col-span-2 space-y-4">
                  <Card className="border-border/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Agent Pipeline Status</CardTitle>
                          <CardDescription>{project.title}</CardDescription>
                        </div>
                        <Badge 
                          variant={project.status === 'completed' ? 'default' : 'secondary'}
                          className="gap-1"
                        >
                          {project.status === 'completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          )}
                          {project.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Overall Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Overall Progress</span>
                          <span>{calculateOverallProgress()}%</span>
                        </div>
                        <Progress value={calculateOverallProgress()} className="h-2" />
                      </div>

                      <Separator />

                      {/* Individual Agents */}
                      <div className="space-y-3">
                        {AGENTS.map(agent => {
                          const agentStatus = project.agents[agent.id]
                          return (
                            <div 
                              key={agent.id} 
                              className={`p-3 rounded-lg border ${agent.borderColor} ${agent.bgColor}`}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <agent.icon className={`w-5 h-5 ${agent.color}`} />
                                <span className="font-medium">{agent.name}</span>
                                {agentStatus?.status === 'completed' && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />
                                )}
                                {agentStatus?.status === 'active' && (
                                  <Loader2 className="w-4 h-4 animate-spin text-amber-500 ml-auto" />
                                )}
                                {agentStatus?.status === 'pending' && (
                                  <Circle className="w-4 h-4 text-muted-foreground ml-auto" />
                                )}
                              </div>
                              <Progress 
                                value={agentStatus?.progress || 0} 
                                className="h-1.5"
                              />
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Video Preview */}
                  {project.status === 'completed' && (
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MonitorPlay className="w-5 h-5 text-primary" />
                          Generated Film
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-video bg-surface-subtle rounded-lg flex items-center justify-center">
                          <Button size="lg" className="gap-2">
                            <Play className="w-5 h-5" />
                            Play Film
                          </Button>
                        </div>
                      </CardContent>
                      <CardFooter className="gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 gap-2"
                          onClick={() => setActiveTab('mint')}
                        >
                          <Coins className="w-4 h-4" />
                          Mint & Publish
                        </Button>
                        <Button variant="outline" size="icon">
                          <Upload className="w-4 h-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                </div>

                {/* Live Logs */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Live Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
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
              </div>
            )}
          </TabsContent>

          {/* Mint Tab */}
          <TabsContent value="mint" className="space-y-6">
            {!project || project.status !== 'completed' ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Coins className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Film Ready to Mint</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Complete a film generation to mint it as an NFT
                  </p>
                  <Button onClick={() => setActiveTab('create')} className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Create Film
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Mint Configuration */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-primary" />
                      Launch Token
                    </CardTitle>
                    <CardDescription>
                      Deploy your film as an NFT using Bankr Token Launchpad
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Chain Selection */}
                    <div className="space-y-2">
                      <Label>Select Blockchain</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {SUPPORTED_CHAINS.map(chain => (
                          <Button 
                            key={chain.id}
                            variant="outline"
                            className="justify-start gap-2"
                          >
                            <span className={chain.color}>●</span>
                            {chain.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Token Details */}
                    <div className="space-y-2">
                      <Label htmlFor="tokenName">Token Name</Label>
                      <Input 
                        id="tokenName" 
                        placeholder="ClawCaster Film #001"
                        defaultValue={project.title}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tokenSymbol">Token Symbol</Label>
                      <Input 
                        id="tokenSymbol" 
                        placeholder="CLAW"
                        defaultValue="CLAW"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="streamPrice">Stream Price (VVV)</Label>
                      <Input 
                        id="streamPrice" 
                        type="number"
                        placeholder="10"
                        defaultValue="10"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full gap-2">
                      <Coins className="w-4 h-4" />
                      Launch Token
                    </Button>
                  </CardFooter>
                </Card>

                {/* Fee Split Visualization */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Revenue Split
                    </CardTitle>
                    <CardDescription>
                      Automated fee distribution via Bankr infrastructure
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Visual Split */}
                    <div className="flex h-4 rounded-full overflow-hidden">
                      <div 
                        className="bg-violet-500" 
                        style={{ width: `${FEE_SPLIT.scriptAgent}%` }}
                        title="Script Agent"
                      />
                      <div 
                        className="bg-amber-500" 
                        style={{ width: `${FEE_SPLIT.directorAgent}%` }}
                        title="Director Agent"
                      />
                      <div 
                        className="bg-emerald-500" 
                        style={{ width: `${FEE_SPLIT.renderingAgent}%` }}
                        title="Rendering Agent"
                      />
                      <div 
                        className="bg-pink-500" 
                        style={{ width: `${FEE_SPLIT.assetAgent}%` }}
                        title="Asset Agent"
                      />
                      <div 
                        className="bg-cyan-500" 
                        style={{ width: `${FEE_SPLIT.voiceAgent}%` }}
                        title="Voice Agent"
                      />
                      <div 
                        className="bg-blue-500" 
                        style={{ width: `${FEE_SPLIT.humanProducer}%` }}
                        title="Producer"
                      />
                      <div 
                        className="bg-gray-500" 
                        style={{ width: `${FEE_SPLIT.platformFee}%` }}
                        title="Platform"
                      />
                    </div>

                    <Separator />

                    {/* Breakdown List */}
                    <div className="space-y-2">
                      {[
                        { name: 'Script Agent', percent: FEE_SPLIT.scriptAgent, color: 'bg-violet-500' },
                        { name: 'Director Agent', percent: FEE_SPLIT.directorAgent, color: 'bg-amber-500' },
                        { name: 'Rendering Agent', percent: FEE_SPLIT.renderingAgent, color: 'bg-emerald-500' },
                        { name: 'Asset Agent', percent: FEE_SPLIT.assetAgent, color: 'bg-pink-500' },
                        { name: 'Voice Agent', percent: FEE_SPLIT.voiceAgent, color: 'bg-cyan-500' },
                        { name: 'Human Producer', percent: FEE_SPLIT.humanProducer, color: 'bg-blue-500' },
                        { name: 'Platform Fee', percent: FEE_SPLIT.platformFee, color: 'bg-gray-500' }
                      ].map(item => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <span className="text-sm font-medium">{item.percent}%</span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Example Calculation */}
                    <div className="p-3 bg-surface-subtle rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">Example: 100 VVV streaming revenue</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span>Script Agent:</span>
                        <span className="font-medium">40 VVV</span>
                        <span>Director Agent:</span>
                        <span className="font-medium">20 VVV</span>
                        <span>Producer:</span>
                        <span className="font-medium">10 VVV</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AGENTS.map(agent => (
                <Card key={agent.id} className={`border ${agent.borderColor}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${agent.bgColor}`}>
                        <agent.icon className={`w-6 h-6 ${agent.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{agent.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {agent.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Fee Share</span>
                      <Badge variant="secondary">{agent.feePercent}%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant="outline" className="gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Wallet</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 gap-1 text-xs font-mono"
                        onClick={() => copyWallet(agent.wallet)}
                      >
                        {agent.wallet}
                        {copiedWallet === agent.wallet ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                      <ExternalLink className="w-3.5 h-3.5" />
                      View on Explorer
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Platform Stats */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Platform Statistics</CardTitle>
                <CardDescription>
                  Overall performance of ClawCaster Studios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-surface-subtle rounded-lg text-center">
                    <p className="text-2xl font-bold">1,234</p>
                    <p className="text-sm text-muted-foreground">Films Created</p>
                  </div>
                  <div className="p-4 bg-surface-subtle rounded-lg text-center">
                    <p className="text-2xl font-bold">45.2K</p>
                    <p className="text-sm text-muted-foreground">VVV Earned</p>
                  </div>
                  <div className="p-4 bg-surface-subtle rounded-lg text-center">
                    <p className="text-2xl font-bold">892</p>
                    <p className="text-sm text-muted-foreground">Tokens Minted</p>
                  </div>
                  <div className="p-4 bg-surface-subtle rounded-lg text-center">
                    <p className="text-2xl font-bold">5</p>
                    <p className="text-sm text-muted-foreground">Chains Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-surface/30 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Powered by</span>
              <Badge variant="outline" className="gap-1">
                <Zap className="w-3 h-3" />
                Bankr Infrastructure
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Supported Chains:</span>
              <div className="flex items-center gap-2">
                {SUPPORTED_CHAINS.map(chain => (
                  <span key={chain.id} className={chain.color}>●</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
