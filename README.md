# Xandria - Advanced Xandeum pNode Analytics Platform

![XandViz Banner](https://xandria-eight.vercel.app/xandria.png)

> **Submission for:** Xandeum pNode Analytics Platform Bounty  
> **Built by:** Hickson Haziel  
> **Live Demo:** [https://xandria-eight.vercel.app](https://xandria-eight.vercel.app)  
> **Demo Video:** [https://youtu.be/1EVQZr022ew](https://youtu.be/1EVQZr022ew)  
> **Read the full story:** [Building Xandria on Medium](https://medium.com/@hicksonhaziel/building-xandria-a-next-generation-analytics-platform-for-xandeum-pnodes-4b1d83924889)

---

## 🎯 Overview

Xandria is a next-generation analytics platform for Xandeum pNodes that goes beyond basic data display to provide actionable insights, network health monitoring, and operator tools. Built with modern web technologies and a focus on user experience, Xandria helps operators make informed decisions about pNode performance and network participation.

### ✨ Key Features

#### **Core Functionality**
- Real-time pNode discovery via gossip protocol
- Comprehensive pNode information display
- Advanced search, filter, and sort capabilities
- Live data updates via Redis
- Historical data tracking (7-day retention)
- **Managers Dashboard** - Track pNode operators, their nodes, and NFT holdings via Helius integration
- **Xandria AI** - Intelligent chat assistant powered by RAG for network insights

#### **Unique Innovations**
- **XandScore™** - Proprietary performance scoring algorithm (0-100 scale)
- **3D Network Topology** - Interactive visualization of pNode network
- **Predictive Analytics** - Performance trends and forecasting
- **Operator Dashboard** - Personalized insights and recommendations
- **Public API** - RESTful API for ecosystem integration
- **AI-Powered Insights** - Natural language queries about network data

#### **User Experience**
- Modern glassmorphism design
- Dark/Light mode with smooth transitions
- Fully responsive (mobile, tablet, desktop)
- Optimized performance (<2s load time)
- Accessible (WCAG 2.1 compliant)

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (React 18, App Router)
- TypeScript for type safety
- Tailwind CSS for styling
- Recharts for data visualization
- Three.js for 3D graphics

**Backend:**
- Next.js API routes
- Upstash Redis for real-time updates
- PostgreSQL for data persistence
- Python FastAPI (Xandria AI RAG service)

**External Integrations:**
- Helius API for NFT and wallet data
- Xandria AI RAG ([github.com/hicksonhaziel/xandria-ai-rag](https://github.com/hicksonhaziel/xandria-ai-rag))

**Deployment:**
- Vercel (frontend/API)
- Render (AI service)
- Automatic CI/CD
- Edge caching

**Automation:**
- GitHub Actions cron jobs

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Dashboard │  │ 3D Topology  │  │  Managers    │       │
│  │            │  │              │  │  Xandria AI  │       │
│  └────────────┘  └──────────────┘  └──────────────┘       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            React Query (State Management)              │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  API Routes  │  │  pRPC Client │  │  Scoring     │    │
│  │  (/api/*)    │  │  (lib/prpc)  │  │  Engine      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Helius     │   │  Xandria AI  │   │   Xandeum    │
│     API      │   │     RAG      │   │   Network    │
│              │   │  (Python)    │   │  (DevNet)    │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git
- PostgreSQL database
- Upstash Redis account
- Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/hicksonhaziel/xandria.git
cd xandria

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Database Setup

```bash
# Copy the database schema
# Located in /database.sql

# Run it on your PostgreSQL instance
psql -U your_user -d your_database -f database.sql
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Helius (for Manager features)
HELIUS_API_KEY=...

# Xandeum Network
XANDEUM_RPC_ENDPOINT=...
```

---

## 📖 Usage Guide

### For pNode Operators

1. **Monitor Your pNode**
   - Search for your pNode by ID or pubkey
   - View real-time performance metrics
   - Check your XandScore™ and grade
   - Access 7-day historical data

2. **Compare Performance**
   - See how you rank against network average
   - Identify areas for improvement
   - Track historical performance trends

3. **Network Insights**
   - View geographic distribution
   - Check version adoption rates
   - Monitor network health

4. **Ask Xandria AI**
   - Natural language queries about your node
   - Get optimization recommendations
   - Understand network trends

### For Managers

1. **Track Your Operations**
   - View all nodes under your management
   - Monitor collective performance
   - See NFT holdings via Helius integration

2. **Portfolio Overview**
   - Aggregate statistics across all nodes
   - Performance comparisons
   - Resource utilization

### For Researchers/Developers

1. **Network Analysis**
   - Export data in CSV/JSON format
   - Access public API endpoints
   - Visualize network topology in 3D

2. **API Integration**
   ```bash
   # Get all pNodes
   curl https://xandria-eight.vercel.app/api/pnodes
   
   # Get specific pNode
   curl https://xandria-eight.vercel.app/api/pnodes/[pubkey]
   
   # Get pNode XandScore™
   curl https://xandria-eight.vercel.app/api/xandscore/[pubkey]

   # Get historical data
   curl https://xandria-eight.vercel.app/api/analytics/node/[pubkey]
   
   # Chat with Xandria AI
   curl -X POST https://xandria-eight.vercel.app/api/ai \
     -H "Content-Type: application/json" \
     -d '{"action": "chat", "message": "What is my node performance?"}'
   ```

---

## 🎨 Features Deep Dive

### XandScore™ Algorithm

The XandScore™ is a proprietary scoring system (0-100) that evaluates pNode performance across five key metrics:

**Scoring Components:**
1. **Uptime (30%)** - Availability over time
2. **Response Time (25%)** - Speed of pRPC responses
3. **Storage Capacity (20%)** - Total available storage
4. **Version Currency (15%)** - Running latest software
5. **Network Reliability (10%)** - Consistency in gossip

**Grade Scale:**
- A+ (95-100): Exceptional
- A (90-94): Excellent
- B+ (85-89): Very Good
- B (80-84): Good
- C+ (75-79): Average
- C (70-74): Below Average
- D (60-69): Poor
- F (<60): Failing

### Managers Dashboard

Track pNode operators and their infrastructure:
- Aggregate node statistics per manager
- NFT holdings via Helius API
- Performance comparisons across managed nodes
- Resource allocation insights

### Xandria AI

Intelligent assistant powered by RAG (Retrieval-Augmented Generation):
- Natural language queries about network data
- Personalized recommendations
- Performance analysis and insights
- Historical trend explanations
- Session-based conversation memory

**AI Architecture:**
- Python FastAPI backend ([xandria-ai-rag](https://github.com/hicksonhaziel/xandria-ai-rag))
- Vector database for document retrieval
- Context-aware responses
- Multi-session support

### 3D Network Visualization

Interactive Three.js-powered visualization showing:
- Real-time pNode positions
- Gossip protocol connections
- Color-coded performance status
- Automatic rotation (pauses on interaction)
- Click to inspect individual nodes

**Controls:**
- **Mouse Drag**: Rotate view
- **Scroll**: Zoom in/out
- **Click Node**: View details
- **Double Click**: Focus on node

### Real-Time Updates

Live data via Redis and gossip protocol:
- pNode status changes
- Performance metric updates
- Network events
- Connection changes

**Update frequency:** Every 30 seconds

### Historical Data

7-day data retention for:
- Performance tracking
- Trend analysis
- Metric comparisons

---

## 🔌 API Documentation

### Endpoints

#### Get All pNodes
```http
GET /api/pnodes
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 252,
  "stats": {
    "total": 252,
    "active": 199,
    "avgScore": 68.02
  }
}
```

#### Get Specific pNode
```http
GET /api/pnodes/[pubkey]
```

#### Get XandScore
```http
GET /api/xandscore/[pubkey]
```

#### Get Historical Data
```http
GET /api/analytics/node/[pubkey]
```

#### Xandria AI Chat
```http
POST /api/ai
Content-Type: application/json

{
  "action": "chat",
  "message": "How is my node performing?",
  "session_id": "optional-session-id",
  "wallet_address": "optional-wallet"
}
```

**AI Actions:**
- `chat` - Send message
- `regenerate` - Regenerate last response
- `rate` - Rate AI response
- `history` - Get chat history
- `sessions` - Get user sessions

---

## 📦 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

Quick deploy to Vercel:
```bash
vercel --prod
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow conventional commit messages
- Ensure all tests pass before submitting PR

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Xandeum Labs** - For creating the pNode network and hosting this bounty
- **Solana Community** - For inspiration from validator dashboards
- **Open Source Community** - For the amazing tools and libraries
- **Helius** - For providing robust NFT and wallet APIs

---

## 📞 Contact & Support

- **Discord**: Join [Xandeum Discord](https://discord.com/invite/mGAxAuwnR9)
- **Email**: hicksonhaziel@gmail.com
- **Twitter**: [@devhickson](https://twitter.com/devhickson)
- **GitHub**: [hicksonhaziel/xandria](https://github.com/hicksonhaziel/xandria)

---

## 🎯 Roadmap

### Phase 1 ✅ (Completed)
- [x] Core pNode display
- [x] XandScore™ algorithm
- [x] 3D visualization
- [x] Real-time updates
- [x] Historical data tracking
- [x] Managers dashboard
- [x] Xandria AI integration

### Phase 2 (In Progress)
- [ ] Performance predictions
- [ ] Alert system for operators
- [ ] Mobile app (React Native)
- [ ] Enhanced AI capabilities

### Phase 3 (Planned)
- [ ] Staking integration
- [ ] Reward calculator
- [ ] Network governance insights
- [ ] Advanced analytics dashboard

---

**Built with ❤️ for the Xandeum Community**

*"Visualizing the future of decentralized storage, one pNode at a time."*

---

## 📸 Screenshots

### Dashboard
![Dashboard](https://xandria-eight.vercel.app/Dashboard.png)

### 3D Network View
![3D View](https://xandria-eight.vercel.app/3d.png)

### Managers Dashboard
Track operators, nodes, and NFT holdings in one place.

### Xandria AI
Get intelligent insights through natural conversation.

### Light Mode
![Light Mode](https://xandria-eight.vercel.app/Lmode.png)

---

## 🔗 Links

- **Live Demo**: https://xandria-eight.vercel.app
- **GitHub (Frontend)**: https://github.com/hicksonhaziel/xandria
- **GitHub (AI RAG)**: https://github.com/hicksonhaziel/xandria-ai-rag
- **Demo Video**: https://youtu.be/1EVQZr022ew
- **Xandeum Network**: https://xandeum.network
- **Medium Article**: https://medium.com/@hicksonhaziel/building-xandria-a-next-generation-analytics-platform-for-xandeum-pnodes-4b1d83924889