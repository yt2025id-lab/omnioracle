import type CRE from "@anthropic-ai/cre-sdk";
import type { EVMClient } from "@anthropic-ai/cre-sdk";
import {
  encodeAbiParameters,
  parseAbiParameters,
  decodeAbiParameters,
} from "viem";

const MARKET_FACTORY = "${MARKET_FACTORY_ADDRESS}";
const CROSS_CHAIN_REGISTRY = "${CROSS_CHAIN_REGISTRY_ADDRESS}";

// Ethereum Sepolia chain selector for CCIP
const ETH_SEPOLIA_SELECTOR = BigInt("16015286601757825753");

export async function cronCallback(
  _trigger: any,
  cre: CRE,
  evmClient: EVMClient
) {
  console.log("[cross-chain-sync] Cron triggered — syncing markets across chains");

  // Read nextMarketId to know how many markets exist
  const nextIdResult = await evmClient.callContract({
    to: MARKET_FACTORY,
    data: "0x2862b2d8", // nextMarketId() selector
  });

  const nextMarketId = decodeAbiParameters(
    parseAbiParameters("uint256"),
    nextIdResult
  )[0];

  const totalMarkets = Number(nextMarketId);
  console.log(`[cross-chain-sync] Total markets: ${totalMarkets}`);

  let syncCount = 0;

  // Scan recent markets for ones that haven't been mirrored yet
  const scanStart = Math.max(0, totalMarkets - 20); // scan last 20

  for (let i = scanStart; i < totalMarkets; i++) {
    try {
      // Check if market is OPEN
      const marketResult = await evmClient.callContract({
        to: MARKET_FACTORY,
        data: encodeAbiParameters(parseAbiParameters("bytes4, uint256"), [
          "0x" as any,
          BigInt(i),
        ]),
      });

      // Check if already mirrored to Eth Sepolia
      const mirroredResult = await evmClient.callContract({
        to: CROSS_CHAIN_REGISTRY,
        data: encodeAbiParameters(
          parseAbiParameters("bytes4, uint256, uint64"),
          ["0x" as any, BigInt(i), ETH_SEPOLIA_SELECTOR]
        ),
      });

      const isMirrored = decodeAbiParameters(
        parseAbiParameters("bool"),
        mirroredResult
      )[0];

      if (!isMirrored) {
        // In production: call CrossChainRegistry.mirrorMarket via CCIP
        // For hackathon: log the sync action
        console.log(`[cross-chain-sync] Would mirror market #${i} to Eth Sepolia via CCIP`);
        syncCount++;
      }
    } catch (e) {
      console.log(`[cross-chain-sync] Error checking market #${i}, skipping`);
    }
  }

  console.log(`[cross-chain-sync] Sync complete: ${syncCount} markets need mirroring`);
}
