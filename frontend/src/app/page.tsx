"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useReadContract } from "wagmi";
import { CONTRACTS, FACTORY_ABI } from "@/lib/contracts";

/* ─── DATA ────────────────────────────────────────────── */
const PIPELINES = [
  { name: "Price Feed",    tag: "Deterministic", desc: "Chainlink Data Feeds resolve markets via tamper-proof on-chain price data.",          icon: "◐", color: "var(--accent-blue)" },
  { name: "Data Stream",   tag: "Real-time",     desc: "Sub-second Chainlink Data Streams for time-critical market resolution.",              icon: "⚡", color: "#ff6b2b" },
  { name: "Functions API", tag: "Programmable",  desc: "Custom JavaScript on Chainlink Functions calls any external API for resolution.",     icon: "{ }",color: "#e040fb" },
  { name: "AI Grounded",   tag: "AI-powered",    desc: "Gemini AI with live web search grounding verifies real-world events automatically.",  icon: "✦",  color: "#06d6f0" },
  { name: "Composite",     tag: "Multi-source",  desc: "N-of-M consensus across multiple oracle sources for maximum resolution trust.",       icon: "⬡",  color: "#00e5a0" },
];

const SERVICES_MARQUEE = [
  "Chainlink CRE", "Data Feeds", "Data Streams", "VRF v2.5", "Automation", "CCIP", "Functions", "x402 Payments",
  "Base Sepolia", "Chainlink CRE", "Data Feeds", "Data Streams", "VRF v2.5", "Automation", "CCIP", "Functions",
];

const HOW_IT_WORKS = [
  { num: "01", title: "Create",  desc: "Spin up a prediction market in seconds. Choose your question and pick an oracle pipeline.",       color: "var(--accent-blue)" },
  { num: "02", title: "Predict", desc: "Anyone bets YES or NO with ETH. The pool grows. Odds shift live based on market sentiment.",     color: "#06d6f0" },
  { num: "03", title: "Resolve", desc: "When deadline hits, Chainlink CRE auto-executes your chosen oracle pipeline. No humans needed.", color: "#ff6b2b" },
  { num: "04", title: "Claim",   desc: "Winners claim proportional payouts instantly. 2% platform fee. Fully on-chain.",                color: "#00e5a0" },
];

const FEATURE_BENTO = [
  {
    size: "large", // spans 2 cols
    title: "5 Oracle Pipelines",
    sub: "One market. Any resolution method.",
    desc: "Price feeds, AI grounding, custom APIs, real-time streams, or multi-source consensus — pick what fits your market.",
    accent: "var(--accent-blue)",
    icon: "⬡",
  },
  {
    size: "small",
    title: "8 Chainlink Services",
    sub: "Deeply integrated",
    desc: "CRE · CCIP · VRF · Automation · Functions · Data Feeds · Data Streams · x402",
    accent: "#06d6f0",
    icon: "◈",
  },
  {
    size: "small",
    title: "Cross-Chain",
    sub: "via CCIP",
    desc: "Markets mirror across chains. Bet from anywhere, settle anywhere.",
    accent: "#e040fb",
    icon: "⬡",
  },
  {
    size: "small",
    title: "Permissionless",
    sub: "No gatekeepers",
    desc: "Anyone creates a market on any topic. Oracle logic is on-chain and verifiable.",
    accent: "#00e5a0",
    icon: "○",
  },
  {
    size: "small",
    title: "Auto-resolve",
    sub: "Chainlink Automation",
    desc: "CRE triggers resolution automatically when your market deadline passes.",
    accent: "#ff6b2b",
    icon: "⏱",
  },
];

