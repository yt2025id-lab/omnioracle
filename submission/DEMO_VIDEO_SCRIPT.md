# OmniOracle — Demo Video Script & Voiceover
### Target: 4 minutes 30 seconds | Chainlink Convergence Hackathon 2026

---

## Pre-Production Notes

**Recording Setup:**
- Screen recorder: OBS Studio or Loom (1920x1080)
- Browser: Chrome with MetaMask / Coinbase Wallet
- Terminal: open in split view for contract interaction
- Tabs pre-loaded: Frontend, BaseScan, GitHub
- Network: Base Sepolia selected in wallet

**Voice Tips:**
- Speak confidently but not rushed
- Pause 1 second between sections
- Emphasize keywords in **bold** below
- Energy level: excited but professional

---

## [0:00 - 0:25] HOOK — The Problem (25 seconds)

**Screen:** Black screen with text overlay "OmniOracle" fading in, then cut to Polymarket screenshot

**Voiceover:**

> "Polymarket processes billions of dollars in predictions — but every single market, from Bitcoin price to presidential elections, resolves through the **same** oracle. UMA's optimistic oracle. And in March 2025, it was **exploited for 7 million dollars**.
>
> The problem is simple: **different questions need different data sources**. A crypto price market shouldn't resolve the same way as 'Will it rain in Jakarta tomorrow?'
>
> **OmniOracle fixes this.**"

**Action:**
- 0:00 → Show "OmniOracle" title card (3 sec)
- 0:03 → Show Polymarket website briefly
- 0:08 → Show UMA $7M hack headline (screenshot from crypto news)
- 0:15 → Transition to OmniOracle frontend

---

## [0:25 - 0:55] WHAT IS OMNIORACLE (30 seconds)

**Screen:** OmniOracle homepage at omnioracle.vercel.app

**Voiceover:**

> "OmniOracle is a **permissionless prediction market factory** where anyone can create a market and **choose their own oracle pipeline** for resolution.
>
> We call it **'Zapier for prediction market oracles'** — you compose the right data pipeline for your specific question.
>
> Five pipeline types. Eight Chainlink services. Three CRE workflows. All working together on **Base Sepolia**.
>
> Let me show you how it works."

**Action:**
- 0:25 → Show homepage dashboard — scroll slowly to show pipeline types section
- 0:35 → Highlight "5 Pipeline Types" cards on homepage
- 0:42 → Highlight "8 Chainlink Services" section
- 0:50 → Click "Create Market" button to transition

---

## [0:55 - 2:05] LIVE DEMO — Create a Market (70 seconds)

**Screen:** Create Market page (/create)

### Part A: Price Feed Market [0:55 - 1:30]

**Voiceover:**

> "Let's create a prediction market: **'Will ETH exceed 5000 dollars by March 2026?'**
>
> I'll type in the question... select the category as **Crypto**... set the deadline... and here's where OmniOracle is different from everything else.
>
> I select the pipeline type: **Price Feed**. This tells the oracle resolver to use **Chainlink's ETH/USD Data Feed** — not a human vote, not a dispute process — a **deterministic, on-chain price check**.
>
> Now I configure the pipeline: ETH/USD feed address, threshold 5000 dollars, direction **above**.
>
> When this market resolves, the CRE workflow will read the Chainlink Data Feed, compare the price to 5000, and **automatically** determine YES or NO. No human intervention. **100% deterministic**.
>
> Let me add seed liquidity — 0.01 ETH — and create the market."

**Action:**
- 0:55 → Type question: "Will ETH exceed $5000 by March 2026?"
- 1:02 → Select "Crypto" category
- 1:05 → Set deadline
- 1:08 → **HIGHLIGHT** pipeline type selector — hover over each type briefly
- 1:12 → Select "Price Feed" — show the description text
- 1:16 → Configure: select ETH/USD, type 5000, select "Above"
- 1:24 → Set seed amount 0.01 ETH
- 1:27 → Click "Create Market" → show MetaMask popup → confirm tx

### Part B: AI Grounded Market [1:30 - 2:05]

**Voiceover:**

> "Now watch what happens when the question is **different**. Let me create another market: **'Will Indonesia win the AFF Championship 2026?'**
>
> This time, there's no price feed for this. No API endpoint. This is a **real-world event** that needs **AI verification**.
>
> So I select **AI Grounded** pipeline — this uses **Google Gemini with search grounding**. When this market needs to resolve, the CRE workflow will ask Gemini to search the web for the answer, provide evidence, and return an outcome with a **confidence score**.
>
> **Same platform. Same smart contracts. Completely different oracle pipeline.** That's the power of composable oracles.
>
> And if I wanted maximum security, I'd use the **Composite** pipeline — which requires 2-of-3 agreement across Data Feeds, AI, and Functions API.
>
> Let me create this one too."

