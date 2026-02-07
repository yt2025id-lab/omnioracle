import { type Address } from "viem";
import { baseSepolia } from "viem/chains";

export const CONTRACTS = {
  marketFactory: (process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as Address,
  oraclePipeline: (process.env.NEXT_PUBLIC_ORACLE_PIPELINE_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as Address,
  omniResolver: (process.env.NEXT_PUBLIC_OMNI_RESOLVER_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as Address,
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
] as const;