/* ─── MARQUEE STRIP ───────────────────────────────────── */
function Marquee({ reverse = false }: { reverse?: boolean }) {
  const items = [...SERVICES_MARQUEE, ...SERVICES_MARQUEE];
  return (
    <div style={{ overflow: "hidden", position: "relative" }}>
      <div style={{
        display: "flex", gap: 0,
        animation: `marquee${reverse ? "Rev" : ""} 28s linear infinite`,
        width: "max-content",
      }}>
        {items.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 18,
            padding: "0 28px",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            whiteSpace: "nowrap",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-blue)", display: "inline-block", flexShrink: 0, boxShadow: "0 0 12px rgba(85,168,255,0.25)" }} />
            <span style={{
              fontSize: 13, fontWeight: 600, color: "var(--text-secondary)",
              letterSpacing: "0.08em", textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
            }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function AnimatedStatValue({ target, suffix = "", start = 0, duration = 1400, decimals = 0 }: { target: number; suffix?: string; start?: number; duration?: number; decimals?: number }) {
  const [value, setValue] = useState(start);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.45 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    let frame = 0;
    let startTime: number | null = null;

    const tick = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = easeOutExpo(progress);
      const next = start + (target - start) * eased;
      setValue(next);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, start, target, duration]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return <span ref={ref}>{formatted}{suffix}</span>;
}


function RevealBlurIn({ children, threshold = 0.3 }: { children: React.ReactNode; threshold?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0.18,
        filter: visible ? "blur(0px)" : "blur(16px)",
        transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.985)",
        transition: "opacity 1.15s cubic-bezier(0.16, 1, 0.3, 1), filter 1.15s cubic-bezier(0.16, 1, 0.3, 1), transform 1.15s cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "opacity, filter, transform",
      }}
    >
      {children}
    </div>
  );
}

