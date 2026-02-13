# OmniOracle - Permissionless Prediction Market Factory with Composable Oracle Pipelines

> "Zapier for prediction market oracles" — anyone creates a market and picks the right oracle pipeline for resolution. Powered by **8 Chainlink services** on Base Sepolia.

Built for the [Chainlink Convergence Hackathon](https://chain.link/hackathon) (Feb 6 - Mar 1, 2026) — Prediction Markets Track.

**Live Demo:** [omnioracle.vercel.app](https://omnioracle.vercel.app)

---

## Problem

Current prediction markets use one-size-fits-all oracle resolution. A crypto price market and a geopolitical market go through the same dispute-based process, when they need fundamentally different data pipelines. UMA suffered a $7M manipulation attack (March 2025) and had to restrict proposals to 37 vetted addresses — partially re-centralizing.

## Solution

OmniOracle lets anyone create a prediction market with a **custom oracle resolution pipeline** composed from modular Chainlink data sources. Market creators choose the right combination of Data Feeds, Data Streams, Functions, and AI verification for their specific market type.

### 5 Pipeline Types

| Pipeline | Use Case | Resolution Method |
|----------|----------|-------------------|
| **Price Feed** | Crypto price markets | Chainlink Data Feeds threshold check |
| **Data Stream** | Time-sensitive prices | Real-time sub-second price comparison |
| **Functions API** | Sports, weather, APIs | Custom JS execution via Chainlink DON |
| **AI Grounded** | Politics, geopolitics | Gemini AI with search grounding |
| **Composite** | High-value markets | N-of-M agreement across multiple sources |

### Three-Project Stack

```
┌─────────────────────────────────────────────┐
│  OmniOracle  — MARKET CREATION LAYER        │  ← Anyone creates markets + oracle pipelines
├─────────────────────────────────────────────┤
│  TruthMesh   — VERIFICATION LAYER           │  ← BFT consensus for resolution
├─────────────────────────────────────────────┤
│  AgentBet    — TRADING LAYER                │  ← AI agents trade on markets
└─────────────────────────────────────────────┘
```

---

## Architecture

```
                    ┌──────────────────────────────────────┐
                    │         Next.js Frontend              │
                    │ Dashboard · Markets · Create · Explorer│
                    └────────────┬─────────────────────────┘
                                 │ wagmi + viem
                    ┌────────────▼─────────────────────────┐
                    │      x402 Express Server              │
                    │   Payment-gated API (USDC micropay)   │
                    └────────────┬─────────────────────────┘
                                 │ HTTP triggers
           ┌─────────────────────┼─────────────────────────┐
           ▼                     ▼                         ▼
   ┌───────────────┐   ┌─────────────────┐   ┌──────────────────┐
   │ market-factory │   │ oracle-resolver │   │cross-chain-sync  │
   │  CRE Workflow  │   │  CRE Workflow   │   │  CRE Workflow    │
   │ Cron + HTTP    │   │ EVM Log trigger │   │  Cron trigger    │
   │ + Gemini AI    │   │ + Data Feeds    │   │  + CCIP sync     │
   │                │   │ + Gemini AI     │   │                  │
   └───────┬───────┘   └───────┬─────────┘   └────────┬─────────┘
           │                   │                       │
           └───────────────────┼───────────────────────┘
                               ▼
                    ┌──────────────────────────┐
                    │    Smart Contracts        │
                    │  Base Sepolia (84532)     │
                    ├──────────────────────────┤
                    │ MarketFactory.sol         │
                    │ OraclePipeline.sol        │
                    │ OmniResolver.sol          │
                    │ CrossChainRegistry.sol    │
                    │ AutoResolver.sol          │
                    └──────────────────────────┘
```

## 8 Chainlink Services

| # | Service | Integration | Description |
|---|---------|-------------|-------------|
| 1 | **CRE** | 3 workflows | Core orchestration — market creation, dynamic oracle resolution, cross-chain sync |
| 2 | **x402** | Express middleware | Pay USDC micropayments to create markets + configure pipelines |
| 3 | **Data Feeds** | oracle-resolver | Pipeline module: resolve crypto price markets via ETH/USD threshold |
| 4 | **Data Streams** | oracle-resolver | Pipeline module: sub-second prices for time-sensitive markets |
| 5 | **Functions** | OmniResolver.sol | Pipeline module: custom JS execution for API-based resolution |
| 6 | **CCIP** | CrossChainRegistry.sol | Mirror markets across chains, accept cross-chain bets |
| 7 | **VRF v2.5** | MarketFactory.sol | Featured market selection + tiebreaker randomness |
| 8 | **Automation** | AutoResolver.sol | Auto-trigger resolution when market deadline expires |

## Project Structure

```
omnioracle/
├── contracts/           # Foundry — Solidity 0.8.24
│   ├── src/
│   │   ├── MarketFactory.sol          # Core: market creation, betting, claims
│   │   ├── OraclePipeline.sol         # Pipeline config registry (immutable)
│   │   ├── OmniResolver.sol           # Dynamic resolution via CRE
│   │   ├── CrossChainRegistry.sol     # CCIP market mirroring
│   │   ├── AutoResolver.sol           # Automation: auto-resolve on deadline
│   │   └── interfaces/IMarketFactory.sol
│   ├── test/
│   │   ├── MarketFactory.t.sol        # 30 tests
│   │   └── OmniResolver.t.sol         # 16 tests
│   └── script/Deploy.s.sol
├── cre-workflows/
│   ├── market-factory/                # Cron + HTTP → create markets with pipeline
│   ├── oracle-resolver/               # EVM Log → execute dynamic pipeline
│   └── cross-chain-sync/             # Cron → CCIP market data sync
├── x402-server/
│   └── src/
│       ├── server.ts                  # Payment-gated + free endpoints (port 3003)
│       └── x402Client.ts
├── frontend/
│   └── src/app/
│       ├── page.tsx                   # Dashboard
│       ├── markets/page.tsx           # Market list + pipeline filters
│       ├── markets/[id]/page.tsx      # Market detail + pipeline visualization
│       ├── create/page.tsx            # Pipeline builder (the unique page)
│       ├── portfolio/page.tsx         # User's positions
│       └── explorer/page.tsx          # Cross-chain explorer
└── README.md
```

---

## Quick Start

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Bun](https://bun.sh/) >= 1.2.21
- [Node.js](https://nodejs.org/) >= 18
- Base Sepolia ETH
- [Gemini API key](https://aistudio.google.com/apikey)

### 1. Clone & Setup

```bash
git clone <repo-url> omnioracle
cd omnioracle
cp .env.example .env
```

### 2. Smart Contracts

```bash
cd contracts
forge install
forge test -vv
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast --verify
```

### 3. CRE Workflows

```bash
cd cre-workflows
cd market-factory && bun install && cd ..
cd oracle-resolver && bun install && cd ..
cd cross-chain-sync && bun install && cd ..

# Simulate the dynamic oracle resolver
cre workflow simulate oracle-resolver --broadcast
cre workflow deploy oracle-resolver

# Deploy market factory
cre workflow deploy market-factory
```

### 4. x402 Server

```bash
cd x402-server
bun install
bun run dev    # starts on port 3003
```

**Endpoints:**

| Method | Path | Cost | Description |
|--------|------|------|-------------|
| POST | `/api/create-market` | $0.01 USDC | Create market with pipeline config |
| POST | `/api/request-resolution` | $0.005 USDC | Trigger oracle resolution |
| GET | `/api/markets` | Free | List all markets with pipeline types |
| GET | `/api/markets/:id` | Free | Market detail + pipeline config |
| GET | `/api/portfolio/:address` | Free | User's positions |
| GET | `/api/pipelines` | Free | Available pipeline types |
| GET | `/api/stats` | Free | Platform stats |
| GET | `/api/health` | Free | Health check |

### 5. Frontend

```bash
cd frontend
npm install
npm run dev    # starts on port 3000
```

---

## Smart Contracts

### MarketFactory.sol
- `createMarket(question, category, deadline, pipelineType, pipelineConfig)` payable — min 0.01 ETH seed
- `predict(marketId, isYes)` payable — YES/NO bet, min 0.001 ETH
- `requestResolution(marketId)` — emits `ResolutionRequested` for CRE
- `onReport(bytes report)` — CRE Forwarder callback (0x00=create, 0x01=resolve)
- `claim(marketId)` — proportional payout with 2% platform fee
- `disputeResolution(marketId)` payable — 0.05 ETH dispute bond
- `setFeaturedMarket(marketId)` — VRF-powered featured selection

### OraclePipeline.sol
- `setPipelineConfig(marketId, config)` — immutable after creation, factory-only
- `getPipelineConfig(marketId)` — read by CRE workflow for dynamic resolution
- `getPipelineType(marketId)` — quick lookup

### OmniResolver.sol
- `requestResolution(marketId)` — emits `ResolutionTriggered` for CRE EVM Log trigger
- `onReport(bytes)` — receives pipeline results, forwards to MarketFactory

### CrossChainRegistry.sol
- `mirrorMarket(marketId, destChainSelector)` — send market metadata via CCIP
- `receiveCrossChainMarket(...)` — accept cross-chain market data

### AutoResolver.sol
- `checkUpkeep()` / `performUpkeep()` — Chainlink Automation compatible
- Scans for expired markets and auto-triggers resolution

---

## CRE Workflows

### oracle-resolver — The Core Innovation

Triggered by `ResolutionRequested(uint256 marketId, uint8 pipelineType)` EVM log event. Dynamically selects the resolution strategy based on the market's pipeline type:

```
switch (pipelineType) {
  PRICE_FEED   → Read Chainlink Data Feed → compare to threshold → deterministic
  DATA_STREAM  → Read real-time price → same threshold check → deterministic
  FUNCTIONS_API → Gemini as Functions proxy → parse API result → determine outcome
  AI_GROUNDED  → Gemini with search grounding → outcome + confidence + evidence
  COMPOSITE    → Data Feeds + Gemini + Functions → N-of-M agreement check
}
```

### market-factory (Cron + HTTP)
- **HTTP**: receives market config from x402 → Gemini validates question → creates on-chain
- **Cron** (every 6h): Gemini generates trending market ideas with appropriate pipeline types

### cross-chain-sync (Cron)
- Every 4h: reads active markets → packages metadata → syncs via CCIP

---

## Deployed Contracts (Base Sepolia)

| Contract | Address | Explorer |
|----------|---------|----------|
| **MarketFactory** | `0xd3A85f742CFE6B802A45bCF17c9C07B5adeC02c2` | [View](https://sepolia.basescan.org/address/0xd3A85f742CFE6B802A45bCF17c9C07B5adeC02c2) |
| **OraclePipeline** | `0x98BB79754e0475046B25CdCfbBdfd863f0e1D2F8` | [View](https://sepolia.basescan.org/address/0x98BB79754e0475046B25CdCfbBdfd863f0e1D2F8) |
| **OmniResolver** | `0xc75168B64808d46Fa25f651E7c2026B49Ad0B555` | [View](https://sepolia.basescan.org/address/0xc75168B64808d46Fa25f651E7c2026B49Ad0B555) |
| **CrossChainRegistry** | `0xE0A70aaE7FceDfE9479Ac2C298364b830152b693` | [View](https://sepolia.basescan.org/address/0xE0A70aaE7FceDfE9479Ac2C298364b830152b693) |
| **AutoResolver** | `0x35b872462CeE8fcBAa5dC26fF1eD412f0938FE00` | [View](https://sepolia.basescan.org/address/0x35b872462CeE8fcBAa5dC26fF1eD412f0938FE00) |

### Chainlink Infrastructure

| Contract | Address |
|----------|---------|
| CRE Forwarder | `0x82300bd7c3958625581cc2F77bC6464dcEcDF3e5` |
| USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| LINK | `0xE4aB69C077896252FAFBD49EFD26B5D171A32410` |
| CCIP Router | `0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93` |

## Demo Flow

1. **Create Market** — choose question, category, and pipeline type (e.g., "ETH > $5000 by March?" with PRICE_FEED pipeline)
2. **Configure Pipeline** — set Data Feed address, price threshold, direction (above/below)
3. **Pay via x402** — $0.01 USDC micropayment creates the market on-chain
4. **Trade** — users bet YES/NO with ETH, pool sizes update live
5. **Resolution** — deadline passes → Automation triggers → oracle-resolver runs the configured pipeline
6. **Dynamic Execution** — PRICE_FEED reads Data Feeds, AI_GROUNDED asks Gemini, COMPOSITE checks N-of-M agreement
7. **Resolve + Claim** — market resolves with confidence score, winners claim proportional payout
8. **Cross-Chain** — markets mirrored to other chains via CCIP

## Tech Stack

- **Chain**: Base Sepolia (84532)
- **Contracts**: Foundry, Solidity 0.8.24, OpenZeppelin v5
- **CRE**: @chainlink/cre-sdk (TypeScript -> WASM)
- **AI**: Google Gemini (search grounding)
- **x402**: @x402/express v2.3 + @x402/evm + @x402/core
- **Frontend**: Next.js 16, Tailwind CSS 4, wagmi v3, viem v2, RainbowKit
- **Runtime**: Bun 1.2.21+

## Chainlink-Related Files

> Required by hackathon submission — direct links to all Chainlink integration code.

| File | Chainlink Service | Description |
|------|------------------|-------------|
| [`contracts/src/MarketFactory.sol`](contracts/src/MarketFactory.sol) | CRE, VRF | CRE Forwarder callback `onReport()`, VRF featured market |
| [`contracts/src/OmniResolver.sol`](contracts/src/OmniResolver.sol) | CRE | CRE resolution callback, EVM Log trigger |
| [`contracts/src/OraclePipeline.sol`](contracts/src/OraclePipeline.sol) | Data Feeds, Data Streams | Pipeline config (feed address, thresholds) |
| [`contracts/src/CrossChainRegistry.sol`](contracts/src/CrossChainRegistry.sol) | CCIP | Market mirroring via CCIP |
| [`contracts/src/AutoResolver.sol`](contracts/src/AutoResolver.sol) | Automation | checkUpkeep/performUpkeep for auto-resolution |
| [`cre-workflows/market-factory/`](cre-workflows/market-factory/) | CRE | HTTP + Cron workflow for market creation |
| [`cre-workflows/oracle-resolver/`](cre-workflows/oracle-resolver/) | CRE, Data Feeds | EVM Log workflow for dynamic pipeline resolution |
| [`cre-workflows/oracle-resolver/logCallback.ts`](cre-workflows/oracle-resolver/logCallback.ts) | Data Feeds, Functions | Core: dynamic pipeline routing (263 lines) |
| [`cre-workflows/cross-chain-sync/`](cre-workflows/cross-chain-sync/) | CRE, CCIP | Cron workflow for cross-chain market sync |
| [`x402-server/src/server.ts`](x402-server/src/server.ts) | x402 | Payment-gated API with @x402/express middleware |
| [`cre-workflows/project.yaml`](cre-workflows/project.yaml) | CRE | Workflow configuration & triggers |

## License

MIT
