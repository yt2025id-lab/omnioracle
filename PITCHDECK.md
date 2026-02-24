# OmniOracle — Pitch Deck
### Chainlink Convergence Hackathon 2026 | Prediction Markets Track

---

## SLIDE 1 — Title

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                      O M N I O R A C L E                     ║
║                                                              ║
║          "Zapier for Prediction Market Oracles"              ║
║                                                              ║
║   Permissionless Market Factory × Composable Oracle Pipes    ║
║                                                              ║
║   ─────────────────────────────────────────────────────────  ║
║                                                              ║
║   8 Chainlink Services  ·  3 CRE Workflows  ·  5 Pipelines  ║
║                                                              ║
║   Live: omnioracle.vercel.app                                ║
║   Chain: Base Sepolia                                        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Talking Points:**
- One-liner: "OmniOracle lets anyone create a prediction market and compose the right oracle pipeline for resolution — all orchestrated by Chainlink CRE."
- This is not another Polymarket clone. This is infrastructure for how prediction markets *should* resolve.

---

## SLIDE 2 — The Problem

```
╔══════════════════════════════════════════════════════════════╗
║                     THE ORACLE PROBLEM                       ║
║                                                              ║
║  Today's prediction markets use ONE oracle for EVERYTHING:   ║
║                                                              ║
║  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐  ║
║  │ "ETH > $5K?" │     │ "Who wins    │     │ "Rain in    │  ║
║  │              │     │  the Super   │     │  Jakarta    │  ║
║  │  PRICE DATA  │     │  Bowl?"      │     │  tomorrow?" │  ║
║  │  (on-chain)  │     │  SPORTS API  │     │  WEATHER    │  ║
║  └──────┬───────┘     └──────┬───────┘     └──────┬──────┘  ║
║         │                    │                    │          ║
║         ▼                    ▼                    ▼          ║
║  ┌──────────────────────────────────────────────────────┐    ║
║  │           SAME dispute-based oracle (UMA)            │    ║
║  │           Human voters decide everything             │    ║
║  │                                                      │    ║
║  │    $7M MANIPULATION ATTACK (March 2025)              │    ║
║  │    → Restricted to 37 vetted proposers               │    ║
║  │    → Re-centralized the "decentralized" oracle       │    ║
║  └──────────────────────────────────────────────────────┘    ║
║                                                              ║
║  Why use human voters for ETH price when Chainlink           ║
║  Data Feeds already have the answer on-chain?                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Talking Points:**
- Polymarket uses UMA's optimistic oracle for everything
- A crypto price market and a geopolitical event go through the same slow dispute process
- UMA got hacked for $7M — had to restrict who can propose, partially re-centralizing
- Fundamental insight: **different questions need different data sources**

---

## SLIDE 3 — The Solution

```
╔══════════════════════════════════════════════════════════════╗
║                     OMNIORACLE SOLUTION                      ║
║                                                              ║
║  Anyone creates a market + PICKS their oracle pipeline:      ║
║                                                              ║
║  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐  ║
║  │ "ETH > $5K?" │     │ "Who wins    │     │ "Rain in    │  ║
║  │              │     │  election?"  │     │  Jakarta?"  │  ║
║  └──────┬───────┘     └──────┬───────┘     └──────┬──────┘  ║
║         │                    │                    │          ║
║         ▼                    ▼                    ▼          ║
║  ┌────────────┐     ┌──────────────┐     ┌──────────────┐   ║
║  │ PRICE FEED │     │ AI GROUNDED  │     │  COMPOSITE   │   ║
║  │ Chainlink  │     │ Gemini +     │     │  2-of-3      │   ║
║  │ Data Feed  │     │ Search       │     │  agreement   │   ║
║  │ ETH/USD    │     │ Grounding    │     │  across      │   ║
║  │            │     │              │     │  sources     │   ║
║  │ 100%       │     │ 60-90%       │     │  75-100%     │   ║
║  │ confidence │     │ confidence   │     │  confidence  │   ║
║  └────────────┘     └──────────────┘     └──────────────┘   ║
║                                                              ║
║         RIGHT tool for the RIGHT question                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Talking Points:**
- Market creators choose from 5 pipeline types at creation time
- Each pipeline is optimized for its data type
- Crypto prices? 100% deterministic via Chainlink Data Feeds
- World events? AI with search grounding provides confidence scores
- High stakes? Composite pipeline requires N-of-M source agreement
- This is "Zapier for oracles" — composable, modular, right-tool-for-the-job

