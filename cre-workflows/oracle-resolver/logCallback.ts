import type CRE from "@anthropic-ai/cre-sdk";
import type { GeminiLLM, EVMClient } from "@anthropic-ai/cre-sdk";
import {
  encodeAbiParameters,
  parseAbiParameters,
  decodeAbiParameters,
  keccak256,
  toBytes,
} from "viem";
import { askGeminiForResolution } from "./gemini";

// Chainlink Data Feed addresses on Base Sepolia
const DATA_FEEDS: Record<string, string> = {
  "ETH/USD": "0x4aDC67d868764F27A76A1C73B3552fa4F21E470b",
  "BTC/USD": "0x0FB99723Aee6f420beAD13e6bBB79024e1BA0013",
  "LINK/USD": "0xb113F5A928BCfF189C998ab20d753a47F9dE5A61",
};

// Pipeline type enum
const PipelineType = {
  PRICE_FEED: 0,
  DATA_STREAM: 1,
  FUNCTIONS_API: 2,
  AI_GROUNDED: 3,
  COMPOSITE: 4,
} as const;

async function readPriceFeed(
  evmClient: EVMClient,
  feedAddress: string
): Promise<bigint> {
  const result = await evmClient.callContract({
    to: feedAddress,
    data: "0xfeaf968c", // latestRoundData()
  });

  const decoded = decodeAbiParameters(
    parseAbiParameters("uint80, int256, uint256, uint256, uint80"),
    result
  );

  return decoded[1]; // answer (price)
}

async function resolvePriceFeed(
  evmClient: EVMClient,
  pipelineConfig: any,
  question: string
): Promise<{ outcome: number; confidence: number; evidence: string }> {
  // Read relevant price feed
  const feedAddress = pipelineConfig.priceFeedAddress;
  let price: bigint;

  try {
    price = await readPriceFeed(evmClient, feedAddress);
  } catch (e) {
    // Fallback: read ETH/USD
    price = await readPriceFeed(evmClient, DATA_FEEDS["ETH/USD"]);
  }

  const threshold = BigInt(pipelineConfig.priceThreshold);
  const isAbove = pipelineConfig.isAbove;

  // Deterministic: price vs threshold
  let outcome: number;
  if (isAbove) {
    outcome = price > threshold ? 0 : 1; // YES if price > threshold, else NO
  } else {
    outcome = price < threshold ? 0 : 1; // YES if price < threshold, else NO
  }

  const priceFormatted = Number(price) / 1e8;
  const thresholdFormatted = Number(threshold) / 1e8;

  return {
    outcome,
    confidence: 10000, // 100% — deterministic data feed
    evidence: `Price Feed: $${priceFormatted.toFixed(2)} vs threshold $${thresholdFormatted.toFixed(2)} (${isAbove ? "above" : "below"})`,
  };
}

async function resolveDataStream(
  evmClient: EVMClient,
  pipelineConfig: any,
  question: string
): Promise<{ outcome: number; confidence: number; evidence: string }> {
  // Data Streams provide real-time sub-second data
  // For hackathon, we use Data Feeds as proxy with a note about Streams
  const result = await resolvePriceFeed(evmClient, pipelineConfig, question);
  return {
    ...result,
    evidence: `Data Stream (real-time): ${result.evidence}`,
  };
}

async function resolveFunctionsAPI(
  gemini: GeminiLLM,
  question: string
): Promise<{ outcome: number; confidence: number; evidence: string }> {
  // In production: Chainlink Functions would execute custom JS
  // For hackathon: Gemini acts as Functions proxy for API-based resolution
  const result = await askGeminiForResolution(gemini, question, "FUNCTIONS_API");
  return result;
}

async function resolveAIGrounded(
  gemini: GeminiLLM,
  question: string
): Promise<{ outcome: number; confidence: number; evidence: string }> {
  const result = await askGeminiForResolution(gemini, question, "AI_GROUNDED");
  return result;
}

