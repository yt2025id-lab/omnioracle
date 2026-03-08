<div align="center">

# OmniOracle

### Permissionless Prediction Markets with Composable Oracle Pipelines

[![Presentation](https://img.shields.io/badge/Presentation-Watch%20Now-FF0000?style=for-the-badge&logo=googledrive)](https://drive.google.com/file/d/1JsKHLS0hFp5cujgwy0rb2Vbkv-o_leAz/view?usp=sharing)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-omnioracle.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://omnioracle.vercel.app)
[![Built for Chainlink](https://img.shields.io/badge/Built%20for-Chainlink%20Convergence%20Hackathon-375BD2?style=for-the-badge&logo=chainlink)](https://chain.link/hackathon)
[![Network](https://img.shields.io/badge/Network-Base%20Sepolia-0052FF?style=for-the-badge&logo=coinbase)](https://sepolia.basescan.org)
[![Tests](https://img.shields.io/badge/Tests-52%20Passing-22c55e?style=for-the-badge&logo=foundry)](contracts/test)
[![License](https://img.shields.io/badge/License-MIT-gray?style=for-the-badge)](LICENSE)

**"Zapier for prediction market oracles"** — any user creates a market and selects the right Chainlink oracle pipeline for resolution. Powered by **8 Chainlink services** working in concert.

[Live Demo](https://omnioracle.vercel.app) · [Demo Video](submission/DEMO_VIDEO_SCRIPT.md) · [Pitch Deck](submission/PITCHDECK.md) · [Project Overview](submission/PROJECT_OVERVIEW.md) · [Submission](submission/SUBMISSION.md)

</div>

---

## The Problem

Every prediction market today uses the same oracle resolution mechanism for every market type — a one-size-fits-all approach that is inefficient, slow, and manipulable.

- **UMA** suffered a $7M manipulation attack (March 2025) and had to re-centralize by restricting proposals to 37 vetted addresses
- A crypto price market and a geopolitical event market go through the same slow dispute process, when they need fundamentally different data sources
- No protocol lets users compose resolution pipelines from modular oracle primitives

## The Solution

OmniOracle is a permissionless prediction market factory where every market has a **custom Chainlink oracle resolution pipeline**. Market creators choose from 5 composable pipeline types — from instant on-chain price feeds to AI-grounded verification with Gemini search — matched to their market's needs.

```
WHO BENEFITS
├── Traders     → bet on markets with cryptographically verifiable, manipulation-resistant resolution
├── Creators    → choose the right oracle pipeline for any market type (sports, crypto, politics, weather)
└── The Space   → oracle composability as an open primitive — not locked to one resolution system
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Next.js 16 Frontend                          │
│         Dashboard · Markets · Pipeline Builder · Portfolio        │
└───────────────────────────┬──────────────────────────────────────┘
                            │ wagmi v3 + viem v2
┌───────────────────────────▼──────────────────────────────────────┐
│                    x402 Express Server                           │
│        @x402/express v2.3 — USDC micropayment gating            │
│      POST /create-market ($0.01)  ·  POST /resolve ($0.005)      │
└──────────┬────────────────┬───────────────────┬──────────────────┘
           │                │                   │
    ┌──────▼──────┐  ┌──────▼──────┐  ┌─────────▼───────┐
    │   market-   │  │   oracle-   │  │  cross-chain-   │
    │   factory   │  │   resolver  │  │      sync       │
    │ CRE Workflow│  │ CRE Workflow│  │  CRE Workflow   │
    │ Cron + HTTP │  │  EVM Log    │  │     Cron        │
    │ + Gemini AI │  │ + Data Feeds│  │   + CCIP        │
    │             │  │ + Gemini AI │  │                 │
    └──────┬──────┘  └──────┬──────┘  └────────┬────────┘
           └────────────────┴──────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                  Smart Contracts — Base Sepolia                   │
├──────────────────────┬──────────────────────────────────────────┤
│  MarketFactory.sol   │  Create · Bet · Claim · Dispute · VRF    │
│  OraclePipeline.sol  │  Immutable pipeline config registry       │
│  OmniResolver.sol    │  Dynamic resolution via CRE callback      │
│  CrossChainRegistry  │  CCIP market mirroring across chains      │
│  AutoResolver.sol    │  Automation: auto-resolve on deadline     │
└──────────────────────┴──────────────────────────────────────────┘
```

---

## 8 Chainlink Services

| # | Service | Where | What it Does |
|---|---------|--------|--------------|
| 1 | **CRE (Chainlink Runtime Environment)** | 3 workflows | Core orchestration — market creation, dynamic oracle pipeline execution, cross-chain sync |
| 2 | **x402** | Express middleware | USDC micropayments gate the `/create-market` ($0.01) and `/request-resolution` ($0.005) API endpoints |
| 3 | **Data Feeds** | `oracle-resolver` CRE workflow | Price Feed pipeline: reads ETH/USD on-chain and checks against creator-set threshold |
| 4 | **Data Streams** | `oracle-resolver` CRE workflow | Sub-second real-time price data for time-critical markets |
| 5 | **Functions** | `OmniResolver.sol` | Custom JS execution via Chainlink DON for API-based markets (sports, weather) |
| 6 | **CCIP** | `CrossChainRegistry.sol` | `IRouterClient.ccipSend()` mirrors markets to any chain; `ccipReceive()` accepts incoming messages |
| 7 | **VRF v2.5** | `MarketFactory.sol` | `requestFeaturedMarket()` calls `IVRFCoordinatorV2Plus.requestRandomWords()`; `fulfillRandomWords()` callback selects winner |
| 8 | **Automation** | `AutoResolver.sol` | Triggers resolution automatically when market deadline expires |

### How CRE Unifies It All

The `oracle-resolver` CRE workflow is the central innovation. It listens for the `ResolutionRequested` EVM log event, reads the market's pipeline type from `OraclePipeline.sol`, and dynamically routes to the correct Chainlink service:

```
ResolutionRequested(marketId, pipelineType)  ←── on-chain EVM log
         │
         ▼  oracle-resolver CRE Workflow
  switch(pipelineType):
    PRICE_FEED   → Chainlink Data Feeds  → threshold check  → deterministic result
    DATA_STREAM  → Chainlink Data Streams → real-time price → deterministic result
    FUNCTIONS_API→ Chainlink Functions   → custom JS DON    → API result parsed
    AI_GROUNDED  → Gemini + search       → evidence + score → probabilistic result
    COMPOSITE    → Data Feeds + Gemini   → N-of-M agreement → consensus result
         │
         ▼
  onReport(bytes)  ───► MarketFactory.resolve(marketId, outcome, confidence)
```

---

## 5 Oracle Pipeline Types

| Pipeline | Best For | Resolution Source | Finality |
|----------|----------|-------------------|----------|
| **Price Feed** | Crypto price markets | Chainlink Data Feeds (on-chain) | Instant |
| **Data Stream** | High-frequency markets | Chainlink Data Streams (sub-second) | <1 second |
| **Functions API** | Sports, weather, any API | Custom JS via Chainlink DON | Minutes |
| **AI Grounded** | Politics, geopolitical events | Gemini AI + web search grounding | Minutes |
| **Composite** | High-stakes markets | N-of-M: Feeds + Gemini + Functions | Consensus |

---

## Smart Contracts

### MarketFactory.sol
```
createMarket(question, category, deadline, pipelineType, pipelineConfig)  payable  (min 0.01 ETH seed)
predict(marketId, isYes)                                                   payable  (min 0.001 ETH)
requestResolution(marketId)     → emits ResolutionRequested for CRE EVM Log trigger
onReport(bytes report)          → CRE Forwarder callback (0x00=create, 0x01=resolve)
claim(marketId)                 → proportional payout, 2% platform fee
disputeResolution(marketId)     payable  (0.05 ETH bond)

// Chainlink VRF v2.5
setVRFConfig(coordinator, subscriptionId, keyHash)  → configure VRF coordinator
requestFeaturedMarket(uint256[] candidates)          → calls IVRFCoordinatorV2Plus.requestRandomWords()
fulfillRandomWords(requestId, randomWords)           → VRF callback: selects featured market by randomWords[0] % len
```

### OraclePipeline.sol
```
setPipelineConfig(marketId, config)   → immutable after creation, factory-only
getPipelineConfig(marketId)           → read by CRE workflow for dynamic resolution
getPipelineType(marketId)             → quick pipeline type lookup
```

### OmniResolver.sol
```
requestResolution(marketId)           → emits ResolutionTriggered (CRE EVM Log trigger)
onReport(bytes)                       → receives pipeline results, forwards to MarketFactory
```

### CrossChainRegistry.sol — Chainlink CCIP
```
mirrorMarket(marketId, destChainSelector, destReceiver)  payable
  → encodes market metadata, calls IRouterClient.ccipSend() with native fee payment
  → emits MarketMirrored(marketId, destChainSelector, ccipMessageId)

ccipReceive(Client.Any2EVMMessage calldata message)
  → implements IAny2EVMMessageReceiver, only callable by ccipRouter
  → decodes payload, stores incoming market, replay-protection via messageId map
  → emits CrossChainMarketReceived(marketId, sourceChainSelector, messageId)

estimateFee(marketId, destChainSelector, destReceiver) → uint256
  → calls IRouterClient.getFee() so callers can prefund before mirroring
```

### AutoResolver.sol — Chainlink Automation Compatible
```
checkUpkeep(bytes) → (bool upkeepNeeded, bytes performData)
performUpkeep(bytes performData)
→ scans for expired markets, auto-triggers resolution without manual intervention
```

---

## CRE Workflows

### `oracle-resolver` — The Core Innovation

**Trigger:** EVM Log — `ResolutionRequested(uint256 marketId, uint8 pipelineType)`

The workflow reads the pipeline config from `OraclePipeline.sol`, executes the appropriate Chainlink service, and calls back `onReport()` with the resolution result. This is what makes OmniOracle composable — the resolution logic lives off-chain in a CRE workflow, not locked in a single on-chain function.

**Key file:** [`cre-workflows/oracle-resolver/logCallback.ts`](cre-workflows/oracle-resolver/logCallback.ts) (263 lines)

### `market-factory` — Creation + AI Generation

**Trigger:** HTTP (from x402 server) + Cron (every 6h)

- HTTP path: receives market config from paid API endpoint → Gemini validates question quality → creates market on-chain with appropriate pipeline
- Cron path: Gemini generates trending market ideas with suggested pipeline types, auto-deploys to contract

### `cross-chain-sync` — CCIP Bridge

**Trigger:** Cron (every 4h)

Reads active markets, packages metadata, and syncs to configured chains via CCIP. Enables bettors on Ethereum, Arbitrum, or Avalanche to participate in markets created on Base.

---

## Deployed Contracts (Base Sepolia)

| Contract | Address | Explorer |
|----------|---------|----------|
| **MarketFactory** | `0xd3A85f742CFE6B802A45bCF17c9C07B5adeC02c2` | [basescan.org](https://sepolia.basescan.org/address/0xd3A85f742CFE6B802A45bCF17c9C07B5adeC02c2) |
| **OraclePipeline** | `0x98BB79754e0475046B25CdCfbBdfd863f0e1D2F8` | [basescan.org](https://sepolia.basescan.org/address/0x98BB79754e0475046B25CdCfbBdfd863f0e1D2F8) |
| **OmniResolver** | `0xc75168B64808d46Fa25f651E7c2026B49Ad0B555` | [basescan.org](https://sepolia.basescan.org/address/0xc75168B64808d46Fa25f651E7c2026B49Ad0B555) |
| **CrossChainRegistry** | `0xE0A70aaE7FceDfE9479Ac2C298364b830152b693` | [basescan.org](https://sepolia.basescan.org/address/0xE0A70aaE7FceDfE9479Ac2C298364b830152b693) |
| **AutoResolver** | `0x35b872462CeE8fcBAa5dC26fF1eD412f0938FE00` | [basescan.org](https://sepolia.basescan.org/address/0x35b872462CeE8fcBAa5dC26fF1eD412f0938FE00) |

### Chainlink Infrastructure (Base Sepolia)

| Resource | Address |
|----------|---------|
| CRE Forwarder | `0x82300bd7c3958625581cc2F77bC6464dcEcDF3e5` |
| USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| LINK | `0xE4aB69C077896252FAFBD49EFD26B5D171A32410` |
| CCIP Router | `0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93` |

---

## Test Suite

```bash
cd contracts && forge test -vv
```

```
Running 52 tests across 2 contracts:
  MarketFactory.t.sol  [30 tests]  ..............................  PASS
  OmniResolver.t.sol   [22 tests]  ......................          PASS

Test result: ok. 52 passed; 0 failed; finished in 150.82ms
```

---

## Project Structure

```
omnioracle/
├── contracts/                      # Foundry — Solidity 0.8.24
│   ├── src/
│   │   ├── MarketFactory.sol       # Core: markets, bets, claims, VRF, CRE callback
│   │   ├── OraclePipeline.sol      # Immutable pipeline config registry
│   │   ├── OmniResolver.sol        # CRE resolution entry point
│   │   ├── CrossChainRegistry.sol  # CCIP cross-chain market mirroring
│   │   ├── AutoResolver.sol        # Chainlink Automation compatible
│   │   └── interfaces/
│   ├── test/
│   │   ├── MarketFactory.t.sol     # 30 tests
│   │   └── OmniResolver.t.sol      # 16 tests
│   └── script/Deploy.s.sol
│
├── cre-workflows/                  # Chainlink Runtime Environment
│   ├── project.yaml                # Workflow config & triggers
│   ├── market-factory/             # HTTP + Cron: create markets with AI validation
│   ├── oracle-resolver/            # EVM Log: dynamic pipeline execution (core)
│   │   └── logCallback.ts          # 263-line pipeline router
│   └── cross-chain-sync/           # Cron: CCIP market data bridge
│
├── x402-server/                    # Payment-gated API
│   └── src/
│       ├── server.ts               # @x402/express v2.3 middleware
│       └── x402Client.ts
│
├── frontend/                       # Next.js 16 app
│   ├── public/
│   │   └── logo_omnioracle.png     # Brand logo
│   └── src/
│       ├── app/
│       │   ├── globals.css         # Design system: Space Grotesk, CSS vars, dark/light
│       │   ├── layout.tsx          # Root layout with Providers + ThemeToggle
│       │   ├── page.tsx            # Dashboard: marquee, bento grid, how-it-works
│       │   ├── markets/            # Market list + pipeline filters
│       │   ├── markets/[id]/       # Market detail + betting UI
│       │   ├── create/             # Pipeline builder: 5 types, full config
│       │   ├── portfolio/          # User positions + claim
│       │   └── explorer/           # Cross-chain explorer (CCIP)
│       ├── components/
│       │   ├── ConnectWallet.tsx   # Dropdown wallet connector (wagmi native)
│       │   ├── Navbar.tsx          # Navigation + theme toggle
│       │   └── ThemeToggle.tsx     # Dark / light mode switcher
│       └── lib/
│           ├── wagmi.ts            # wagmi v3 + viem v2 config (Base Sepolia)
│           └── contracts.ts        # ABIs: MarketFactory, CrossChainRegistry,
│                                   # AutoResolver + CCIP_CHAIN_SELECTORS
│
├── submission/                     # Hackathon deliverables
│   ├── SUBMISSION.md               # Judge-facing index
│   ├── DEMO_LIVE.html              # Standalone animated demo (no server needed)
│   ├── DEMO_VIDEO_SCRIPT.md        # 4:30 voiceover script
│   ├── PITCHDECK.md                # 11-slide pitch deck
│   └── PROJECT_OVERVIEW.md         # 1-page partner overview
└── deploy.sh                       # One-click deployment script
```

---

## Chainlink Integration Index

> Direct links to every Chainlink integration — for hackathon judges.

| File | Chainlink Service | Integration Detail |
|------|------------------|--------------------|
| [contracts/src/MarketFactory.sol](contracts/src/MarketFactory.sol) | CRE, VRF | `onReport()` CRE Forwarder callback; `requestRandomWords()` VRF v2.5 for featured market |
| [contracts/src/OmniResolver.sol](contracts/src/OmniResolver.sol) | CRE | `onReport()` resolution callback; emits `ResolutionTriggered` EVM Log for CRE trigger |
| [contracts/src/OraclePipeline.sol](contracts/src/OraclePipeline.sol) | Data Feeds, Data Streams | Stores feed addresses, thresholds, and stream IDs per market |
| [contracts/src/CrossChainRegistry.sol](contracts/src/CrossChainRegistry.sol) | CCIP | `IRouterClient.ccipSend()` for cross-chain market mirroring |
| [contracts/src/AutoResolver.sol](contracts/src/AutoResolver.sol) | Automation | `checkUpkeep()` / `performUpkeep()` for deadline-triggered resolution |
| [cre-workflows/oracle-resolver/logCallback.ts](cre-workflows/oracle-resolver/logCallback.ts) | CRE, Data Feeds, Data Streams, Functions | Dynamic pipeline router — all 5 pipeline types in one file |
| [cre-workflows/market-factory/](cre-workflows/market-factory/) | CRE | HTTP + Cron workflow for AI-validated market creation |
| [cre-workflows/cross-chain-sync/](cre-workflows/cross-chain-sync/) | CRE, CCIP | Cron workflow for periodic CCIP sync |
| [cre-workflows/project.yaml](cre-workflows/project.yaml) | CRE | Workflow definitions, trigger configs, job specs |
| [x402-server/src/server.ts](x402-server/src/server.ts) | x402 | `paymentMiddleware()` with `ExactEvmScheme` — USDC micropayment gating |

---

## Quick Start

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Bun](https://bun.sh/) >= 1.2.21
- Base Sepolia ETH ([faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))
- [Gemini API key](https://aistudio.google.com/apikey)

### 1. Clone & Configure

```bash
git clone https://github.com/Ozan-OnChain/omnioracle
cd omnioracle
cp .env.example .env
# Fill in PRIVATE_KEY, BASE_SEPOLIA_RPC_URL, GEMINI_API_KEY
```

### 2. Deploy Contracts

```bash
cd contracts
forge install
forge test -vv           # all 46 tests must pass
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast --verify
```

Or use the one-click script:

```bash
chmod +x deploy.sh && ./deploy.sh
# Deploys all 5 contracts and auto-updates .env + frontend/.env.local
```

### 3. CRE Workflows

```bash
cd cre-workflows
bun install

# Simulate oracle resolver (see dynamic pipeline routing in action)
cre workflow simulate oracle-resolver

# Deploy all 3 workflows
cre workflow deploy market-factory
cre workflow deploy oracle-resolver
cre workflow deploy cross-chain-sync
```

### 4. x402 Payment Server

```bash
cd x402-server
bun install
bun run dev    # port 3003
```

**API Endpoints:**

| Method | Path | Cost | Description |
|--------|------|------|-------------|
| `POST` | `/api/create-market` | $0.01 USDC | Create market with pipeline config |
| `POST` | `/api/request-resolution` | $0.005 USDC | Trigger oracle resolution |
| `GET` | `/api/markets` | Free | List all markets |
| `GET` | `/api/markets/:id` | Free | Market detail + pipeline config |
| `GET` | `/api/portfolio/:address` | Free | User positions |
| `GET` | `/api/pipelines` | Free | Available pipeline types |
| `GET` | `/api/stats` | Free | Platform stats |

### 5. Frontend

```bash
cd frontend
npm install
npm run dev    # port 3000
```

Open [http://localhost:3000](http://localhost:3000)

---

## End-to-End Demo Flow

1. **Connect Wallet** — MetaMask, Coinbase Wallet, or any injected wallet
2. **Create Market** — "Will ETH > $5,000 by April?" → select `PRICE_FEED` pipeline → set ETH/USD feed + threshold
3. **Pay via x402** — $0.01 USDC micropayment via Chainlink x402 creates the market on-chain
4. **Bet** — users predict YES or NO with ETH; live pool updates show odds
5. **Auto-Resolution** — deadline hits → Chainlink Automation triggers `performUpkeep()` → CRE `oracle-resolver` workflow fires
6. **Pipeline Executes** — Data Feed query → price vs threshold → deterministic YES/NO result → `onReport()` callback
7. **Claim** — winners claim proportional share of pool minus 2% platform fee
8. **Cross-Chain** — market state mirrored to other chains via CCIP

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Chain | Base Sepolia (84532) |
| Smart Contracts | Foundry, Solidity 0.8.24, OpenZeppelin v5 |
| Oracle Orchestration | Chainlink CRE (`@chainlink/cre-sdk`) |
| Micropayments | Chainlink x402 (`@x402/express` v2.3) |
| AI Resolution | Google Gemini (search-grounded) |
| Frontend | Next.js 16, Tailwind CSS 4, Space Grotesk, wagmi v3, viem v2, dark/light theme |
| Runtime | Bun 1.2.21+ |

---

## Three-Project Vision

OmniOracle is the first layer of a composable prediction market stack:

```
OmniOracle   — oracle pipeline composability  ← this project
TruthMesh    — BFT consensus verification layer (next)
AgentBet     — AI agents that trade autonomously (next)
```

---

<div align="center">

Built with Chainlink CRE · Data Feeds · Data Streams · Functions · CCIP · VRF · Automation · x402

**[omnioracle.vercel.app](https://omnioracle.vercel.app)**

</div>
