# OmniOracle — Chainlink Convergence Hackathon Submission

**Track:** Prediction Markets
**Team:** Ozan_OnChain
**Submitted:** March 2026

---

## Quick Links

| Resource | Link |
|----------|------|
| **Live Demo** | [omnioracle.vercel.app](https://omnioracle.vercel.app) |
| **GitHub** | [github.com/yt2025id-lab/omnioracle](https://github.com/yt2025id-lab/omnioracle) |
| **Network** | Base Sepolia (chain ID 84532) |

---

## Submission Files

| File | Description |
|------|-------------|
| [README.md](README.md) | Full technical documentation — architecture, contracts, Chainlink integration index |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | 1-page partner/judge overview — problem, solution, differentiator |
| [PITCHDECK.md](PITCHDECK.md) | 11-slide pitch deck with talking points |
| [DEMO_VIDEO_SCRIPT.md](DEMO_VIDEO_SCRIPT.md) | 4:30 voiceover demo script with timestamps |
| [DEMO_LIVE.html](DEMO_LIVE.html) | Standalone animated demo — open in browser, no server needed |

---

## Deployed Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| MarketFactory | [`0xd3A85f742CFE6B802A45bCF17c9C07B5adeC02c2`](https://sepolia.basescan.org/address/0xd3A85f742CFE6B802A45bCF17c9C07B5adeC02c2) |
| OraclePipeline | [`0x98BB79754e0475046B25CdCfbBdfd863f0e1D2F8`](https://sepolia.basescan.org/address/0x98BB79754e0475046B25CdCfbBdfd863f0e1D2F8) |
| OmniResolver | [`0xc75168B64808d46Fa25f651E7c2026B49Ad0B555`](https://sepolia.basescan.org/address/0xc75168B64808d46Fa25f651E7c2026B49Ad0B555) |
| CrossChainRegistry | [`0xE0A70aaE7FceDfE9479Ac2C298364b830152b693`](https://sepolia.basescan.org/address/0xE0A70aaE7FceDfE9479Ac2C298364b830152b693) |
| AutoResolver | [`0x35b872462CeE8fcBAa5dC26fF1eD412f0938FE00`](https://sepolia.basescan.org/address/0x35b872462CeE8fcBAa5dC26fF1eD412f0938FE00) |

---

## 8 Chainlink Services — At a Glance

| # | Service | File | Proof |
|---|---------|------|-------|
| 1 | **CRE** | `cre-workflows/` (3 workflows) | `project.yaml`, `logCallback.ts` |
| 2 | **x402** | `x402-server/src/server.ts` | `paymentMiddleware()` + `ExactEvmScheme` |
| 3 | **Data Feeds** | `cre-workflows/oracle-resolver/logCallback.ts` | `readPriceFeed()` → `latestRoundData()` |
| 4 | **Data Streams** | `cre-workflows/oracle-resolver/logCallback.ts` | `PipelineType.DATA_STREAM` branch |
| 5 | **Functions** | `contracts/src/OmniResolver.sol` | `PipelineType.FUNCTIONS_API` branch |
| 6 | **CCIP** | `contracts/src/CrossChainRegistry.sol` | `IRouterClient.ccipSend()` + `ccipReceive()` |
| 7 | **VRF v2.5** | `contracts/src/MarketFactory.sol` | `requestFeaturedMarket()` + `fulfillRandomWords()` |
| 8 | **Automation** | `contracts/src/AutoResolver.sol` | `checkUpkeep()` + `performUpkeep()` |

---

## Test Results

```
forge test -vv
52 tests passed, 0 failed (MarketFactory: 30, OmniResolver: 22)
```

---

## How to Run the Demo

**Option A — Live site (fastest):**
1. Open [omnioracle.vercel.app](https://omnioracle.vercel.app)
2. Connect MetaMask (Base Sepolia network)
3. Create a market → choose pipeline → bet → watch resolution

**Option B — Local animated demo (offline):**
1. Open `DEMO_LIVE.html` in any browser
2. Click Play — 10-scene auto-demo runs (~2 min)
3. Shows full flow: connect wallet → create market → Chainlink oracle resolves → claim profit

**Option C — Video script:**
- See `DEMO_VIDEO_SCRIPT.md` for 4:30 narrated walkthrough with timestamps
