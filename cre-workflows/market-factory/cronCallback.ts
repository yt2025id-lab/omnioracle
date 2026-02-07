import type CRE from "@anthropic-ai/cre-sdk";
import type { GeminiLLM, EVMClient } from "@anthropic-ai/cre-sdk";
import { encodeAbiParameters, parseAbiParameters, keccak256, toBytes } from "viem";
import { generateMarketIdeas } from "./gemini";

export async function cronCallback(
  _trigger: any,
  cre: CRE,
  gemini: GeminiLLM,
  evmClient: EVMClient
) {
  console.log("[market-factory] Cron triggered — generating trending market ideas");

  const ideas = await generateMarketIdeas(gemini);

  for (const idea of ideas) {
    console.log(`[market-factory] Auto-creating: "${idea.question}" (pipeline: ${idea.pipelineType})`);

    const pipelineTypeMap: Record<string, number> = {
      PRICE_FEED: 0,
      DATA_STREAM: 1,
      FUNCTIONS_API: 2,
      AI_GROUNDED: 3,
      COMPOSITE: 4,
    };

    const categoryMap: Record<string, number> = {
      CRYPTO: 0,
      SPORTS: 1,
      POLITICS: 2,
      SCIENCE: 3,
      ENTERTAINMENT: 4,
      CUSTOM: 5,
    };

    const deadlineSeconds = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

    const payload = encodeAbiParameters(
      parseAbiParameters(
        "string, uint8, uint256, uint8, address, int256, bool, bytes32"
      ),
      [
        idea.question,
        categoryMap[idea.category] ?? 5,
        BigInt(deadlineSeconds),
        pipelineTypeMap[idea.pipelineType] ?? 3,
        "0x0000000000000000000000000000000000000000",
        BigInt(0),
        false,
        keccak256(toBytes(idea.question)),
      ]
    );

    const actionByte = new Uint8Array([0x00]);
    const payloadBytes = new Uint8Array(Buffer.from(payload.slice(2), "hex"));
    const report = new Uint8Array(actionByte.length + payloadBytes.length);
    report.set(actionByte);
    report.set(payloadBytes, 1);

    const signed = await cre.report.sign(report, "ecdsa_secp256k1_keccak256");
    await evmClient.writeReport(signed);
  }

  console.log(`[market-factory] Created ${ideas.length} markets`);
}
