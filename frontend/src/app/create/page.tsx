"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FocusEvent, ReactNode } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { CONTRACTS } from "@/lib/contracts";

const CREATE_MARKET_ABI = [
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
        name: "pipelineConfig",
        type: "tuple",
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
] as const;

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
    fields: [],
  },
  {
    type: 4,
    label: "Composite",
    color: "#00e5a0",
    icon: "⬡",
    tag: "Multi-source",
    desc: "N-of-M consensus — multiple oracle sources must agree to resolve.",
    fields: ["requiredAgreement", "priceFeedAddress"],
  },
] as const;

const CATEGORIES = [
  "Crypto",
  "Sports",
  "Politics",
  "Science",
  "Entertainment",
  "Custom",
] as const;

const PRICE_FEEDS: Record<string, `0x${string}`> = {
  "ETH/USD": "0x4aDC67d868764F27A76A1C73B3552fa4F21E470b",
  "BTC/USD": "0x0FB99723Aee6f420beAD13e6bBB79024e1BA0013",
  "LINK/USD": "0xb113F5A928BCfF189C998ab20d753a47F9dE5A61",
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

type NoticeType = "idle" | "info" | "error" | "success";

export default function CreateMarketPage() {
  const { isConnected } = useAccount();
  const {
    writeContractAsync,
    data: txHash,
    isPending: isWalletPending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState(0);
  const [deadlineDays, setDeadlineDays] = useState("7");
  const [seedAmount, setSeedAmount] = useState("0.01");
  const [selectedPipeline, setSelectedPipeline] = useState(3);
  const [priceFeed, setPriceFeed] = useState("ETH/USD");
  const [priceThreshold, setPriceThreshold] = useState("");
  const [isAbove, setIsAbove] = useState(true);
  const [requiredAgreement, setRequiredAgreement] = useState("2");

  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<NoticeType>("idle");

  const sel = useMemo(
    () => PIPELINE_OPTIONS.find((p) => p.type === selectedPipeline)!,
    [selectedPipeline]
  );

  const isBusy = isWalletPending || isConfirming;

  const logStep = (label: string, payload?: unknown) => {
    const time = new Date().toLocaleTimeString();
    if (payload !== undefined) {
      console.log(`[CreateMarket][${time}] ${label}`, payload);
    } else {
      console.log(`[CreateMarket][${time}] ${label}`);
    }
  };

  const setError = (message: string) => {
    setNotice(message);
    setNoticeType("error");
  };

  const setInfo = (message: string) => {
    setNotice(message);
    setNoticeType("info");
  };

  const setSuccess = (message: string) => {
    setNotice(message);
    setNoticeType("success");
  };

  const validateForm = () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return "Question is required.";

    const deadlineNum = Number(deadlineDays);
    if (!Number.isFinite(deadlineNum) || deadlineNum <= 0) {
      return "Deadline must be a valid positive number.";
    }

    const seedNum = Number(seedAmount);
    if (!Number.isFinite(seedNum) || seedNum <= 0) {
      return "Seed pool must be a valid positive ETH amount.";
    }

    if (sel.fields.includes("priceThreshold")) {
      const thresholdNum = Number(priceThreshold);
      if (!Number.isFinite(thresholdNum) || thresholdNum <= 0) {
        return "Threshold must be a valid positive number.";
      }
    }

    if (sel.fields.includes("requiredAgreement")) {
      const agreementNum = Number(requiredAgreement);
      if (!Number.isInteger(agreementNum) || agreementNum <= 0) {
        return "Agreement (N-of-M) must be a valid positive integer.";
      }
    }

    if (!CONTRACTS.marketFactory) {
      return "Market factory address is missing.";
    }

    return null;
  };

  const handleCreate = async () => {
    logStep("Create Market button clicked");

    const validationError = validateForm();
    if (validationError) {
      logStep("Validation failed", { validationError });
      setError(validationError);
      return;
    }

    logStep("Validation passed", {
      question: question.trim(),
      category,
      deadlineDays,
      seedAmount,
      selectedPipeline,
      priceFeed,
      priceThreshold,
      isAbove,
      requiredAgreement,
    });

    try {
      setInfo("Waiting for wallet confirmation...");
      logStep("Preparing transaction payload...");

      const deadline = BigInt(
        Math.floor(Date.now() / 1000) + Number(deadlineDays) * 86400
      );

      const priceFeedAddress = PRICE_FEEDS[priceFeed] ?? ZERO_ADDRESS;
      const thresholdNum = Number(priceThreshold || "0");
      const agreementNum = Number(requiredAgreement || "0");

      const config = {
        pipelineType: selectedPipeline,
        priceFeedAddress,
        priceThreshold: BigInt(Math.round(thresholdNum * 1e8)),
        isAbove,
        dataStreamId: ZERO_BYTES32,
        functionsScript: "",
        aiPromptHash: ZERO_BYTES32,
        requiredAgreement: agreementNum,
      };

      logStep("Config built", {
        deadline: deadline.toString(),
        config: {
          ...config,
          priceThreshold: config.priceThreshold.toString(),
        },
      });

      logStep("Calling writeContractAsync...", {
        address: CONTRACTS.marketFactory,
        functionName: "createMarket",
        argsPreview: {
          question: question.trim(),
          category,
          deadline: deadline.toString(),
          selectedPipeline,
          seedAmount,
        },
      });

      const hash = await writeContractAsync({
        address: CONTRACTS.marketFactory,
        abi: CREATE_MARKET_ABI,
        functionName: "createMarket",
        args: [question.trim(), category, deadline, selectedPipeline, config],
        value: parseEther(seedAmount),
      });

      logStep("writeContractAsync resolved", { hash });
      setInfo(`Transaction submitted: ${hash}`);
    } catch (err: any) {
      logStep("Create market failed", {
        shortMessage: err?.shortMessage,
        message: err?.message,
        cause: err?.cause,
        details: err,
      });

      const message =
        err?.shortMessage ||
        err?.message ||
        "Transaction failed. Check wallet, network, contract address, or input values.";

      setError(message);
    }
  };

  useEffect(() => {
    if (txHash) {
      logStep("Transaction hash received", { txHash });
    }
  }, [txHash]);

  useEffect(() => {
    if (isWalletPending) {
      logStep("Waiting for wallet confirmation...");
    }
  }, [isWalletPending]);

  useEffect(() => {
    if (isConfirming && txHash) {
      logStep("Transaction submitted. Waiting for blockchain confirmation...", {
        txHash,
      });
    }
  }, [isConfirming, txHash]);

  useEffect(() => {
    if (isConfirmed && txHash) {
      logStep("Transaction confirmed successfully", { txHash });
      setSuccess("Transaction confirmed. Market creation succeeded.");
    }
  }, [isConfirmed, txHash]);

  useEffect(() => {
    if (writeError) {
      logStep("Write contract error", writeError);
    }
  }, [writeError]);

  useEffect(() => {
    if (receiptError) {
      logStep("Transaction receipt error", receiptError);
      setError(receiptError.message || "Transaction confirmation failed.");
    }
  }, [receiptError]);

  const inp: CSSProperties = {
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
    e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    (e.target as HTMLElement).style.borderColor = "rgba(77,163,255,0.4)";
    (e.target as HTMLElement).style.background = "rgba(77,163,255,0.04)";
  };

  const blur = (
    e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    (e.target as HTMLElement).style.borderColor = "var(--border-default)";
    (e.target as HTMLElement).style.background = "rgba(255,255,255,0.03)";
  };

  const getNoticeStyles = (): CSSProperties => {
    if (noticeType === "error") {
      return {
        background: "rgba(255,69,96,0.08)",
        border: "1px solid rgba(255,69,96,0.18)",
        color: "#ff8da1",
      };
    }

    if (noticeType === "success") {
      return {
        background: "rgba(0,229,160,0.08)",
        border: "1px solid rgba(0,229,160,0.18)",
        color: "#72f0c2",
      };
    }

    return {
      background: "rgba(77,163,255,0.06)",
      border: "1px solid rgba(77,163,255,0.16)",
      color: "#a9cdfd",
    };
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
      style={{ maxWidth: 700, margin: "0 auto", paddingTop: 48, paddingBottom: 80 }}
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
          marginBottom: 24,
          lineHeight: 1.7,
        }}
      >
        Pick your question and oracle pipeline. The pipeline determines how the market resolves.
      </p>

      {notice && (
        <div
          style={{
            ...getNoticeStyles(),
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 16,
            fontSize: 13,
            lineHeight: 1.6,
            wordBreak: "break-word",
          }}
        >
          {notice}
        </div>
      )}

      <Section title="Market Question">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Will ETH exceed $5000 by March 2026?"
          rows={3}
          style={{ ...inp, resize: "none", lineHeight: 1.7, fontSize: 15 }}
          onFocus={focus}
          onBlur={blur}
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
          {["Category", "Deadline (days)", "Seed Pool (ETH)"].map((label, i) => (
            <div key={label}>
              <label
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {label}
              </label>

              {i === 0 ? (
                <select
                  value={category}
                  onChange={(e) => setCategory(Number(e.target.value))}
                  style={inp}
                  onFocus={focus}
                  onBlur={blur}
                >
                  {CATEGORIES.map((c, ci) => (
                    <option key={c} value={ci} style={{ background: "#101010" }}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={i === 1 ? deadlineDays : seedAmount}
                  onChange={(e) =>
                    i === 1 ? setDeadlineDays(e.target.value) : setSeedAmount(e.target.value)
                  }
                  style={inp}
                  onFocus={focus}
                  onBlur={blur}
                />
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Oracle Pipeline">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {PIPELINE_OPTIONS.map((p) => (
            <button
              key={p.type}
              type="button"
              onClick={() => {
                logStep("Pipeline selected", { pipelineType: p.type, label: p.label });
                setSelectedPipeline(p.type);
              }}
              style={{
                textAlign: "left",
                padding: "18px 20px",
                borderRadius: 14,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                background: selectedPipeline === p.type ? `${p.color}08` : "transparent",
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
                    background: `${p.color}12`,
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
                        background: `${p.color}12`,
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

      {(sel.fields.includes("priceFeedAddress") || sel.fields.includes("priceThreshold")) && (
        <Section title="Pipeline Config">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            {sel.fields.includes("priceFeedAddress") && (
              <div>
                <label
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 8,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Price Feed
                </label>
                <select
                  value={priceFeed}
                  onChange={(e) => setPriceFeed(e.target.value)}
                  style={inp}
                  onFocus={focus}
                  onBlur={blur}
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
                <label
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 8,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Threshold ($)
                </label>
                <input
                  type="text"
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
                <label
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 8,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Direction
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { val: true, label: "↑ Above = YES", c: "#00e5a0" },
                    { val: false, label: "↓ Below = YES", c: "#ff4560" },
                  ].map((opt) => (
                    <button
                      key={String(opt.val)}
                      type="button"
                      onClick={() => {
                        logStep("Direction changed", { isAbove: opt.val });
                        setIsAbove(opt.val);
                      }}
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

            {sel.fields.includes("requiredAgreement") && (
              <div>
                <label
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 8,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Agreement (N-of-M)
                </label>
                <input
                  type="text"
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
      )}

      {question.trim() && (
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
            {question.trim()}
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

      <button
        type="button"
        onClick={handleCreate}
        disabled={!question.trim() || isBusy}
        style={{
          width: "100%",
          padding: "18px",
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 800,
          cursor: !question.trim() || isBusy ? "not-allowed" : "pointer",
          color: !question.trim() || isBusy ? "var(--text-muted)" : "#0a0a0a",
          background:
            !question.trim() || isBusy ? "rgba(255,255,255,0.04)" : "var(--accent-blue)",
          border:
            !question.trim() || isBusy
              ? "1px solid rgba(255,255,255,0.07)"
              : "none",
          boxShadow:
            !question.trim() || isBusy ? "none" : "0 0 40px rgba(77,163,255,0.25)",
          transition: "all 0.25s ease",
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: "-0.01em",
        }}
        onMouseEnter={(e) => {
          if (question.trim() && !isBusy) {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 0 60px rgba(77,163,255,0.45)";
          }
        }}
        onMouseLeave={(e) => {
          if (question.trim() && !isBusy) {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 0 40px rgba(77,163,255,0.25)";
          }
        }}
      >
        {isWalletPending
          ? "Waiting for wallet..."
          : isConfirming
          ? "Confirming transaction..."
          : question.trim()
          ? `Create Market · ${seedAmount} ETH`
          : "Enter a question to continue"}
      </button>

      {txHash && (
        <p
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "var(--text-muted)",
            fontFamily: "'JetBrains Mono', monospace",
            wordBreak: "break-all",
          }}
        >
          TX: {txHash}
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
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
