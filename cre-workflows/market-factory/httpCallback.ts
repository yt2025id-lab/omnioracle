import type CRE from "@anthropic-ai/cre-sdk";
import type { GeminiLLM, EVMClient } from "@anthropic-ai/cre-sdk";
import { encodeAbiParameters, parseAbiParameters, keccak256, toBytes } from "viem";
import { validateMarketQuestion } from "./gemini";

export async function httpCallback(
  trigger: any,
  cre: CRE,
  gemini: GeminiLLM,
  evmClient: EVMClient
) {
  const { question, category, deadline, pipelineType, pipelineConfig } = trigger.body;

  console.log(`[market-factory] HTTP request: "${question}" (pipeline: ${pipelineType})`);

  // Validate question via Gemini
  const validation = await validateMarketQuestion(gemini, question, category);

  if (!validation.isValid) {
    console.log(`[market-factory] Question rejected: ${validation.reason}`);
    return { status: 400, body: { error: validation.reason } };
  }

  // Map pipeline type string to enum index
  const pipelineTypeMap: Record<string, number> = {
    PRICE_FEED: 0,
    DATA_STREAM: 1,
    FUNCTIONS_API: 2,
    AI_GROUNDED: 3,
    COMPOSITE: 4,
  };
  const pipelineTypeIndex = pipelineTypeMap[pipelineType] ?? 3;

  // Map category string to enum index
  const categoryMap: Record<string, number> = {
    CRYPTO: 0,
    SPORTS: 1,
    POLITICS: 2,
    SCIENCE: 3,
    ENTERTAINMENT: 4,
    CUSTOM: 5,
  };
  const categoryIndex = categoryMap[category] ?? 5;

  // Encode 0x00 report — create market
  const payload = encodeAbiParameters(
    parseAbiParameters(
      "string, uint8, uint256, uint8, address, int256, bool, bytes32"
    ),
    [
      validation.refinedQuestion || question,
      categoryIndex,
      BigInt(deadline),
      pipelineTypeIndex,
      pipelineConfig?.priceFeedAddress || "0x0000000000000000000000000000000000000000",
      BigInt(pipelineConfig?.priceThreshold || 0),
      pipelineConfig?.isAbove ?? false,
      pipelineConfig?.aiPromptHash || keccak256(toBytes(question)),
    ]
  );

  const actionByte = new Uint8Array([0x00]);
  const payloadBytes = new Uint8Array(
    Buffer.from(payload.slice(2), "hex")
  );
  const report = new Uint8Array(actionByte.length + payloadBytes.length);
  report.set(actionByte);
  report.set(payloadBytes, 1);

  // Sign and write report
  const signed = await cre.report.sign(report, "ecdsa_secp256k1_keccak256");
  await evmClient.writeReport(signed);

  console.log(`[market-factory] Market created on-chain: "${question}" (pipeline: ${pipelineType})`);

  return {
    status: 200,
    body: { success: true, question: validation.refinedQuestion || question, pipelineType },
  };
}