**Action:**
- 1:30 → Clear form, type new question
- 1:35 → Select "Sports" category
- 1:40 → **HIGHLIGHT** pipeline type change to "AI Grounded"
- 1:45 → Show AI Grounded description in the UI
- 1:50 → Briefly hover over "Composite" to show its N-of-M description
- 1:55 → Click "Create Market" → confirm tx
- 2:00 → Navigate to Markets page to see both markets listed

---

## [2:05 - 2:40] MARKET TRADING & RESOLUTION (35 seconds)

**Screen:** Market detail page (/markets/0)

**Voiceover:**

> "Once markets are live, anyone can trade. I'll place a **YES** bet on the ETH price market — 0.005 ETH.
>
> *(click and confirm)*
>
> The pool updates in real-time. YES pool grows, implied probability shifts.
>
> Now, when the deadline passes, **anyone** can trigger resolution. They click 'Request Resolution,' and here's where the **CRE magic happens**:
>
> The `ResolutionRequested` event fires on-chain. The **oracle-resolver CRE workflow** picks it up via EVM Log trigger. It reads the pipeline config — sees it's a **PRICE_FEED** type — and **dynamically routes** to the Chainlink Data Feed resolver.
>
> It reads ETH/USD, compares to $5000, encodes the result, signs it, and calls `onReport` on-chain. **Market resolved. Deterministic. No disputes.**
>
> Winners claim proportional payouts minus a 2% platform fee."

**Action:**
- 2:05 → Show market detail page with pipeline visualization
- 2:10 → Place a YES bet (0.005 ETH), confirm in wallet
- 2:17 → Show pool ratio update
- 2:20 → Scroll to "Request Resolution" button (explain, don't click if market isn't expired)
- 2:25 → **Show animated pipeline flow diagram** on the market detail page
- 2:35 → Briefly show the claim section

---

## [2:40 - 3:15] TECHNICAL DEEP DIVE — CRE (35 seconds)

**Screen:** Split screen — VS Code with logCallback.ts on left, terminal on right

**Voiceover:**

> "Let me show you what happens under the hood. This is `logCallback.ts` — the **oracle-resolver** CRE workflow. 263 lines of TypeScript compiled to WASM.
>
> *(scroll to the switch statement)*
>
> Here's the **dynamic pipeline router**. Based on the pipeline type stored on-chain, the workflow routes to one of five resolver functions:
>
> - `resolvePriceFeed` reads the Chainlink Data Feed and does a deterministic comparison.
> - `resolveAIGrounded` asks Gemini with search grounding and returns a confidence score.
> - `resolveComposite` runs **multiple sources** and checks for N-of-M agreement.
>
> Each resolver encodes the result as `(marketId, outcome, confidence)`, signs it, and writes it back on-chain via the CRE Forwarder.
>
> *(show project.yaml briefly)*
>
> Three workflows, four triggers — HTTP, two Crons, and EVM Log. CRE isn't a feature we bolted on. **It IS the execution layer.**"

**Action:**
- 2:40 → Open VS Code with `cre-workflows/oracle-resolver/logCallback.ts`
- 2:45 → Scroll to the pipeline routing switch statement (~line 30-50)
- 2:52 → Highlight `resolvePriceFeed` function
- 2:57 → Highlight `resolveAIGrounded` function
- 3:02 → Highlight `resolveComposite` function
- 3:07 → Quick switch to `project.yaml` to show workflow definitions
- 3:12 → Switch to terminal, show `forge test` output (46 tests passing)

---

## [3:15 - 3:40] x402 + CROSS-CHAIN (25 seconds)

**Screen:** VS Code showing x402 server code, then cross-chain explorer page

**Voiceover:**

> "Market creation is payment-gated via **Chainlink x402**. Our Express server uses `@x402/express` v2.3 middleware — real payment verification, not a mock.
>
> *(show server.ts x402 middleware code)*
>
> One cent to create a market. Half a cent to request resolution. This creates sustainable economics and prevents spam.
>
> *(switch to cross-chain explorer page)*
>
> And markets don't live on one chain. Our **cross-chain-sync** CRE workflow mirrors markets via **CCIP** to Ethereum Sepolia, Arbitrum, and Optimism. One market, multiple chains, unified liquidity."

**Action:**
- 3:15 → Show `x402-server/src/server.ts` — highlight paymentMiddleware section
- 3:22 → Show the pricing: $0.01 and $0.005
- 3:27 → Switch to frontend /explorer page
- 3:30 → Show chain grid: Base, Ethereum, Arbitrum, Optimism
- 3:35 → Show "How CCIP Markets Work" section

---