---

## SLIDE 4 — 5 Pipeline Types (The Core Innovation)

```
╔══════════════════════════════════════════════════════════════╗
║              5 COMPOSABLE ORACLE PIPELINES                   ║
║                                                              ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ 0. PRICE FEED        Chainlink Data Feeds               │ ║
║  │    "ETH > $5000?"    → Read ETH/USD → Compare → YES/NO │ ║
║  │    Confidence: 100%  (deterministic, on-chain)          │ ║
║  ├─────────────────────────────────────────────────────────┤ ║
║  │ 1. DATA STREAM       Chainlink Data Streams             │ ║
║  │    Sub-second prices → Real-time price resolution       │ ║
║  │    Confidence: 100%  (deterministic, sub-second)        │ ║
║  ├─────────────────────────────────────────────────────────┤ ║
║  │ 2. FUNCTIONS API     Chainlink Functions                │ ║
║  │    Custom JS code    → Call any API → Parse result      │ ║
║  │    Confidence: 60-95% (depends on API reliability)      │ ║
║  ├─────────────────────────────────────────────────────────┤ ║
║  │ 3. AI GROUNDED       Gemini + Google Search Grounding   │ ║
║  │    "Who won the election?" → AI + live sources → result │ ║
║  │    Confidence: 60-90% (probabilistic, evidence-backed)  │ ║
║  ├─────────────────────────────────────────────────────────┤ ║
║  │ 4. COMPOSITE         N-of-M Multi-Source Agreement      │ ║
║  │    Combines: Data Feed + AI + Functions                 │ ║
║  │    Requires 2-of-3 agreement → High confidence result   │ ║
║  │    Confidence: 75-100% (consensus-based)                │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  Pipeline config is IMMUTABLE — set once at market creation, ║
║  stored in OraclePipeline.sol, executed by CRE at deadline.  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Talking Points:**
- No other prediction market platform offers this
- Pipeline configuration is immutable — you can't change the rules after bets are placed
- CRE dynamically routes to the correct pipeline at resolution time
- Composite is the most powerful — combines multiple Chainlink services for consensus

---

## SLIDE 5 — Architecture

```
╔══════════════════════════════════════════════════════════════╗
║                     FULL ARCHITECTURE                        ║
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │              FRONTEND (Next.js 16)                     │  ║
║  │   Dashboard · Markets · Pipeline Builder · Explorer    │  ║
║  │              omnioracle.vercel.app                     │  ║
║  └───────────────────────┬────────────────────────────────┘  ║
║                          │                                   ║
║  ┌───────────────────────▼────────────────────────────────┐  ║
║  │           x402 SERVER (Bun + Express)                  │  ║
║  │   $0.01 to create market · $0.005 to resolve          │  ║
║  │   @x402/express v2.3 middleware (real payments!)       │  ║
║  └───────────────────────┬────────────────────────────────┘  ║
║                          │                                   ║
║  ┌───────────┬───────────┼───────────┬────────────────────┐  ║
║  │           │           │           │     CRE LAYER      │  ║
║  │  ┌────────▼─────┐ ┌──▼────────┐ ┌▼──────────────┐     │  ║
║  │  │market-factory│ │oracle-    │ │cross-chain-   │     │  ║
║  │  │             │ │resolver   │ │sync           │     │  ║
║  │  │HTTP + Cron  │ │EVM Log    │ │Cron → CCIP    │     │  ║
║  │  │+ Gemini AI  │ │+ Dynamic  │ │+ Mirror       │     │  ║
║  │  │             │ │  Pipeline │ │               │     │  ║
║  │  └──────┬──────┘ └────┬──────┘ └──────┬────────┘     │  ║
║  └─────────┼─────────────┼───────────────┼──────────────┘   ║
║            │             │               │                   ║
║  ┌─────────▼─────────────▼───────────────▼──────────────┐   ║
║  │              SMART CONTRACTS (Base Sepolia)           │   ║
║  │  MarketFactory · OraclePipeline · OmniResolver       │   ║
║  │  CrossChainRegistry · AutoResolver                   │   ║
║  │  All deployed & verified on-chain                    │   ║
║  └──────────────────────────────────────────────────────┘   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Talking Points:**
- Full stack: Contracts → CRE → API → Frontend
- CRE is the brain — orchestrates the entire market lifecycle
- x402 handles micropayments — anti-spam + revenue model
- Everything is deployed and working on Base Sepolia

