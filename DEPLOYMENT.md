# ClawCaster Studios - Deployment Guide

Complete guide for deploying ClawCaster Studios to Vercel with Bankr integration.

## Quick Start

```bash
# 1. Install Vercel CLI
bun add -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel --prod
```

---

## Prerequisites

### Required Accounts

| Service | Purpose | Cost |
|---------|---------|------|
| [GitHub](https://github.com) | Code repository | Free |
| [Vercel](https://vercel.com) | Hosting | Free tier |
| [Bankr](https://bankr.bot) | Blockchain integration | Pay per use |
| [Z.ai](https://z.ai) | AI generation | Pay per use |

### Optional Services

| Service | Purpose | Cost |
|---------|---------|------|
| Domain Registrar | Custom domain | ~$10/year |
| Vercel Pro | More resources | $20/month |

---

## Step-by-Step Deployment

### Step 1: Prepare Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: ClawCaster Studios"

# Create GitHub repository and push
gh repo create clawcaster-studios --public --source=. --push
```

### Step 2: Create Vercel Project

**Option A: Via Dashboard**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework Preset: Next.js (auto-detected)
4. Click "Deploy"

**Option B: Via CLI**

```bash
vercel
# Follow the interactive prompts
```

### Step 3: Configure Database

**Option A: Vercel Postgres (Recommended)**

1. In Vercel Dashboard, go to your project
2. Click "Storage" → "Create Database"
3. Select "Postgres"
4. Copy the connection strings to environment variables

**Option B: Supabase**

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Project Settings → Database
4. Copy connection strings

### Step 4: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgres://...
DIRECT_DATABASE_URL=postgres://...
ZAI_API_KEY=your_key
BANKR_API_KEY=bk_your_key
BANKR_PRIVATE_KEY=0x_your_key
DEMO_MODE=false
```

### Step 5: Run Migrations

After first deployment, run migrations:

```bash
# Set DATABASE_URL in your local .env
vercel env pull .env.local

# Run migrations
bunx prisma migrate deploy
```

### Step 6: Seed Database (Optional)

```bash
curl -X POST https://your-app.vercel.app/api/seed
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection URL (pooled) |
| `DIRECT_DATABASE_URL` | Yes | PostgreSQL direct connection |
| `ZAI_API_KEY` | Yes | Z.ai API key for AI generation |
| `BANKR_API_KEY` | No | Bankr API key (required if DEMO_MODE=false) |
| `BANKR_PRIVATE_KEY` | No | Wallet private key for Bankr SDK |
| `DEMO_MODE` | No | Set "true" for mock data |

---

## Custom Domain Setup

### Option A: Buy Domain on Vercel

1. Go to Project Settings → Domains
2. Click "Buy Domain"
3. Complete purchase (~$10-20/year)

### Option B: Use Existing Domain

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS records as shown:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## Bankr API Setup

### 1. Create Bankr Account

1. Visit [bankr.bot/api](https://bankr.bot/api)
2. Sign in with X (Twitter) or email
3. Generate API Key

### 2. Fund Your Wallet

For production use with the SDK:
1. Get USDC on Base network
2. Send to your Bankr wallet address

### 3. Configure Permissions

In Bankr Dashboard:
- Enable "Agent API" access
- Set spending limits if desired
- Configure webhook URLs (optional)

---

## Monitoring & Logs

### View Logs

```bash
# Via CLI
vercel logs

# Via Dashboard
# Go to Project → Deployments → Select deployment → Logs
```

### Analytics

Vercel provides built-in analytics:
1. Go to Project → Analytics
2. Enable Web Analytics (free)
3. Add tracking code if needed

---

## Troubleshooting

### Build Fails

```bash
# Check for TypeScript errors
bun run build

# Check for lint errors
bun run lint
```

### Database Connection Error

1. Verify DATABASE_URL is correct
2. Check if database is accessible from Vercel
3. Ensure SSL mode is correct (usually `?sslmode=require`)

### API Routes Not Working

1. Check function timeout (max 60s on Hobby plan)
2. Verify environment variables are set
3. Check Vercel function logs

---

## Cost Estimate

### Free Tier Limits

| Service | Limit |
|---------|-------|
| Vercel Bandwidth | 100 GB/month |
| Vercel Functions | 100 GB-hours |
| Vercel Postgres | 256 MB storage |
| Bankr API | $0.10/request |

### Typical Monthly Cost (Small App)

| Service | Cost |
|---------|------|
| Vercel | $0 (Hobby) |
| Domain | ~$1/month |
| Bankr API | ~$5-20 |
| **Total** | **~$6-21/month** |

---

## Security Checklist

- [ ] Never commit `.env` files
- [ ] Use environment variables in Vercel
- [ ] Enable Vercel's DDoS protection (automatic)
- [ ] Set up rate limiting for API routes
- [ ] Keep dependencies updated
- [ ] Review Bankr API permissions regularly
- [ ] Use separate API keys for dev/prod

---

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Bankr Docs**: [docs.bankr.bot](https://docs.bankr.bot)
- **Project Issues**: [GitHub Issues](https://github.com/your-repo/issues)
