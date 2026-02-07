import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia } from "viem/chains";

export const config = getDefaultConfig({
  appName: "OmniOracle",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id",
  chains: [baseSepolia],
  ssr: true,
});