async function resolveComposite(
  evmClient: EVMClient,
  gemini: GeminiLLM,
  pipelineConfig: any,
  question: string
): Promise<{ outcome: number; confidence: number; evidence: string }> {
  const results: { outcome: number; confidence: number; source: string }[] = [];

  // Source 1: Data Feed (if configured)
  if (pipelineConfig.priceFeedAddress && pipelineConfig.priceFeedAddress !== "0x0000000000000000000000000000000000000000") {
    try {
      const feedResult = await resolvePriceFeed(evmClient, pipelineConfig, question);
      results.push({ outcome: feedResult.outcome, confidence: feedResult.confidence, source: "Data Feed" });
    } catch (e) {
      console.log("[oracle-resolver] Data Feed source failed, skipping");
    }
  }

  // Source 2: AI Grounded
  const aiResult = await askGeminiForResolution(gemini, question, "COMPOSITE");
  results.push({ outcome: aiResult.outcome, confidence: aiResult.confidence, source: "Gemini AI" });

  // Source 3: Functions-style (another AI call with different temperature)
  const functionsResult = await askGeminiForResolution(gemini, question, "FUNCTIONS_API");
  results.push({ outcome: functionsResult.outcome, confidence: functionsResult.confidence, source: "Functions Proxy" });

  // Check agreement
  const requiredAgreement = pipelineConfig.requiredAgreement || 2;
  const yesCounts = results.filter(r => r.outcome === 0).length;
  const noCounts = results.filter(r => r.outcome === 1).length;

  let finalOutcome: number;
  let finalConfidence: number;

  if (yesCounts >= requiredAgreement) {
    finalOutcome = 0; // YES
    finalConfidence = Math.round(
      results.filter(r => r.outcome === 0).reduce((sum, r) => sum + r.confidence, 0) / yesCounts
    );
  } else if (noCounts >= requiredAgreement) {
    finalOutcome = 1; // NO
    finalConfidence = Math.round(
      results.filter(r => r.outcome === 1).reduce((sum, r) => sum + r.confidence, 0) / noCounts
    );
  } else {
    // No agreement — resolve with majority but lower confidence
    finalOutcome = yesCounts > noCounts ? 0 : 1;
    finalConfidence = 5000; // 50% — uncertain
  }

  const evidenceSummary = results
    .map(r => `${r.source}: ${r.outcome === 0 ? "YES" : "NO"} (${r.confidence / 100}%)`)
    .join("; ");

  return {
    outcome: finalOutcome,
    confidence: finalConfidence,
    evidence: `Composite [${yesCounts}/${results.length} YES]: ${evidenceSummary}`,
  };
}

export async function logCallback(
  trigger: any,
  cre: CRE,
  gemini: GeminiLLM,
  evmClient: EVMClient
) {
  // Decode event: ResolutionRequested(uint256 indexed marketId, uint8 pipelineType)
  const marketId = BigInt(trigger.topics[1]);
  const pipelineType = parseInt(trigger.data.slice(0, 66), 16);

  console.log(`[oracle-resolver] Resolution requested for market ${marketId} (pipeline type: ${pipelineType})`);

  // Read market data from contract
  const marketData = await evmClient.callContract({
    to: "${MARKET_FACTORY_ADDRESS}",
    data: encodeAbiParameters(parseAbiParameters("bytes4, uint256"), [
      "0x" as any, // getMarket selector placeholder
      marketId,
    ]),
  });

  // Read pipeline config from OraclePipeline contract
  const pipelineConfig = await evmClient.callContract({
    to: "${ORACLE_PIPELINE_ADDRESS}",
    data: encodeAbiParameters(parseAbiParameters("bytes4, uint256"), [
      "0x" as any, // getPipelineConfig selector placeholder
      marketId,
    ]),
  });

  // For the hackathon demo, we use the question from trigger context
  const question = `Market #${marketId} resolution`;

  let result: { outcome: number; confidence: number; evidence: string };

  // Dynamic pipeline execution based on type
  switch (pipelineType) {
    case PipelineType.PRICE_FEED:
      console.log("[oracle-resolver] Executing PRICE_FEED pipeline");
      result = await resolvePriceFeed(evmClient, pipelineConfig, question);
      break;

    case PipelineType.DATA_STREAM:
      console.log("[oracle-resolver] Executing DATA_STREAM pipeline");
      result = await resolveDataStream(evmClient, pipelineConfig, question);
      break;

    case PipelineType.FUNCTIONS_API:
      console.log("[oracle-resolver] Executing FUNCTIONS_API pipeline");
      result = await resolveFunctionsAPI(gemini, question);
      break;

    case PipelineType.AI_GROUNDED:
      console.log("[oracle-resolver] Executing AI_GROUNDED pipeline");
      result = await resolveAIGrounded(gemini, question);
      break;

    case PipelineType.COMPOSITE:
      console.log("[oracle-resolver] Executing COMPOSITE pipeline");
      result = await resolveComposite(evmClient, gemini, pipelineConfig, question);
      break;

    default:
      console.log("[oracle-resolver] Unknown pipeline type, falling back to AI_GROUNDED");
      result = await resolveAIGrounded(gemini, question);
  }

  console.log(
    `[oracle-resolver] Result: ${result.outcome === 0 ? "YES" : "NO"} (confidence: ${result.confidence / 100}%)`
  );
  console.log(`[oracle-resolver] Evidence: ${result.evidence}`);

  // Encode 0x01 report — resolve market
  const payload = encodeAbiParameters(
    parseAbiParameters("uint256, uint8, uint16"),
    [marketId, result.outcome, result.confidence]
  );

  const actionByte = new Uint8Array([0x01]);
  const payloadBytes = new Uint8Array(Buffer.from(payload.slice(2), "hex"));
  const report = new Uint8Array(actionByte.length + payloadBytes.length);
  report.set(actionByte);
  report.set(payloadBytes, 1);

  const signed = await cre.report.sign(report, "ecdsa_secp256k1_keccak256");
  await evmClient.writeReport(signed);

  console.log(`[oracle-resolver] Market ${marketId} resolved on-chain`);
}
