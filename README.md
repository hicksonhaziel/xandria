# Xandria - Advanced Xandeum pNode Analytics Platform

![XandViz Banner](https://xandria-eight.vercel.app/xandria.png)

> **Submission for:** Xandeum pNode Analytics Platform Bounty  
> **Built by:** Hickson Haziel 
> **Live Demo:** [https://xandria-eight.vercel.app](https://xandria-eight.vercel.app)  
> **Demo Video:** [Link to video]

---

## 🎯 Overview

Xandria is a next-generation analytics platform for Xandeum pNodes that goes beyond basic data display to provide actionable insights, network health monitoring, and operator tools. Built with modern web technologies and a focus on user experience, Xandria helps operators make informed decisions about pNode performance and network participation.

### ✨ Key Features

#### **Core Functionality**
- Real-time pNode discovery via gossip protocol
- Comprehensive pNode information display
- Advanced search, filter, and sort capabilities
- Live data updates via Redis
- Historical data

#### **Unique Innovations**
- **XandScore™** - Proprietary performance scoring algorithm (0-100 scale)
- **3D Network Topology** - Interactive visualization of pNode network
- **Predictive Analytics** - Performance trends and forecasting
- **Operator Dashboard** - Personalized insights and recommendations
- **Public API** - RESTful API for ecosystem integration
- **AI** - AI Analysis

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
- Uptash Redis for real-time updates
- HTTP requests

**Deployment:**
- Vercel (serverless)
- Automatic CI/CD
- Edge caching

**Cron job:**
- Github workflows cron job

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Dashboard │  │ 3D Topology  │  │  API Docs    │       │
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
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Xandeum Network (DevNet)                    │
│  ┌────────────────────┐        ┌────────────────────┐      │
│  │  Gossip Protocol   │◄──────►│    pRPC Endpoint   │      │
│  └────────────────────┘        └────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git
- A Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/hicksonhaziel/xandria.git
cd xandria

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Xandeum endpoints

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.


## 📖 Usage Guide

### For pNode Operators

1. **Monitor Your pNode**
   - Search for your pNode by ID or pubkey
   - View real-time performance metrics
   - Check your XandScore™ and grade
   - And data history

2. **Compare Performance**
   - See how you rank against network average
   - Identify areas for improvement
   - Track historical performance trends

3. **Network Insights**
   - View geographic distribution
   - Check version adoption rates
   - Monitor network health

### For Researchers/Developers

1. **Network Analysis**
   - Export data in CSV/JSON format
   - Access public API endpoints
   - Visualize network topology in 3D

2. **API Integration**
   ```bash
   # Get all pNodes
   curl https://xandviz.vercel.app/api/pnodes
   
   # Get specific pNode
   curl https://xandviz.vercel.app/api/pnodes/[pubkey]
   
   # Get pNode xandscore™
   curl https://xandviz.vercel.app/api/xandscore/[pubkey]

   # Get historic data of pNode
   curl https://xandviz.vercel.app/api/analytics/node/[pubkey]
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

Xandria maintains WebSocket connection to gossip protocol for:
- Live pNode status changes
- Performance metric updates
- Network events
- Connection changes

Update frequency: Every 30 seconds

### Historical Data Keep

Xandria stors a node data for 7 days for:
- Node performance tracking
- Performance metric updates
- Connection changes over time

Update frequency: Every 30 seconds

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
  "data": [
    {
      "id": "pnode-EcTqXgB6",
      "pubkey": "EcTqXgB6VJStAtBZAXcjLHf5ULj41H1PFZQ17zKosbhL",
      "version": "0.8.0",
      "responseTime": 0,
      "status": "active",
      "uptime": 1170196,
      "lastSeen": 1766940033000,
      "rpcPort": 6000,
      "ipAddress": "173.212.207.32",
      "isPublic": true,
      "storageCommitted": 340000000000,
      "storageUsed": 50591,
      "storageUsagePercent": 0.000014879705882352,
      "scoreBreakdown": {
        "total": 83.7,
        "uptime": 30,
        "responseTime": 24.3,
        "storage": 4.4,
        "version": 15,
        "reliability": 10,
        "grade": "B",
        "color": "text-blue-500"
      },
      "score": 83.7
    }  
  ],
  "count": 252,
  "stats": {
    "total": 252,
    "active": 199,
    "syncing": 5,
    "offline": 48,
    "avgScore": 68.0198412698413,
    "totalStorage": 387995421228845,
    "usedStorage": 5009305878
  },
  "cached": false,
  "timestamp": 1766940041012
}
```

#### Get Specific pNode
```http
GET /api/pnodes/[pubkey]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pnode-74h474xG",
    "pubkey": "74h474xGaHCeJdofjdGU12oNuBYf8oQRvBAkReQ2K8L6",
    "version": "0.8.0",
    "responseTime": 0,
    "status": "active",
    "uptime": 1204892,
    "lastSeen": 1766940246000,
    "rpcPort": 6000,
    "ipAddress": "161.97.181.230",
    "isPublic": false,
    "storageCommitted": 368000000000,
    "storageUsed": 55210,
    "storageUsagePercent": 0.000015002717391304,
    "private": true,
    "scoreBreakdown": {
      "total": 84.3,
      "uptime": 30,
      "responseTime": 24.5,
      "storage": 4.8,
      "version": 15,
      "reliability": 10,
      "grade": "B",
      "color": "text-blue-500"
    },
    "score": 84.3,
    "networkComparison": {
      "uptimePercentile": 89,
      "storagePercentile": 85,
      "networkAverage": {
        "uptime": 748137.370517928,
        "storage": 1545297545062.17,
        "activeNodeCount": 209
      },
      "totalNodes": 251
    },
    "recommendations": []
  },
  "cached": false,
  "timestamp": 1766940251656
}
```
#### Get pNode xandscore
```http
GET /api/xandscore/[pubkey]
```

**Response:**
```json
{
  "xandscore": {
    "score": 84.6,
    "pubkey": "74h474xGaHCeJdofjdGU12oNuBYf8oQRvBAkReQ2K8L6"
  }
}
```

#### Get Historical data of a pNode
```http
GET /api/analytics/node/[pubkey]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pubkey": "74h474xGaHCeJdofjdGU12oNuBYf8oQRvBAkReQ2K8L6",
    "history": [
      {
        "timestamp": 1766706300344,
        "uptime": 970791,
        "score": 82.4,
        "storageCommitted": 368000000000,
        "storageUsed": 55210,
        "storageUsagePercent": 0.000015002717391304
      },
      {
        "timestamp": 1766713838663,
        "uptime": 978279,
        "score": 80.8,
        "storageCommitted": 368000000000,
        "storageUsed": 55210,
        "storageUsagePercent": 0.000015002717391304
      },
    ],
    "stats": {
      "dataPoints": 18,
      "timeRange": {
        "start": 1766706300344,
        "end": 1766938408336
      },
      "metrics": {
        "uptime": {
          "min": 970791,
          "max": 1202991,
          "avg": 1174413,
          "current": 1202991,
          "previous": 970791,
          "change": 232200
        },
        "score": {
          "min": 80.8,
          "max": 84.2,
          "avg": 82.7333333333333,
          "current": 81.6,
          "previous": 82.4,
          "change": -0.800000000000011
        },
        "xanScore": {
          "min": 81.6,
          "max": 84.2,
          "avg": 82.7125,
          "current": 81.6,
          "previous": 83.3,
          "change": -1.7
        },
        "cpuPercent": null,
        "ramPercent": null,
        "storagePercent": {
          "min": 0.000015002717391304,
          "max": 0.000015002717391304,
          "avg": 0.000015002717391304,
          "current": 0.000015002717391304,
          "previous": 0.000015002717391304,
          "change": 0
        }
      }
    }
  }
}
```

---



---

## 📦 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   vercel login
   vercel
   ```

2. **Set Environment Variables**
   - Go to Vercel Dashboard
   - Project Settings → Environment Variables
   - Add all required variables

3. **Deploy**
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

---

## 📞 Contact & Support

- **Discord**: Join [Xandeum Discord](https://discord.gg/uqRSmmM5m)
- **Email**: hicksonhaziel@gmail.com
- **Twitter**: [@devhickson](https://twitter.com/devhickson)

---

## 🎯 Roadmap

### Phase 1 (Current)
- [x] Core pNode display
- [x] XandScore™ algorithm
- [x] 3D visualization
- [x] Real-time updates
- [x] Historical data tracking

### Phase 2 (Next 2 weeks)

- [ ] Performance predictions
- [ ] Alert system for operators
- [ ] Mobile app (React Native)

### Phase 3 (1 month)
- [ ] Staking integration
- [ ] Reward calculator
- [ ] Network governance insights
- [ ] Advanced analytics

---


**Built with ❤️ for the Xandeum Community**

*"Visualizing the future of decentralized storage, one pNode at a time."*

---

## 📸 Screenshots

### Dashboard
![Dashboard](https://xandria-eight.vercel.app/Dashboard.png)

### 3D Network View
![3D View](https://xandria-eight.vercel.app/3d.png)

### pNode Details
![Details](https://xandria-eight.vercel.app/Dashboard.png)

### Light Mode
![Ligt Mode](https://xandria-eight.vercel.app/Lmode.png)

---

## 🔗 Links

- **Live Demo**: https://xandria-eight.vercel.app
- **GitHub**: https://github.com/hicksonhaziel/xandria
- **Demo Video**: [YouTube link]
- **Xandeum Network**: https://xandeum.network
