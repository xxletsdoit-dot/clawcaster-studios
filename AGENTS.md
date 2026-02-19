# AGENTS.md

Coding agent guidelines for ClawCaster Studios - an onchain entertainment pipeline with Bankr integration.

## Project Overview

**ClawCaster Studios** is a Next.js 16 application that creates short films using AI agents with blockchain-based revenue splitting via Bankr infrastructure.

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Runtime**: Bun
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma ORM (SQLite dev, PostgreSQL prod)
- **Blockchain**: Bankr API / @bankr/sdk
- **State**: Zustand (global), TanStack Query (server state)
- **Validation**: Zod

## Commands

### Development
```bash
bun run dev          # Start dev server on port 3000
bun run build        # Production build
bun run lint         # Run ESLint
bun run test         # Run tests
```

### Database (Prisma)
```bash
bun run db:generate  # Generate Prisma client
bun run db:push      # Push schema to database (dev)
bun run db:migrate   # Run migrations (dev)
bun run db:migrate:prod # Deploy migrations (prod)
bun run db:reset     # Reset database
bun run db:studio    # Open Prisma Studio
```

### Deployment
```bash
bun run deploy       # Deploy to Vercel (production)
bun run deploy:preview # Deploy preview
```

### Testing (Bun Test)
```bash
bun test                    # Run all tests
bun test <file>             # Run single test file
bun test --watch            # Watch mode
bun test --coverage         # Run with coverage
```

## Bankr Integration

### Supported Chains
| Chain | Architecture | Native Token |
|-------|-------------|--------------|
| Base | EVM | ETH |
| Ethereum | EVM | ETH |
| Polygon | EVM | POL |
| Unichain | EVM | ETH |
| Solana | SVM | SOL |

### Demo Mode
Set `DEMO_MODE=true` for mock data without real API calls.

### API Routes
- `/api/bankr/wallet` - Wallet management
- `/api/bankr/launch` - Token launching
- `/api/bankr/fees` - Fee splitting
- `/api/bankr/chains` - Supported chains

### Fee Splitting (Default)
| Recipient | Share |
|-----------|-------|
| Script Agent | 40% |
| Director Agent | 20% |
| Rendering Agent | 10% |
| Asset Agent | 10% |
| Voice Agent | 5% |
| Human Producer | 10% |
| Platform Fee | 5% |

## Code Style Guidelines

### Imports
Order imports as follows:
1. React/Next.js imports
2. Third-party packages (alphabetical)
3. Internal imports with `@/` alias
4. Relative imports

```typescript
import { useState, useEffect } from 'react'
import { NextRequest, NextResponse } from 'next/server'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { db } from '@/lib/db'
import { cn } from '@/lib/utils'
```

### Components
- Use **named exports** for components
- Functional components with explicit prop types
- Add `'use client'` directive for client components

```typescript
'use client'

import { Button } from '@/components/ui/button'

interface MyComponentProps {
  title: string
  onSubmit?: () => void
}

export function MyComponent({ title, onSubmit }: MyComponentProps) {
  return (
    <Button onClick={onSubmit}>
      {title}
    </Button>
  )
}
```

### Styling
- Use Tailwind utility classes
- Use the `cn()` utility for conditional/merged classes
- Follow shadcn/ui patterns for component variants

```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  className
)} />
```

### Types
- Define interfaces for component props
- Use Prisma generated types for database models
- Prefer explicit types over `any`

```typescript
interface Project {
  id: string
  title: string
  status: 'draft' | 'processing' | 'completed' | 'minted'
}
```

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProjectCard` |
| Functions | camelCase | `handleCreateProject` |
| Variables | camelCase | `isCreating` |
| Constants | SCREAMING_SNAKE | `FEE_SPLIT` |
| Files | kebab-case | `project-card.tsx` |
| Types/Interfaces | PascalCase | `ProjectAgent` |

### API Routes
- Use async handlers with try/catch
- Return consistent response format: `{ success, data/error }`
- Handle errors gracefully with appropriate status codes

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const data = await db.project.findMany()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.required) {
      return NextResponse.json(
        { success: false, error: 'Required field missing' },
        { status: 400 }
      )
    }
    const result = await db.project.create({ data: body })
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}
```

### Error Handling
- Always use try/catch in async functions
- Log errors with `console.error()`
- Return meaningful error messages
- Use appropriate HTTP status codes (400, 404, 500)

### Database (Prisma)
- Import the singleton client from `@/lib/db`
- Use Prisma's generated types
- SQLite for local development
- PostgreSQL for production (Vercel)

```typescript
import { db } from '@/lib/db'

const projects = await db.project.findMany({
  include: { agents: true },
  orderBy: { createdAt: 'desc' }
})
```

### State Management
- **Zustand**: Global client state (user preferences, UI state)
- **TanStack Query**: Server state (API data, caching)
- **React useState**: Local component state

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── bankr/          # Bankr integration routes
│   │   ├── generate/       # AI generation routes
│   │   └── workflow/       # Workflow orchestration
│   ├── create/             # Create film page
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── dashboard/          # Dashboard components
│   └── ui/                 # shadcn/ui components
├── hooks/
└── lib/
    ├── agents/             # AI agent classes
    ├── bankr/              # Bankr client & utilities
    ├── db.ts               # Prisma client
    └── utils.ts

prisma/
├── schema.prisma           # PostgreSQL (production)
├── schema.sqlite.prisma    # SQLite (development)
└── migrations/

contracts/
├── ClawRights.sol          # ERC-1155 NFT contract
└── FeeSplitter.sol         # Fee splitting logic
```

## Environment Variables

```bash
DATABASE_URL=           # PostgreSQL URL (production)
DIRECT_DATABASE_URL=    # Direct connection (production)
ZAI_API_KEY=           # Z.ai API key
BANKR_API_KEY=         # Bankr API key (optional)
BANKR_PRIVATE_KEY=     # Wallet private key (optional)
DEMO_MODE=true         # Enable demo mode
```

## Important Notes

- **ESLint is permissive**: Most rules are disabled for flexibility
- **TypeScript**: Strict mode enabled but `noImplicitAny: false`
- **No comments**: Do not add comments unless explicitly requested
- **Path alias**: Use `@/` for imports from `src/`
- **React 19**: Use modern React patterns (hooks, functional components)
- **Deployment**: See DEPLOYMENT.md for detailed instructions
