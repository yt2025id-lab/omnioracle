import express from "express";
import cors from "cors";
import { createPublicClient, http, formatEther } from "viem";
import { baseSepolia } from "viem/chains";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3003;
const PAY_TO = (process.env.PAY_TO_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

// x402 Payment Setup
const facilitatorClient = new HTTPFacilitatorClient({ url: "https://facilitator.x402.org" });
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register("eip155:84532", new ExactEvmScheme());

app.use(
  paymentMiddleware(
    {
      "POST /api/create-market": {
        accepts: {
          scheme: "exact",
          price: "$0.01",
          network: "eip155:84532",
          payTo: PAY_TO,
        },
        description: "Create a new prediction market on OmniOracle",
      },
      "POST /api/request-resolution": {
        accepts: {
          scheme: "exact",
          price: "$0.005",
          network: "eip155:84532",
          payTo: PAY_TO,
        },
        description: "Request oracle resolution for a market",
      },
    },
    resourceServer,
    {
      appName: "OmniOracle",
      testnet: true,
    },
  ),
);

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"),
});

const MARKET_FACTORY = (process.env.MARKET_FACTORY_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;
const ORACLE_PIPELINE = (process.env.ORACLE_PIPELINE_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

// Inline ABIs
const FACTORY_ABI = [
  {
    name: "getMarket",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [{
      name: "", type: "tuple",
      components: [
        { name: "creator", type: "address" },
        { name: "question", type: "string" },
        { name: "category", type: "uint8" },
        { name: "pipelineType", type: "uint8" },
        { name: "createdAt", type: "uint256" },
        { name: "deadline", type: "uint256" },
        { name: "status", type: "uint8" },
        { name: "resolvedOutcome", type: "uint8" },
        { name: "yesPool", type: "uint256" },
        { name: "noPool", type: "uint256" },
        { name: "totalPool", type: "uint256" },
        { name: "confidence", type: "uint16" },
        { name: "marketId", type: "uint256" },
      ],
    }],
  },
  {
    name: "nextMarketId",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "featuredMarketId",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const PIPELINE_ABI = [
  {
    name: "getPipelineConfig",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [{
      name: "", type: "tuple",
      components: [
        { name: "pipelineType", type: "uint8" },
        { name: "priceFeedAddress", type: "address" },
        { name: "priceThreshold", type: "int256" },
        { name: "isAbove", type: "bool" },
        { name: "dataStreamId", type: "bytes32" },
        { name: "functionsScript", type: "string" },
        { name: "aiPromptHash", type: "bytes32" },
        { name: "requiredAgreement", type: "uint8" },
      ],
    }],
  },
] as const;

const PipelineLabels = ["Price Feed", "Data Stream", "Functions API", "AI Grounded", "Composite"];
const CategoryLabels = ["Crypto", "Sports", "Politics", "Science", "Entertainment", "Custom"];
const StatusLabels = ["Open", "Resolution Requested", "Resolving", "Resolved", "Disputed", "Expired"];
const OutcomeLabels = ["YES", "NO", "INVALID"];

// ============ PAYMENT-GATED ENDPOINTS (x402) ============

// POST /api/create-market — triggers market-factory CRE workflow
app.post("/api/create-market", async (req, res) => {
  const { question, category, deadline, pipelineType, pipelineConfig } = req.body;

  if (!question || !category || !deadline || !pipelineType) {
    return res.status(400).json({ error: "Missing required fields: question, category, deadline, pipelineType" });
  }

  try {
    const forwarderUrl = process.env.MARKET_FACTORY_FORWARDER_URL || "http://localhost:8080/create-market";
    const response = await fetch(forwarderUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, category, deadline, pipelineType, pipelineConfig }),
    });
    const result = await response.json();
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/request-resolution — triggers oracle-resolver
app.post("/api/request-resolution", async (req, res) => {
  const { marketId } = req.body;

  if (marketId === undefined) {
    return res.status(400).json({ error: "Missing marketId" });
  }

  try {
    const forwarderUrl = process.env.ORACLE_RESOLVER_FORWARDER_URL || "http://localhost:8081/resolve";
    const response = await fetch(forwarderUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId }),
    });
    const result = await response.json();
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============ FREE READ ENDPOINTS ============

// GET /api/markets — all markets
app.get("/api/markets", async (_req, res) => {
  try {
    const nextId = await publicClient.readContract({
      address: MARKET_FACTORY,
      abi: FACTORY_ABI,
      functionName: "nextMarketId",
    });

    const total = Number(nextId);
    const markets = [];

    for (let i = Math.max(0, total - 50); i < total; i++) {
      try {
        const m = await publicClient.readContract({
          address: MARKET_FACTORY,
          abi: FACTORY_ABI,
          functionName: "getMarket",
          args: [BigInt(i)],
        });

        markets.push({
          marketId: i,
          creator: m.creator,
          question: m.question,
          category: CategoryLabels[m.category] || "Custom",
          pipelineType: PipelineLabels[m.pipelineType] || "Unknown",
          status: StatusLabels[m.status] || "Unknown",
          resolvedOutcome: m.status === 3 ? OutcomeLabels[m.resolvedOutcome] : null,
          yesPool: formatEther(m.yesPool),
          noPool: formatEther(m.noPool),
          totalPool: formatEther(m.totalPool),
          confidence: Number(m.confidence),
          deadline: Number(m.deadline),
          createdAt: Number(m.createdAt),
        });
      } catch {}
    }

    res.json({ total, markets: markets.reverse() });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/markets/:id — market detail + pipeline config
app.get("/api/markets/:id", async (req, res) => {
  try {
    const marketId = BigInt(req.params.id);

    const m = await publicClient.readContract({
      address: MARKET_FACTORY,
      abi: FACTORY_ABI,
      functionName: "getMarket",
      args: [marketId],
    });

    let pipelineConfig = null;
    try {
      const cfg = await publicClient.readContract({
        address: ORACLE_PIPELINE,
        abi: PIPELINE_ABI,
        functionName: "getPipelineConfig",
        args: [marketId],
      });
      pipelineConfig = {
        pipelineType: PipelineLabels[cfg.pipelineType],
        priceFeedAddress: cfg.priceFeedAddress,
        priceThreshold: cfg.priceThreshold.toString(),
        isAbove: cfg.isAbove,
        dataStreamId: cfg.dataStreamId,
        functionsScript: cfg.functionsScript,
        aiPromptHash: cfg.aiPromptHash,
        requiredAgreement: cfg.requiredAgreement,
      };
    } catch {}

    res.json({
      marketId: Number(marketId),
      creator: m.creator,
      question: m.question,
      category: CategoryLabels[m.category],
      pipelineType: PipelineLabels[m.pipelineType],
      status: StatusLabels[m.status],
      resolvedOutcome: m.status === 3 ? OutcomeLabels[m.resolvedOutcome] : null,
      yesPool: formatEther(m.yesPool),
      noPool: formatEther(m.noPool),
      totalPool: formatEther(m.totalPool),
      confidence: Number(m.confidence),
      deadline: Number(m.deadline),
      createdAt: Number(m.createdAt),
      pipelineConfig,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/portfolio/:address — user's positions
app.get("/api/portfolio/:address", async (req, res) => {
  try {
    const address = req.params.address as `0x${string}`;
    const nextId = await publicClient.readContract({
      address: MARKET_FACTORY,
      abi: FACTORY_ABI,
      functionName: "nextMarketId",
    });

    // Note: In production, this would use events/indexer for efficiency
    res.json({
      address,
      totalMarkets: Number(nextId),
      message: "Portfolio tracking available via on-chain events. Connect wallet in frontend.",
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/pipelines — available pipeline types
app.get("/api/pipelines", (_req, res) => {
  res.json({
    pipelines: [
      {
        type: "PRICE_FEED",
        label: "Price Feed",
        description: "Resolve using Chainlink Data Feeds. Best for crypto price threshold markets.",
        params: ["priceFeedAddress", "priceThreshold", "isAbove"],
        confidence: "Deterministic (100%)",
        color: "#FBBF24",
      },
      {
        type: "DATA_STREAM",
        label: "Data Stream",
        description: "Real-time sub-second price resolution via Chainlink Data Streams.",
        params: ["dataStreamId", "priceThreshold", "isAbove"],
        confidence: "Deterministic (100%)",
        color: "#F97316",
      },
      {
        type: "FUNCTIONS_API",
        label: "Functions API",
        description: "Custom JavaScript execution for API-based resolution (sports, weather, elections).",
        params: ["functionsScript"],
        confidence: "Variable (60-95%)",
        color: "#EC4899",
      },
      {
        type: "AI_GROUNDED",
        label: "AI Grounded",
        description: "Gemini AI with search grounding for general world event verification.",
        params: ["aiPromptHash"],
        confidence: "Variable (60-90%)",
        color: "#8B5CF6",
      },
      {
        type: "COMPOSITE",
        label: "Composite",
        description: "Multi-source pipeline requiring N-of-M agreement (Data Feeds + AI + Functions).",
        params: ["requiredAgreement", "priceFeedAddress", "aiPromptHash"],
        confidence: "High (75-100%)",
        color: "#06B6D4",
      },
    ],
  });
});

// GET /api/stats — platform statistics
app.get("/api/stats", async (_req, res) => {
  try {
    const nextId = await publicClient.readContract({
      address: MARKET_FACTORY,
      abi: FACTORY_ABI,
      functionName: "nextMarketId",
    });

    const featuredId = await publicClient.readContract({
      address: MARKET_FACTORY,
      abi: FACTORY_ABI,
      functionName: "featuredMarketId",
    });

    res.json({
      totalMarkets: Number(nextId),
      featuredMarketId: Number(featuredId),
      pipelineTypes: 5,
      chainlinkServices: 8,
      chain: "Base Sepolia (84532)",
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/health
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "omnioracle-x402-server",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║          OmniOracle x402 Server              ║
║      Composable Oracle Pipelines             ║
╠══════════════════════════════════════════════╣
║  Port: ${PORT}                                  ║
║  Chain: Base Sepolia (84532)                 ║
╠══════════════════════════════════════════════╣
║  POST /api/create-market     ($0.01 USDC)    ║
║  POST /api/request-resolution ($0.005 USDC)  ║
║  GET  /api/markets                           ║
║  GET  /api/markets/:id                       ║
║  GET  /api/portfolio/:address                ║
║  GET  /api/pipelines                         ║
║  GET  /api/stats                             ║
║  GET  /api/health                            ║
╚══════════════════════════════════════════════╝
  `);
});
