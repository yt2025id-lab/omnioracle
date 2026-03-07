import { type Address } from "viem";
import { baseSepolia } from "viem/chains";

export const CONTRACTS = {
  marketFactory: (process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS ||
    "0xd3A85f742CFE6B802A45bCF17c9C07B5adeC02c2") as Address,
  oraclePipeline: (process.env.NEXT_PUBLIC_ORACLE_PIPELINE_ADDRESS ||
    "0x98BB79754e0475046B25CdCfbBdfd863f0e1D2F8") as Address,
  omniResolver: (process.env.NEXT_PUBLIC_OMNI_RESOLVER_ADDRESS ||
    "0xc75168B64808d46Fa25f651E7c2026B49Ad0B555") as Address,
  crossChainRegistry: (process.env.NEXT_PUBLIC_CROSS_CHAIN_REGISTRY_ADDRESS ||
    "0xE0A70aaE7FceDfE9479Ac2C298364b830152b693") as Address,
  autoResolver: (process.env.NEXT_PUBLIC_AUTO_RESOLVER_ADDRESS ||
    "0x35b872462CeE8fcBAa5dC26fF1eD412f0938FE00") as Address,
};

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

export const CHAIN = baseSepolia;

export const PipelineLabel: Record<number, string> = {
  0: "Price Feed",
  1: "Data Stream",
  2: "Functions API",
  3: "AI Grounded",
  4: "Composite",
};

export const PipelineColor: Record<number, string> = {
  0: "text-yellow-400",
  1: "text-orange-400",
  2: "text-pink-400",
  3: "text-purple-400",
  4: "text-cyan-400",
};

export const CategoryLabel: Record<number, string> = {
  0: "Crypto",
  1: "Sports",
  2: "Politics",
  3: "Science",
  4: "Entertainment",
  5: "Custom",
};

export const StatusLabel: Record<number, string> = {
  0: "Open",
  1: "Resolution Requested",
  2: "Resolving",
  3: "Resolved",
  4: "Disputed",
  5: "Expired",
};

export const OutcomeLabel: Record<number, string> = {
  0: "YES",
  1: "NO",
  2: "INVALID",
};

export const FACTORY_ABI = [
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
  {
    name: "totalFeesCollected",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "predict",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "isYes", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "requestResolution",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "claim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "disputeResolution",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "expireMarket",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [],
  },
  // Chainlink VRF v2.5
  {
    name: "vrfCoordinator",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "vrfSubscriptionId",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "requestFeaturedMarket",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "candidates", type: "uint256[]" }],
    outputs: [{ name: "requestId", type: "uint256" }],
  },
  // Events
  {
    name: "MarketCreated",
    type: "event",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true },
      { name: "question", type: "string", indexed: false },
      { name: "pipelineType", type: "uint8", indexed: false },
    ],
  },
  {
    name: "PredictionPlaced",
    type: "event",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "isYes", type: "bool", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "MarketResolved",
    type: "event",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true },
      { name: "outcome", type: "uint8", indexed: false },
      { name: "confidence", type: "uint16", indexed: false },
    ],
  },
  {
    name: "FeaturedMarketSelected",
    type: "event",
    inputs: [
      { name: "requestId", type: "uint256", indexed: true },
      { name: "marketId", type: "uint256", indexed: true },
      { name: "randomness", type: "uint256", indexed: false },
    ],
  },
] as const;

// CrossChainRegistry ABI — Chainlink CCIP
export const CROSS_CHAIN_REGISTRY_ABI = [
  {
    name: "mirrorMarket",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "destChainSelector", type: "uint64" },
      { name: "destReceiver", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "estimateFee",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "destChainSelector", type: "uint64" },
      { name: "destReceiver", type: "address" },
    ],
    outputs: [{ name: "fee", type: "uint256" }],
  },
  {
    name: "totalMirrored",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getIncomingMarketsCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "isMirrored",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "chainSelector", type: "uint64" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "MarketMirrored",
    type: "event",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true },
      { name: "destChainSelector", type: "uint64", indexed: true },
      { name: "ccipMessageId", type: "bytes32", indexed: false },
    ],
  },
] as const;

// AutoResolver ABI — Chainlink Automation
export const AUTO_RESOLVER_ABI = [
  {
    name: "checkUpkeep",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "bytes" }],
    outputs: [
      { name: "upkeepNeeded", type: "bool" },
      { name: "performData", type: "bytes" },
    ],
  },
  {
    name: "performUpkeep",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "performData", type: "bytes" }],
    outputs: [],
  },
] as const;

// CCIP Chain Selectors
export const CCIP_CHAIN_SELECTORS: Record<string, bigint> = {
  "Ethereum Sepolia": 16015286601757825753n,
  "Arbitrum Sepolia": 3478487238524512106n,
  "Avalanche Fuji":   14767482510784806043n,
  "Polygon Amoy":     16281711391670634445n,
};
