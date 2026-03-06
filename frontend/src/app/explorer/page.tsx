"use client";
import { useReadContract } from "wagmi";
import { CONTRACTS, FACTORY_ABI } from "@/lib/contracts";

const CHAINS = [
  { name:"Base Sepolia",     selector:"10344971235874465080", icon:"🔵", status:"Active (Home)", color:"var(--accent-blue)", bg:"rgba(77,163,255,0.05)", border:"rgba(77,163,255,0.15)" },
  { name:"Ethereum Sepolia", selector:"16015286601757825753", icon:"⬡",  status:"CCIP Mirror",   color:"#06d6f0", bg:"rgba(6,214,240,0.05)", border:"rgba(6,214,240,0.15)" },
  { name:"Arbitrum Sepolia", selector:"3478487238524512106",  icon:"🔷", status:"Planned",        color:"#333",    bg:"rgba(51,51,51,0.04)", border:"rgba(51,51,51,0.12)" },
  { name:"Optimism Sepolia", selector:"5224473277236331295",  icon:"🔴", status:"Planned",        color:"#333",    bg:"rgba(51,51,51,0.04)", border:"rgba(51,51,51,0.12)" },
];
const SS: Record<string,{fg:string}> = {
  "Active (Home)":{fg:"#00e5a0"},
  "CCIP Mirror":{fg:"#06d6f0"},
  "Planned":{fg:"var(--text-muted)"},
};

export default function ExplorerPage() {
  const { data: nextMarketId } = useReadContract({ address:CONTRACTS.marketFactory, abi:FACTORY_ABI, functionName:"nextMarketId" });
  const totalMarkets = nextMarketId ? Number(nextMarketId) : 0;

  return (
    <div className="page-enter" style={{ paddingTop:48, paddingBottom:80 }}>
      <p style={{ fontSize:11, color:"var(--text-muted)", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"'JetBrains Mono', monospace", marginBottom:12 }}>Cross-Chain</p>
      <h1 style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:"clamp(28px, 4vw, 44px)", fontWeight:800, letterSpacing:"-0.03em", marginBottom:12 }}>Chain Explorer</h1>
      <p style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:56, lineHeight:1.7, maxWidth:500 }}>OmniOracle markets mirror across chains via Chainlink CCIP. Bet from any supported chain.</p>

      {/* CCIP Banner */}
      <div style={{ background:"var(--bg-card)", border:"1px solid rgba(6,214,240,0.15)", borderRadius:22, padding:"32px", marginBottom:32, position:"relative", overflow:"hidden", display:"flex", alignItems:"flex-start", gap:22 }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,#06d6f0,transparent)" }} />
        <div style={{ width:50, height:50, borderRadius:14, background:"rgba(6,214,240,0.08)", border:"1px solid rgba(6,214,240,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>⬡</div>
        <div>
          <p style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:18, color:"#06d6f0", letterSpacing:"-0.02em", marginBottom:10 }}>Chainlink CCIP Integration</p>
          <p style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.8 }}>
            Markets created on Base Sepolia are automatically mirrored to other chains via CCIP. Users on any supported chain can view markets and place cross-chain bets. Resolution results sync back to all participating chains.
          </p>
        </div>
      </div>

      {/* Chain Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px,1fr))", gap:10, marginBottom:48 }}>
        {CHAINS.map((chain,i)=>{
          const isActive = chain.status==="Active (Home)";
          const isMirror = chain.status==="CCIP Mirror";
          return (
            <div key={chain.name} style={{
              background:chain.bg, border:`1px solid ${chain.border}`,
              borderRadius:20, padding:"26px",
              opacity: chain.status==="Planned" ? 0.5 : 1,
              position:"relative", overflow:"hidden",
              transition:"all 0.3s ease",
            }}
              onMouseEnter={e=>{ if(chain.status!=="Planned") (e.currentTarget as HTMLElement).style.transform="translateY(-3px)"; }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform="translateY(0)"; }}
            >
              {isActive && <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${chain.color},transparent)` }} />}

              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{chain.icon}</div>
                  <div>
                    <p style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:14, letterSpacing:"-0.01em" }}>{chain.name}</p>
                    <p style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, color:"var(--text-muted)", marginTop:2 }}>{chain.selector.slice(0,12)}...</p>
                  </div>
                </div>
                <span style={{ fontSize:10, fontWeight:700, padding:"4px 10px", borderRadius:99, color:SS[chain.status]?.fg||"#555", background:(SS[chain.status]?.fg||"#555")+"12", border:`1px solid ${SS[chain.status]?.fg||"#555"}25`, fontFamily:"'JetBrains Mono', monospace", letterSpacing:"0.03em" }}>
                  {chain.status}
                </span>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  { label:"Markets", val: isActive ? String(totalMarkets) : "—", color: isActive?chain.color:"var(--text-muted)" },
                  { label:"Status",  val: isActive?"Live":isMirror?"Mirror":"Soon", color: isActive?"#00e5a0":isMirror?chain.color:"var(--text-muted)" },
                ].map(stat=>(
                  <div key={stat.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:12, padding:"16px", textAlign:"center" }}>
                    {isActive && stat.label==="Status" && <span style={{ width:6, height:6, borderRadius:"50%", background:"#00e5a0", boxShadow:"0 0 8px #00e5a0", display:"inline-block", marginBottom:6 }} className="dot-pulse" />}
                    <p style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:24, fontWeight:800, color:stat.color, letterSpacing:"-0.04em" }}>{stat.val}</p>
                    <p style={{ fontSize:10, color:"var(--text-muted)", marginTop:4, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'JetBrains Mono', monospace" }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* How it works */}
      <div style={{ background:"var(--bg-card)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:22, overflow:"hidden" }}>
        <div style={{ padding:"22px 28px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <h2 style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:20, letterSpacing:"-0.02em" }}>How Cross-Chain Markets Work</h2>
        </div>
        <div style={{ padding:"32px 28px", display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px,1fr))", gap:32 }}>
          {[
            { step:"1", title:"Mirror",         color:"#06d6f0", desc:"Market metadata is sent to other chains via CCIP. Users see markets on any chain." },
            { step:"2", title:"Bet Cross-Chain", color:"#9b7fff", desc:"Users on Ethereum Sepolia can bet on Base Sepolia markets. CCIP routes it to the home chain." },
            { step:"3", title:"Sync Results",   color:"#00e5a0", desc:"When a market resolves, the result syncs back to all chains where it was mirrored." },
          ].map(item=>(
            <div key={item.step} style={{ display:"flex", gap:16 }}>
              <div style={{ width:30, height:30, borderRadius:9, flexShrink:0, marginTop:2, background:item.color+"12", border:`1px solid ${item.color}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:item.color, fontFamily:"'Space Grotesk', sans-serif" }}>{item.step}</div>
              <div>
                <p style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:15, color:item.color, marginBottom:8, letterSpacing:"-0.01em" }}>{item.title}</p>
                <p style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.75 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
