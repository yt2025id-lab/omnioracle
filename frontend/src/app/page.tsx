"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import { CONTRACTS, FACTORY_ABI, PipelineLabel, PipelineColor } from "@/lib/contracts";

const SERVICES = [
  { name: "CRE", desc: "3 workflows: market creation, oracle resolution, cross-chain sync", color: "text-blue-400" },
  { name: "x402", desc: "USDC micropayments for market creation & resolution", color: "text-green-400" },
  { name: "Data Feeds", desc: "ETH/USD, BTC/USD threshold-based price resolution", color: "text-yellow-400" },
  { name: "Data Streams", desc: "Sub-second real-time price for time-sensitive markets", color: "text-orange-400" },
  { name: "Functions", desc: "Custom JS for API-based resolution (sports, weather)", color: "text-pink-400" },
  { name: "CCIP", desc: "Mirror markets across chains, cross-chain bets", color: "text-cyan-400" },
  { name: "VRF v2.5", desc: "Random featured market selection & tiebreakers", color: "text-purple-400" },
  { name: "Automation", desc: "Auto-trigger resolution when deadlines expire", color: "text-red-400" },
];

const PIPELINES = [
  { name: "Price Feed", desc: "Chainlink Data Feeds for crypto price thresholds", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { name: "Data Stream", desc: "Real-time sub-second price data", color: "text-orange-400", bg: "bg-orange-400/10" },
  { name: "Functions API", desc: "Custom JS for external APIs", color: "text-pink-400", bg: "bg-pink-400/10" },
  { name: "AI Grounded", desc: "Gemini AI with search grounding", color: "text-purple-400", bg: "bg-purple-400/10" },
  { name: "Composite", desc: "Multi-source N-of-M agreement", color: "text-cyan-400", bg: "bg-cyan-400/10" },
];

export default function Dashboard() {
  const { data: nextMarketId } = useReadContract({
    address: CONTRACTS.marketFactory,
    abi: FACTORY_ABI,
    functionName: "nextMarketId",
  });

  const totalMarkets = nextMarketId ? Number(nextMarketId) : 0;

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent">
          OmniOracle
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Permissionless prediction market factory with composable oracle pipelines.
          Choose how your market gets resolved — from deterministic Data Feeds to AI consensus.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: "Total Markets", value: totalMarkets },
          { label: "Pipeline Types", value: 5 },
          { label: "Chainlink Services", value: 8 },
          { label: "Chain", value: "Base Sepolia" },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-purple-900/20 to-orange-900/20 border border-purple-500/20 rounded-xl p-6 mb-12">
        <h2 className="text-lg font-bold mb-4">How OmniOracle Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: "1", title: "Create", desc: "Anyone creates a market and selects an oracle pipeline" },
            { step: "2", title: "Bet", desc: "Users place YES/NO predictions with ETH" },
            { step: "3", title: "Resolve", desc: "CRE executes the chosen pipeline (Data Feeds, AI, Composite)" },
            { step: "4", title: "Claim", desc: "Winners claim proportional payouts, 2% platform fee" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center mx-auto mb-2">
                {item.step}
              </div>
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <h2 className="text-lg font-bold mb-4">5 Oracle Pipeline Types</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-12">
        {PIPELINES.map((p) => (
          <div key={p.name} className={`bg-gray-900 border border-gray-800 rounded-lg p-3 ${p.bg}`}>
            <p className={`font-bold text-sm ${p.color}`}>{p.name}</p>
            <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-4">8 Chainlink Services Integrated</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
        {SERVICES.map((s) => (
          <div key={s.name} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <p className={`font-bold text-sm ${s.color}`}>{s.name}</p>
            <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/markets" className="bg-purple-600 hover:bg-purple-500 rounded-xl p-6 text-center transition-colors">
          <p className="font-bold text-lg">Browse Markets</p>
          <p className="text-sm text-purple-200 mt-1">Bet on existing prediction markets</p>
        </Link>
        <Link href="/create" className="bg-orange-600 hover:bg-orange-500 rounded-xl p-6 text-center transition-colors">
          <p className="font-bold text-lg">Create Market</p>
          <p className="text-sm text-orange-200 mt-1">Build your own oracle pipeline</p>
        </Link>
        <Link href="/explorer" className="bg-cyan-600 hover:bg-cyan-500 rounded-xl p-6 text-center transition-colors">
          <p className="font-bold text-lg">Cross-Chain Explorer</p>
          <p className="text-sm text-cyan-200 mt-1">Markets mirrored across chains</p>
        </Link>
      </div>
    </div>
  );
}
