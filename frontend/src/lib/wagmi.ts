import { createConfig, http } from "wagmi";
import { baseSepolia } from "viem/chains";
import { injected, metaMask, coinbaseWallet } from "wagmi/connectors";

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({ appName: "OmniOracle" }),
  ],
  transports: {
    [baseSepolia.id]: http("https://sepolia.base.org"),
  },
  ssr: true,
});