---

## SLIDE 6 — 8 Chainlink Services

```
╔══════════════════════════════════════════════════════════════╗
║              8 CHAINLINK SERVICES INTEGRATED                 ║
║                                                              ║
║  ┌──────────────────────────────────────────────────────┐    ║
║  │                                                      │    ║
║  │  1. CRE              Core orchestration engine       │    ║
║  │     3 workflows · 4 triggers · lifecycle mgmt        │    ║
║  │                                                      │    ║
║  │  2. x402             Payment-gated API               │    ║
║  │     @x402/express middleware · USDC micropayments     │    ║
║  │                                                      │    ║
║  │  3. Data Feeds       Pipeline module (deterministic)  │    ║
║  │     ETH/USD · BTC/USD · LINK/USD thresholds          │    ║
║  │                                                      │    ║
║  │  4. Data Streams     Pipeline module (sub-second)     │    ║
║  │     Real-time price data for time-sensitive markets   │    ║
║  │                                                      │    ║
║  │  5. Functions        Pipeline module (custom JS)      │    ║
║  │     Execute arbitrary API calls via Chainlink DON     │    ║
║  │                                                      │    ║
║  │  6. CCIP             Cross-chain market mirroring     │    ║
║  │     Base ↔ Ethereum ↔ Arbitrum ↔ Optimism             │    ║
║  │                                                      │    ║
║  │  7. VRF v2.5         Featured market randomness       │    ║
║  │     Fair random selection for homepage spotlight      │    ║
║  │                                                      │    ║
║  │  8. Automation       Auto-resolution trigger          │    ║
║  │     checkUpkeep/performUpkeep on deadline expiry      │    ║
║  │                                                      │    ║
║  └──────────────────────────────────────────────────────┘    ║
║                                                              ║
║  Most Chainlink services used in a single hackathon project  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Talking Points:**
- We didn't just check a box — each service solves a real problem
- CRE is the backbone, not a bolt-on
- x402 creates a sustainable revenue model from day one
- Data Feeds + Data Streams + Functions are pipeline modules, not decoration
- This is likely the deepest Chainlink integration in the hackathon

---

## SLIDE 7 — CRE Deep Dive (The "Wow")

```
╔══════════════════════════════════════════════════════════════╗
║            CRE: THE BRAIN OF OMNIORACLE                      ║
║                                                              ║
║  WORKFLOW 1: market-factory                                  ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ HTTP POST trigger → Gemini validates question →         │ ║
║  │ Maps category/pipeline → Encodes report →               │ ║
║  │ Signs → onReport(0x00) → Market created on-chain        │ ║
║  │                                                         │ ║
║  │ CRON (6h) trigger → Gemini generates 3 trending ideas → │ ║
║  │ Auto-creates markets with optimal pipeline types        │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  WORKFLOW 2: oracle-resolver  ★ THE CORE INNOVATION ★       ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ EVM Log trigger (ResolutionRequested event) →           │ ║
║  │                                                         │ ║
║  │ Read pipelineType from on-chain config →                │ ║
║  │                                                         │ ║
║  │ DYNAMIC ROUTING:                                        │ ║
║  │   case PRICE_FEED   → read Data Feed → deterministic    │ ║
║  │   case DATA_STREAM  → read Streams → deterministic      │ ║
║  │   case FUNCTIONS    → execute JS → parse result         │ ║
║  │   case AI_GROUNDED  → Gemini + search → probabilistic   │ ║
║  │   case COMPOSITE    → N-of-M agreement → consensus      │ ║
║  │                                                         │ ║
║  │ Encode (marketId, outcome, confidence) →                │ ║
║  │ Sign → onReport(0x01) → Market resolved on-chain        │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  WORKFLOW 3: cross-chain-sync                                ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ CRON (4h) trigger → Scan active markets →               │ ║
║  │ Encode CCIP message → Mirror to destination chains      │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  CRE isn't a feature — it's the entire execution layer.      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Talking Points:**
- The oracle-resolver workflow is the star — it dynamically routes to 5 different resolution strategies based on immutable pipeline config
- This is a **runtime decision** — the CRE workflow reads on-chain state and decides how to resolve
- market-factory also uses AI to validate questions and auto-generate trending markets
- cross-chain-sync mirrors markets across chains via CCIP
- CRE is not a side feature — remove CRE and the entire system stops working

---

## SLIDE 8 — Smart Contracts

