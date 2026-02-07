"use client";

import { useState } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { CONTRACTS, FACTORY_ABI, PipelineLabel, PipelineColor, CategoryLabel, StatusLabel } from "@/lib/contracts";

function MarketCard({ marketId }: { marketId: number }) {
  const { data: market } = useReadContract({
    address: CONTRACTS.marketFactory,
    abi: FACTORY_ABI,
    functionName: "getMarket",
    args: [BigInt(marketId)],
  });

  if (!market) return <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse h-40" />;

  const status = StatusLabel[market.status] || "Unknown";
  const pipeline = PipelineLabel[market.pipelineType] || "Unknown";
  const pipelineColor = PipelineColor[market.pipelineType] || "text-gray-400";
  const yesPercent = market.totalPool > 0n
    ? Math.round(Number((market.yesPool * 100n) / market.totalPool))
    : 50;

  const statusColor: Record<string, string> = {
    Open: "text-green-400 bg-green-400/10",
    "Resolution Requested": "text-blue-400 bg-blue-400/10",
    Resolving: "text-yellow-400 bg-yellow-400/10",
    Resolved: "text-purple-400 bg-purple-400/10",
    Disputed: "text-red-400 bg-red-400/10",
    Expired: "text-gray-400 bg-gray-400/10",
  };

  return (
    <Link href={`/markets/${marketId}`} className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-purple-500/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-gray-500">#{marketId}</span>
        <div className="flex gap-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${pipelineColor} bg-gray-800`}>{pipeline}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[status] || "text-gray-400"}`}>{status}</span>
        </div>
      </div>
      <p className="text-sm font-medium mb-3 line-clamp-2">{market.question}</p>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span>{CategoryLabel[market.category] || "Custom"}</span>
        <span>{formatEther(market.totalPool)} ETH</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${yesPercent}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>YES {yesPercent}%</span>
        <span>NO {100 - yesPercent}%</span>
      </div>
    </Link>
  );
}

export default function MarketsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pipelineFilter, setPipelineFilter] = useState("ALL");

  const { data: nextMarketId } = useReadContract({
    address: CONTRACTS.marketFactory,
    abi: FACTORY_ABI,
    functionName: "nextMarketId",
  });

  const totalMarkets = nextMarketId ? Number(nextMarketId) : 0;
  const marketIds = Array.from({ length: totalMarkets }, (_, i) => i);

  const statuses = ["ALL", "Open", "Resolution Requested", "Resolved", "Disputed", "Expired"];
  const pipelines = ["ALL", "Price Feed", "Data Stream", "Functions API", "AI Grounded", "Composite"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Prediction Markets</h1>
          <p className="text-sm text-gray-400 mt-1">{totalMarkets} markets with composable oracle pipelines</p>
        </div>
        <Link href="/create" className="bg-orange-600 hover:bg-orange-500 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Create Market
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex gap-1 flex-wrap">
          {statuses.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${statusFilter === s ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {pipelines.map((p) => (
            <button key={p} onClick={() => setPipelineFilter(p)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${pipelineFilter === p ? "bg-orange-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {totalMarkets === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg mb-2">No markets yet</p>
          <p className="text-sm">Create the first prediction market with a custom oracle pipeline.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketIds.reverse().map((id) => (
            <MarketCard key={id} marketId={id} />
          ))}
        </div>
      )}
    </div>
  );
}
