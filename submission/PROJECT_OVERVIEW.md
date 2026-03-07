# OmniOracle — Project Overview

> **Chainlink Convergence Hackathon** | Feb 6 – Mar 1, 2026
> **Track:** Prediction Markets ($16K / $10K / $6K)
> **Tagline:** "Zapier for Prediction Market Oracles"

---

## 1. Problem Statement

Current prediction markets use **one-size-fits-all** oracle resolution:
- Polymarket uses UMA's optimistic oracle for everything — from crypto prices to political events
- UMA suffered a [$7M manipulation attack](https://x.com/UloEleanor/status/1773068800289718725) (March 2025) due to human vote centralization
- Different market types need different data pipelines — a BTC price market shouldn't resolve the same way as "Will it rain in Jakarta tomorrow?"
- No existing platform lets users **compose** their own oracle pipeline at market creation

## 2. Solution

**OmniOracle** is a **permissionless prediction market factory** where anyone can create markets with **customizable oracle resolution pipelines** — powered entirely by Chainlink CRE.

### 5 Composable Pipeline Types

| # | Pipeline | Data Source | Use Case | Confidence |
|---|----------|------------|----------|------------|
| 0 | **Price Feed** | Chainlink Data Feeds | "Will ETH > $5000?" | 100% (deterministic) |
| 1 | **Data Stream** | Chainlink Data Streams | Sub-second price markets | 100% (deterministic) |
| 2 | **Functions API** | Chainlink Functions + Custom JS | Sports, weather, custom APIs | Variable |
| 3 | **AI Grounded** | Gemini + Search Grounding | World events, politics | 60-90% |
| 4 | **Composite** | N-of-M Agreement (multi-source) | High-stakes, multi-verification | 75-100% |

### How It Works

```
User creates market → Selects pipeline type → Configures oracle params
                                                     ↓
CRE market-factory workflow validates question (Gemini AI)
                                                     ↓
Market goes live → Users bet YES/NO → Deadline passes
                                                     ↓
Anyone triggers resolution → CRE oracle-resolver workflow
                                                     ↓
Dynamic pipeline executes based on type:
  - Price Feed → reads Chainlink Data Feed → deterministic
  - AI Grounded → Gemini with search grounding → probabilistic
  - Composite → aggregates N sources → consensus
                                                     ↓
Market resolved on-chain → Winners claim proportional payout (2% fee)
```

## 3. Architecture

```
┌────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js 16)                 │
│  Dashboard | Markets | Pipeline Builder | Portfolio | CCIP │
└──────────────────────┬─────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────┐
│                 x402 SERVER (Express + Bun)                 │
│  POST /create-market ($0.01)  POST /resolve ($0.005)       │
│  GET /markets  GET /pipelines  GET /portfolio  GET /stats   │
└──────────────────────┬─────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────┐
│                   CHAINLINK CRE LAYER                       │
│                                                             │
│  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────┐│
│  │ market-factory   │ │ oracle-resolver  │ │ cross-chain  ││
│  │ HTTP + Cron      │ │ EVM Log Trigger  │ │ Cron → CCIP  ││
│  │ → validate       │ │ → dynamic route  │ │ → mirror     ││
│  │ → create market  │ │ → resolve market │ │ → sync       ││
│  └─────────────────┘ └──────────────────┘ └──────────────┘│
└──────────────────────┬─────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────┐
│              SMART CONTRACTS (Base Sepolia)                  │
│                                                             │
│  MarketFactory.sol ←→ OraclePipeline.sol (immutable config) │
│       ↕                        ↕                            │
│  OmniResolver.sol    CrossChainRegistry.sol (CCIP)          │
│       ↕                                                     │
│  AutoResolver.sol (Chainlink Automation)                    │
└─────────────────────────────────────────────────────────────┘
```

## 4. Chainlink Services Used (8 Total)

| # | Service | How We Use It |
|---|---------|--------------|
| 1 | **CRE** | 3 workflows: market creation, dynamic resolution, cross-chain sync |
| 2 | **x402** | Payment-gated API: $0.01 to create market, $0.005 to request resolution |
| 3 | **Data Feeds** | Pipeline module: ETH/USD, BTC/USD, LINK/USD price thresholds |
| 4 | **Data Streams** | Pipeline module: real-time sub-second price data |
| 5 | **Functions** | Pipeline module: custom JS execution for sports/weather APIs |
| 6 | **CCIP** | Cross-chain market mirroring between Base ↔ other chains |
| 7 | **VRF v2.5** | Random selection of "Featured Market" for homepage |
| 8 | **Automation** | Auto-resolution trigger when markets pass deadline |

## 5. Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.24, Foundry, OpenZeppelin v5 |
| CRE Workflows | TypeScript → WASM (@chainlink/cre-sdk) |
| Backend API | Express.js + Bun, x402 micropayments |
| Frontend | Next.js 16, React 19, wagmi 3, RainbowKit, Tailwind CSS 4 |
| AI | Google Gemini 2.0 Flash (search grounding) |
| Chain | Base Sepolia (84532) |

## 6. Project Stats

| Metric | Value |
|--------|-------|
| Smart Contracts | 5 core + 1 interface |
| Total Solidity LoC | ~567 |
| CRE Workflows | 3 (4 triggers: HTTP, 2x Cron, EVM Log) |
| CRE TypeScript LoC | ~734 |
| Test Cases | 46 (all passing) |
| API Endpoints | 8 (2 paid via x402, 6 free) |
| Frontend Pages | 6 |
| Frontend LoC | ~800+ |
| Pipeline Types | 5 composable oracle pipelines |

## 7. Smart Contract Overview

### MarketFactory.sol (312 lines) — Core Contract
- `createMarket()` — permissionless market creation with seed liquidity (min 0.01 ETH)
- `predict()` — place YES/NO bets (min 0.001 ETH)
- `onReport()` — CRE callback for creation (0x00) and resolution (0x01)
- `claim()` — proportional payout with ReentrancyGuard, 2% platform fee
- `disputeResolution()` — 0.05 ETH dispute bond mechanism
- `setFeaturedMarket()` — VRF-powered random feature selection

### OraclePipeline.sol (55 lines) — Immutable Config Registry
- Stores pipeline configuration per market (one-time write, never modified)
- Maps each market to its PipelineConfig (type, feed address, threshold, AI prompt hash, etc.)

### OmniResolver.sol (59 lines) — Dynamic Resolution Executor
- Emits `ResolutionTriggered` for CRE EVM Log workflow
- Receives CRE report with (marketId, outcome, confidence)
- Calls MarketFactory to finalize resolution

### CrossChainRegistry.sol (88 lines) — CCIP Market Mirroring
- `mirrorMarket()` — sends market metadata via CCIP to destination chains
- `receiveCrossChainMarket()` — accepts and stores mirrored markets

### AutoResolver.sol (53 lines) — Chainlink Automation
- `checkUpkeep()` / `performUpkeep()` — scans for expired markets
- Auto-triggers resolution when deadline passes

## 8. CRE Workflows Detail

### Workflow 1: market-factory
**Triggers:** HTTP POST + Cron (every 6h)
- HTTP: User submits market via x402 → Gemini validates question → encode & sign → `onReport(0x00)`
- Cron: Gemini generates 3 trending market ideas → auto-create

### Workflow 2: oracle-resolver
**Trigger:** EVM Log (`ResolutionRequested` event)
- Dynamically routes to correct pipeline based on `pipelineType`
- Price Feed → read Chainlink Data Feed → compare threshold → deterministic YES/NO
- AI Grounded → Gemini with search grounding → probabilistic outcome + confidence
- Composite → aggregate N sources → check agreement threshold → consensus outcome

### Workflow 3: cross-chain-sync
**Trigger:** Cron (every 4h)
- Reads active markets → encodes CCIP messages → mirrors to destination chains

## 9. Key Differentiators

1. **Composable Oracle Pipelines** — No other prediction market lets users choose/compose their resolution oracle
2. **CRE-Native** — Entire lifecycle orchestrated through CRE (creation → resolution → sync)
3. **8 Chainlink Services** — Deepest integration in the hackathon
4. **x402 Micropayments** — Anti-spam + revenue model via Chainlink payment protocol
5. **AI + Deterministic Hybrid** — Combine Chainlink Data Feeds with Gemini AI in Composite pipeline
6. **Cross-Chain Markets** — CCIP-powered market mirroring for multi-chain participation
7. **Full Stack** — Contracts + CRE + API + Frontend — not just a smart contract

## 10. Three-Project Ecosystem (Bonus Context)

OmniOracle is part of a larger 3-project architecture:

```
OmniOracle (THIS PROJECT) — Market creation + composable oracle resolution
        ↓
TruthMesh — BFT consensus verification layer (separate repo)
        ↓
AgentBet — AI agent trading interface (separate repo)
```

Each project stands alone but they can interoperate for a complete prediction market stack.

## 11. Demo Flow (for Video)

1. **Create Market** → User selects "Will ETH exceed $5000 by March 2026?" + Price Feed pipeline
2. **Configure Pipeline** → Set ETH/USD Data Feed address + threshold $5000 + direction: Above
3. **Pay & Submit** → x402 deducts $0.01 USDC → CRE validates → market created on-chain
4. **Trade** → Multiple users bet YES/NO with ETH
5. **Deadline Passes** → Anyone triggers resolution
6. **CRE Resolves** → oracle-resolver reads ETH/USD Data Feed → deterministic YES/NO
7. **Claim Winnings** → Winners get proportional payout minus 2% fee
8. **Cross-Chain** → Market mirrored to other chains via CCIP

## 12. Repository Structure

```
omnioracle/
├── contracts/                 # Foundry project
│   ├── src/                   # 5 Solidity contracts + 1 interface
│   ├── test/                  # 46 test cases (all passing)
│   └── script/                # Deployment script
├── cre-workflows/             # 3 CRE workflows (TypeScript)
│   ├── market-factory/        # HTTP + Cron triggers
│   ├── oracle-resolver/       # EVM Log trigger
│   └── cross-chain-sync/      # Cron → CCIP trigger
├── x402-server/               # Payment-gated API (Bun + Express)
├── frontend/                  # Next.js 16 + React 19 dashboard
├── README.md                  # Full documentation
└── PROJECT_OVERVIEW.md        # This file
```

## 13. Quick Start

```bash
# Smart Contracts
cd contracts && forge install && forge test -vv

# x402 Server
cd x402-server && bun install && bun run dev

# Frontend
cd frontend && npm install && npm run dev

# CRE Workflows (requires CRE CLI)
cd cre-workflows && cre workflow deploy market-factory
```

## 14. Team

- **[Your Name]** — Smart Contracts, CRE Workflows, Architecture
- **[Partner Name]** — [Role TBD]

## 15. Links

- **GitHub:** https://github.com/yt2025id-lab/omnioracle
- **Frontend:** https://omnioracle.vercel.app
- **Demo Video:** [to be recorded]
- **MarketFactory:** [`0xd3A85f742CFE6B802A45bCF17c9C07B5adeC02c2`](https://sepolia.basescan.org/address/0xd3A85f742CFE6B802A45bCF17c9C07B5adeC02c2)
- **OraclePipeline:** [`0x98BB79754e0475046B25CdCfbBdfd863f0e1D2F8`](https://sepolia.basescan.org/address/0x98BB79754e0475046B25CdCfbBdfd863f0e1D2F8)
- **OmniResolver:** [`0xc75168B64808d46Fa25f651E7c2026B49Ad0B555`](https://sepolia.basescan.org/address/0xc75168B64808d46Fa25f651E7c2026B49Ad0B555)
- **CRE Workflow:** [to be deployed/simulated]

---

*Built for Chainlink Convergence Hackathon 2026 — Prediction Markets Track*