```
╔══════════════════════════════════════════════════════════════╗
║               SMART CONTRACTS — DEPLOYED                     ║
║                                                              ║
║  MarketFactory.sol (312 lines)                               ║
║  ├─ createMarket() — permissionless, min 0.01 ETH seed      ║
║  ├─ predict() — YES/NO bets, min 0.001 ETH                  ║
║  ├─ onReport() — CRE callback (0x00=create, 0x01=resolve)   ║
║  ├─ claim() — proportional payout, 2% fee, ReentrancyGuard  ║
║  ├─ disputeResolution() — 0.05 ETH dispute bond             ║
║  └─ setFeaturedMarket() — VRF callback                      ║
║                                                              ║
║  OraclePipeline.sol (55 lines) — immutable pipeline config   ║
║  OmniResolver.sol (59 lines) — CRE resolution executor      ║
║  CrossChainRegistry.sol (88 lines) — CCIP market mirroring  ║
║  AutoResolver.sol (53 lines) — Chainlink Automation          ║
║                                                              ║
║  ┌──────────────────────────────────────────────────────┐    ║
║  │  46 test cases — ALL PASSING                         │    ║
║  │  OpenZeppelin v5 · Solidity 0.8.24 · Foundry        │    ║
║  └──────────────────────────────────────────────────────┘    ║
║                                                              ║
║  MarketFactory:       0xd3A85f742CFE6B802A45bCF17c9C07B5...  ║
║  OraclePipeline:      0x98BB79754e0475046B25CdCfbBdfd863...  ║
║  OmniResolver:        0xc75168B64808d46Fa25f651E7c2026B4...  ║
║  CrossChainRegistry:  0xE0A70aaE7FceDfE9479Ac2C298364b83...  ║
║  AutoResolver:        0x35b872462CeE8fcBAa5dC26fF1eD412f...  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Talking Points:**
- 5 contracts, 567 lines of production Solidity
- 46 tests, all passing — comprehensive coverage
- Deployed and verified on Base Sepolia
- Clean separation of concerns: factory, pipeline config, resolver, cross-chain, automation

---

## SLIDE 9 — x402 Payment Model

```
╔══════════════════════════════════════════════════════════════╗
║                x402 PAYMENT MODEL                            ║
║                                                              ║
║  Not just anti-spam — it's a revenue model.                  ║
║                                                              ║
║  ┌─────────────────────────────────────────────────────┐     ║
║  │  POST /api/create-market      → $0.01 USDC          │     ║
║  │  POST /api/request-resolution → $0.005 USDC         │     ║
║  │                                                     │     ║
║  │  @x402/express v2.3 middleware                      │     ║
║  │  → HTTP 402 Payment Required                        │     ║
║  │  → User pays via USDC on Base Sepolia               │     ║
║  │  → Payment verified by facilitator                  │     ║
║  │  → Request proceeds                                 │     ║
║  │                                                     │     ║
║  │  6 FREE read endpoints:                             │     ║
║  │  GET /markets · /markets/:id · /portfolio/:addr     │     ║
║  │  GET /pipelines · /stats · /health                  │     ║
║  └─────────────────────────────────────────────────────┘     ║
║                                                              ║
║  Revenue streams:                                            ║
║  1. x402 micropayments (creation + resolution)               ║
║  2. 2% platform fee on market resolution                     ║
║  3. Dispute bond forfeitures (0.05 ETH)                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Talking Points:**
- x402 is the HTTP 402 protocol by Coinbase — native to Chainlink ecosystem
- Real middleware implementation, not mocked — uses @x402/express v2.3 with ExactEvmScheme
- Creates sustainable unit economics from day one
- AI agents can also consume the API — x402 is agent-native

---

## SLIDE 10 — What Makes Us Win

