'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FeeSplitConfig, DEFAULT_FEE_SPLIT } from '@/lib/bankr/types'

interface FeeSplitChartProps {
  feeSplit?: FeeSplitConfig
  totalRevenue?: number
}

const FEE_COLORS: Record<string, string> = {
  scriptAgent: '#8B5CF6',
  directorAgent: '#F59E0B',
  renderingAgent: '#10B981',
  assetAgent: '#EC4899',
  voiceAgent: '#06B6D4',
  humanProducer: '#3B82F6',
  platformFee: '#6B7280',
}

const FEE_LABELS: Record<string, string> = {
  scriptAgent: 'Script Agent',
  directorAgent: 'Director Agent',
  renderingAgent: 'Rendering Agent',
  assetAgent: 'Asset Agent',
  voiceAgent: 'Voice Agent',
  humanProducer: 'Human Producer',
  platformFee: 'Platform Fee',
}

export function FeeSplitChart({ feeSplit = DEFAULT_FEE_SPLIT, totalRevenue = 100 }: FeeSplitChartProps) {
  const fees = Object.entries(feeSplit).map(([key, value]) => ({
    key,
    label: FEE_LABELS[key] || key,
    percent: value,
    color: FEE_COLORS[key] || '#888',
    amount: (totalRevenue * value) / 100,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="20" x2="12" y2="10" />
            <line x1="18" y1="20" x2="18" y2="4" />
            <line x1="6" y1="20" x2="6" y2="16" />
          </svg>
          Revenue Split
        </CardTitle>
        <CardDescription>
          Automated fee distribution via Bankr infrastructure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex h-4 rounded-full overflow-hidden">
          {fees.map((fee) => (
            <div
              key={fee.key}
              className="transition-all duration-300"
              style={{
                width: `${fee.percent}%`,
                backgroundColor: fee.color,
              }}
              title={`${fee.label}: ${fee.percent}%`}
            />
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          {fees.map((fee) => (
            <div key={fee.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: fee.color }}
                />
                <span className="text-sm">{fee.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{fee.percent}%</span>
                <span className="text-xs text-muted-foreground">
                  ({fee.amount.toFixed(2)} VVV)
                </span>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">
            Example: {totalRevenue} VVV streaming revenue
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {fees.slice(0, 4).map((fee) => (
              <div key={fee.key} className="flex justify-between">
                <span className="text-muted-foreground">{fee.label}:</span>
                <span className="font-medium">{fee.amount.toFixed(2)} VVV</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function FeeSplitCompact({ feeSplit = DEFAULT_FEE_SPLIT }: { feeSplit?: FeeSplitConfig }) {
  const fees = Object.entries(feeSplit).map(([key, value]) => ({
    key,
    color: FEE_COLORS[key] || '#888',
    percent: value,
  }))

  return (
    <div className="flex h-2 rounded-full overflow-hidden">
      {fees.map((fee) => (
        <div
          key={fee.key}
          style={{
            width: `${fee.percent}%`,
            backgroundColor: fee.color,
          }}
        />
      ))}
    </div>
  )
}
