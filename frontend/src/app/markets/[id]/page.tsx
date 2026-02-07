"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import { CONTRACTS, FACTORY_ABI, PipelineLabel, PipelineColor, CategoryLabel, StatusLabel, OutcomeLabel } from "@/lib/contracts";

const PIPELINE_NODES: Record<number, { steps: string[]; colors: string[] }> = {
  0: { steps: ["Data Feed", "Threshold Check", "Resolve"], colors: ["bg-yellow-500", "bg-yellow-400", "bg-green-500"] },
  1: { steps: ["Data Stream", "Real-time Price", "Resolve"], colors: ["bg-orange-500", "bg-orange-400", "bg-green-500"] },
  2: { steps: ["Functions JS", "API Call", "Parse Result", "Resolve"], colors: ["bg-pink-500", "bg-pink-400", "bg-pink-300", "bg-green-500"] },
  3: { steps: ["Gemini AI", "Search Grounding", "Confidence Check", "Resolve"], colors: ["bg-purple-500", "bg-purple-400", "bg-purple-300", "bg-green-500"] },
  4: { steps: ["Data Feed", "Gemini AI", "Agreement Check", "Resolve"], colors: ["bg-yellow-500", "bg-purple-500", "bg-cyan-400", "bg-green-500"] },
};

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = Number(params.id);
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const [betAmount, setBetAmount] = useState("0.01");

  const { data: market, isLoading } = useReadContract({
    address: CONTRACTS.marketFactory,
    abi: FACTORY_ABI,
    functionName: "getMarket",
    args: [BigInt(marketId)],
  });

  if (isLoading || !market) {
    return <div className="text-center py-20 text-gray-400"><p>Loading market #{marketId}...</p></div>;
  }

  const status = StatusLabel[market.status] || "Unknown";
  const pipeline = PipelineLabel[market.pipelineType] || "Unknown";
  const pipelineColor = PipelineColor[market.pipelineType] || "text-gray-400";
  const category = CategoryLabel[market.category] || "Custom";
  const outcome = OutcomeLabel[market.resolvedOutcome] || "—";
  const yesPercent = market.totalPool > 0n
    ? Math.round(Number((market.yesPool * 100n) / market.totalPool))
    : 50;

  const pipelineViz = PIPELINE_NODES[market.pipelineType] || PIPELINE_NODES[3];

  const handlePredict = (isYes: boolean) => {
    writeContract({
      address: CONTRACTS.marketFactory,
      abi: FACTORY_ABI,
      functionName: "predict",
      args: [BigInt(marketId), isYes],
      value: parseEther(betAmount),
    });
  };

  const handleRequestResolution = () => {
    writeContract({
      address: CONTRACTS.marketFactory,
      abi: FACTORY_ABI,
      functionName: "requestResolution",
      args: [BigInt(marketId)],
    });
  };

  const handleClaim = () => {
    writeContract({
      address: CONTRACTS.marketFactory,
      abi: FACTORY_ABI,
      functionName: "claim",
      args: [BigInt(marketId)],
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-gray-500 text-sm">Market #{marketId}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-800 ${pipelineColor}`}>{pipeline}</span>
          <span className="text-xs bg-gray-800 px-2 py-0.5 rounded">{category}</span>
        </div>
        <h1 className="text-xl font-bold">{market.question}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Pool", value: `${formatEther(market.totalPool)} ETH` },
          { label: "YES Pool", value: `${formatEther(market.yesPool)} ETH` },
          { label: "NO Pool", value: `${formatEther(market.noPool)} ETH` },
          { label: "Status", value: status },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-purple-400">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pool bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>YES {yesPercent}%</span>
          <span>NO {100 - yesPercent}%</span>
        </div>
        <div className="w-full bg-red-500/30 rounded-full h-4 overflow-hidden">
          <div className="bg-green-500 h-4 rounded-l-full" style={{ width: `${yesPercent}%` }} />
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
        <h2 className="text-sm font-bold mb-4">Oracle Pipeline: <span className={pipelineColor}>{pipeline}</span></h2>
        <div className="flex items-center gap-2 overflow-x-auto">
          {pipelineViz.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`${pipelineViz.colors[i]} text-black text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap`}>
                {step}
              </div>
              {i < pipelineViz.steps.length - 1 && (
                <div className="text-gray-500 text-lg">→</div>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          This market will be resolved using the {pipeline} pipeline.
          {market.pipelineType === 0 && " Chainlink Data Feeds provide deterministic, tamper-proof price data."}
          {market.pipelineType === 3 && " Gemini AI with web search grounding provides fact-checked verification."}
          {market.pipelineType === 4 && " Multiple data sources must agree for resolution (2-of-3 consensus)."}
        </p>
      </div>

      {/* Bet interface */}
      {status === "Open" && address && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-sm font-bold mb-4">Place Your Prediction</h2>
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm w-32 focus:border-purple-500 focus:outline-none"
              placeholder="0.01"
            />
            <span className="text-sm text-gray-400">ETH</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handlePredict(true)}
              className="flex-1 bg-green-600 hover:bg-green-500 text-sm font-bold py-3 rounded-lg transition-colors">
              Predict YES
            </button>
            <button onClick={() => handlePredict(false)}
              className="flex-1 bg-red-600 hover:bg-red-500 text-sm font-bold py-3 rounded-lg transition-colors">
              Predict NO
            </button>
          </div>
        </div>
      )}

      {/* Details */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-8">
        <h2 className="text-sm font-bold mb-3">Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Creator</p>
            <p className="font-mono text-xs mt-0.5">{market.creator.slice(0, 6)}...{market.creator.slice(-4)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Created</p>
            <p className="text-xs mt-0.5">{new Date(Number(market.createdAt) * 1000).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Deadline</p>
            <p className="text-xs mt-0.5">{new Date(Number(market.deadline) * 1000).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Confidence</p>
            <p className="text-xs mt-0.5">{market.status === 3 ? `${(Number(market.confidence) / 100).toFixed(1)}%` : "—"}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {status === "Open" && (
          <button onClick={handleRequestResolution}
            className="bg-blue-600 hover:bg-blue-500 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Request Resolution
          </button>
        )}
        {status === "Resolved" && address && (
          <button onClick={handleClaim}
            className="bg-green-600 hover:bg-green-500 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Claim Winnings
          </button>
        )}
      </div>
    </div>
  );
}
