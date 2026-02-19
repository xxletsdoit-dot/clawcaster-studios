'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AgentState } from '@/lib/agents/base-agent'
import {
  Sparkles,
  Palette,
  Mic,
  Clapperboard,
  MonitorPlay,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
} from 'lucide-react'

interface AgentStatusCardProps {
  agentType: string
  name: string
  description: string
  state: AgentState
  feePercent: number
  walletAddress?: string
}

const AGENT_ICONS: Record<string, typeof Sparkles> = {
  script: Sparkles,
  asset: Palette,
  voice: Mic,
  director: Clapperboard,
  rendering: MonitorPlay,
}

const AGENT_COLORS: Record<string, string> = {
  script: 'text-violet-500',
  asset: 'text-pink-500',
  voice: 'text-cyan-500',
  director: 'text-amber-500',
  rendering: 'text-emerald-500',
}

const AGENT_BG_COLORS: Record<string, string> = {
  script: 'bg-violet-500/10 border-violet-500/30',
  asset: 'bg-pink-500/10 border-pink-500/30',
  voice: 'bg-cyan-500/10 border-cyan-500/30',
  director: 'bg-amber-500/10 border-amber-500/30',
  rendering: 'bg-emerald-500/10 border-emerald-500/30',
}

function getStatusIcon(status: AgentState['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    case 'running':
      return <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />
    default:
      return <Circle className="w-4 h-4 text-muted-foreground" />
  }
}

function getStatusBadge(status: AgentState['status']) {
  const variants: Record<AgentState['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    completed: 'default',
    running: 'secondary',
    error: 'destructive',
    idle: 'outline',
    pending: 'outline',
  }
  return <Badge variant={variants[status]}>{status}</Badge>
}

export function AgentStatusCard({
  agentType,
  name,
  description,
  state,
  feePercent,
  walletAddress,
}: AgentStatusCardProps) {
  const Icon = AGENT_ICONS[agentType] || Sparkles
  const color = AGENT_COLORS[agentType] || 'text-gray-500'
  const bgColor = AGENT_BG_COLORS[agentType] || 'bg-gray-500/10 border-gray-500/30'

  return (
    <div className={`p-4 rounded-lg border ${bgColor} transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-background/50">
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <h4 className="font-medium">{name}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(state.status)}
          {getStatusBadge(state.status)}
        </div>
      </div>

      <Progress value={state.progress} className="h-1.5 mb-2" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{state.progress}%</span>
        <span>{feePercent}% fee</span>
      </div>

      {walletAddress && (
        <div className="mt-2 text-xs font-mono text-muted-foreground">
          {walletAddress}
        </div>
      )}

      {state.error && (
        <div className="mt-2 text-xs text-red-500">
          {state.error}
        </div>
      )}
    </div>
  )
}

export function AgentStatusList({
  agents,
}: {
  agents: Array<{
    type: string
    name: string
    description: string
    state: AgentState
    feePercent: number
    walletAddress?: string
  }>
}) {
  return (
    <div className="space-y-3">
      {agents.map((agent) => (
        <AgentStatusCard
          key={agent.type}
          agentType={agent.type}
          name={agent.name}
          description={agent.description}
          state={agent.state}
          feePercent={agent.feePercent}
          walletAddress={agent.walletAddress}
        />
      ))}
    </div>
  )
}

export function OverallProgress({
  agents,
}: {
  agents: Array<{ state: AgentState }>
}) {
  const totalProgress = agents.reduce((sum, a) => sum + a.state.progress, 0)
  const avgProgress = agents.length > 0 ? Math.round(totalProgress / agents.length) : 0

  const allCompleted = agents.every(a => a.state.status === 'completed')
  const anyRunning = agents.some(a => a.state.status === 'running')
  const anyError = agents.some(a => a.state.status === 'error')

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
          <Badge variant={allCompleted ? 'default' : anyError ? 'destructive' : 'secondary'}>
            {allCompleted ? 'Completed' : anyError ? 'Error' : anyRunning ? 'Running' : 'Pending'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={avgProgress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2 text-right">{avgProgress}%</p>
      </CardContent>
    </Card>
  )
}
