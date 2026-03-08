"use client";

import { useMemo, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther, isAddress } from "viem";
import { CONTRACTS, FACTORY_ABI } from "@/lib/contracts";

const PIPELINE_OPTIONS = [
  {
    type: 0,
    label: "Price Feed",
    color: "var(--accent-blue)",
    icon: "◐",
    tag: "Deterministic",
    desc: "Resolve using Chainlink Data Feeds. Best for crypto price threshold markets.",
    fields: ["priceFeedAddress", "priceThreshold", "isAbove"],
  },
  {
    type: 1,
    label: "Data Stream",
    color: "#ff6b2b",
    icon: "⚡",
    tag: "Real-time",
    desc: "Real-time sub-second price resolution. For time-sensitive markets.",
    fields: ["dataStreamId", "priceThreshold", "isAbove"],
  },
  {
    type: 2,
    label: "Functions API",
    color: "#e040fb",
    icon: "{ }",
    tag: "Programmable",
    desc: "Custom JavaScript on Chainlink Functions — calls any external API.",
    fields: ["functionsScript"],
  },
  {
    type: 3,
    label: "AI Grounded",
    color: "#06d6f0",
    icon: "✦",
    tag: "AI-powered",
    desc: "Gemini AI with live web search grounding for real-world event verification.",
    fields: ["aiPromptHash"],
  },
  {
    type: 4,
    label: "Composite",
    color: "#00e5a0",
    icon: "⬡",
    tag: "Multi-source",
    desc: "N-of-M consensus — multiple oracle sources must agree to resolve.",
    fields: ["requiredAgreement", "priceFeedAddress", "priceThreshold", "isAbove"],
  },
] as const;

const CATEGORIES = ["Crypto", "Sports", "Politics", "Science", "Entertainment", "Custom"];