## [3:40 - 4:05] DEPLOYED CONTRACTS (25 seconds)

**Screen:** BaseScan showing deployed contracts

**Voiceover:**

> "Everything is **deployed and live** on Base Sepolia. Five smart contracts — MarketFactory, OraclePipeline, OmniResolver, CrossChainRegistry, and AutoResolver.
>
> *(show BaseScan for MarketFactory)*
>
> 46 test cases, all passing. Solidity 0.8.24 with OpenZeppelin v5. ReentrancyGuard on all payout functions. Proper access control.
>
> *(switch to GitHub)*
>
> Fully open source. Three thousand four hundred lines of code across contracts, CRE workflows, x402 server, and frontend."

**Action:**
- 3:40 → Open BaseScan: https://sepolia.basescan.org/address/0xd3A85f742CFE6B802A45bCF17c9C07B5adeC02c2
- 3:45 → Show contract code tab
- 3:50 → Switch to terminal: `forge test -vv` showing 46 passing
- 3:55 → Open GitHub repo page
- 4:00 → Scroll through repo structure

---

## [4:05 - 4:30] CLOSING — Why We Win (25 seconds)

**Screen:** Split — frontend on left, architecture diagram on right

**Voiceover:**

> "OmniOracle isn't another prediction market clone. It's **new infrastructure** for how prediction markets should resolve.
>
> **Five composable oracle pipelines** — pick the right tool for the right question.
> **Eight Chainlink services** — the deepest integration in this hackathon.
> **Three CRE workflows** — CRE is the execution layer, not a checkbox.
> **Real x402 payments** — sustainable economics from day one.
> **Deployed, tested, and live** — not a demo, a working system.
>
> We didn't just build a dapp. We built **the Zapier for prediction market oracles**.
>
> **OmniOracle. Composable oracles. Powered by Chainlink.**"

**Action:**
- 4:05 → Show frontend homepage
- 4:10 → Quick montage: cycle through key screens (markets, create, pipeline builder, explorer)
- 4:20 → Show final card:

```
OmniOracle
omnioracle.vercel.app
github.com/yt2025id-lab/omnioracle

5 Pipelines · 8 Chainlink Services · 3 CRE Workflows
46 Tests · 5 Deployed Contracts · Full Stack

Built for Chainlink Convergence Hackathon 2026
```

- 4:28 → Fade to black

---

## Post-Production Checklist

### Before Recording:
- [ ] MetaMask set to Base Sepolia with some ETH
- [ ] All browser tabs pre-loaded (frontend, BaseScan, GitHub)
- [ ] VS Code open with key files ready
- [ ] Terminal ready with `forge test` command
- [ ] Screen resolution: 1920x1080
- [ ] Close all notifications (Do Not Disturb mode)
- [ ] Test microphone levels

### Screen Tabs (Pre-load in order):
1. `https://omnioracle.vercel.app` (homepage)
2. `https://omnioracle.vercel.app/create` (create market)
3. `https://omnioracle.vercel.app/markets` (market list)
4. `https://omnioracle.vercel.app/explorer` (cross-chain)
5. `https://sepolia.basescan.org/address/0xd3A85f742CFE6B802A45bCF17c9C07B5adeC02c2` (MarketFactory)
6. `https://github.com/yt2025id-lab/omnioracle` (GitHub)
7. VS Code with `cre-workflows/oracle-resolver/logCallback.ts` open
8. VS Code with `x402-server/src/server.ts` open

### Video Editing:
- [ ] Add text overlays for key stats (8 services, 46 tests, etc.)
- [ ] Add subtle background music (lo-fi or tech ambient, low volume)
- [ ] Add transition effects between sections (simple fade/slide)
- [ ] Add "Chainlink Convergence Hackathon" watermark in corner
- [ ] Verify total length is under 5 minutes
- [ ] Export at 1080p minimum

### Title Card Template:
```
┌─────────────────────────────────────────────┐
│                                             │
│            O M N I O R A C L E              │
│                                             │
│   Composable Oracle Pipelines for           │
│   Prediction Markets                        │
│                                             │
│   Chainlink Convergence Hackathon 2026      │
│   Prediction Markets Track                  │
│                                             │
│   omnioracle.vercel.app                     │
│                                             │
└─────────────────────────────────────────────┘
```

