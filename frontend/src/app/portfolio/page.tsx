"use client";
import { useAccount, useReadContract } from "wagmi";
import Link from "next/link";
import { CONTRACTS, FACTORY_ABI } from "@/lib/contracts";

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { data: nextMarketId } = useReadContract({ address:CONTRACTS.marketFactory, abi:FACTORY_ABI, functionName:"nextMarketId" });
  const totalMarkets = nextMarketId ? Number(nextMarketId) : 0;

  if(!isConnected) return (
    <div className="page-enter" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:500, paddingTop:48 }}>
      <div style={{ background:"var(--bg-card)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:24, padding:"56px 48px", textAlign:"center", maxWidth:420, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(155,127,255,0.6),transparent)" }} />
        <p style={{ fontSize:40, marginBottom:20, opacity:0.4 }}>◉</p>
        <h2 style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:24, letterSpacing:"-0.03em", marginBottom:12 }}>Connect Your Wallet</h2>
        <p style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:28, lineHeight:1.7 }}>Connect to view your prediction portfolio and active positions.</p>
        <p style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"'JetBrains Mono', monospace" }}>Use Connect Wallet ↗ in the top right</p>
      </div>
    </div>
  );

  return (
    <div className="page-enter" style={{ paddingTop:48, paddingBottom:80 }}>
      <p style={{ fontSize:11, color:"var(--text-muted)", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"'JetBrains Mono', monospace", marginBottom:12 }}>Portfolio</p>
      <h1 style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:"clamp(28px, 4vw, 44px)", fontWeight:800, letterSpacing:"-0.03em", marginBottom:14 }}>My Portfolio</h1>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:48 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 14px", borderRadius:99, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)" }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent-blue)", boxShadow:"0 0 8px rgba(77,163,255,0.6)" }} />
          <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:12, color:"rgba(255,255,255,0.5)" }}>{address?.slice(0,8)}...{address?.slice(-6)}</span>
        </div>
        <span style={{ fontSize:13, color:"var(--text-muted)" }}>· {totalMarkets} markets available</span>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px,1fr))", gap:1, background:"var(--border-default)", borderRadius:22, overflow:"hidden", marginBottom:32 }}>
        {[
          { label:"Active Positions", val:"—", color:"#9b7fff" },
          { label:"Claimable Winnings", val:"—", color:"#00e5a0" },
          { label:"Markets Created", val:"—", color:"#06d6f0" },
        ].map((s,i)=>(
          <div key={i} style={{ background:"var(--bg-base)", padding:"36px 32px", textAlign:"center" }}>
            <p style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:40, fontWeight:800, color:s.color, letterSpacing:"-0.04em", marginBottom:8 }}>{s.val}</p>
            <p style={{ fontSize:11, color:"var(--text-muted)", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"'JetBrains Mono', monospace" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Positions */}
      <div style={{ background:"var(--bg-card)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:22, overflow:"hidden" }}>
        <div style={{ padding:"20px 28px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:16, letterSpacing:"-0.02em" }}>Your Positions</span>
          <span style={{ fontSize:10, color:"var(--text-muted)", padding:"4px 12px", borderRadius:99, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)", fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:"'JetBrains Mono', monospace" }}>On-chain</span>
        </div>
        <div style={{ padding:"64px 28px", textAlign:"center" }}>
          <p style={{ fontSize:40, opacity:0.2, marginBottom:20 }}>◈</p>
          <p style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:20, letterSpacing:"-0.02em", marginBottom:10 }}>No positions yet</p>
          <p style={{ fontSize:14, color:"var(--text-muted)", marginBottom:36, lineHeight:1.7 }}>Browse markets to place predictions or create your own oracle pipeline.</p>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <Link href="/markets" style={{ textDecoration:"none" }}>
              <button style={{ padding:"12px 28px", borderRadius:12, fontWeight:800, fontSize:13, color:"#0a0a0a", background:"var(--accent-blue)", border:"none", cursor:"pointer", fontFamily:"'Space Grotesk', sans-serif", boxShadow:"0 0 24px rgba(77,163,255,0.2)", transition:"all 0.2s ease" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(0)";}}
              >Browse Markets</button>
            </Link>
            <Link href="/create" style={{ textDecoration:"none" }}>
              <button style={{ padding:"12px 28px", borderRadius:12, fontWeight:700, fontSize:13, color:"rgba(255,255,255,0.6)", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", fontFamily:"'Inter', sans-serif", transition:"all 0.2s ease" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="var(--text-muted)";(e.currentTarget as HTMLElement).style.color="var(--text-primary)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="var(--border-strong)";(e.currentTarget as HTMLElement).style.color="rgba(255,255,255,0.6)";}}
              >Create Market</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
