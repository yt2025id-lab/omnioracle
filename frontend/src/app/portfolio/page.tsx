"use client";

import { useAccount, useReadContract } from "wagmi";
import Link from "next/link";
import { CONTRACTS, FACTORY_ABI } from "@/lib/contracts";

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();

  const { data: nextMarketId } = useReadContract({
    address: CONTRACTS.marketFactory,
    abi: FACTORY_ABI,
    functionName: "nextMarketId",
  });

  const totalMarkets = nextMarketId ? Number(nextMarketId) : 0;

  if (!isConnected) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg mb-2">Connect Your Wallet</p>
        <p className="text-sm">Connect to view your prediction portfolio.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Portfolio</h1>
        <p className="text-sm text-gray-400 mt-1">
          Your predictions across {totalMarkets} markets.
        </p>
        <p className="font-mono text-xs text-gray-500 mt-1">{address}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-purple-400">—</p>
          <p className="text-xs text-gray-500 mt-2">Active Positions</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-green-400">—</p>
          <p className="text-xs text-gray-500 mt-2">Claimable Winnings</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-cyan-400">—</p>
          <p className="text-xs text-gray-500 mt-2">Markets Created</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-bold mb-4">Your Positions</h2>
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm mb-2">
            Position tracking uses on-chain events.
          </p>
          <p className="text-xs">
            Browse{" "}
            <Link href="/markets" className="text-purple-400 underline">markets</Link>
            {" "}to place predictions, or{" "}
            <Link href="/create" className="text-orange-400 underline">create a market</Link>
            {" "}with your own oracle pipeline.
          </p>
        </div>
      </div>
    </div>
  );
}