```
╔══════════════════════════════════════════════════════════════╗
║             WHY OMNIORACLE WINS 1ST PLACE                    ║
║                                                              ║
║  ┌──────────────────────────────────────────────────────┐    ║
║  │                                                      │    ║
║  │  1. ORIGINALITY                                      │    ║
║  │     No other project lets you COMPOSE oracle         │    ║
║  │     pipelines at market creation time.               │    ║
║  │     This is new infrastructure, not another UI.      │    ║
║  │                                                      │    ║
║  │  2. CRE DEPTH                                        │    ║
║  │     CRE isn't a feature — it's the execution layer.  │    ║
║  │     3 workflows, 4 triggers, dynamic routing.        │    ║
║  │     Remove CRE and nothing works.                    │    ║
║  │                                                      │    ║
║  │  3. 8 CHAINLINK SERVICES                             │    ║
║  │     Deepest integration in the hackathon.            │    ║
║  │     Each service solves a real, distinct problem.    │    ║
║  │                                                      │    ║
║  │  4. PRODUCTION-GRADE                                 │    ║
║  │     46 tests passing. 5 deployed contracts.          │    ║
║  │     Real x402 payments. Live frontend.               │    ║
║  │     Not a demo — a working system.                   │    ║
║  │                                                      │    ║
║  │  5. ADDRESSES REAL PROBLEM                           │    ║
║  │     UMA's $7M hack proves one-size-fits-all          │    ║
║  │     oracles don't work. We fix this at the           │    ║
║  │     infrastructure level.                            │    ║
║  │                                                      │    ║
║  └──────────────────────────────────────────────────────┘    ║
║                                                              ║
║  "Real applications, not demos." — Chainlink Hackathon       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Talking Points:**
- Every judging criterion is covered: technical execution, blockchain application, CRE use, originality
- The hackathon site says "real applications, not demos" — we built real infrastructure
- No one else in the prediction markets track has composable oracle pipelines
- 8 services isn't padding — each one has a specific, justified use case

---

## SLIDE 11 — Live Demo Links

```
╔══════════════════════════════════════════════════════════════╗
║                        TRY IT NOW                            ║
║                                                              ║
║  Frontend:         https://omnioracle.vercel.app             ║
║  GitHub:           github.com/yt2025id-lab/omnioracle        ║
║                                                              ║
║  Deployed Contracts (Base Sepolia):                          ║
║  ┌──────────────────────────────────────────────────────┐    ║
║  │ MarketFactory      0xd3A85f...adeC02c2               │    ║
║  │ OraclePipeline     0x98BB79...0e1D2F8                │    ║
║  │ OmniResolver       0xc75168...026B49Ad               │    ║
║  │ CrossChainRegistry 0xE0A70a...4b830152               │    ║
║  │ AutoResolver       0x35b872...eD412f09               │    ║
║  └──────────────────────────────────────────────────────┘    ║
║                                                              ║
║  All verified on BaseScan · 46 tests passing                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## APPENDIX — Comparison Table

```
╔══════════════════════════════════════════════════════════════╗
║              OMNIORACLE vs COMPETITORS                       ║
║                                                              ║
║  Feature          │ Polymarket │ Azuro    │ OmniOracle       ║
║  ─────────────────┼────────────┼──────────┼──────────────    ║
║  Oracle type      │ UMA only   │ DAO vote │ 5 composable     ║
║  Pipeline choice  │ None       │ None     │ User selects     ║
║  Deterministic    │ No         │ No       │ Yes (price)      ║
║  AI resolution    │ No         │ No       │ Yes (grounded)   ║
║  Cross-chain      │ No         │ No       │ Yes (CCIP)       ║
║  Permissionless   │ No*        │ No       │ Yes              ║
║  Payment-gated    │ No         │ No       │ Yes (x402)       ║
║  CRE-native       │ No         │ No       │ Yes              ║
║  Open source      │ Partial    │ Partial  │ Fully            ║
║                                                              ║
║  * Polymarket restricted after UMA attack                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## APPENDIX — Three-Project Ecosystem

```
╔══════════════════════════════════════════════════════════════╗
║              FUTURE VISION: 3-PROJECT STACK                  ║
║                                                              ║
║  ┌──────────────────────────────────────────────────────┐    ║
║  │  OMNIORACLE    Market Creation + Composable Oracles  │    ║
║  │                This project. Infrastructure layer.   │    ║
║  ├──────────────────────────────────────────────────────┤    ║
║  │  TRUTHMESH     BFT Consensus Verification Layer      │    ║
║  │                Decentralized verification network.   │    ║
║  ├──────────────────────────────────────────────────────┤    ║
║  │  AGENTBET      AI Agent Trading Interface            │    ║
║  │                AI agents trade on prediction markets.│    ║
║  └──────────────────────────────────────────────────────┘    ║
║                                                              ║
║  Each project works standalone.                              ║
║  Together, they form a complete prediction market stack.     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

*OmniOracle — Composable Oracle Pipelines for Prediction Markets*
*Built for Chainlink Convergence Hackathon 2026*