/* ─── MAIN PAGE ───────────────────────────────────────── */
export default function Dashboard() {
  const pipelineSectionRef = useRef<HTMLElement | null>(null);
  const [pipelineScrollProgress, setPipelineScrollProgress] = useState(0);

  useEffect(() => {
    const updatePipelineProgress = () => {
      const section = pipelineSectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scrollable = Math.max(section.offsetHeight - viewportHeight, 1);
      const progressed = Math.min(Math.max((viewportHeight - rect.top) / scrollable, 0), 1);
      setPipelineScrollProgress(progressed);
    };

    updatePipelineProgress();
    window.addEventListener("scroll", updatePipelineProgress, { passive: true });
    window.addEventListener("resize", updatePipelineProgress);

    return () => {
      window.removeEventListener("scroll", updatePipelineProgress);
      window.removeEventListener("resize", updatePipelineProgress);
    };
  }, []);
  const { data: nextMarketId } = useReadContract({
    address: CONTRACTS.marketFactory,
    abi: FACTORY_ABI,
    functionName: "nextMarketId",
  });
  const totalMarkets = nextMarketId ? Number(nextMarketId) : 0;

  return (
    <div style={{ paddingBottom: 120 }}>

      {/* # Section: Hero banner / opening statement */}
      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section style={{
        minHeight: "calc(100vh - 88px)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center",
        padding: "60px 24px 0",
        position: "relative",
      }}>
        {/* Radial hero glow */}
        <div style={{
          position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 700, borderRadius: "50%",
          background: "var(--hero-glow)",
          filter: "blur(20px)", pointerEvents: "none",
        }} />

        {/* Live pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "7px 18px", borderRadius: 99,
          border: "1px solid var(--border-strong)",
          background: "var(--bg-soft)",
          marginBottom: 36,
          backdropFilter: "blur(8px)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e5a0", boxShadow: "0 0 8px #00e5a0" }} className="dot-pulse" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
            Live · Base Sepolia · 8 Chainlink Services
          </span>
        </div>

        {/* Floating hero text + background logo */}
        <div style={{
          position: "relative",
          width: "min(92vw, 920px)",
          marginBottom: 48,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          isolation: "isolate",
        }}>
          <div className="hero-text-float" style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            width: "min(100%, 760px)",
          }}>
            <div aria-hidden="true" className="hero-logo-orbit" style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "100%",
              aspectRatio: "1 / 1",
              transform: "translate(-6%, -50%)",
              pointerEvents: "none",
              zIndex: 0,
            }}>
              <img
                src="/logo_omnioracle.png"
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  opacity: 1,
                  filter: "blur(0.2px) drop-shadow(0 0 28px rgba(176,124,255,0.12)) drop-shadow(0 0 54px rgba(102,216,255,0.08))",
                }}
              />
            </div>

            <div style={{ position: "relative", zIndex: 2, width: "100%" }}>
              <h1 style={{
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                fontSize: "clamp(54px, 8vw, 104px)",
                fontWeight: 800,
                lineHeight: 0.92,
                letterSpacing: "-0.04em",
                marginBottom: 28,
                color: "var(--text-primary)",
                maxWidth: 900,
                textShadow: "0 10px 34px rgba(10, 6, 26, 0.22)",
              }}>
                Predict.<br />
                <span style={{
                  background: "var(--accent-gradient)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>On-chain.</span><br />
                Resolved.
              </h1>

              <p style={{
                fontSize: 18, lineHeight: 1.75, color: "var(--text-secondary)",
                maxWidth: 500,
                margin: "0 auto",
                fontWeight: 400,
                textShadow: "0 8px 22px rgba(8, 5, 19, 0.18)",
              }}>
                Permissionless prediction markets with composable oracle pipelines — from deterministic price feeds to AI consensus.
              </p>

              {/* CTA buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 36 }}>
          <Link href="/markets" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "15px 36px", borderRadius: 14,
            background: "var(--accent-gradient)", color: "var(--accent-contrast)",
            fontWeight: 800, fontSize: 14, letterSpacing: "0.02em",
            textDecoration: "none", transition: "all 0.2s ease",
            fontFamily: "'Space Grotesk', sans-serif",
            boxShadow: "0 16px 42px rgba(73,141,255,0.22)",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 18px 54px rgba(73,141,255,0.34)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 42px rgba(73,141,255,0.22)"; }}
          >
            Browse Markets →
          </Link>
          <Link href="/create" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "15px 36px", borderRadius: 14,
            background: "transparent", color: "var(--text-secondary)",
            fontWeight: 700, fontSize: 14, letterSpacing: "0.02em",
            textDecoration: "none", transition: "all 0.2s ease",
            border: "1px solid var(--border-strong)",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-blue)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
          >
            Create Market
          </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>scroll</span>
          <div style={{ width: 1, height: 40, background: "linear-gradient(180deg, color-mix(in srgb, var(--text-primary) 26%, transparent), transparent)" }} />
        </div>
      </section>

      {/* # Section: Moving services strip / partner-style marquee */}
      {/* ══════════════════════════════════════════════
          MARQUEE STRIP
      ══════════════════════════════════════════════ */}
      <div style={{
        borderTop: "1px solid var(--border-default)",
        borderBottom: "1px solid var(--border-default)",
        padding: "18px 0",
        marginBottom: 120,
        overflow: "hidden",
      }}>
        <Marquee />
      </div>

      {/* # Section: Quick stats summary */}
      {/* ══════════════════════════════════════════════
          STATS ROW
      ══════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1200, margin: "0 auto 140px", padding: "0 24px", minHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ textAlign: "center", marginBottom: 34 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>
            Protocol snapshot
          </p>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", lineHeight: 1.08 }}>
            Market System Overview
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 1,
          border: "1px solid var(--border-default)",
          borderRadius: 24, overflow: "hidden",
          background: "var(--border-default)",
        }}>
          {[
            { target: totalMarkets, label: "Markets Live", accent: "var(--accent-blue)", start: 0, suffix: "" },
            { target: 5, label: "Oracle Pipelines", accent: "#06d6f0", start: 0, suffix: "" },
            { target: 8, label: "Chainlink Services", accent: "#ff6b2b", start: 0, suffix: "" },
            { target: 2, label: "Platform Fee", accent: "#00e5a0", start: 100, suffix: "%" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "var(--bg-card)",
              padding: "44px 36px",
              textAlign: "center",
            }}>
              <p style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(36px, 4vw, 56px)",
                fontWeight: 800,
                color: s.accent,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                marginBottom: 10,
              }}>
                <AnimatedStatValue target={s.target} start={s.start} suffix={s.suffix} duration={1500 + i * 180} />
              </p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* # Section: "Prediction markets, done right." feature grid */}
      {/* ══════════════════════════════════════════════
          BENTO FEATURE GRID
      ══════════════════════════════════════════════ */}
      <section className="prediction-section-shell" style={{ maxWidth: 1120, margin: "0 auto 140px", padding: "0 24px", minHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Section heading */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48, flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>
              What makes it different
            </p>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(30px, 4vw, 46px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, color: "var(--text-primary)" }}>
              Prediction markets,<br />done right.
            </h2>
          </div>
          <Link href="/markets" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontSize: 13, fontWeight: 700, color: "var(--text-secondary)",
            textDecoration: "none", transition: "color 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent-blue)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"}
          >
            View all markets →
          </Link>
        </div>

        {/* Bento grid */}
        <div className="prediction-orbit-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gridTemplateRows: "auto auto", gap: 14 }}>

          {/* Card 1 — large (8 cols) */}
          <div className="prediction-space-card prediction-card-large orbit-drift orbit-a tilt-left" style={{
            gridColumn: "span 8",
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: 22,
            padding: "36px 40px",
            position: "relative", overflow: "hidden",
            transition: "border-color 0.3s",
            cursor: "default",
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(77,163,255,0.25)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"}
          >
            {/* Glow */}
            <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(77,163,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{ fontSize: 36, marginBottom: 28, color: "var(--accent-blue)" }}>⬡</div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 12 }}>
              5 Oracle Pipeline Types
            </p>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.8, maxWidth: 460, marginBottom: 36 }}>
              Choose how your market resolves. Price feeds, real-time streams, custom APIs, AI with search grounding, or multi-source consensus.
            </p>

            {/* Pipeline tags */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PIPELINES.map(p => (
                <span key={p.name} style={{
                  padding: "7px 16px", borderRadius: 99,
                  fontSize: 12, fontWeight: 700,
                  color: p.color,
                  background: p.color + "15",
                  border: `1px solid ${p.color}30`,
                  letterSpacing: "0.02em",
                }}>{p.name}</span>
              ))}
            </div>
          </div>

          {/* Card 2 — small (4 cols) */}
          <div className="prediction-space-card prediction-card-small orbit-drift orbit-b tilt-right" style={{
            gridColumn: "span 4",
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: 22,
            padding: "30px 28px",
            position: "relative", overflow: "hidden",
            transition: "border-color 0.3s",
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(6,214,240,0.3)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"}
          >
            <div style={{ position: "absolute", bottom: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,214,240,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 48, fontFamily: "'JetBrains Mono', monospace" }}>Integrations</p>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 40, fontWeight: 800, color: "#06d6f0", letterSpacing: "-0.04em", marginBottom: 8 }}>8</p>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, letterSpacing: "-0.02em" }}>Chainlink<br />Services</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.8, fontFamily: "'JetBrains Mono', monospace" }}>CRE · CCIP · VRF<br />Automation · Functions<br />Feeds · Streams · x402</p>
          </div>

          {/* Card 3 — cross-chain (4 cols) */}
          <div className="prediction-space-card prediction-card-small orbit-drift orbit-c tilt-left-soft" style={{
            gridColumn: "span 4",
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: 22,
            padding: "30px 28px",
            position: "relative", overflow: "hidden",
            transition: "border-color 0.3s",
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(224,64,251,0.3)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"}
          >
            <div style={{ position: "absolute", top: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(224,64,251,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 40, fontFamily: "'JetBrains Mono', monospace" }}>via CCIP</p>
            {/* Chain nodes visualization */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
              {["Base", "ETH", "ARB", "OP"].map((c, i) => (
                <div key={c} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: i === 0 ? "rgba(224,64,251,0.2)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${i === 0 ? "rgba(224,64,251,0.4)" : "var(--border-default)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700, color: i === 0 ? "#e040fb" : "var(--text-muted)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>{c}</div>
                  {i < 3 && <span style={{ fontSize: 12, color: "color-mix(in srgb, var(--text-primary) 18%, transparent)" }}>→</span>}
                </div>
              ))}
            </div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10, letterSpacing: "-0.02em" }}>Cross-Chain<br />Markets</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>Bet from any chain. Markets mirror automatically via CCIP.</p>
          </div>

          {/* Card 4 — permissionless (4 cols) */}
          <div className="prediction-space-card prediction-card-small orbit-drift orbit-d tilt-right-soft" style={{
            gridColumn: "span 4",
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: 22,
            padding: "30px 28px",
            position: "relative", overflow: "hidden",
            transition: "border-color 0.3s",
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,229,160,0.3)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"}
          >
            <div style={{ position: "absolute", bottom: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,229,160,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 40, fontFamily: "'JetBrains Mono', monospace" }}>No Gatekeepers</p>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(0,229,160,0.12)", border: "1px solid rgba(0,229,160,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 20 }}>○</div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10, letterSpacing: "-0.02em" }}>Permissionless</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>Anyone creates a market on any topic. Oracle logic is fully on-chain and verifiable.</p>
          </div>

          {/* Card 5 — auto resolve (4 cols) */}
          <div className="prediction-space-card prediction-card-small orbit-drift orbit-e tilt-right" style={{
            gridColumn: "span 4",
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: 22,
            padding: "30px 28px",
            position: "relative", overflow: "hidden",
            transition: "border-color 0.3s",
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,43,0.3)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"}
          >
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,43,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 40, fontFamily: "'JetBrains Mono', monospace" }}>Chainlink Automation</p>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10, letterSpacing: "-0.02em" }}>Auto-Resolves</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>No one has to push a button. Markets resolve automatically when deadlines expire.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff6b2b", boxShadow: "0 0 10px #ff6b2b" }} className="dot-pulse" />
              <span style={{ fontSize: 12, color: "#ff6b2b", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>CRE watching...</span>
            </div>
          </div>
        </div>
      </section>

      {/* # Section: How it works / 4-step process */}
      {/* ══════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1200, margin: "0 auto 140px", padding: "0 24px", minHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Label */}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16, fontFamily: "'JetBrains Mono', monospace", textAlign: "center" }}>
          How it works
        </p>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", textAlign: "center", marginBottom: 72 }}>
          Four steps. Fully on-chain.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 1, background: "var(--border-default)", borderRadius: 24, overflow: "hidden" }}>
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.num} style={{
              background: "var(--bg-card)",
              padding: "44px 36px",
              position: "relative",
              transition: "background 0.3s",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#0e0e0e"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-base)"}
            >
              {/* Top color bar */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${step.color}, transparent)` }} />

              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: step.color, letterSpacing: "0.08em", marginBottom: 32 }}>
                {step.num}
              </p>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14, letterSpacing: "-0.03em" }}>
                {step.title}
              </p>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* # Section: Oracle pipeline detail list */}
      {/* ══════════════════════════════════════════════
          ORACLE PIPELINES DETAIL
      ══════════════════════════════════════════════ */}
      <section
        ref={pipelineSectionRef}
        className="pipeline-scroll-section"
        style={{
          maxWidth: 1200,
          margin: "0 auto 140px",
          padding: "0 24px",
          minHeight: "340vh",
          position: "relative",
        }}
      >
        <div
          className="pipeline-sticky-shell"
          style={{
            position: "sticky",
            top: 0,
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            padding: "96px 0",
          }}
        >
          <div
            className="pipeline-scroll-layout"
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "minmax(280px, 0.95fr) minmax(0, 1.25fr)",
              gap: 44,
              alignItems: "start",
            }}
          >
            <div style={{ position: "sticky", top: 120 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                Resolution methods
              </p>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", lineHeight: 1.1, marginBottom: 18 }}>
                Pick your pipeline.
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 320, lineHeight: 1.8, marginBottom: 28 }}>
                Every market needs a resolution method. Choose one when creating a market.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ position: "relative", width: 160, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <div style={{ width: `${pipelineScrollProgress * 100}%`, height: "100%", borderRadius: 999, background: "var(--accent-gradient)", boxShadow: "0 0 18px rgba(176,124,255,0.28)", transition: "width 0.22s ease-out" }} />
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
                  {Math.max(1, Math.min(PIPELINES.length, Math.ceil(pipelineScrollProgress * PIPELINES.length)))} / {PIPELINES.length}
                </span>
              </div>
            </div>

            <div className="pipeline-reveal-stack" style={{ display: "flex", flexDirection: "column", gap: 18, position: "relative" }}>
              {PIPELINES.map((p, i) => {
                const start = i / PIPELINES.length;
                const end = (i + 1) / PIPELINES.length;
                const localProgress = Math.min(Math.max((pipelineScrollProgress - start) / Math.max(end - start, 0.0001), 0), 1);
                const eased = 1 - Math.pow(1 - localProgress, 3);
                const active = pipelineScrollProgress >= start;
                const isCurrent = pipelineScrollProgress >= start && pipelineScrollProgress < end;

                return (
                  <div
                    key={p.name}
                    className="pipeline-reveal-card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 28,
                      padding: "28px 24px",
                      border: active ? `1px solid ${p.color}28` : "1px solid var(--border-default)",
                      borderRadius: 24,
                      cursor: "default",
                      background: active ? `linear-gradient(135deg, ${p.color}10, rgba(255,255,255,0.02))` : "rgba(255,255,255,0.015)",
                      boxShadow: active ? `0 18px 40px rgba(5,4,12,0.28), 0 0 0 1px ${p.color}12 inset` : "0 12px 30px rgba(5,4,12,0.16)",
                      opacity: 0.22 + eased * 0.78,
                      transform: `translate3d(0, ${72 - eased * 72}px, 0) scale(${0.94 + eased * 0.06})`,
                      filter: `blur(${(1 - eased) * 10}px)`,
                      transition: "border-color 0.35s ease, box-shadow 0.35s ease, background 0.35s ease",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: isCurrent ? `radial-gradient(circle at 10% 50%, ${p.color}18 0%, transparent 48%)` : "transparent", opacity: 0.9, transition: "background 0.35s ease" }} />

                    <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 28, width: "100%" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, alignSelf: "stretch" }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: active ? p.color : "var(--text-muted)", width: 24, flexShrink: 0, textAlign: "center", letterSpacing: "0.08em", transition: "color 0.35s ease" }}>0{i + 1}</span>
                        {i < PIPELINES.length - 1 && (
                          <span style={{ width: 1, flex: 1, minHeight: 40, background: `linear-gradient(180deg, ${active ? p.color : 'rgba(255,255,255,0.12)'}, transparent)`, opacity: 0.7 }} />
                        )}
                      </div>

                      <div style={{
                        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                        background: p.color + "12", border: `1px solid ${p.color}25`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: p.icon === "{ }" ? 11 : 18, color: p.color, fontWeight: 800,
                        fontFamily: "'JetBrains Mono', monospace",
                        boxShadow: active ? `0 0 22px ${p.color}22` : "none",
                        transition: "box-shadow 0.35s ease, transform 0.35s ease",
                        transform: active ? "translateY(0) scale(1)" : "translateY(4px) scale(0.96)",
                      }}>{p.icon}</div>

                      <div style={{ minWidth: 170 }}>
                        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>{p.name}</p>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: p.color, fontFamily: "'JetBrains Mono', monospace" }}>{p.tag}</span>
                      </div>

                      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75, flex: 1 }}>{p.desc}</p>

                      <span style={{ color: active ? p.color : "color-mix(in srgb, var(--text-primary) 18%, transparent)", fontSize: 18, flexShrink: 0, transition: "color 0.35s ease, transform 0.35s ease", transform: active ? "translateX(0)" : "translateX(-6px)" }}>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* # Section: Secondary reversed marquee strip */}
      {/* ══════════════════════════════════════════════
          MARQUEE 2 (reversed)
      ══════════════════════════════════════════════ */}
      <div style={{
        borderTop: "1px solid var(--border-default)",
        borderBottom: "1px solid var(--border-default)",
        padding: "18px 0",
        marginBottom: 140,
      }}>
        <Marquee reverse />
      </div>

      {/* # Section: Final call-to-action */}
      {/* ══════════════════════════════════════════════
          CTA SECTION (big bottom push)
      ══════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <RevealBlurIn threshold={0.28}>
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: 28,
            padding: "90px 64px",
            textAlign: "center",
            position: "relative", overflow: "hidden",
          }}>
            {/* Glow */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(77,163,255,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

            <p style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", marginBottom: 24 }}>
              Ready to start?
            </p>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text-primary)", lineHeight: 1, marginBottom: 20 }}>
              If you scrolled this far,<br />
              <span style={{ background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                time to predict.
              </span>
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 48, lineHeight: 1.7 }}>
              Create a market. Place a prediction. Let the oracle decide.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/markets" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "16px 40px", borderRadius: 14,
                background: "var(--accent-gradient)", color: "var(--accent-contrast)",
                fontWeight: 800, fontSize: 15,
                textDecoration: "none", transition: "all 0.2s ease",
                fontFamily: "'Space Grotesk', sans-serif",
                boxShadow: "0 0 40px rgba(77,163,255,0.2)",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 60px rgba(77,163,255,0.4)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(77,163,255,0.2)"; }}
              >
                Browse Markets
              </Link>
              <Link href="/create" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "16px 40px", borderRadius: 14,
                background: "transparent", color: "rgba(255,255,255,0.7)",
                fontWeight: 700, fontSize: 15,
                textDecoration: "none", transition: "all 0.2s ease",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-blue)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
              >
                Create Market
              </Link>
            </div>
          </div>
        </RevealBlurIn>
      </section>

      {/* Marquee keyframes (injected via style tag trick) */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marqueeRev {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        @media (max-width: 960px) {
          .pipeline-scroll-section {
            min-height: auto !important;
          }

          .pipeline-sticky-shell {
            position: relative !important;
            min-height: auto !important;
            padding: 0 !important;
          }

          .pipeline-scroll-layout {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }

          .pipeline-reveal-stack {
            gap: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
