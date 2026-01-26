# Xandria Deployment Guide

This guide covers deploying the complete Xandria platform, including the frontend/API and the AI RAG service.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- Vercel account (for frontend/API)
- Render account (for AI service) or alternative Python hosting
- PostgreSQL database (Supabase, Neon, or self-hosted)
- Upstash Redis account
- Helius API key
- GitHub account (for CI/CD)

---

## 🚀 Part 1: Frontend & API Deployment (Vercel)

### Step 1: Prepare Your Repository

```bash
# Clone the repository
git clone https://github.com/hicksonhaziel/xandria.git
cd xandria

# Ensure all dependencies are up to date
npm install
npm run build  # Test build locally
```

### Step 2: Set Up Database

1. **Create PostgreSQL Database**
   - Use Supabase, Neon, Railway, or your preferred provider
   - Note the connection string

2. **Run Database Schema**
   ```bash
   # Using psql
   psql -U your_user -d your_database -f database.sql
   
   # Or copy the SQL and run in your provider's SQL editor
   ```

3. **Verify Tables**
   - Check that all tables are created
   - Verify indexes and constraints

### Step 3: Set Up Upstash Redis

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and Token
4. Save for environment variables

### Step 4: Get Helius API Key

1. Visit [Helius](https://helius.dev/)
2. Create an account and project
3. Generate API key
4. Save for environment variables

### Step 5: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard

1. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Set Environment Variables**

   Add the following in Vercel project settings:

   ```env
   # Database
   DATABASE_URL=postgresql://user:pass@host:5432/database
   
   # Redis
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   
   # Helius
   HELIUS_API_KEY=your-helius-key
   
   # Xandeum Network
   XANDEUM_RPC_ENDPOINT=https://devnet-rpc.xandeum.com
   
   # AI Service (set after deploying AI)
   XANDRIA_AI_API_URL=https://your-ai-service.onrender.com
   
   # Optional: Analytics
   NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Verify deployment at the provided URL

#### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# For production
vercel --prod
```

### Step 6: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning

---

## 🤖 Part 2: AI RAG Service Deployment (Render)

### Step 1: Prepare AI Service

```bash
# Clone the AI RAG repository
git clone https://github.com/hicksonhaziel/xandria-ai-rag.git
cd xandria-ai-rag

# Test locally (optional)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Step 2: Deploy to Render

1. **Create New Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   ```
   Name: xandria-ai-rag
   Environment: Python 3
   Region: Choose closest to your users
   Branch: main
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

3. **Set Environment Variables**
   ```env
   # Database (if AI needs direct access)
   DATABASE_URL=postgresql://...
   
   # Vector Database (if using)
   PINECONE_API_KEY=your-key
   PINECONE_ENV=your-env
   
   # OpenAI or other LLM
   OPENAI_API_KEY=your-key
   
   # Optional: Redis for caching
   REDIS_URL=redis://...
   ```

4. **Set Instance Type**
   - Starter: Free tier (with limitations)
   - Starter Plus: $7/month (recommended)
   - Standard: For production use

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment
   - Copy the service URL

### Step 3: Update Frontend Environment

Go back to Vercel and update:
```env
XANDRIA_AI_API_URL=https://xandria-ai-rag.onrender.com
```

Redeploy the frontend to apply changes.

### Step 4: Verify AI Integration

Test the AI endpoint:
```bash
curl -X POST https://your-vercel-app.vercel.app/api/xandria-ai \
  -H "Content-Type: application/json" \
  -d '{
    "action": "chat",
    "message": "Hello, what can you do?",
    "wallet_address": "test-wallet"
  }'
```

---


## 🔒 Security Best Practices

### Environment Variables

- Never commit `.env` files
- Use different values for dev/staging/production
- Rotate keys regularly
- Use Vercel's environment variable encryption



### Database Security

- Use connection pooling
- Enable SSL for database connections
- Set up read replicas for scaling
- Regular backups

---

## 📊 Monitoring & Logging

### Vercel Analytics

Enable in `next.config.js`:
```javascript
module.exports = {
  experimental: {
    analytics: true,
  },
};
```

### Error Tracking

Add Sentry or similar:
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### Performance Monitoring

```typescript
// app/api/health/route.ts
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: await checkDatabase(),
    redis: await checkRedis(),
    ai: await checkAI(),
  };
  
  return Response.json(health);
}
```

---

## 🔧 Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
vercel build --force

# Check logs
vercel logs your-deployment-url
```

### Database Connection Issues

- Verify connection string format
- Check IP allowlist settings
- Ensure SSL mode is correct
- Test connection locally first

### AI Service Errors

```bash
# Check Render logs
render logs -s your-service-id

# Test endpoint directly
curl https://your-ai-service.onrender.com/health
```

### Redis Connection Issues

- Verify Upstash credentials
- Check REST URL format
- Test with Upstash CLI
- Review usage limits

---

## 🚀 Performance Optimization

### Edge Functions

Move critical API routes to edge:
```typescript
export const runtime = 'edge';
```

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_pubkey ON pnodes(pubkey);
CREATE INDEX idx_status ON pnodes(status);
CREATE INDEX idx_score ON pnodes(score DESC);
```

### Caching Strategy

```typescript
export const revalidate = 30; // ISR with 30s revalidation

// Or use Redis caching
const cached = await redis.get(`pnode:${pubkey}`);
if (cached) return cached;
```

### Image Optimization

Use Next.js Image component:
```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  width={200}
  height={100}
  alt="Xandria"
  priority
/>
```

---

## 📈 Scaling Considerations

### Database

- Enable connection pooling
- Set up read replicas
- Consider sharding for large datasets
- Use prepared statements

### API

- Implement caching layers
- Use CDN for static assets
- Enable compression
- Consider API rate limiting

### AI Service

- Scale Render instance based on load
- Implement request queuing
- Cache frequent queries
- Consider multiple regions

---

## 🔄 Continuous Deployment

### Auto-Deploy on Push

Vercel automatically deploys on:
- Push to `main` branch → Production
- Push to other branches → Preview deployments

### Manual Deployment

```bash
# Deploy specific branch
vercel --prod

# Deploy with custom name
vercel --name xandria-staging
```

---

## 📝 Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test database connectivity
- [ ] Check Redis connection
- [ ] Validate Helius API integration
- [ ] Test AI service communication
- [ ] Verify cron jobs are running
- [ ] Set up monitoring/alerts
- [ ] Configure custom domain
- [ ] Test all API endpoints
- [ ] Check mobile responsiveness
- [ ] Verify SSL certificate
- [ ] Set up error tracking
- [ ] Document any custom configurations

---

## 🆘 Support

If you encounter issues:

1. Check logs first
2. Review environment variables
3. Test components individually
4. Consult documentation
5. Open a GitHub issue

**Contact:**
- Email: hicksonhaziel@gmail.com
- Twitter: [@devhickson](https://twitter.com/devhickson)
- Discord: [Xandeum Server](https://discord.com/invite/mGAxAuwnR9)

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Render Documentation](https://render.com/docs)
- [Upstash Redis](https://docs.upstash.com/redis)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

**Built with ❤️ for the Xandeum Community**