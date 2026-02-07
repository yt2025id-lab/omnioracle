"use client";

import { useState } from "react";
import { useWriteContract, useAccount } from "wagmi";
import { parseEther } from "viem";
import { CONTRACTS, FACTORY_ABI } from "@/lib/contracts";

const PIPELINE_OPTIONS = [
  {
    type: 0, label: "Price Feed", color: "border-yellow-500",
    desc: "Resolve using Chainlink Data Feeds. Best for crypto price threshold markets.",
    fields: ["priceFeedAddress", "priceThreshold", "isAbove"],
  },
  {
    type: 1, label: "Data Stream", color: "border-orange-500",
    desc: "Real-time sub-second price resolution. For time-sensitive markets.",
    fields: ["dataStreamId", "priceThreshold", "isAbove"],
  },
  {
    type: 2, label: "Functions API", color: "border-pink-500",
    desc: "Custom JavaScript for API-based resolution (sports, weather, elections).",
    fields: ["functionsScript"],
  },
  {
    type: 3, label: "AI Grounded", color: "border-purple-500",
    desc: "Gemini AI with search grounding for general world event verification.",
    fields: [],
  },
  {
    type: 4, label: "Composite", color: "border-cyan-500",
    desc: "Multi-source pipeline requiring N-of-M agreement (Data Feeds + AI).",
    fields: ["requiredAgreement", "priceFeedAddress"],
  },
];

const CATEGORIES = ["Crypto", "Sports", "Politics", "Science", "Entertainment", "Custom"];

const PRICE_FEEDS: Record<string, string> = {
  "ETH/USD": "0x4aDC67d868764F27A76A1C73B3552fa4F21E470b",
  "BTC/USD": "0x0FB99723Aee6f420beAD13e6bBB79024e1BA0013",
  "LINK/USD": "0xb113F5A928BCfF189C998ab20d753a47F9dE5A61",
};

export default function CreateMarketPage() {
  const { isConnected } = useAccount();
  const { writeContract } = useWriteContract();

  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState(0);
  const [deadlineDays, setDeadlineDays] = useState("7");
  const [seedAmount, setSeedAmount] = useState("0.01");
  const [selectedPipeline, setSelectedPipeline] = useState(3); // AI Grounded default
  const [priceFeed, setPriceFeed] = useState("ETH/USD");
  const [priceThreshold, setPriceThreshold] = useState("");
  const [isAbove, setIsAbove] = useState(true);
  const [requiredAgreement, setRequiredAgreement] = useState("2");

  const selectedOption = PIPELINE_OPTIONS.find((p) => p.type === selectedPipeline)!;

  const handleCreate = () => {
    if (!question) return;

    const deadline = BigInt(Math.floor(Date.now() / 1000) + Number(deadlineDays) * 86400);
    const priceFeedAddress = PRICE_FEEDS[priceFeed] || "0x0000000000000000000000000000000000000000";

    const config = {
      pipelineType: selectedPipeline,
      priceFeedAddress: priceFeedAddress as `0x${string}`,
      priceThreshold: BigInt(Math.round(Number(priceThreshold || "0") * 1e8)),
      isAbove,
      dataStreamId: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
      functionsScript: "",
      aiPromptHash: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
      requiredAgreement: Number(requiredAgreement),
    };

    writeContract({
      address: CONTRACTS.marketFactory,
      abi: [
        {
          name: "createMarket",
          type: "function",
          stateMutability: "payable",
          inputs: [
            { name: "question", type: "string" },
            { name: "category", type: "uint8" },
            { name: "deadline", type: "uint256" },
            { name: "pipelineType", type: "uint8" },
            {
              name: "pipelineConfig", type: "tuple",
              components: [
                { name: "pipelineType", type: "uint8" },
                { name: "priceFeedAddress", type: "address" },
                { name: "priceThreshold", type: "int256" },
                { name: "isAbove", type: "bool" },
                { name: "dataStreamId", type: "bytes32" },
                { name: "functionsScript", type: "string" },
                { name: "aiPromptHash", type: "bytes32" },
                { name: "requiredAgreement", type: "uint8" },
              ],
            },
          ],
          outputs: [{ name: "", type: "uint256" }],
        },
      ] as const,
      functionName: "createMarket",
      args: [question, category, deadline, selectedPipeline, config],
      value: parseEther(seedAmount),
    });
  };

  if (!isConnected) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg mb-2">Connect Your Wallet</p>
        <p className="text-sm">Connect your wallet to create a prediction market.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Create Market</h1>
      <p className="text-sm text-gray-400 mb-8">Choose your question and oracle pipeline. The pipeline determines how the market gets resolved.</p>

      {/* Question */}
      <div className="mb-6">
        <label className="text-sm font-medium block mb-2">Market Question</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Will ETH exceed $5000 by March 2026?"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
        />
      </div>

      {/* Category + Deadline + Seed */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          >
            {CATEGORIES.map((c, i) => (
              <option key={c} value={i}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Deadline (days)</label>
          <input
            type="text"
            value={deadlineDays}
            onChange={(e) => setDeadlineDays(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Seed Pool (ETH)</label>
          <input
            type="text"
            value={seedAmount}
            onChange={(e) => setSeedAmount(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Pipeline selection */}
      <div className="mb-6">
        <label className="text-sm font-medium block mb-3">Oracle Pipeline</label>
        <div className="grid grid-cols-1 gap-2">
          {PIPELINE_OPTIONS.map((p) => (
            <button
              key={p.type}
              onClick={() => setSelectedPipeline(p.type)}
              className={`text-left border-2 rounded-xl p-4 transition-all ${
                selectedPipeline === p.type
                  ? `${p.color} bg-gray-900`
                  : "border-gray-800 bg-gray-900/50 hover:border-gray-600"
              }`}
            >
              <p className="font-bold text-sm">{p.label}</p>
              <p className="text-xs text-gray-400 mt-1">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline-specific params */}
      {(selectedOption.fields.includes("priceFeedAddress") || selectedOption.fields.includes("priceThreshold")) && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-bold mb-3">Pipeline Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            {selectedOption.fields.includes("priceFeedAddress") && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Price Feed</label>
                <select
                  value={priceFeed}
                  onChange={(e) => setPriceFeed(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                >
                  {Object.keys(PRICE_FEEDS).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            )}
            {selectedOption.fields.includes("priceThreshold") && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Price Threshold ($)</label>
                <input
                  type="text"
                  value={priceThreshold}
                  onChange={(e) => setPriceThreshold(e.target.value)}
                  placeholder="5000"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
            )}
            {selectedOption.fields.includes("isAbove") && (
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Direction</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAbove(true)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium ${isAbove ? "bg-green-600" : "bg-gray-800 text-gray-400"}`}
                  >
                    Price Above Threshold = YES
                  </button>
                  <button
                    onClick={() => setIsAbove(false)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium ${!isAbove ? "bg-red-600" : "bg-gray-800 text-gray-400"}`}
                  >
                    Price Below Threshold = YES
                  </button>
                </div>
              </div>
            )}
            {selectedOption.fields.includes("requiredAgreement") && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Required Agreement (N-of-M)</label>
                <input
                  type="text"
                  value={requiredAgreement}
                  onChange={(e) => setRequiredAgreement(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={!question}
        className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 font-bold py-3 rounded-xl transition-colors"
      >
        Create Market ({seedAmount} ETH)
      </button>
    </div>
  );
}