const PRICE_FEEDS: Record<string, `0x${string}`> = {
  "ETH/USD": "0x4aDC67d868764F27A76A1C73B3552fa4F21E470b",
  "BTC/USD": "0x0FB99723Aee6f420beAD13e6bBB79024e1BA0013",
  "LINK/USD": "0xb113F5A928BCfF189C998ab20d753a47F9dE5A61",
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

export default function CreateMarketPage() {
  const { isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState(0);
  const [deadlineDays, setDeadlineDays] = useState("7");
  const [seedAmount, setSeedAmount] = useState("0.01");

  // ubah default ke pipeline paling aman
  const [selectedPipeline, setSelectedPipeline] = useState(0);

  const [priceFeed, setPriceFeed] = useState<keyof typeof PRICE_FEEDS>("ETH/USD");
  const [priceThreshold, setPriceThreshold] = useState("");
  const [isAbove, setIsAbove] = useState(true);

  const [dataStreamId, setDataStreamId] = useState(ZERO_BYTES32);
  const [functionsScript, setFunctionsScript] = useState("");
  const [aiPromptHash, setAiPromptHash] = useState(ZERO_BYTES32);
  const [requiredAgreement, setRequiredAgreement] = useState("2");

  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | "">("");

  const sel = useMemo(
    () => PIPELINE_OPTIONS.find((p) => p.type === selectedPipeline)!,
    [selectedPipeline]
  );

  const inp: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 14,
    color: "var(--text-primary)",
    outline: "none",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
    appearance: "none",
  };

  const focus = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    (e.target as HTMLElement).style.borderColor = "rgba(77,163,255,0.4)";
    (e.target as HTMLElement).style.background = "rgba(77,163,255,0.04)";
  };

  const blur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    (e.target as HTMLElement).style.borderColor = "var(--border-default)";
    (e.target as HTMLElement).style.background = "rgba(255,255,255,0.03)";
  };

  function isBytes32(value: string) {
    return /^0x[a-fA-F0-9]{64}$/.test(value);
  }

  function buildPipelineConfig() {
    const pfa = PRICE_FEEDS[priceFeed] ?? ZERO_ADDRESS;
    const thresholdScaled = BigInt(Math.round(Number(priceThreshold || "0") * 1e8));

    switch (selectedPipeline) {
      case 0:
        return {
          pipelineType: 0,
          priceFeedAddress: pfa,
          priceThreshold: thresholdScaled,
          isAbove,
          dataStreamId: ZERO_BYTES32,
          functionsScript: "",
          aiPromptHash: ZERO_BYTES32,
          requiredAgreement: 0,
        } as const;

      case 1:
        return {
          pipelineType: 1,
          priceFeedAddress: ZERO_ADDRESS,
          priceThreshold: thresholdScaled,
          isAbove,
          dataStreamId: dataStreamId as `0x${string}`,
          functionsScript: "",
          aiPromptHash: ZERO_BYTES32,
          requiredAgreement: 0,
        } as const;

      case 2:
        return {
          pipelineType: 2,
          priceFeedAddress: ZERO_ADDRESS,
          priceThreshold: 0n,
          isAbove: false,
          dataStreamId: ZERO_BYTES32,
          functionsScript,
          aiPromptHash: ZERO_BYTES32,
          requiredAgreement: 0,
        } as const;

      case 3:
        return {
          pipelineType: 3,
          priceFeedAddress: ZERO_ADDRESS,
          priceThreshold: 0n,
          isAbove: false,
          dataStreamId: ZERO_BYTES32,
          functionsScript: "",
          aiPromptHash: aiPromptHash as `0x${string}`,
          requiredAgreement: 0,
        } as const;

      case 4:
        return {
          pipelineType: 4,
          priceFeedAddress: pfa,
          priceThreshold: thresholdScaled,
          isAbove,
          dataStreamId: ZERO_BYTES32,
          functionsScript: "",
          aiPromptHash: ZERO_BYTES32,
          requiredAgreement: Number(requiredAgreement),
        } as const;

      default:
        throw new Error("Invalid pipeline type");
    }
  }

  function validateInputs() {
    if (!question.trim()) throw new Error("Question wajib diisi.");
    if (!CONTRACTS?.marketFactory || !isAddress(CONTRACTS.marketFactory)) {
      throw new Error("Address marketFactory tidak valid.");
    }

    const days = Number(deadlineDays);
    if (!Number.isFinite(days) || days <= 0) {
      throw new Error("Deadline days harus angka lebih dari 0.");
    }

    if (!seedAmount || Number(seedAmount) <= 0) {
      throw new Error("Seed Pool harus lebih dari 0.");
    }

    if ((selectedPipeline === 0 || selectedPipeline === 1 || selectedPipeline === 4) && !priceThreshold) {
      throw new Error("Price threshold wajib diisi untuk pipeline ini.");
    }

    if (selectedPipeline === 1 && !isBytes32(dataStreamId)) {
      throw new Error("Data Stream ID harus bytes32 valid (0x + 64 hex).");
    }

    if (selectedPipeline === 2 && !functionsScript.trim()) {
      throw new Error("Functions script wajib diisi.");
    }

    if (selectedPipeline === 3 && !isBytes32(aiPromptHash)) {
      throw new Error("AI Prompt Hash harus bytes32 valid (0x + 64 hex).");
    }

    if (selectedPipeline === 4) {
      const n = Number(requiredAgreement);
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error("Required agreement harus bilangan bulat positif.");
      }
    }
  }

  const handleCreate = async () => {
    setErrorMessage("");
    setTxHash("");

    try {
      validateInputs();

      const deadline = BigInt(
        Math.floor(Date.now() / 1000) + Number(deadlineDays) * 86400
      );

      const config = buildPipelineConfig();

      const hash = await writeContractAsync({
        address: CONTRACTS.marketFactory,
        abi: FACTORY_ABI,
        functionName: "createMarket",
        args: [question.trim(), category, deadline, selectedPipeline, config],
        value: parseEther(seedAmount),
      });

      setTxHash(hash);
    } catch (err: any) {
      console.error("createMarket error:", err);

      const reason =
        err?.shortMessage ||
        err?.details ||
        err?.message ||
        "Transaksi gagal diproses.";

      setErrorMessage(reason);
    }
  };

  if (!isConnected) {
    return (
      <div
        className="page-enter"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 500,
          paddingTop: 48,
        }}
      >
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24,
            padding: "56px 48px",
            textAlign: "center",
            maxWidth: 420,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: "linear-gradient(90deg,transparent,#4da3ff,transparent)",
            }}
          />
          <p style={{ fontSize: 40, marginBottom: 20 }}>⊕</p>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: 24,
              letterSpacing: "-0.03em",
              marginBottom: 12,
            }}
          >
            Connect to Create
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Connect your wallet to create a prediction market with a custom oracle pipeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "0 auto",
        paddingTop: 48,
        paddingBottom: 80,
      }}
      className="page-enter"
    >
      <p
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 12,
        }}
      >
        Create Market
      </p>

      <h1
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(28px, 4vw, 40px)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          marginBottom: 10,
        }}
      >
        New Prediction Market
      </h1>

      <p
        style={{
          fontSize: 14,
          color: "var(--text-secondary)",
          marginBottom: 48,
          lineHeight: 1.7,
        }}
      >
        Pick your question and oracle pipeline. The pipeline determines how the market resolves.
      </p>

      <Section title="Market Question">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Will ETH exceed $5000 by March 2026?"
          rows={3}
          style={{ ...inp, resize: "none", lineHeight: 1.7, fontSize: 15 }}
          onFocus={focus as any}
          onBlur={blur as any}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Be specific and unambiguous
          </span>
          <span
            style={{
              fontSize: 11,
              color: question.length > 0 ? "var(--accent-blue)" : "var(--text-muted)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {question.length}
          </span>
        </div>
      </Section>

      <Section title="Market Settings">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          <div>
            <label style={labelStyle}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(Number(e.target.value))}
              style={inp}
              onFocus={focus as any}
              onBlur={blur as any}
            >
              {CATEGORIES.map((c, ci) => (
                <option key={c} value={ci} style={{ background: "#101010" }}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Deadline (days)</label>
            <input
              type="number"
              min="1"
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(e.target.value)}
              style={inp}
              onFocus={focus}
              onBlur={blur}
            />
          </div>

          <div>
            <label style={labelStyle}>Seed Pool (ETH)</label>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={seedAmount}
              onChange={(e) => setSeedAmount(e.target.value)}
              style={inp}
              onFocus={focus}
              onBlur={blur}
            />
          </div>
        </div>
      </Section>

      <Section title="Oracle Pipeline">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {PIPELINE_OPTIONS.map((p) => (
            <button
              key={p.type}
              type="button"
              onClick={() => setSelectedPipeline(p.type)}
              style={{
                textAlign: "left",
                padding: "18px 20px",
                borderRadius: 14,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                background: selectedPipeline === p.type ? p.color + "08" : "transparent",
                border:
                  selectedPipeline === p.type
                    ? `1px solid ${p.color}30`
                    : "1px solid rgba(255,255,255,0.06)",
                transform: selectedPipeline === p.type ? "translateX(6px)" : "translateX(0)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: p.color + "12",
                    border: `1px solid ${p.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: p.icon === "{ }" ? 10 : 18,
                    color: p.color,
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace",
                    flexShrink: 0,
                  }}
                >
                  {p.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: selectedPipeline === p.type ? p.color : "var(--text-primary)",
                      }}
                    >
                      {p.label}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        padding: "2px 6px",
                        borderRadius: 99,
                        background: p.color + "12",
                        color: p.color,
                        border: `1px solid ${p.color}20`,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {p.tag}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.desc}</span>
                </div>
                {selectedPipeline === p.type && (
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: p.color,
                      boxShadow: `0 0 10px ${p.color}`,
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Pipeline Config">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
          {sel.fields.includes("priceFeedAddress") && (
            <div>
              <label style={labelStyle}>Price Feed</label>
              <select
                value={priceFeed}
                onChange={(e) => setPriceFeed(e.target.value as keyof typeof PRICE_FEEDS)}
                style={inp}
                onFocus={focus as any}
                onBlur={blur as any}
              >
                {Object.keys(PRICE_FEEDS).map((f) => (
                  <option key={f} value={f} style={{ background: "#101010" }}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          )}

          {sel.fields.includes("priceThreshold") && (
            <div>
              <label style={labelStyle}>Threshold ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={priceThreshold}
                onChange={(e) => setPriceThreshold(e.target.value)}
                placeholder="5000"
                style={inp}
                onFocus={focus}
                onBlur={blur}
              />
            </div>
          )}

          {sel.fields.includes("isAbove") && (
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Direction</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { val: true, label: "↑ Above = YES", c: "#00e5a0" },
                  { val: false, label: "↓ Below = YES", c: "#ff4560" },
                ].map((opt) => (
                  <button
                    key={String(opt.val)}
                    type="button"
                    onClick={() => setIsAbove(opt.val)}
                    style={{
                      flex: 1,
                      padding: "11px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                      transition: "all 0.2s ease",
                      color: isAbove === opt.val ? "white" : "var(--text-secondary)",
                      background:
                        isAbove === opt.val
                          ? opt.val
                            ? "linear-gradient(135deg,#00b87a,#00955e)"
                            : "linear-gradient(135deg,#cc1c38,#a31530)"
                          : "rgba(255,255,255,0.03)",
                      border:
                        isAbove === opt.val
                          ? `1px solid ${opt.c}30`
                          : "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sel.fields.includes("dataStreamId") && (
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Data Stream ID (bytes32)</label>
              <input
                type="text"
                value={dataStreamId}
                onChange={(e) => setDataStreamId(e.target.value as `0x${string}`)}
                placeholder="0x..."
                style={inp}
                onFocus={focus}
                onBlur={blur}
              />
            </div>
          )}

          {sel.fields.includes("functionsScript") && (
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Functions Script</label>
              <textarea
                rows={8}
                value={functionsScript}
                onChange={(e) => setFunctionsScript(e.target.value)}
                placeholder="return Functions.encodeString('YES');"
                style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}
                onFocus={focus as any}
                onBlur={blur as any}
              />
            </div>
          )}

          {sel.fields.includes("aiPromptHash") && (
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>AI Prompt Hash (bytes32)</label>
              <input
                type="text"
                value={aiPromptHash}
                onChange={(e) => setAiPromptHash(e.target.value as `0x${string}`)}
                placeholder="0x..."
                style={inp}
                onFocus={focus}
                onBlur={blur}
              />
            </div>
          )}

          {sel.fields.includes("requiredAgreement") && (
            <div>
              <label style={labelStyle}>Agreement (N-of-M)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={requiredAgreement}
                onChange={(e) => setRequiredAgreement(e.target.value)}
                style={inp}
                onFocus={focus}
                onBlur={blur}
              />
            </div>
          )}
        </div>
      </Section>

      {question && (
        <div
          style={{
            background: "rgba(77,163,255,0.04)",
            border: "1px solid rgba(77,163,255,0.15)",
            borderRadius: 16,
            padding: "18px 22px",
            marginBottom: 12,
          }}
        >
          <p
            style={{
              fontSize: 10,
              color: "rgba(77,163,255,0.5)",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 8,
            }}
          >
            Preview
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 5, lineHeight: 1.5 }}>
            {question}
          </p>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {sel.label} · {CATEGORIES[category]} · {deadlineDays}d · {seedAmount} ETH
          </p>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            background: "rgba(255,69,96,0.08)",
            border: "1px solid rgba(255,69,96,0.2)",
            color: "#ff8fa3",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 12,
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {errorMessage}
        </div>
      )}

      {txHash && (
        <div
          style={{
            background: "rgba(0,229,160,0.08)",
            border: "1px solid rgba(0,229,160,0.2)",
            color: "#8fffd7",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 12,
            fontSize: 13,
            lineHeight: 1.6,
            wordBreak: "break-all",
          }}
        >
          Transaction submitted: {txHash}
        </div>
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={!question.trim() || isPending}
        style={{
          width: "100%",
          padding: "18px",
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 800,
          cursor: !question.trim() || isPending ? "not-allowed" : "pointer",
          color: !question.trim() || isPending ? "var(--text-muted)" : "#0a0a0a",
          background:
            !question.trim() || isPending ? "rgba(255,255,255,0.04)" : "var(--accent-blue)",
          border:
            !question.trim() || isPending
              ? "1px solid rgba(255,255,255,0.07)"
              : "none",
          boxShadow:
            !question.trim() || isPending ? "none" : "0 0 40px rgba(77,163,255,0.25)",
          transition: "all 0.25s ease",
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: "-0.01em",
        }}
      >
        {isPending
          ? "Submitting..."
          : question.trim()
          ? `Create Market · ${seedAmount} ETH`
          : "Enter a question to continue"}
      </button>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 20,
        padding: "26px",
        marginBottom: 10,
      }}
    >
      <p
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 18,
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: "var(--text-muted)",
  display: "block",
  marginBottom: 8,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontFamily: "'JetBrains Mono', monospace",
};