### End Card Template:
```
┌─────────────────────────────────────────────┐
│                                             │
│            O M N I O R A C L E              │
│                                             │
│   5 Pipelines · 8 Services · 3 Workflows   │
│   46 Tests · 5 Contracts · Full Stack       │
│                                             │
│   omnioracle.vercel.app                     │
│   github.com/yt2025id-lab/omnioracle        │
│                                             │
│   "Zapier for Prediction Market Oracles"    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Voiceover Full Script (Copy-Paste for Teleprompter)

> Polymarket processes billions of dollars in predictions — but every single market, from Bitcoin price to presidential elections, resolves through the same oracle. UMA's optimistic oracle. And in March 2025, it was exploited for 7 million dollars.
>
> The problem is simple: different questions need different data sources. A crypto price market shouldn't resolve the same way as 'Will it rain in Jakarta tomorrow?'
>
> OmniOracle fixes this.
>
> OmniOracle is a permissionless prediction market factory where anyone can create a market and choose their own oracle pipeline for resolution.
>
> We call it 'Zapier for prediction market oracles' — you compose the right data pipeline for your specific question.
>
> Five pipeline types. Eight Chainlink services. Three CRE workflows. All working together on Base Sepolia.
>
> Let me show you how it works.
>
> Let's create a prediction market: 'Will ETH exceed 5000 dollars by March 2026?'
>
> I'll type in the question, select the category as Crypto, set the deadline, and here's where OmniOracle is different from everything else.
>
> I select the pipeline type: Price Feed. This tells the oracle resolver to use Chainlink's ETH/USD Data Feed — not a human vote, not a dispute process — a deterministic, on-chain price check.
>
> Now I configure the pipeline: ETH/USD feed address, threshold 5000 dollars, direction above.
>
> When this market resolves, the CRE workflow will read the Chainlink Data Feed, compare the price to 5000, and automatically determine YES or NO. No human intervention. 100% deterministic.
>
> Let me add seed liquidity and create the market.
>
> Now watch what happens when the question is different. Let me create another market: 'Will Indonesia win the AFF Championship 2026?'
>
> This time, there's no price feed for this. No API endpoint. This is a real-world event that needs AI verification.
>
> So I select AI Grounded pipeline — this uses Google Gemini with search grounding. When this market needs to resolve, the CRE workflow will ask Gemini to search the web for the answer, provide evidence, and return an outcome with a confidence score.
>
> Same platform. Same smart contracts. Completely different oracle pipeline. That's the power of composable oracles.
>
> And if I wanted maximum security, I'd use the Composite pipeline — which requires 2-of-3 agreement across Data Feeds, AI, and Functions API.
>
> Once markets are live, anyone can trade. I'll place a YES bet on the ETH price market.
>
> The pool updates in real-time. YES pool grows, implied probability shifts.
>
> When the deadline passes, anyone can trigger resolution. The ResolutionRequested event fires on-chain. The oracle-resolver CRE workflow picks it up via EVM Log trigger. It reads the pipeline config, sees it's a PRICE_FEED type, and dynamically routes to the Chainlink Data Feed resolver.
>
> It reads ETH/USD, compares to 5000, encodes the result, signs it, and calls onReport on-chain. Market resolved. Deterministic. No disputes.
>
> Winners claim proportional payouts minus a 2% platform fee.
>
> Let me show you what happens under the hood. This is logCallback.ts — the oracle-resolver CRE workflow. 263 lines of TypeScript compiled to WASM.
>
> Here's the dynamic pipeline router. Based on the pipeline type stored on-chain, the workflow routes to one of five resolver functions:
>
> resolvePriceFeed reads the Chainlink Data Feed and does a deterministic comparison. resolveAIGrounded asks Gemini with search grounding and returns a confidence score. resolveComposite runs multiple sources and checks for N-of-M agreement.
>
> Three workflows, four triggers. CRE isn't a feature we bolted on. It IS the execution layer.
>
> Market creation is payment-gated via Chainlink x402. Our Express server uses x402 express v2.3 middleware — real payment verification, not a mock.
>
> One cent to create a market. Half a cent to request resolution. Sustainable economics from day one.
>
> And markets don't live on one chain. Our cross-chain-sync CRE workflow mirrors markets via CCIP to Ethereum Sepolia, Arbitrum, and Optimism. One market, multiple chains, unified liquidity.
>
> Everything is deployed and live on Base Sepolia. Five smart contracts. 46 test cases, all passing. Solidity 0.8.24 with OpenZeppelin v5. Fully open source. Three thousand four hundred lines of code.
>
> OmniOracle isn't another prediction market clone. It's new infrastructure for how prediction markets should resolve.
>
> Five composable oracle pipelines. Eight Chainlink services. Three CRE workflows. Real x402 payments. Deployed, tested, and live.
>
> We didn't just build a dapp. We built the Zapier for prediction market oracles.
>
> OmniOracle. Composable oracles. Powered by Chainlink.

---

*Total voiceover word count: ~690 words*
*At 160 words/minute speaking pace = ~4 minutes 20 seconds*
*With screen actions and pauses = ~4 minutes 30 seconds*
