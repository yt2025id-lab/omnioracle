"use client";

import { useState } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { CONTRACTS, FACTORY_ABI, PipelineLabel, CategoryLabel, StatusLabel } from "@/lib/contracts";

const P_COLORS: Record<string, string> = {
  "Price Feed":"var(--accent-blue)","Data Stream":"#ff6b2b","Functions API":"#e040fb","AI Grounded":"#06d6f0","Composite":"#00e5a0",
};
const S_COLORS: Record<string, string> = {
  "Open":"#00e5a0","Resolution Requested":"#06d6f0","Resolving":"var(--accent-blue)","Resolved":"#9b7fff","Disputed":"#ff4560","Expired":"#3a3a3a",
};

function MarketCard({ marketId }: { marketId: number }) {
  const { data: market } = useReadContract({
    address: CONTRACTS.marketFactory, abi: FACTORY_ABI, functionName: "getMarket", args: [BigInt(marketId)],
  });

  if (!market) return (
    <div style={{ background:"var(--bg-card)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:18, padding:24, height:190 }}>
      <div className="skeleton" style={{ height:10, width:"30%", marginBottom:16 }} />
      <div className="skeleton" style={{ height:14, width:"85%", marginBottom:8 }} />
      <div className="skeleton" style={{ height:14, width:"60%", marginBottom:24 }} />
      <div className="skeleton" style={{ height:6, width:"100%", marginBottom:10, borderRadius:99 }} />
    </div>
  );

  const status = StatusLabel[market.status] || "Unknown";
  const pipeline = PipelineLabel[market.pipelineType] || "Unknown";
  const pColor = P_COLORS[pipeline] || "#555";
  const sColor = S_COLORS[status] || "#555";
  const yesP = market.totalPool > 0n ? Math.round(Number((market.yesPool * 100n) / market.totalPool)) : 50;
  const totalEth = parseFloat(formatEther(market.totalPool));

  return (
    <Link href={`/markets/${marketId}`} style={{ textDecoration:"none", display:"block", height:"100%" }}>
      <div style={{
        background:"var(--bg-card)", border:"1px solid rgba(255,255,255,0.06)",
        borderRadius:20, padding:24, height:"100%",
        transition:"all 0.25s cubic-bezier(0.16,1,0.3,1)", position:"relative", overflow:"hidden",
      }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(77,163,255,0.2)"; el.style.transform = "translateY(-4px)"; el.style.boxShadow = "0 16px 48px rgba(0,0,0,0.6)"; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border-default)"; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}
      >
        {/* Top color bar on hover via pipeline color */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, ${pColor}60, transparent)` }} />

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, color:"var(--text-muted)", letterSpacing:"0.06em" }}>
            #{String(marketId).padStart(3,"0")}
          </span>
          <div style={{ display:"flex", gap:6 }}>
            <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:99, color:pColor, background:pColor+"12", border:`1px solid ${pColor}25`, letterSpacing:"0.03em", fontFamily:"'JetBrains Mono', monospace" }}>
              {pipeline}
            </span>
            <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, fontWeight:600, padding:"3px 9px", borderRadius:99, color:sColor, background:sColor+"10", fontFamily:"'JetBrains Mono', monospace" }}>
              <span style={{ width:4, height:4, borderRadius:"50%", background:sColor, display:"inline-block" }} />
              {status}
            </span>
          </div>
        </div>

        <p style={{ fontSize:14, fontWeight:500, lineHeight:1.6, color:"var(--text-primary)", marginBottom:18, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          {market.question}
        </p>

        <div style={{ marginBottom:12 }}>
          <div style={{ height:5, background:"rgba(255,69,96,0.12)", borderRadius:99, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${yesP}%`, background:"linear-gradient(90deg,#00e5a0,#00b87a)", borderRadius:99, transition:"width 0.6s ease", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:"-120%", width:"60%", height:"100%", background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)", animation:"slideRight 2.5s linear infinite" }} />
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#00e5a0", fontFamily:"'JetBrains Mono', monospace" }}>YES {yesP}%</span>
            <span style={{ fontSize:11, fontWeight:700, color:"#ff4560", fontFamily:"'JetBrains Mono', monospace" }}>NO {100-yesP}%</span>
          </div>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ fontSize:11, color:"var(--text-muted)" }}>{CategoryLabel[market.category]||"Custom"}</span>
          <span style={{ fontSize:11, fontWeight:600, color:"var(--text-secondary)", fontFamily:"'JetBrains Mono', monospace" }}>
            {totalEth===0?"No pool":`${totalEth.toFixed(4)} ETH`}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function MarketsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pipelineFilter, setPipelineFilter] = useState("ALL");
  const { data: nextMarketId } = useReadContract({ address: CONTRACTS.marketFactory, abi: FACTORY_ABI, functionName: "nextMarketId" });
  const totalMarkets = nextMarketId ? Number(nextMarketId) : 0;
  const marketIds = Array.from({ length: totalMarkets }, (_, i) => i).reverse();

  const statuses = ["ALL","Open","Resolution Requested","Resolved","Disputed","Expired"];
  const pipelines = ["ALL","Price Feed","Data Stream","Functions API","AI Grounded","Composite"];

  return (
    <div className="page-enter" style={{ paddingTop:48, paddingBottom:80 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:48, flexWrap:"wrap", gap:20 }}>
        <div>
          <p style={{ fontSize:11, color:"var(--text-muted)", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"'JetBrains Mono', monospace", marginBottom:10 }}>Prediction Markets</p>
          <h1 style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:"clamp(28px, 4vw, 44px)", fontWeight:800, letterSpacing:"-0.03em", color:"var(--text-primary)" }}>
            All Markets
            <span style={{ fontSize:20, color:"var(--text-muted)", marginLeft:16, fontWeight:400 }}>{totalMarkets}</span>
          </h1>
        </div>
        <Link href="/create" style={{ textDecoration:"none" }}>
          <button style={{
            padding:"11px 28px", borderRadius:12, fontWeight:800, fontSize:13,
            color:"#0a0a0a", background:"var(--accent-blue)", border:"none",
            cursor:"pointer", transition:"all 0.2s ease",
            fontFamily:"'Space Grotesk', sans-serif", boxShadow:"0 0 30px rgba(77,163,255,0.2)",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 0 50px rgba(77,163,255,0.4)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform="translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow="0 0 30px rgba(77,163,255,0.2)"; }}
          >
            + Create Market
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div style={{ marginBottom:36, display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding:"6px 16px", borderRadius:99, fontSize:12, fontWeight:600, cursor:"pointer",
              background: statusFilter===s ? "rgba(77,163,255,0.12)" : "transparent",
              border: statusFilter===s ? "1px solid rgba(77,163,255,0.35)" : "1px solid rgba(255,255,255,0.08)",
              color: statusFilter===s ? "var(--accent-blue)" : "var(--text-secondary)",
              transition:"all 0.15s ease", fontFamily:"'JetBrains Mono', monospace",
            }}>{s}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {pipelines.map(p => {
            const c = P_COLORS[p];
            return (
              <button key={p} onClick={() => setPipelineFilter(p)} style={{
                padding:"6px 16px", borderRadius:99, fontSize:12, fontWeight:600, cursor:"pointer",
                background: pipelineFilter===p ? (c ? c+"12" : "var(--border-default)") : "transparent",
                border: pipelineFilter===p ? `1px solid ${c ? c+"35" : "var(--text-muted)"}` : "1px solid rgba(255,255,255,0.08)",
                color: pipelineFilter===p ? (c || "var(--text-primary)") : "var(--text-secondary)",
                transition:"all 0.15s ease", fontFamily:"'JetBrains Mono', monospace",
              }}>{p}</button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {totalMarkets === 0 ? (
        <div style={{ textAlign:"center", padding:"100px 0" }}>
          <p style={{ fontSize:48, marginBottom:20, opacity:0.3 }}>◈</p>
          <p style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:22, fontWeight:800, letterSpacing:"-0.03em", marginBottom:10 }}>No markets yet</p>
          <p style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:36 }}>Create the first prediction market.</p>
          <Link href="/create" style={{ textDecoration:"none" }}>
            <button style={{ padding:"14px 32px", borderRadius:12, fontWeight:800, fontSize:14, color:"#0a0a0a", background:"var(--accent-blue)", border:"none", cursor:"pointer", fontFamily:"'Space Grotesk', sans-serif" }}>
              Create First Market
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:10 }}>
          {marketIds.map(id => <MarketCard key={id} marketId={id} />)}
        </div>
      )}
    </div>
  );
}
