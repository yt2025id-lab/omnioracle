import { createWalletClient, http, publicActions } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

export function createOmniOracleClient(privateKey: string) {
  const account = privateKeyToAccount(`0x${privateKey}` as `0x${string}`);

  return createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"),
  }).extend(publicActions);
}
