"use client";

import { useReadContract } from "wagmi";
import { CONTRACTS, FACTORY_ABI } from "@/lib/contracts";

const CHAINS = [
  { name: "Base Sepolia", selector: "10344971235874465080", icon: "🔵", status: "Active (Home)" },
  { name: "Ethereum Sepolia", selector: "16015286601757825753", icon: "⬡", status: "CCIP Mirror" },
  { name: "Arbitrum Sepolia", selector: "3478487238524512106", icon: "🔷", status: "Planned" },
  { name: "Optimism Sepolia", selector: "5224473277236331295", icon: "🔴", status: "Planned" },
];

export default function ExplorerPage() {
  const { data: nextMarketId } = useReadContract({
    address: CONTRACTS.marketFactory,
    abi: FACTORY_ABI,
    functionName: "nextMarketId",
  });

  const totalMarkets = nextMarketId ? Number(nextMarketId) : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Cross-Chain Explorer</h1>
        <p className="text-sm text-gray-400 mt-1">
          OmniOracle markets mirrored across chains via Chainlink CCIP.
        </p>
      </div>

      {/* CCIP info */}
      <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-600/30 flex items-center justify-center text-2xl">
            🔗
          </div>
          <div>
            <h2 className="font-bold text-sm">Chainlink CCIP Integration</h2>
            <p className="text-xs text-gray-400 mt-1">
              Markets created on Base Sepolia are automatically mirrored to other chains via CCIP.
              Users on any supported chain can view markets and place cross-chain bets.
              Resolution results are synced back to all participating chains.
            </p>
          </div>
        </div>
      </div>

      {/* Chain grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {CHAINS.map((chain) => (
          <div key={chain.name} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{chain.icon}</span>
                <div>
                  <p className="font-bold text-sm">{chain.name}</p>
                  <p className="text-xs text-gray-500 font-mono">Selector: {chain.selector.slice(0, 8)}...</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                chain.status === "Active (Home)"
                  ? "text-green-400 bg-green-400/10"
                  : chain.status === "CCIP Mirror"
                  ? "text-cyan-400 bg-cyan-400/10"
                  : "text-gray-500 bg-gray-800"
              }`}>
                {chain.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-purple-400">
                  {chain.status === "Active (Home)" ? totalMarkets : 0}
                </p>
                <p className="text-xs text-gray-500">Markets</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-cyan-400">
                  {chain.status === "Active (Home)" ? "Live" : "—"}
                </p>
                <p className="text-xs text-gray-500">Status</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-bold mb-4">How Cross-Chain Markets Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-cyan-400 mb-1">1. Mirror</p>
            <p className="text-xs text-gray-400">
              Market metadata is sent to other chains via CCIP. Users can see available markets on any chain.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-purple-400 mb-1">2. Bet Cross-Chain</p>
            <p className="text-xs text-gray-400">
              Users on Ethereum Sepolia can place bets on Base Sepolia markets. CCIP routes the bet to the home chain.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-green-400 mb-1">3. Sync Results</p>
            <p className="text-xs text-gray-400">
              When a market resolves, the result is synced back to all chains where the market was mirrored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
